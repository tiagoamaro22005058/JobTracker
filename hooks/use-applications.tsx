'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Application, ApplicationInput } from '@/types/application';
import { demoApplications } from '@/lib/demo';
import { applicationService, SessionExpiredError } from '@/services/applications';
type Context = {
  applications: Application[];
  loading: boolean;
  error: string;
  reload: () => Promise<void>;
  save: (input: ApplicationInput, id?: string) => Promise<void>;
  setStatus: (id: string, status: Application['status']) => Promise<void>;
  remove: (id: string) => Promise<void>;
  demo: boolean;
  name: string;
  email: string;
  toast: string;
  notify: (message: string) => void;
};
const ApplicationContext = createContext<Context | null>(null);
const storageKey = 'jobtrack-demo-v1';
export function ApplicationProvider({
  children,
  demo = false,
  name,
  email,
}: {
  children: React.ReactNode;
  demo?: boolean;
  name: string;
  email: string;
}) {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [toast, setToast] = useState('');
  const read = useCallback(async (): Promise<Application[]> => {
    if (!demo) return applicationService.list();
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : demoApplications();
  }, [demo]);
  const handleLoadError = useCallback(
    (error: unknown) => {
      if (error instanceof SessionExpiredError) router.replace('/login');
      setError(error instanceof Error ? error.message : 'Unable to load applications.');
    },
    [router],
  );
  async function reload() {
    setLoading(true);
    try {
      const data = await read();
      setApplications(data);
      setError('');
    } catch (e) {
      handleLoadError(e);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    let active = true;
    read()
      .then((data) => {
        if (active) {
          setApplications(data);
          setError('');
        }
      })
      .catch((error) => {
        if (active) handleLoadError(error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [read, handleLoadError]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(timer);
  }, [toast]);
  function persist(next: Application[]) {
    localStorage.setItem(storageKey, JSON.stringify(next));
    setApplications(next);
  }
  async function authenticated<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (e) {
      if (e instanceof SessionExpiredError) router.replace('/login');
      throw e;
    }
  }
  async function save(input: ApplicationInput, id?: string) {
    if (demo) {
      const now = new Date().toISOString();
      const app = id
        ? { ...applications.find((a) => a.id === id)!, ...input, updated_at: now }
        : { ...input, id: crypto.randomUUID(), user_id: 'demo', created_at: now, updated_at: now };
      persist(id ? applications.map((a) => (a.id === id ? app : a)) : [app, ...applications]);
    } else {
      const saved = await authenticated(() =>
        id ? applicationService.update(id, input) : applicationService.create(input),
      );
      setApplications((previous) =>
        id ? previous.map((a) => (a.id === id ? saved : a)) : [saved, ...previous],
      );
    }
    setToast(id ? 'Application updated' : 'Application added');
  }
  async function setStatus(id: string, status: Application['status']) {
    if (demo)
      persist(
        applications.map((a) =>
          a.id === id ? { ...a, status, updated_at: new Date().toISOString() } : a,
        ),
      );
    else {
      const saved = await authenticated(() => applicationService.update(id, { status }));
      setApplications((previous) => previous.map((a) => (a.id === id ? saved : a)));
    }
    setToast('Status updated');
  }
  async function remove(id: string) {
    if (demo) persist(applications.filter((a) => a.id !== id));
    else {
      await authenticated(() => applicationService.remove(id));
      setApplications((previous) => previous.filter((a) => a.id !== id));
    }
    setToast('Application deleted');
  }
  return (
    <ApplicationContext.Provider
      value={{
        applications,
        loading,
        error,
        reload,
        save,
        setStatus,
        remove,
        demo,
        name,
        email,
        toast,
        notify: setToast,
      }}
    >
      {children}
    </ApplicationContext.Provider>
  );
}
export function useApplications() {
  const context = useContext(ApplicationContext);
  if (!context) throw new Error('ApplicationProvider is missing');
  return context;
}
