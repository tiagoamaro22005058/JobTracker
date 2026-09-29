'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Mail, RefreshCw, Unplug } from 'lucide-react';

type Message = {
  id: string;
  subject: string;
  from: string;
  date: string;
  unread: boolean;
  body?: string;
};
type Inbox = {
  configured: boolean;
  connected: boolean;
  email?: string;
  messages?: Message[];
  nextPage?: string | null;
};
const demoMessages: Message[] = [
  {
    id: 'demo1',
    subject: 'Let’s schedule your first interview',
    from: 'Hiring team <careers@example.com>',
    date: '',
    unread: true,
    body: 'Hi Alex,\n\nThanks for applying! We would love to learn more about your experience. Are you available for a short interview next week?\n\nBest,\nThe hiring team\n\nThis is a sample email for the JobTrack demo.',
  },
  {
    id: 'demo2',
    subject: 'We received your application',
    from: 'Recruitment <recruitment@example.com>',
    date: '',
    unread: false,
    body: 'Hi Alex,\n\nThank you for your interest in joining our team. We have received your application and will be in touch with next steps.\n\nThis is a sample email for the JobTrack demo.',
  },
];
const notices: Record<string, string> = {
  success: 'Gmail connected. Your inbox is ready.',
  cancelled: 'Connection cancelled. You can connect Gmail whenever you’re ready.',
  expired: 'The connection request expired. Please try connecting again.',
  permission: 'Please allow read-only Gmail access to connect your inbox.',
  failed: 'Gmail could not be connected. Please try again or check the Gmail setup.',
};
async function requestJson(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, cache: 'no-store' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}
export function Emails({ demo = false, connection = '' }: { demo?: boolean; connection?: string }) {
  const [inbox, setInbox] = useState<Inbox | null>(
    demo
      ? { configured: true, connected: true, email: 'alex@example.com', messages: demoMessages }
      : null,
  );
  const [selected, setSelected] = useState<Message | null>(null);
  const [loading, setLoading] = useState(!demo);
  const [reading, setReading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(notices[connection] || '');
  const generation = useRef(0);

  useEffect(() => {
    if (demo) return;
    const controller = new AbortController();
    const result = new URLSearchParams(window.location.search).get('connection');
    if (result) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    requestJson('/api/mail', { signal: controller.signal })
      .then(setInbox)
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    const invalidateRequests = () => {
      generation.current++;
    };
    return () => {
      controller.abort();
      invalidateRequests();
    };
  }, [demo]);

  async function load(page?: string) {
    setLoading(true);
    setError('');
    generation.current++;
    setSelected(null);
    setReading(false);
    try {
      setInbox(await requestJson(`/api/mail${page ? `?page=${encodeURIComponent(page)}` : ''}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your inbox.');
    } finally {
      setLoading(false);
    }
  }
  async function connect() {
    setBusy(true);
    setError('');
    try {
      const { url } = await requestJson('/api/mail/connect', { method: 'POST' });
      window.location.assign(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not connect.');
      setBusy(false);
    }
  }
  async function disconnect() {
    setBusy(true);
    setError('');
    generation.current++;
    try {
      const { revoked } = await requestJson('/api/mail/disconnect', { method: 'POST' });
      setInbox({ configured: true, connected: false });
      setSelected(null);
      setReading(false);
      setNotice(
        revoked
          ? 'Gmail disconnected from this browser.'
          : 'Disconnected from this browser. To finish revoking access, remove JobTrack in your Google Account connections.',
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not disconnect.');
    } finally {
      setBusy(false);
    }
  }
  async function read(message: Message) {
    const current = ++generation.current;
    setSelected(message);
    setError('');
    if (demo) return;
    setReading(true);
    try {
      const detail = await requestJson(`/api/mail/${message.id}`);
      if (current === generation.current) setSelected(detail);
    } catch (e) {
      if (current === generation.current)
        setError(e instanceof Error ? e.message : 'Could not read this email.');
    } finally {
      if (current === generation.current) setReading(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">KEEP THE CONVERSATION GOING</span>
          <h1>
            Emails
            <span className="heading-dot" />
          </h1>
          <p>Your Gmail inbox, alongside your applications.</p>
        </div>
      </div>
      {notice && (
        <p className="mail-notice" role="status">
          {notice}
        </p>
      )}
      {error && (
        <div className="mail-notice error-message" role="alert">
          {error}{' '}
          {!demo && (
            <button className="text-link" disabled={loading || busy} onClick={() => load()}>
              Try again
            </button>
          )}
        </div>
      )}
      {loading && !inbox && (
        <div className="settings-card" role="status">
          Loading your inbox…
        </div>
      )}
      {inbox && !inbox.connected && (
        <section className="settings-card mail-connect">
          <span className="job-site-mark">
            <Mail size={24} aria-hidden="true" />
          </span>
          <h2>Bring your inbox into JobTrack</h2>
          <p>
            Connect Gmail to browse your inbox and read messages without leaving your workspace.
          </p>
          <p className="mail-muted">
            Read-only access. JobTrack cannot send, delete, or mark your emails as read. Email
            content is not saved in our database.
          </p>
          {inbox.configured ? (
            <button className="button primary" disabled={busy} onClick={connect}>
              <Mail size={17} />
              {busy ? 'Connecting…' : 'Connect Gmail'}
            </button>
          ) : (
            <div className="mail-notice">
              <strong>Gmail setup is in progress</strong>
              <p>
                The site owner needs to finish connecting JobTrack to Google before you can link
                your inbox.
              </p>
            </div>
          )}
        </section>
      )}
      {inbox?.connected && (
        <section className="settings-card mail-workspace">
          <div className="mail-toolbar">
            <div>
              <strong>{inbox.email}</strong>
              <p>
                {demo
                  ? 'Sample inbox · No real emails'
                  : 'Inbox · Read-only · Connected on this browser'}
              </p>
            </div>
            <div className="mail-actions">
              {!demo && (
                <>
                  <button className="button" disabled={loading || busy} onClick={() => load()}>
                    <RefreshCw size={16} />
                    {loading ? 'Refreshing…' : 'Refresh'}
                  </button>
                  <button className="button" disabled={busy || loading} onClick={disconnect}>
                    <Unplug size={16} />
                    Disconnect
                  </button>
                </>
              )}
            </div>
          </div>
          <div className={`mail-columns ${selected ? 'mail-has-selection' : ''}`}>
            <div className="mail-list" aria-label="Inbox messages" aria-busy={loading}>
              {inbox.messages?.length ? (
                inbox.messages.map((message) => (
                  <button
                    className={`mail-row ${selected?.id === message.id ? 'selected' : ''}`}
                    key={message.id}
                    onClick={() => read(message)}
                    disabled={loading || busy}
                    aria-pressed={selected?.id === message.id}
                  >
                    <span className="mail-sender">
                      {message.unread && <span className="mail-unread" aria-label="Unread" />}
                      {message.from}
                    </span>
                    <strong>{message.subject}</strong>
                    <small>{message.date || 'Sample email'}</small>
                  </button>
                ))
              ) : (
                <p className="mail-empty">Your inbox is empty.</p>
              )}
              {!demo && (
                <div className="mail-pagination">
                  <button className="button" disabled={loading || busy} onClick={() => load()}>
                    Latest
                  </button>
                  {inbox.nextPage && (
                    <button
                      className="button"
                      disabled={loading || busy}
                      onClick={() => load(inbox.nextPage!)}
                    >
                      Older emails
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="mail-reader" aria-live="polite" aria-busy={reading}>
              {selected ? (
                <>
                  <button
                    className="text-link mail-back"
                    onClick={() => {
                      generation.current++;
                      setSelected(null);
                      setReading(false);
                    }}
                  >
                    <ArrowLeft size={15} />
                    Back to inbox
                  </button>
                  <h2>{selected.subject}</h2>
                  <p className="mail-muted">{selected.from}</p>
                  <p className="mail-muted">{selected.date}</p>
                  {reading ? (
                    <p role="status">Loading email…</p>
                  ) : selected.body !== undefined ? (
                    <pre className="mail-body">
                      {selected.body ||
                        'This email has no plain-text version. Open it in Gmail to view its formatting and attachments.'}
                    </pre>
                  ) : (
                    <p>Could not load this message. Select it again to retry.</p>
                  )}
                  {!demo && (
                    <a
                      className="text-link"
                      href={`https://mail.google.com/mail/u/?authuser=${encodeURIComponent(inbox.email || '')}#all/${encodeURIComponent(selected.id)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open in Gmail <ArrowUpRight size={15} />
                      <span className="sr-only"> (new tab)</span>
                    </a>
                  )}
                </>
              ) : (
                <div className="mail-empty">
                  <Mail size={32} aria-hidden="true" />
                  <h2>Select an email</h2>
                  <p>Choose a message to read it here.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
