'use client';
import { Search, SlidersHorizontal, ArrowDownWideNarrow, X } from 'lucide-react';
import { useState } from 'react';
import { STATUSES, type Application } from '@/types/application';
import { defaultFilters, type Filters } from '@/lib/applications';
export function ApplicationFilters({
  filters: f,
  onChange,
  applications,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  applications: Application[];
}) {
  const [expanded, setExpanded] = useState(false);
  const count = [f.status, f.company, f.from, f.to].filter(Boolean).length;
  const change = (patch: Partial<Filters>) => onChange({ ...f, ...patch });
  return (
    <>
      <div className="table-toolbar">
        <label className="search-input">
          <Search size={17} />
          <input
            aria-label="Search applications"
            placeholder="Search company, role, or location…"
            value={f.search}
            onChange={(e) => change({ search: e.target.value })}
          />
          {f.search && (
            <button
              className="icon-button"
              aria-label="Clear search"
              onClick={() => change({ search: '' })}
            >
              <X size={14} />
            </button>
          )}
        </label>
        <div className="toolbar-buttons">
          <button
            className={`button secondary ${expanded ? 'selected' : ''}`}
            aria-expanded={expanded}
            aria-controls="advanced-filters"
            onClick={() => setExpanded(!expanded)}
          >
            <SlidersHorizontal size={15} />
            Filters{count > 0 && <span className="filter-count">{count}</span>}
          </button>
          <label className="sort-control">
            <ArrowDownWideNarrow size={15} />
            <select
              aria-label="Sort applications"
              value={`${f.sort}:${f.direction}`}
              onChange={(e) => {
                const [sort, direction] = e.target.value.split(':');
                change({
                  sort: sort as Filters['sort'],
                  direction: direction as Filters['direction'],
                });
              }}
            >
              {(
                [
                  ['application_date', 'Date applied'],
                  ['company_name', 'Company'],
                  ['position', 'Position'],
                  ['status', 'Status'],
                  ['updated_at', 'Last updated'],
                ] as const
              ).flatMap(([key, label]) =>
                ['asc', 'desc'].map((direction) => (
                  <option key={`${key}:${direction}`} value={`${key}:${direction}`}>
                    {label} · {direction === 'asc' ? 'ascending' : 'descending'}
                  </option>
                )),
              )}
            </select>
          </label>
        </div>
      </div>
      {expanded && (
        <div className="advanced-filters" id="advanced-filters">
          <label>
            Status
            <select value={f.status} onChange={(e) => change({ status: e.target.value })}>
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Company
            <select value={f.company} onChange={(e) => change({ company: e.target.value })}>
              <option value="">All companies</option>
              {[...new Set(applications.map((a) => a.company_name))].sort().map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Applied from
            <input
              type="date"
              value={f.from}
              max={f.to || undefined}
              onChange={(e) => change({ from: e.target.value })}
            />
          </label>
          <label>
            Applied to
            <input
              type="date"
              value={f.to}
              min={f.from || undefined}
              onChange={(e) => change({ to: e.target.value })}
            />
          </label>
        </div>
      )}
      {(count > 0 || f.search || f.group !== 'all') && (
        <div className="active-filters">
          <span>
            {count > 0
              ? `${count} filter${count === 1 ? '' : 's'} applied`
              : f.search
                ? 'Search active'
                : `${f.group} applications`}
          </span>
          <button onClick={() => onChange(defaultFilters)}>
            Clear filters <X size={12} />
          </button>
        </div>
      )}
    </>
  );
}
