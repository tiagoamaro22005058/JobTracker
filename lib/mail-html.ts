import sanitizeHtml from 'sanitize-html';
import type { GmailPart } from './mail-message';

export function htmlMailBody(part?: GmailPart): string {
  if (!part || part.filename) return '';
  if (part.mimeType === 'text/html' && part.body?.data)
    return Buffer.from(part.body.data, 'base64url').toString('utf8');
  return (part.parts || []).map(htmlMailBody).find(Boolean) || '';
}

// Email markup is untrusted. Only inert formatting survives; the browser also
// isolates the result in a sandboxed, opaque-origin iframe with a strict CSP.
export function sanitizeMailHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags: [
      'div',
      'span',
      'p',
      'br',
      'hr',
      'a',
      'img',
      'table',
      'thead',
      'tbody',
      'tfoot',
      'tr',
      'td',
      'th',
      'caption',
      'colgroup',
      'col',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'b',
      'strong',
      'i',
      'em',
      'u',
      's',
      'small',
      'blockquote',
      'pre',
      'code',
      'ul',
      'ol',
      'li',
      'center',
      'font',
      'sup',
      'sub',
    ],
    allowedAttributes: {
      '*': ['style', 'title', 'dir', 'lang'],
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height'],
      table: ['width', 'align', 'cellpadding', 'cellspacing', 'border', 'bgcolor'],
      td: ['width', 'height', 'align', 'valign', 'colspan', 'rowspan', 'bgcolor'],
      th: ['width', 'height', 'align', 'valign', 'colspan', 'rowspan', 'bgcolor'],
      font: ['color', 'face', 'size'],
      col: ['width', 'span'],
    },
    allowedSchemes: ['https', 'http', 'mailto'],
    allowedSchemesByTag: { img: ['https'] },
    allowProtocolRelative: false,
    allowedStyles: {
      '*': {
        color: [/^(#[a-f\d]{3,8}|[a-z]+|rgba?\([\d\s.,%]+\))$/i],
        'background-color': [/^(#[a-f\d]{3,8}|[a-z]+|rgba?\([\d\s.,%]+\))$/i],
        'font-family': [/^[\w\s,'"-]+$/],
        'font-size': [/^[\d.]+(px|pt|em|rem|%)$/],
        'font-weight': [/^(normal|bold|[1-9]00)$/],
        'font-style': [/^(normal|italic)$/],
        'text-align': [/^(left|right|center|justify)$/],
        'text-decoration': [/^(none|underline|line-through)$/],
        'line-height': [/^[\d.]+(px|pt|em|rem|%)?$/],
        width: [/^(auto|[\d.]+(px|%))$/],
        'max-width': [/^[\d.]+(px|%)$/],
        height: [/^(auto|[\d.]+px)$/],
        padding: [/^[\d.\s]+(px|em|%)?(\s+[\d.]+(px|em|%)?){0,3}$/],
        margin: [/^(auto|0|[\d.]+(px|em|%))(\s+(auto|0|[\d.]+(px|em|%))){0,3}$/],
        border: [/^[\d.]+px\s+(solid|dashed|dotted)\s+(#[a-f\d]{3,8}|[a-z]+)$/i],
        'border-radius': [/^[\d.]+(px|%)$/],
        'border-collapse': [/^(collapse|separate)$/],
        'vertical-align': [/^(top|middle|bottom|baseline)$/],
        display: [/^(none|block|inline|inline-block|table|table-row|table-cell)$/],
      },
    },
    transformTags: {
      a: (_tag, attrs) => ({
        tagName: 'a',
        attribs: {
          ...attrs,
          href: /^(https?:\/\/|mailto:)/i.test(attrs.href || '') ? attrs.href : '',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      img: (_tag, attrs) => ({
        tagName: 'img',
        attribs: { ...attrs, src: /^https:\/\//i.test(attrs.src || '') ? attrs.src : '' },
      }),
    },
  });
}
