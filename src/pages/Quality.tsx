import { useState, useEffect } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import ControlChart, { ChartSettings, defaultChartSettings } from '@/components/shared/ControlChart';
import ChartSettingsMenu from '@/components/shared/ChartSettingsMenu';
import StatusBadge from '@/components/shared/StatusBadge';
import RangeChart from '@/components/charts/RangeChart';
import HistogramChart from '@/components/charts/HistogramChart';
import DefectBarChart from '@/components/charts/DefectBarChart';
import ThroughputChart from '@/components/charts/ThroughputChart';
import CycleTimeChart from '@/components/charts/CycleTimeChart';
import { BarChart3, TrendingUp, AlertTriangle, Target } from 'lucide-react';

type ChartType = 'control' | 'range' | 'histogram' | 'defects' | 'throughput' | 'cycleTime';

const chartOptions: { type: ChartType; label: string }[] = [
  { type: 'control', label: 'X̄ Control' },
  { type: 'range', label: 'Moving Range' },
  { type: 'histogram', label: 'Histogram' },
  { type: 'defects', label: 'Defect Pareto' },
  { type: 'throughput', label: 'Throughput' },
  { type: 'cycleTime', label: 'Cycle Time' },
];

export default function Quality() {
  const { processes, getMeasurements, getProcessStats, activeBusiness } = useBusiness();
  const [selectedProcess, setSelectedProcess] = useState(processes[0]?.id || '');
  useEffect(() => { setSelectedProcess(processes[0]?.id || ''); }, [activeBusiness.id]);
  const [chartSettings, setChartSettings] = useState<ChartSettings>(defaultChartSettings);
  const [chartType, setChartType] = useState<ChartType>('control');
  const process = processes.find(p => p.id === selectedProcess) || processes[0];
  const measurements = getMeasurements(selectedProcess);
  const stats = getProcessStats(selectedProcess);
  const recentMeasurements = measurements.slice(-60);

  const statusMessages: { type: 'ok' | 'warning' | 'critical'; message: string }[] = [];
  if (process.status === 'critical') {
    statusMessages.push({ type: 'critical', message: 'Out-of-control condition detected' });
  }
  if (process.status === 'warning') {
    statusMessages.push({ type: 'warning', message: 'Process drift detected — trending away from center line' });
  }
  if (stats.cpk < 1) {
    statusMessages.push({ type: 'critical', message: `Low process capability (Cpk = ${stats.cpk})` });
  }
  if (stats.oocCount > 3) {
    statusMessages.push({ type: 'warning', message: `${stats.oocCount} out-of-control points — rising variability` });
  }
  if (statusMessages.length === 0) {
    statusMessages.push({ type: 'ok', message: 'Process is stable and in statistical control' });
  }

  const renderChart = (height: number) => {
    const tf = chartSettings.timeframe;
    switch (chartType) {
      case 'control': return <ControlChart measurements={recentMeasurements} process={process} height={height} settings={chartSettings} />;
      case 'range': return <RangeChart height={height} timeframe={tf} process={process} />;
      case 'histogram': return <HistogramChart height={height} process={process} />;
      case 'defects': return <DefectBarChart height={height} processId={selectedProcess} />;
      case 'throughput': return <ThroughputChart height={height} timeframe={tf} process={process} />;
      case 'cycleTime': return <CycleTimeChart height={height} timeframe={tf} process={process} />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="page-header flex items-center gap-3 mb-2">
          <span className="page-callout">03</span>
          <span className="page-eyebrow">Quality · SPC</span>
        </div>
        <h1 className="page-title">Statistical Process Control</h1>
        <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mt-2">
          Control charts · Cpk · Western Electric rules
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {processes.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedProcess(p.id)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${
              selectedProcess === p.id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-secondary/50 text-secondary-foreground border-border hover:bg-secondary'
            }`}
          >
            {p.name.split('—')[0].trim()}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {statusMessages.map((msg, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 p-3 rounded-md border ${
              msg.type === 'critical'
                ? 'bg-status-critical/5 border-status-critical/30'
                : msg.type === 'warning'
                ? 'bg-status-warning/5 border-status-warning/30'
                : 'bg-status-ok/5 border-status-ok/30'
            }`}
          >
            <AlertTriangle className={`h-4 w-4 flex-shrink-0 ${
              msg.type === 'critical' ? 'text-status-critical' : msg.type === 'warning' ? 'text-status-warning' : 'text-status-ok'
            }`} />
            <span className="text-sm font-medium">{msg.message}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="kpi-card">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Mean</span>
          </div>
          <p className="text-xl font-mono font-bold">{stats.mean} <span className="text-xs text-muted-foreground font-sans">{process.unit}</span></p>
          <p className="text-xs text-muted-foreground mt-1">CL: {process.cl}</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Std Dev (σ)</span>
          </div>
          <p className="text-xl font-mono font-bold">{stats.stdDev}</p>
          <p className="text-xs text-muted-foreground mt-1">Range: {process.lcl} — {process.ucl}</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Cpk</span>
          </div>
          <p className={`text-xl font-mono font-bold ${stats.cpk >= 1.33 ? 'text-status-ok' : stats.cpk >= 1 ? 'text-status-warning' : 'text-status-critical'}`}>
            {stats.cpk}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{stats.cpk >= 1.33 ? 'Capable' : stats.cpk >= 1 ? 'Marginal' : 'Not capable'}</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">OOC Points</span>
          </div>
          <p className={`text-xl font-mono font-bold ${stats.oocCount > 0 ? 'text-status-critical' : 'text-status-ok'}`}>
            {stats.oocCount} / {stats.totalPoints}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{((stats.oocCount / stats.totalPoints) * 100).toFixed(1)}% out of control</p>
        </div>
      </div>

      <div className="kpi-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold">{process.name}</h3>
            <p className="text-xs text-muted-foreground">{chartOptions.find(c => c.type === chartType)?.label} — last {chartSettings.timeframe < 60 ? `${chartSettings.timeframe}m` : chartSettings.timeframe < 1440 ? `${chartSettings.timeframe / 60}h` : `${Math.round(chartSettings.timeframe / 1440)}d`}</p>
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

        {renderChart(350)}

        {chartType === 'control' && (
          <div className="flex items-center justify-center gap-6 mt-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-0.5 w-4 bg-chart-green inline-block" /> Center Line (CL)</span>
            <span className="flex items-center gap-1"><span className="h-0.5 w-4 bg-chart-red inline-block border-dashed" /> UCL / LCL</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-chart-blue inline-block" /> In Control</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-chart-red inline-block" /> Out of Control</span>
          </div>
        )}
      </div>
    </div>
  );
}
