import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

function key(secret: string) {
  if (!/^[a-f\d]{64}$/i.test(secret)) throw new Error('Invalid mail encryption key');
  return Buffer.from(secret, 'hex');
}

export function sealMailCookie(value: object, secret: string, purpose: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(secret), iv);
  cipher.setAAD(Buffer.from(purpose));
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url');
}

export function openMailCookie<T>(value: string, secret: string, purpose: string): T | null {
  try {
    const bytes = Buffer.from(value, 'base64url');
    const decipher = createDecipheriv('aes-256-gcm', key(secret), bytes.subarray(0, 12));
    decipher.setAuthTag(bytes.subarray(12, 28));
    decipher.setAAD(Buffer.from(purpose));
    return JSON.parse(
      Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString('utf8'),
    ) as T;
  } catch {
    return null;
  }
}

export function sameMailOrigin(request: Request, origin: string) {
  return request.headers.get('origin') === origin;
}
