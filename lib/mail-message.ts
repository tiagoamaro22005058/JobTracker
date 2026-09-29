export type GmailPart = {
  mimeType?: string;
  filename?: string;
  body?: { data?: string };
  headers?: { name: string; value: string }[];
  parts?: GmailPart[];
};
export type GmailMessage = {
  id: string;
  snippet?: string;
  labelIds?: string[];
  payload?: GmailPart;
};
export function mailSummary(message: GmailMessage) {
  const header = (name: string) =>
    message.payload?.headers?.find((h) => h.name.toLowerCase() === name)?.value || '';
  return {
    id: message.id,
    subject: header('subject') || '(No subject)',
    from: header('from'),
    date: header('date'),
    unread: message.labelIds?.includes('UNREAD') || false,
  };
}
export function plainMailBody(part?: GmailPart): string {
  if (!part || part.filename) return '';
  if (part.mimeType === 'text/plain' && part.body?.data)
    return Buffer.from(part.body.data, 'base64url').toString('utf8');
  return (part.parts || []).map(plainMailBody).filter(Boolean).join('\n\n');
}
