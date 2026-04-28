import { useState } from 'react';
import { FileText, Plus, ChevronRight, Download, Copy, CheckCircle2, Circle, Clock, AlertTriangle, ChevronDown, ExternalLink } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import StatusBadge from '@/components/shared/StatusBadge';
import { Task, columns, priorityOrder, defaultEightDSteps } from '@/components/kanban/types';
import TaskDetailPanel from '@/components/kanban/TaskDetailPanel';
import EightDWizard from '@/components/kanban/EightDWizard';
import { useBusiness } from '@/contexts/BusinessContext';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';

// Structured meeting guidance per discipline
const disciplineGuidance: { label: string; questions: string[]; participants: string; output: string }[] = [
  { label: 'D1: Team Formation', questions: ['Who are the subject matter experts for this problem?', 'Is a champion/sponsor identified?', 'Does the team include members from production, quality, and engineering?'], participants: 'Quality Lead, Process Engineer, Production Supervisor, Maintenance', output: 'Team charter with roles and responsibilities' },
  { label: 'D2: Problem Description', questions: ['What is the defect? When was it first observed?', 'What is the quantified reject rate or failure rate?', 'Which parts, processes, or lines are affected?', 'Is this a safety or regulatory concern?'], participants: 'Full 8D team', output: 'IS/IS NOT analysis, problem statement' },
  { label: 'D3: Interim Containment', questions: ['How can we protect the customer immediately?', 'Do we need to quarantine inventory or add 100% inspection?', 'Have we notified downstream stakeholders?'], participants: 'Quality + Production', output: 'Containment action list with owners and dates' },
  { label: 'D4: Root Cause Analysis', questions: ['Have we used 5-Why analysis?', 'Have we created a Fishbone (Ishikawa) diagram?', 'Can we reproduce the failure consistently?', 'Have we verified the root cause with data?'], participants: 'Full 8D team + process experts', output: 'Verified root cause(s) with supporting data' },
  { label: 'D5: Corrective Actions', questions: ['What permanent corrective actions address the root cause?', 'Have we evaluated risk of each proposed action?', 'Will these actions introduce new failure modes?'], participants: 'Engineering + Quality', output: 'Ranked corrective action list with feasibility assessment' },
  { label: 'D6: Implementation', questions: ['Have corrective actions been implemented and verified?', 'Is there measurable improvement in the defect rate?', 'Have we updated all relevant documentation (SOPs, work instructions)?'], participants: 'Full team + validation', output: 'Implementation verification report with before/after data' },
  { label: 'D7: Prevention', questions: ['Have we updated PFMEA with new failure mode and controls?', 'Are there similar processes that need the same fix?', 'Have we updated training materials and control plans?'], participants: 'Quality + Engineering', output: 'Updated PFMEA, control plans, and training records' },
  { label: 'D8: Closure', questions: ['Is the problem fully resolved with data to prove it?', 'Have we recognized team contributions?', 'Are all documents filed and accessible?'], participants: 'Champion + Team', output: 'Final 8D report, lessons learned document' },
];

let nextKey = 21;

