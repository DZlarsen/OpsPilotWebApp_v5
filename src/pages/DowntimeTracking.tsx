import { useState } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { useNavigate } from 'react-router-dom';
import { Clock, PauseCircle, PlayCircle, AlertTriangle, Wrench, Calendar, Plus, X, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { format, subDays, differenceInMinutes } from 'date-fns';
import StatusBadge from '@/components/shared/StatusBadge';
import PMSchedule from '@/components/downtime/PMSchedule';
import { toast } from 'sonner';

interface DowntimeEvent {
  id: string;
  processId: string;
  processName: string;
  type: 'planned' | 'unplanned';
  reason: string;
  reasonCode: string;
  startTime: string;
  endTime: string;
  durationMin: number;
  notes: string;
  reportedBy: string;
}

function generateDowntimeData(processes: { id: string; name: string }[]): DowntimeEvent[] {
  const plannedReasons = [
    { reason: 'Scheduled Maintenance', code: 'PM-001' },
    { reason: 'Tool Changeover', code: 'TC-001' },
    { reason: 'Shift Break', code: 'SB-001' },
    { reason: 'Calibration', code: 'CAL-001' },
    { reason: 'Material Loading', code: 'ML-001' },
  ];
  const unplannedReasons = [
    { reason: 'Equipment Failure', code: 'EF-001' },
    { reason: 'Material Shortage', code: 'MS-001' },
    { reason: 'Quality Hold', code: 'QH-001' },
    { reason: 'Power Outage', code: 'PO-001' },
    { reason: 'Operator Error', code: 'OE-001' },
    { reason: 'Sensor Malfunction', code: 'SM-001' },
  ];
  const reporters = ['A. Smith', 'B. Jones', 'C. Lee', 'D. Garcia', 'E. Wilson'];
  const events: DowntimeEvent[] = [];

  processes.forEach((proc) => {
    for (let d = 0; d < 14; d++) {
      const date = subDays(new Date(), d);
      // 1-3 events per day per process
      const count = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        const isPlanned = Math.random() > 0.4;
        const pool = isPlanned ? plannedReasons : unplannedReasons;
        const picked = pool[Math.floor(Math.random() * pool.length)];
        const startHour = 6 + Math.floor(Math.random() * 14);
        const dur = isPlanned ? 15 + Math.floor(Math.random() * 60) : 5 + Math.floor(Math.random() * 120);
        const start = new Date(date);
        start.setHours(startHour, Math.floor(Math.random() * 60));
        const end = new Date(start.getTime() + dur * 60000);

        events.push({
          id: `dt-${proc.id}-${d}-${i}`,
          processId: proc.id,
          processName: proc.name.split('—')[0].trim(),
          type: isPlanned ? 'planned' : 'unplanned',
          reason: picked.reason,
          reasonCode: picked.code,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          durationMin: dur,
          notes: '',
          reportedBy: reporters[Math.floor(Math.random() * reporters.length)],
        });
      }
    }
  });

  return events.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
}

