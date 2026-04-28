import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '@/contexts/BusinessContext';
import { Wrench, Plus, Clock, CheckCircle, AlertTriangle, User, Calendar, ArrowRight, Filter, MessageSquare, X } from 'lucide-react';
import { format, subDays } from 'date-fns';
import StatusBadge from '@/components/shared/StatusBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

type WOStatus = 'open' | 'in-progress' | 'completed' | 'cancelled';
type WOPriority = 'low' | 'medium' | 'high' | 'critical';
type WOType = 'corrective' | 'preventive' | 'inspection' | 'emergency';

interface WorkOrder {
  id: string;
  title: string;
  description: string;
  type: WOType;
  status: WOStatus;
  priority: WOPriority;
  processId: string;
  processName: string;
  equipment: string;
  requestedBy: string;
  assignedTo: string;
  createdAt: string;
  dueDate: string;
  completedAt?: string;
  estimatedHours: number;
  notes: string[];
}

function generateWorkOrders(processes: { id: string; name: string; owner: string }[]): WorkOrder[] {
  const statuses: WOStatus[] = ['open', 'in-progress', 'completed', 'completed', 'open', 'in-progress'];
  const priorities: WOPriority[] = ['low', 'medium', 'medium', 'high', 'high', 'critical'];
  const technicians = ['Alex Thompson', 'Maria Santos', 'Kevin Park', 'Rachel Kim', 'Tom Wilson'];

  const templates = [
    { title: 'Replace worn drive belt', desc: 'Belt showing signs of cracking and stretching. Replace before failure.', type: 'preventive' as WOType, equip: 'Drive Assembly' },
    { title: 'Calibrate temperature sensor', desc: 'Sensor readings drifting ±2°C from reference. Needs recalibration.', type: 'corrective' as WOType, equip: 'Temperature Controller' },
    { title: 'Inspect hydraulic lines', desc: 'Monthly inspection of hydraulic lines for leaks and wear.', type: 'inspection' as WOType, equip: 'Hydraulic System' },
    { title: 'Emergency bearing replacement', desc: 'Bearing seized on main spindle. Immediate replacement needed.', type: 'emergency' as WOType, equip: 'Main Spindle' },
    { title: 'Lubricate linear guides', desc: 'Scheduled lubrication per maintenance plan.', type: 'preventive' as WOType, equip: 'Linear Guide System' },
    { title: 'Fix intermittent E-stop', desc: 'E-stop triggering randomly. Possible wiring issue.', type: 'corrective' as WOType, equip: 'Safety System' },
    { title: 'Quarterly motor inspection', desc: 'Check motor windings, bearings, and connections.', type: 'inspection' as WOType, equip: 'Drive Motor' },
    { title: 'Replace coolant filter', desc: 'Coolant filter past service life. Flow rate dropping.', type: 'preventive' as WOType, equip: 'Coolant System' },
    { title: 'Repair pneumatic valve', desc: 'Valve sticking intermittently causing cycle delays.', type: 'corrective' as WOType, equip: 'Pneumatic System' },
    { title: 'Sensor alignment check', desc: 'Part detection sensor misaligned after tool change.', type: 'corrective' as WOType, equip: 'Detection Sensor' },
  ];

  return templates.map((tmpl, i) => {
    const proc = processes[i % processes.length];
    const status = statuses[i % statuses.length];
    const created = subDays(new Date(), Math.floor(Math.random() * 14));
    const due = subDays(new Date(), Math.floor(Math.random() * 7) - 5);

    return {
      id: `wo-${String(i + 1).padStart(4, '0')}`,
      title: tmpl.title,
      description: tmpl.desc,
      type: tmpl.type,
      status,
      priority: priorities[i % priorities.length],
      processId: proc.id,
      processName: proc.name.split('—')[0].trim(),
      equipment: tmpl.equip,
      requestedBy: proc.owner,
      assignedTo: technicians[i % technicians.length],
      createdAt: created.toISOString(),
      dueDate: due.toISOString(),
      completedAt: status === 'completed' ? subDays(new Date(), Math.floor(Math.random() * 3)).toISOString() : undefined,
      estimatedHours: 1 + Math.floor(Math.random() * 8),
      notes: status !== 'open' ? ['Parts ordered', 'Scheduled for next shift'] : [],
    };
  });
}

