import Link from 'next/link';
export default function AuthError() {
  return (
    <main className="standalone-state">
      <h1>We couldn’t complete this sign-in.</h1>
      <p>
        The link may have expired or already been used. Your email may already be confirmed, so try
        signing in with your email and password. If it isn’t confirmed yet, open the latest
        confirmation email.
      </p>
      <Link className="button primary" href="/login">
        Back to sign in
      </Link>
    </main>
  );
}
