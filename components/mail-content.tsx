'use client';
import { useState } from 'react';
import { useTheme } from 'next-themes';

export function MailContent({ html, text }: { html?: string; text?: string }) {
  const [images, setImages] = useState(true);
  const [plain, setPlain] = useState(false);
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === 'dark';
  if (!html)
    return (
      <pre className="mail-body">
        {text || 'This message has no displayable body. Open it in Gmail to view attachments.'}
      </pre>
    );
  const document = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src ${images ? 'https:' : "'none'"}; font-src 'none'; connect-src 'none'; frame-src 'none'; media-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"><style>html{color-scheme:${dark ? 'dark' : 'light'}}body{margin:0;padding:24px 16px;background:${dark ? '#191c1b' : '#ffffff'};color:${dark ? '#e7ece9' : '#25322f'};font:14px/1.6 Arial,sans-serif;overflow-wrap:anywhere}body>table,body>div{margin-left:auto;margin-right:auto}img{max-width:100%;object-fit:contain}table{max-width:100%}a{color:${dark ? '#8ab4f8' : '#1769c2'}}pre{white-space:pre-wrap}@media(max-width:600px){body{padding:16px 8px}table{width:100%!important}td{overflow-wrap:anywhere}}</style></head><body>${html}</body></html>`;
  return (
    <div className="mail-content">
      <div className="mail-content-options">
        <span>
          {images ? 'External images are displayed.' : 'External images are hidden for privacy.'}
        </span>
        <div>
          <button className="text-link" onClick={() => setImages(!images)}>
            {images ? 'Hide images' : 'Show images'}
          </button>
          {text && (
            <button className="text-link" onClick={() => setPlain(!plain)}>
              {plain ? 'Formatted email' : 'Plain text'}
            </button>
          )}
        </div>
      </div>
      {plain ? (
        <pre className="mail-body">{text}</pre>
      ) : (
        <iframe
          className="mail-html-frame"
          title="Email message content"
          sandbox="allow-popups allow-popups-to-escape-sandbox"
          referrerPolicy="no-referrer"
          srcDoc={document}
        />
      )}
    </div>
  );
}
