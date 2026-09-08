'use client';
import { useState } from 'react';
import { useTheme } from 'next-themes';
import { UserRound, ShieldCheck, Palette, Save } from 'lucide-react';
import { useApplications } from '@/hooks/use-applications';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
export function Profile() {
  const { name, email, demo, notify } = useApplications();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [pending, setPending] = useState(false),
    [error, setError] = useState('');
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const full_name = String(new FormData(event.currentTarget).get('name')).trim();
    if (!full_name) {
      setError('Enter your name.');
      return;
    }
    setError('');
    setPending(true);
    try {
      const { error } = await createClient().auth.updateUser({ data: { full_name } });
      if (error) throw error;
      notify('Profile updated');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update profile.');
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">MAKE YOURSELF AT HOME</span>
          <h1>
            Your profile
            <span className="heading-dot" />
          </h1>
          <p>A workspace that feels like yours.</p>
        </div>
      </div>
      <div className="profile-stack">
        <section className="settings-card">
          <div className="settings-heading">
            <UserRound size={20} />
            <div>
              <h2>Personal information</h2>
              <p>Your name and account details.</p>
            </div>
          </div>
          {demo ? (
            <div className="demo-profile">
              <span className="avatar">AM</span>
              <div>
                <strong>{name}</strong>
                <p>This is a sample profile. Create an account to save your own details.</p>
                <a className="text-link" href="/register">
                  Create your account →
                </a>
              </div>
            </div>
          ) : (
            <form className="profile-form" onSubmit={submit}>
              <label>
                Full name
                <input
                  name="name"
                  defaultValue={name}
                  maxLength={100}
                  required
                  autoComplete="name"
                />
              </label>
              <label>
                Email address
                <input value={email} readOnly type="email" />
                <small>Your sign-in email.</small>
              </label>
              {error && (
                <p className="error-message" role="alert">
                  {error}
                </p>
              )}
              <button className="button primary" disabled={pending}>
                <Save size={16} />
                {pending ? 'Saving…' : 'Save changes'}
              </button>
            </form>
          )}
        </section>
        <section className="settings-card">
          <div className="settings-heading">
            <Palette size={20} />
            <div>
              <h2>Appearance</h2>
              <p>Choose what works best for you.</p>
            </div>
          </div>
          <div className="appearance-options">
            {['light', 'dark', 'system'].map((option) => (
              <button
                className={`appearance-option ${theme === option ? 'active' : ''}`}
                key={option}
                aria-pressed={theme === option}
                onClick={() => setTheme(option)}
              >
                <span className={`theme-preview theme-${option}`}>
                  <i />
                  <i />
                  <i />
                </span>
                <strong>{option[0].toUpperCase() + option.slice(1)}</strong>
              </button>
            ))}
          </div>
        </section>
        <section className="privacy-card">
          <ShieldCheck size={24} />
          <div>
            <h3>Your search stays yours.</h3>
            <p>
              {demo
                ? 'Demo changes stay in this browser. Real accounts store applications privately in Supabase.'
                : 'Your applications belong to your account. Access is protected by authentication and database row level security.'}
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
