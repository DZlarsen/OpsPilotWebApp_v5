import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ClipboardCheck, Plus, ChevronRight, Download, Copy, Star, ChevronDown, ExternalLink } from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';
import { Task, FiveSScore, columns, priorityOrder, defaultFiveSScores } from '@/components/kanban/types';
import TaskDetailPanel from '@/components/kanban/TaskDetailPanel';
import { useBusiness } from '@/contexts/BusinessContext';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';

const auditGuidance: { category: string; questions: string[] }[] = [
  { category: 'Sort (Seiri)', questions: ['Are all items in the area necessary for current work?', 'Are there broken, obsolete, or duplicate tools?', 'Is there excess WIP, raw material, or finished goods?', 'Are personal items kept to a minimum?'] },
  { category: 'Set in Order (Seiton)', questions: ['Does every item have a clearly designated location?', 'Are shadow boards, labels, and floor markings in place?', 'Can anyone find what they need within 30 seconds?', 'Are frequently used items closest to the point of use?'] },
  { category: 'Shine (Seiso)', questions: ['Are work surfaces, equipment, and floors clean?', 'Are cleaning responsibilities assigned and visible?', 'Are sources of contamination (leaks, spills) identified and addressed?', 'Is the area free of safety hazards?'] },
  { category: 'Standardize (Seiketsu)', questions: ['Are visual work instructions and SOPs posted and current?', 'Are cleaning schedules, checklists, and standards documented?', 'Are color codes and visual management systems consistent?', 'Can a new team member understand the system quickly?'] },
  { category: 'Sustain (Shitsuke)', questions: ['Are regular audits happening at the planned frequency?', 'Are audit scores tracked and trending upward?', 'Is there management support and recognition for improvements?', 'Are corrective actions from audits being completed?'] },
];

function MiniRadar({ scores }: { scores: FiveSScore[] }) {
  const size = 80;
  const center = size / 2;
  const maxR = 30;
  const angleStep = (2 * Math.PI) / 5;
  const startAngle = -Math.PI / 2;
  const getPoint = (i: number, v: number) => {
    const angle = startAngle + i * angleStep;
    const r = (v / 5) * maxR;
    return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
  };
  const gridPoints = Array.from({ length: 5 }, (_, i) => getPoint(i, 5)).join(' ');
  const dataPoints = scores.map((s, i) => getPoint(i, s.score)).join(' ');

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <polygon points={gridPoints} fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" />
      <polygon points={dataPoints} fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))" strokeWidth="1.5" />
    </svg>
  );
}

let nextKey = 25;

