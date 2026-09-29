import { randomBytes } from 'node:crypto';
import { CodeChallengeMethod } from 'google-auth-library';
import { authenticatedClient } from '@/lib/api';
import {
  FLOW_COOKIE,
  GMAIL_SCOPE,
  mailConfig,
  mailJson,
  oauthClient,
  writeMailCookie,
} from '@/lib/gmail';
import { sameMailOrigin } from '@/lib/mail-security';

export async function POST(request: Request) {
  const auth = await authenticatedClient();
  if (auth.error) return auth.error;
  const config = mailConfig();
  if (!config) return mailJson({ error: 'Gmail setup is not complete yet.' }, 503);
  if (!sameMailOrigin(request, config.origin))
    return mailJson({ error: 'Invalid request origin.' }, 403);
  const client = oauthClient();
  const { codeVerifier, codeChallenge } = await client.generateCodeVerifierAsync();
  const state = randomBytes(32).toString('hex');
  await writeMailCookie(
    FLOW_COOKIE,
    { userId: auth.user.id, state, verifier: codeVerifier, expires: Date.now() + 600000 },
    600,
  );
  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: [GMAIL_SCOPE],
    prompt: 'consent select_account',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: CodeChallengeMethod.S256,
  });
  return mailJson({ url });
}
