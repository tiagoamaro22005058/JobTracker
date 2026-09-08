'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Plus, ArrowUpRight, ArrowRight, CalendarDays, Sparkles } from 'lucide-react';
import { useApplications } from '@/hooks/use-applications';
import {
  defaultFilters,
  filterApplications,
  isInterview,
  summarize,
  type Filters,
} from '@/lib/applications';
import type { Application } from '@/types/application';
import { SummaryCards } from './summary-cards';
import { ApplicationFilters } from './application-filters';
import { ApplicationTable } from './application-table';
import { ApplicationForm } from './application-form';
import { ApplicationDetails, DeleteApplication } from './application-details';
type DialogState =
  { type: 'add' } | { type: 'edit' | 'view' | 'delete'; application: Application } | null;
export function Workspace({ allApplications = false }: { allApplications?: boolean }) {
  const { applications, loading, error, reload, demo, name } = useApplications();
  const [filters, setFilters] = useState<Filters>(defaultFilters),
    [dialog, setDialog] = useState<DialogState>(null);
  const visible = filterApplications(applications, filters),
    stats = summarize(applications);
  const tabs: [Filters['group'], string, number][] = [
    ['all', 'All applications', applications.length],
    [
      'active',
      'Active',
      applications.filter(
        (a) => !['Accepted', 'Rejected', 'Ghosted', 'Withdrawn'].includes(a.status),
      ).length,
    ],
    ['interviews', 'Interviews', stats.interviews],
    ['offers', 'Offers', stats.offers],
    [
      'closed',
      'Closed',
      applications.filter((a) =>
        ['Accepted', 'Rejected', 'Ghosted', 'Withdrawn'].includes(a.status),
      ).length,
    ],
  ];
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            {allApplications ? 'YOUR OPPORTUNITIES, ORGANIZED' : 'MAKE YOUR NEXT MOVE'}
          </div>
          <h1>
            {allApplications ? 'Applications' : `Let’s move forward, ${name.split(' ')[0]}.`}
            <span className="heading-dot" />
          </h1>
          <p>
            {allApplications
              ? 'Every opportunity, from first interest to the final offer.'
              : 'A little progress every day. Here’s where your job search stands.'}
          </p>
        </div>
        <button className="button primary" onClick={() => setDialog({ type: 'add' })}>
          <Plus size={18} />
          Add application
        </button>
      </div>
      {!allApplications && <SummaryCards applications={applications} loading={loading} />}
      <section className="applications-panel">
        <div className="panel-title">
          <div>
            <h2>
              Your applications <span>{applications.length}</span>
            </h2>
            <p>Keep track of every possibility.</p>
          </div>
          <span className="panel-note">
            <span className="live-dot" /> {demo ? 'Saved on this device' : 'Your private list'}
          </span>
        </div>
        <div className="application-tabs" role="group" aria-label="Application groups">
          {tabs.map(([key, label, count]) => (
            <button
              className={filters.group === key ? 'active' : ''}
              aria-pressed={filters.group === key}
              key={key}
              onClick={() => setFilters({ ...filters, group: key })}
            >
              {label}
              <span>{count}</span>
            </button>
          ))}
        </div>
        <ApplicationFilters filters={filters} onChange={setFilters} applications={applications} />
        {loading ? (
          <div className="table-loading" role="status">
            <span className="loading-bar" />
            <span className="loading-bar" />
            <span className="loading-bar" />
            Loading your applications…
          </div>
        ) : error ? (
          <div className="empty-state">
            <h3>We couldn’t load your applications.</h3>
            <p role="alert">{error}</p>
            <button className="button secondary" onClick={() => void reload()}>
              Try again
            </button>
          </div>
        ) : (
          <ApplicationTable
            key={JSON.stringify(filters)}
            applications={visible}
            filters={filters}
            onSort={(sort) =>
              setFilters({
                ...filters,
                sort,
                direction: filters.sort === sort && filters.direction === 'asc' ? 'desc' : 'asc',
              })
            }
            onView={(application) => setDialog({ type: 'view', application })}
            onEdit={(application) => setDialog({ type: 'edit', application })}
            onDelete={(application) => setDialog({ type: 'delete', application })}
            onAdd={() => setDialog({ type: 'add' })}
            hasAny={applications.length > 0}
          />
        )}
      </section>
      {!allApplications && !loading && !error && (
        <div className="dashboard-bottom">
          <section className="momentum-card">
            <div className="section-kicker">
              <CalendarDays size={16} />
              THIS MONTH
            </div>
            <div className="momentum-inner">
              <div>
                <h3>Keep the momentum going.</h3>
                <p>
                  You’ve added{' '}
                  <strong>
                    {stats.thisMonth} application{stats.thisMonth === 1 ? '' : 's'}
                  </strong>{' '}
                  this month.
                  <br />
                  Every step brings a new possibility.
                </p>
                <Link href={demo ? '/demo/statistics' : '/statistics'} className="text-link">
                  Explore your statistics <ArrowRight size={15} />
                </Link>
              </div>
              <div className="mini-bars" aria-hidden="true">
                {Array.from({ length: 7 }, (_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() - (6 - i) * 7);
                  const end = new Date(d);
                  end.setDate(end.getDate() + 7);
                  const count = applications.filter(
                    (a) =>
                      new Date(`${a.application_date}T12:00:00`) >= d &&
                      new Date(`${a.application_date}T12:00:00`) < end,
                  ).length;
                  return (
                    <span
                      key={i}
                      style={{ height: `${Math.max(8, Math.min(100, count * 22))}%` }}
                    />
                  );
                })}
              </div>
            </div>
          </section>
          <section className="next-card">
            <div className="section-kicker">
              <Sparkles size={16} />
              IN THE CONVERSATION
            </div>
            <h3>
              {stats.interviews
                ? `${stats.interviews} opportunities moving forward.`
                : 'Your next conversation is out there.'}
            </h3>
            <p>
              {stats.interviews
                ? applications
                    .filter((a) => isInterview(a.status))
                    .slice(0, 3)
                    .map((a) => a.company_name)
                    .join(', ') + (stats.interviews > 3 ? ' and more.' : '.')
                : 'Keep applying, stay curious, and make space for what’s next.'}
            </p>
            <button
              className="text-link"
              onClick={() => {
                setFilters({ ...defaultFilters, group: 'interviews' });
                document
                  .querySelector('.applications-panel')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              View interview stages <ArrowUpRight size={15} />
            </button>
          </section>
        </div>
      )}
      <footer className="page-footer">
        <span>One place for your next chapter.</span>
        <span>
          Made for your next move <span className="footer-spark">✳</span>
        </span>
      </footer>
      {dialog?.type === 'add' && <ApplicationForm onClose={() => setDialog(null)} />}{' '}
      {dialog?.type === 'edit' && (
        <ApplicationForm application={dialog.application} onClose={() => setDialog(null)} />
      )}{' '}
      {dialog?.type === 'view' && (
        <ApplicationDetails
          application={
            applications.find((a) => a.id === dialog.application.id) || dialog.application
          }
          onClose={() => setDialog(null)}
          onEdit={() => setDialog({ type: 'edit', application: dialog.application })}
        />
      )}{' '}
      {dialog?.type === 'delete' && (
        <DeleteApplication application={dialog.application} onClose={() => setDialog(null)} />
      )}
    </>
  );
}
