import { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { aiConsoleMessages } from '@/pages/Taskmaster';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  Activity,
  BarChart3,
  ShieldAlert,
  Lightbulb,
  Brain,
  Bell,
  Settings,
  ChevronRight,
  ArrowRight,
  Check,
  Factory,
  Gauge,
  TrendingUp,
  Zap,
  User,
  Building2,
  ChevronDown,
  LogIn,
  ClipboardList,
  Timer,
  Wrench,
  Package,
  BookOpen,
  FileText,
  ArrowRightLeft,
  History,
  Shield,
  Crosshair,
  Ruler,
  Compass,
} from 'lucide-react';
import { useBusiness, businessList } from '@/contexts/BusinessContext';
import IntegrationSection from '@/components/landing/IntegrationSection';
import ThemeToggle from '@/components/shared/ThemeToggle';
import OpsPilotLogo from '@/components/shared/OpsPilotLogo';

/* ─────────────────────────────────────────────────────────────
   OPSPILOT — Technical Drawing / Blueprint Landing Page
   Aesthetic: engineering drawing aesthetic with dimension lines,
   callouts, title blocks. Monospace + serif. Graphite + cyan.
   ───────────────────────────────────────────────────────────── */

function LayoutDashboardIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
  );
}

/* ── Parts list (modules) — organized as BOM-style entries ── */
interface PartDetail {
  no: string;
  cat: string;
  icon: any;
  title: string;
  desc: string;
  badge?: string;
  longDesc: string;
  features: string[];
  mockup: 'dashboard' | 'chart' | 'kanban' | 'audit' | 'doc' | 'form' | 'list' | 'timeline';
  route?: string;
}

const partsList: PartDetail[] = [
  { no: '001', cat: 'PROD', icon: LayoutDashboardIcon, title: 'Live Dashboard', desc: 'Every metric that matters on one screen — defect rate, OEE, open tasks, and process stability.',
    longDesc: 'Every plant-floor metric that matters, in one consolidated view. Auto-refreshes as new sensor data arrives. Drag tiles to customize your layout.',
    features: ['Live KPI tiles with trend indicators', 'Drag-and-drop tile customization', 'PDF export for shift handoffs', 'Drill-down to any process chart'],
    mockup: 'dashboard', route: '/dashboard' },
  { no: '002', cat: 'PROD', icon: Activity, title: 'Process Monitoring', desc: 'Track every production line with cycle-time charts and throughput metrics.',
    longDesc: 'Stream cycle time, throughput, and quality data from every line. Taskmaster auto-flags processes drifting outside normal operating envelopes.',
    features: ['Live cycle-time distribution', 'Throughput forecasting', 'Cross-line comparisons', 'Shift-based rollups'],
    mockup: 'chart', route: '/processes' },
  { no: '003', cat: 'PROD', icon: Gauge, title: 'OEE Tracking', desc: 'Availability, performance, and quality scores across shifts and lines.',
    longDesc: 'Full OEE decomposition (A × P × Q) with automatic loss categorization. See exactly where productivity is leaking.',
    features: ['Six Big Losses tracking', 'Shift and line benchmarking', 'OEE target alerts', 'World-class vs typical benchmarking'],
    mockup: 'dashboard', route: '/oee' },
  { no: '004', cat: 'PROD', icon: Timer, title: 'Downtime Tracking', desc: 'Log, categorize, and analyze downtime with integrated PM scheduling.',
    longDesc: 'Capture every unplanned stop. Reason codes auto-apply based on machine state. Pareto charts expose the top chronic offenders.',
    features: ['Auto-captured from PLC tags', 'Reason-code Pareto', 'MTBF / MTTR tracking', 'PM scheduling integration'],
    mockup: 'chart', route: '/downtime' },
  { no: '005', cat: 'QUAL', icon: BarChart3, title: 'SPC / Control Charts', desc: 'Auto-calculated Cpk, UCL, LCL with Western Electric rule detection.',
    longDesc: 'Real-time statistical process control for every measurement stream. Violations open automatically and alert the right shift.',
    features: ['X̄ & R, I-MR, p-chart, u-chart', 'All 8 Western Electric rules', 'Rolling Cpk / Cpu / Cpl', 'Auto-adjustment suggestions'],
    mockup: 'chart', route: '/quality' },
  { no: '006', cat: 'QUAL', icon: ShieldAlert, title: 'PFMEA Workflows', desc: 'Structured failure mode analysis with RPN scoring and action tracking.',
    longDesc: 'Every failure mode scored for Severity, Occurrence, and Detection. Action items auto-assign owners and track closure.',
    features: ['Template library (AIAG-VDA compatible)', 'RPN thresholds trigger tasks', 'Revision history & approvals', 'Link PFMEA items to work orders'],
    mockup: 'list', route: '/pfmea' },
  { no: '007', cat: 'QUAL', icon: Lightbulb, title: 'Improvement Insights', desc: 'Surface root causes and trends from cross-shift and cross-process data.',
    longDesc: 'Taskmaster correlates anomalies across shifts, operators, materials, and environmental factors to surface true root causes.',
    features: ['Cross-shift pattern detection', 'Supplier variance flagging', 'Auto-generated hypotheses', 'Historical trend mining'],
    mockup: 'chart', route: '/insights' },
  { no: '008', cat: 'QUAL', icon: Bell, title: 'Smart Alerts', desc: 'Severity-based routing, noise suppression, and shift-aware notifications.',
    longDesc: 'Critical alerts route to the on-call operator. Warnings queue for shift start. Noise patterns are suppressed automatically.',
    features: ['Severity-based routing rules', 'Noise suppression (shift changes, setup)', 'SMS / email / Slack / mobile push', 'Escalation ladders'],
    mockup: 'list', route: '/alerts' },
  { no: '009', cat: 'PROJ', icon: ClipboardList, title: 'Kanban Board', desc: 'Drag-and-drop task tracking with subtasks, labels, and audit trails.',
    longDesc: 'A task board that speaks the shop floor. Tasks link to processes, PFMEA items, work orders, and audits.',
    features: ['Drag between columns with audit trail', 'Subtasks, labels, due dates', 'Assignee workload balancer', 'Filter by process, shift, owner'],
    mockup: 'kanban', route: '/tasks' },
  { no: '010', cat: 'PROJ', icon: FileText, title: '8D Problem Solving', desc: 'Structured D1–D8 discipline workflow with report generation.',
    longDesc: 'Full 8D methodology, from team formation through verification. One-click PDF export for customer submissions.',
    features: ['D1–D8 step-by-step workflow', 'Team, containment, root-cause fields', 'Verification evidence upload', 'PDF export for customer response'],
    mockup: 'doc', route: '/8d-reports' },
  { no: '011', cat: 'PROJ', icon: Shield, title: '5S Audits', desc: 'Scorecard-based audits with radar charts and trend tracking.',
    longDesc: 'Audits any operator can run on a tablet. Scores roll up to a plant dashboard. Trend charts show which zones are slipping.',
    features: ['Mobile-first audit form', '5S radar chart per zone', 'Trend tracking over time', 'Photo evidence per category'],
    mockup: 'audit', route: '/5s-audits' },
  { no: '012', cat: 'PROJ', icon: Brain, title: 'Taskmaster AI', desc: 'AI-assisted task orchestration, drift detection, and autonomous insights.', badge: 'PRO',
    longDesc: 'A second set of eyes on every process. Taskmaster catches drift before it becomes defect, auto-adjusts control limits, and writes first-draft root-cause analyses.',
    features: ['Predictive drift detection', 'Alert noise suppression', 'Autonomous root-cause drafting', 'Auto-generated SOP revisions'],
    mockup: 'timeline', route: '/taskmaster' },
  { no: '013', cat: 'OPS', icon: Wrench, title: 'Work Orders', desc: 'Create, assign, and track maintenance and production work orders.',
    longDesc: 'A work-order system that actually integrates with your quality and downtime data. Preventive maintenance auto-generates from equipment runtime.',
    features: ['Preventive + corrective WOs', 'Parts & labor cost tracking', 'Mobile operator acceptance', 'Auto-link to downtime events'],
    mockup: 'list', route: '/work-orders' },
  { no: '014', cat: 'OPS', icon: Package, title: 'Bill of Materials', desc: 'Manage component structures, costs, and supplier information.',
    longDesc: 'Multi-level BOMs with component costs, supplier details, and revision tracking. Links to Work Orders and NPI workflows.',
    features: ['Multi-level BOM trees', 'Component cost rollups', 'Supplier ratings & lead times', 'ECN / revision history'],
    mockup: 'list', route: '/bom' },
  { no: '015', cat: 'OPS', icon: BookOpen, title: 'Document Control', desc: 'Version-controlled SOPs, drawings, and compliance documents.',
    longDesc: 'Every SOP, drawing, and compliance doc in one searchable library. Version history, approvals, and controlled distribution.',
    features: ['Version control with diff view', 'Approval workflows', 'Controlled-copy tracking', 'Full-text search across files'],
    mockup: 'doc', route: '/documents' },
  { no: '016', cat: 'OPS', icon: ArrowRightLeft, title: 'Shift Handoff', desc: 'Structured handoff notes with issue escalation and KPI snapshots.',
    longDesc: 'Shift end triggers a structured report: KPI snapshot, open issues, escalations, and carry-over tasks. No more lost context.',
    features: ['Auto-populated KPI summary', 'Open issue escalation', 'Carry-over task list', 'Email / PDF distribution'],
    mockup: 'doc', route: '/shift-handoff' },
];

