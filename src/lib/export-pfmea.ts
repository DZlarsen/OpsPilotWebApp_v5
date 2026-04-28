import { PFMEAEntry } from '@/data/mock-data';
import { format } from 'date-fns';

export function exportPFMEAcsv(entries: PFMEAEntry[], businessName: string) {
  const headers = ['Process Step', 'Failure Mode', 'Effect', 'Cause', 'Severity', 'Occurrence', 'Detection', 'RPN', 'Recommended Action', 'Owner', 'Status'];
  const rows = entries.map(e => [
    e.processStep, e.failureMode, e.effect, e.cause,
    e.severity, e.occurrence, e.detection, e.rpn,
    e.recommendedAction, e.owner, e.status,
  ]);

  const escape = (v: string | number) => {
    const s = String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const csv = [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PFMEA-${businessName.replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
