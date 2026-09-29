import { expect, it } from 'vitest';
import { openMailCookie, sealMailCookie, sameMailOrigin } from '@/lib/mail-security';
import { mailSummary, plainMailBody } from '@/lib/mail-message';
const secret = 'ab'.repeat(32);
it('encrypts mail tokens and rejects tampering, wrong keys, and cookie substitution', () => {
  const value = { refreshToken: 'private-token', userId: 'user-one' };
  const sealed = sealMailCookie(value, secret, 'connection');
  expect(sealed).not.toContain('private-token');
  expect(openMailCookie(sealed, secret, 'connection')).toEqual(value);
  const bytes = Buffer.from(sealed, 'base64url');
  bytes[30] ^= 1;
  expect(openMailCookie(bytes.toString('base64url'), secret, 'connection')).toBeNull();
  expect(openMailCookie(sealed, 'cd'.repeat(32), 'connection')).toBeNull();
  expect(openMailCookie(sealed, secret, 'oauth-flow')).toBeNull();
  expect(openMailCookie('invalid', secret, 'connection')).toBeNull();
});
it('uses a fresh encryption nonce and rejects weak encryption keys', () => {
  expect(sealMailCookie({}, secret, 'connection')).not.toBe(
    sealMailCookie({}, secret, 'connection'),
  );
  expect(() => sealMailCookie({}, 'weak', 'connection')).toThrow();
});
it('rejects cross-site and absent origins on connection mutations', () => {
  expect(
    sameMailOrigin(
      new Request('https://jobtrack.test', { headers: { origin: 'https://evil.test' } }),
      'https://jobtrack.test',
    ),
  ).toBe(false);
  expect(sameMailOrigin(new Request('https://jobtrack.test'), 'https://jobtrack.test')).toBe(false);
  expect(
    sameMailOrigin(
      new Request('https://jobtrack.test', { headers: { origin: 'https://jobtrack.test' } }),
      'https://jobtrack.test',
    ),
  ).toBe(true);
});
it('extracts nested plain text without including HTML, attachments, or tracking images', () => {
  const data = Buffer.from('Hello, Tiago — interview tomorrow!').toString('base64url');
  expect(
    plainMailBody({
      mimeType: 'multipart/mixed',
      parts: [
        {
          mimeType: 'multipart/alternative',
          parts: [
            {
              mimeType: 'text/html',
              body: { data: Buffer.from('<script>bad()</script>').toString('base64url') },
            },
            { mimeType: 'text/plain', body: { data } },
          ],
        },
        {
          filename: 'attachment.txt',
          mimeType: 'text/plain',
          body: { data: Buffer.from('private attachment').toString('base64url') },
        },
      ],
    }),
  ).toBe('Hello, Tiago — interview tomorrow!');
  expect(plainMailBody({ mimeType: 'text/html' })).toBe('');
});
it('handles missing headers and reads mixed-case headers without returning the raw payload', () => {
  expect(mailSummary({ id: '123' }).subject).toBe('(No subject)');
  expect(
    mailSummary({
      id: '123',
      labelIds: ['UNREAD'],
      payload: {
        headers: [
          { name: 'Subject', value: 'Interview' },
          { name: 'FROM', value: 'Hiring' },
        ],
      },
    }),
  ).toEqual({ id: '123', subject: 'Interview', from: 'Hiring', date: '', unread: true });
});
