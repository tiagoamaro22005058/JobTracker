import { expect, it } from 'vitest';
import { applyDemoAutoGhost } from '@/lib/auto-ghost';
import { STATUSES, type Application } from '@/types/application';

const now = new Date('2026-10-10T03:00:00Z');
const base: Application = {
  id: 'sample',
  user_id: 'demo',
  company_name: 'Example',
  position: 'Designer',
  job_link: '',
  location: '',
  application_date: '2026-09-10',
  notes: '',
  status: 'Applied',
  created_at: '2026-09-10T03:00:00Z',
  updated_at: '2026-09-10T03:00:00Z',
};
it.each(STATUSES)('only expires Applied and Waiting: %s', (status) => {
  const [result] = applyDemoAutoGhost([{ ...base, status }], now);
  expect(result.status).toBe(['Applied', 'Waiting'].includes(status) ? 'Ghosted' : status);
});
it('keeps a status younger than 30 days', () => {
  expect(
    applyDemoAutoGhost([{ ...base, status_changed_at: '2026-09-10T03:00:01Z' }], now)[0].status,
  ).toBe('Applied');
});
it('does not let a note edit postpone an old status', () => {
  const [result] = applyDemoAutoGhost(
    [{ ...base, status_changed_at: base.created_at, updated_at: now.toISOString() }],
    now,
  );
  expect(result.status).toBe('Ghosted');
  expect(result.status_changed_at).toBe(now.toISOString());
});
it('retains the fresh clock after reopening and tolerates invalid legacy timestamps', () => {
  const reopened = { ...base, status_changed_at: now.toISOString() };
  expect(applyDemoAutoGhost([reopened], now)[0].status).toBe('Applied');
  expect(applyDemoAutoGhost([{ ...base, updated_at: 'invalid' }], now)[0].status).toBe('Applied');
});