const catLabel: Record<string, string> = {
  PROD: 'Production',
  QUAL: 'Quality',
  PROJ: 'Project Mgmt',
  OPS:  'Operations',
};

/* ── Live mini-visualizations ── */
function useMiniThroughput() {
  const [data, setData] = useState(() => {
    const d = [];
    for (let i = 0; i < 40; i++) {
      d.push({ t: i, v: 110 + Math.sin(i * 0.4) * 15 + (Math.random() - 0.5) * 10 });
    }
    return d;
  });
  useEffect(() => {
    const id = setInterval(() => {
      setData(prev => [
        ...prev.slice(1),
        { t: prev[prev.length - 1].t + 1, v: 110 + Math.sin(prev[prev.length - 1].t * 0.4) * 15 + (Math.random() - 0.5) * 10 },
      ]);
    }, 1200);
    return () => clearInterval(id);
  }, []);
  return data;
}

function useOscillatingKPIs() {
  const [vals, setVals] = useState(['0.42%', '87.3%', '42.1s', '24', '99.1%']);
  useEffect(() => {
    const id = setInterval(() => {
      setVals([
        `${(0.38 + Math.random() * 0.12).toFixed(2)}%`,
        `${(85 + Math.random() * 4).toFixed(1)}%`,
        `${(41 + Math.random() * 2).toFixed(1)}s`,
        `${Math.floor(22 + Math.random() * 6)}`,
        `${(98.8 + Math.random() * 0.4).toFixed(1)}%`,
      ]);
    }, 2400);
    return () => clearInterval(id);
  }, []);
  return vals;
}

const oeeData = [
  { name: 'Available', value: 87, color: 'hsl(var(--chart-blue))' },
  { name: 'Loss', value: 13, color: 'hsl(var(--border))' },
];

const driftSparkData = (() => {
  const d = [];
  for (let i = 0; i < 30; i++) {
    const base = 50 + Math.sin(i * 0.3) * 8 + (Math.random() - 0.5) * 4;
    d.push({ t: i, v: base + (i > 24 ? (i - 24) * 4 : 0), ucl: 70, lcl: 30, cl: 50 });
  }
  return d;
})();