export default function EightDReports() {
  const { owners, processOptions, initialTasks, activeBusiness } = useBusiness();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [wizardTask, setWizardTask] = useState<Task | null>(null);
  const [reportTask, setReportTask] = useState<Task | null>(null);
  const [guidanceOpen, setGuidanceOpen] = useState<number | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', owner: owners[0], process: processOptions[0], dueDate: '', priority: 'high' as const });

  const eightDTasks = tasks.filter(t => (t.type || 'task') === '8d-report');
  const openTask = selectedTask ? tasks.find(t => t.id === selectedTask) : null;

  const updateTask = (updated: Task) => setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
  const deleteTask = (taskId: string) => { setTasks(prev => prev.filter(t => t.id !== taskId)); toast.success('Task deleted'); };

  const handleCreate = () => {
    if (!form.title) { toast.error('Title is required'); return; }
    const newTask: Task = {
      id: `t-${Date.now()}`, key: `OP-${nextKey++}`, title: form.title, description: form.description,
      status: 'in-progress', priority: form.priority, owner: form.owner, process: form.process,
      dueDate: form.dueDate, createdAt: new Date().toISOString().split('T')[0],
      tags: ['8D', 'Quality'], comments: [], type: '8d-report',
      eightDSteps: [...defaultEightDSteps],
    };
    setTasks(prev => [...prev, newTask]);
    setNewOpen(false);
    setForm({ title: '', description: '', owner: owners[0], process: processOptions[0], dueDate: '', priority: 'high' });
    toast.success(`${newTask.key} created — opening guided wizard`);
    // Open wizard immediately so team can start D1 right away
    setTimeout(() => setWizardTask(newTask), 150);
  };

  const generateReport = (task: Task) => {
    setReportTask(task);
  };

  const copyReport = () => {
    if (!reportTask) return;
    const steps = reportTask.eightDSteps || [];
    const text = `8D REPORT: ${reportTask.key} — ${reportTask.title}\n${'='.repeat(60)}\nOwner: ${reportTask.owner}\nProcess: ${reportTask.process}\nStatus: ${columns.find(c => c.id === reportTask.status)?.label}\nCreated: ${reportTask.createdAt} | Due: ${reportTask.dueDate}\n\n${steps.map(s => `${s.label} [${s.completed ? '✓' : '○'}]\n${s.notes || '(no notes)'}\n`).join('\n')}\nComments:\n${reportTask.comments.filter(c => !c.system).map(c => `  ${c.author} (${c.timestamp.split('T')[0]}): ${c.text}`).join('\n') || '  (none)'}`;
    navigator.clipboard.writeText(text);
    toast.success('Report copied to clipboard');
  };

  const downloadPdf = async (task: Task) => {
    // Generate a simple HTML-based print view
    const steps = task.eightDSteps || [];
    const html = `<!DOCTYPE html><html><head><title>8D Report ${task.key}</title><style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;color:#222}h1{font-size:20px;border-bottom:2px solid #333;padding-bottom:8px}h2{font-size:14px;margin-top:24px;color:#555}table{width:100%;border-collapse:collapse;margin:12px 0}td,th{border:1px solid #ddd;padding:8px;text-align:left;font-size:12px}th{background:#f5f5f5;font-weight:600}.check{color:green;font-weight:bold}.uncheck{color:#999}p{font-size:12px;margin:4px 0}</style></head><body><h1>8D Report: ${task.key}</h1><table><tr><th>Title</th><td>${task.title}</td></tr><tr><th>Owner</th><td>${task.owner}</td></tr><tr><th>Process</th><td>${task.process}</td></tr><tr><th>Status</th><td>${columns.find(c => c.id === task.status)?.label}</td></tr><tr><th>Priority</th><td>${task.priority}</td></tr><tr><th>Created</th><td>${task.createdAt}</td></tr><tr><th>Due Date</th><td>${task.dueDate}</td></tr></table><p><strong>Description:</strong> ${task.description}</p>${steps.map(s => `<h2>${s.completed ? '✅' : '⬜'} ${s.label}</h2><p>${s.notes || '<em>No notes recorded</em>'}</p>`).join('')}<h2>Activity Log</h2>${task.comments.length > 0 ? task.comments.map(c => `<p><strong>${c.author}</strong> (${c.timestamp.split('T')[0]}): ${c.text}</p>`).join('') : '<p><em>No comments</em></p>'}</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank');
    if (w) { setTimeout(() => { w.print(); }, 500); }
    toast.success('Print dialog opened');
  };

  const inputClass = 'w-full rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring';
  const labelClass = 'text-xs font-medium text-muted-foreground uppercase tracking-wider';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="page-header flex items-center gap-3 mb-2">
            <span className="page-callout">08</span>
            <span className="page-eyebrow">Project · 8D Reports</span>
          </div>
          <h1 className="page-title">8D Problem Solving</h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mt-2">Structured 8-discipline methodology for root cause analysis and corrective action</p>
        </div>
        <button onClick={() => setNewOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" /> Start New 8D
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="kpi-card text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total 8D Reports</p>
          <p className="text-2xl font-mono font-bold">{eightDTasks.length}</p>
        </div>
        <div className="kpi-card text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Open</p>
          <p className="text-2xl font-mono font-bold text-status-warning">{eightDTasks.filter(t => t.status !== 'completed').length}</p>
        </div>
        <div className="kpi-card text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Completed</p>
          <p className="text-2xl font-mono font-bold text-status-ok">{eightDTasks.filter(t => t.status === 'completed').length}</p>
        </div>
        <div className="kpi-card text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Overdue</p>
          <p className="text-2xl font-mono font-bold text-status-critical">{eightDTasks.filter(t => t.status !== 'completed' && new Date(t.dueDate) < new Date()).length}</p>
        </div>
      </div>

      {/* Meeting guidance section */}
      <div className="kpi-card">
        <h3 className="section-header mb-3">8D Discipline Guide</h3>
        <p className="text-xs text-muted-foreground mb-4">Click each discipline to see structured meeting guidance, recommended participants, and expected outputs.</p>
        <div className="space-y-1">
          {disciplineGuidance.map((d, i) => (
            <div key={i} className="rounded-md border border-border overflow-hidden">
              <button onClick={() => setGuidanceOpen(guidanceOpen === i ? null : i)} className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-secondary/30 transition-colors">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary flex-shrink-0">
                  D{i + 1}
                </span>
                <span className="text-sm font-medium flex-1">{d.label}</span>
                <ChevronRight className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${guidanceOpen === i ? 'rotate-90' : ''}`} />
              </button>
              {guidanceOpen === i && (
                <div className="px-4 pb-3 border-t border-border bg-secondary/10 space-y-3">
                  <div className="pt-3">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Key Questions</p>
                    <ul className="space-y-1">
                      {d.questions.map((q, qi) => (
                        <li key={qi} className="text-xs text-foreground/80 flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span> {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Recommended Participants</p>
                    <p className="text-xs text-foreground/80">{d.participants}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Expected Output</p>
                    <p className="text-xs text-foreground/80">{d.output}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Project list */}
      <div className="kpi-card">
        <h3 className="section-header mb-3">Active 8D Projects</h3>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr><th>Key</th><th>Title</th><th>Status</th><th>Priority</th><th>Owner</th><th>D1–D8 Progress</th><th>Due</th><th></th></tr>
            </thead>
            <tbody>
              {eightDTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]).map(task => {
                const steps = task.eightDSteps || defaultEightDSteps;
                const completedSteps = steps.filter(s => s.completed).length;
                const nextStep = steps.findIndex(s => !s.completed);
                const allComplete = completedSteps === steps.length;
                const overdue = task.status !== 'completed' && new Date(task.dueDate) < new Date();
                const isExpanded = expandedRow === task.id;

                const toggleStep = (i: number) => {
                  const updated = steps.map((s, idx) => idx === i ? { ...s, completed: !s.completed } : s);
                  updateTask({ ...task, eightDSteps: updated });
                };

                return (
                  <>
                    <tr key={task.id}
                      className="cursor-pointer hover:bg-secondary/30"
                      onClick={() => setExpandedRow(isExpanded ? null : task.id)}
                    >
                      <td className="font-mono text-xs text-primary font-medium">{task.key}</td>
                      <td>
                        <p className="font-medium text-sm">{task.title}</p>
                        {nextStep >= 0 && !allComplete && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">Next: {steps[nextStep].label.split(':')[0]}</p>
                        )}
                      </td>
                      <td><StatusBadge status={task.status === 'completed' ? 'ok' : task.status === 'in-progress' ? 'warning' : 'info'} label={columns.find(c => c.id === task.status)?.label} /></td>
                      <td><StatusBadge status={task.priority === 'critical' ? 'critical' : task.priority === 'high' ? 'warning' : 'reviewed'} label={task.priority} /></td>
                      <td className="text-xs whitespace-nowrap">{task.owner}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          {steps.map((s, i) => (
                            <button
                              key={i}
                              onClick={e => { e.stopPropagation(); toggleStep(i); }}
                              title={s.label}
                              className={`h-5 w-5 flex items-center justify-center font-mono text-[9px] font-bold border transition-colors hover:scale-110 ${
                                s.completed
                                  ? 'bg-status-ok/20 border-status-ok/60 text-status-ok'
                                  : i === nextStep
                                  ? 'bg-primary/10 border-primary/60 text-primary'
                                  : 'bg-secondary/30 border-border/50 text-muted-foreground/50'
                              }`}
                              style={{ borderRadius: '2px' }}
                            >
                              {i + 1}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className={`font-mono text-xs whitespace-nowrap ${overdue ? 'text-status-critical font-medium' : 'text-muted-foreground'}`}>
                        {task.dueDate}{overdue ? ' ⚠' : ''}
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          {allComplete && (
                            <button
                              onClick={e => { e.stopPropagation(); generateReport(task); }}
                              className="flex items-center gap-1 px-2 py-1 rounded-md bg-status-ok/10 text-status-ok text-[10px] font-medium hover:bg-status-ok/20 transition-colors"
                            >
                              <FileText className="h-3 w-3" /> Report
                            </button>
                          )}
                          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${task.id}-expand`}>
                        <td colSpan={8} className="p-0">
                          <div className="px-4 py-4 border-t border-dashed border-border/60 bg-background/40 space-y-3">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs text-muted-foreground">{task.description}</p>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setWizardTask(task)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 font-mono text-[10px] uppercase tracking-wider border border-primary/50 bg-primary/5 text-primary hover:bg-primary/15 transition-colors"
                                  style={{ borderRadius: 'var(--radius)' }}
                                >
                                  <ChevronRight className="h-3 w-3" /> Guide me
                                </button>
                                <button
                                  onClick={() => setSelectedTask(task.id)}
                                  className="inline-flex items-center gap-1.5 px-2 py-1 font-mono text-[10px] uppercase tracking-wider border border-border hover:bg-secondary/50 transition-colors text-muted-foreground"
                                  style={{ borderRadius: 'var(--radius)' }}
                                >
                                  <ExternalLink className="h-3 w-3" /> Full view
                                </button>
                              </div>
                            </div>
                            <div className="grid gap-1.5">
                              {steps.map((step, i) => (
                                <div key={i} className={`flex items-start gap-3 p-2.5 border transition-colors ${step.completed ? 'border-status-ok/20 bg-status-ok/[0.04]' : i === nextStep ? 'border-primary/30 bg-primary/[0.04]' : 'border-border/40 bg-background/20'}`} style={{ borderRadius: 'var(--radius)' }}>
                                  <button
                                    onClick={() => toggleStep(i)}
                                    className="flex-shrink-0 mt-0.5"
                                  >
                                    {step.completed
                                      ? <CheckCircle2 className="h-4 w-4 text-status-ok" />
                                      : <Circle className={`h-4 w-4 ${i === nextStep ? 'text-primary' : 'text-muted-foreground/40'}`} />}
                                  </button>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-xs font-semibold ${step.completed ? 'line-through text-muted-foreground' : ''}`}>{step.label}</p>
                                    <p className="text-[10px] text-muted-foreground">{step.description}</p>
                                    {step.notes && (
                                      <p className="text-[11px] text-foreground/80 mt-1 italic">"{step.notes}"</p>
                                    )}
                                  </div>
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
              {eightDTasks.length === 0 && (
                <tr><td colSpan={8} className="text-center text-sm text-muted-foreground py-8">No 8D reports yet. Click "Start New 8D" to begin.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {openTask && <TaskDetailPanel task={openTask} onClose={() => setSelectedTask(null)} onUpdate={updateTask} onDelete={deleteTask} />}
      </AnimatePresence>

      {/* Guided 8D wizard */}
      <AnimatePresence>
        {wizardTask && (
          <EightDWizard
            task={tasks.find(t => t.id === wizardTask.id) || wizardTask}
            onClose={() => setWizardTask(null)}
            onUpdate={(updated) => {
              updateTask(updated);
              setWizardTask(updated);
            }}
          />
        )}
      </AnimatePresence>

      {/* New 8D — guided setup dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">D0 · Setup</span>
            </div>
            <DialogTitle>Start a new 8D investigation</DialogTitle>
            <DialogDescription>
              Define the problem and team. After creating, you'll be walked through each discipline step-by-step.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Problem framing hint */}
            <div className="p-3 border border-primary/20 bg-primary/[0.04] text-xs text-foreground/80 leading-relaxed" style={{ borderRadius: 'var(--radius)' }}>
              <span className="font-mono text-[9px] uppercase tracking-wider text-primary block mb-1">Before you begin</span>
              A good 8D title states the defect, part number, and observed rate — e.g.
              <em className="text-primary"> "8D: Flash on housing P/N 4420 — 12% reject since batch B3"</em>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Problem title *</label>
              <input
                className={inputClass}
                placeholder="8D: [defect] on [part/process] — [rate/impact]"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Initial description</label>
              <textarea
                className={`${inputClass} resize-none`}
                rows={2}
                placeholder="When first observed, affected area, initial impact estimate…"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className={labelClass}>Team lead *</label>
                <select className={inputClass} value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })}>
                  {owners.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Affected process *</label>
                <select className={inputClass} value={form.process} onChange={e => setForm({ ...form, process: e.target.value })}>
                  {processOptions.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className={labelClass}>Priority *</label>
                <select className={inputClass} value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as any })}>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Target completion</label>
                <input className={inputClass} type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
              </div>
            </div>

            {/* What happens next */}
            <div className="pt-2 border-t border-border/60">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-2">What happens after you create</p>
              <div className="flex items-center gap-2 flex-wrap">
                {['D1 Team', 'D2 Problem', 'D3 Contain', 'D4 Root Cause', 'D5 Fix', 'D6 Validate', 'D7 Prevent', 'D8 Close'].map((s, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <span className="font-mono text-[9px] px-1.5 py-0.5 border border-border bg-secondary/30 text-muted-foreground" style={{ borderRadius: '2px' }}>{s}</span>
                    {i < 7 && <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/40" />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <button onClick={() => setNewOpen(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!form.title.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ borderRadius: 'var(--radius)' }}
            >
              Create & open wizard
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report viewer */}
      <Dialog open={!!reportTask} onOpenChange={() => setReportTask(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {reportTask && (
            <>
              <DialogHeader>
                <DialogTitle>8D Report: {reportTask.key}</DialogTitle>
                <DialogDescription>{reportTask.title}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground text-xs">Owner:</span> <span className="font-medium">{reportTask.owner}</span></div>
                  <div><span className="text-muted-foreground text-xs">Process:</span> <span className="font-medium">{reportTask.process}</span></div>
                  <div><span className="text-muted-foreground text-xs">Created:</span> <span className="font-medium">{reportTask.createdAt}</span></div>
                  <div><span className="text-muted-foreground text-xs">Due:</span> <span className="font-medium">{reportTask.dueDate}</span></div>
                </div>
                <div className="border-t border-border pt-3">
                  <p className="text-xs text-muted-foreground mb-2">{reportTask.description}</p>
                </div>
                {(reportTask.eightDSteps || []).map((step, i) => (
                  <div key={i} className="border border-border rounded-md p-3">
                    <div className="flex items-center gap-2 mb-1">
                      {step.completed ? <CheckCircle2 className="h-4 w-4 text-status-ok" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                      <span className="text-sm font-medium">{step.label}</span>
                    </div>
                    <p className="text-xs text-foreground/80 ml-6">{step.notes || '(no notes)'}</p>
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
