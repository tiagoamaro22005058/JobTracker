import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  connection: vi.fn(),
  access: vi.fn(),
  fetch: vi.fn(),
  flow: vi.fn(),
  clear: vi.fn(),
  write: vi.fn(),
  getToken: vi.fn(),
  revoke: vi.fn(),
}));
vi.mock('@/lib/api', () => ({ authenticatedClient: mocks.auth }));
vi.mock('@/lib/gmail', () => ({
  mailConfig: () => ({ origin: 'https://jobtrack.test' }),
  mailJson: (data: unknown, status = 200) => Response.json(data, { status }),
  mailFailure: () => Response.json({ error: 'Failed' }, { status: 502 }),
  mailConnection: mocks.connection,
  mailAccessToken: mocks.access,
  gmailFetch: mocks.fetch,
  readMailCookie: mocks.flow,
  clearMailCookie: mocks.clear,
  writeMailCookie: mocks.write,
  oauthClient: () => ({ getToken: mocks.getToken, revokeToken: mocks.revoke }),
  FLOW_COOKIE: 'flow',
  MAIL_COOKIE: 'mail',
  GMAIL_SCOPE: 'gmail.readonly',
}));
import { GET as list } from '@/app/api/mail/route';
import { GET as detail } from '@/app/api/mail/[id]/route';
import { GET as callback } from '@/app/api/mail/callback/route';
import { POST as disconnect } from '@/app/api/mail/disconnect/route';
beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: 'user-one' } });
});
it('blocks unauthenticated inbox and message requests before reading connection tokens', async () => {
  mocks.auth.mockResolvedValue({ error: Response.json({}, { status: 401 }) });
  expect((await list(new Request('https://jobtrack.test/api/mail'))).status).toBe(401);
  expect(
    (
      await detail(new Request('https://jobtrack.test/api/mail/abc'), {
        params: Promise.resolve({ id: 'abc' }),
      })
    ).status,
  ).toBe(401);
  expect(mocks.connection).not.toHaveBeenCalled();
});
it('returns a disconnected state without calling Gmail when no connection belongs to the user', async () => {
  mocks.connection.mockResolvedValue(null);
  expect(await (await list(new Request('https://jobtrack.test/api/mail'))).json()).toEqual({
    configured: true,
    connected: false,
  });
  expect(mocks.connection).toHaveBeenCalledWith('user-one');
  expect(mocks.fetch).not.toHaveBeenCalled();
});
it('rejects an OAuth callback for another user, stale state, or mismatched state', async () => {
  for (const flow of [
    { userId: 'other-user', state: 'good', expires: Date.now() + 60000 },
    { userId: 'user-one', state: 'bad', expires: Date.now() + 60000 },
    { userId: 'user-one', state: 'good', expires: 1 },
  ]) {
    mocks.flow.mockResolvedValue(flow);
    const result = await callback(
      new Request('https://jobtrack.test/api/mail/callback?state=good&code=test'),
    );
    expect(result.headers.get('location')).toContain('connection=expired');
  }
  expect(mocks.getToken).not.toHaveBeenCalled();
  expect(mocks.write).not.toHaveBeenCalled();
});
it('handles denied consent without exchanging tokens', async () => {
  mocks.flow.mockResolvedValue({ userId: 'user-one', state: 'good', expires: Date.now() + 60000 });
  expect(
    (
      await callback(
        new Request('https://jobtrack.test/api/mail/callback?state=good&error=access_denied'),
      )
    ).headers.get('location'),
  ).toContain('connection=cancelled');
  expect(mocks.getToken).not.toHaveBeenCalled();
});
it('binds successful connections to the authenticated user and never puts tokens in the redirect', async () => {
  mocks.flow.mockResolvedValue({
    userId: 'user-one',
    state: 'good',
    verifier: 'verifier',
    expires: Date.now() + 60000,
  });
  mocks.getToken.mockResolvedValue({
    tokens: {
      scope: 'gmail.readonly',
      refresh_token: 'refresh-secret',
      access_token: 'access-secret',
    },
  });
  mocks.fetch.mockResolvedValue({ emailAddress: 'person@example.com' });
  const result = await callback(
    new Request('https://jobtrack.test/api/mail/callback?state=good&code=authorization'),
  );
  expect(result.headers.get('location')).toBe('https://jobtrack.test/emails?connection=success');
  expect(mocks.getToken).toHaveBeenCalledWith({ code: 'authorization', codeVerifier: 'verifier' });
  expect(mocks.write).toHaveBeenCalledWith(
    'mail',
    expect.objectContaining({ userId: 'user-one', refreshToken: 'refresh-secret' }),
    expect.any(Number),
  );
});
it('loads an empty inbox and passes pagination tokens as encoded values', async () => {
  mocks.connection.mockResolvedValue({ email: 'person@example.com' });
  mocks.access.mockResolvedValue('token');
  mocks.fetch.mockResolvedValue({});
  const result = await list(
    new Request('https://jobtrack.test/api/mail?page=abc%26labelIds%3DSENT'),
  );
  expect((await result.json()).messages).toEqual([]);
  expect(mocks.fetch.mock.calls[0][0]).toContain('pageToken=abc%26labelIds%3DSENT');
});
it('rejects invalid message IDs before contacting Gmail', async () => {
  expect(
    (
      await detail(new Request('https://jobtrack.test/api/mail/invalid'), {
        params: Promise.resolve({ id: '../profile' }),
      })
    ).status,
  ).toBe(400);
  expect(mocks.fetch).not.toHaveBeenCalled();
});
it('rejects cross-origin disconnects and still clears local cookies if revocation fails', async () => {
  expect(
    (
      await disconnect(
        new Request('https://jobtrack.test/api/mail/disconnect', {
          method: 'POST',
          headers: { origin: 'https://evil.test' },
        }),
      )
    ).status,
  ).toBe(403);
  expect(mocks.clear).not.toHaveBeenCalled();
  mocks.connection.mockResolvedValue({ refreshToken: 'secret' });
  mocks.revoke.mockRejectedValue(new Error('offline'));
  expect(
    await (
      await disconnect(
        new Request('https://jobtrack.test/api/mail/disconnect', {
          method: 'POST',
          headers: { origin: 'https://jobtrack.test' },
        }),
      )
    ).json(),
  ).toEqual({ disconnected: true, revoked: false });
  expect(mocks.clear).toHaveBeenCalledTimes(2);
});