export default function FiveSAudits() {
  const { owners, processOptions, initialTasks } = useBusiness();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Read the highlight flag written by TaskTracking when a 5S task is created there
  useEffect(() => {
    const id = sessionStorage.getItem('highlight5sTask');
    if (id) {
      sessionStorage.removeItem('highlight5sTask');
      // Give the task list a frame to render, then expand + scroll to it
      setTimeout(() => {
        setExpandedRow(id);
        document.getElementById(`5s-row-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    }
  }, []);
  const [reportTask, setReportTask] = useState<Task | null>(null);
  const [guidanceOpen, setGuidanceOpen] = useState<number | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', owner: owners[0], process: processOptions[0], dueDate: '' });

  const fiveSTasks = tasks.filter(t => (t.type || 'task') === '5s-audit');
  const openTask = selectedTask ? tasks.find(t => t.id === selectedTask) : null;

  const updateTask = (updated: Task) => setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
  const deleteTask = (taskId: string) => { setTasks(prev => prev.filter(t => t.id !== taskId)); toast.success('Task deleted'); };

  const getScore = (task: Task) => {
    const scores = task.fiveSScores || [];
    const total = scores.reduce((sum, s) => sum + s.score, 0);
    return { total, max: scores.length * 5, pct: scores.length > 0 ? Math.round((total / (scores.length * 5)) * 100) : 0 };
  };

  const handleCreate = () => {
    if (!form.title) { toast.error('Title is required'); return; }
    const newTask: Task = {
      id: `t-${Date.now()}`, key: `OP-${nextKey++}`, title: form.title, description: form.description,
      status: 'not-started', priority: 'medium', owner: form.owner, process: form.process,
      dueDate: form.dueDate, createdAt: new Date().toISOString().split('T')[0],
      tags: ['5S', 'Audit'], comments: [], type: '5s-audit',
      fiveSScores: [...defaultFiveSScores],
    };
    setTasks(prev => [...prev, newTask]);
    setNewOpen(false);
    setForm({ title: '', description: '', owner: owners[0], process: processOptions[0], dueDate: '' });
    toast.success(`5S Audit ${newTask.key} created`);
  };

  const copyReport = () => {
    if (!reportTask) return;
    const scores = reportTask.fiveSScores || [];
    const { total, max, pct } = getScore(reportTask);
    const text = `5S AUDIT REPORT: ${reportTask.key} — ${reportTask.title}\n${'='.repeat(60)}\nOwner: ${reportTask.owner}\nArea: ${reportTask.process}\nDate: ${reportTask.createdAt}\nOverall Score: ${total}/${max} (${pct}%)\n\n${scores.map(s => `${s.category}: ${'★'.repeat(s.score)}${'☆'.repeat(5 - s.score)} (${s.score}/5)\n  ${s.notes || '(no notes)'}\n`).join('\n')}`;
    navigator.clipboard.writeText(text);
    toast.success('Report copied to clipboard');
  };

  const downloadPdf = (task: Task) => {
    const scores = task.fiveSScores || [];
    const { total, max, pct } = getScore(task);
    const html = `<!DOCTYPE html><html><head><title>5S Audit ${task.key}</title><style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;color:#222}h1{font-size:20px;border-bottom:2px solid #333;padding-bottom:8px}h2{font-size:14px;margin-top:20px;color:#555}table{width:100%;border-collapse:collapse;margin:12px 0}td,th{border:1px solid #ddd;padding:8px;text-align:left;font-size:12px}th{background:#f5f5f5;font-weight:600}.score{font-size:16px;font-weight:bold}.star{color:#f59e0b}.empty{color:#ddd}p{font-size:12px;margin:4px 0}</style></head><body><h1>5S Audit Report: ${task.key}</h1><table><tr><th>Title</th><td>${task.title}</td></tr><tr><th>Auditor</th><td>${task.owner}</td></tr><tr><th>Area</th><td>${task.process}</td></tr><tr><th>Date</th><td>${task.createdAt}</td></tr><tr><th>Overall Score</th><td class="score">${total}/${max} (${pct}%)</td></tr></table><p>${task.description}</p>${scores.map(s => `<h2>${s.category}: <span class="star">${'★'.repeat(s.score)}</span><span class="empty">${'★'.repeat(5 - s.score)}</span> ${s.score}/5</h2><p>${s.notes || '<em>No notes</em>'}</p>`).join('')}</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank');
    if (w) { setTimeout(() => { w.print(); }, 500); }
    toast.success('Print dialog opened');
  };

  const scoreColor = (pct: number) => pct >= 80 ? 'text-status-ok' : pct >= 60 ? 'text-status-warning' : 'text-status-critical';

  const inputClass = 'w-full rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring';
  const labelClass = 'text-xs font-medium text-muted-foreground uppercase tracking-wider';

  // Avg score across all completed audits
  const completedAudits = fiveSTasks.filter(t => t.status === 'completed');
  const avgScore = completedAudits.length > 0 ? Math.round(completedAudits.reduce((sum, t) => sum + getScore(t).pct, 0) / completedAudits.length) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="page-header flex items-center gap-3 mb-2">
            <span className="page-callout">09</span>
            <span className="page-eyebrow">Project · 5S Audits</span>
          </div>
          <h1 className="page-title">5S Audits</h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mt-2">Workplace organization audits — Sort, Set in Order, Shine, Standardize, Sustain</p>
        </div>
        <button onClick={() => setNewOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" /> Start New 5S Audit
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="kpi-card text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total Audits</p>
          <p className="text-2xl font-mono font-bold">{fiveSTasks.length}</p>
        </div>
        <div className="kpi-card text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">In Progress</p>
          <p className="text-2xl font-mono font-bold text-status-warning">{fiveSTasks.filter(t => t.status === 'in-progress').length}</p>
        </div>
        <div className="kpi-card text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Completed</p>
          <p className="text-2xl font-mono font-bold text-status-ok">{completedAudits.length}</p>
        </div>
        <div className="kpi-card text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Avg Score</p>
          <p className={`text-2xl font-mono font-bold ${scoreColor(avgScore)}`}>{avgScore}%</p>
        </div>
      </div>

      {/* Audit guidance */}
      <div className="kpi-card">
        <h3 className="section-header mb-3">5S Audit Guide</h3>
        <p className="text-xs text-muted-foreground mb-4">Click each category to see checklist questions for conducting a thorough 5S audit.</p>
        <div className="grid lg:grid-cols-5 gap-2">
          {auditGuidance.map((g, i) => (
            <div key={i} className="rounded-md border border-border overflow-hidden">
              <button onClick={() => setGuidanceOpen(guidanceOpen === i ? null : i)} className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-secondary/30 transition-colors">
                <span className="text-xs font-medium flex-1">{g.category.split(' (')[0]}</span>
                <ChevronRight className={`h-3 w-3 text-muted-foreground transition-transform ${guidanceOpen === i ? 'rotate-90' : ''}`} />
              </button>
              {guidanceOpen === i && (
                <div className="px-3 pb-3 border-t border-border bg-secondary/10">
                  <ul className="space-y-1 pt-2">
                    {g.questions.map((q, qi) => (
                      <li key={qi} className="text-[11px] text-foreground/80 flex items-start gap-1.5">
                        <span className="text-primary mt-0.5">•</span> {q}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Project list */}
      <div className="kpi-card">
        <h3 className="section-header mb-3">Audit Projects</h3>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr><th>Key</th><th></th><th>Title</th><th>Status</th><th>Auditor</th><th>Area</th><th>Score</th><th>Due Date</th><th></th></tr>
            </thead>
            <tbody>
              {fiveSTasks.sort((a, b) => {
                if (a.status === 'completed' && b.status !== 'completed') return 1;
                if (a.status !== 'completed' && b.status === 'completed') return -1;
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
              }).map(task => {
                const { total, max, pct } = getScore(task);
                const overdue = task.status !== 'completed' && new Date(task.dueDate) < new Date();
                const allScored = (task.fiveSScores || []).every(s => s.score > 0);
                const isExpanded = expandedRow === task.id;
                const scores = task.fiveSScores || defaultFiveSScores;

                const updateScore = (idx: number, score: number) => {
                  const updated = scores.map((s, i) => i === idx ? { ...s, score } : s);
                  updateTask({ ...task, fiveSScores: updated });
                };

                return (
                  <>
                    <tr key={task.id}
                      id={`5s-row-${task.id}`}
                      className="cursor-pointer hover:bg-secondary/30"
                      onClick={() => setExpandedRow(isExpanded ? null : task.id)}>
                      <td className="font-mono text-xs text-primary font-medium">{task.key}</td>
                      <td><MiniRadar scores={scores} /></td>
                      <td>
                        <p className="font-medium text-sm">{task.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
                      </td>
                      <td><StatusBadge status={task.status === 'completed' ? 'ok' : task.status === 'in-progress' ? 'warning' : 'info'} label={columns.find(c => c.id === task.status)?.label} /></td>
                      <td className="text-xs whitespace-nowrap">{task.owner}</td>
                      <td className="text-xs text-muted-foreground whitespace-nowrap">{task.process}</td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm font-mono font-bold ${scoreColor(pct)}`}>{total}/{max}</span>
                          <span className="text-[10px] text-muted-foreground">({pct}%)</span>
                        </div>
                      </td>
                      <td className={`font-mono text-xs whitespace-nowrap ${overdue ? 'text-status-critical font-medium' : 'text-muted-foreground'}`}>
                        {task.dueDate}{overdue ? ' ⚠' : ''}
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          {allScored && (
                            <button onClick={(e) => { e.stopPropagation(); setReportTask(task); }}
                              className="flex items-center gap-1 px-2 py-1 rounded-md bg-status-ok/10 text-status-ok text-[10px] font-medium hover:bg-status-ok/20 transition-colors">
                              <ClipboardCheck className="h-3 w-3" /> Report
                            </button>
                          )}
                          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${task.id}-expand`}>
                        <td colSpan={9} className="p-0">
                          <div className="px-4 py-4 border-t border-dashed border-border/60 bg-background/40">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-xs text-muted-foreground">{task.description}</p>
                              <button onClick={() => setSelectedTask(task.id)}
                                className="inline-flex items-center gap-1.5 px-2 py-1 font-mono text-[10px] uppercase tracking-wider border border-border hover:bg-secondary/50 transition-colors text-muted-foreground"
                                style={{ borderRadius: 'var(--radius)' }}>
                                <ExternalLink className="h-3 w-3" /> Open full view
                              </button>
                            </div>
                            <div className="grid grid-cols-5 gap-3">
                              {scores.map((s, idx) => (
                                <div key={s.category} className="flex flex-col gap-1.5">
                                  <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{s.category}</p>
                                  <div className="flex gap-1">
                                    {[1,2,3,4,5].map(v => (
                                      <button key={v} onClick={() => updateScore(idx, v)}
                                        className={`h-6 w-6 flex items-center justify-center font-mono text-[10px] font-bold border transition-colors ${
                                          s.score >= v
                                            ? v <= 2 ? 'bg-status-critical/20 border-status-critical/60 text-status-critical'
                                            : v <= 3 ? 'bg-status-warning/20 border-status-warning/60 text-status-warning'
                                            : 'bg-status-ok/20 border-status-ok/60 text-status-ok'
                                            : 'bg-secondary/20 border-border/40 text-muted-foreground/40 hover:border-border'
                                        }`}
                                        style={{ borderRadius: '2px' }}>
                                        {v}
                                      </button>
                                    ))}
                                  </div>
                                  {s.notes && <p className="text-[10px] text-muted-foreground leading-tight">{s.notes}</p>}
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
              {fiveSTasks.length === 0 && (
                <tr><td colSpan={9} className="text-center text-sm text-muted-foreground py-8">No 5S audits yet. Click "Start New 5S Audit" to begin.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {openTask && <TaskDetailPanel task={openTask} onClose={() => setSelectedTask(null)} onUpdate={updateTask} onDelete={deleteTask} />}
      </AnimatePresence>

      {/* New audit dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Start New 5S Audit</DialogTitle>
            <DialogDescription>Define the area to audit. A scorecard with all 5 categories will be pre-populated.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className={labelClass}>Audit Title *</label>
              <input className={inputClass} placeholder="e.g. 5S Audit: CNC Machining Area" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>Description</label>
              <textarea className={`${inputClass} resize-none`} rows={2} placeholder="Scope, focus areas, previous findings..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelClass}>Auditor</label>
                <select className={inputClass} value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })}>
                  {owners.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Area / Process</label>
                <select className={inputClass} value={form.process} onChange={e => setForm({ ...form, process: e.target.value })}>
                  {processOptions.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>Target Completion</label>
              <input className={inputClass} type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setNewOpen(false)} className="px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            <button onClick={handleCreate} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">Create Audit</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report viewer */}
      <Dialog open={!!reportTask} onOpenChange={() => setReportTask(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {reportTask && (() => {
            const { total, max, pct } = getScore(reportTask);
            const scores = reportTask.fiveSScores || [];
            return (
              <>
                <DialogHeader>
                  <DialogTitle>5S Audit Report: {reportTask.key}</DialogTitle>
                  <DialogDescription>{reportTask.title}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground text-xs">Auditor:</span> <span className="font-medium">{reportTask.owner}</span></div>
                    <div><span className="text-muted-foreground text-xs">Area:</span> <span className="font-medium">{reportTask.process}</span></div>
                    <div><span className="text-muted-foreground text-xs">Date:</span> <span className="font-medium">{reportTask.createdAt}</span></div>
                    <div><span className="text-muted-foreground text-xs">Overall:</span> <span className={`font-bold ${scoreColor(pct)}`}>{total}/{max} ({pct}%)</span></div>
                  </div>
                  {scores.map((s, i) => (
                    <div key={i} className="border border-border rounded-md p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{s.category}</span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(v => (
                            <Star key={v} className={`h-3.5 w-3.5 ${v <= s.score ? 'fill-status-warning text-status-warning' : 'text-muted-foreground/30'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-foreground/80">{s.notes || '(no notes)'}</p>
                    </div>
                  ))}
                </div>
                <DialogFooter>
                  <button onClick={copyReport} className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border border-border hover:bg-secondary/50 transition-colors">
                    <Copy className="h-3.5 w-3.5" /> Copy to Clipboard
                  </button>
                  <button onClick={() => downloadPdf(reportTask)} className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                    <Download className="h-3.5 w-3.5" /> Print / Save PDF
                  </button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
