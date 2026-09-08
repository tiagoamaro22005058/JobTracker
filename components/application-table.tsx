'use client';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ExternalLink,
  Eye,
  Pencil,
  Trash2,
  BriefcaseBusiness,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import type { Application } from '@/types/application';
import { formatDate, type Filters } from '@/lib/applications';
import { StatusSelect } from './status-badge';
type Props = {
  applications: Application[];
  filters: Filters;
  onSort: (sort: Filters['sort']) => void;
  onView: (app: Application) => void;
  onEdit: (app: Application) => void;
  onDelete: (app: Application) => void;
  onAdd: () => void;
  hasAny: boolean;
};
export function ApplicationTable({
  applications,
  filters,
  onSort,
  onView,
  onEdit,
  onDelete,
  onAdd,
  hasAny,
}: Props) {
  const [page, setPage] = useState(1);
  const pageSize = 8,
    totalPages = Math.max(1, Math.ceil(applications.length / pageSize)),
    currentPage = Math.min(page, totalPages),
    start = (currentPage - 1) * pageSize,
    visible = applications.slice(start, start + pageSize);
  const heading = (label: string, sort: Filters['sort']) => (
    <button className="sort-heading" onClick={() => onSort(sort)}>
      {label}
      {filters.sort === sort ? (
        filters.direction === 'asc' ? (
          <ArrowUp size={13} />
        ) : (
          <ArrowDown size={13} />
        )
      ) : (
        <ArrowUpDown size={12} />
      )}
    </button>
  );
  if (!applications.length)
    return (
      <div className="empty-state">
        <span className="empty-icon">
          <BriefcaseBusiness size={28} />
        </span>
        <h3>
          {hasAny
            ? 'No applications match your search.'
            : "You haven't added any job applications yet."}
        </h3>
        <p>
          {hasAny
            ? 'Try a different search or clear your filters.'
            : 'Great things start with a first step. Let’s track yours.'}
        </p>
        {!hasAny && (
          <button className="button primary" onClick={onAdd}>
            <Plus size={17} />
            Add your first application
          </button>
        )}
      </div>
    );
  return (
    <>
      <div className="table-scroll">
        <table className="applications-table">
          <caption className="sr-only">Your job applications</caption>
          <thead>
            <tr>
              <th
                aria-sort={
                  filters.sort === 'company_name'
                    ? filters.direction === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : undefined
                }
              >
                {heading('Company', 'company_name')}
              </th>
              <th
                aria-sort={
                  filters.sort === 'position'
                    ? filters.direction === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : undefined
                }
              >
                {heading('Position', 'position')}
              </th>
              <th
                aria-sort={
                  filters.sort === 'application_date'
                    ? filters.direction === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : undefined
                }
              >
                {heading('Date applied', 'application_date')}
              </th>
              <th>Location</th>
              <th
                aria-sort={
                  filters.sort === 'status'
                    ? filters.direction === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : undefined
                }
              >
                {heading('Status', 'status')}
              </th>
              <th>Job link</th>
              <th className="actions-heading">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((a) => (
              <tr key={a.id}>
                <td>
                  <button className="company-button" onClick={() => onView(a)}>
                    <span
                      className={`company-avatar company-color-${a.company_name.charCodeAt(0) % 6}`}
                    >
                      {a.company_name.slice(0, 1)}
                    </span>
                    <strong>{a.company_name}</strong>
                  </button>
                </td>
                <td>
                  <button className="position-button" onClick={() => onView(a)}>
                    {a.position}
                  </button>
                </td>
                <td className="cell-muted date-cell">{formatDate(a.application_date)}</td>
                <td className="cell-muted location-cell">{a.location || '—'}</td>
                <td>
                  <StatusSelect id={a.id} status={a.status} company={a.company_name} />
                </td>
                <td>
                  {a.job_link ? (
                    <a
                      className="job-link"
                      href={a.job_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${a.company_name} job posting`}
                    >
                      View <ExternalLink size={13} />
                    </a>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td>
                  <div className="table-actions">
                    <button
                      className="icon-button"
                      aria-label={`View ${a.company_name} application`}
                      title="View details"
                      onClick={() => onView(a)}
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label={`Edit ${a.company_name} application`}
                      title="Edit"
                      onClick={() => onEdit(a)}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="icon-button delete-action"
                      aria-label={`Delete ${a.company_name} application`}
                      title="Delete"
                      onClick={() => onDelete(a)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="table-footer">
        <span>
          Showing{' '}
          <strong>
            {start + 1}–{Math.min(start + pageSize, applications.length)}
          </strong>{' '}
          of <strong>{applications.length}</strong> applications
        </span>
        <div className="pagination">
          <button
            className="icon-button"
            aria-label="Previous page"
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <span>
            {currentPage} <span className="muted">/ {totalPages}</span>
          </span>
          <button
            className="icon-button"
            aria-label="Next page"
            disabled={currentPage === totalPages}
            onClick={() => setPage(currentPage + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
