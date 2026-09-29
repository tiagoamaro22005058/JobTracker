import { authenticatedClient } from '@/lib/api';
import {
  gmailFetch,
  mailAccessToken,
  mailConfig,
  mailConnection,
  mailFailure,
  mailJson,
} from '@/lib/gmail';
import { mailSummary, type GmailMessage } from '@/lib/mail-message';

export async function GET(request: Request) {
  const auth = await authenticatedClient();
  if (auth.error) return auth.error;
  if (!mailConfig()) return mailJson({ configured: false, connected: false });
  const connection = await mailConnection(auth.user.id);
  if (!connection) return mailJson({ configured: true, connected: false });
  const query = new URL(request.url).searchParams;
  const page = query.get('page') || '';
  if (page.length > 2048) return mailJson({ error: 'Invalid page.' }, 400);
  try {
    const token = await mailAccessToken(connection);
    const params = new URLSearchParams({ maxResults: '15', labelIds: 'INBOX' });
    if (page) params.set('pageToken', page);
    const list = await gmailFetch<{ messages?: { id: string }[]; nextPageToken?: string }>(
      `messages?${params}`,
      token,
    );
    const messages = await Promise.all(
      (list.messages || []).map(async ({ id }) =>
        mailSummary(
          await gmailFetch<GmailMessage>(
            `messages/${encodeURIComponent(id)}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
            token,
          ),
        ),
      ),
    );
    return mailJson({
      configured: true,
      connected: true,
      email: connection.email,
      messages,
      nextPage: list.nextPageToken || null,
    });
  } catch (error) {
    return mailFailure(error);
  }
}
