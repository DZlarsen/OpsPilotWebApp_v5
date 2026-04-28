interface StatusBadgeProps {
  status: 'ok' | 'warning' | 'critical' | 'info' | 'stable' | 'open' | 'in-progress' | 'closed' | 'new' | 'reviewed' | 'implemented';
  label?: string;
}

const statusMap: Record<string, { className: string; defaultLabel: string }> = {
  ok: { className: 'status-badge-ok', defaultLabel: 'OK' },
  stable: { className: 'status-badge-ok', defaultLabel: 'Stable' },
  closed: { className: 'status-badge-ok', defaultLabel: 'Closed' },
  implemented: { className: 'status-badge-ok', defaultLabel: 'Implemented' },
  warning: { className: 'status-badge-warning', defaultLabel: 'Warning' },
  'in-progress': { className: 'status-badge-warning', defaultLabel: 'In Progress' },
  reviewed: { className: 'status-badge-warning', defaultLabel: 'Reviewed' },
  info: { className: 'status-badge-ok', defaultLabel: 'Info' },
  critical: { className: 'status-badge-critical', defaultLabel: 'Critical' },
  open: { className: 'status-badge-critical', defaultLabel: 'Open' },
  new: { className: 'status-badge-critical', defaultLabel: 'New' },
};

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusMap[status] || statusMap.ok;
  return (
    <span className={config.className}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label || config.defaultLabel}
    </span>
  );
}
