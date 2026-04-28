import { useState, useEffect } from 'react';
import { PFMEAEntry } from '@/data/mock-data';
import { useBusiness } from '@/contexts/BusinessContext';
import StatusBadge from '@/components/shared/StatusBadge';
import { ShieldAlert, ArrowUpDown, Plus, Download } from 'lucide-react';
import { exportPFMEAcsv } from '@/lib/export-pfmea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

const emptyForm = {
  processStep: '',
  failureMode: '',
  effect: '',
  cause: '',
  severity: '5',
  occurrence: '5',
  detection: '5',
  recommendedAction: '',
  owner: '',
};

export default function PFMEA() {
  const { pfmeaEntries, owners, processOptions, activeBusiness } = useBusiness();
  const [sortField, setSortField] = useState<'rpn' | 'severity'>('rpn');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [entries, setEntries] = useState<PFMEAEntry[]>(pfmeaEntries);
  useEffect(() => { setEntries(pfmeaEntries); }, [activeBusiness.id]);
  const [addOpen, setAddOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<PFMEAEntry | null>(null);
  const [form, setForm] = useState(emptyForm);

  const sorted = [...entries].sort((a, b) => {
    return sortDir === 'desc' ? b[sortField] - a[sortField] : a[sortField] - b[sortField];
  });

  const toggleSort = (field: 'rpn' | 'severity') => {
    if (sortField === field) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const rpnColor = (rpn: number) =>
    rpn >= 150 ? 'text-status-critical font-bold' : rpn >= 80 ? 'text-status-warning font-bold' : 'text-status-ok';

  const openAdd = () => {
    setEditEntry(null);
    setForm(emptyForm);
    setAddOpen(true);
  };

  const openEdit = (entry: PFMEAEntry) => {
    setEditEntry(entry);
    setForm({
      processStep: entry.processStep,
      failureMode: entry.failureMode,
      effect: entry.effect,
      cause: entry.cause,
      severity: String(entry.severity),
      occurrence: String(entry.occurrence),
      detection: String(entry.detection),
      recommendedAction: entry.recommendedAction,
      owner: entry.owner,
    });
    setAddOpen(true);
  };

  const handleSubmit = () => {
    if (!form.processStep || !form.failureMode || !form.effect || !form.cause) {
      toast.error('Please fill in all required fields');
      return;
    }
    const s = parseInt(form.severity);
    const o = parseInt(form.occurrence);
    const d = parseInt(form.detection);
    const rpn = s * o * d;

    if (editEntry) {
      setEntries(prev => prev.map(e => e.id === editEntry.id ? {
        ...e,
        processStep: form.processStep,
        failureMode: form.failureMode,
        effect: form.effect,
        cause: form.cause,
        severity: s,
        occurrence: o,
        detection: d,
        rpn,
        recommendedAction: form.recommendedAction,
        owner: form.owner,
      } : e));
      toast.success('PFMEA entry updated');
    } else {
      const newEntry: PFMEAEntry = {
        id: `pfmea-${Date.now()}`,
        processStep: form.processStep,
        failureMode: form.failureMode,
        effect: form.effect,
        cause: form.cause,
        severity: s,
        occurrence: o,
        detection: d,
        rpn,
        recommendedAction: form.recommendedAction,
        owner: form.owner,
        status: 'open',
      };
      setEntries(prev => [...prev, newEntry]);
      toast.success('PFMEA entry created');
    }
    setAddOpen(false);
  };

  const inputClass = 'w-full rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring';
  const labelClass = 'text-xs font-medium text-muted-foreground uppercase tracking-wider';

  const computedRPN = parseInt(form.severity) * parseInt(form.occurrence) * parseInt(form.detection);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="page-header flex items-center gap-3 mb-2">
            <span className="page-callout">06</span>
            <span className="page-eyebrow">Quality · PFMEA</span>
          </div>
          <h1 className="page-title">PFMEA</h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mt-2">Process Failure Mode and Effects Analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { exportPFMEAcsv(entries, activeBusiness.name); toast.success('PFMEA exported as CSV'); }}
            className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-secondary/50 text-sm font-medium hover:bg-secondary transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Entry
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="kpi-card text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Entries</p>
          <p className="text-2xl font-mono font-bold">{entries.length}</p>
        </div>
        <div className="kpi-card text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">High Risk (RPN ≥ 100)</p>
          <p className="text-2xl font-mono font-bold text-status-critical">{entries.filter(e => e.rpn >= 100).length}</p>
        </div>
        <div className="kpi-card text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Open Actions</p>
          <p className="text-2xl font-mono font-bold text-status-warning">{entries.filter(e => e.status !== 'closed').length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="kpi-card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Process Step</th>
              <th>Failure Mode</th>
              <th>Effect</th>
              <th>Cause</th>
              <th className="cursor-pointer" onClick={() => toggleSort('severity')}>
                <span className="flex items-center gap-1">S <ArrowUpDown className="h-3 w-3" /></span>
              </th>
              <th>O</th>
              <th>D</th>
              <th className="cursor-pointer" onClick={() => toggleSort('rpn')}>
                <span className="flex items-center gap-1">RPN <ArrowUpDown className="h-3 w-3" /></span>
              </th>
              <th>Action</th>
              <th>Owner</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((entry) => (
              <tr key={entry.id}>
                <td className="font-medium whitespace-nowrap">{entry.processStep}</td>
                <td className="max-w-[160px] truncate">{entry.failureMode}</td>
                <td className="max-w-[160px] truncate text-muted-foreground">{entry.effect}</td>
                <td className="max-w-[160px] truncate text-muted-foreground">{entry.cause}</td>
                <td className="font-mono text-center">{entry.severity}</td>
                <td className="font-mono text-center">{entry.occurrence}</td>
                <td className="font-mono text-center">{entry.detection}</td>
                <td className={`font-mono text-center ${rpnColor(entry.rpn)}`}>{entry.rpn}</td>
                <td className="max-w-[200px] truncate">{entry.recommendedAction}</td>
                <td className="whitespace-nowrap text-muted-foreground">{entry.owner}</td>
                <td><StatusBadge status={entry.status} /></td>
                <td>
                  <button
                    onClick={() => openEdit(entry)}
                    className="text-xs text-primary hover:underline"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editEntry ? 'Edit PFMEA Entry' : 'New PFMEA Entry'}</DialogTitle>
            <DialogDescription>
              {editEntry ? 'Update failure mode details and risk scores.' : 'Add a new failure mode to the analysis.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelClass}>Process Step *</label>
                <select className={inputClass} value={form.processStep} onChange={e => setForm({ ...form, processStep: e.target.value })}>
                  <option value="">Select...</option>
                  {processOptions.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Owner</label>
                <select className={inputClass} value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })}>
                  <option value="">Select...</option>
                  {owners.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Failure Mode *</label>
              <input className={inputClass} placeholder="e.g. Dimensional out of tolerance" value={form.failureMode} onChange={e => setForm({ ...form, failureMode: e.target.value })} />
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Effect *</label>
              <input className={inputClass} placeholder="e.g. Assembly interference, product rejection" value={form.effect} onChange={e => setForm({ ...form, effect: e.target.value })} />
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Cause *</label>
              <input className={inputClass} placeholder="e.g. Tool wear, incorrect offset" value={form.cause} onChange={e => setForm({ ...form, cause: e.target.value })} />
            </div>

            {/* S, O, D — stacked segmented scales */}
            <div className="space-y-3">
              {[
                {
                  key: 'severity' as const,
                  label: 'Severity (S)',
                  desc: 'How severe is the effect on the customer?',
                  hints: { 1: 'None', 3: 'Minor', 5: 'Moderate', 7: 'High', 9: 'Hazardous', 10: 'Catastrophic' },
                },
                {
                  key: 'occurrence' as const,
                  label: 'Occurrence (O)',
                  desc: 'How often does this failure mode occur?',
                  hints: { 1: 'Unlikely', 3: 'Low', 5: 'Moderate', 7: 'High', 9: 'Very High', 10: 'Certain' },
                },
                {
                  key: 'detection' as const,
                  label: 'Detection (D)',
                  desc: 'How easily can the failure be detected before reaching the customer?',
                  hints: { 1: 'Almost certain', 3: 'High', 5: 'Moderate', 7: 'Low', 9: 'Very Low', 10: 'Impossible' },
                },
              ].map(({ key, label, desc, hints }) => {
                const current = parseInt(form[key]);
                return (
                  <div key={key} className="border border-border bg-secondary/10 p-3" style={{ borderRadius: 'var(--radius)' }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <label className={labelClass}>{label}</label>
                        <p className="text-[10px] text-muted-foreground">{desc}</p>
                      </div>
                      <span className={`font-mono text-2xl font-bold tabular-nums ${
                        current >= 8 ? 'text-status-critical' : current >= 5 ? 'text-status-warning' : 'text-status-ok'
                      }`}>
                        {current}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {[1,2,3,4,5,6,7,8,9,10].map(v => {
                        const isSelected = current >= v;
                        const color = v >= 8 ? 'critical' : v >= 5 ? 'warning' : 'ok';
                        const colorMap = {
                          critical: isSelected ? 'bg-status-critical/20 border-status-critical/70 text-status-critical' : 'bg-secondary/20 border-border/40 text-muted-foreground/40 hover:border-status-critical/40 hover:text-status-critical/60',
                          warning:  isSelected ? 'bg-status-warning/20 border-status-warning/70 text-status-warning'   : 'bg-secondary/20 border-border/40 text-muted-foreground/40 hover:border-status-warning/40 hover:text-status-warning/60',
                          ok:       isSelected ? 'bg-status-ok/20 border-status-ok/70 text-status-ok'                 : 'bg-secondary/20 border-border/40 text-muted-foreground/40 hover:border-status-ok/40 hover:text-status-ok/60',
                        };
                        return (
                          <button
                            key={v}
                            onClick={() => setForm({ ...form, [key]: String(v) })}
                            title={hints[v as keyof typeof hints] || String(v)}
                            className={`flex-1 h-8 flex items-center justify-center font-mono text-[11px] font-bold border transition-all ${colorMap[color]}`}
                            style={{ borderRadius: '2px' }}
                          >
                            {v}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-1 px-0.5">
                      <span className="text-[9px] text-muted-foreground/70 font-mono">{hints[1]}</span>
                      <span className="text-[9px] text-muted-foreground/70 font-mono">{hints[10]}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Live RPN */}
            <div className={`p-3 rounded-md border text-center ${
              computedRPN >= 150 ? 'bg-status-critical/5 border-status-critical/30' :
              computedRPN >= 80 ? 'bg-status-warning/5 border-status-warning/30' :
              'bg-status-ok/5 border-status-ok/30'
            }`}>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Risk Priority Number</span>
              <p className={`text-3xl font-mono font-bold mt-1 ${rpnColor(computedRPN)}`}>{computedRPN}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {computedRPN >= 150 ? 'High risk — immediate action required' : computedRPN >= 80 ? 'Medium risk — action recommended' : 'Low risk — monitor'}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Recommended Action</label>
              <textarea
                className={`${inputClass} resize-none`}
                rows={2}
                placeholder="What corrective or preventive action should be taken?"
                value={form.recommendedAction}
                onChange={e => setForm({ ...form, recommendedAction: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setAddOpen(false)} className="px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
            <button onClick={handleSubmit} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              {editEntry ? 'Update Entry' : 'Create Entry'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
