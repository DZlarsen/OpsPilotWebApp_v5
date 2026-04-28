import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBusiness } from '@/contexts/BusinessContext';
import {
  ChevronRight,
  ChevronDown,
  Package,
  Plus,
  Search,
  Filter,
  X,
  Eye,
  FileText,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Box,
  Wrench,
  Tag,
  ExternalLink,
  History,
} from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

// --- Types ---

type BOMStatus = 'active' | 'npi' | 'eol' | 'prototype';
type NPIPhase = 'concept' | 'design' | 'prototype' | 'pilot' | 'production';

interface BOMItem {
  id: string;
  partNumber: string;
  name: string;
  description: string;
  revision: string;
  category: 'assembly' | 'sub-assembly' | 'component' | 'raw-material' | 'fastener' | 'consumable';
  status: BOMStatus;
  quantity: number;
  unit: string;
  supplier?: string;
  leadTimeDays?: number;
  cost?: number;
  process?: string;
  npiPhase?: NPIPhase;
  children: BOMItem[];
  changeHistory: { date: string; change: string; by: string }[];
}

// --- Mock Data ---
const bomData: BOMItem[] = [
  {
    id: 'asm-001',
    partNumber: 'ASM-1000',
    name: 'Precision Shaft Assembly',
    description: 'Complete shaft assembly with bearings and coupling for industrial motor application',
    revision: 'C',
    category: 'assembly',
    status: 'active',
    quantity: 1,
    unit: 'ea',
    process: 'Final Assembly',
    cost: 284.50,
    changeHistory: [
      { date: '2026-03-15', change: 'Updated bearing spec to SKF 6205-2RS', by: 'Mike Chen' },
      { date: '2026-01-20', change: 'Rev B → C: tighter shaft tolerance (±0.005mm)', by: 'Sarah Kim' },
    ],
    children: [
      {
        id: 'sub-001',
        partNumber: 'SUB-1001',
        name: 'Machined Shaft',
        description: 'CNC-turned precision shaft, 4140 steel, hardened to HRC 58-62',
        revision: 'B',
        category: 'sub-assembly',
        status: 'active',
        quantity: 1,
        unit: 'ea',
        process: 'CNC Machining',
        supplier: 'In-house',
        cost: 85.00,
        leadTimeDays: 3,
        changeHistory: [
          { date: '2026-02-10', change: 'Tightened OD tolerance to ±0.005mm', by: 'Mike Chen' },
        ],
        children: [
          { id: 'raw-001', partNumber: 'RAW-2001', name: '4140 Steel Bar Stock', description: '1.5" diameter, 12" length, pre-hardened', revision: 'A', category: 'raw-material', status: 'active', quantity: 1, unit: 'ea', supplier: 'MetalCo Supply', cost: 18.50, leadTimeDays: 5, changeHistory: [], children: [] },
          { id: 'con-001', partNumber: 'CON-3001', name: 'Cutting Fluid — Synthetic', description: 'Semi-synthetic metalworking coolant, 5-gal pail', revision: 'A', category: 'consumable', status: 'active', quantity: 0.02, unit: 'gal', supplier: 'CoolTech Inc', cost: 0.80, leadTimeDays: 2, changeHistory: [], children: [] },
        ],
      },
      {
        id: 'comp-001',
        partNumber: 'CMP-1002',
        name: 'Deep Groove Ball Bearing',
        description: 'SKF 6205-2RS sealed bearing, 25x52x15mm',
        revision: 'A',
        category: 'component',
        status: 'active',
        quantity: 2,
        unit: 'ea',
        supplier: 'SKF Authorized',
        cost: 12.40,
        leadTimeDays: 7,
        changeHistory: [
          { date: '2026-03-15', change: 'Changed from NSK to SKF per engineering review', by: 'Mike Chen' },
        ],
        children: [],
      },
      {
        id: 'comp-002',
        partNumber: 'CMP-1003',
        name: 'Shaft Coupling — Flexible',
        description: 'Lovejoy L-100 jaw coupling, 1" bore',
        revision: 'A',
        category: 'component',
        status: 'active',
        quantity: 1,
        unit: 'ea',
        supplier: 'Lovejoy / Timken',
        cost: 34.00,
        leadTimeDays: 10,
        changeHistory: [],
        children: [],
      },
      {
        id: 'fst-001',
        partNumber: 'FST-4001',
        name: 'Retaining Ring — External',
        description: 'Spiral retaining ring, 25mm shaft, stainless steel',
        revision: 'A',
        category: 'fastener',
        status: 'active',
        quantity: 2,
        unit: 'ea',
        supplier: 'Smalley Steel Ring',
        cost: 0.85,
        leadTimeDays: 3,
        changeHistory: [],
        children: [],
      },
      {
        id: 'fst-002',
        partNumber: 'FST-4002',
        name: 'Set Screw M6x10',
        description: 'Socket head set screw, alloy steel, black oxide',
        revision: 'A',
        category: 'fastener',
        status: 'active',
        quantity: 4,
        unit: 'ea',
        supplier: 'McMaster-Carr',
        cost: 0.15,
        leadTimeDays: 1,
        changeHistory: [],
        children: [],
      },
    ],
  },
  {
    id: 'asm-002',
    partNumber: 'ASM-2000',
    name: 'Injection Molded Housing',
    description: 'ABS plastic housing for electronic controller — new product introduction',
    revision: 'A',
    category: 'assembly',
    status: 'npi',
    quantity: 1,
    unit: 'ea',
    process: 'Injection Molding',
    cost: 42.00,
    npiPhase: 'pilot',
    changeHistory: [
      { date: '2026-04-01', change: 'Entered pilot phase — first article samples approved', by: 'Sarah Kim' },
      { date: '2026-03-01', change: 'Tool T1 cut complete, awaiting first shots', by: 'Sarah Kim' },
    ],
    children: [
      { id: 'raw-002', partNumber: 'RAW-2002', name: 'ABS Resin — Cycolac MG47', description: 'GE Cycolac MG47 natural, 25kg bags', revision: 'A', category: 'raw-material', status: 'active', quantity: 0.12, unit: 'kg', supplier: 'SABIC Polymers', cost: 3.60, leadTimeDays: 14, changeHistory: [], children: [] },
      { id: 'raw-003', partNumber: 'RAW-2003', name: 'Colorant Masterbatch — RAL 7016', description: 'Anthracite gray masterbatch, 2% letdown ratio', revision: 'A', category: 'raw-material', status: 'npi', quantity: 0.003, unit: 'kg', supplier: 'Clariant', cost: 0.45, leadTimeDays: 21, npiPhase: 'pilot', changeHistory: [], children: [] },
      { id: 'comp-003', partNumber: 'CMP-2001', name: 'Brass Threaded Insert M4', description: 'Heat-set insert, knurled, for plastic housings', revision: 'A', category: 'component', status: 'active', quantity: 6, unit: 'ea', supplier: 'Yardley Products', cost: 0.22, leadTimeDays: 5, changeHistory: [], children: [] },
    ],
  },
  {
    id: 'asm-003',
    partNumber: 'ASM-3000',
    name: 'Sensor Bracket Assembly',
    description: 'Mounting bracket for proximity sensor — being phased out',
    revision: 'D',
    category: 'assembly',
    status: 'eol',
    quantity: 1,
    unit: 'ea',
    process: 'Final Assembly',
    cost: 18.90,
    changeHistory: [
      { date: '2026-04-05', change: 'Marked EOL — replaced by ASM-3100 (integrated sensor mount)', by: 'James Rivera' },
    ],
    children: [
      { id: 'comp-004', partNumber: 'CMP-3001', name: 'Aluminum Bracket — Bent', description: '6061-T6 aluminum, formed bracket, anodized clear', revision: 'C', category: 'component', status: 'eol', quantity: 1, unit: 'ea', supplier: 'In-house', cost: 8.50, leadTimeDays: 2, process: 'CNC Machining', changeHistory: [], children: [] },
      { id: 'fst-003', partNumber: 'FST-4003', name: 'M5x16 Socket Cap Screw', description: 'A2-70 stainless steel', revision: 'A', category: 'fastener', status: 'active', quantity: 2, unit: 'ea', supplier: 'Fastenal', cost: 0.12, leadTimeDays: 1, changeHistory: [], children: [] },
    ],
  },
];

