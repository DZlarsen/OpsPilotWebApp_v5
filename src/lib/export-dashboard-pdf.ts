import { format } from 'date-fns';
import { toast } from 'sonner';

interface PDFExportData {
  businessName: string;
  userName: string;
  role: string;
  kpis: {
    defectRate: number;
    processStability: string;
    avgCycleTime: number;
    activeAlerts: number;
    criticalAlerts: number;
    improvementOps: number;
    openPFMEA: number;
    highRPN: number;
  };
  processes: { name: string; owner: string; status: string }[];
  alerts: { message: string; severity: string; timestamp: string; acknowledged: boolean }[];
}

export function exportDashboardReport(data: PDFExportData) {
  const date = format(new Date(), 'MMMM d, yyyy HH:mm');
  const divider = '═'.repeat(64);
  const thinDivider = '─'.repeat(64);

  let content = `${divider}\n  OPSPILOT — EXECUTIVE DASHBOARD REPORT\n${divider}\n\n`;
  content += `Business:     ${data.businessName}\n`;
  content += `Prepared by:  ${data.userName} (${data.role})\n`;
  content += `Generated:    ${date}\n\n`;

  content += `${thinDivider}\n  KEY PERFORMANCE INDICATORS\n${thinDivider}\n\n`;
  content += `  Defect Rate:          ${data.kpis.defectRate} per 100 units\n`;
  content += `  Process Stability:    ${data.kpis.processStability} in control\n`;
  content += `  Avg Cycle Time:       ${data.kpis.avgCycleTime}s\n`;
  content += `  Active Alerts:        ${data.kpis.activeAlerts} (${data.kpis.criticalAlerts} critical)\n`;
  content += `  Open PFMEA Items:     ${data.kpis.openPFMEA} (${data.kpis.highRPN} high-RPN ≥ 100)\n`;
  content += `  Improvement Actions:  ${data.kpis.improvementOps}\n\n`;

  content += `${thinDivider}\n  PROCESS STATUS\n${thinDivider}\n\n`;
  content += `  ${'Process'.padEnd(35)} ${'Owner'.padEnd(18)} Status\n`;
  content += `  ${'─'.repeat(35)} ${'─'.repeat(18)} ${'─'.repeat(10)}\n`;
  data.processes.forEach(p => {
    content += `  ${p.name.padEnd(35)} ${p.owner.padEnd(18)} ${p.status.toUpperCase()}\n`;
  });

  content += `\n${thinDivider}\n  ACTIVE ALERTS\n${thinDivider}\n\n`;
  const activeAlerts = data.alerts.filter(a => !a.acknowledged);
  if (activeAlerts.length === 0) {
    content += `  No unacknowledged alerts ✓\n`;
  } else {
    activeAlerts.forEach(a => {
      content += `  [${a.severity.toUpperCase().padEnd(8)}] ${a.message}\n`;
      content += `  ${''.padEnd(12)} ${format(new Date(a.timestamp), 'MMM d, HH:mm')}\n\n`;
    });
  }

  content += `\n${divider}\n  END OF REPORT\n${divider}\n`;

  // Download as text
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `OpsPilot-Dashboard-${data.businessName.replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.txt`;
  a.click();
  URL.revokeObjectURL(url);

  toast.success('Dashboard report downloaded', {
    description: 'Executive summary exported successfully.',
  });
}
