import { useState, useEffect } from 'react';
import { Process } from '@/data/mock-data';
import { useBusiness } from '@/contexts/BusinessContext';
import StatusBadge from '@/components/shared/StatusBadge';
import ControlChart, { ChartSettings, defaultChartSettings } from '@/components/shared/ControlChart';
import ChartSettingsMenu from '@/components/shared/ChartSettingsMenu';
import RangeChart from '@/components/charts/RangeChart';
import HistogramChart from '@/components/charts/HistogramChart';
import DefectBarChart from '@/components/charts/DefectBarChart';
import ThroughputChart from '@/components/charts/ThroughputChart';
import CycleTimeChart from '@/components/charts/CycleTimeChart';
import { Activity, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

type ChartType = 'control' | 'range' | 'histogram' | 'defects' | 'throughput' | 'cycleTime';

const chartOptions: { type: ChartType; label: string }[] = [
  { type: 'control', label: 'X̄ Control' },
  { type: 'range', label: 'Moving Range' },
  { type: 'histogram', label: 'Histogram' },
  { type: 'defects', label: 'Defect Pareto' },
  { type: 'throughput', label: 'Throughput' },
  { type: 'cycleTime', label: 'Cycle Time' },
];

export default function Processes() {
  const { processes, getMeasurements, getProcessStats, activeBusiness } = useBusiness();
  const [expandedId, setExpandedId] = useState<string | null>(processes[0]?.id || null);
  const [chartSettingsMap, setChartSettingsMap] = useState<Record<string, ChartSettings>>({});
  const [chartTypeMap, setChartTypeMap] = useState<Record<string, ChartType>>({});
  const [addOpen, setAddOpen] = useState(false);
  const [processList, setProcessList] = useState(processes);
  useEffect(() => { setProcessList(processes); setExpandedId(processes[0]?.id || null); setChartSettingsMap({}); setChartTypeMap({}); }, [activeBusiness.id]);
  const [form, setForm] = useState({
    name: '',
    category: '',
    description: '',
    owner: '',
    targetMetric: '',
    unit: '',
    ucl: '',
    lcl: '',
  });

  const handleSubmit = () => {
    if (!form.name || !form.category || !form.owner || !form.targetMetric) {
      toast.error('Please fill in all required fields');
      return;
    }
    const target = parseFloat(form.targetMetric);
    const ucl = form.ucl ? parseFloat(form.ucl) : target * 1.05;
    const lcl = form.lcl ? parseFloat(form.lcl) : target * 0.95;
    const newProcess: Process = {
      id: `proc-${Date.now()}`,
      name: form.name,
      category: form.category,
      description: form.description,
      owner: form.owner,
      targetMetric: target,
      unit: form.unit || 'units',
      status: 'stable',
      ucl,
      lcl,
      cl: target,
    };
    setProcessList([...processList, newProcess]);
    setForm({ name: '', category: '', description: '', owner: '', targetMetric: '', unit: '', ucl: '', lcl: '' });
    setAddOpen(false);
    toast.success(`Process "${form.name}" created successfully`);
  };

  const renderChart = (processId: string, process: Process, measurements: any[], height: number) => {
    const type = chartTypeMap[processId] || 'control';
    const settings = chartSettingsMap[processId] || defaultChartSettings;
    const tf = settings.timeframe;
    switch (type) {
      case 'control':    return <ControlChart measurements={measurements} process={process} height={height} settings={settings} />;
      case 'range':      return <RangeChart height={height} timeframe={tf} process={process} />;
      case 'histogram':  return <HistogramChart height={height} process={process} />;
      case 'defects':    return <DefectBarChart height={height} processId={process.id} />;
      case 'throughput': return <ThroughputChart height={height} timeframe={tf} process={process} />;
      case 'cycleTime':  return <CycleTimeChart height={height} timeframe={tf} process={process} />;
    }
  };

  const inputClass = 'w-full rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring';
  const labelClass = 'text-xs font-medium text-muted-foreground uppercase tracking-wider';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="page-header flex items-center gap-3 mb-2">
            <span className="page-callout">04</span>
            <span className="page-eyebrow">Production · Processes</span>
          </div>
          <h1 className="page-title">Process Tracking</h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mt-2">
            Define, monitor, and track manufacturing processes
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Process
        </button>
      </div>

      <div className="space-y-3">
        {processList.map((process) => {
          const isExpanded = expandedId === process.id;
          const measurements = getMeasurements(process.id);
          const recentMeasurements = measurements.slice(-40);
          const hasData = measurements.length > 0;
          const stats = hasData ? getProcessStats(process.id) : null;
          const currentChartType = chartTypeMap[process.id] || 'control';

          return (
            <div key={process.id} className="kpi-card">
              <button
                className="w-full flex items-center gap-4 text-left"
                onClick={() => setExpandedId(isExpanded ? null : process.id)}
              >
                <Activity className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold">{process.name}</h3>
                    <StatusBadge status={process.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{process.category} · {process.owner}</p>
                </div>
                <div className="hidden sm:flex items-center gap-6 text-xs text-muted-foreground">
                  <span>Target: <span className="font-mono text-foreground">{process.targetMetric} {process.unit}</span></span>
                  {stats && (
                    <span>Cpk: <span className={`font-mono ${stats.cpk >= 1.33 ? 'text-status-ok' : stats.cpk >= 1 ? 'text-status-warning' : 'text-status-critical'}`}>{stats.cpk}</span></span>
                  )}
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>

              {isExpanded && hasData && stats && (
                <div className="mt-4 space-y-4 border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground">{process.description}</p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-md bg-secondary/50">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Mean</span>
                      <p className="text-lg font-mono font-bold">{stats.mean}</p>
                    </div>
                    <div className="p-3 rounded-md bg-secondary/50">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Std Dev</span>
                      <p className="text-lg font-mono font-bold">{stats.stdDev}</p>
                    </div>
                    <div className="p-3 rounded-md bg-secondary/50">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">OOC Points</span>
                      <p className={`text-lg font-mono font-bold ${stats.oocCount > 0 ? 'text-status-critical' : 'text-status-ok'}`}>{stats.oocCount}</p>
                    </div>
                    <div className="p-3 rounded-md bg-secondary/50">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Points</span>
                      <p className="text-lg font-mono font-bold">{stats.totalPoints}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">{chartOptions.find(c => c.type === currentChartType)?.label} — last {(() => { const tf = (chartSettingsMap[process.id] || defaultChartSettings).timeframe; return tf < 60 ? `${tf}m` : tf < 1440 ? `${tf / 60}h` : `${Math.round(tf / 1440)}d`; })()}</span>
                    <ChartSettingsMenu
                      settings={chartSettingsMap[process.id] || defaultChartSettings}
                      onChange={(s) => setChartSettingsMap(prev => ({ ...prev, [process.id]: s }))}
                    />
                  </div>

                  <div className="flex gap-1.5 flex-wrap mb-3">
                    {chartOptions.map((opt) => (
                      <button
                        key={opt.type}
                        onClick={() => setChartTypeMap(prev => ({ ...prev, [process.id]: opt.type }))}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors border ${
                          currentChartType === opt.type
                            ? 'bg-primary/10 text-primary border-primary/30'
                            : 'bg-secondary/30 text-muted-foreground border-border hover:bg-secondary/60'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {renderChart(process.id, process, recentMeasurements, 240)}

                  <div>
                    <h4 className="section-header">Recent Measurements</h4>
                    <div className="max-h-48 overflow-auto rounded-md border border-border">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Timestamp</th>
                            <th>Value</th>
                            <th>Operator</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {measurements.slice(-10).reverse().map((m) => {
                            const isOOC = m.value > process.ucl || m.value < process.lcl;
                            return (
                              <tr key={m.id}>
                                <td className="font-mono text-xs">{format(new Date(m.timestamp), 'MMM d, HH:mm')}</td>
                                <td className={`font-mono font-medium ${isOOC ? 'text-status-critical' : ''}`}>{m.value}</td>
                                <td className="text-muted-foreground">{m.operator}</td>
                                <td>{isOOC ? <StatusBadge status="critical" label="OOC" /> : <StatusBadge status="ok" label="In Control" />}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {isExpanded && !hasData && (
                <div className="mt-4 border-t border-border pt-4 text-center py-8">
                  <p className="text-sm text-muted-foreground">No measurement data yet. Start collecting data to see charts and analysis.</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Process</DialogTitle>
            <DialogDescription>Define a new manufacturing process to monitor.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelClass}>Process Name *</label>
                <input className={inputClass} placeholder="e.g. CNC Turning — Shaft" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Category *</label>
                <select className={inputClass} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  <option value="">Select...</option>
                  <option>Machining</option>
                  <option>Molding</option>
                  <option>Assembly</option>
                  <option>Packaging</option>
                  <option>Welding</option>
                  <option>Inspection</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>Description</label>
              <textarea className={`${inputClass} resize-none`} rows={2} placeholder="Brief description of the process..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelClass}>Owner *</label>
                <input className={inputClass} placeholder="e.g. Mike Chen" value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Measurement Unit</label>
                <input className={inputClass} placeholder="e.g. mm, seconds, defects/100" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className={labelClass}>Target Metric *</label>
                <input className={inputClass} type="number" step="any" placeholder="25.400" value={form.targetMetric} onChange={e => setForm({ ...form, targetMetric: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>UCL</label>
                <input className={inputClass} type="number" step="any" placeholder="Auto" value={form.ucl} onChange={e => setForm({ ...form, ucl: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>LCL</label>
                <input className={inputClass} type="number" step="any" placeholder="Auto" value={form.lcl} onChange={e => setForm({ ...form, lcl: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setAddOpen(false)} className="px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
            <button onClick={handleSubmit} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              Create Process
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
