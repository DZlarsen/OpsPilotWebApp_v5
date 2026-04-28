import { useState, useEffect } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import KPICard from '@/components/shared/KPICard';
import ControlChart, { ChartSettings, defaultChartSettings } from '@/components/shared/ControlChart';
import ChartSettingsMenu from '@/components/shared/ChartSettingsMenu';
import StatusBadge from '@/components/shared/StatusBadge';
import RangeChart from '@/components/charts/RangeChart';
import HistogramChart from '@/components/charts/HistogramChart';
import DefectBarChart from '@/components/charts/DefectBarChart';
import ThroughputChart from '@/components/charts/ThroughputChart';
import CycleTimeChart from '@/components/charts/CycleTimeChart';
import { Activity, BarChart3, AlertTriangle, Bell, Eye, EyeOff } from 'lucide-react';

type ChartType = 'control' | 'range' | 'histogram' | 'defects' | 'throughput' | 'cycleTime';

const chartOptions: { type: ChartType; label: string }[] = [
  { type: 'control', label: 'X̄ Control' },
  { type: 'range', label: 'Moving Range' },
  { type: 'histogram', label: 'Histogram' },
  { type: 'defects', label: 'Defect Pareto' },
  { type: 'throughput', label: 'Throughput' },
  { type: 'cycleTime', label: 'Cycle Time' },
];

type Template = 'operations' | 'quality' | 'manager' | 'operator';

const templates: { id: Template; name: string; description: string }[] = [
  { id: 'operations', name: 'Operations Overview', description: 'Full process monitoring with KPIs, charts, and alerts' },
  { id: 'quality', name: 'Quality / SPC View', description: 'Focused on control charts, Cpk, and quality metrics' },
  { id: 'manager', name: 'Manager Summary', description: 'High-level KPIs, trends, and action items' },
  { id: 'operator', name: 'Operator View', description: 'Active process status with measurement input' },
];

type Widget = 'kpis' | 'controlChart' | 'alerts' | 'processTable' | 'recommendations';

const allWidgets: { id: Widget; label: string }[] = [
  { id: 'kpis', label: 'KPI Cards' },
  { id: 'controlChart', label: 'Chart' },
  { id: 'alerts', label: 'Recent Alerts' },
  { id: 'processTable', label: 'Process Table' },
  { id: 'recommendations', label: 'Recommendations' },
];

const templateWidgets: Record<Template, Widget[]> = {
  operations: ['kpis', 'controlChart', 'alerts', 'processTable', 'recommendations'],
  quality: ['controlChart', 'kpis', 'alerts'],
  manager: ['kpis', 'recommendations', 'alerts'],
  operator: ['controlChart', 'processTable'],
};

