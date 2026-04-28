import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '@/contexts/BusinessContext';
import { FileText, Search, Upload, Download, Eye, Clock, CheckCircle, Tag, User, ChevronRight, Folder, File, BookOpen, ClipboardList, Shield } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

type DocType = 'sop' | 'work-instruction' | 'spec-sheet' | 'checklist' | 'safety' | 'training';
type DocStatus = 'current' | 'draft' | 'under-review' | 'archived';

interface Document {
  id: string;
  title: string;
  type: DocType;
  docNumber: string;
  revision: string;
  status: DocStatus;
  processId: string;
  processName: string;
  owner: string;
  lastUpdated: string;
  approvedBy?: string;
  description: string;
  fileSize: string;
  tags: string[];
}

const docTypeConfig: Record<DocType, { label: string; icon: typeof FileText; color: string }> = {
  'sop': { label: 'SOP', icon: BookOpen, color: 'bg-chart-blue/15 text-chart-blue' },
  'work-instruction': { label: 'Work Instruction', icon: ClipboardList, color: 'bg-chart-purple/15 text-chart-purple' },
  'spec-sheet': { label: 'Spec Sheet', icon: FileText, color: 'bg-status-warning/15 text-status-warning' },
  'checklist': { label: 'Checklist', icon: CheckCircle, color: 'bg-status-ok/15 text-status-ok' },
  'safety': { label: 'Safety', icon: Shield, color: 'bg-status-critical/15 text-status-critical' },
  'training': { label: 'Training', icon: User, color: 'bg-chart-cyan/15 text-chart-cyan' },
};

const statusColors: Record<DocStatus, string> = {
  current: 'bg-status-ok/15 text-status-ok',
  draft: 'bg-muted text-muted-foreground',
  'under-review': 'bg-status-warning/15 text-status-warning',
  archived: 'bg-muted text-muted-foreground',
};

function generateDocuments(processes: { id: string; name: string; owner: string }[]): Document[] {
  const templates: Omit<Document, 'id' | 'processId' | 'processName'>[] = [
    { title: 'Standard Operating Procedure', type: 'sop', docNumber: 'SOP-001', revision: 'Rev C', status: 'current', owner: '', lastUpdated: '', approvedBy: 'Quality Manager', description: 'Complete SOP covering machine setup, operation, inspection points, and shutdown procedures.', fileSize: '2.4 MB', tags: ['setup', 'operation', 'quality'] },
    { title: 'Operator Work Instruction', type: 'work-instruction', docNumber: 'WI-001', revision: 'Rev B', status: 'current', owner: '', lastUpdated: '', approvedBy: 'Ops Manager', description: 'Step-by-step work instructions for operators including visual aids and decision trees.', fileSize: '1.8 MB', tags: ['operator', 'visual-aid'] },
    { title: 'Material Specification Sheet', type: 'spec-sheet', docNumber: 'SPEC-001', revision: 'Rev A', status: 'current', owner: '', lastUpdated: '', description: 'Material specifications, tolerances, and acceptance criteria for incoming materials.', fileSize: '890 KB', tags: ['material', 'tolerance'] },
    { title: 'Pre-Shift Checklist', type: 'checklist', docNumber: 'CL-001', revision: 'Rev D', status: 'current', owner: '', lastUpdated: '', description: 'Checklist for operators to complete before starting each shift.', fileSize: '420 KB', tags: ['shift', 'daily'] },
    { title: 'Safety Data Sheet', type: 'safety', docNumber: 'SDS-001', revision: 'Rev B', status: 'current', owner: '', lastUpdated: '', description: 'Safety data and handling procedures for chemicals and hazardous materials used in this process.', fileSize: '1.2 MB', tags: ['safety', 'hazmat'] },
    { title: 'Operator Training Manual', type: 'training', docNumber: 'TM-001', revision: 'Rev A', status: 'draft', owner: '', lastUpdated: '', description: 'Training manual for new operators covering all aspects of the process line.', fileSize: '5.1 MB', tags: ['training', 'onboarding'] },
    { title: 'Quality Inspection Procedure', type: 'sop', docNumber: 'SOP-002', revision: 'Rev E', status: 'current', owner: '', lastUpdated: '', approvedBy: 'Quality Manager', description: 'Inspection procedures including sampling plan, measurement methods, and reject criteria.', fileSize: '1.6 MB', tags: ['inspection', 'quality'] },
    { title: 'Tool Change Procedure', type: 'work-instruction', docNumber: 'WI-002', revision: 'Rev C', status: 'under-review', owner: '', lastUpdated: '', description: 'Procedure for changing tooling including safety lockout, alignment, and verification steps.', fileSize: '980 KB', tags: ['tooling', 'changeover'] },
    { title: 'Finished Product Spec', type: 'spec-sheet', docNumber: 'SPEC-002', revision: 'Rev B', status: 'current', owner: '', lastUpdated: '', description: 'Final product specifications, dimensional tolerances, and cosmetic acceptance criteria.', fileSize: '1.1 MB', tags: ['product', 'final-inspection'] },
    { title: 'Equipment Maintenance Checklist', type: 'checklist', docNumber: 'CL-002', revision: 'Rev A', status: 'current', owner: '', lastUpdated: '', description: 'Weekly and monthly maintenance checklist for process equipment.', fileSize: '340 KB', tags: ['maintenance', 'preventive'] },
    { title: 'Emergency Response Plan', type: 'safety', docNumber: 'SDS-002', revision: 'Rev C', status: 'current', owner: '', lastUpdated: '', description: 'Emergency procedures for equipment malfunction, chemical spill, and personnel injury.', fileSize: '2.8 MB', tags: ['emergency', 'safety'] },
    { title: 'Calibration Procedure', type: 'sop', docNumber: 'SOP-003', revision: 'Rev B', status: 'draft', owner: '', lastUpdated: '', description: 'Calibration procedures for measurement equipment used in quality inspection.', fileSize: '750 KB', tags: ['calibration', 'metrology'] },
  ];

  return templates.map((tmpl, i) => {
    const proc = processes[i % processes.length];
    return {
      ...tmpl,
      id: `doc-${String(i + 1).padStart(3, '0')}`,
      processId: proc.id,
      processName: proc.name.split('—')[0].trim(),
      owner: proc.owner,
      lastUpdated: subDays(new Date(), Math.floor(Math.random() * 90)).toISOString(),
    };
  });
}