// --- Helpers ---
const statusConfig: Record<BOMStatus, { label: string; badge: 'ok' | 'warning' | 'critical' | 'info' }> = {
  active: { label: 'Active', badge: 'ok' },
  npi: { label: 'NPI', badge: 'warning' },
  eol: { label: 'EOL', badge: 'critical' },
  prototype: { label: 'Prototype', badge: 'info' },
};

const npiPhaseLabels: Record<NPIPhase, { label: string; step: number }> = {
  concept: { label: 'Concept', step: 1 },
  design: { label: 'Design', step: 2 },
  prototype: { label: 'Prototype', step: 3 },
  pilot: { label: 'Pilot', step: 4 },
  production: { label: 'Production', step: 5 },
};

const categoryIcons: Record<string, typeof Package> = {
  assembly: Layers,
  'sub-assembly': Box,
  component: Wrench,
  'raw-material': Package,
  fastener: Tag,
  consumable: Tag,
};

function flattenBOM(items: BOMItem[]): BOMItem[] {
  const result: BOMItem[] = [];
  const traverse = (list: BOMItem[]) => {
    for (const item of list) {
      result.push(item);
      if (item.children.length > 0) traverse(item.children);
    }
  };
  traverse(items);
  return result;
}

function calcTotalCost(item: BOMItem): number {
  const childCost = item.children.reduce((sum, c) => sum + calcTotalCost(c) * c.quantity, 0);
  return (item.cost || 0) + (item.children.length > 0 ? childCost - (item.cost || 0) : 0);
}

