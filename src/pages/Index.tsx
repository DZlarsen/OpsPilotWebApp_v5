import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Clock,
  Lightbulb,
  ShieldAlert,
  Eye,
  EyeOff,
  Sliders,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Maximize2,
  Minimize2,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Download,
} from 'lucide-react';
import KPICard from '@/components/shared/KPICard';
import StatusBadge from '@/components/shared/StatusBadge';
import ControlChart, { ChartSettings, defaultChartSettings } from '@/components/shared/ControlChart';
import ChartSettingsMenu from '@/components/shared/ChartSettingsMenu';
import DefectBarChart from '@/components/charts/DefectBarChart';
import HistogramChart from '@/components/charts/HistogramChart';
import RangeChart from '@/components/charts/RangeChart';
import ThroughputChart from '@/components/charts/ThroughputChart';
import CycleTimeChart from '@/components/charts/CycleTimeChart';
import { useBusiness } from '@/contexts/BusinessContext';
import { useRealtimeKPIs } from '@/hooks/useRealtimeKPIs';
import { exportDashboardReport } from '@/lib/export-dashboard-pdf';
import { format } from 'date-fns';

// --- Chart panel types ---
type ChartType = 'control' | 'range' | 'histogram' | 'defects' | 'throughput' | 'cycleTime';
type PanelSize = 'sm' | 'md' | 'lg' | 'full';

interface ChartPanel {
  id: string;
  type: ChartType;
  title: string;
  processId: string;
  size: PanelSize;
  settings: ChartSettings;
}

const chartCatalog: { type: ChartType; label: string; description: string }[] = [
  { type: 'control', label: 'X̄ Control Chart', description: 'Individual measurement control chart with UCL/LCL' },
  { type: 'range', label: 'Moving Range (R)', description: 'Moving range chart for variability tracking' },
  { type: 'histogram', label: 'Distribution Histogram', description: 'Measurement distribution with target overlay' },
  { type: 'defects', label: 'Defect Pareto', description: 'Defect categories ranked by frequency' },
  { type: 'throughput', label: 'Throughput Trend', description: 'Units per hour over time by shift' },
  { type: 'cycleTime', label: 'Cycle Time SPC', description: 'Injection molding cycle time control chart' },
];

const sizeConfig: Record<PanelSize, { cols: string; height: number; label: string }> = {
  sm: { cols: 'col-span-1', height: 200, label: 'S' },
  md: { cols: 'col-span-1 lg:col-span-2', height: 260, label: 'M' },
  lg: { cols: 'col-span-1 lg:col-span-2 xl:col-span-3', height: 300, label: 'L' },
  full: { cols: 'col-span-1 lg:col-span-2 xl:col-span-4', height: 340, label: 'XL' },
};

const defaultPanels: ChartPanel[] = [
  { id: 'p1', type: 'control', title: 'CNC Shaft Turning — X̄ Chart', processId: 'proc-001', size: 'md', settings: defaultChartSettings },
  { id: 'p2', type: 'cycleTime', title: 'Injection Molding — Cycle Time', processId: 'proc-002', size: 'md', settings: defaultChartSettings },
  { id: 'p3', type: 'defects', title: 'Defect Pareto — All Lines', processId: 'proc-003', size: 'sm', settings: defaultChartSettings },
  { id: 'p4', type: 'histogram', title: 'Shaft Diameter Distribution', processId: 'proc-001', size: 'sm', settings: defaultChartSettings },
  { id: 'p5', type: 'range', title: 'CNC Moving Range', processId: 'proc-001', size: 'md', settings: defaultChartSettings },
  { id: 'p6', type: 'throughput', title: 'Packaging Throughput', processId: 'proc-004', size: 'md', settings: defaultChartSettings },
];

type WidgetId = 'kpis' | 'charts' | 'alerts' | 'recommendations' | 'processOverview';

