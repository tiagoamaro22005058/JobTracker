'use client';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { STATUSES, type Status } from '@/types/application';
import { statusTone } from '@/lib/applications';
import { useApplications } from '@/hooks/use-applications';
export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`status-badge tone-${statusTone(status)}`}>
      <span className="status-dot" />
      {status}
    </span>
  );
}
export function StatusSelect({
  status,
  id,
  company,
}: {
  status: Status;
  id: string;
  company: string;
}) {
  const { setStatus, notify } = useApplications();
  const [pending, setPending] = useState(false);
  return (
    <span
      className={`status-select status-badge tone-${statusTone(status)} ${pending ? 'is-pending' : ''}`}
    >
      <span className="status-dot" />
      {status}
      <ChevronDown size={12} />
      <select
        aria-label={`Status for ${company}`}
        value={status}
        disabled={pending}
        onChange={async (event) => {
          setPending(true);
          try {
            await setStatus(id, event.target.value as Status);
          } catch (e) {
            notify(e instanceof Error ? e.message : 'Unable to update status.');
          } finally {
            setPending(false);
          }
        }}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </span>
  );
}
