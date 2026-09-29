import 'server-only';
import { cookies } from 'next/headers';
import { OAuth2Client } from 'google-auth-library';
import { openMailCookie, sealMailCookie } from './mail-security';

export const MAIL_COOKIE = 'jobtrack-gmail';
export const FLOW_COOKIE = 'jobtrack-gmail-flow';
export const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';
export const mailCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api/mail',
};
export type MailConnection = {
  userId: string;
  refreshToken: string;
  email: string;
  expires: number;
};
export type MailFlow = { userId: string; state: string; verifier: string; expires: number };
export function mailConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const secret = process.env.MAIL_ENCRYPTION_KEY || '';
  const origin = process.env.MAIL_APP_ORIGIN;
  if (!clientId || !clientSecret || !/^[a-f\d]{64}$/i.test(secret) || !origin) return null;
  try {
    const url = new URL(origin);
    if (
      url.origin !== origin ||
      (url.protocol !== 'https:' &&
        !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)))
    )
      return null;
    return { clientId, clientSecret, secret, origin, redirectUri: `${origin}/api/mail/callback` };
  } catch {
    return null;
  }
}
export function oauthClient() {
  const config = mailConfig();
  if (!config) throw new Error('Gmail is not configured');
  return new OAuth2Client({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    redirectUri: config.redirectUri,
    transporterOptions: { timeout: 15000, retry: false },
  });
}
export async function readMailCookie<T>(name: string): Promise<T | null> {
  const config = mailConfig();
  const value = (await cookies()).get(name)?.value;
  return config && value ? openMailCookie<T>(value, config.secret, name) : null;
}
export async function writeMailCookie(name: string, value: object, maxAge: number) {
  const sealed = sealMailCookie(value, mailConfig()!.secret, name);
  if (sealed.length > 3800) throw new Error('Mail session is too large');
  (await cookies()).set(name, sealed, { ...mailCookieOptions, maxAge });
}
export async function clearMailCookie(name = MAIL_COOKIE) {
  (await cookies()).set(name, '', { ...mailCookieOptions, maxAge: 0 });
}
export async function mailConnection(userId: string) {
  const connection = await readMailCookie<MailConnection>(MAIL_COOKIE);
  return connection?.userId === userId && connection.expires > Date.now() && connection.refreshToken
    ? connection
    : null;
}
export class MailError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function mailAccessToken(connection: MailConnection) {
  const client = oauthClient();
  client.setCredentials({ refresh_token: connection.refreshToken });
  try {
    const { token } = await client.getAccessToken();
    if (!token) throw new Error('Missing token');
    return token;
  } catch (error) {
    const code = (error as { response?: { data?: { error?: string } } }).response?.data?.error;
    if (code === 'invalid_grant') {
      await clearMailCookie();
      throw new MailError(409, 'Your Gmail connection expired. Please connect again.');
    }
    throw new MailError(502, 'Gmail is temporarily unavailable. Try again shortly.');
  }
}
export async function gmailFetch<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok)
    throw new MailError(
      response.status === 404 ? 404 : 502,
      response.status === 404
        ? 'This email is no longer available.'
        : 'Could not load Gmail. Try refreshing, or reconnect your account.',
    );
  return response.json();
}
export function mailJson(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });
}
export function mailFailure(error: unknown) {
  return mailJson(
    {
      error: error instanceof MailError ? error.message : 'Could not load Gmail. Please try again.',
    },
    error instanceof MailError ? error.status : 502,
  );
}
