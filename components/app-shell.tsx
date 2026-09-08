'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  UserRound,
  LogOut,
  Sun,
  Moon,
  ArrowUpRight,
  PanelLeftClose,
  Menu,
  Check,
  X,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useApplications } from '@/hooks/use-applications';
import { createClient } from '@/lib/supabase/client';
import { Logo } from './logo';
const navigation = [
  ['dashboard', 'Dashboard', LayoutDashboard],
  ['applications', 'Applications', BriefcaseBusiness],
  ['statistics', 'Statistics', ChartNoAxesCombined],
  ['profile', 'Profile', UserRound],
] as const;
export function AppShell({ children }: { children: React.ReactNode }) {
  const { demo, name, email, applications, toast, notify } = useApplications();
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const section = pathname.split('/').filter(Boolean).at(-1);
  const current = section === 'demo' ? 'dashboard' : section;
  async function logout() {
    setLeaving(true);
    try {
      if (!demo) {
        const { error } = await createClient().auth.signOut();
        if (error) throw error;
      }
      router.replace('/login');
      router.refresh();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Could not sign out.');
      setLeaving(false);
    }
  }
  return (
    <div className="app-layout">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {open && (
        <button
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={`sidebar ${open ? 'is-open' : ''}`}>
        <div className="sidebar-logo">
          <Link href={demo ? '/demo' : '/dashboard'} aria-label="JobTrack dashboard">
            <Logo />
          </Link>
          <button
            className="icon-button mobile-only"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          >
            <PanelLeftClose size={20} />
          </button>
        </div>
        <div className="workspace-label">
          <span className="workspace-avatar">P</span>
          <div>
            Personal workspace<span>Your next chapter</span>
          </div>
          <span className="workspace-plan">FREE</span>
        </div>
        <span className="nav-label">WORKSPACE</span>
        <nav>
          {navigation.map(([route, label, Icon]) => (
            <Link
              key={route}
              href={demo ? `/demo/${route}` : `/${route}`}
              onClick={() => setOpen(false)}
              className={`nav-item ${current === route ? 'active' : ''}`}
              aria-current={current === route ? 'page' : undefined}
            >
              <Icon size={19} />
              {label}
              {route === 'applications' && <span className="nav-count">{applications.length}</span>}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="small-spark">✳</span>
            <strong>Small steps. Big moves.</strong>
            <p>Every application is a step toward your next opportunity.</p>
            <Link href={demo ? '/demo/statistics' : '/statistics'}>
              See your progress <ArrowUpRight size={15} />
            </Link>
          </div>
          <button
            className="nav-item theme-toggle"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="light-icon" size={19} />
            <Moon className="dark-icon" size={19} />
            Change appearance
            <span className="theme-switch" />
          </button>
          <button className="nav-item" disabled={leaving} onClick={logout}>
            <LogOut size={19} />
            {leaving ? 'Signing out…' : demo ? 'Exit demo' : 'Log out'}
          </button>
          <Link className="user-card" href={demo ? '/demo/profile' : '/profile'}>
            <span className="avatar">
              {name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </span>
            <span>
              <strong>{name}</strong>
              <small>{email}</small>
            </span>
          </Link>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-only"
              aria-label="Open navigation"
              onClick={() => setOpen(true)}
            >
              <Menu size={20} />
            </button>
            <BriefcaseBusiness size={18} aria-hidden="true" />
            <span>JobTrack</span>
            <span className="slash">—</span>
            <strong>{navigation.find((n) => n[0] === current)?.[1] || 'Dashboard'}</strong>
          </div>
          <div className="topbar-right">
            <span className="private-indicator">
              <span />
              {demo ? 'Demo workspace' : 'Private workspace'}
            </span>
            <span className="avatar avatar-small">{name[0].toUpperCase()}</span>
          </div>
        </header>
        {demo && (
          <div className="demo-banner">
            <span>
              <strong>Demo mode</strong> · Sample applications, saved only in this browser.
            </span>
            <Link href="/register">
              Create your workspace <ArrowUpRight size={14} />
            </Link>
          </div>
        )}
        <main id="main" className="main-content">
          {children}
        </main>
      </div>
      <footer className="desktop-taskbar" aria-label="Workspace shortcuts">
        <Link className="taskbar-start" href={demo ? '/demo' : '/dashboard'}>
          <LayoutDashboard size={20} aria-hidden="true" />
          JobTrack
        </Link>
        <nav aria-label="Open workspace pages">
          {navigation.map(([route, label, Icon]) => (
            <Link
              key={route}
              href={demo ? `/demo/${route}` : `/${route}`}
              className={`taskbar-task ${current === route ? 'active' : ''}`}
              aria-current={current === route ? 'page' : undefined}
              aria-label={label}
            >
              <Icon size={16} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <span className="taskbar-status">{demo ? 'Local demo' : 'Personal workspace'}</span>
      </footer>
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => notify('')}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
