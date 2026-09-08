import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="standalone-state">
      <span className="eyebrow">404</span>
      <h1>This opportunity took a different turn.</h1>
      <p>We couldn’t find that page.</p>
      <Link href="/dashboard" className="button primary">
        Back to dashboard
      </Link>
    </main>
  );
}
