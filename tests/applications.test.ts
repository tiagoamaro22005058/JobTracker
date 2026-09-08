import { describe, expect, it } from 'vitest';
import {
  applicationSchema,
  defaultFilters,
  filterApplications,
  summarize,
} from '@/lib/applications';
import type { Application } from '@/types/application';
const application: Application = {
  id: 'a',
  user_id: 'owner',
  company_name: 'Acme',
  position: 'Designer',
  location: 'Lisbon',
  job_link: '',
  application_date: '2026-09-08',
  status: 'Applied',
  notes: '',
  created_at: '2026-09-08T10:00:00Z',
  updated_at: '2026-09-08T10:00:00Z',
};
const { id, user_id, created_at, updated_at, ...input } = application;
void [id, user_id, created_at, updated_at];
describe('Application validation', () => {
  it('trims required fields and permits optional fields to be empty', () => {
    expect(applicationSchema.parse({ ...input, company_name: '  Acme  ' }).company_name).toBe(
      'Acme',
    );
  });
  it.each(['javascript:alert(1)', 'data:text/html,test', 'ftp://files.example.com', 'not a URL'])(
    'rejects unsafe or invalid links: %s',
    (job_link) => {
      expect(applicationSchema.safeParse({ ...input, job_link }).success).toBe(false);
    },
  );
  it.each(['https://example.com/jobs/42', 'http://example.com'])(
    'accepts web URLs: %s',
    (job_link) => {
      expect(applicationSchema.safeParse({ ...input, job_link }).success).toBe(true);
    },
  );
  it('rejects invalid dates, empty company, and unknown statuses', () => {
    for (const patch of [
      { application_date: '2026-02-30' },
      { company_name: ' ' },
      { status: 'Made up' },
    ])
      expect(applicationSchema.safeParse({ ...input, ...patch }).success).toBe(false);
  });
  it('rejects attempts to assign ownership or server-managed timestamps', () => {
    expect(applicationSchema.safeParse({ ...input, user_id: 'another-user' }).success).toBe(false);
    expect(applicationSchema.partial().safeParse({ updated_at: 'fake' }).success).toBe(false);
  });
});
describe('Filtering and sorting', () => {
  const apps = [
    application,
    {
      ...application,
      id: 'b',
      company_name: 'Beta',
      status: 'Interview #2' as const,
      application_date: '2026-08-12',
    },
    {
      ...application,
      id: 'c',
      company_name: 'Gamma',
      position: 'Engineer',
      location: 'Remote',
      status: 'Offer' as const,
    },
  ];
  it('combines company, status, inclusive date range, and case-insensitive location search', () => {
    expect(
      filterApplications(apps, {
        ...defaultFilters,
        company: 'Beta',
        status: 'Interview #2',
        search: ' LISBON ',
        from: '2026-08-12',
        to: '2026-08-12',
      }).map((a) => a.id),
    ).toEqual(['b']);
  });
  it('searches position and filters by interview stage', () => {
    expect(
      filterApplications(apps, { ...defaultFilters, search: 'engineer' }).map((a) => a.id),
    ).toEqual(['c']);
    expect(
      filterApplications(apps, { ...defaultFilters, group: 'interviews' }).map((a) => a.id),
    ).toEqual(['b']);
  });
  it('supports both sorting directions without mutating the source', () => {
    expect(
      filterApplications(apps, { ...defaultFilters, sort: 'company_name', direction: 'desc' }).map(
        (a) => a.id,
      ),
    ).toEqual(['c', 'b', 'a']);
    expect(
      filterApplications(apps, { ...defaultFilters, sort: 'company_name', direction: 'asc' }).map(
        (a) => a.id,
      ),
    ).toEqual(['a', 'b', 'c']);
    expect(apps[0].id).toBe('a');
  });
  it('sorts statuses in pipeline order and supports last updated', () => {
    expect(
      filterApplications(apps, { ...defaultFilters, sort: 'status', direction: 'asc' }).map(
        (a) => a.status,
      ),
    ).toEqual(['Applied', 'Interview #2', 'Offer']);
    const updated = [
      { ...application, id: 'old', updated_at: '2025-01-01T00:00:00Z' },
      { ...application, id: 'new' },
    ];
    expect(
      filterApplications(updated, { ...defaultFilters, sort: 'updated_at' }).map((a) => a.id),
    ).toEqual(['new', 'old']);
  });
  it('does not include closed outcomes in active applications', () => {
    const closed = ['Accepted', 'Rejected', 'Ghosted', 'Withdrawn'] as const;
    expect(
      filterApplications(
        closed.map((status, i) => ({ ...application, status, id: String(i) })),
        { ...defaultFilters, group: 'active' },
      ),
    ).toEqual([]);
  });
});
describe('Statistics', () => {
  it('returns zero rates for an empty workspace', () => {
    expect(summarize([])).toMatchObject({
      total: 0,
      successRate: 0,
      interviewRate: 0,
      offerRate: 0,
    });
  });
  it('counts current stages and uses an explicit all-applications denominator', () => {
    const statuses = [
      'Interview #1',
      'Technical Interview',
      'Final Interview',
      'Offer',
      'Accepted',
      'Rejected',
      'Ghosted',
      'Waiting',
    ] as const;
    const apps = statuses.map((status, i) => ({ ...application, id: String(i), status }));
    expect(summarize(apps, new Date(2026, 8, 8))).toMatchObject({
      total: 8,
      interviews: 3,
      offers: 2,
      accepted: 1,
      waiting: 1,
      rejected: 1,
      ghosted: 1,
      thisMonth: 8,
      successRate: 13,
      interviewRate: 38,
      offerRate: 25,
    });
  });
});
