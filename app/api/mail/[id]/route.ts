import { authenticatedClient } from '@/lib/api';
import { gmailFetch, mailAccessToken, mailConnection, mailFailure, mailJson } from '@/lib/gmail';
import { mailSummary, plainMailBody, type GmailMessage } from '@/lib/mail-message';
import { htmlMailBody, sanitizeMailHtml } from '@/lib/mail-html';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticatedClient();
  if (auth.error) return auth.error;
  const { id } = await params;
  if (!/^[a-f\d]+$/i.test(id) || id.length > 64) return mailJson({ error: 'Invalid email.' }, 400);
  const connection = await mailConnection(auth.user.id);
  if (!connection) return mailJson({ error: 'Connect Gmail to read your emails.' }, 409);
  try {
    const token = await mailAccessToken(connection);
    const message = await gmailFetch<GmailMessage>(`messages/${id}?format=full`, token);
    return mailJson({
      ...mailSummary(message),
      body: plainMailBody(message.payload),
      html: sanitizeMailHtml(htmlMailBody(message.payload)),
    });
  } catch (error) {
    return mailFailure(error);
  }
}
