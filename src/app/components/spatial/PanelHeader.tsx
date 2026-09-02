import { ReactNode } from 'react';

interface PanelHeaderProps {
  breadcrumb: string;
  title: ReactNode;
}

/** Light-panel header: micro-copy breadcrumb above the primary title. */
export function PanelHeader({ breadcrumb, title }: PanelHeaderProps) {
  return (
    <>
      <div className="text-[10px] uppercase tracking-wider text-[#808080] mb-2 font-semibold">
        {breadcrumb}
      </div>
      <h1 className="text-[26px] font-medium text-[#111111] mb-6 leading-tight">{title}</h1>
    </>
  );
}

interface PanelMetricProps {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  /** Renders the value in the alert colour */
  alert?: boolean;
}

/** One cell of the metadata row under a panel title. */
export function PanelMetric({ icon, label, value, alert }: PanelMetricProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] text-[#808080]">{label}</span>
      <span
        className={`flex items-center gap-1.5 text-sm font-semibold ${
          alert ? 'text-[#FF3B30]' : 'text-[#111111]'
        }`}
      >
        {icon}
        {value}
      </span>
    </div>
  );
}

/** Oversized data value with supporting micro-copy, per the type scale. */
export function PanelStat({ value, caption }: { value: ReactNode; caption: ReactNode }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[38px] font-bold text-[#111111] tracking-tight leading-none">
        {value}
      </span>
      <span className="text-[10px] text-[#808080] leading-tight">{caption}</span>
    </div>
  );
}

/** Small uppercase section divider used down the light panel. */
export function PanelSection({
  label,
  children,
  className = '',
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-[10px] uppercase tracking-wider text-[#808080] mb-4 font-semibold">
        {label}
      </div>
      {children}
    </div>
  );
}
