import { z } from 'zod';
import { STATUSES, type Application, type Status } from '@/types/application';

export const applicationSchema = z
  .object({
    company_name: z.string().trim().min(1, 'Company is required.').max(160),
    position: z.string().trim().min(1, 'Position is required.').max(200),
    job_link: z
      .string()
      .trim()
      .max(2048)
      .refine((value) => {
        if (!value) return true;
        try {
          return ['http:', 'https:'].includes(new URL(value).protocol);
        } catch {
          return false;
        }
      }, 'Enter a valid http or https URL.'),
    location: z.string().trim().max(200),
    application_date: z.iso.date('Enter a valid application date.'),
    status: z.enum(STATUSES),
    notes: z.string().trim().max(10000, 'Notes must be 10,000 characters or fewer.'),
  })
  .strict();
export const isInterview = (status: Status) => status.includes('Interview');
export const statusTone = (status: Status) =>
  ({
    Interested: 'slate',
    Applied: 'blue',
    Waiting: 'amber',
    'Interview #1': 'purple',
    'Interview #2': 'violet',
    'Interview #3': 'indigo',
    'Technical Interview': 'cyan',
    'Final Interview': 'pink',
    Offer: 'green',
    Accepted: 'emerald',
    Rejected: 'red',
    Ghosted: 'gray',
    Withdrawn: 'stone',
  })[status];
export const localDate = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(`${date.slice(0, 10)}T12:00:00`),
  );
export type Filters = {
  search: string;
  status: string;
  company: string;
  from: string;
  to: string;
  sort: 'company_name' | 'position' | 'application_date' | 'status' | 'updated_at';
  direction: 'asc' | 'desc';
  group: 'all' | 'active' | 'interviews' | 'offers' | 'closed';
};
export const defaultFilters: Filters = {
  search: '',
  status: '',
  company: '',
  from: '',
  to: '',
  sort: 'application_date',
  direction: 'desc',
  group: 'all',
};
export function filterApplications(apps: Application[], f: Filters) {
  return apps
    .filter((a) => {
      const matchesGroup =
        f.group === 'all' ||
        (f.group === 'active' &&
          !['Rejected', 'Ghosted', 'Withdrawn', 'Accepted'].includes(a.status)) ||
        (f.group === 'interviews' && isInterview(a.status)) ||
        (f.group === 'offers' && ['Offer', 'Accepted'].includes(a.status)) ||
        (f.group === 'closed' &&
          ['Rejected', 'Ghosted', 'Withdrawn', 'Accepted'].includes(a.status));
      return (
        matchesGroup &&
        [a.company_name, a.position, a.location].some((v) =>
          v.toLowerCase().includes(f.search.toLowerCase().trim()),
        ) &&
        (!f.status || a.status === f.status) &&
        (!f.company || a.company_name === f.company) &&
        (!f.from || a.application_date >= f.from) &&
        (!f.to || a.application_date <= f.to)
      );
    })
    .sort((a, b) => {
      const compare =
        f.sort === 'status'
          ? STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status)
          : a[f.sort].localeCompare(b[f.sort]);
      return (f.direction === 'asc' ? compare : -compare) || a.id.localeCompare(b.id);
    });
}
export function summarize(apps: Application[], now = new Date()) {
  const count = (status: Status) => apps.filter((a) => a.status === status).length;
  const total = apps.length,
    interviews = apps.filter((a) => isInterview(a.status)).length,
    offers = count('Offer') + count('Accepted');
  const rate = (n: number) => (total ? Math.round((n / total) * 100) : 0);
  return {
    total,
    waiting: count('Waiting'),
    interviews,
    offers,
    rejected: count('Rejected'),
    ghosted: count('Ghosted'),
    accepted: count('Accepted'),
    thisMonth: apps.filter((a) => a.application_date.startsWith(localDate(now).slice(0, 7))).length,
    successRate: rate(count('Accepted')),
    interviewRate: rate(interviews),
    offerRate: rate(offers),
  };
}