const typeColors: Record<WOType, string> = {
  corrective: 'bg-status-warning/15 text-status-warning',
  preventive: 'bg-chart-blue/15 text-chart-blue',
  inspection: 'bg-chart-purple/15 text-chart-purple',
  emergency: 'bg-status-critical/15 text-status-critical',
};

const statusConfig: Record<WOStatus, { color: string; icon: typeof Clock }> = {
  open: { color: 'bg-muted text-muted-foreground', icon: Clock },
  'in-progress': { color: 'bg-chart-blue/15 text-chart-blue', icon: Wrench },
  completed: { color: 'bg-status-ok/15 text-status-ok', icon: CheckCircle },
  cancelled: { color: 'bg-muted text-muted-foreground', icon: AlertTriangle },
};

const inputClass = 'w-full rounded-md border border-border bg-secondary/30 px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary';
const selectClass = 'w-full rounded-md border border-border bg-secondary/30 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary';

export default function WorkOrders() {
  const navigate = useNavigate();
  const { processes, activeBusiness } = useBusiness();
  const [orders, setOrders] = useState(() => generateWorkOrders(processes));
  const [statusFilter, setStatusFilter] = useState<WOStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<WOType | 'all'>('all');
  const [selected, setSelected] = useState<WorkOrder | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newNote, setNewNote] = useState('');

  // Create form state
  const [createForm, setCreateForm] = useState({
    title: '', description: '', type: 'corrective' as WOType, priority: 'medium' as WOPriority,
    equipment: '', assignedTo: '', estimatedHours: '2', processIdx: 0,
  });

  const filtered = orders.filter(o => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (typeFilter !== 'all' && o.type !== typeFilter) return false;
    return true;
  });

  const openCount = orders.filter(o => o.status === 'open').length;
  const inProgressCount = orders.filter(o => o.status === 'in-progress').length;
  const completedCount = orders.filter(o => o.status === 'completed').length;
  const criticalCount = orders.filter(o => o.priority === 'critical' && o.status !== 'completed').length;

  const handleCreate = () => {
    if (!createForm.title.trim()) { toast.error('Title is required'); return; }
    const proc = processes[createForm.processIdx] || processes[0];
    const newWO: WorkOrder = {
      id: `wo-${String(orders.length + 1).padStart(4, '0')}`,
      title: createForm.title,
      description: createForm.description || 'No description provided.',
      type: createForm.type,
      status: 'open',
      priority: createForm.priority,
      processId: proc.id,
      processName: proc.name.split('—')[0].trim(),
      equipment: createForm.equipment || 'General',
      requestedBy: activeBusiness.userName,
      assignedTo: createForm.assignedTo || 'Unassigned',
      createdAt: new Date().toISOString(),
      dueDate: subDays(new Date(), -7).toISOString(),
      estimatedHours: parseInt(createForm.estimatedHours) || 2,
      notes: [],
    };
    setOrders(prev => [newWO, ...prev]);
    setShowCreate(false);
    setCreateForm({ title: '', description: '', type: 'corrective', priority: 'medium', equipment: '', assignedTo: '', estimatedHours: '2', processIdx: 0 });
    toast.success(`Work order ${newWO.id.toUpperCase()} created`);
  };

  const updateStatus = (id: string, newStatus: WOStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? {
      ...o, status: newStatus,
      completedAt: newStatus === 'completed' ? new Date().toISOString() : o.completedAt,
    } : o));
    if (selected?.id === id) {
      setSelected(prev => prev ? { ...prev, status: newStatus, completedAt: newStatus === 'completed' ? new Date().toISOString() : prev.completedAt } : null);
    }
    toast.success(`Status updated to ${newStatus}`);
  };

  const addNote = (id: string) => {
    if (!newNote.trim()) return;
    setOrders(prev => prev.map(o => o.id === id ? { ...o, notes: [...o.notes, newNote.trim()] } : o));
    if (selected?.id === id) {
      setSelected(prev => prev ? { ...prev, notes: [...prev.notes, newNote.trim()] } : null);
    }
    setNewNote('');
    toast.success('Note added');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="page-header flex items-center gap-3 mb-2">
            <span className="page-callout">12</span>
            <span className="page-eyebrow">Operations · Work Orders</span>
          </div>
          <h1 className="page-title">Work Orders</h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mt-2">{activeBusiness.name} — Maintenance requests & equipment tickets</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Work Order
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="kpi-card text-center py-5 cursor-pointer hover:border-primary/40 transition-all" onClick={() => setStatusFilter('open')}>
          <Clock className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
          <p className="text-2xl font-bold font-mono">{openCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Open</p>
        </div>
        <div className="kpi-card text-center py-5 cursor-pointer hover:border-primary/40 transition-all" onClick={() => setStatusFilter('in-progress')}>
          <Wrench className="h-5 w-5 mx-auto text-chart-blue mb-2" />
          <p className="text-2xl font-bold font-mono">{inProgressCount}</p>
          <p className="text-xs text-muted-foreground mt-1">In Progress</p>
        </div>
        <div className="kpi-card text-center py-5 cursor-pointer hover:border-primary/40 transition-all" onClick={() => setStatusFilter('completed')}>
          <CheckCircle className="h-5 w-5 mx-auto text-status-ok mb-2" />
          <p className="text-2xl font-bold font-mono">{completedCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Completed</p>
        </div>
        <div className="kpi-card text-center py-5">
          <AlertTriangle className="h-5 w-5 mx-auto text-status-critical mb-2" />
          <p className="text-2xl font-bold font-mono">{criticalCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Critical Priority</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <div className="flex gap-1">
          {(['all', 'open', 'in-progress', 'completed'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'}`}
            >
              {s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="w-px h-5 bg-border mx-1" />
        <div className="flex gap-1">
          {(['all', 'corrective', 'preventive', 'inspection', 'emergency'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${typeFilter === t ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'}`}
            >
              {t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Work order list */}
      <div className="grid gap-3">
        {filtered.map(wo => {
          const StatusIcon = statusConfig[wo.status].icon;
          return (
            <div
              key={wo.id}
              onClick={() => setSelected(wo)}
              className="kpi-card cursor-pointer hover:border-primary/40 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0 ${statusConfig[wo.status].color}`}>
                  <StatusIcon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-muted-foreground">{wo.id.toUpperCase()}</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${typeColors[wo.type]}`}>{wo.type}</span>
                    <StatusBadge status={wo.priority === 'critical' ? 'critical' : wo.priority === 'high' ? 'warning' : 'ok'} label={wo.priority} />
                  </div>
                  <h4 className="text-sm font-semibold mt-1">{wo.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{wo.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Wrench className="h-3 w-3" />{wo.equipment}</span>
                    <span className="flex items-center gap-1"><User className="h-3 w-3" />{wo.assignedTo}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Due {format(new Date(wo.dueDate), 'MMM d')}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{wo.estimatedHours}h est.</span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/50 flex-shrink-0 mt-3" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {selected && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-end">
          <div className="fixed inset-0 bg-background/70 backdrop-blur-md" onClick={() => setSelected(null)} />
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative z-10 w-full max-w-md bg-card border-l border-border shadow-2xl overflow-hidden flex flex-col rounded-tl-2xl"
          >
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs text-muted-foreground">{selected.id.toUpperCase()}</span>
                  <h2 className="text-lg font-bold mt-1">{selected.title}</h2>
                </div>
                <button onClick={() => setSelected(null)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-secondary/80 transition-colors text-muted-foreground hover:text-foreground"><span className="text-lg">✕</span></button>
              </div>

              <p className="text-sm text-muted-foreground">{selected.description}</p>

              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-[10px] uppercase text-muted-foreground font-semibold">Type</p><span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${typeColors[selected.type]}`}>{selected.type}</span></div>
                <div><p className="text-[10px] uppercase text-muted-foreground font-semibold">Priority</p><div className="mt-1"><StatusBadge status={selected.priority === 'critical' ? 'critical' : selected.priority === 'high' ? 'warning' : 'ok'} label={selected.priority} /></div></div>
                <div><p className="text-[10px] uppercase text-muted-foreground font-semibold">Status</p><span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${statusConfig[selected.status].color}`}>{selected.status}</span></div>
                <div><p className="text-[10px] uppercase text-muted-foreground font-semibold">Est. Hours</p><p className="text-sm font-mono mt-1">{selected.estimatedHours}h</p></div>
              </div>

              {/* Status actions */}
              <div className="border-t border-border pt-4">
                <p className="text-[10px] uppercase text-muted-foreground font-semibold mb-2">Update Status</p>
                <div className="flex gap-1.5 flex-wrap">
                  {(['open', 'in-progress', 'completed', 'cancelled'] as WOStatus[]).map(s => (
                    <button
                      key={s}
                      onClick={() => updateStatus(selected.id, s)}
                      disabled={selected.status === s}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        selected.status === s
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                      }`}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                  <div><p className="text-[10px] uppercase text-muted-foreground font-semibold">Equipment</p><p className="text-sm">{selected.equipment}</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div><p className="text-[10px] uppercase text-muted-foreground font-semibold">Assigned To</p><p className="text-sm">{selected.assignedTo}</p></div>
                </div>
                <div className="flex items-center gap-3 cursor-pointer hover:text-primary transition-colors" onClick={() => { setSelected(null); navigate('/processes'); }}>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <div><p className="text-[10px] uppercase text-muted-foreground font-semibold">Process</p><p className="text-sm">{selected.processName}</p></div>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-[10px] uppercase text-muted-foreground font-semibold mb-2">Timeline</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs"><Calendar className="h-3 w-3 text-muted-foreground" /><span>Created {format(new Date(selected.createdAt), 'MMM d, yyyy')}</span></div>
                  <div className="flex items-center gap-2 text-xs"><Clock className="h-3 w-3 text-muted-foreground" /><span>Due {format(new Date(selected.dueDate), 'MMM d, yyyy')}</span></div>
                  {selected.completedAt && (
                    <div className="flex items-center gap-2 text-xs text-status-ok"><CheckCircle className="h-3 w-3" /><span>Completed {format(new Date(selected.completedAt), 'MMM d, yyyy')}</span></div>
                  )}
                </div>
              </div>

              {/* Notes with add capability */}
              <div className="border-t border-border pt-4">
                <p className="text-[10px] uppercase text-muted-foreground font-semibold mb-2">Notes</p>
                {selected.notes.map((n, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs mb-1.5">
                    <MessageSquare className="h-3 w-3 text-muted-foreground mt-0.5" />
                    <span>{n}</span>
                  </div>
                ))}
                <div className="flex gap-2 mt-3">
                  <input
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addNote(selected.id)}
                    placeholder="Add a note..."
                    className="flex-1 rounded-md border border-border bg-secondary/30 px-3 py-1.5 text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    onClick={() => addNote(selected.id)}
                    className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        )}
      </AnimatePresence>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Work Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Title *</label>
              <input value={createForm.title} onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Replace worn drive belt" className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <textarea value={createForm.description} onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the issue or task..." rows={3} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Type</label>
                <select value={createForm.type} onChange={e => setCreateForm(f => ({ ...f, type: e.target.value as WOType }))} className={selectClass}>
                  <option value="corrective">Corrective</option>
                  <option value="preventive">Preventive</option>
                  <option value="inspection">Inspection</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Priority</label>
                <select value={createForm.priority} onChange={e => setCreateForm(f => ({ ...f, priority: e.target.value as WOPriority }))} className={selectClass}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Process</label>
                <select value={createForm.processIdx} onChange={e => setCreateForm(f => ({ ...f, processIdx: parseInt(e.target.value) }))} className={selectClass}>
                  {processes.map((p, i) => (
                    <option key={p.id} value={i}>{p.name.split('—')[0].trim()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Equipment</label>
                <input value={createForm.equipment} onChange={e => setCreateForm(f => ({ ...f, equipment: e.target.value }))} placeholder="e.g. Drive Motor" className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Assign To</label>
                <input value={createForm.assignedTo} onChange={e => setCreateForm(f => ({ ...f, assignedTo: e.target.value }))} placeholder="Technician name" className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Estimated Hours</label>
                <input type="number" value={createForm.estimatedHours} onChange={e => setCreateForm(f => ({ ...f, estimatedHours: e.target.value }))} min="1" max="100" className={inputClass} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-secondary transition-colors">Cancel</button>
            <button onClick={handleCreate} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">Create Work Order</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
