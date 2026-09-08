import {
  BriefcaseBusiness,
  Clock3,
  MessagesSquare,
  Gift,
  CircleX,
  Ghost,
  ArrowUpRight,
} from 'lucide-react';
import type { Application } from '@/types/application';
import { summarize } from '@/lib/applications';
export function SummaryCards({
  applications,
  loading = false,
}: {
  applications: Application[];
  loading?: boolean;
}) {
  const s = summarize(applications);
  const cards = [
    {
      label: 'Total applications',
      value: s.total,
      Icon: BriefcaseBusiness,
      color: 'teal',
      detail: 'Your search so far',
    },
    {
      label: 'Waiting',
      value: s.waiting,
      Icon: Clock3,
      color: 'amber',
      detail: 'Awaiting a response',
    },
    {
      label: 'Interviews',
      value: s.interviews,
      Icon: MessagesSquare,
      color: 'purple',
      detail: 'Conversations in motion',
    },
    {
      label: 'Offers',
      value: s.offers,
      Icon: Gift,
      color: 'green',
      detail: 'Open & accepted offers',
    },
    {
      label: 'Rejected',
      value: s.rejected,
      Icon: CircleX,
      color: 'red',
      detail: 'New directions ahead',
    },
    {
      label: 'Ghosted',
      value: s.ghosted,
      Icon: Ghost,
      color: 'gray',
      detail: 'No response received',
    },
  ];
  return (
    <div className="summary-grid">
      {cards.map(({ label, value, Icon, color, detail }, i) => (
        <div className={`summary-card ${i === 0 ? 'summary-featured' : ''}`} key={label}>
          <div className="summary-top">
            <span>{label}</span>
            <Icon size={17} className={`metric-icon metric-${color}`} />
          </div>
          <strong>
            {loading ? '—' : value}
            <span>{i === 0 && <ArrowUpRight size={23} />}</span>
          </strong>
          <small>{detail}</small>
        </div>
      ))}
    </div>
  );
}