export default function Dashboards() {
  const { processes, getMeasurements, getKPIs, alerts, recommendations, activeBusiness } = useBusiness();
  const [template, setTemplate] = useState<Template>('operations');
  const [selectedProcess, setSelectedProcess] = useState(processes[0]?.id || '');
  useEffect(() => { setSelectedProcess(processes[0]?.id || ''); }, [activeBusiness.id]);
  const [activeWidgets, setActiveWidgets] = useState<Widget[]>(templateWidgets.operations);
  const [chartSettings, setChartSettings] = useState<ChartSettings>(defaultChartSettings);
  const [chartType, setChartType] = useState<ChartType>('control');

  const process = processes.find(p => p.id === selectedProcess) || processes[0];
  const measurements = getMeasurements(selectedProcess).slice(-40);
  const kpis = getKPIs();

  const handleTemplateChange = (t: Template) => {
    setTemplate(t);
    setActiveWidgets(templateWidgets[t]);
  };

  const toggleWidget = (w: Widget) => {
    setActiveWidgets(prev =>
      prev.includes(w) ? prev.filter(x => x !== w) : [...prev, w]
    );
  };

  const renderChart = (height: number) => {
    const tf = chartSettings.timeframe;
    switch (chartType) {
      case 'control': return <ControlChart measurements={measurements} process={process} height={height} settings={chartSettings} />;
      case 'range': return <RangeChart height={height} timeframe={tf} />;
      case 'histogram': return <HistogramChart height={height} />;
      case 'defects': return <DefectBarChart height={height} />;
      case 'throughput': return <ThroughputChart height={height} timeframe={tf} />;
      case 'cycleTime': return <CycleTimeChart height={height} timeframe={tf} />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="page-header flex items-center gap-3 mb-2">
            <span className="page-callout">18</span>
            <span className="page-eyebrow">Dashboard · Templates</span>
          </div>
          <h1 className="page-title">Configurable Dashboards</h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mt-2">Select a template and customize your view</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => handleTemplateChange(t.id)}
            className={`p-3 rounded-lg border text-left transition-colors ${
              template === t.id
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card hover:border-primary/30'
            }`}
          >
            <h4 className="text-sm font-semibold">{t.name}</h4>
            <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Process:</span>
          <select
            value={selectedProcess}
            onChange={(e) => setSelectedProcess(e.target.value)}
            className="bg-secondary text-secondary-foreground border border-border rounded-md px-2 py-1 text-sm"
          >
            {processes.map(p => (
              <option key={p.id} value={p.id}>{p.name.split('—')[0].trim()}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-1">Widgets:</span>
          {allWidgets.map((w) => (
            <button
              key={w.id}
              onClick={() => toggleWidget(w.id)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                activeWidgets.includes(w.id)
                  ? 'bg-primary/10 text-primary border border-primary/30'
                  : 'bg-secondary/50 text-muted-foreground border border-border'
              }`}
            >
              {activeWidgets.includes(w.id) ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              {w.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {activeWidgets.includes('kpis') && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPICard label="Defect Rate" value={kpis.defectRate} subtitle="per 100" icon={AlertTriangle} status={kpis.defectRate > 2 ? 'critical' : 'ok'} />
            <KPICard label="Stability" value={kpis.processStability} subtitle="in control" icon={Activity} />
            <KPICard label="Active Alerts" value={kpis.activeAlerts} icon={Bell} status={kpis.criticalAlerts > 0 ? 'critical' : 'ok'} />
            <KPICard label="Cycle Time" value={`${kpis.avgCycleTime}s`} icon={BarChart3} />
          </div>
        )}

        {activeWidgets.includes('controlChart') && (
          <div className="kpi-card">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold">{process.name}</h3>
                <p className="text-xs text-muted-foreground">{chartOptions.find(c => c.type === chartType)?.label}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={process.status} />
                <ChartSettingsMenu settings={chartSettings} onChange={setChartSettings} />
              </div>
            </div>

            <div className="flex gap-1.5 flex-wrap mb-4">
              {chartOptions.map((opt) => (
                <button
                  key={opt.type}
                  onClick={() => setChartType(opt.type)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors border ${
                    chartType === opt.type
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'bg-secondary/30 text-muted-foreground border-border hover:bg-secondary/60'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {renderChart(280)}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-4">
          {activeWidgets.includes('alerts') && (
            <div className="kpi-card">
              <h3 className="section-header">Alerts</h3>
              <div className="space-y-2">
                {alerts.slice(0, 5).map(a => (
                  <div key={a.id} className="flex items-start gap-2 text-xs">
                    <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${
                      a.severity === 'critical' ? 'bg-status-critical' : a.severity === 'warning' ? 'bg-status-warning' : 'bg-status-ok'
                    }`} />
                    <span className="text-muted-foreground">{a.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeWidgets.includes('processTable') && (
            <div className="kpi-card">
              <h3 className="section-header">Process Status</h3>
              <table className="data-table">
                <thead><tr><th>Process</th><th>Status</th><th>Owner</th></tr></thead>
                <tbody>
                  {processes.map(p => (
                    <tr key={p.id}>
                      <td className="font-medium">{p.name.split('—')[0].trim()}</td>
                      <td><StatusBadge status={p.status} /></td>
                      <td className="text-muted-foreground">{p.owner}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeWidgets.includes('recommendations') && (
            <div className="kpi-card lg:col-span-2">
              <h3 className="section-header">Top Recommendations</h3>
              <div className="space-y-2">
                {recommendations.filter(r => r.status === 'new').slice(0, 3).map(r => (
                  <div key={r.id} className="flex items-center gap-3 p-2 rounded bg-secondary/30">
                    <StatusBadge status={r.priority === 'high' ? 'critical' : 'warning'} label={r.priority} />
                    <span className="text-sm">{r.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
