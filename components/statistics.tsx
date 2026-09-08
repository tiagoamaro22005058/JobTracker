'use client';
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { useApplications } from '@/hooks/use-applications';
import { localDate, summarize } from '@/lib/applications';
import { STATUSES } from '@/types/application';
import { SummaryCards } from './summary-cards';
const colors = [
  '#64748b',
  '#4c8df6',
  '#daaa37',
  '#9b78d6',
  '#8160cb',
  '#5967cb',
  '#299baa',
  '#c86aa7',
  '#42a17b',
  '#228762',
  '#d87d78',
  '#8c94a3',
  '#a38e7b',
];
const tooltipStyle = {
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--text)',
  borderRadius: 0,
  fontSize: 14,
};
export function Statistics() {
  const { applications, loading, error, reload } = useApplications();
  const stats = summarize(applications);
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - 5 + i);
    const prefix = localDate(d).slice(0, 7);
    return {
      name: d.toLocaleDateString('en', { month: 'short', year: '2-digit' }),
      applications: applications.filter((a) => a.application_date.startsWith(prefix)).length,
    };
  });
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 29 + i);
    const date = localDate(d);
    return {
      name: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      applications: applications.filter((a) => a.application_date === date).length,
    };
  });
  const byStatus = STATUSES.map((status, i) => ({
    name: status,
    count: applications.filter((a) => a.status === status).length,
    color: colors[i],
  })).filter((s) => s.count > 0);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">THE BIGGER PICTURE</span>
          <h1>
            Your search, in perspective
            <span className="heading-dot" />
          </h1>
          <p>Find the patterns. Celebrate the progress. Keep moving.</p>
        </div>
        <span className="date-chip">All-time overview</span>
      </div>
      {error ? (
        <div className="empty-state">
          <p role="alert">{error}</p>
          <button className="button secondary" onClick={() => void reload()}>
            Try again
          </button>
        </div>
      ) : (
        <>
          <SummaryCards applications={applications} loading={loading} />
          <div className="rates-grid">
            {[
              ['Applications this month', stats.thisMonth, 'Based on application date'],
              ['Success rate', `${stats.successRate}%`, 'Accepted ÷ all applications'],
              [
                'Interview rate',
                `${stats.interviewRate}%`,
                'Currently interviewing ÷ all applications',
              ],
              ['Offer rate', `${stats.offerRate}%`, 'Offers + accepted ÷ all applications'],
            ].map(([label, value, description]) => (
              <div className="rate-card" key={label}>
                <span>{label}</span>
                <strong>{loading ? '—' : value}</strong>
                <p>{description}</p>
              </div>
            ))}
          </div>
          <div className="charts-grid">
            <section className="chart-card chart-wide">
              <div className="chart-heading">
                <div>
                  <h2>Applications over time</h2>
                  <p>A little consistency goes a long way.</p>
                </div>
                <span className="date-chip">Last 30 days</span>
              </div>
              <div
                className="chart-canvas"
                role="img"
                aria-label={`Daily applications over the last 30 days: ${days.map((d) => `${d.name}: ${d.applications}`).join('; ')}`}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={days} margin={{ top: 15, right: 20, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      minTickGap={45}
                      tick={{ fill: 'var(--muted)', fontSize: 12 }}
                    />
                    <YAxis
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'var(--muted)', fontSize: 12 }}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area
                      name="Applications"
                      type="monotone"
                      dataKey="applications"
                      stroke="var(--accent)"
                      strokeWidth={2.5}
                      fill="url(#areaFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>
            <section className="chart-card">
              <div className="chart-heading">
                <div>
                  <h2>Applications by month</h2>
                  <p>Your activity across the last six months.</p>
                </div>
              </div>
              <div
                className="chart-canvas"
                role="img"
                aria-label={months.map((m) => `${m.name}: ${m.applications}`).join('; ')}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={months} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'var(--muted)', fontSize: 12 }}
                    />
                    <YAxis
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'var(--muted)', fontSize: 12 }}
                    />
                    <Tooltip
                      cursor={{ fill: 'var(--surface-hover)' }}
                      contentStyle={tooltipStyle}
                    />
                    <Bar
                      name="Applications"
                      dataKey="applications"
                      fill="var(--accent)"
                      radius={0}
                      maxBarSize={44}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
            <section className="chart-card">
              <div className="chart-heading">
                <div>
                  <h2>Applications by status</h2>
                  <p>Where your opportunities stand today.</p>
                </div>
              </div>
              {byStatus.length ? (
                <div
                  className="chart-canvas status-chart"
                  style={{ height: Math.max(270, byStatus.length * 34) }}
                  role="img"
                  aria-label={byStatus.map((s) => `${s.name}: ${s.count}`).join('; ')}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={byStatus}
                      layout="vertical"
                      margin={{ top: 0, right: 25, left: 0, bottom: 0 }}
                    >
                      <XAxis type="number" allowDecimals={false} hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={135}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--muted)', fontSize: 12 }}
                      />
                      <Tooltip
                        cursor={{ fill: 'var(--surface-hover)' }}
                        contentStyle={tooltipStyle}
                      />
                      <Bar name="Applications" dataKey="count" radius={0} maxBarSize={17}>
                        {byStatus.map((s) => (
                          <Cell key={s.name} fill={s.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="chart-empty">Add your first application to see your breakdown.</div>
              )}
            </section>
          </div>
          <p className="statistics-note">
            Statistics reflect current statuses. Interview stages are grouped together; offers
            include accepted offers. Rates use all applications as the denominator and do not infer
            previous stages.
          </p>
        </>
      )}
    </>
  );
}
