import { expect, it } from 'vitest';
import { htmlMailBody, sanitizeMailHtml } from '@/lib/mail-html';

it('finds HTML in nested MIME alternatives without using attached HTML files', () => {
  const encode = (s: string) => ({ data: Buffer.from(s).toString('base64url') });
  expect(
    htmlMailBody({
      parts: [
        { filename: 'attachment.html', mimeType: 'text/html', body: encode('attachment') },
        {
          parts: [
            { mimeType: 'text/plain', body: encode('plain') },
            { mimeType: 'text/html', body: encode('<p>Formatted message</p>') },
          ],
        },
      ],
    }),
  ).toBe('<p>Formatted message</p>');
  expect(htmlMailBody({ mimeType: 'text/plain', body: encode('plain') })).toBe('');
});
it('keeps email tables, typography, and labelled links', () => {
  const html = sanitizeMailHtml(
    '<table width="600"><tr><td style="padding:20px;color:#333333;font-size:16px"><a href="https://example.com/job?tracking=long">View job</a><img src="https://example.com/logo.png" alt="Company" width="40"></td></tr></table>',
  );
  expect(html).toContain('<table width="600">');
  expect(html).toContain('padding:20px');
  expect(html).toContain('>View job</a>');
  expect(html).toContain('target="_blank"');
  expect(html).toContain('rel="noopener noreferrer"');
});
it('removes scripts, active embeds, forms, event handlers, and injected document policies', () => {
  const html = sanitizeMailHtml(
    '<script>alert(1)</script><iframe srcdoc="bad"></iframe><object data="bad"></object><form action="https://evil.test"><input></form><base href="https://evil.test"><meta http-equiv="refresh" content="0;url=https://evil.test"><img src="https://example.com/a" onerror="alert(1)"><a href="javascript:alert(1)">bad</a>',
  );
  expect(html).not.toMatch(/script|iframe|object|form|input|<base|<meta|onerror|javascript:/i);
});
it('blocks CSS network requests and hostile links even when disguised', () => {
  const html = sanitizeMailHtml(
    '<style>@import "https://evil.test";</style><p style="background-image:url(https://evil.test);position:fixed;color:red">Hello</p><a href="/api/mail/disconnect">relative</a><img src="//evil.test/pixel"><a href="jav&#x61;script:alert(1)">encoded</a>',
  );
  expect(html).not.toMatch(/@import|url\(|position|javascript:|\/api\/mail|evil\.test/);
  expect(html).toContain('color:red');
});
