import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isConfigured, supabaseKey, supabaseUrl } from '@/lib/supabase/config';
import { redirectUrl } from '@/lib/redirect-url';
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!isConfigured) return response;
  const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (entries) => {
        entries.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        entries.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const protectedPage = /^\/(dashboard|applications|statistics|profile)(\/|$)/.test(
    request.nextUrl.pathname,
  );
  if (!user && protectedPage) {
    const redirect = NextResponse.redirect(redirectUrl(request, '/login'));
    redirect.headers.set('Cache-Control', 'private, no-store');
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/applications/:path*',
    '/statistics/:path*',
    '/profile/:path*',
    '/api/:path*',
    '/auth/:path*',
    '/login',
    '/register',
  ],
};
