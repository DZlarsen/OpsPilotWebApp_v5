import { useNavigate } from 'react-router-dom';
import { useBusiness } from '@/contexts/BusinessContext';
import { format, subHours } from 'date-fns';
import { Clock, AlertTriangle, CheckCircle, ShieldAlert, ArrowRightLeft, TrendingUp, FileText } from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';

export default function ShiftHandoff() {
  const navigate = useNavigate();
  const { activeBusiness, processes, alerts, pfmeaEntries, getKPIs, recommendations } = useBusiness();
  const kpis = getKPIs();

  const shiftStart = subHours(new Date(), 8);
  const shiftEnd = new Date();

  const shiftAlerts = alerts.filter(a => new Date(a.timestamp) >= shiftStart);
  const criticalAlerts = shiftAlerts.filter(a => a.severity === 'critical');
  const acknowledgedCount = shiftAlerts.filter(a => a.acknowledged).length;

  const openPfmea = pfmeaEntries.filter(e => e.status !== 'closed');
  const highRPN = pfmeaEntries.filter(e => e.rpn >= 100);
  const newRecs = recommendations.filter(r => r.status === 'new');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="page-header flex items-center gap-3 mb-2">
            <span className="page-callout">14</span>
            <span className="page-eyebrow">Operations · Handoff</span>
          </div>
          <h1 className="page-title">Shift Handoff Summary</h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mt-2">{activeBusiness.name} — {format(shiftStart, 'MMM d, HH:mm')} → {format(shiftEnd, 'HH:mm')}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary/50 border border-border">
          <ArrowRightLeft className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Day Shift → Night Shift</span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div onClick={() => navigate('/alerts')} className="kpi-card text-center py-5 cursor-pointer hover:border-primary/40 hover:shadow-md transition-all">
          <AlertTriangle className="h-5 w-5 mx-auto text-status-critical mb-2" />
          <p className="text-2xl font-bold font-mono">{shiftAlerts.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Alerts This Shift</p>
          <p className="text-[10px] text-status-critical mt-0.5">{criticalAlerts.length} critical</p>
        </div>
        <div onClick={() => navigate('/alerts')} className="kpi-card text-center py-5 cursor-pointer hover:border-primary/40 hover:shadow-md transition-all">
          <CheckCircle className="h-5 w-5 mx-auto text-status-ok mb-2" />
          <p className="text-2xl font-bold font-mono">{acknowledgedCount}/{shiftAlerts.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Alerts Resolved</p>
        </div>
        <div onClick={() => navigate('/pfmea')} className="kpi-card text-center py-5 cursor-pointer hover:border-primary/40 hover:shadow-md transition-all">
          <ShieldAlert className="h-5 w-5 mx-auto text-status-warning mb-2" />
          <p className="text-2xl font-bold font-mono">{openPfmea.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Open PFMEA Items</p>
          <p className="text-[10px] text-status-warning mt-0.5">{highRPN.length} high-risk</p>
        </div>
        <div onClick={() => navigate('/quality')} className="kpi-card text-center py-5 cursor-pointer hover:border-primary/40 hover:shadow-md transition-all">
          <TrendingUp className="h-5 w-5 mx-auto text-primary mb-2" />
          <p className="text-2xl font-bold font-mono">{kpis.defectRate}</p>
          <p className="text-xs text-muted-foreground mt-1">Current Defect Rate</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Process Status */}
        <div className="kpi-card cursor-pointer hover:border-primary/40 hover:shadow-md transition-all" onClick={() => navigate('/processes')}>
          <h3 className="section-header flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" />
            Process Status at Handoff
          </h3>
          <table className="data-table">
            <thead>
              <tr><th>Process</th><th>Owner</th><th>Status</th></tr>
            </thead>
            <tbody>
              {processes.map(p => (
                <tr key={p.id}>
                  <td className="font-medium text-sm">{p.name.split('—')[0].trim()}</td>
                  <td className="text-muted-foreground">{p.owner}</td>
                  <td><StatusBadge status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Alerts during shift */}
        <div className="kpi-card cursor-pointer hover:border-primary/40 hover:shadow-md transition-all" onClick={() => navigate('/alerts')}>
          <h3 className="section-header flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5" />
            Alerts Triggered This Shift
          </h3>
          {shiftAlerts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No alerts this shift ✓</p>
          ) : (
            <div className="space-y-2">
              {shiftAlerts.map(alert => (
                <div key={alert.id} className="flex items-start gap-3 p-2 rounded-md bg-secondary/30">
                  <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${
                    alert.severity === 'critical' ? 'bg-status-critical' : alert.severity === 'warning' ? 'bg-status-warning' : 'bg-status-ok'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">{alert.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground">{format(new Date(alert.timestamp), 'HH:mm')}</span>
                      {alert.acknowledged && <span className="text-[10px] text-status-ok font-medium">Resolved</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Open actions for next shift */}
        <div className="kpi-card cursor-pointer hover:border-primary/40 hover:shadow-md transition-all" onClick={() => navigate('/pfmea')}>
          <h3 className="section-header flex items-center gap-2">
            <FileText className="h-3.5 w-3.5" />
            Carry-Over Actions
          </h3>
          <div className="space-y-2">
            {highRPN.slice(0, 4).map(item => (
              <div key={item.id} className="flex items-start gap-3 p-2 rounded-md bg-secondary/30">
                <span className="mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-status-critical/15 text-status-critical">
                  RPN {item.rpn}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">{item.failureMode}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.recommendedAction}</p>
                  <p className="text-[10px] text-muted-foreground">Owner: {item.owner}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="kpi-card cursor-pointer hover:border-primary/40 hover:shadow-md transition-all" onClick={() => navigate('/insights')}>
          <h3 className="section-header flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5" />
            Pending Recommendations
          </h3>
          <div className="space-y-2">
            {newRecs.slice(0, 4).map(rec => (
              <div key={rec.id} className="flex items-start gap-3 p-2 rounded-md bg-secondary/30">
                <StatusBadge status={rec.priority === 'high' ? 'critical' : rec.priority === 'medium' ? 'warning' : 'ok'} label={rec.priority} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">{rec.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{rec.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Handoff notes */}
      <div className="kpi-card">
        <h3 className="section-header">Handoff Notes</h3>
        <textarea
          className="w-full min-h-[100px] p-3 rounded-md bg-secondary/30 border border-border text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary resize-y"
          placeholder="Add notes for the incoming shift team..."
        />
        <div className="flex justify-end mt-3">
          <button className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
            Save & Share
          </button>
        </div>
      </div>
    </div>
  );
}
