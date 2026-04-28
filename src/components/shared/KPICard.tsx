import { LucideIcon, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface KPICardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'flat';
  trendValue?: string;
  status?: 'ok' | 'warning' | 'critical';
  href?: string;
}

export default function KPICard({
  label,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  status,
  href,
}: KPICardProps) {
  const navigate = useNavigate();

  const statusBorder =
    status === 'critical'
      ? 'border-status-critical/40'
      : status === 'warning'
      ? 'border-status-warning/40'
      : '';

  // Note: trend "up" means "value went up." Semantics (good/bad) depend on the metric,
  // so we default to a neutral muted color. Callers can wrap for explicit coloring.
  const trendColor =
    trend === 'up'
      ? 'text-status-critical'
      : trend === 'down'
      ? 'text-status-ok'
      : 'text-muted-foreground';
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus;

  const clickable = !!href;

  return (
    <div
      className={`kpi-card bp-ticks ${statusBorder} ${
        clickable ? 'cursor-pointer hover:border-primary/40' : ''
      }`}
      onClick={clickable ? () => navigate(href!) : undefined}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="bp-tile-label">{label}</span>
        <Icon className="h-3.5 w-3.5 text-muted-foreground/80" strokeWidth={1.5} />
      </div>
      <div className="bp-tile-value">{value}</div>
      <div className="mt-2 flex items-center justify-between gap-2 min-h-[14px]">
        {subtitle && (
          <span className="font-mono text-[10px] text-muted-foreground/80 truncate">{subtitle}</span>
        )}
        {trendValue && (
          <span className={`bp-tile-delta ${trendColor} ml-auto`}>
            <TrendIcon className="h-3 w-3" strokeWidth={2.5} />
            {trendValue}
          </span>
        )}
      </div>
    </div>
  );
}
