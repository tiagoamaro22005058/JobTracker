import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isConfigured } from '@/lib/supabase/config';
import { redirectUrl } from '@/lib/redirect-url';
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  function finish(path: string, notice?: string) {
    const destination = redirectUrl(request, path);
    if (notice) destination.searchParams.set('notice', notice);
    const response = NextResponse.redirect(destination, 303);
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  }

  if (!isConfigured) return finish('/login');
  const supabase = await createClient();
  const providerError = url.searchParams.has('error') || url.searchParams.has('error_code');

  try {
    if (code && !providerError) {
      const flowId = url.searchParams.get('sb_flow_id');
      const { data, error } = await supabase.auth.exchangeCodeForSession(
        code,
        flowId ? { flowId } : undefined,
      );
      if (!error && data.session) return finish('/dashboard');
    }

    // A callback can be revisited after its single-use code has already been exchanged.
    // Validate the existing session rather than showing a false confirmation failure.
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (!error && user) return finish('/dashboard');
  } catch {
    // A session exchange/network failure does not tell us whether email verification failed.
    return finish('/login', 'confirmation');
  }

  if (providerError) return finish('/auth/error');

  // Supabase verifies the email before redirecting here. Its subsequent PKCE session
  // exchange can fail when the email opens in another browser without the verifier cookie.
  // Do not claim success or failure from URL parameters; password sign-in verifies access.
  return finish('/login', 'confirmation');
}
