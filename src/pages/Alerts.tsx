import { useBusiness } from '@/contexts/BusinessContext';
import StatusBadge from '@/components/shared/StatusBadge';
import { Bell, Check, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';

export default function Alerts() {
  const { alerts, processes, activeBusiness } = useBusiness();
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [acknowledged, setAcknowledged] = useState<Set<string>>(
    new Set(alerts.filter(a => a.acknowledged).map(a => a.id))
  );
  useEffect(() => { setAcknowledged(new Set(alerts.filter(a => a.acknowledged).map(a => a.id))); }, [activeBusiness.id]);

  const filtered = alerts
    .filter(a => filter === 'all' || a.severity === filter)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const toggleAck = (id: string) => {
    setAcknowledged(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="page-header flex items-center gap-3 mb-2">
          <span className="page-callout">05</span>
          <span className="page-eyebrow">Alerts Center</span>
        </div>
        <h1 className="page-title">Alerts</h1>
        <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mt-2">
          {alerts.filter(a => !acknowledged.has(a.id)).length} unacknowledged · Filter by severity
        </p>
      </div>

      <div className="flex gap-2">
        {(['all', 'critical', 'warning', 'info'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
              filter === f
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-secondary/50 text-secondary-foreground border-border hover:bg-secondary'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((alert) => {
          const process = processes.find(p => p.id === alert.processId);
          const isAcked = acknowledged.has(alert.id);

          return (
            <div
              key={alert.id}
              className={`kpi-card flex items-start gap-4 transition-opacity ${isAcked ? 'opacity-50' : ''}`}
            >
              <div className={`mt-1 h-3 w-3 rounded-full flex-shrink-0 ${
                alert.severity === 'critical' ? 'bg-status-critical animate-pulse-glow' :
                alert.severity === 'warning' ? 'bg-status-warning' : 'bg-status-ok'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <StatusBadge status={alert.severity === 'info' ? 'ok' : alert.severity} label={alert.type} />
                  <span className="text-[10px] text-muted-foreground">{process?.name.split('—')[0].trim()}</span>
                </div>
                <p className="text-sm font-medium">{alert.message}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {format(new Date(alert.timestamp), 'MMM d, yyyy HH:mm')}
                </div>
              </div>
              <button
                onClick={() => toggleAck(alert.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex-shrink-0 ${
                  isAcked
                    ? 'bg-status-ok/10 text-status-ok border border-status-ok/30'
                    : 'bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80'
                }`}
              >
                <Check className="h-3 w-3" />
                {isAcked ? 'Acked' : 'Acknowledge'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