// Mock document content for viewer
const mockDocContent: Record<DocType, string[]> = {
  sop: [
    '1. PURPOSE\nThis Standard Operating Procedure establishes the required steps for safe and consistent operation of the process equipment.',
    '2. SCOPE\nApplies to all operators, technicians, and supervisors working on this process line.',
    '3. SAFETY REQUIREMENTS\n• Wear required PPE (safety glasses, steel-toe boots, hearing protection)\n• Verify E-stop functionality before starting\n• Complete LOTO procedure for any maintenance',
    '4. PROCEDURE\n4.1 Pre-Start Checks\n  a) Verify raw materials are staged and within specification\n  b) Check coolant level and concentration\n  c) Inspect tooling for wear or damage\n  d) Power on machine and verify home position',
    '4.2 Production Run\n  a) Load program from approved library\n  b) Run first article and verify dimensions\n  c) Record measurements on inspection sheet\n  d) Begin production after QA approval',
    '5. QUALITY CHECKS\n• First article inspection: 100% dimensional check\n• In-process: every 25th part\n• End of run: final 3 parts verified',
  ],
  'work-instruction': [
    'STEP 1: Machine Setup\nPower on the controller and wait for initialization (approx. 45 seconds). Select the correct program from the dropdown menu.',
    'STEP 2: Material Loading\nPlace the workpiece in the fixture with the datum face against the stop. Tighten clamps to 15 Nm torque.',
    'STEP 3: Cycle Start\nClose the safety guard. Press and hold the green START button for 2 seconds. Monitor the first 30 seconds of the cycle for any unusual noise or vibration.',
    'STEP 4: Part Removal\nWait for the cycle complete indicator. Open the guard. Use compressed air to clear chips before removing the part.',
    'STEP 5: Inspection\nMeasure critical dimensions per inspection plan. Record values in the logbook. Flag any out-of-tolerance readings immediately.',
  ],
  'spec-sheet': [
    'MATERIAL SPECIFICATION\n\nMaterial: 4140 Alloy Steel\nCondition: Pre-hardened, HRC 28-32\nForm: Round bar, cold-finished',
    'DIMENSIONAL REQUIREMENTS\n\nOuter Diameter: 25.000 ± 0.005 mm\nLength: 150.00 ± 0.10 mm\nSurface Finish: Ra 0.8 μm max',
    'ACCEPTANCE CRITERIA\n\n• Certificate of Material required with each lot\n• Hardness test: 3 readings per bar, average within spec\n• Visual: No cracks, pits, or surface defects',
  ],
  checklist: [
    '☐ Safety guard interlock tested — functioning\n☐ E-stop tested — functioning\n☐ Coolant level checked — above minimum\n☐ Air pressure verified — 6.0 ± 0.2 bar',
    '☐ Tooling inspected — no visible wear or damage\n☐ Work area clean and organized\n☐ PPE in good condition and worn correctly\n☐ First article inspection completed and approved',
    '☐ Logbook entries up to date\n☐ Scrap bin emptied\n☐ Communication with previous shift operator completed',
  ],
  safety: [
    'HAZARD IDENTIFICATION\n\n⚠️ Rotating machinery — entanglement hazard\n⚠️ Hot surfaces — burn hazard (up to 200°C)\n⚠️ Cutting fluids — skin irritation on prolonged contact\n⚠️ Noise levels > 85 dB — hearing protection required',
    'EMERGENCY PROCEDURES\n\n1. Equipment Malfunction: Press E-stop immediately. Do not attempt to clear jams while machine is powered.\n2. Chemical Spill: Contain with absorbent pads. Ventilate area. Report to EHS.\n3. Injury: Administer first aid. Call 911 if serious. Complete incident report.',
    'PPE REQUIREMENTS\n\n• Safety glasses with side shields (ANSI Z87.1)\n• Steel-toe boots (ASTM F2413)\n• Hearing protection when in production area\n• Nitrile gloves when handling cutting fluids',
  ],
  training: [
    'MODULE 1: Introduction to Process\n\nThis training covers the fundamentals of operating the process line, including safety protocols, machine operation, quality requirements, and troubleshooting.',
    'MODULE 2: Machine Controls\n\nLearn the control panel layout, program selection, parameter adjustment, and alarm handling. Hands-on practice with simulator before live operation.',
    'MODULE 3: Quality Standards\n\nUnderstand dimensional tolerances, surface finish requirements, SPC basics, and how to use measurement instruments (calipers, micrometers, CMM).',
    'MODULE 4: Troubleshooting\n\nCommon issues and resolution steps:\n• Tool breakage → Stop cycle, inspect workpiece, replace tool, re-qualify\n• Dimension drift → Check tool wear, verify fixture, adjust offset\n• Surface finish issues → Check feed/speed, coolant flow, tool condition',
  ],
};

