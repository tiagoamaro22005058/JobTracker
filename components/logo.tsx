import { ChartNoAxesColumnIncreasing } from 'lucide-react';
export function Logo() {
  return (
    <span className="brand">
      <span className="brand-icon">
        <ChartNoAxesColumnIncreasing size={23} strokeWidth={2.8} />
      </span>
      JobTrack<span className="brand-dot">.</span>
    </span>
  );
}
