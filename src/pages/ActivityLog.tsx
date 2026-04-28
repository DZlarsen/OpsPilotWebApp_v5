import { useState } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { format, subHours, subMinutes } from 'date-fns';
import { Activity, AlertTriangle, Bell, ClipboardList, ShieldAlert, Settings, Filter, Search } from 'lucide-react';

interface LogEntry {
  id: string;
  type: 'alert' | 'task' | 'pfmea' | 'setting' | 'process' | 'quality';
  action: string;
  detail: string;
  user: string;
  timestamp: Date;
}

function generateLogs(owners: string[], businessName: string): LogEntry[] {
  const now = new Date();
  const actions: Omit<LogEntry, 'id' | 'timestamp'>[] = [
    { type: 'alert', action: 'Alert acknowledged', detail: 'UCL violation on coating thickness dismissed', user: owners[0] || 'System' },
    { type: 'task', action: 'Task moved to Done', detail: '"Calibrate torque sensor" completed', user: owners[1] || 'System' },
    { type: 'pfmea', action: 'PFMEA updated', detail: 'RPN recalculated for seal integrity failure mode', user: owners[2] || 'System' },
    { type: 'quality', action: 'SPC violation detected', detail: 'Point outside UCL on process line 2', user: 'System' },
    { type: 'process', action: 'Measurement recorded', detail: '47 new data points added to assembly process', user: owners[0] || 'System' },
    { type: 'setting', action: 'Notification preferences updated', detail: 'Email alerts enabled for critical SPC violations', user: owners[3] || 'System' },
    { type: 'task', action: 'Task created', detail: '"Investigate cycle time drift" added to backlog', user: owners[1] || 'System' },
    { type: 'alert', action: 'Critical alert triggered', detail: 'Consecutive out-of-control points detected', user: 'System' },
    { type: 'pfmea', action: 'Action item closed', detail: 'Preventive maintenance SOP documented', user: owners[2] || 'System' },
    { type: 'quality', action: 'Cpk report generated', detail: 'Weekly capability analysis for all lines', user: 'System' },
    { type: 'task', action: 'Task reassigned', detail: '"Review BOM revision" assigned to new owner', user: owners[0] || 'System' },
    { type: 'process', action: 'Control limits updated', detail: 'UCL/LCL recalculated after process improvement', user: owners[3] || 'System' },
    { type: 'alert', action: 'Alert escalated', detail: 'Unacknowledged warning alert auto-escalated to critical', user: 'System' },
    { type: 'setting', action: 'Theme changed', detail: 'Switched to light mode', user: owners[1] || 'System' },
    { type: 'task', action: 'Task moved to In Progress', detail: '"Audit packaging line" started', user: owners[2] || 'System' },
  ];

  return actions.map((a, i) => ({
    ...a,
    id: `log-${i}`,
    timestamp: subMinutes(subHours(now, Math.floor(i / 3)), (i % 3) * 22 + i * 7),
  }));
}

const typeConfig: Record<string, { icon: typeof Activity; color: string }> = {
  alert: { icon: Bell, color: 'text-status-critical bg-status-critical/10' },
  task: { icon: ClipboardList, color: 'text-chart-blue bg-chart-blue/10' },
  pfmea: { icon: ShieldAlert, color: 'text-chart-orange bg-chart-orange/10' },
  setting: { icon: Settings, color: 'text-muted-foreground bg-secondary' },
  process: { icon: Activity, color: 'text-chart-green bg-chart-green/10' },
  quality: { icon: AlertTriangle, color: 'text-status-warning bg-status-warning/10' },
};

export default function ActivityLog() {
  const { owners, activeBusiness } = useBusiness();
  const [filterType, setFilterType] = useState<string>('all');
  const [search, setSearch] = useState('');

  const logs = generateLogs(owners, activeBusiness.name);
  const filtered = logs
    .filter(l => filterType === 'all' || l.type === filterType)
    .filter(l => !search || l.action.toLowerCase().includes(search.toLowerCase()) || l.detail.toLowerCase().includes(search.toLowerCase()));

  const types = ['all', 'alert', 'task', 'pfmea', 'quality', 'process', 'setting'];

  return (
    <div className="space-y-6">
      <div>
        <div className="page-header flex items-center gap-3 mb-2">
            <span className="page-callout">15</span>
            <span className="page-eyebrow">System · Activity</span>
          </div>
          <h1 className="page-title">Activity Log</h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mt-2">{activeBusiness.name} — Audit trail of recent actions</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search activity..."
            className="w-full pl-9 pr-3 py-2 rounded-md border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex items-center gap-1">
          <Filter className="h-4 w-4 text-muted-foreground mr-1" />
          {types.map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                filterType === t ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />
        <div className="space-y-1">
          {filtered.map((log, i) => {
            const cfg = typeConfig[log.type];
            const Icon = cfg.icon;
            const prevLog = filtered[i - 1];
            const showDate = !prevLog || format(log.timestamp, 'MMM d') !== format(prevLog.timestamp, 'MMM d');

            return (
              <div key={log.id}>
                {showDate && (
                  <div className="flex items-center gap-3 py-2 ml-10">
                    <span className="text-xs font-semibold text-muted-foreground">{format(log.timestamp, 'EEEE, MMM d')}</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                )}
                <div className="flex items-start gap-3 py-2 px-2 rounded-md hover:bg-secondary/30 transition-colors group">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0 z-10 ${cfg.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{log.action}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground capitalize">{log.type}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{log.detail}</p>
                  </div>
                  <div className="text-right flex-shrink-0 pt-0.5">
                    <p className="text-xs text-muted-foreground">{format(log.timestamp, 'HH:mm')}</p>
                    <p className="text-[10px] text-muted-foreground/60">{log.user}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