const inputClass = 'w-full rounded-md border border-border bg-secondary/30 px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary';
const selectInputClass = 'w-full rounded-md border border-border bg-secondary/30 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary';

export default function Documents() {
  const navigate = useNavigate();
  const { processes, activeBusiness } = useBusiness();
  const [docs, setDocs] = useState(() => generateDocuments(processes));
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<DocType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<DocStatus | 'all'>('all');
  const [selected, setSelected] = useState<Document | null>(null);
  const [viewing, setViewing] = useState<Document | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: '', type: 'sop' as DocType, description: '', tags: '' });
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const filtered = docs.filter(d => {
    if (typeFilter !== 'all' && d.type !== typeFilter) return false;
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (search && !d.title.toLowerCase().includes(search.toLowerCase()) && !d.docNumber.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const currentCount = docs.filter(d => d.status === 'current').length;
  const draftCount = docs.filter(d => d.status === 'draft').length;
  const reviewCount = docs.filter(d => d.status === 'under-review').length;

  const handleUpload = () => {
    if (!uploadForm.title.trim()) { toast.error('Title is required'); return; }
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev === null || prev >= 100) {
          clearInterval(interval);
          const proc = processes[0];
          const newDoc: Document = {
            id: `doc-${String(docs.length + 1).padStart(3, '0')}`,
            title: uploadForm.title,
            type: uploadForm.type,
            docNumber: `${uploadForm.type.toUpperCase().replace('-', '')}-${String(docs.length + 1).padStart(3, '0')}`,
            revision: 'Rev A',
            status: 'draft',
            processId: proc.id,
            processName: proc.name.split('—')[0].trim(),
            owner: activeBusiness.userName,
            lastUpdated: new Date().toISOString(),
            description: uploadForm.description || 'Newly uploaded document.',
            fileSize: '1.2 MB',
            tags: uploadForm.tags ? uploadForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          };
          setDocs(prev => [newDoc, ...prev]);
          setShowUpload(false);
          setUploadProgress(null);
          setUploadForm({ title: '', type: 'sop', description: '', tags: '' });
          toast.success(`${newDoc.docNumber} uploaded successfully`);
          return null;
        }
        return (prev ?? 0) + 20;
      });
    }, 300);
  };

  const handleDownload = (doc: Document, e?: React.MouseEvent) => {
    e?.stopPropagation();
    toast.success(`Downloading ${doc.docNumber} (${doc.fileSize})...`, { duration: 2000 });
  };

  const handleApprove = (doc: Document) => {
    setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, status: 'current' as DocStatus, approvedBy: activeBusiness.userName, lastUpdated: new Date().toISOString() } : d));
    if (selected?.id === doc.id) {
      setSelected(prev => prev ? { ...prev, status: 'current', approvedBy: activeBusiness.userName } : null);
    }
    toast.success(`${doc.docNumber} approved and marked as current`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="page-header flex items-center gap-3 mb-2">
            <span className="page-callout">13</span>
            <span className="page-eyebrow">Operations · Documents</span>
          </div>
          <h1 className="page-title">Document Management</h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mt-2">{activeBusiness.name} — SOPs, work instructions, and specifications</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Upload className="h-4 w-4" />
          Upload Document
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="kpi-card text-center py-5">
          <Folder className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
          <p className="text-2xl font-bold font-mono">{docs.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Documents</p>
        </div>
        <div className="kpi-card text-center py-5 cursor-pointer hover:border-primary/40 transition-all" onClick={() => setStatusFilter('current')}>
          <CheckCircle className="h-5 w-5 mx-auto text-status-ok mb-2" />
          <p className="text-2xl font-bold font-mono">{currentCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Current</p>
        </div>
        <div className="kpi-card text-center py-5 cursor-pointer hover:border-primary/40 transition-all" onClick={() => setStatusFilter('draft')}>
          <File className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
          <p className="text-2xl font-bold font-mono">{draftCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Drafts</p>
        </div>
        <div className="kpi-card text-center py-5 cursor-pointer hover:border-primary/40 transition-all" onClick={() => setStatusFilter('under-review')}>
          <Clock className="h-5 w-5 mx-auto text-status-warning mb-2" />
          <p className="text-2xl font-bold font-mono">{reviewCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Under Review</p>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents..." className="w-full pl-9 pr-3 py-2 rounded-md border border-border bg-secondary/30 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div className="flex gap-1">
          {(['all', 'sop', 'work-instruction', 'spec-sheet', 'checklist', 'safety'] as const).map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${typeFilter === t ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'}`}>
              {t === 'all' ? 'All' : docTypeConfig[t]?.label || t}
            </button>
          ))}
        </div>
      </div>

      {/* Document list */}
      <div className="grid gap-3">
        {filtered.map(doc => {
          const config = docTypeConfig[doc.type];
          const Icon = config.icon;
          return (
            <div key={doc.id} onClick={() => setSelected(doc)} className="kpi-card cursor-pointer hover:border-primary/40 hover:shadow-md transition-all">
              <div className="flex items-start gap-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0 ${config.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-muted-foreground">{doc.docNumber}</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${config.color}`}>{config.label}</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[doc.status]}`}>{doc.status}</span>
                    <span className="text-[10px] text-muted-foreground">{doc.revision}</span>
                  </div>
                  <h4 className="text-sm font-semibold mt-1">{doc.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{doc.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors" onClick={e => { e.stopPropagation(); navigate('/processes'); }}>
                      <ChevronRight className="h-3 w-3" />{doc.processName}
                    </span>
                    <span className="flex items-center gap-1"><User className="h-3 w-3" />{doc.owner}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{format(new Date(doc.lastUpdated), 'MMM d, yyyy')}</span>
                    <span className="text-[10px]">{doc.fileSize}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={e => { e.stopPropagation(); setViewing(doc); }} className="h-8 w-8 flex items-center justify-center rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button onClick={e => handleDownload(doc, e)} className="h-8 w-8 flex items-center justify-center rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                    <Download className="h-4 w-4" />
                  </button>
                </div>
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
                  <span className="font-mono text-xs text-muted-foreground">{selected.docNumber} · {selected.revision}</span>
                  <h2 className="text-lg font-bold mt-1">{selected.title}</h2>
                </div>
                <button onClick={() => setSelected(null)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-secondary/80 transition-colors text-muted-foreground hover:text-foreground"><span className="text-lg">✕</span></button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${docTypeConfig[selected.type].color}`}>{docTypeConfig[selected.type].label}</span>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[selected.status]}`}>{selected.status}</span>
              </div>

              <p className="text-sm text-muted-foreground">{selected.description}</p>

              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex items-center gap-3 cursor-pointer hover:text-primary transition-colors" onClick={() => { setSelected(null); navigate('/processes'); }}>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <div><p className="text-[10px] uppercase text-muted-foreground font-semibold">Linked Process</p><p className="text-sm">{selected.processName}</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div><p className="text-[10px] uppercase text-muted-foreground font-semibold">Owner</p><p className="text-sm">{selected.owner}</p></div>
                </div>
                {selected.approvedBy && (
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-status-ok" />
                    <div><p className="text-[10px] uppercase text-muted-foreground font-semibold">Approved By</p><p className="text-sm">{selected.approvedBy}</p></div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div><p className="text-[10px] uppercase text-muted-foreground font-semibold">Last Updated</p><p className="text-sm">{format(new Date(selected.lastUpdated), 'MMMM d, yyyy')}</p></div>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-[10px] uppercase text-muted-foreground font-semibold mb-2">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {selected.tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded bg-secondary/50 text-[10px] text-muted-foreground">
                      <Tag className="h-2.5 w-2.5" />{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-4 flex gap-2">
                <button onClick={() => { setViewing(selected); setSelected(null); }} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
                  <Eye className="h-3.5 w-3.5" /> View Document
                </button>
                <button onClick={() => handleDownload(selected)} className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-secondary/50 text-xs font-medium hover:bg-secondary transition-colors">
                  <Download className="h-3.5 w-3.5" /> Download
                </button>
              </div>

              {(selected.status === 'draft' || selected.status === 'under-review') && (
                <button onClick={() => handleApprove(selected)} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-status-ok/15 text-status-ok text-xs font-semibold hover:bg-status-ok/25 transition-colors">
                  <CheckCircle className="h-3.5 w-3.5" /> Approve & Publish
                </button>
              )}

              <div className="border-t border-border pt-4">
                <p className="text-[10px] uppercase text-muted-foreground font-semibold mb-2">Version History</p>
                <div className="space-y-2">
                  {['Rev ' + selected.revision.split(' ')[1], 'Rev ' + String.fromCharCode(selected.revision.split(' ')[1].charCodeAt(0) - 1), 'Rev ' + String.fromCharCode(selected.revision.split(' ')[1].charCodeAt(0) - 2)].filter(r => r.split(' ')[1] >= 'A').map((rev, i) => (
                    <div key={rev} className="flex items-center gap-3 text-xs">
                      <div className={`h-2 w-2 rounded-full ${i === 0 ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                      <span className="font-mono">{rev}</span>
                      <span className="text-muted-foreground">{i === 0 ? 'Current' : `${30 * (i + 1)} days ago`}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        )}
      </AnimatePresence>

      {/* Document Viewer Dialog */}
      <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${docTypeConfig[viewing.type].color}`}>{docTypeConfig[viewing.type].label}</span>
                  <span>{viewing.docNumber} — {viewing.title}</span>
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto space-y-4 py-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border pb-3">
                  <span>{viewing.revision} · {viewing.processName}</span>
                  <span>Owner: {viewing.owner}</span>
                </div>
                <div className="space-y-6 font-mono text-sm leading-relaxed">
                  {(mockDocContent[viewing.type] || mockDocContent.sop).map((section, i) => (
                    <div key={i} className="whitespace-pre-wrap text-foreground/90 bg-secondary/20 rounded-lg p-4 border border-border/50">
                      {section}
                    </div>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <button onClick={() => handleDownload(viewing)} className="flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-secondary transition-colors">
                  <Download className="h-4 w-4" /> Download
                </button>
                <button onClick={() => setViewing(null)} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                  Close
                </button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {uploadProgress !== null ? (
              <div className="space-y-3 py-4">
                <div className="flex items-center justify-center">
                  <Upload className="h-8 w-8 text-primary animate-pulse" />
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
                <p className="text-center text-sm text-muted-foreground">Uploading... {uploadProgress}%</p>
              </div>
            ) : (
              <>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/40 transition-colors cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Drag & drop or click to select</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, XLSX up to 25MB</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Document Title *</label>
                  <input value={uploadForm.title} onChange={e => setUploadForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Updated SOP for Line 3" className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Document Type</label>
                    <select value={uploadForm.type} onChange={e => setUploadForm(f => ({ ...f, type: e.target.value as DocType }))} className={selectInputClass}>
                      {Object.entries(docTypeConfig).map(([key, cfg]) => (
                        <option key={key} value={key}>{cfg.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Tags (comma-separated)</label>
                    <input value={uploadForm.tags} onChange={e => setUploadForm(f => ({ ...f, tags: e.target.value }))} placeholder="e.g. quality, setup" className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Description</label>
                  <textarea value={uploadForm.description} onChange={e => setUploadForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description..." rows={2} className={inputClass} />
                </div>
              </>
            )}
          </div>
          {uploadProgress === null && (
            <DialogFooter>
              <button onClick={() => setShowUpload(false)} className="px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-secondary transition-colors">Cancel</button>
              <button onClick={handleUpload} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">Upload</button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
