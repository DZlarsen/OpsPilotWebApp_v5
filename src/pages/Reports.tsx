import { useState } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { FileText, Download, Calendar, Clock, BarChart3, ShieldAlert, ClipboardList, CheckCircle, Loader2, Table } from 'lucide-react';
import { exportPFMEAcsv } from '@/lib/export-pfmea';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ReportTemplate {
  id: string;
  title: string;
  description: string;
  icon: typeof FileText;
  frequency: string;
  sections: string[];
}

const templates: ReportTemplate[] = [
  {
    id: 'shift-summary',
    title: 'Shift Summary Report',
    description: 'End-of-shift overview with KPIs, alerts, and process status for handoff.',
    icon: Clock,
    frequency: 'Per shift',
    sections: ['KPI snapshot', 'Alerts triggered', 'Process status', 'Handoff notes'],
  },
  {
    id: 'weekly-quality',
    title: 'Weekly Quality Report',
    description: 'Cpk trends, defect rates, SPC violations, and improvement actions for the week.',
    icon: BarChart3,
    frequency: 'Weekly',
    sections: ['Cpk summary', 'Defect pareto', 'SPC violations', 'Corrective actions'],
  },
  {
    id: 'pfmea-audit',
    title: 'PFMEA Audit Report',
    description: 'Current PFMEA status with open items, high-RPN risks, and action tracking.',
    icon: ShieldAlert,
    frequency: 'On demand',
    sections: ['Risk matrix', 'Open actions', 'RPN distribution', 'Owner accountability'],
  },
  {
    id: 'oee-report',
    title: 'OEE Performance Report',
    description: 'Equipment effectiveness breakdown with availability, performance, and quality metrics.',
    icon: BarChart3,
    frequency: 'Daily / Weekly',
    sections: ['OEE by line', 'Loss breakdown', 'Trend analysis', 'Recommendations'],
  },
  {
    id: 'task-report',
    title: 'Task & Action Item Report',
    description: 'Kanban board snapshot with task status, aging, and owner workload.',
    icon: ClipboardList,
    frequency: 'On demand',
    sections: ['Status breakdown', 'Overdue items', 'Workload by owner', 'Completion trend'],
  },
  {
    id: 'pfmea-csv',
    title: 'PFMEA Export (CSV)',
    description: 'Download the full PFMEA register as a CSV file for audit, sharing, or import into other tools.',
    icon: Table,
    frequency: 'On demand',
    sections: ['All failure modes', 'S/O/D scores', 'RPN values', 'Owner & status'],
  },
];

export default function Reports() {
  const { activeBusiness, getKPIs, processes, alerts, pfmeaEntries } = useBusiness();
  const [generating, setGenerating] = useState<string | null>(null);
  const [generated, setGenerated] = useState<Set<string>>(new Set());

  const kpis = getKPIs();

  const handleGenerate = (templateId: string) => {
    if (templateId === 'pfmea-csv') {
      exportPFMEAcsv(pfmeaEntries, activeBusiness.name);
      setGenerated(prev => new Set(prev).add(templateId));
      toast.success('PFMEA CSV downloaded');
      return;
    }
    setGenerating(templateId);
    setTimeout(() => {
      setGenerating(null);
      setGenerated(prev => new Set(prev).add(templateId));
      toast.success('Report generated successfully', {
        description: 'Your report is ready for download.',
      });
    }, 2000);
  };

  const handleDownload = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)!;
    // Generate a text-based report for download
    const content = generateReportContent(template, activeBusiness, kpis, processes, alerts, pfmeaEntries);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${templateId}-${format(new Date(), 'yyyy-MM-dd')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report downloaded');
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="page-header flex items-center gap-3 mb-2">
            <span className="page-callout">16</span>
            <span className="page-eyebrow">System · Reports</span>
          </div>
          <h1 className="page-title">Reports</h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mt-2">{activeBusiness.name} — Generate and download operational reports</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="kpi-card text-center py-4">
          <p className="text-2xl font-bold font-mono">{processes.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Active Processes</p>
        </div>
        <div className="kpi-card text-center py-4">
          <p className="text-2xl font-bold font-mono">{alerts.filter(a => !a.acknowledged).length}</p>
          <p className="text-xs text-muted-foreground mt-1">Open Alerts</p>
        </div>
        <div className="kpi-card text-center py-4">
          <p className="text-2xl font-bold font-mono">{pfmeaEntries.filter(e => e.status !== 'closed').length}</p>
          <p className="text-xs text-muted-foreground mt-1">Open PFMEA Items</p>
        </div>
        <div className="kpi-card text-center py-4">
          <p className="text-2xl font-bold font-mono">{kpis.defectRate}</p>
          <p className="text-xs text-muted-foreground mt-1">Defect Rate</p>
        </div>
      </div>

      {/* Report templates */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {templates.map(template => {
          const Icon = template.icon;
          const isGenerating = generating === template.id;
          const isGenerated = generated.has(template.id);

          return (
            <div key={template.id} className="kpi-card flex flex-col">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold">{template.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{template.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">{template.frequency}</span>
              </div>

              <div className="flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Includes</p>
                <div className="flex flex-wrap gap-1">
                  {template.sections.map(s => (
                    <span key={s} className="px-2 py-0.5 rounded bg-secondary/50 text-[10px] text-muted-foreground">{s}</span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
                <button
                  onClick={() => handleGenerate(template.id)}
                  disabled={isGenerating}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Generating...
                    </>
                  ) : isGenerated ? (
                    <>
                      <CheckCircle className="h-3.5 w-3.5" />
                      Regenerate
                    </>
                  ) : (
                    <>
                      <FileText className="h-3.5 w-3.5" />
                      Generate
                    </>
                  )}
                </button>
                {isGenerated && (
                  <button
                    onClick={() => handleDownload(template.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-border bg-secondary/50 text-xs font-medium hover:bg-secondary transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function generateReportContent(template: ReportTemplate, business: any, kpis: any, processes: any[], alerts: any[], pfmea: any[]): string {
  const date = format(new Date(), 'MMMM d, yyyy HH:mm');
  let content = `${'='.repeat(60)}\n${template.title.toUpperCase()}\n${'='.repeat(60)}\n`;
  content += `Business: ${business.name}\nGenerated: ${date}\nPrepared by: ${business.userName} (${business.role})\n${'─'.repeat(60)}\n\n`;

  content += `KEY PERFORMANCE INDICATORS\n${'─'.repeat(30)}\n`;
  content += `Defect Rate: ${kpis.defectRate} per 100 units\n`;
  content += `Process Stability: ${kpis.processStability}\n`;
  content += `Active Alerts: ${kpis.activeAlerts} (${kpis.criticalAlerts} critical)\n`;
  content += `Open PFMEA Items: ${kpis.openPFMEA} (${kpis.highRPN} high-RPN)\n\n`;

  content += `PROCESS STATUS\n${'─'.repeat(30)}\n`;
  processes.forEach(p => {
    content += `  [${p.status.toUpperCase().padEnd(8)}] ${p.name} — Owner: ${p.owner}\n`;
  });
  content += '\n';

  content += `RECENT ALERTS\n${'─'.repeat(30)}\n`;
  alerts.slice(0, 5).forEach(a => {
    content += `  [${a.severity.toUpperCase()}] ${a.message}\n`;
  });
  content += '\n';

  content += `${'='.repeat(60)}\nEnd of Report\n`;
  return content;
}
