import { NextResponse } from 'next/server';
import { authenticatedClient } from '@/lib/api';
import {
  clearMailCookie,
  FLOW_COOKIE,
  GMAIL_SCOPE,
  gmailFetch,
  MAIL_COOKIE,
  mailConfig,
  mailJson,
  oauthClient,
  readMailCookie,
  writeMailCookie,
  type MailFlow,
} from '@/lib/gmail';

export async function GET(request: Request) {
  const config = mailConfig();
  if (!config) return mailJson({ error: 'Gmail setup is not complete yet.' }, 503);
  const finish = (result: string) => {
    const response = NextResponse.redirect(`${config.origin}/emails?connection=${result}`);
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set('Referrer-Policy', 'no-referrer');
    return response;
  };
  const flow = await readMailCookie<MailFlow>(FLOW_COOKIE);
  await clearMailCookie(FLOW_COOKIE);
  const auth = await authenticatedClient();
  const query = new URL(request.url).searchParams;
  if (
    auth.error ||
    !flow ||
    flow.userId !== auth.user.id ||
    flow.expires <= Date.now() ||
    flow.state !== query.get('state')
  )
    return finish('expired');
  if (query.has('error')) return finish('cancelled');
  const code = query.get('code');
  if (!code) return finish('failed');
  try {
    const { tokens } = await oauthClient().getToken({ code, codeVerifier: flow.verifier });
    if (
      !tokens.scope?.split(' ').includes(GMAIL_SCOPE) ||
      !tokens.refresh_token ||
      !tokens.access_token
    )
      return finish('permission');
    const profile = await gmailFetch<{ emailAddress: string }>('profile', tokens.access_token);
    const maxAge = 60 * 60 * 24 * 30;
    await writeMailCookie(
      MAIL_COOKIE,
      {
        userId: auth.user.id,
        refreshToken: tokens.refresh_token,
        email: profile.emailAddress,
        expires: Date.now() + maxAge * 1000,
      },
      maxAge,
    );
    return finish('success');
  } catch {
    return finish('failed');
  }
}