// --- Components ---
function BOMTreeRow({
  item,
  depth,
  expanded,
  onToggle,
  onSelect,
}: {
  item: BOMItem;
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (item: BOMItem) => void;
}) {
  const hasChildren = item.children.length > 0;
  const isExpanded = expanded.has(item.id);
  const Icon = categoryIcons[item.category] || Package;

  return (
    <>
      <tr
        className="hover:bg-secondary/30 cursor-pointer transition-colors group"
        onClick={() => onSelect(item)}
      >
        <td className="py-2">
          <div className="flex items-center gap-1" style={{ paddingLeft: `${depth * 20 + 4}px` }}>
            {hasChildren ? (
              <button
                onClick={(e) => { e.stopPropagation(); onToggle(item.id); }}
                className="h-5 w-5 flex items-center justify-center rounded hover:bg-secondary transition-colors"
              >
                {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </button>
            ) : (
              <span className="w-5" />
            )}
            <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="font-mono text-xs text-primary font-medium ml-1">{item.partNumber}</span>
          </div>
        </td>
        <td className="py-2">
          <p className="text-sm font-medium leading-tight">{item.name}</p>
          <p className="text-[10px] text-muted-foreground line-clamp-1">{item.description}</p>
        </td>
        <td className="py-2 text-center">
          <span className="text-xs font-mono">{item.revision}</span>
        </td>
        <td className="py-2 text-center">
          <span className="text-xs font-mono">{item.quantity} {item.unit}</span>
        </td>
        <td className="py-2">
          <StatusBadge status={statusConfig[item.status].badge} label={statusConfig[item.status].label} />
        </td>
        <td className="py-2 text-xs text-muted-foreground whitespace-nowrap">{item.supplier || '—'}</td>
        <td className="py-2 text-right">
          {item.cost != null ? (
            <span className="text-xs font-mono">${item.cost.toFixed(2)}</span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </td>
      </tr>
      {isExpanded && item.children.map(child => (
        <BOMTreeRow
          key={child.id}
          item={child}
          depth={depth + 1}
          expanded={expanded}
          onToggle={onToggle}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}

function NPITracker({ phase }: { phase: NPIPhase }) {
  const steps = ['concept', 'design', 'prototype', 'pilot', 'production'] as NPIPhase[];
  const currentIdx = steps.indexOf(phase);

  return (
    <div className="flex items-center gap-1">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-1">
          <div className={`flex items-center justify-center h-6 w-6 rounded-full text-[9px] font-bold transition-colors ${
            i < currentIdx ? 'bg-status-ok text-white' :
            i === currentIdx ? 'bg-primary text-primary-foreground ring-2 ring-primary/30' :
            'bg-secondary text-muted-foreground'
          }`}>
            {i < currentIdx ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 w-4 rounded ${i < currentIdx ? 'bg-status-ok' : 'bg-border'}`} />
          )}
        </div>
      ))}
      <span className="ml-2 text-[10px] font-medium text-muted-foreground capitalize">{phase}</span>
    </div>
  );
}

// --- Main Page ---
export default function BOM() {
  const { bomData: contextBomData, activeBusiness } = useBusiness();
  const baseBomData = contextBomData.length > 0 ? contextBomData : bomData;
  const [customItems, setCustomItems] = useState<BOMItem[]>([]);
  const activeBomData = [...baseBomData, ...customItems];

  const [expanded, setExpanded] = useState<Set<string>>(new Set(baseBomData.slice(0, 2).map(i => i.id)));
  const [selectedItem, setSelectedItem] = useState<BOMItem | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ partNumber: '', name: '', description: '', category: 'assembly' as BOMItem['category'], status: 'active' as BOMStatus, cost: '', supplier: '' });

  useEffect(() => {
    const data = contextBomData.length > 0 ? contextBomData : bomData;
    setExpanded(new Set(data.slice(0, 2).map(i => i.id)));
    setSelectedItem(null);
    setSearch('');
    setStatusFilter('');
    setCategoryFilter('');
    setCustomItems([]);
  }, [activeBusiness.id]);

  const handleCreateAssembly = () => {
    if (!createForm.name.trim() || !createForm.partNumber.trim()) { toast.error('Part number and name are required'); return; }
    const newItem: BOMItem = {
      id: `custom-${Date.now()}`,
      partNumber: createForm.partNumber,
      name: createForm.name,
      description: createForm.description || 'New assembly',
      revision: 'A',
      category: createForm.category,
      status: createForm.status,
      quantity: 1,
      unit: 'ea',
      supplier: createForm.supplier || undefined,
      cost: createForm.cost ? parseFloat(createForm.cost) : undefined,
      children: [],
      changeHistory: [{ date: new Date().toISOString().split('T')[0], change: 'Initial creation', by: activeBusiness.userName }],
    };
    setCustomItems(prev => [...prev, newItem]);
    setShowCreate(false);
    setCreateForm({ partNumber: '', name: '', description: '', category: 'assembly', status: 'active', cost: '', supplier: '' });
    toast.success(`${newItem.partNumber} added to BOM`);
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const expandAll = () => {
    const all = flattenBOM(activeBomData).filter(i => i.children.length > 0).map(i => i.id);
    setExpanded(new Set(all));
  };

  const collapseAll = () => setExpanded(new Set());

  // Filter top-level items (search applies to all descendants)
  const allFlat = flattenBOM(activeBomData);
  const matchesSearch = (item: BOMItem): boolean => {
    if (!search) return true;
    const q = search.toLowerCase();
    if (item.partNumber.toLowerCase().includes(q) || item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)) return true;
    return item.children.some(c => matchesSearch(c));
  };

  const filteredTop = activeBomData.filter(item => {
    if (!matchesSearch(item)) return false;
    if (statusFilter && item.status !== statusFilter) return false;
    if (categoryFilter && item.category !== categoryFilter) return false;
    return true;
  });

  // Summary stats
  const totalParts = allFlat.length;
  const npiCount = allFlat.filter(i => i.status === 'npi').length;
  const eolCount = allFlat.filter(i => i.status === 'eol').length;
  const totalAssemblies = activeBomData.length;

  const selectClass = 'bg-secondary/50 border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring';
  const inputClass = 'w-full rounded-md border border-border bg-secondary/30 px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="page-header flex items-center gap-3 mb-2">
            <span className="page-callout">10</span>
            <span className="page-eyebrow">Operations · BOM</span>
          </div>
          <h1 className="page-title">Bill of Materials</h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mt-2">Product genealogy, NPI tracking, and component management</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Assembly
        </button>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="kpi-card text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Assemblies</p>
          <p className="text-2xl font-mono font-bold">{totalAssemblies}</p>
        </div>
        <div className="kpi-card text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total Parts</p>
          <p className="text-2xl font-mono font-bold">{totalParts}</p>
        </div>
        <div className="kpi-card text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">NPI Items</p>
          <p className="text-2xl font-mono font-bold text-status-warning">{npiCount}</p>
        </div>
        <div className="kpi-card text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">End of Life</p>
          <p className="text-2xl font-mono font-bold text-status-critical">{eolCount}</p>
        </div>
      </div>

      {/* NPI Pipeline */}
      {activeBomData.filter(b => b.status === 'npi').length > 0 && (
        <div className="kpi-card">
          <h3 className="section-header">New Part Introduction Pipeline</h3>
          <div className="space-y-4">
            {activeBomData.filter(b => b.status === 'npi').map(item => (
              <div key={item.id} className="flex items-center gap-4 flex-wrap">
                <div className="min-w-[180px]">
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-[10px] font-mono text-muted-foreground">{item.partNumber}</p>
                </div>
                <NPITracker phase={item.npiPhase || 'concept'} />
                <button
                  onClick={() => setSelectedItem(item)}
                  className="ml-auto text-xs text-primary hover:underline flex items-center gap-1"
                >
                  Details <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            className="w-full rounded-md bg-secondary/50 border border-border pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Search parts, assemblies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        <select className={selectClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="npi">NPI</option>
          <option value="eol">EOL</option>
          <option value="prototype">Prototype</option>
        </select>
        <select className={selectClass} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          <option value="assembly">Assembly</option>
          <option value="sub-assembly">Sub-Assembly</option>
          <option value="component">Component</option>
          <option value="raw-material">Raw Material</option>
          <option value="fastener">Fastener</option>
          <option value="consumable">Consumable</option>
        </select>
        <div className="flex gap-1 ml-auto">
          <button onClick={expandAll} className="px-2.5 py-1.5 text-[10px] font-medium rounded-md bg-secondary/50 border border-border hover:bg-secondary transition-colors">Expand All</button>
          <button onClick={collapseAll} className="px-2.5 py-1.5 text-[10px] font-medium rounded-md bg-secondary/50 border border-border hover:bg-secondary transition-colors">Collapse All</button>
        </div>
        {(search || statusFilter || categoryFilter) && (
          <button
            onClick={() => { setSearch(''); setStatusFilter(''); setCategoryFilter(''); }}
            className="flex items-center gap-1 px-2 py-1.5 text-[10px] font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary/50 transition-colors"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>

      {/* BOM Tree Table */}
      <div className="kpi-card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-[220px]">Part Number</th>
              <th>Description</th>
              <th className="text-center w-[60px]">Rev</th>
              <th className="text-center w-[80px]">Qty</th>
              <th className="w-[80px]">Status</th>
              <th>Supplier</th>
              <th className="text-right w-[80px]">Unit Cost</th>
            </tr>
          </thead>
          <tbody>
            {filteredTop.map(item => (
              <BOMTreeRow
                key={item.id}
                item={item}
                depth={0}
                expanded={expanded}
                onToggle={toggleExpand}
                onSelect={setSelectedItem}
              />
            ))}
            {filteredTop.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-sm text-muted-foreground">No matching parts found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Side Panel */}
      <AnimatePresence>
        {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-end">
          <div className="fixed inset-0 bg-background/70 backdrop-blur-md" onClick={() => setSelectedItem(null)} />
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative w-full max-w-xl bg-card border-l border-border shadow-2xl flex flex-col h-full rounded-tl-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
              <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{selectedItem.partNumber}</span>
              <span className="text-xs bg-secondary/50 px-2 py-0.5 rounded font-mono">Rev {selectedItem.revision}</span>
              <StatusBadge status={statusConfig[selectedItem.status].badge} label={statusConfig[selectedItem.status].label} />
              <button onClick={() => setSelectedItem(null)} className="ml-auto h-8 w-8 flex items-center justify-center rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              <div>
                <h2 className="text-lg font-bold">{selectedItem.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">{selectedItem.description}</p>
              </div>

              {selectedItem.npiPhase && (
                <div className="space-y-2">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">NPI Phase</label>
                  <NPITracker phase={selectedItem.npiPhase} />
                </div>
              )}

              {/* Properties */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Category</label>
                  <p className="text-sm capitalize">{selectedItem.category.replace('-', ' ')}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Quantity</label>
                  <p className="text-sm font-mono">{selectedItem.quantity} {selectedItem.unit}</p>
                </div>
                {selectedItem.supplier && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Supplier</label>
                    <p className="text-sm">{selectedItem.supplier}</p>
                  </div>
                )}
                {selectedItem.leadTimeDays != null && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Lead Time</label>
                    <p className="text-sm font-mono">{selectedItem.leadTimeDays} days</p>
                  </div>
                )}
                {selectedItem.cost != null && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Unit Cost</label>
                    <p className="text-sm font-mono">${selectedItem.cost.toFixed(2)}</p>
                  </div>
                )}
                {selectedItem.process && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Process</label>
                    <p className="text-sm">{selectedItem.process}</p>
                  </div>
                )}
              </div>

              {/* Children (sub-components) */}
              {selectedItem.children.length > 0 && (
                <div className="space-y-2">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Layers className="h-3 w-3" /> Components ({selectedItem.children.length})
                  </label>
                  <div className="space-y-1">
                    {selectedItem.children.map(child => {
                      const ChildIcon = categoryIcons[child.category] || Package;
                      return (
                        <button
                          key={child.id}
                          onClick={() => setSelectedItem(child)}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary/50 transition-colors text-left"
                        >
                          <ChildIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{child.name}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{child.partNumber}</p>
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground">{child.quantity} {child.unit}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Change History */}
              <div className="space-y-2">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <History className="h-3 w-3" /> Change History ({selectedItem.changeHistory.length})
                </label>
                {selectedItem.changeHistory.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">No recorded changes</p>
                )}
                {selectedItem.changeHistory.map((ch, i) => (
                  <div key={i} className="flex gap-3 text-xs">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                      {i < selectedItem.changeHistory.length - 1 && <div className="flex-1 w-px bg-border mt-1" />}
                    </div>
                    <div className="pb-3">
                      <p className="text-foreground">{ch.change}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{ch.by} · {ch.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
        )}
      </AnimatePresence>

      {/* Create Assembly Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Assembly</DialogTitle>
            <DialogDescription>Create a new part or assembly in the Bill of Materials.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Part Number *</label>
                <input value={createForm.partNumber} onChange={e => setCreateForm(f => ({ ...f, partNumber: e.target.value }))} placeholder="e.g. ASM-4000" className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Category</label>
                <select value={createForm.category} onChange={e => setCreateForm(f => ({ ...f, category: e.target.value as BOMItem['category'] }))} className={inputClass}>
                  <option value="assembly">Assembly</option>
                  <option value="sub-assembly">Sub-Assembly</option>
                  <option value="component">Component</option>
                  <option value="raw-material">Raw Material</option>
                  <option value="fastener">Fastener</option>
                  <option value="consumable">Consumable</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Name *</label>
              <input value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Motor Mount Assembly" className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <textarea value={createForm.description} onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description..." rows={2} className={inputClass} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <select value={createForm.status} onChange={e => setCreateForm(f => ({ ...f, status: e.target.value as BOMStatus }))} className={inputClass}>
                  <option value="active">Active</option>
                  <option value="npi">NPI</option>
                  <option value="prototype">Prototype</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Unit Cost ($)</label>
                <input type="number" value={createForm.cost} onChange={e => setCreateForm(f => ({ ...f, cost: e.target.value }))} placeholder="0.00" className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Supplier</label>
                <input value={createForm.supplier} onChange={e => setCreateForm(f => ({ ...f, supplier: e.target.value }))} placeholder="Optional" className={inputClass} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-secondary transition-colors">Cancel</button>
            <button onClick={handleCreateAssembly} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">Add to BOM</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
