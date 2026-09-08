import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/auth/callback/route';

const auth = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  getUser: vi.fn(),
}));
vi.mock('@/lib/supabase/config', () => ({ isConfigured: true }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth }) }));

function callback(query = '') {
  return GET(
    new Request(`http://localhost:3000/auth/callback${query}`, {
      headers: { host: '127.0.0.1:3000' },
    }),
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  auth.exchangeCodeForSession.mockResolvedValue({
    data: { session: null },
    error: { code: 'pkce_code_verifier_not_found' },
  });
  auth.getUser.mockResolvedValue({ data: { user: null }, error: { code: 'session_not_found' } });
});

describe('Email confirmation callback', () => {
  it('opens the dashboard after a successful code exchange', async () => {
    auth.exchangeCodeForSession.mockResolvedValue({
      data: { session: { access_token: 'test' } },
      error: null,
    });
    const response = await callback('?code=single-use-code');
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('http://127.0.0.1:3000/dashboard');
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });

  it('offers password sign-in when the confirmation opens without the original browser verifier', async () => {
    const response = await callback('?code=confirmed-but-no-verifier');
    expect(response.headers.get('location')).toBe(
      'http://127.0.0.1:3000/login?notice=confirmation',
    );
    expect(response.headers.get('location')).not.toContain('confirmed-but-no-verifier');
  });

  it.each(['bad_code_verifier', 'flow_state_expired', 'flow_state_not_found'])(
    'does not equate session exchange error %s with failed email confirmation',
    async (code) => {
      auth.exchangeCodeForSession.mockResolvedValue({ data: { session: null }, error: { code } });
      const response = await callback('?code=old-code');
      expect(response.headers.get('location')).toContain('/login?notice=confirmation');
    },
  );

  it('reuses an existing validated session when a single-use callback is revisited', async () => {
    auth.getUser.mockResolvedValue({ data: { user: { id: 'current-user' } }, error: null });
    const response = await callback('?code=already-exchanged');
    expect(auth.getUser).toHaveBeenCalledOnce();
    expect(response.headers.get('location')).toBe('http://127.0.0.1:3000/dashboard');
  });

  it('does not send a signed-out visitor with no callback code to an error page', async () => {
    const response = await callback();
    expect(auth.exchangeCodeForSession).not.toHaveBeenCalled();
    expect(response.headers.get('location')).toContain('/login?notice=confirmation');
  });

  it('retains a recovery path for an explicit provider error without echoing its contents', async () => {
    const response = await callback(
      '?error=access_denied&error_code=otp_expired&error_description=untrusted',
    );
    expect(auth.exchangeCodeForSession).not.toHaveBeenCalled();
    expect(response.headers.get('location')).toBe('http://127.0.0.1:3000/auth/error');
  });

  it('falls back safely on a network failure without claiming confirmation failed', async () => {
    auth.exchangeCodeForSession.mockRejectedValue(new Error('Network unavailable'));
    const response = await callback('?code=some-code');
    expect(response.headers.get('location')).toContain('/login?notice=confirmation');
  });

  it('passes a flow ID to the SDK when supplied and never trusts a next destination', async () => {
    const flowId = 'abcdef0123456789';
    const response = await callback(
      `?code=some-code&sb_flow_id=${flowId}&next=https://outside.example`,
    );
    expect(auth.exchangeCodeForSession).toHaveBeenCalledWith('some-code', { flowId });
    expect(response.headers.get('location')).toBe(
      'http://127.0.0.1:3000/login?notice=confirmation',
    );
  });

  it('requires a valid session, not just an error-free exchange response', async () => {
    auth.exchangeCodeForSession.mockResolvedValue({ data: { session: null }, error: null });
    const response = await callback('?code=some-code');
    expect(response.headers.get('location')).toContain('/login?notice=confirmation');
  });
});
