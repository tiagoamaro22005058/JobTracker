/** Preserve the browser's host (including localhost vs 127.0.0.1) for auth cookies. */
export function redirectUrl(request: Request, pathname: string): URL {
  const url = new URL(request.url);
  const host = request.headers.get('host');
  if (host) url.host = host;
  url.pathname = pathname;
  url.search = '';
  url.hash = '';
  return url;
}