/* ── Animated counter ── */
function AnimatedCounter({ value, prefix = '', suffix = '', decimals = 0 }: { value: number; prefix?: string; suffix?: string; decimals?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -50px 0px' });
  useEffect(() => {
    if (!inView) return;
    const start = Date.now();
    const duration = 1400;
    const id = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(value * eased);
      if (p === 1) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [inView, value]);
  return <span ref={ref}>{prefix}{display.toFixed(decimals)}{suffix}</span>;
}

const stats = [
  { value: 16,   label: 'Modules',         prefix: '', suffix: '+' },
  { value: 8,    label: 'Min. to first chart', prefix: '<', suffix: '' },
  { value: 99.9, label: 'Uptime',          prefix: '', suffix: '%' },
  { value: 4.2,  label: 'Avg. Cpk lift',   prefix: '', suffix: 'x' },
];

/* ── Fade on scroll ── */
function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -80px 0px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 14 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.2, 0.65, 0.3, 0.95] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── PartMockup: tiny screenshot-style visual per module type ── */
function PartMockup({ type }: { type: 'dashboard' | 'chart' | 'kanban' | 'audit' | 'doc' | 'form' | 'list' | 'timeline' }) {
  if (type === 'dashboard') {
    return (
      <div className="border border-border bg-background p-2 space-y-1.5">
        <div className="grid grid-cols-4 gap-1">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="border border-border/60 bg-card p-1.5">
              <div className="h-1 w-5 bg-muted-foreground/30 mb-1" />
              <div className="h-2.5 w-8 bg-primary/60" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-1">
          <div className="col-span-2 h-10 border border-border/60 bg-card relative overflow-hidden">
            <svg viewBox="0 0 100 40" className="w-full h-full">
              <path d="M0,30 L20,22 L40,25 L60,15 L80,20 L100,10" fill="none" stroke="hsl(var(--primary))" strokeWidth="1" />
              <path d="M0,30 L20,22 L40,25 L60,15 L80,20 L100,10 L100,40 L0,40 Z" fill="hsl(var(--primary) / 0.15)" />
            </svg>
          </div>
          <div className="h-10 border border-border/60 bg-card flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="h-6 w-6">
              <circle cx="12" cy="12" r="10" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
              <circle cx="12" cy="12" r="10" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeDasharray="48 64" strokeDashoffset="0" transform="rotate(-90 12 12)" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div className="border border-border bg-background p-2">
        <div className="flex items-center justify-between mb-1.5">
          <div className="h-1 w-12 bg-muted-foreground/30" />
          <div className="bp-chip bp-chip-primary !text-[8px] !py-0">UCL/LCL</div>
        </div>
        <div className="h-20 relative border border-border/60 bg-card">
          <svg viewBox="0 0 100 50" className="w-full h-full" preserveAspectRatio="none">
            {/* UCL/LCL */}
            <line x1="0" y1="12" x2="100" y2="12" stroke="hsl(var(--status-critical))" strokeDasharray="2,2" strokeWidth="0.4" opacity="0.6" />
            <line x1="0" y1="38" x2="100" y2="38" stroke="hsl(var(--status-critical))" strokeDasharray="2,2" strokeWidth="0.4" opacity="0.6" />
            <line x1="0" y1="25" x2="100" y2="25" stroke="hsl(var(--muted-foreground))" strokeDasharray="1,3" strokeWidth="0.3" opacity="0.4" />
            {/* trace */}
            <path d="M0,25 L10,22 L20,28 L30,24 L40,30 L50,20 L60,26 L70,23 L80,32 L90,18 L100,25" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.8" />
            <circle cx="80" cy="32" r="1.5" fill="hsl(var(--status-warning))" />
          </svg>
        </div>
      </div>
    );
  }

  if (type === 'kanban') {
    return (
      <div className="border border-border bg-background p-2">
        <div className="grid grid-cols-3 gap-1.5">
          {['To Do', 'Active', 'Done'].map((col, i) => (
            <div key={col} className="flex flex-col gap-1">
              <div className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">{col}</div>
              {[1, 2, i === 2 ? 3 : 0].filter(Boolean).map(n => (
                <div key={n} className="border border-border/60 bg-card p-1">
                  <div className="h-0.5 w-full bg-muted-foreground/30 mb-0.5" />
                  <div className="h-0.5 w-2/3 bg-muted-foreground/20" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'audit') {
    return (
      <div className="border border-border bg-background p-2">
        <div className="flex justify-center">
          {/* radar mock */}
          <svg viewBox="-30 -30 60 60" className="h-24 w-24">
            <polygon points="0,-25 22,-8 14,20 -14,20 -22,-8" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" />
            <polygon points="0,-17 15,-5 10,14 -10,14 -15,-5" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" />
            <polygon points="0,-20 18,-6 12,16 -8,17 -19,-6" fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))" strokeWidth="1" />
            {[['S1', 0, -28], ['S2', 24, -10], ['S3', 16, 23], ['S4', -16, 23], ['S5', -24, -10]].map(([l, x, y], i) => (
              <text key={i} x={Number(x)} y={Number(y)} fill="hsl(var(--muted-foreground))" fontSize="4" textAnchor="middle">{l}</text>
            ))}
          </svg>
        </div>
      </div>
    );
  }

  if (type === 'doc') {
    return (
      <div className="border border-border bg-background p-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <div className="h-1 w-10 bg-foreground/60" />
          <div className="font-mono text-[8px] text-muted-foreground">REV 07</div>
        </div>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className={`h-0.5 mb-1 bg-muted-foreground/30 ${i === 2 ? 'w-3/4' : i === 5 ? 'w-2/3' : 'w-full'}`} />
        ))}
        <div className="mt-2 flex gap-1">
          <div className="bp-chip !text-[8px] !py-0">Approved</div>
          <div className="bp-chip !text-[8px] !py-0">J.D.</div>
        </div>
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="border border-border bg-background">
        {['WO-4421 · Line A', 'WO-4422 · Line B', 'WO-4423 · Line A', 'WO-4424 · Line C'].map((row, i) => (
          <div key={i} className={`flex items-center justify-between px-2 py-1 ${i < 3 ? 'border-b border-border/60' : ''}`}>
            <div className="font-mono text-[9px] text-foreground">{row}</div>
            <div className={`h-1.5 w-1.5 rounded-full ${i === 0 ? 'bg-status-warning' : i === 1 ? 'bg-status-ok' : 'bg-muted-foreground/40'}`} />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'timeline') {
    // Taskmaster AI — console-style events
    return (
      <div className="border border-primary/30 bg-card p-2 font-mono text-[9px] leading-relaxed space-y-1">
        <div className="flex items-center gap-1.5 text-primary"><span className="h-1 w-1 rounded-full bg-primary bp-blink" />taskmaster · online</div>
        {['drift caught · Line B-03', 'limits adjusted · Cpk +0.05', 'root cause drafted'].map((msg, i) => (
          <div key={i} className="flex gap-1.5">
            <span className="text-muted-foreground">›</span>
            <span className="text-foreground/80 truncate">{msg}</span>
          </div>
        ))}
      </div>
    );
  }

  // default "form" fallback
  return (
    <div className="border border-border bg-background p-2 space-y-1">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex gap-1">
          <div className="h-1 w-10 bg-muted-foreground/40" />
          <div className="h-2 flex-1 border border-border/60 bg-card" />
        </div>
      ))}
    </div>
  );
}

/* ── PartRow: expandable list row for platform parts ── */
function PartRow({ part, open, onToggle }: { part: PartDetail; open: boolean; onToggle: () => void }) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={`group w-full grid grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-card/50 transition-colors text-left relative ${open ? 'bg-card/40' : ''}`}
      >
        {/* active indicator */}
        <span className={`absolute left-0 top-0 h-full ${open ? 'w-0.5' : 'w-0 group-hover:w-0.5'} bg-primary transition-all`} />
        <div className="col-span-1 font-mono text-xs text-muted-foreground">
          #{part.no}
        </div>
        <div className="col-span-2">
          <span className="inline-flex px-2 py-0.5 bg-secondary/60 border border-border text-[10px] font-mono font-semibold uppercase tracking-wider text-foreground">
            {part.cat}
          </span>
        </div>
        <div className="col-span-4 sm:col-span-3 flex items-center gap-3">
          <div className={`flex h-8 w-8 items-center justify-center border flex-shrink-0 transition-colors ${open ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-foreground group-hover:border-primary/60'}`}>
            <part.icon className="h-3.5 w-3.5" strokeWidth={1.5} />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-sm truncate">{part.title}</span>
            {part.badge && (
              <span className="px-1 py-0.5 text-[9px] font-mono font-bold bg-accent/20 text-accent border border-accent/40 rounded-sm">
                {part.badge}
              </span>
            )}
          </div>
        </div>
        <div className="hidden sm:block sm:col-span-5 text-sm text-muted-foreground truncate">
          {part.desc}
        </div>
        <div className="col-span-5 sm:col-span-1 text-right">
          <ChevronDown className={`h-4 w-4 ml-auto transition-all ${open ? 'rotate-180 text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.2, 0.65, 0.3, 0.95] }}
            className="overflow-hidden"
          >
            <div className="grid md:grid-cols-12 gap-6 px-4 sm:px-6 pb-6 pt-2 border-t border-dashed border-border/60 bg-background/30">
              {/* Info */}
              <div className="md:col-span-7 md:col-start-2">
                <p className="text-sm text-foreground/85 leading-relaxed mb-4">
                  {part.longDesc}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-3">
                  Key features
                </p>
                <ul className="space-y-2 mb-4">
                  {part.features.map((f, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="font-mono text-[10px] text-primary mt-1 tabular-nums">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="text-sm text-foreground/85">{f}</span>
                    </li>
                  ))}
                </ul>
                {part.route && (
                  <Link
                    to={part.route}
                    className="inline-flex items-center gap-2 px-3 h-8 bg-primary text-primary-foreground font-mono text-[10px] font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors"
                    style={{ borderRadius: 'var(--radius)' }}
                  >
                    Open module
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
              {/* Mockup */}
              <div className="md:col-span-4 md:col-start-9">
                <div className="flex items-center gap-2 mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  <span>Preview · {part.no}</span>
                  <span className="h-px flex-1 bg-border" />
                </div>
                <PartMockup type={part.mockup} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Taskmaster console preview ── */
function TaskmasterConsole() {
  const messages = aiConsoleMessages.slice(0, 5);
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState('');
  useEffect(() => {
    let charIndex = 0;
    const current = messages[index]?.text || '';
    const typing = setInterval(() => {
      if (charIndex <= current.length) {
        setTyped(current.slice(0, charIndex));
        charIndex++;
      } else {
        clearInterval(typing);
        setTimeout(() => {
          setIndex((i) => (i + 1) % messages.length);
          setTyped('');
        }, 2200);
      }
    }, 28);
    return () => clearInterval(typing);
  }, [index, messages]);
  return (
    <div className="bg-background/70 border border-primary/20 p-3 font-mono text-[11px] leading-relaxed min-h-[92px]">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
        <span className="h-1.5 w-1.5 rounded-full bg-primary bp-blink" />
        <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">taskmaster.console</span>
        <span className="ml-auto text-[9px] text-muted-foreground">live</span>
      </div>
      <div>
        <span className="text-primary">›</span>{' '}
        <span className="text-foreground/90">{typed}</span>
        <span className="taskmaster-cursor">▍</span>
      </div>
    </div>
  );
}

/* ── Ticker strip — always-moving status line ── */
function TickerStrip() {
  const items = [
    'OEE · LINE-A · 87.3%',
    'DEFECT RATE · 0.42%',
    'CPK · STABLE · 1.84',
    'TASKMASTER · DRIFT CAUGHT · ABN-0417',
    'SHIFT B · HANDOFF COMPLETE',
    'ALERT · LINE-C · VIBRATION · RESOLVED',
    'UPTIME · 14D 22H 08M',
    'WORK ORDERS · 24 OPEN · 112 CLOSED THIS WEEK',
    '5S SCORE · STATION 4 · 92%',
    'PFMEA · RPN REVIEW · DUE APR-22',
  ];
  const full = [...items, ...items];
  return (
    <div className="relative overflow-hidden border-y border-border bg-card/40">
      <div className="flex bp-marquee whitespace-nowrap">
        {full.map((item, i) => (
          <div key={i} className="flex items-center gap-3 px-6 py-2 font-mono text-[11px] text-muted-foreground">
            <span className="h-1 w-1 rounded-full bg-primary" />
            <span className="uppercase tracking-[0.15em]">{item}</span>
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  const [accountOpen, setAccountOpen] = useState(false);
  const { setActiveBusinessId } = useBusiness();
  const navigate = useNavigate();
  const location = useLocation();
  const throughputData = useMiniThroughput();
  const kpiVals = useOscillatingKPIs();
  const [coord, setCoord] = useState({ x: 0, y: 0 });
  const [openPartId, setOpenPartId] = useState<string | null>(null);

  // Pointer tracking for hero crosshair
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      setCoord({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  // Hash-fragment scroll restoration — fires on mount AND whenever hash changes.
  // Handles returning from /integration/* pages where the hash is set but didn't "change".
  useEffect(() => {
    const hash = location.hash || window.location.hash;
    if (!hash) return;
    const id = hash.slice(1);
    const tryScroll = () => {
      const el = document.getElementById(id);
      if (el) {
        // Small offset so the section header isn't hidden under the sticky nav
        const top = el.getBoundingClientRect().top + window.scrollY - 64;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
        return true;
      }
      return false;
    };
    if (!tryScroll()) {
      let attempts = 0;
      const iv = setInterval(() => {
        attempts++;
        if (tryScroll() || attempts > 20) clearInterval(iv);
      }, 50);
      return () => clearInterval(iv);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.hash, location.pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ═══ NAVIGATION ═══ */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl">
        {/* drawing-border top strip */}
        <div className="h-[3px] bg-gradient-to-r from-primary via-primary/40 to-transparent" />
        <div className="mx-auto max-w-7xl flex h-14 items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <OpsPilotLogo size={32} />
            <div className="flex flex-col leading-none">
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">Drw · 001</span>
              <span className="text-base font-bold tracking-tight">OpsPilot<span className="text-primary">.</span></span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
            {[
              { href: '#platform',   label: 'Platform',    id: '02' },
              { href: '#workflow',   label: 'Workflow',    id: '03' },
              { href: '#integration', label: 'Integration', id: '04' },
              { href: '#pricing',    label: 'Pricing',     id: '05' },
            ].map((item) => (
              <a key={item.href} href={item.href} className="group flex items-center gap-1.5 px-3 py-1.5 hover:text-foreground transition-colors">
                <span className="text-primary/60 group-hover:text-primary transition-colors">{item.id}</span>
                <span>{item.label}</span>
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setAccountOpen(!accountOpen)}
                className="flex items-center gap-2 px-3 py-1.5 border border-border bg-secondary/30 text-xs font-mono uppercase tracking-wider hover:bg-secondary/60 transition-colors"
              >
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="hidden sm:inline">Account</span>
                <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${accountOpen ? 'rotate-180' : ''}`} />
              </button>

              {accountOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setAccountOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 z-50 w-72 border border-border bg-popover shadow-2xl">
                    <div className="p-3 border-b border-border bg-card/50">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center bg-primary/10 border border-primary/40 text-primary text-sm font-mono font-bold">
                          JD
                        </div>
                        <div>
                          <p className="text-sm font-semibold">Jordan Davis</p>
                          <p className="text-xs text-muted-foreground font-mono">jordan@precisionmfg.com</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <p className="px-2 py-1.5 text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-muted-foreground">Your Businesses</p>
                      {businessList.map((biz) => (
                        <button
                          key={biz.id}
                          onClick={() => {
                            setActiveBusinessId(biz.id);
                            setAccountOpen(false);
                            navigate('/dashboard');
                          }}
                          className="w-full flex items-center gap-3 px-2 py-2 hover:bg-secondary/70 transition-colors group"
                        >
                          <div className="flex h-8 w-8 items-center justify-center bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-sm font-medium truncate">{biz.name}</p>
                            <p className="text-[11px] text-muted-foreground font-mono">{biz.role} · {biz.lines} lines</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                    <div className="border-t border-border p-2">
                      <button className="w-full text-left px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
                        + Add a business
                      </button>
                      <button
                        onClick={() => { setAccountOpen(false); navigate('/settings'); }}
                        className="w-full text-left px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
                        Account settings
                      </button>
                      <button className="w-full text-left px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors">
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <Link
              to="/dashboard"
              className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground text-xs font-mono font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Open Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ═══ HERO ═══ */}
      <section className="relative pt-16 pb-0 overflow-hidden">
        {/* Blueprint grid background */}
        <div className="absolute inset-0 bp-grid pointer-events-none" />

        {/* Title block — pinned to left margin, outside the content container */}
        <div className="absolute top-20 left-4 hidden lg:block z-10">
          <div className="bp-title-block text-[9px]" style={{ width: '160px' }}>
            <div className="tb-row grid grid-cols-2 gap-1">
              <div>
                <div className="label">Drawing</div>
                <div className="value">OPS-2026-A</div>
              </div>
              <div>
                <div className="label">Rev</div>
                <div className="value text-primary">07</div>
              </div>
            </div>
            <div className="tb-row">
              <div className="label">Subject</div>
              <div className="value leading-tight">Small-Batch Mfg. Ops Platform</div>
            </div>
            <div className="tb-row grid grid-cols-2 gap-1">
              <div>
                <div className="label">Scale</div>
                <div className="value">1:1</div>
              </div>
              <div>
                <div className="label">Sheet</div>
                <div className="value">01/06</div>
              </div>
            </div>
          </div>
        </div>

        {/* Corner callouts — decorative top-right */}
        <div className="absolute top-6 right-4 sm:right-8 hidden md:flex flex-col items-end gap-1 z-10 font-mono text-[10px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-[0.2em]">Coord</span>
            <span className="text-foreground tabular-nums">
              X:{String(coord.x).padStart(4, '0')} · Y:{String(coord.y).padStart(4, '0')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-[0.2em]">Status</span>
            <span className="inline-flex items-center gap-1 text-status-ok">
              <span className="h-1.5 w-1.5 bg-status-ok bp-blink rounded-full" />
              OPERATIONAL
            </span>
          </div>
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-4 sm:pt-6 pb-20">
          {/* Eyebrow */}
          <FadeIn>
            <div className="flex items-center gap-3 mb-6 mt-2">
              <span className="bp-callout">01</span>
              <div className="h-px flex-none w-12 bg-border" />
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Ref. OPS-2026 · Iss. Apr 2026
              </span>
            </div>
          </FadeIn>

          {/* Headline + abstract — two columns, headline left-aligned with container */}
          <div className="grid md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-8">
              <FadeIn delay={0.05}>
                <h1 className="font-display text-[44px] sm:text-[68px] md:text-[84px] leading-[0.95] tracking-tight">
                  The shop floor, <span className="text-primary">measured</span><span className="text-muted-foreground">,</span><br />
                  <span>mapped</span><span className="text-muted-foreground">,</span> <span>&amp; managed.</span>
                </h1>
              </FadeIn>
            </div>
            <div className="md:col-span-4 md:pt-3">
              <FadeIn delay={0.15}>
                <div className="border-l-2 border-primary pl-4 space-y-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">Abstract</p>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    Quality control and process monitoring for small manufacturers who've outgrown spreadsheets — and can't justify a $200k MES. <span className="text-foreground font-medium">Running in minutes, not months.</span>
                  </p>
                </div>
              </FadeIn>
            </div>
          </div>

          {/* Mobile headline */}
          <div className="md:hidden mt-2">
            <FadeIn delay={0.05}>
              <h1 className="font-display text-[44px] leading-[0.95] tracking-tight mb-6">
                The shop floor, <span className="text-primary">measured</span><span className="text-muted-foreground">,</span><br />
                <span>mapped</span><span className="text-muted-foreground">,</span> <span>&amp; managed.</span>
              </h1>
              <div className="border-l-2 border-primary pl-4 space-y-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">Abstract</p>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  An operations suite that monitors quality, tracks process drift, organizes documents, and keeps every line running — <span className="text-foreground font-medium">no spreadsheets required.</span>
                </p>
              </div>
            </FadeIn>
          </div>

          {/* Dimension line under headline — signature detail */}
          <FadeIn delay={0.25}>
            <div className="mt-10 flex items-center gap-4">
              <svg width="100%" height="24" className="flex-1 text-muted-foreground">
                {/* dimension line with arrow terminations */}
                <line x1="0" y1="12" x2="100%" y2="12" stroke="currentColor" strokeWidth="1" strokeDasharray="2 4" />
                <polygon points="0,12 8,8 8,16" fill="currentColor" />
                <polygon points="100%,12 calc(100% - 8px),8 calc(100% - 8px),16" fill="currentColor" />
                {/* tick mid */}
                <line x1="50%" y1="6" x2="50%" y2="18" stroke="currentColor" strokeWidth="1" />
              </svg>
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground whitespace-nowrap">
                16 modules · 4 categories
              </span>
            </div>
          </FadeIn>

          {/* CTA row */}
          <FadeIn delay={0.35}>
            <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
              <a
                href="#integration"
                className="group relative flex items-center gap-3 px-6 py-3 bg-primary text-primary-foreground font-mono text-sm font-bold uppercase tracking-wider hover:bg-primary/90 transition-all"
              >
                <span className="absolute -top-[1px] -left-[1px] h-2 w-2 border-t border-l border-primary-foreground" />
                <span className="absolute -bottom-[1px] -right-[1px] h-2 w-2 border-b border-r border-primary-foreground" />
                Start free trial
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="#platform"
                className="flex items-center gap-3 px-6 py-3 border border-border text-foreground font-mono text-sm font-medium uppercase tracking-wider hover:border-primary/60 hover:bg-secondary/40 transition-colors"
              >
                <span className="font-mono text-[10px] text-primary">[↓]</span>
                Explore platform
              </a>
              <div className="flex items-center gap-2 pl-0 sm:pl-4 sm:ml-2 sm:border-l sm:border-border sm:py-3">
                <div className="flex -space-x-1.5">
                  {['#22a3c7', '#2dd4bf', '#d97706', '#64748b'].map((c) => (
                    <div key={c} className="h-6 w-6 rounded-full border-2 border-background" style={{ background: c }} />
                  ))}
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  2.4M data points logged daily
                </span>
              </div>
            </div>
          </FadeIn>

          {/* Stats row — measured like dimension call-outs */}
          <FadeIn delay={0.5}>
            <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-px bg-border border border-border">
              {stats.map((stat, i) => (
                <div key={stat.label} className="relative bg-background px-5 py-6 group hover:bg-card transition-colors">
                  <span className="absolute top-2 right-2 font-mono text-[9px] text-muted-foreground/60">0{i + 1}</span>
                  <p className="font-display text-4xl font-semibold text-foreground">
                    <AnimatedCounter
                      value={stat.value}
                      prefix={stat.prefix}
                      suffix={stat.suffix}
                      decimals={stat.value % 1 !== 0 ? 1 : 0}
                    />
                  </p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {stat.label}
                  </p>
                  <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-primary group-hover:w-full transition-all duration-500" />
                </div>
              ))}
            </div>
          </FadeIn>
        </div>

        {/* ═══ HERO DASHBOARD PREVIEW — engineering drawing viewport ═══ */}
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pb-20">
          <FadeIn delay={0.15}>
            <div className="relative">
              {/* Drawing labels around the viewport */}
              <div className="absolute -top-6 left-0 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Fig. A — Live Operations Console
              </div>
              <div className="absolute -top-6 right-0 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Sect. A-A · 1:1
              </div>

              {/* Main dashboard frame */}
              <div className="relative border border-border bg-card">
                {/* Corner brackets */}
                <span className="absolute -top-px -left-px h-3 w-3 border-t-2 border-l-2 border-primary" />
                <span className="absolute -top-px -right-px h-3 w-3 border-t-2 border-r-2 border-primary" />
                <span className="absolute -bottom-px -left-px h-3 w-3 border-b-2 border-l-2 border-primary" />
                <span className="absolute -bottom-px -right-px h-3 w-3 border-b-2 border-r-2 border-primary" />

                {/* Top bar — like drawing frame header */}
                <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-background/60">
                  <div className="flex gap-1.5">
                    <div className="h-2 w-2 bg-status-critical/50 rounded-full" />
                    <div className="h-2 w-2 bg-status-warning/50 rounded-full" />
                    <div className="h-2 w-2 bg-status-ok/50 rounded-full" />
                  </div>
                  <div className="h-3 w-px bg-border mx-1" />
                  <div className="flex-1 font-mono text-[10px] text-muted-foreground tracking-wider">
                    <span className="text-muted-foreground/60">path:</span> /dashboard/live · <span className="text-muted-foreground/60">line:</span> A-01 · <span className="text-muted-foreground/60">shift:</span> DAY · <span className="text-muted-foreground/60">updated:</span> <span className="text-primary tabular-nums">{new Date().toLocaleTimeString('en-US', { hour12: false })}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-status-ok bp-blink" />
                    <span className="font-mono text-[9px] uppercase tracking-widest text-status-ok">LIVE</span>
                  </div>
                </div>

                <div className="p-6 space-y-4 bp-grid-subtle">
                  {/* KPI strip */}
                  <div className="grid grid-cols-5 gap-px bg-border border border-border">
                    {['Defect Rate', 'OEE', 'Cycle Time', 'Open Tasks', 'Uptime'].map((label, i) => (
                      <div key={label} className="bg-card px-3 py-3 relative">
                        <span className="font-mono text-[8px] text-muted-foreground/70 uppercase tracking-[0.2em]">
                          {label}
                        </span>
                        <p className="font-mono font-bold text-lg mt-1 text-foreground tabular-nums">{kpiVals[i]}</p>
                        <span className="absolute top-2 right-2 font-mono text-[8px] text-muted-foreground/50">
                          /0{i + 1}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 h-44 border border-border bg-card overflow-hidden relative">
                      <div className="absolute top-2 left-3 font-mono text-[9px] uppercase tracking-wider text-muted-foreground z-10">
                        Throughput · parts/hr
                      </div>
                      <div className="absolute top-2 right-3 font-mono text-[9px] text-primary z-10">
                        ⟶ trending +4.2%
                      </div>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={throughputData} margin={{ top: 28, right: 12, left: 12, bottom: 8 }}>
                          <defs>
                            <linearGradient id="heroChart" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="hsl(var(--chart-blue))" stopOpacity={0.25} />
                              <stop offset="100%" stopColor="hsl(var(--chart-blue))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="v" stroke="hsl(var(--chart-blue))" fill="url(#heroChart)" strokeWidth={1.5} isAnimationActive={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="h-44 border border-border bg-card flex flex-col items-center justify-center relative">
                      <div className="absolute top-2 left-3 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                        OEE · 87%
                      </div>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={oeeData} cx="50%" cy="50%" innerRadius="52%" outerRadius="78%" dataKey="value" strokeWidth={0} isAnimationActive={false} startAngle={90} endAngle={-270}>
                            {oeeData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="font-display text-3xl text-foreground">87</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom annotation strip */}
                <div className="border-t border-border bg-background/60 px-4 py-2 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                  <span>fig-a.dashboard.live</span>
                  <div className="flex items-center gap-4">
                    <span>drawn: ops-team</span>
                    <span>rev: 07</span>
                    <span className="text-primary">checked: ✓</span>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══ TICKER ═══ */}
      <TickerStrip />

      {/* ═══ PLATFORM / PARTS LIST ═══ */}
      <section id="platform" className="relative px-4 sm:px-6 py-24 border-t border-border">
        <div className="mx-auto max-w-7xl">
          <FadeIn className="grid md:grid-cols-12 gap-6 mb-14">
            <div className="md:col-span-5">
              <div className="flex items-center gap-3 mb-4">
                <span className="bp-callout">02</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  Parts List
                </span>
              </div>
              <h2 className="font-display text-5xl md:text-6xl leading-[0.95]">
                Sixteen modules.<br />
                <span className="text-primary">One bill of materials.</span>
              </h2>
            </div>
            <div className="md:col-span-6 md:col-start-7 self-end">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Built for the 10–80 person shop running 2–15 processes. Each module connects to the others — so a control-chart violation becomes a Kanban task, opens an 8D, and updates your PFMEA automatically. <span className="text-foreground">No consultant required.</span>
              </p>
            </div>
          </FadeIn>

          {/* Parts list table header */}
          <FadeIn delay={0.05}>
            <div className="grid grid-cols-12 gap-4 px-4 py-3 border-y border-border bg-card/40 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <div className="col-span-1">No.</div>
              <div className="col-span-2">Cat</div>
              <div className="col-span-4 sm:col-span-3">Name</div>
              <div className="hidden sm:block sm:col-span-5">Description</div>
              <div className="col-span-5 sm:col-span-1 text-right">Spec</div>
            </div>
          </FadeIn>

          {/* Parts list rows */}
          <div className="divide-y divide-border border-b border-border">
            {partsList.map((part, i) => (
              <FadeIn key={part.no} delay={Math.min(0.02 * i, 0.4)}>
                <PartRow
                  part={part}
                  open={openPartId === part.no}
                  onToggle={() => setOpenPartId(openPartId === part.no ? null : part.no)}
                />
              </FadeIn>
            ))}
          </div>

          {/* Category legend */}
          <FadeIn delay={0.1}>
            <div className="mt-6 flex flex-wrap items-center gap-6 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <span>Legend:</span>
              {Object.entries(catLabel).map(([k, v]) => (
                <span key={k} className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-secondary/60 border border-border text-foreground">
                    {k}
                  </span>
                  = {v}
                </span>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══ WORKFLOW — Assembly Instructions ═══ */}
      <section id="workflow" className="relative px-4 sm:px-6 py-24 border-t border-border">
        <div className="absolute inset-0 bp-grid-subtle pointer-events-none" />
        <div className="relative mx-auto max-w-6xl">
          <FadeIn className="mb-14">
            <div className="flex items-center gap-3 mb-4">
              <span className="bp-callout">03</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Assembly Instructions
              </span>
            </div>
            <h2 className="font-display text-5xl md:text-6xl leading-[0.95] max-w-3xl">
              Three steps to <span>get running.</span>
            </h2>
          </FadeIn>

          <div className="relative grid md:grid-cols-3 gap-6">
            {/* connecting dashed line */}
            <div className="hidden md:block absolute top-6 left-0 right-0 h-px">
              <svg width="100%" height="2" className="text-border">
                <line x1="8%" y1="1" x2="92%" y2="1" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
              </svg>
            </div>

            {[
              {
                step: '01',
                verb: 'Connect',
                title: 'Upload your data.',
                desc: 'Import a CSV, enter data by hand, or connect PLCs and sensors. OpsPilot auto-discovers your processes and configures dashboards. No IT project.',
              },
              {
                step: '02',
                verb: 'Operate',
                title: 'One view for the whole floor.',
                desc: 'Track OEE, downtime, and quality side-by-side. Drag tasks on the Kanban, run 8D investigations, log 5S audits — all one login, one schema.',
              },
              {
                step: '03',
                verb: 'Improve',
                title: 'Close the loop on quality.',
                desc: 'Smart alerts catch process drift early. PFMEA workflows and insight reports close the loop — detection, root cause, corrective action, verification.',
              },
            ].map((item, i) => (
              <FadeIn key={item.step} delay={i * 0.1}>
                <div className="relative bg-card border border-border p-6 h-full">
                  {/* corner brackets */}
                  <span className="absolute -top-px -left-px h-3 w-3 border-t-2 border-l-2 border-primary" />
                  <span className="absolute -bottom-px -right-px h-3 w-3 border-b-2 border-r-2 border-primary" />

                  {/* Big step indicator — sits on top of the dashed line */}
                  <div className="flex items-center gap-4 mb-6 -mt-12 bg-background w-fit pr-4">
                    <div className="flex h-12 w-12 items-center justify-center bg-primary text-primary-foreground font-mono text-xl font-bold border-2 border-background">
                      {item.step}
                    </div>
                    <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary">
                      / {item.verb}
                    </span>
                  </div>

                  <h3 className="font-display text-2xl mb-3 leading-tight">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>

                  {/* bottom spec line */}
                  <div className="mt-6 pt-4 border-t border-dashed border-border flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                    <span>step.{item.step}</span>
                    <span className="flex items-center gap-1">
                      <span className="h-1 w-1 rounded-full bg-status-ok bp-blink" />
                      verified
                    </span>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TASKMASTER — Featured AI component ═══ */}
      <section id="taskmaster" className="relative px-4 sm:px-6 py-24 border-t border-border overflow-hidden">
        <div className="absolute inset-0 bp-grid pointer-events-none opacity-60" />
        <div className="relative mx-auto max-w-6xl">
          <FadeIn>
            <div className="relative border border-border bg-card/80 backdrop-blur">
              {/* Full corner brackets */}
              <span className="absolute -top-px -left-px h-4 w-4 border-t-2 border-l-2 border-primary" />
              <span className="absolute -top-px -right-px h-4 w-4 border-t-2 border-r-2 border-primary" />
              <span className="absolute -bottom-px -left-px h-4 w-4 border-b-2 border-l-2 border-primary" />
              <span className="absolute -bottom-px -right-px h-4 w-4 border-b-2 border-r-2 border-primary" />

              {/* Header strip */}
              <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-background/40">
                <div className="flex items-center gap-3">
                  <span className="bp-callout">04</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    Sub-Assembly · AI Engine
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-accent/20 text-accent border border-accent/40 text-[10px] font-mono font-bold uppercase tracking-widest">
                  PRO
                </span>
              </div>

              <div className="p-6 sm:p-10">
                <div className="grid md:grid-cols-12 gap-8">
                  <div className="md:col-span-7">
                    <h2 className="font-display text-5xl md:text-6xl leading-[0.95]">
                      Meet <span className="text-primary">Taskmaster</span>.
                    </h2>
                    <p className="mt-5 text-base text-muted-foreground leading-relaxed max-w-xl">
                      An autonomous layer that watches every process. It catches drift before a defect lands, auto-adjusts control limits, and surfaces root causes — augmenting your team with <span className="text-foreground">operations intelligence that never sleeps.</span>
                    </p>

                    <div className="mt-7">
                      <Link
                        to="/taskmaster"
                        className="inline-flex items-center gap-3 px-5 py-2.5 bg-primary text-primary-foreground font-mono text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors"
                      >
                        <Brain className="h-4 w-4" />
                        Explore Taskmaster
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>

                    {/* Capability pills */}
                    <div className="mt-8 grid grid-cols-2 gap-2">
                      {[
                        { icon: TrendingUp, title: 'Predictive Drift Detection' },
                        { icon: ShieldAlert, title: 'Smart Alert Suppression' },
                        { icon: Brain, title: 'Autonomous Root Cause' },
                        { icon: Lightbulb, title: 'Auto-Generated SOPs' },
                        { icon: Gauge, title: 'Live Cpk Tracking' },
                        { icon: Zap, title: 'Preventive Maintenance' },
                      ].map((cap) => (
                        <div key={cap.title} className="flex items-center gap-2 px-3 py-2 bg-background/50 border border-border">
                          <cap.icon className="h-3.5 w-3.5 text-primary flex-shrink-0" strokeWidth={1.5} />
                          <span className="font-mono text-[10px] uppercase tracking-wider">{cap.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-5 space-y-3">
                    <TaskmasterConsole />

                    {/* Drift chart — blueprint styled */}
                    <div className="border border-border bg-background/40 p-3 relative overflow-hidden">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                          Drift · Live
                        </span>
                        <span className="font-mono text-[9px] text-status-warning flex items-center gap-1">
                          <span className="h-1 w-1 bg-status-warning bp-blink rounded-full" />
                          ANOMALY
                        </span>
                      </div>
                      <ResponsiveContainer width="100%" height={92}>
                        <LineChart data={driftSparkData} margin={{ top: 6, right: 6, left: 6, bottom: 0 }}>
                          <Line type="monotone" dataKey="ucl" stroke="hsl(var(--destructive))" strokeWidth={1} strokeDasharray="3 2" dot={false} isAnimationActive={false} />
                          <Line type="monotone" dataKey="lcl" stroke="hsl(var(--destructive))" strokeWidth={1} strokeDasharray="3 2" dot={false} isAnimationActive={false} />
                          <Line type="monotone" dataKey="cl" stroke="hsl(var(--status-ok))" strokeWidth={1} strokeDasharray="1 3" dot={false} isAnimationActive={false} />
                          <Line type="monotone" dataKey="v" stroke="hsl(var(--accent))" strokeWidth={1.5} dot={(props: any) => {
                            const { cx, cy, index, payload } = props;
                            if (payload.v > payload.ucl) return <circle key={index} cx={cx} cy={cy} r={3} fill="hsl(var(--destructive))" stroke="hsl(var(--background))" strokeWidth={1} />;
                            return null;
                          }} isAnimationActive={false} />
                        </LineChart>
                      </ResponsiveContainer>
                      <div className="flex justify-between font-mono text-[8px] uppercase tracking-wider text-muted-foreground mt-1 pt-1 border-t border-border/50">
                        <span>UCL: 70</span>
                        <span>CL: 50</span>
                        <span>LCL: 30</span>
                      </div>
                    </div>

                    {/* Title block for this sub-assembly */}
                    <div className="bp-title-block">
                      <div className="tb-row grid grid-cols-3 gap-2">
                        <div>
                          <div className="label">Detections</div>
                          <div className="value text-accent">1,847</div>
                        </div>
                        <div>
                          <div className="label">Prevented</div>
                          <div className="value text-status-ok">94.2%</div>
                        </div>
                        <div>
                          <div className="label">Uptime</div>
                          <div className="value">99.99</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <IntegrationSection />

      {/* ═══ PRICING ═══ */}
      <section id="pricing" className="relative px-4 sm:px-6 py-24 border-t border-border">
        <div className="mx-auto max-w-5xl">
          <FadeIn className="mb-14">
            <div className="flex items-center gap-3 mb-4">
              <span className="bp-callout">05</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Tolerance Grades
              </span>
            </div>
            <h2 className="font-display text-5xl md:text-6xl leading-[0.95] max-w-3xl">
              Pick a grade. <span>Flat rate,</span> no surprises.
            </h2>
          </FadeIn>

          <div className="grid sm:grid-cols-3 gap-px bg-border border border-border">
            {[
              {
                grade: 'G1',
                name: 'Starter',
                price: '$49',
                period: '/mo',
                desc: 'One line, getting started',
                features: ['2 processes', '1 user', 'SPC charts', 'Kanban board', 'Email alerts'],
                planSlug: 'starter',
              },
              {
                grade: 'G2',
                name: 'Professional',
                price: '$149',
                period: '/mo',
                desc: 'Multi-line shops, full quality stack',
                features: ['Unlimited processes', '10 users', 'OEE & Downtime', 'PFMEA & 8D', '5S Audits', 'Taskmaster AI', 'Priority support'],
                highlight: true,
                planSlug: 'professional',
              },
              {
                grade: 'G3',
                name: 'Enterprise',
                price: 'Custom',
                period: '',
                desc: 'Multiple facilities, custom needs',
                features: ['Everything in Pro', 'Unlimited users', 'SSO & RBAC', 'API access', 'Dedicated CSM'],
                planSlug: 'enterprise',
              },
            ].map((plan, i) => (
              <FadeIn key={plan.name} delay={i * 0.08}>
                <div className={`relative h-full flex flex-col p-6 ${plan.highlight ? 'bg-card' : 'bg-background'}`}>
                  {/* grade tag in corner */}
                  <div className="flex items-start justify-between mb-6">
                    <span className={`inline-flex h-8 w-8 items-center justify-center font-mono text-xs font-bold ${
                      plan.highlight ? 'bg-primary text-primary-foreground' : 'bg-secondary border border-border'
                    }`}>
                      {plan.grade}
                    </span>
                    {plan.highlight && (
                      <span className="font-mono text-[9px] uppercase tracking-[0.2em] bg-accent/20 text-accent border border-accent/40 px-2 py-0.5">
                        Recommended
                      </span>
                    )}
                  </div>

                  <h3 className="font-display text-3xl leading-none mb-1">{plan.name}</h3>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-5">
                    {plan.desc}
                  </p>

                  <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-dashed border-border">
                    <span className="font-display text-5xl">{plan.price}</span>
                    <span className="font-mono text-sm text-muted-foreground">{plan.period}</span>
                  </div>

                  <ul className="space-y-2.5 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <Check className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    to={`/checkout/${plan.planSlug}`}
                    className={`mt-8 flex items-center justify-center gap-2 px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
                      plan.highlight
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'border border-border text-foreground hover:bg-secondary'
                    }`}
                  >
                    Get started
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>

                  {/* corner part number */}
                  <span className="absolute top-2 right-2 font-mono text-[9px] text-muted-foreground/50">
                    #{String(i + 1).padStart(3, '0')}
                  </span>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="relative px-4 sm:px-6 py-24 border-t border-border overflow-hidden">
        <div className="absolute inset-0 bp-grid pointer-events-none opacity-40" />
        <FadeIn className="relative mx-auto max-w-3xl text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px w-12 bg-border" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">End Of Sheet</span>
            <div className="h-px w-12 bg-border" />
          </div>
          <h2 className="font-display text-5xl md:text-7xl leading-[0.95]">
            Your processes deserve better <span className="text-primary">than a spreadsheet.</span>
          </h2>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground mt-8 mb-8">
            Hundreds of manufacturers have. What are you waiting for?
          </p>
          <Link
            to="/dashboard"
            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground font-mono text-sm font-bold uppercase tracking-[0.15em] hover:bg-primary/90 transition-colors"
          >
            <span className="absolute -top-1 -left-1 h-2 w-2 border-t border-l border-primary-foreground" />
            <span className="absolute -bottom-1 -right-1 h-2 w-2 border-b border-r border-primary-foreground" />
            Start Free Trial
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </FadeIn>
      </section>

      {/* ═══ FOOTER — Drawing stamp ═══ */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
          <div className="grid md:grid-cols-12 gap-6 items-end">
            <div className="md:col-span-4">
              <Link to="/" className="flex items-center gap-2.5 mb-3">
                <OpsPilotLogo size={28} showDot={false} />
                <span className="text-base font-bold tracking-tight">OpsPilot<span className="text-primary">.</span></span>
              </Link>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Drawing OPS-2026-A · Rev 07
              </p>
              <p className="text-xs text-muted-foreground mt-4 max-w-xs leading-relaxed">
                Built for manufacturers who think in millimeters, microns, and tolerances — not tabs and spreadsheets.
              </p>
            </div>
            <div className="md:col-span-5">
              <div className="bp-title-block">
                <div className="tb-row grid grid-cols-4">
                  <div>
                    <div className="label">Drawn</div>
                    <div className="value">OPS TEAM</div>
                  </div>
                  <div>
                    <div className="label">Checked</div>
                    <div className="value text-primary">✓ J.D.</div>
                  </div>
                  <div>
                    <div className="label">Date</div>
                    <div className="value">2026-04</div>
                  </div>
                  <ThemeToggle variant="spec" />
                </div>
                <div className="tb-row flex justify-between items-center">
                  <span className="label !mb-0">All dimensions in mm unless noted</span>
                  <span className="value">© 2026</span>
                </div>
              </div>
            </div>
            <div className="md:col-span-3 text-right">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Sheet <span className="text-foreground">06</span> of <span className="text-foreground">06</span>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
