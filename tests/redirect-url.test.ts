import { expect, it } from 'vitest';
import { redirectUrl } from '@/lib/redirect-url';

it('keeps auth redirects on the browser host so session cookies remain available', () => {
  const request = new Request('http://localhost:3000/auth/callback?code=private-code', {
    headers: { host: '127.0.0.1:3000' },
  });
  expect(redirectUrl(request, '/dashboard').href).toBe('http://127.0.0.1:3000/dashboard');
});

it('clears auth query parameters and retains HTTPS on production redirects', () => {
  const request = new Request(
    'https://jobtrack.example/auth/callback?next=https://evil.example&code=private',
  );
  expect(redirectUrl(request, '/login').href).toBe('https://jobtrack.example/login');
});