export default function DowntimeTracking() {
  const navigate = useNavigate();
  const { processes, activeBusiness } = useBusiness();
  const [events, setEvents] = useState(() => generateDowntimeData(processes));
  const [filter, setFilter] = useState<'all' | 'planned' | 'unplanned'>('all');
  const [processFilter, setProcessFilter] = useState('all');
  const [logOpen, setLogOpen] = useState(false);

  const filtered = events.filter(e => {
    if (filter !== 'all' && e.type !== filter) return false;
    if (processFilter !== 'all' && e.processId !== processFilter) return false;
    return true;
  });

  // Summary stats
  const totalPlanned = events.filter(e => e.type === 'planned').reduce((s, e) => s + e.durationMin, 0);
  const totalUnplanned = events.filter(e => e.type === 'unplanned').reduce((s, e) => s + e.durationMin, 0);
  const totalDowntime = totalPlanned + totalUnplanned;

  // Chart: downtime by reason
  const byReason: Record<string, { planned: number; unplanned: number }> = {};
  events.forEach(e => {
    if (!byReason[e.reason]) byReason[e.reason] = { planned: 0, unplanned: 0 };
    byReason[e.reason][e.type] += e.durationMin;
  });
  const reasonChart = Object.entries(byReason)
    .map(([reason, data]) => ({ reason: reason.length > 18 ? reason.slice(0, 18) + '…' : reason, planned: data.planned, unplanned: data.unplanned, total: data.planned + data.unplanned }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  // Chart: downtime by process
  const byProcess: Record<string, { name: string; planned: number; unplanned: number }> = {};
  events.forEach(e => {
    if (!byProcess[e.processId]) byProcess[e.processId] = { name: e.processName, planned: 0, unplanned: 0 };
    byProcess[e.processId][e.type] += e.durationMin;
  });
  const processChart = Object.values(byProcess).map(d => ({
    name: d.name,
    planned: Math.round(d.planned / 60),
    unplanned: Math.round(d.unplanned / 60),
  }));

  // Pie: planned vs unplanned
  const pieData = [
    { name: 'Planned', value: totalPlanned, fill: 'hsl(var(--chart-blue))' },
    { name: 'Unplanned', value: totalUnplanned, fill: 'hsl(var(--status-critical))' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="page-header flex items-center gap-3 mb-2">
            <span className="page-callout">11</span>
            <span className="page-eyebrow">Production · Downtime</span>
          </div>
          <h1 className="page-title">Downtime Tracking</h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mt-2">{activeBusiness.name} — Planned vs. unplanned downtime analysis</p>
        </div>
        <button
          onClick={() => setLogOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Log Downtime
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="kpi-card text-center py-5">
          <Clock className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
          <p className="text-2xl font-bold font-mono">{Math.round(totalDowntime / 60)}h</p>
          <p className="text-xs text-muted-foreground mt-1">Total Downtime (14d)</p>
        </div>
        <div className="kpi-card text-center py-5 cursor-pointer hover:border-primary/40 transition-all" onClick={() => setFilter('planned')}>
          <PauseCircle className="h-5 w-5 mx-auto text-chart-blue mb-2" />
          <p className="text-2xl font-bold font-mono">{Math.round(totalPlanned / 60)}h</p>
          <p className="text-xs text-muted-foreground mt-1">Planned</p>
        </div>
        <div className="kpi-card text-center py-5 cursor-pointer hover:border-primary/40 transition-all" onClick={() => setFilter('unplanned')}>
          <AlertTriangle className="h-5 w-5 mx-auto text-status-critical mb-2" />
          <p className="text-2xl font-bold font-mono">{Math.round(totalUnplanned / 60)}h</p>
          <p className="text-xs text-muted-foreground mt-1">Unplanned</p>
        </div>
        <div className="kpi-card text-center py-5 cursor-pointer hover:border-primary/40 transition-all" onClick={() => navigate('/oee')}>
          <Wrench className="h-5 w-5 mx-auto text-status-warning mb-2" />
          <p className="text-2xl font-bold font-mono">{events.filter(e => e.type === 'unplanned').length}</p>
          <p className="text-xs text-muted-foreground mt-1">Unplanned Events</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* By Process */}
        <div className="kpi-card lg:col-span-2">
          <h3 className="section-header">Downtime by Process (hours)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={processChart} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12, color: 'hsl(var(--popover-foreground))' }} />
              <Bar dataKey="planned" stackId="a" fill="hsl(var(--chart-blue))" name="Planned (h)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="unplanned" stackId="a" fill="hsl(var(--status-critical))" name="Unplanned (h)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie */}
        <div className="kpi-card">
          <h3 className="section-header">Planned vs Unplanned</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12, color: 'hsl(var(--popover-foreground))' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: d.fill }} />
                <span className="flex-1 text-muted-foreground">{d.name}</span>
                <span className="font-mono font-medium">{Math.round(d.value / 60)}h</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pareto by reason */}
      <div className="kpi-card">
        <h3 className="section-header">Top Downtime Reasons (minutes)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={reasonChart}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="reason" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval={0} angle={-20} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12, color: 'hsl(var(--popover-foreground))' }} />
            <Bar dataKey="planned" stackId="a" fill="hsl(var(--chart-blue))" name="Planned" />
            <Bar dataKey="unplanned" stackId="a" fill="hsl(var(--status-critical))" name="Unplanned" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* PM Schedule */}
      <PMSchedule processes={processes} />

      {/* Event log */}
      <div className="kpi-card">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="section-header mb-0">Recent Events</h3>
          <div className="flex items-center gap-2">
            <select
              value={processFilter}
              onChange={e => setProcessFilter(e.target.value)}
              className="px-2 py-1 rounded-md border border-border bg-secondary/50 text-xs"
            >
              <option value="all">All Processes</option>
              {processes.map(p => <option key={p.id} value={p.id}>{p.name.split('—')[0].trim()}</option>)}
            </select>
            <div className="flex gap-1">
              {(['all', 'planned', 'unplanned'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'}`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date/Time</th>
                <th>Process</th>
                <th>Type</th>
                <th>Reason</th>
                <th>Code</th>
                <th>Duration</th>
                <th>Reported By</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 20).map(e => (
                <tr key={e.id}>
                  <td className="font-mono text-xs whitespace-nowrap">{format(new Date(e.startTime), 'MMM d, HH:mm')}</td>
                  <td className="font-medium text-sm">{e.processName}</td>
                  <td>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      e.type === 'planned' ? 'bg-chart-blue/15 text-chart-blue' : 'bg-status-critical/15 text-status-critical'
                    }`}>
                      {e.type === 'planned' ? <PauseCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                      {e.type}
                    </span>
                  </td>
                  <td className="text-sm">{e.reason}</td>
                  <td className="font-mono text-xs text-muted-foreground">{e.reasonCode}</td>
                  <td className="font-mono text-sm">{e.durationMin}m</td>
                  <td className="text-muted-foreground text-xs">{e.reportedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Downtime Modal */}
      {logOpen && (
        <LogDowntimeModal
          processes={processes}
          onClose={() => setLogOpen(false)}
          onSubmit={(event) => {
            setEvents(prev => [event, ...prev]);
            setLogOpen(false);
            toast.success(`Logged ${event.durationMin}m ${event.type} downtime · ${event.processName}`);
          }}
        />
      )}
    </div>
  );
}

/* ── Log Downtime Modal ── */
function LogDowntimeModal({
  processes,
  onClose,
  onSubmit,
}: {
  processes: { id: string; name: string }[];
  onClose: () => void;
  onSubmit: (event: DowntimeEvent) => void;
}) {
  const plannedReasons = [
    { reason: 'Scheduled Maintenance', code: 'PM-001' },
    { reason: 'Tool Changeover',       code: 'TC-001' },
    { reason: 'Shift Break',           code: 'SB-001' },
    { reason: 'Calibration',           code: 'CAL-001' },
    { reason: 'Material Loading',      code: 'ML-001' },
  ];
  const unplannedReasons = [
    { reason: 'Equipment Failure',     code: 'EF-001' },
    { reason: 'Material Shortage',     code: 'MS-001' },
    { reason: 'Quality Hold',          code: 'QH-001' },
    { reason: 'Power Outage',          code: 'PO-001' },
    { reason: 'Operator Error',        code: 'OE-001' },
    { reason: 'Sensor Malfunction',    code: 'SM-001' },
  ];

  const [form, setForm] = useState({
    processId: processes[0]?.id || '',
    type: 'unplanned' as 'planned' | 'unplanned',
    reasonCode: unplannedReasons[0].code,
    startTime: format(new Date(Date.now() - 30 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
    endTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    notes: '',
    reportedBy: '',
  });

  const currentReasonList = form.type === 'planned' ? plannedReasons : unplannedReasons;

  // When type flips, default to first reason of that type
  const handleTypeChange = (type: 'planned' | 'unplanned') => {
    const list = type === 'planned' ? plannedReasons : unplannedReasons;
    setForm(f => ({ ...f, type, reasonCode: list[0].code }));
  };

  const selectedReason = currentReasonList.find(r => r.code === form.reasonCode) || currentReasonList[0];
  const processObj = processes.find(p => p.id === form.processId);
  const durationMin = Math.max(1, differenceInMinutes(new Date(form.endTime), new Date(form.startTime)));

  const canSubmit = form.processId && form.reasonCode && form.startTime && form.endTime && form.reportedBy.trim().length > 0 && durationMin > 0;

  const handleSubmit = () => {
    if (!canSubmit || !processObj) return;
    const event: DowntimeEvent = {
      id: `dt-${Date.now()}`,
      processId: form.processId,
      processName: processObj.name,
      type: form.type,
      reason: selectedReason.reason,
      reasonCode: selectedReason.code,
      startTime: new Date(form.startTime).toISOString(),
      endTime: new Date(form.endTime).toISOString(),
      durationMin,
      notes: form.notes.trim(),
      reportedBy: form.reportedBy.trim(),
    };
    onSubmit(event);
  };

  const inputClass = 'w-full rounded-[var(--radius)] border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring';
  const labelClass = 'text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card border border-border shadow-2xl max-h-[90vh] overflow-y-auto" style={{ borderRadius: 'var(--radius)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Downtime Entry</h2>
            <p className="font-semibold mt-0.5">Log a new downtime event</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center hover:bg-secondary/70 transition-colors" style={{ borderRadius: 'var(--radius)' }}>
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Type toggle */}
          <div>
            <label className={labelClass}>Type</label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {(['planned', 'unplanned'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => handleTypeChange(t)}
                  className={`px-3 py-2 font-mono text-xs uppercase tracking-wider border transition-colors ${
                    form.type === t
                      ? t === 'planned'
                        ? 'border-chart-blue/60 bg-chart-blue/10 text-chart-blue'
                        : 'border-status-warning/60 bg-status-warning/10 text-status-warning'
                      : 'border-border bg-secondary/30 text-muted-foreground hover:text-foreground'
                  }`}
                  style={{ borderRadius: 'var(--radius)' }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>Process</label>
            <select className={inputClass + ' mt-1.5'} value={form.processId} onChange={e => setForm(f => ({ ...f, processId: e.target.value }))}>
              {processes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label className={labelClass}>Reason</label>
            <select className={inputClass + ' mt-1.5'} value={form.reasonCode} onChange={e => setForm(f => ({ ...f, reasonCode: e.target.value }))}>
              {currentReasonList.map(r => (
                <option key={r.code} value={r.code}>{r.reason} · {r.code}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Start</label>
              <input type="datetime-local" className={inputClass + ' mt-1.5'} value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
            </div>
            <div>
              <label className={labelClass}>End</label>
              <input type="datetime-local" className={inputClass + ' mt-1.5'} value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border border-border bg-secondary/20" style={{ borderRadius: 'var(--radius)' }}>
            <span className={labelClass}>Duration</span>
            <span className="font-mono text-lg font-bold tabular-nums">{durationMin}m <span className="text-xs text-muted-foreground ml-1">({(durationMin / 60).toFixed(1)}h)</span></span>
          </div>

          <div>
            <label className={labelClass}>Reported by</label>
            <input
              className={inputClass + ' mt-1.5'}
              placeholder="Name or initials"
              value={form.reportedBy}
              onChange={e => setForm(f => ({ ...f, reportedBy: e.target.value }))}
            />
          </div>

          <div>
            <label className={labelClass}>Notes (optional)</label>
            <textarea
              className={inputClass + ' mt-1.5 resize-none'}
              rows={3}
              placeholder="Context, root cause, corrective action..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-mono text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ borderRadius: 'var(--radius)' }}
          >
            <Plus className="h-3 w-3" />
            Log Event
          </button>
        </div>
      </div>
    </div>
  );
}
