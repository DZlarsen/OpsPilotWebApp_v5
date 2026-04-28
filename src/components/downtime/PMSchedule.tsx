import { useState } from 'react';
import { Calendar, Plus, X, CheckCircle2, Clock, Wrench } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { toast } from 'sonner';

interface PMTask {
  id: string;
  processName: string;
  task: string;
  frequency: string;
  nextDue: string;
  assignee: string;
  status: 'upcoming' | 'overdue' | 'completed';
  estDuration: number;
}

function generatePMSchedule(processes: { id: string; name: string }[]): PMTask[] {
  const tasks = [
    { task: 'Lubrication & Greasing', frequency: 'Weekly', est: 30 },
    { task: 'Belt & Chain Inspection', frequency: 'Bi-weekly', est: 45 },
    { task: 'Filter Replacement', frequency: 'Monthly', est: 60 },
    { task: 'Calibration Check', frequency: 'Monthly', est: 90 },
    { task: 'Electrical Panel Inspection', frequency: 'Quarterly', est: 120 },
    { task: 'Bearing Replacement', frequency: 'Quarterly', est: 180 },
    { task: 'Full System Overhaul', frequency: 'Semi-annual', est: 480 },
  ];
  const assignees = ['A. Smith', 'B. Jones', 'C. Lee', 'D. Garcia', 'E. Wilson'];
  const result: PMTask[] = [];

  processes.forEach((proc, pi) => {
    const count = 2 + Math.floor(Math.random() * 3);
    const picked = [...tasks].sort(() => Math.random() - 0.5).slice(0, count);
    picked.forEach((t, ti) => {
      const daysOut = Math.floor(Math.random() * 30) - 5;
      const status: PMTask['status'] = daysOut < 0 ? 'overdue' : daysOut <= 7 ? 'upcoming' : 'upcoming';
      result.push({
        id: `pm-${pi}-${ti}`,
        processName: proc.name.split('—')[0].trim(),
        task: t.task,
        frequency: t.frequency,
        nextDue: addDays(new Date(), daysOut).toISOString(),
        assignee: assignees[Math.floor(Math.random() * assignees.length)],
        status: daysOut < 0 ? 'overdue' : 'upcoming',
        estDuration: t.est,
      });
    });
  });

  return result.sort((a, b) => new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime());
}

interface Props {
  processes: { id: string; name: string }[];
}

