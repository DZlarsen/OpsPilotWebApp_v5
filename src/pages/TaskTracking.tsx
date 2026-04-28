import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { AnimatePresence } from 'framer-motion';
import StatusBadge from '@/components/shared/StatusBadge';
import {
  Plus, GripVertical, User, ArrowLeft, Calendar, MessageSquare,
  LayoutGrid, List, Bug, ClipboardCheck, Sparkles, FileText, CheckSquare,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Task, TaskStatus, Priority, TaskType,
  columns, priorityOrder, PIE_COLORS, taskTypes, defaultEightDSteps, defaultFiveSScores,
} from '@/components/kanban/types';
import KanbanFilters from '@/components/kanban/KanbanFilters';
import TaskDetailPanel from '@/components/kanban/TaskDetailPanel';
import EightDWizard from '@/components/kanban/EightDWizard';
import { useBusiness } from '@/contexts/BusinessContext';

let nextKey = 15;

const typeIcons: Record<TaskType, typeof Bug> = {
  task: CheckSquare, bug: Bug, '8d-report': FileText, '5s-audit': ClipboardCheck, improvement: Sparkles,
};

export default function TaskTracking() {
  const { owners, processOptions, initialTasks, activeBusiness } = useBusiness();
  const navigate = useNavigate();

  const emptyForm = {
    title: '',
    description: '',
    priority: 'medium' as Priority,
    owner: owners[0],
    process: processOptions[0],
    dueDate: '',
    tags: '',
    type: 'task' as TaskType,
  };

  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [addOpen, setAddOpen] = useState(false);
  const [wizardTask, setWizardTask] = useState<Task | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedOwner, setSelectedOwner] = useState<string | null>(null);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [activeKpiFilter, setActiveKpiFilter] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [processFilter, setProcessFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    setTasks(initialTasks);
    setForm({ ...emptyForm, owner: owners[0], process: processOptions[0] });
    setSelectedOwner(null);
    setSelectedTask(null);
    setSearch(''); setOwnerFilter(''); setPriorityFilter(''); setProcessFilter(''); setTypeFilter('');
    setActiveKpiFilter(null);
  }, [activeBusiness.id]);

  // Read prefill from Insights "Assign Task" and open new-task drawer pre-populated
  useEffect(() => {
    const raw = sessionStorage.getItem('newTaskPrefill');
    if (raw) {
      sessionStorage.removeItem('newTaskPrefill');
      try {
        const prefill = JSON.parse(raw);
        setForm(f => ({
          ...f,
          title: prefill.title || '',
          description: prefill.description || '',
          priority: prefill.priority || 'medium',
          tags: prefill.tags || [],
        }));
        setAddOpen(true);
      } catch {}
    }
  }, []);

  const handleSubmit = () => {
    if (!form.title) { toast.error('Title is required'); return; }
    const newTask: Task = {
      id: `t-${Date.now()}`,
      key: `OP-${nextKey++}`,
      title: form.title,
      description: form.description,
      status: form.type === '8d-report' ? 'in-progress' : 'not-started',
      priority: form.priority,
      owner: form.owner,
      process: form.process,
      dueDate: form.dueDate,
      createdAt: new Date().toISOString().split('T')[0],
      tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
      comments: [],
      type: form.type,
      ...(form.type === '8d-report' ? { eightDSteps: [...defaultEightDSteps] } : {}),
      ...(form.type === '5s-audit' ? { fiveSScores: [...defaultFiveSScores] } : {}),
    };
    setTasks(prev => [...prev, newTask]);
    setForm(emptyForm);
    setAddOpen(false);

    if (form.type === '8d-report') {
      toast.success(`${newTask.key} created — opening guided 8D wizard`);
      setTimeout(() => setWizardTask(newTask), 150);
    } else if (form.type === '5s-audit') {
      // Flag so the 5S page can highlight the new task
      sessionStorage.setItem('highlight5sTask', newTask.id);
      toast.success(`${newTask.key} created — opening 5S Audits page`);
      navigate('/5s-audits');
    } else {
      toast.success(`Task ${newTask.key} created`);
    }
  };

  const moveTask = (taskId: string, newStatus: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  const updateTask = (updated: Task) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    toast.success('Task deleted');
  };

  const handleDragStart = (taskId: string) => setDraggedTask(taskId);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (status: TaskStatus) => {
    if (draggedTask) { moveTask(draggedTask, status); setDraggedTask(null); }
  };

  // Apply filters (including KPI drill-down)
  const filteredTasks = tasks.filter(t => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.description.toLowerCase().includes(search.toLowerCase()) && !t.key.toLowerCase().includes(search.toLowerCase())) return false;
    if (ownerFilter && t.owner !== ownerFilter) return false;
    if (priorityFilter && t.priority !== priorityFilter) return false;
    if (processFilter && t.process !== processFilter) return false;
    if (typeFilter && (t.type || 'task') !== typeFilter) return false;
    // KPI drill-down filters
    if (activeKpiFilter === 'overdue' && !(t.status !== 'completed' && new Date(t.dueDate) < new Date())) return false;
    if (activeKpiFilter === 'in-progress' && t.status !== 'in-progress') return false;
    if (activeKpiFilter === 'high-critical' && t.priority !== 'high' && t.priority !== 'critical') return false;
    if (activeKpiFilter === '8d' && (t.type || 'task') !== '8d-report') return false;
    if (activeKpiFilter === '5s' && (t.type || 'task') !== '5s-audit') return false;
    return true;
  });

  const openTask = selectedTask ? tasks.find(t => t.id === selectedTask) : null;

  // Owner drill-down view
  if (selectedOwner) {
    const ownerTasks = tasks.filter(t => t.owner === selectedOwner);
    const pieData = columns.map(col => ({
      name: col.label,
      value: ownerTasks.filter(t => t.status === col.id).length,
    }));

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedOwner(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div>
            <div className="page-header flex items-center gap-3 mb-2">
            <span className="page-callout">07</span>
            <span className="page-eyebrow">Project · Kanban</span>
          </div>
          <h1 className="page-title">{selectedOwner}</h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mt-2">{ownerTasks.length} assigned tasks</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="kpi-card flex flex-col items-center">
            <h3 className="section-header self-start">Task Breakdown</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(220, 18%, 12%)', border: '1px solid hsl(220, 16%, 18%)', borderRadius: '6px', fontSize: '12px', color: 'hsl(210, 20%, 92%)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: PIE_COLORS[i] }} />
                  {d.name} ({d.value})
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3 content-start">
            <div className="kpi-card text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total</p>
              <p className="text-2xl font-mono font-bold">{ownerTasks.length}</p>
            </div>
            <div className="kpi-card text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Overdue</p>
              <p className="text-2xl font-mono font-bold text-status-critical">
                {ownerTasks.filter(t => t.status !== 'completed' && new Date(t.dueDate) < new Date()).length}
              </p>
            </div>
            <div className="kpi-card text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">High/Critical</p>
              <p className="text-2xl font-mono font-bold text-status-warning">
                {ownerTasks.filter(t => t.priority === 'high' || t.priority === 'critical').length}
              </p>
            </div>
            <div className="kpi-card text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Completion</p>
              <p className="text-2xl font-mono font-bold text-status-ok">
                {ownerTasks.length > 0 ? Math.round((ownerTasks.filter(t => t.status === 'completed').length / ownerTasks.length) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="kpi-card overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr><th>Key</th><th>Task</th><th>Type</th><th>Process</th><th>Priority</th><th>Due Date</th><th>Status</th></tr>
            </thead>
            <tbody>
              {ownerTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]).map(task => {
                const overdue = task.status !== 'completed' && new Date(task.dueDate) < new Date();
                const tType = task.type || 'task';
                const TIcon = typeIcons[tType];
                return (
                  <tr key={task.id} className="cursor-pointer hover:bg-secondary/30" onClick={() => setSelectedTask(task.id)}>
                    <td className="font-mono text-xs text-primary font-medium">{task.key}</td>
                    <td>
                      <p className="font-medium text-sm">{task.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
                    </td>
                    <td><span className={`flex items-center gap-1 text-xs ${taskTypes.find(tt => tt.id === tType)?.color}`}><TIcon className="h-3 w-3" />{taskTypes.find(tt => tt.id === tType)?.label}</span></td>
                    <td className="text-muted-foreground whitespace-nowrap">{task.process}</td>
                    <td><StatusBadge status={task.priority === 'critical' ? 'critical' : task.priority === 'high' ? 'warning' : task.priority === 'medium' ? 'reviewed' : 'ok'} label={task.priority} /></td>
                    <td className={`font-mono text-xs whitespace-nowrap ${overdue ? 'text-status-critical font-medium' : 'text-muted-foreground'}`}>
                      {task.dueDate}{overdue ? ' ⚠' : ''}
                    </td>
                    <td><StatusBadge status={task.status === 'completed' ? 'ok' : task.status === 'in-progress' ? 'warning' : 'info'} label={columns.find(c => c.id === task.status)?.label} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <AnimatePresence>
          {openTask && (
            <TaskDetailPanel task={openTask} onClose={() => setSelectedTask(null)} onUpdate={updateTask} onDelete={deleteTask} />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Main view
  const inputClass = 'w-full rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring';
  const labelClass = 'text-xs font-medium text-muted-foreground uppercase tracking-wider';

  const total = tasks.length;
  const notStarted = tasks.filter(t => t.status === 'not-started').length;
  const inProgress = tasks.filter(t => t.status === 'in-progress').length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const overdue = tasks.filter(t => t.status !== 'completed' && new Date(t.dueDate) < new Date()).length;
  const highPriority = tasks.filter(t => t.priority === 'high' || t.priority === 'critical').length;
  const eightDCount = tasks.filter(t => (t.type || 'task') === '8d-report').length;
  const fiveSCount = tasks.filter(t => (t.type || 'task') === '5s-audit').length;
  const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const pieData = columns.map(col => ({ name: col.label, value: tasks.filter(t => t.status === col.id).length }));
  const barSegments = [
    { pct: (completed / total) * 100, color: 'bg-status-ok' },
    { pct: (inProgress / total) * 100, color: 'bg-status-warning' },
    { pct: (notStarted / total) * 100, color: 'bg-muted-foreground/50' },
  ];

  const renderTaskCard = (task: Task) => {
    const taskOverdue = task.status !== 'completed' && new Date(task.dueDate) < new Date();
    const tType = task.type || 'task';
    const TIcon = typeIcons[tType];
    const subtaskCount = task.subtasks?.length || 0;
    const subtaskDone = task.subtasks?.filter(s => s.completed).length || 0;

    return (
      <div
        key={task.id}
        draggable
        onDragStart={() => handleDragStart(task.id)}
        onClick={() => setSelectedTask(task.id)}
        className="kpi-card cursor-pointer hover:border-primary/40 transition-colors group"
      >
        <div className="flex items-start gap-2 mb-2">
          <GripVertical className="h-4 w-4 text-muted-foreground/40 mt-0.5 flex-shrink-0 cursor-grab active:cursor-grabbing" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold text-primary">{task.key}</span>
              <span className={`flex items-center gap-0.5 text-[10px] font-medium ${taskTypes.find(tt => tt.id === tType)?.color}`}>
                <TIcon className="h-2.5 w-2.5" />
                {taskTypes.find(tt => tt.id === tType)?.label}
              </span>
              <StatusBadge
                status={task.priority === 'critical' ? 'critical' : task.priority === 'high' ? 'warning' : task.priority === 'medium' ? 'reviewed' : 'ok'}
                label={task.priority}
              />
              {taskOverdue && <span className="text-[10px] font-bold text-status-critical">OVERDUE</span>}
            </div>
            <h4 className="text-sm font-medium mt-1.5 leading-tight">{task.title}</h4>
          </div>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2 ml-6">{task.description}</p>

        {/* Subtask progress */}
        {subtaskCount > 0 && (
          <div className="ml-6 mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-secondary/50 overflow-hidden">
              <div className="h-full bg-status-ok rounded-full transition-all" style={{ width: `${(subtaskDone / subtaskCount) * 100}%` }} />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">{subtaskDone}/{subtaskCount}</span>
          </div>
        )}

        <div className="flex items-center gap-3 mt-3 ml-6 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {task.owner.split(' ')[0]}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span className={taskOverdue ? 'text-status-critical' : ''}>{task.dueDate}</span>
          </span>
          {task.comments.filter(c => !c.system).length > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {task.comments.filter(c => !c.system).length}
            </span>
          )}
          <span className="ml-auto px-1.5 py-0.5 rounded bg-secondary/50">{task.process}</span>
        </div>

        {task.tags.length > 0 && (
          <div className="flex gap-1 mt-2 ml-6 flex-wrap">
            {task.tags.map(tag => (
              <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary/70">{tag}</span>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="page-header flex items-center gap-3 mb-2">
            <span className="page-callout">07</span>
            <span className="page-eyebrow">Project · Kanban</span>
          </div>
          <h1 className="page-title">Kanban Board</h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mt-2">
            Assign and track tasks across your team
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-md border border-border overflow-hidden">
            <button
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'board' ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground hover:text-foreground'}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Board
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground hover:text-foreground'}`}
            >
              <List className="h-3.5 w-3.5" /> List
            </button>
          </div>
          <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" /> New Task
          </button>
        </div>
      </div>

      {/* Active filter indicator */}
      {activeKpiFilter && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary/10 border border-primary/20">
          <span className="text-xs font-medium text-primary">
            Filtered: {activeKpiFilter === 'overdue' ? 'Overdue Tasks' : activeKpiFilter === 'in-progress' ? 'In Progress' : activeKpiFilter === 'high-critical' ? 'High/Critical Priority' : activeKpiFilter === '8d' ? '8D Reports' : activeKpiFilter === '5s' ? '5S Audits' : 'All'}
          </span>
          <button onClick={() => setActiveKpiFilter(null)} className="ml-auto text-xs text-primary hover:text-primary/80 font-medium">
            ✕ Clear Filter
          </button>
        </div>
      )}

      {/* Progress Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-8 gap-3">
        <div className="col-span-2 kpi-card flex flex-col items-center">
          <h3 className="section-header self-start">Progress Overview</h3>
          <div className="relative">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value" stroke="none">
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-mono font-bold">{completionPct}%</span>
              <span className="text-[10px] text-muted-foreground">complete</span>
            </div>
          </div>
          <div className="flex gap-3 mt-1">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-[10px]">
                <span className="h-2 w-2 rounded-sm" style={{ background: PIE_COLORS[i] }} />
                <span className="text-muted-foreground">{d.name}</span>
                <span className="font-mono font-medium">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="kpi-card text-center flex flex-col justify-center cursor-pointer hover:border-primary/40 transition-all" onClick={() => setActiveKpiFilter(null)}>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total Tasks</p>
          <p className="text-2xl font-mono font-bold">{total}</p>
        </div>
        <button onClick={() => setActiveKpiFilter(activeKpiFilter === 'in-progress' ? null : 'in-progress')} className={`kpi-card text-center flex flex-col justify-center cursor-pointer hover:border-primary/40 transition-all ${activeKpiFilter === 'in-progress' ? 'border-primary ring-1 ring-primary/30' : ''}`}>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">In Progress</p>
          <p className="text-2xl font-mono font-bold text-status-warning">{inProgress}</p>
        </button>
        <button onClick={() => setActiveKpiFilter(activeKpiFilter === 'overdue' ? null : 'overdue')} className={`kpi-card text-center flex flex-col justify-center cursor-pointer hover:border-primary/40 transition-all ${activeKpiFilter === 'overdue' ? 'border-primary ring-1 ring-primary/30' : ''}`}>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Overdue</p>
          <p className={`text-2xl font-mono font-bold ${overdue > 0 ? 'text-status-critical' : 'text-status-ok'}`}>{overdue}</p>
        </button>
        <button onClick={() => setActiveKpiFilter(activeKpiFilter === 'high-critical' ? null : 'high-critical')} className={`kpi-card text-center flex flex-col justify-center cursor-pointer hover:border-primary/40 transition-all ${activeKpiFilter === 'high-critical' ? 'border-primary ring-1 ring-primary/30' : ''}`}>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">High/Critical</p>
          <p className="text-2xl font-mono font-bold text-status-warning">{highPriority}</p>
        </button>
        <button onClick={() => setActiveKpiFilter(activeKpiFilter === '8d' ? null : '8d')} className={`kpi-card text-center flex flex-col justify-center cursor-pointer hover:border-primary/40 transition-all ${activeKpiFilter === '8d' ? 'border-primary ring-1 ring-primary/30' : ''}`}>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">8D Reports</p>
          <p className="text-2xl font-mono font-bold text-status-warning">{eightDCount}</p>
        </button>
        <button onClick={() => setActiveKpiFilter(activeKpiFilter === '5s' ? null : '5s')} className={`kpi-card text-center flex flex-col justify-center cursor-pointer hover:border-primary/40 transition-all ${activeKpiFilter === '5s' ? 'border-primary ring-1 ring-primary/30' : ''}`}>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">5S Audits</p>
          <p className="text-2xl font-mono font-bold text-status-ok">{fiveSCount}</p>
        </button>

        <div className="col-span-2 lg:col-span-8 kpi-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Overall completion</span>
            <span className="text-xs font-mono font-medium">{completed}/{total} tasks</span>
          </div>
          <div className="h-3 w-full rounded-full bg-secondary/50 overflow-hidden flex">
            {barSegments.map((seg, i) => (
              seg.pct > 0 && <div key={i} className={`h-full ${seg.color} transition-all duration-500`} style={{ width: `${seg.pct}%` }} />
            ))}
          </div>
          <div className="flex gap-4 mt-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-status-ok" /> Done</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-status-warning" /> In Progress</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-muted-foreground/50" /> To Do</span>
          </div>
        </div>
      </div>

      {/* Team avatars */}
      <div className="flex gap-2 flex-wrap">
        {owners.filter(o => tasks.some(t => t.owner === o)).map(owner => {
          const ownerTasks = tasks.filter(t => t.owner === owner);
          const done = ownerTasks.filter(t => t.status === 'completed').length;
          return (
            <button key={owner} onClick={() => setSelectedOwner(owner)} className="flex items-center gap-2 px-3 py-2 rounded-md bg-card border border-border hover:border-primary/30 transition-colors">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                {owner.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="text-left">
                <p className="text-xs font-medium">{owner.split(' ')[0]}</p>
                <p className="text-[10px] text-muted-foreground">{done}/{ownerTasks.length} done</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <KanbanFilters
        search={search} onSearchChange={setSearch}
        ownerFilter={ownerFilter} onOwnerFilterChange={setOwnerFilter}
        priorityFilter={priorityFilter} onPriorityFilterChange={setPriorityFilter}
        processFilter={processFilter} onProcessFilterChange={setProcessFilter}
        typeFilter={typeFilter} onTypeFilterChange={setTypeFilter}
      />

      {/* Board View */}
      {viewMode === 'board' && (
        <div className="grid lg:grid-cols-3 gap-4">
          {columns.map(col => {
            const colTasks = filteredTasks
              .filter(t => t.status === col.id)
              .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

            return (
              <div key={col.id} className="space-y-2" onDragOver={handleDragOver} onDrop={() => handleDrop(col.id)}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`h-2.5 w-2.5 rounded-full ${col.color}`} />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{col.label}</h3>
                  <span className="ml-auto text-xs font-mono text-muted-foreground">{colTasks.length}</span>
                </div>
                <div className="space-y-2 min-h-[200px]">
                  {colTasks.map(renderTaskCard)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="kpi-card overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Type</th>
                <th>Title</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assignee</th>
                <th>Process</th>
                <th>Due Date</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]).map(task => {
                const taskOverdue = task.status !== 'completed' && new Date(task.dueDate) < new Date();
                const tType = task.type || 'task';
                const TIcon = typeIcons[tType];
                const subtaskCount = task.subtasks?.length || 0;
                const subtaskDone = task.subtasks?.filter(s => s.completed).length || 0;
                return (
                  <tr key={task.id} className="cursor-pointer hover:bg-secondary/30" onClick={() => setSelectedTask(task.id)}>
                    <td className="font-mono text-xs text-primary font-medium">{task.key}</td>
                    <td>
                      <span className={`flex items-center gap-1 text-xs whitespace-nowrap ${taskTypes.find(tt => tt.id === tType)?.color}`}>
                        <TIcon className="h-3 w-3" />
                        {taskTypes.find(tt => tt.id === tType)?.label}
                      </span>
                    </td>
                    <td>
                      <p className="font-medium text-sm">{task.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
                    </td>
                    <td><StatusBadge status={task.status === 'completed' ? 'ok' : task.status === 'in-progress' ? 'warning' : 'info'} label={columns.find(c => c.id === task.status)?.label} /></td>
                    <td><StatusBadge status={task.priority === 'critical' ? 'critical' : task.priority === 'high' ? 'warning' : task.priority === 'medium' ? 'reviewed' : 'ok'} label={task.priority} /></td>
                    <td className="text-xs whitespace-nowrap">{task.owner}</td>
                    <td className="text-xs text-muted-foreground whitespace-nowrap">{task.process}</td>
                    <td className={`font-mono text-xs whitespace-nowrap ${taskOverdue ? 'text-status-critical font-medium' : 'text-muted-foreground'}`}>
                      {task.dueDate}{taskOverdue ? ' ⚠' : ''}
                    </td>
                    <td>
                      {subtaskCount > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-12 h-1.5 rounded-full bg-secondary/50 overflow-hidden">
                            <div className="h-full bg-status-ok rounded-full" style={{ width: `${(subtaskDone / subtaskCount) * 100}%` }} />
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground">{subtaskDone}/{subtaskCount}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Task Detail Panel */}
      <AnimatePresence>
        {openTask && (
          <TaskDetailPanel task={openTask} onClose={() => setSelectedTask(null)} onUpdate={updateTask} onDelete={deleteTask} />
        )}
      </AnimatePresence>

      {/* Add Task Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Task</DialogTitle>
            <DialogDescription>Create a task and assign it to a team member.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Type selector */}
            <div className="space-y-1.5">
              <label className={labelClass}>Type</label>
              <div className="flex gap-1.5 flex-wrap">
                {taskTypes.map(tt => {
                  const TIcon = typeIcons[tt.id];
                  return (
                    <button
                      key={tt.id}
                      onClick={() => setForm({ ...form, type: tt.id })}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${form.type === tt.id ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary/50 text-muted-foreground hover:text-foreground'}`}
                    >
                      <TIcon className="h-3.5 w-3.5" />
                      {tt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Title *</label>
              <input className={inputClass} placeholder="e.g. Calibrate CNC sensor" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>Description</label>
              <textarea className={`${inputClass} resize-none`} rows={2} placeholder="Details about the task..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelClass}>Assign To</label>
                <select className={inputClass} value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })}>
                  {owners.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Affected Process</label>
                <select className={inputClass} value={form.process} onChange={e => setForm({ ...form, process: e.target.value })}>
                  {processOptions.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelClass}>Priority</label>
                <select className={inputClass} value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as Priority })}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Due Date</label>
                <input className={inputClass} type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>Tags (comma-separated)</label>
              <input className={inputClass} placeholder="e.g. Maintenance, Quality" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
            </div>

            {/* Type-specific hints */}
            {form.type === '8d-report' && (
              <div className="flex items-start gap-2 text-xs bg-primary/5 border border-primary/20 rounded-[var(--radius)] px-3 py-2.5">
                <FileText className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-primary block mb-0.5">Guided 8D wizard will open after creation</span>
                  <span className="text-muted-foreground">All 8 disciplines pre-loaded. Walk through D1–D8 step-by-step with structured prompts, key questions, and example notes.</span>
                </div>
              </div>
            )}
            {form.type === '5s-audit' && (
              <div className="flex items-start gap-2 text-xs bg-status-ok/5 border border-status-ok/20 rounded-[var(--radius)] px-3 py-2.5">
                <ClipboardCheck className="h-3.5 w-3.5 text-status-ok flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-status-ok block mb-0.5">You'll be taken to the 5S Audits page</span>
                  <span className="text-muted-foreground">Score all 5 categories (1–5), add notes per category, and generate an audit report.</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <button onClick={() => setAddOpen(false)} className="px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            <button onClick={handleSubmit} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              {form.type === '8d-report' ? 'Create & open wizard' : form.type === '5s-audit' ? 'Create & open audit' : 'Create Task'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Guided 8D wizard — same component as the 8D Reports page */}
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
    </div>
  );
}