export default function Dashboard() {
  const navigate = useNavigate();
  const { processes, getMeasurements, alerts, recommendations, getKPIs, activeBusiness } = useBusiness();
  const liveKPIs = useRealtimeKPIs(4000);
  const [panels, setPanels] = useState<ChartPanel[]>(defaultPanels);
  const [activeWidgets, setActiveWidgets] = useState<Set<WidgetId>>(new Set(['kpis', 'charts', 'alerts', 'recommendations', 'processOverview']));
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [addChartOpen, setAddChartOpen] = useState(false);

  const kpis = getKPIs();
  const recentAlerts = alerts.filter(a => !a.acknowledged).slice(0, 4);
  const topRecommendations = recommendations.filter(r => r.status === 'new').slice(0, 3);

  const handleExportPDF = () => {
    exportDashboardReport({
      businessName: activeBusiness.name,
      userName: activeBusiness.userName,
      role: activeBusiness.role,
      kpis,
      processes: processes.map(p => ({ name: p.name, owner: p.owner, status: p.status })),
      alerts: alerts.map(a => ({ message: a.message, severity: a.severity, timestamp: a.timestamp, acknowledged: a.acknowledged })),
    });
  };

  const toggleWidget = (id: WidgetId) => {
    setActiveWidgets(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const removePanel = (id: string) => setPanels(prev => prev.filter(p => p.id !== id));

  const resizePanel = (id: string) => {
    const sizes: PanelSize[] = ['sm', 'md', 'lg', 'full'];
    setPanels(prev => prev.map(p => {
      if (p.id !== id) return p;
      const idx = sizes.indexOf(p.size);
      return { ...p, size: sizes[(idx + 1) % sizes.length] };
    }));
  };

  const movePanel = (id: string, dir: -1 | 1) => {
    setPanels(prev => {
      const idx = prev.findIndex(p => p.id === id);
      if (idx < 0) return prev;
      const newIdx = Math.max(0, Math.min(prev.length - 1, idx + dir));
      if (newIdx === idx) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.splice(newIdx, 0, item);
      return copy;
    });
  };

  const updatePanelSettings = (id: string, settings: ChartSettings) => {
    setPanels(prev => prev.map(p => p.id === id ? { ...p, settings } : p));
  };

  const addChart = (type: ChartType) => {
    const catalog = chartCatalog.find(c => c.type === type)!;
    const newPanel: ChartPanel = {
      id: `p-${Date.now()}`,
      type,
      title: catalog.label,
      processId: type === 'cycleTime' ? 'proc-002' : type === 'throughput' ? 'proc-004' : 'proc-001',
      size: 'md',
      settings: defaultChartSettings,
    };
    setPanels(prev => [...prev, newPanel]);
    setAddChartOpen(false);
  };

  const renderChart = (panel: ChartPanel) => {
    const h = sizeConfig[panel.size].height;
    const tf = panel.settings.timeframe;
    const process = processes.find(p => p.id === panel.processId) || processes[0];
    switch (panel.type) {
      case 'control':    return <ControlChart measurements={getMeasurements(process.id)} process={process} height={h} settings={panel.settings} />;
      case 'range':      return <RangeChart height={h} timeframe={tf} process={process} />;
      case 'histogram':  return <HistogramChart height={h} process={process} />;
      case 'defects':    return <DefectBarChart height={h} processId={process.id} />;
      case 'throughput': return <ThroughputChart height={h} timeframe={tf} process={process} />;
      case 'cycleTime':  return <CycleTimeChart height={h} timeframe={tf} process={process} />;
    }
  };

  const isActive = (id: WidgetId) => activeWidgets.has(id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="page-header flex items-center gap-3 mb-2">
            <span className="page-callout">01</span>
            <span className="page-eyebrow">Dashboard</span>
          </div>
          <h1 className="page-title">Operations Dashboard</h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mt-2">
            {activeBusiness.name} · Real-time overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-secondary/50 text-sm font-medium text-secondary-foreground hover:bg-secondary transition-colors"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <button
            data-tour="customize-btn"
            onClick={() => setCustomizeOpen(!customizeOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${
              customizeOpen ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary/50 text-secondary-foreground border-border hover:bg-secondary'
            }`}
          >
            <Sliders className="h-4 w-4" />
            Customize
          </button>
        </div>
      </div>

      {/* Customize Panel */}
      {customizeOpen && (
        <div className="kpi-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dashboard Layout</h3>
            <span className="text-[10px] text-muted-foreground">{panels.length} charts · {activeWidgets.size} sections</span>
          </div>

          {/* Section toggles */}
          <div className="flex flex-wrap gap-2">
            {([
              { id: 'kpis' as WidgetId, label: 'KPI Cards', icon: BarChart3 },
              { id: 'charts' as WidgetId, label: 'Chart Grid', icon: Activity },
              { id: 'alerts' as WidgetId, label: 'Recent Alerts', icon: Bell },
              { id: 'recommendations' as WidgetId, label: 'Recommendations', icon: Lightbulb },
              { id: 'processOverview' as WidgetId, label: 'Process Overview', icon: ShieldAlert },
            ]).map(w => (
              <button
                key={w.id}
                onClick={() => toggleWidget(w.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium border transition-colors ${
                  isActive(w.id) ? 'bg-primary/10 text-primary border-primary/30' : 'bg-secondary/30 text-muted-foreground border-border'
                }`}
              >
                {isActive(w.id) ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                <w.icon className="h-3.5 w-3.5" />
                {w.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* KPI Row */}
      {isActive('kpis') && (
        <div data-tour="kpi-row" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <KPICard label="Defect Rate" value={liveKPIs.defectRate} subtitle="per 100 units" icon={AlertTriangle} trend="up" trendValue="+0.4 vs target" status={liveKPIs.defectRate > 2 ? 'critical' : liveKPIs.defectRate > 1.5 ? 'warning' : 'ok'} href="/quality" />
          <KPICard label="Process Stability" value={kpis.processStability} subtitle="processes in control" icon={Activity} status={kpis.processStability === `${processes.length}/${processes.length}` ? 'ok' : 'warning'} href="/processes" />
          <KPICard label="Avg Cycle Time" value={`${liveKPIs.avgCycleTime}s`} subtitle="injection molding" icon={Clock} trend="up" trendValue="+1.2s drift" status={liveKPIs.avgCycleTime > 44 ? 'warning' : 'ok'} href="/quality" />
          <KPICard label="Active Alerts" value={liveKPIs.activeAlerts} subtitle={`${kpis.criticalAlerts} critical`} icon={Bell} status={kpis.criticalAlerts > 0 ? 'critical' : 'ok'} href="/alerts" />
          <KPICard label="Improvement Ops" value={kpis.improvementOps} subtitle="action items" icon={Lightbulb} href="/insights" />
        </div>
      )}

      {/* Chart Grid */}
      {isActive('charts') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="section-header mb-0">Charts</h3>
            <button
              onClick={() => setAddChartOpen(!addChartOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Chart
            </button>
          </div>

          {/* Add chart catalog */}
          {addChartOpen && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {chartCatalog.map(chart => (
                <button
                  key={chart.type}
                  onClick={() => addChart(chart.type)}
                  className="kpi-card text-left hover:border-primary/40 transition-colors group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Plus className="h-3.5 w-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    <h4 className="text-xs font-semibold">{chart.label}</h4>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{chart.description}</p>
                </button>
              ))}
            </div>
          )}

          {/* Chart panels grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-3">
            {panels.map((panel, idx) => (
              <div key={panel.id} className={`kpi-card group ${sizeConfig[panel.size].cols}`}>
                {/* Panel header */}
                <div className="flex items-center gap-2 mb-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground/30 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold truncate">{panel.title}</h4>
                    <p className="text-[10px] text-muted-foreground">{chartCatalog.find(c => c.type === panel.type)?.label}</p>
                  </div>

                  {/* Panel controls — visible on hover */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => movePanel(panel.id, -1)}
                      disabled={idx === 0}
                      className="h-6 w-6 flex items-center justify-center rounded hover:bg-secondary/80 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                      title="Move left"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => movePanel(panel.id, 1)}
                      disabled={idx === panels.length - 1}
                      className="h-6 w-6 flex items-center justify-center rounded hover:bg-secondary/80 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                      title="Move right"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => resizePanel(panel.id)}
                      className="h-6 w-6 flex items-center justify-center rounded hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
                      title={`Size: ${sizeConfig[panel.size].label} — click to cycle`}
                    >
                      {panel.size === 'full' || panel.size === 'lg' ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
                    </button>
                    {panel.type === 'control' && (
                      <ChartSettingsMenu
                        settings={panel.settings}
                        onChange={(s) => updatePanelSettings(panel.id, s)}
                      />
                    )}
                    <button
                      onClick={() => removePanel(panel.id)}
                      className="h-6 w-6 flex items-center justify-center rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                      title="Remove"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Size badge */}
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-secondary/50 text-muted-foreground">
                    {sizeConfig[panel.size].label}
                  </span>
                </div>

                {/* Chart */}
                {renderChart(panel)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom section: Alerts + Recommendations + Process Overview */}
      {(isActive('alerts') || isActive('recommendations') || isActive('processOverview')) && (
        <div className={`grid gap-4 ${
          [isActive('alerts'), isActive('recommendations'), isActive('processOverview')].filter(Boolean).length >= 2 ? 'lg:grid-cols-2' : ''
        } ${
          [isActive('alerts'), isActive('recommendations'), isActive('processOverview')].filter(Boolean).length >= 3 ? 'xl:grid-cols-3' : ''
        }`}>
          {isActive('alerts') && (
            <div className="kpi-card cursor-pointer hover:border-primary/40 hover:shadow-md transition-all" onClick={() => navigate('/alerts')}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="section-header mb-0">Recent Alerts</h3>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="space-y-3">
                {recentAlerts.map((alert) => (
                  <div key={alert.id} className="flex gap-3 items-start">
                    <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${
                      alert.severity === 'critical' ? 'bg-status-critical animate-pulse-glow' : 'bg-status-warning'
                    }`} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium leading-tight">{alert.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{format(new Date(alert.timestamp), 'MMM d, HH:mm')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isActive('recommendations') && (
            <div className="kpi-card cursor-pointer hover:border-primary/40 hover:shadow-md transition-all" onClick={() => navigate('/insights')}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="section-header mb-0">Recommended Actions</h3>
                <Lightbulb className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="space-y-3">
                {topRecommendations.map((rec) => (
                  <div key={rec.id} className="p-3 rounded-md bg-secondary/50 border border-border/50">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status={rec.priority === 'high' ? 'critical' : rec.priority === 'medium' ? 'warning' : 'ok'} label={rec.priority} />
                      <span className="text-[10px] text-muted-foreground">{rec.category}</span>
                    </div>
                    <p className="text-sm font-medium">{rec.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{rec.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isActive('processOverview') && (
            <div className="kpi-card cursor-pointer hover:border-primary/40 hover:shadow-md transition-all" onClick={() => navigate('/processes')}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="section-header mb-0">Process Overview</h3>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </div>
              <table className="data-table">
                <thead><tr><th>Process</th><th>Owner</th><th>Status</th></tr></thead>
                <tbody>
                  {processes.map((p) => (
                    <tr key={p.id}>
                      <td className="font-medium text-sm">{p.name.split('—')[0].trim()}</td>
                      <td className="text-muted-foreground">{p.owner}</td>
                      <td><StatusBadge status={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 p-3 rounded-md bg-secondary/30 border border-border/30">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldAlert className="h-3.5 w-3.5 text-status-warning" />
                  <span className="text-xs font-medium">PFMEA Summary</span>
                </div>
                <p className="text-xs text-muted-foreground">{kpis.openPFMEA} open actions · {kpis.highRPN} high-risk items (RPN ≥ 100)</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
