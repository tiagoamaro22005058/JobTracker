'use client';
import Link from 'next/link';
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="standalone-state">
      <h1>Something went wrong.</h1>
      <p>Try again, or return to sign in to refresh your session.</p>
      <button className="button primary" onClick={reset}>
        Try again
      </button>
      <Link className="button secondary" href="/login">
        Back to sign in
      </Link>
    </main>
  );
}
