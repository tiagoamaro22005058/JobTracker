'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Logo } from './logo';
export function AuthForm({
  register = false,
  configured,
  confirmationReturn = false,
}: {
  register?: boolean;
  configured: boolean;
  confirmationReturn?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [showPassword, setShowPassword] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setPending(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email')).trim(),
      password = String(form.get('password'));
    try {
      const client = createClient();
      if (register) {
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: String(form.get('name')).trim() },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        if (!data.session) {
          setMessage('Check your email to confirm your account, then sign in.');
          return;
        }
      } else {
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      router.replace('/dashboard');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to sign in. Please try again.');
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="auth-layout">
      <section className="auth-story">
        <Link href="/">
          <Logo />
        </Link>
        <div className="auth-story-content">
          <span className="eyebrow">JOBTRACK · PERSONAL WORKSPACE</span>
          <h1>
            Your job search.
            <br />
            All systems go.
          </h1>
          <p>
            Your applications, interviews, and next big move.
            <br />
            All in one place.
          </p>
          <div className="auth-preview">
            <div className="auth-preview-header">
              <span className="preview-dot" />
              Your job search, in focus<span>↗</span>
            </div>
            {[
              ['Applications', 'Everything in one workspace'],
              ['Interviews', 'Know exactly where you stand'],
              ['Opportunities', 'Keep your next chapter moving'],
            ].map(([title, text], i) => (
              <div className="auth-preview-row" key={title}>
                <span className={`step-icon step-${i}`}>
                  <Check size={16} />
                </span>
                <div>
                  <strong>{title}</strong>
                  <small>{text}</small>
                </div>
                <span className="preview-line" />
              </div>
            ))}
          </div>
        </div>
        <span className="auth-footer">A clear head. A clear next step.</span>
      </section>
      <section className="auth-panel">
        <div className="auth-box">
          <div className="auth-window-title">
            <ShieldCheck size={16} aria-hidden="true" />
            JobTrack — {register ? 'New account' : 'Sign in'}
          </div>
          <span className="eyebrow">WELCOME TO JOBTRACK</span>
          <h2>{register ? 'Create your workspace' : 'Welcome back'}</h2>
          <p>
            {register
              ? 'Create your private job search workspace.'
              : 'Your next opportunity is a little closer.'}
          </p>
          {!configured ? (
            <div className="setup-card">
              <ShieldCheck size={24} />
              <h3>Connect your workspace</h3>
              <p>
                Add your Supabase project URL and publishable key to <code>.env.local</code>, run
                the database migration, then restart the app. The README walks you through each
                step.
              </p>
              <Link className="button primary" href="/demo">
                Explore the working demo <ArrowRight size={17} />
              </Link>
              <small>The demo uses sample data stored in this browser.</small>
            </div>
          ) : (
            <form onSubmit={submit} className="auth-form">
              {confirmationReturn && !register && (
                <div className="success-message" role="status">
                  <strong>Finish signing in</strong>
                  <p>
                    We couldn’t sign you in automatically. Your email may already be confirmed. Sign
                    in below to continue.
                  </p>
                </div>
              )}
              {register && (
                <label>
                  Full name
                  <input
                    name="name"
                    autoComplete="name"
                    required
                    maxLength={100}
                    placeholder="Alex Morgan"
                  />
                </label>
              )}
              <label>
                Email address
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  maxLength={254}
                />
              </label>
              <label>
                Password
                <span className="password-field">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete={register ? 'new-password' : 'current-password'}
                    minLength={register ? 12 : undefined}
                    required
                    maxLength={128}
                    placeholder={register ? 'At least 12 characters' : 'Enter your password'}
                  />
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </span>
              </label>
              {error && (
                <p className="error-message" role="alert">
                  {error}
                </p>
              )}
              {message && (
                <p className="success-message" role="status">
                  {message}
                </p>
              )}
              <button className="button primary" disabled={pending}>
                {pending ? 'Please wait…' : register ? 'Create account' : 'Sign in'}
                <ArrowRight size={17} />
              </button>
            </form>
          )}
          <p className="auth-switch">
            {register ? 'Already have an account?' : 'New to JobTrack?'}{' '}
            <Link href={register ? '/login' : '/register'}>
              {register ? 'Sign in' : 'Create an account'}
            </Link>
          </p>
          {configured && (
            <Link className="demo-link" href="/demo">
              Take a look around with demo data <ArrowRight size={14} />
            </Link>
          )}
          <div className="auth-privacy">
            <ShieldCheck size={15} />
            Your applications. Your private workspace.
          </div>
        </div>
      </section>
    </div>
  );
}