export default function PMSchedule({ processes }: Props) {
  const [pmTasks, setPmTasks] = useState(() => generatePMSchedule(processes));
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({ processIdx: '0', task: '', frequency: 'Weekly', assignee: '', estDuration: '60', daysOut: '7' });

  const overdue = pmTasks.filter(t => t.status === 'overdue').length;
  const dueSoon = pmTasks.filter(t => t.status === 'upcoming' && new Date(t.nextDue) <= addDays(new Date(), 7)).length;

  const handleAdd = () => {
    if (!newTask.task.trim() || !newTask.assignee.trim()) {
      toast.error('Please fill in task name and assignee');
      return;
    }
    const proc = processes[parseInt(newTask.processIdx)] || processes[0];
    const task: PMTask = {
      id: `pm-new-${Date.now()}`,
      processName: proc.name.split('—')[0].trim(),
      task: newTask.task,
      frequency: newTask.frequency,
      nextDue: addDays(new Date(), parseInt(newTask.daysOut) || 7).toISOString(),
      assignee: newTask.assignee,
      status: 'upcoming',
      estDuration: parseInt(newTask.estDuration) || 60,
    };
    setPmTasks(prev => [...prev, task].sort((a, b) => new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime()));
    setNewTask({ processIdx: '0', task: '', frequency: 'Weekly', assignee: '', estDuration: '60', daysOut: '7' });
    setShowAddForm(false);
    toast.success('PM task added to schedule');
  };

  const markComplete = (id: string) => {
    setPmTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'completed' as const } : t));
    toast.success('Marked as completed');
  };

  return (
    <div className="kpi-card">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h3 className="section-header mb-0">Preventive Maintenance Schedule</h3>
          {overdue > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-status-critical/15 text-status-critical">
              {overdue} overdue
            </span>
          )}
          {dueSoon > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-status-warning/15 text-status-warning">
              {dueSoon} due this week
            </span>
          )}
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          {showAddForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showAddForm ? 'Cancel' : 'Add PM Task'}
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="mb-4 p-4 rounded-lg border border-border bg-secondary/30 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Process</label>
              <select
                value={newTask.processIdx}
                onChange={e => setNewTask(p => ({ ...p, processIdx: e.target.value }))}
                className="w-full px-2 py-1.5 rounded-md border border-border bg-background text-sm"
              >
                {processes.map((p, i) => (
                  <option key={p.id} value={i}>{p.name.split('—')[0].trim()}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Task Name</label>
              <input
                value={newTask.task}
                onChange={e => setNewTask(p => ({ ...p, task: e.target.value }))}
                placeholder="e.g. Belt Inspection"
                className="w-full px-2 py-1.5 rounded-md border border-border bg-background text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Frequency</label>
              <select
                value={newTask.frequency}
                onChange={e => setNewTask(p => ({ ...p, frequency: e.target.value }))}
                className="w-full px-2 py-1.5 rounded-md border border-border bg-background text-sm"
              >
                {['Daily', 'Weekly', 'Bi-weekly', 'Monthly', 'Quarterly', 'Semi-annual', 'Annual'].map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Assignee</label>
              <input
                value={newTask.assignee}
                onChange={e => setNewTask(p => ({ ...p, assignee: e.target.value }))}
                placeholder="e.g. J. Doe"
                className="w-full px-2 py-1.5 rounded-md border border-border bg-background text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Est. Duration (min)</label>
              <input
                type="number"
                value={newTask.estDuration}
                onChange={e => setNewTask(p => ({ ...p, estDuration: e.target.value }))}
                className="w-full px-2 py-1.5 rounded-md border border-border bg-background text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Days Until Due</label>
              <input
                type="number"
                value={newTask.daysOut}
                onChange={e => setNewTask(p => ({ ...p, daysOut: e.target.value }))}
                className="w-full px-2 py-1.5 rounded-md border border-border bg-background text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleAdd}
              className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              Add to Schedule
            </button>
          </div>
        </div>
      )}

      {/* PM table */}
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Process</th>
              <th>Task</th>
              <th>Frequency</th>
              <th>Next Due</th>
              <th>Est. Duration</th>
              <th>Assignee</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pmTasks.filter(t => t.status !== 'completed').map(t => {
              const dueDate = new Date(t.nextDue);
              const isOverdue = t.status === 'overdue';
              const isDueSoon = !isOverdue && dueDate <= addDays(new Date(), 7);
              return (
                <tr key={t.id} className={isOverdue ? 'bg-status-critical/5' : ''}>
                  <td>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      isOverdue
                        ? 'bg-status-critical/15 text-status-critical'
                        : isDueSoon
                        ? 'bg-status-warning/15 text-status-warning'
                        : 'bg-chart-blue/15 text-chart-blue'
                    }`}>
                      {isOverdue ? 'Overdue' : isDueSoon ? 'Due Soon' : 'Scheduled'}
                    </span>
                  </td>
                  <td className="font-medium text-sm">{t.processName}</td>
                  <td className="text-sm">{t.task}</td>
                  <td className="text-xs text-muted-foreground">{t.frequency}</td>
                  <td className="font-mono text-xs whitespace-nowrap">{format(dueDate, 'MMM d, yyyy')}</td>
                  <td className="font-mono text-sm">{t.estDuration}m</td>
                  <td className="text-xs text-muted-foreground">{t.assignee}</td>
                  <td>
                    <button
                      onClick={() => markComplete(t.id)}
                      className="p-1 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                      title="Mark complete"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Completed section */}
      {pmTasks.some(t => t.status === 'completed') && (
        <details className="mt-3">
          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
            Show completed ({pmTasks.filter(t => t.status === 'completed').length})
          </summary>
          <div className="mt-2 space-y-1">
            {pmTasks.filter(t => t.status === 'completed').map(t => (
              <div key={t.id} className="flex items-center gap-2 text-xs text-muted-foreground line-through px-2 py-1">
                <CheckCircle2 className="h-3 w-3 text-status-stable" />
                <span>{t.processName}</span>
                <span>—</span>
                <span>{t.task}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
