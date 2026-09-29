import { authenticatedClient } from '@/lib/api';
import {
  clearMailCookie,
  FLOW_COOKIE,
  mailConfig,
  mailConnection,
  mailJson,
  oauthClient,
} from '@/lib/gmail';
import { sameMailOrigin } from '@/lib/mail-security';

export async function POST(request: Request) {
  const auth = await authenticatedClient();
  if (auth.error) return auth.error;
  const config = mailConfig();
  if (!sameMailOrigin(request, config?.origin || new URL(request.url).origin))
    return mailJson({ error: 'Invalid request origin.' }, 403);
  const connection = await mailConnection(auth.user.id);
  await clearMailCookie();
  await clearMailCookie(FLOW_COOKIE);
  let revoked = true;
  if (connection) {
    try {
      await oauthClient().revokeToken(connection.refreshToken);
    } catch {
      revoked = false;
    }
  }
  return mailJson({ disconnected: true, revoked });
}
