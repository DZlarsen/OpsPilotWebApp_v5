import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, Area, AreaChart, XAxis, YAxis, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import {
  Brain, Activity, AlertTriangle, CheckCircle, TrendingUp, TrendingDown,
  Zap, Shield, BarChart3, Clock, ArrowRight, Lightbulb, Target,
  FileText, Wrench, Eye, ChevronRight, Cpu, Radio, Sparkles, Download,
  Filter, LayoutGrid, List, Check, X,
} from 'lucide-react';

// ── 6-hour data loop (4320 ticks at 5s each = 6 hours) ──
const TOTAL_TICKS = 4320;
const TICK_INTERVAL = 1000;
const PRE_SEED_TICK = 120;

interface SPCPoint {
  timestamp: number;
  value: number;
  ucl: number;
  lcl: number;
  mean: number;
  outOfControl: boolean;
}

interface AIEvent {
  id: string;
  tick: number;
  type: 'drift-detected' | 'limit-adjusted' | 'anomaly-flagged' | 'root-cause' | 'doc-generated' | 'action-recommended' | 'alert-suppressed' | 'cpk-recalculated';
  severity: 'info' | 'warning' | 'critical' | 'success';
  title: string;
  description: string;
  process: string;
  confidence?: number;
}

function generateEventTimeline(processNames: string[]): AIEvent[] {
  const events: AIEvent[] = [];
  const templates = [
    { type: 'drift-detected' as const, severity: 'warning' as const, title: 'Process drift detected', desc: (p: string) => `Mean shift of +0.${Math.floor(Math.random()*9+1)}σ detected on ${p}. Trending toward UCL.`, conf: 92 },
    { type: 'limit-adjusted' as const, severity: 'success' as const, title: 'Control limits auto-adjusted', desc: (p: string) => `UCL/LCL recalculated for ${p} based on last 100 data points. Cpk improved.`, conf: 98 },
    { type: 'anomaly-flagged' as const, severity: 'critical' as const, title: 'Anomaly flagged', desc: (p: string) => `Unusual variance pattern on ${p}. 3 consecutive points in Zone B — Western Electric rule triggered.`, conf: 87 },
    { type: 'root-cause' as const, severity: 'info' as const, title: 'Root cause analysis complete', desc: (p: string) => `AI identified ambient temperature correlation (r²=0.84) as primary driver for ${p} variation.`, conf: 84 },
    { type: 'doc-generated' as const, severity: 'success' as const, title: 'Document auto-formatted', desc: (p: string) => `SOP for ${p} auto-updated with latest tolerance specs and control parameters.`, conf: 99 },
    { type: 'action-recommended' as const, severity: 'warning' as const, title: 'Corrective action recommended', desc: (p: string) => `Recommend tool recalibration on ${p} within next 2 hours. Predicted Cpk drop to 1.12.`, conf: 91 },
    { type: 'alert-suppressed' as const, severity: 'info' as const, title: 'Alert noise suppressed', desc: (p: string) => `Suppressed 4 low-impact alerts from ${p}. Shift change pattern identified as benign.`, conf: 96 },
    { type: 'cpk-recalculated' as const, severity: 'success' as const, title: 'Cpk auto-recalculated', desc: (p: string) => `Real-time Cpk for ${p} updated: 1.67 → 1.72. Process capability improving.`, conf: 99 },
    { type: 'drift-detected' as const, severity: 'warning' as const, title: 'Supplier variance flagged', desc: (p: string) => `Incoming material lot variance on ${p} is 2.1x historical average. Recommend incoming inspection.`, conf: 88 },
    { type: 'root-cause' as const, severity: 'info' as const, title: 'Cross-shift pattern found', desc: (p: string) => `Shift B consistently produces +0.003mm offset on ${p}. Training recommendation generated.`, conf: 79 },
    { type: 'action-recommended' as const, severity: 'critical' as const, title: 'Preventive maintenance due', desc: (p: string) => `Vibration signature on ${p} matches bearing wear pattern. Schedule PM within 24 hours.`, conf: 94 },
    { type: 'limit-adjusted' as const, severity: 'success' as const, title: 'Smart baseline updated', desc: (p: string) => `Environmental compensation applied to ${p}. Temperature-adjusted limits now active.`, conf: 97 },
  ];

  for (let i = 0; i < 150; i++) {
    const tick = Math.floor((i / 150) * TOTAL_TICKS) + Math.floor(Math.random() * 20);
    const tmpl = templates[i % templates.length];
    const proc = processNames[i % processNames.length];
    events.push({
      id: `evt-${i}`,
      tick: Math.min(tick, TOTAL_TICKS - 1),
      type: tmpl.type,
      severity: tmpl.severity,
      title: tmpl.title,
      description: tmpl.desc(proc),
      process: proc,
      confidence: tmpl.conf + Math.floor(Math.random() * 5 - 2),
    });
  }

  return events.sort((a, b) => a.tick - b.tick);
}

function generateSPCData(tick: number, seed: number): SPCPoint {
  const baseMean = 25.0;
  const baseStd = 0.15;
  const drift = Math.sin((tick + seed * 100) / 400) * 0.08;
  const spike = (tick % 173 === 0) ? (Math.random() > 0.5 ? 0.4 : -0.3) : 0;
  const noise = (Math.random() - 0.5) * baseStd * 2;
  const value = baseMean + drift + spike + noise;
  const mean = baseMean + drift * 0.3;
  const ucl = mean + 3 * baseStd;
  const lcl = mean - 3 * baseStd;

  return {
    timestamp: tick,
    value: parseFloat(value.toFixed(4)),
    ucl: parseFloat(ucl.toFixed(4)),
    lcl: parseFloat(lcl.toFixed(4)),
    mean: parseFloat(mean.toFixed(4)),
    outOfControl: value > ucl || value < lcl,
  };
}

const severityConfig = {
  info:     { color: 'text-chart-blue',       bg: 'bg-chart-blue/10',       border: 'border-chart-blue/30',       icon: Lightbulb },
  warning:  { color: 'text-status-warning',   bg: 'bg-status-warning/10',   border: 'border-status-warning/40',   icon: AlertTriangle },
  critical: { color: 'text-status-critical',  bg: 'bg-status-critical/10',  border: 'border-status-critical/40',  icon: Zap },
  success:  { color: 'text-status-ok',        bg: 'bg-status-ok/10',        border: 'border-status-ok/40',        icon: CheckCircle },
};

const typeIcons: Record<string, typeof Brain> = {
  'drift-detected': TrendingUp,
  'limit-adjusted': Target,
  'anomaly-flagged': AlertTriangle,
  'root-cause': Brain,
  'doc-generated': FileText,
  'action-recommended': Wrench,
  'alert-suppressed': Shield,
  'cpk-recalculated': BarChart3,
};

// AI Console messages — exported for use on landing page
export const aiConsoleMessages = [
  'Detected 3σ drift on CNC Line 2 → auto-adjusted control limits',
  'Correlated humidity spike with coating defects (r²=0.91)',
  'Suppressed 12 benign shift-change alerts — pattern classified as normal',
  'Predicted bearing wear on Line 4 — PM scheduled in 18h',
  'Cross-validated root cause: ambient temp → shaft diameter drift',
  'Updated PFMEA RPN scores based on last 500 data points',
  'Shift B training gap identified — recommendation queued',
  'Recalculated Cpk for 6 processes — all above 1.33 threshold',
  'Material lot #2847 flagged — incoming variance 2.4x historical avg',
  'Auto-generated SOP update for heat treatment parameters',
];

// ─── Process Health Matrix ───
function ProcessHealthMatrix({ processes, tick, onSelectProcess, selectedProcess }: {
  processes: { name: string; cpk: number; status: 'ok' | 'warning' | 'critical'; sparkline: number[] }[];
  tick: number;
  onSelectProcess: (name: string | null) => void;
  selectedProcess: string | null;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
      {processes.map((proc) => {
        const isSelected = selectedProcess === proc.name;
        const statusColors = {
          ok: 'border-status-ok/30 hover:border-status-ok/60',
          warning: 'border-status-warning/30 hover:border-status-warning/60',
          critical: 'border-status-critical/30 hover:border-status-critical/60',
        };
        const statusDot = {
          ok: 'bg-status-ok',
          warning: 'bg-status-warning',
          critical: 'bg-status-critical',
        };
        const sparkPath = proc.sparkline.length > 2 ? proc.sparkline.map((v, i) => {
          const x = (i / (proc.sparkline.length - 1)) * 60;
          const min = Math.min(...proc.sparkline);
          const max = Math.max(...proc.sparkline);
          const range = max - min || 1;
          const y = 20 - ((v - min) / range) * 18;
          return `${i === 0 ? 'M' : 'L'}${x},${y}`;
        }).join(' ') : '';

        return (
          <motion.div
            key={proc.name}
            onClick={() => onSelectProcess(isSelected ? null : proc.name)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`relative p-3 rounded-lg border cursor-pointer transition-all duration-200 ${statusColors[proc.status]} ${
              isSelected ? 'ring-1 ring-primary bg-primary/5 border-primary/40' : 'bg-card/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className={`h-2 w-2 rounded-full ${statusDot[proc.status]} ${proc.status === 'critical' ? 'animate-pulse' : ''}`} />
              <span className="text-[9px] font-mono font-bold text-muted-foreground">Cpk {proc.cpk.toFixed(2)}</span>
            </div>
            <p className="text-[10px] font-semibold truncate mb-1.5">{proc.name}</p>
            <svg viewBox="0 0 60 22" className="w-full h-4" preserveAspectRatio="none">
              {sparkPath && <path d={sparkPath} fill="none" stroke={`hsl(var(--${proc.status === 'ok' ? 'status-ok' : proc.status === 'warning' ? 'status-warning' : 'status-critical'}))`} strokeWidth="1.2" />}
            </svg>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TaskmasterInbox — pending items requiring operator review.
   Picks the 3 most recent high-priority events (critical or warning) and
   presents them as triage cards with Accept / Needs Review / Dismiss.
   Items dismissed/accepted locally disappear from the inbox (no backend).
   ═══════════════════════════════════════════════════════════════════ */
function TaskmasterInbox({ events, tick, onReview }: { events: AIEvent[]; tick: number; onReview: (event: AIEvent) => void }) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [accepted, setAccepted] = useState<Set<string>>(new Set());

  // Take 3 most recent events (tick <= current) that are critical or warning and not yet resolved
  const pending = useMemo(() => {
    const candidates = events
      .filter(e => e.tick <= tick && (e.severity === 'critical' || e.severity === 'warning'))
      .filter(e => !dismissed.has(e.id) && !accepted.has(e.id))
      .sort((a, b) => b.tick - a.tick)
      .slice(0, 3);
    return candidates;
  }, [events, tick, dismissed, accepted]);

  const actionHint = (type: AIEvent['type']): string => {
    switch (type) {
      case 'drift-detected':       return 'Confirm drift and open PM ticket';
      case 'anomaly-flagged':      return 'Review last 10 samples on SPC chart';
      case 'action-recommended':   return 'Schedule the recommended action';
      case 'alert-suppressed':     return 'Review suppression reason';
      case 'root-cause':           return 'Open root-cause detail';
      default:                     return 'Review recommendation';
    }
  };

  // Convert tick age → elapsed string
  const timeAgo = (eventTick: number) => {
    const delta = Math.max(0, tick - eventTick);
    if (delta < 12)  return 'just now';
    if (delta < 60)  return `${Math.floor(delta / 12) * 5}m ago`;
    if (delta < 720) return `${Math.floor(delta / 720 * 12)}h ago`;
    return `${Math.floor(delta / 720)}h ago`;
  };

  return (
    <div className="border border-border bg-card">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <span className="page-callout">02</span>
          <div>
            <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-foreground">Inbox</h2>
            <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground mt-0.5">
              {pending.length} item{pending.length !== 1 ? 's' : ''} pending review
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>Accepted <span className="text-status-ok tabular-nums">{accepted.size}</span></span>
          <span className="text-muted-foreground/40">·</span>
          <span>Dismissed <span className="text-foreground tabular-nums">{dismissed.size}</span></span>
        </div>
      </div>

      {pending.length === 0 ? (
        <div className="px-5 py-12 flex flex-col items-center text-center">
          <CheckCircle className="h-8 w-8 text-status-ok/60 mb-3" strokeWidth={1.5} />
          <p className="text-sm font-semibold">Inbox clear</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-1">
            Nothing needs your review right now.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {pending.map(item => {
            const sev = severityConfig[item.severity];
            const TypeIcon = typeIcons[item.type] || Brain;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-5 py-4 grid grid-cols-[auto_1fr_auto] gap-4 items-start hover:bg-secondary/20 transition-colors"
              >
                {/* Icon + severity */}
                <div className="flex flex-col items-center gap-1.5 pt-0.5">
                  <div className={`flex h-9 w-9 items-center justify-center border ${sev.border ?? 'border-border'} ${sev.bg}`}>
                    <TypeIcon className={`h-4 w-4 ${sev.color}`} strokeWidth={1.75} />
                  </div>
                  <span className={`status-badge-${item.severity === 'critical' ? 'critical' : item.severity === 'warning' ? 'warning' : 'ok'}`}>
                    {item.severity}
                  </span>
                </div>

                {/* Content */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold">{item.title}</h3>
                    <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                      · {item.process} · {timeAgo(item.tick)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {item.description}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary mt-2">
                    → {actionHint(item.type)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1.5 items-stretch min-w-[120px]">
                  <button
                    onClick={() => setAccepted(prev => new Set(prev).add(item.id))}
                    className="inline-flex items-center justify-center gap-1.5 px-3 h-8 bg-primary text-primary-foreground font-mono text-[10px] font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors"
                    style={{ borderRadius: 'var(--radius)' }}
                  >
                    <Check className="h-3 w-3" strokeWidth={2.5} />
                    Accept
                  </button>
                  <button
                    onClick={() => onReview(item)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 h-8 border border-border bg-secondary/30 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    style={{ borderRadius: 'var(--radius)' }}
                  >
                    Review
                  </button>
                  <button
                    onClick={() => setDismissed(prev => new Set(prev).add(item.id))}
                    className="inline-flex items-center justify-center gap-1.5 px-3 h-8 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 hover:text-destructive transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="px-5 py-2.5 border-t border-border bg-background/40 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
        <span>Auto-refreshing · Items appear as Taskmaster detects them</span>
        <button
          onClick={() => { setDismissed(new Set()); setAccepted(new Set()); }}
          className="hover:text-foreground transition-colors disabled:opacity-40"
          disabled={dismissed.size === 0 && accepted.size === 0}
        >
          Reset triage
        </button>
      </div>
    </div>
  );
}

// Small additional helper: severity border class mapping (used by inbox icon)
// The severityConfig above already exposes .color / .bg / .border.

export default function Taskmaster() {
  const { processes, activeBusiness } = useBusiness();
  const processNames = processes.map(p => p.name.split('—')[0].trim());
  const [tick, setTick] = useState(PRE_SEED_TICK);
  const [events] = useState(() => generateEventTimeline(processNames));
  const [visibleEvents, setVisibleEvents] = useState<AIEvent[]>([]);
  const [spcHistory, setSpcHistory] = useState<SPCPoint[]>([]);
  const [liveMetrics, setLiveMetrics] = useState({ cpk: 1.54, oocRate: 1.2, alertsHandled: 0, docsGenerated: 0, driftsCaught: 0, actionsRecommended: 0 });
  const feedRef = useRef<HTMLDivElement>(null);
  const [selectedEvent, setSelectedEvent] = useState<AIEvent | null>(null);
  const [activePlot, setActivePlot] = useState<'spc' | 'range' | 'throughput' | 'histogram' | 'defects'>('spc');
  const hasSeeded = useRef(false);
  const [selectedProcess, setSelectedProcess] = useState<string | null>(null);
  const [feedView, setFeedView] = useState<'stream' | 'grouped'>('stream');
  const [feedFilter, setFeedFilter] = useState<string | null>(null);

  // Slow tick for histogram, defects, and heatmap — updates every 10 seconds
  const slowTick = Math.floor(tick / 10);

  // Pre-seed
  useEffect(() => {
    if (hasSeeded.current) return;
    hasSeeded.current = true;

    const history: SPCPoint[] = [];
    for (let t = 0; t < PRE_SEED_TICK; t++) {
      history.push(generateSPCData(t, 42));
    }
    setSpcHistory(history.slice(-60));

    const pastEvents = events.filter(e => e.tick <= PRE_SEED_TICK);
    setVisibleEvents(pastEvents.reverse().slice(0, 30));

    let m = { cpk: 1.54, oocRate: 1.2, alertsHandled: 0, docsGenerated: 0, driftsCaught: 0, actionsRecommended: 0 };
    pastEvents.forEach(e => {
      if (e.type === 'cpk-recalculated') m.cpk = parseFloat((1.4 + Math.random() * 0.5).toFixed(2));
      if (e.type === 'anomaly-flagged' || e.type === 'drift-detected') m.driftsCaught++;
      if (e.type === 'doc-generated') m.docsGenerated++;
      if (e.type === 'action-recommended') m.actionsRecommended++;
      if (e.type === 'alert-suppressed') m.alertsHandled += 4;
      m.oocRate = parseFloat((0.5 + Math.random() * 2).toFixed(1));
    });
    setLiveMetrics(m);
  }, [events]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(prev => (prev + 1) % TOTAL_TICKS);
    }, TICK_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const newPoint = generateSPCData(tick, 42);
    setSpcHistory(prev => {
      const next = [...prev, newPoint];
      return next.length > 60 ? next.slice(-60) : next;
    });

    const tickEvents = events.filter(e => e.tick === tick);
    if (tickEvents.length > 0) {
      setVisibleEvents(prev => [...tickEvents, ...prev].slice(0, 50));
      setLiveMetrics(prev => {
        let m = { ...prev };
        tickEvents.forEach(e => {
          if (e.type === 'cpk-recalculated') m.cpk = parseFloat((1.4 + Math.random() * 0.5).toFixed(2));
          if (e.type === 'anomaly-flagged' || e.type === 'drift-detected') m.driftsCaught++;
          if (e.type === 'doc-generated') m.docsGenerated++;
          if (e.type === 'action-recommended') m.actionsRecommended++;
          if (e.type === 'alert-suppressed') m.alertsHandled += 4;
          m.oocRate = parseFloat((0.5 + Math.random() * 2).toFixed(1));
        });
        return m;
      });
    }
  }, [tick, events]);

  const downloadLog = useCallback(() => {
    const logLines = [
      'Taskmaster AI Event Log',
      `Generated: ${new Date().toISOString()}`,
      `Total Events: ${visibleEvents.length}`,
      '---',
      'Timestamp | Severity | Type | Process | Title | Description | Confidence',
      ...visibleEvents.map(e => {
        const h = Math.floor(e.tick / 3600);
        const m = Math.floor((e.tick % 3600) / 60);
        const s = e.tick % 60;
        const ts = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        return `${ts} | ${e.severity.toUpperCase()} | ${e.type} | ${e.process} | ${e.title} | ${e.description} | ${e.confidence ?? '-'}%`;
      })
    ];
    const blob = new Blob([logLines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taskmaster-log-${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [visibleEvents]);

  const totalSeconds = tick;
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const timeStr = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // Sparkline paths for main SPC chart
  const sparklinePath = spcHistory.length > 2 ? spcHistory.map((p, i) => {
    const x = (i / (spcHistory.length - 1)) * 200;
    const y = 40 - ((p.value - (p.mean - 0.5)) / 1.0) * 40;
    return `${i === 0 ? 'M' : 'L'}${x},${Math.max(0, Math.min(80, y))}`;
  }).join(' ') : '';

  const uclPath = spcHistory.length > 2 ? spcHistory.map((p, i) => {
    const x = (i / (spcHistory.length - 1)) * 200;
    const y = 40 - ((p.ucl - (p.mean - 0.5)) / 1.0) * 40;
    return `${i === 0 ? 'M' : 'L'}${x},${Math.max(0, Math.min(80, y))}`;
  }).join(' ') : '';

  const lclPath = spcHistory.length > 2 ? spcHistory.map((p, i) => {
    const x = (i / (spcHistory.length - 1)) * 200;
    const y = 40 - ((p.lcl - (p.mean - 0.5)) / 1.0) * 40;
    return `${i === 0 ? 'M' : 'L'}${x},${Math.max(0, Math.min(80, y))}`;
  }).join(' ') : '';

  const latestPoint = spcHistory[spcHistory.length - 1];

  // Process health matrix data
  const healthData = useMemo(() => {
    return processNames.map((name, i) => {
      const baseCpk = 1.2 + (i * 0.15) % 0.6;
      const cpk = baseCpk + Math.sin(slowTick * 0.1 + i) * 0.1;
      const status: 'ok' | 'warning' | 'critical' = cpk >= 1.33 ? 'ok' : cpk >= 1.0 ? 'warning' : 'critical';
      const sparkline = Array.from({ length: 15 }, (_, j) => baseCpk + Math.sin((slowTick - 15 + j) * 0.3 + i) * 0.15 + (Math.random() - 0.5) * 0.05);
      return { name, cpk, status, sparkline };
    });
  }, [processNames, slowTick]);

  // Filtered events for feed
  const filteredEvents = useMemo(() => {
    let evts = visibleEvents;
    if (selectedProcess) {
      evts = evts.filter(e => e.process === selectedProcess);
    }
    if (feedFilter) {
      evts = evts.filter(e => e.severity === feedFilter);
    }
    return evts;
  }, [visibleEvents, selectedProcess, feedFilter]);

  // Grouped events
  const groupedEvents = useMemo(() => {
    const groups: Record<string, { events: AIEvent[]; count: number }> = {};
    filteredEvents.forEach(e => {
      const key = e.process;
      if (!groups[key]) groups[key] = { events: [], count: 0 };
      groups[key].events.push(e);
      groups[key].count++;
    });
    return Object.entries(groups).sort((a, b) => b[1].count - a[1].count);
  }, [filteredEvents]);

  // Severity counts for mini donut
  const severityCounts = useMemo(() => {
    const counts = { info: 0, warning: 0, critical: 0, success: 0 };
    filteredEvents.forEach(e => counts[e.severity]++);
    return counts;
  }, [filteredEvents]);

  const totalSevCount = Object.values(severityCounts).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="taskmaster-page space-y-5">
      {/* ═══ Header — morning-brief framing, not theatrical ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative border border-border bg-card"
      >
        {/* corner ticks */}
        <span className="absolute -top-px -left-px h-3 w-3 border-t-2 border-l-2 border-primary" />
        <span className="absolute -bottom-px -right-px h-3 w-3 border-b-2 border-r-2 border-primary" />

        <div className="px-6 py-5 border-b border-border/60">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="flex h-10 w-10 items-center justify-center border border-primary/40 bg-primary/5">
                <Brain className="h-5 w-5 text-primary" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="page-title text-2xl sm:text-3xl">Taskmaster</h1>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {activeBusiness.name}
                  </span>
                </div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-2">
                  Operational brief · {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · Shift · Day
                </p>
                <p className="text-sm text-foreground/85 mt-3 max-w-2xl leading-relaxed">
                  While you were away, I watched{' '}
                  <span className="font-semibold text-foreground">{healthData.length} processes</span>, flagged{' '}
                  <span className="font-semibold text-accent">{liveMetrics.driftsCaught} drifts</span>, and suppressed{' '}
                  <span className="font-semibold text-foreground">{Math.floor(liveMetrics.driftsCaught * 2.4)} noise alerts</span>. Three items need your review.
                </p>
              </div>
            </div>

            {/* Compact status column */}
            <div className="flex flex-col items-end gap-2 font-mono text-[10px] uppercase tracking-[0.15em]">
              <span className="flex items-center gap-1.5 text-status-ok">
                <span className="h-1.5 w-1.5 rounded-full bg-status-ok bp-blink" />
                Engine · Online
              </span>
              <span className="text-muted-foreground">
                Latency <span className="text-foreground tabular-nums">12ms</span>
              </span>
              <span className="text-muted-foreground">
                Uptime <span className="text-foreground tabular-nums">99.97%</span>
              </span>
              <span className="text-muted-foreground">
                Cycle <span className="text-foreground tabular-nums">{timeStr}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Bottom stat strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border">
          {[
            { label: 'Processes Watched',  value: healthData.length },
            { label: 'Drifts Caught · 24h', value: liveMetrics.driftsCaught },
            { label: 'Alerts Suppressed',  value: Math.floor(liveMetrics.driftsCaught * 2.4) },
            { label: 'Cpk (live avg)',     value: liveMetrics.cpk.toFixed(2) },
          ].map(s => (
            <div key={s.label} className="bg-card px-4 py-3">
              <p className="bp-tile-label">{s.label}</p>
              <p className="bp-tile-value text-xl mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ═══ Inbox — pending items requiring operator triage ═══ */}
      <TaskmasterInbox events={events} tick={tick} onReview={setSelectedEvent} />

      {/* ═══ Process Health Matrix ═══ */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Process Health Matrix</h2>
            {selectedProcess && (
              <span className="bp-chip bp-chip-primary">
                Filter · {selectedProcess}
                <button onClick={() => setSelectedProcess(null)} className="ml-1 text-muted-foreground hover:text-foreground">✕</button>
              </span>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">
            {healthData.filter(p => p.status === 'ok').length}/{healthData.length} stable
          </span>
        </div>
        <ProcessHealthMatrix
          processes={healthData}
          tick={tick}
          onSelectProcess={setSelectedProcess}
          selectedProcess={selectedProcess}
        />
      </div>

      {/* ═══ Main Content: Charts + Event Feed ═══ */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Analytics Panel — clean SPC trace + live context strip */}
        <div className="lg:col-span-3 border border-border bg-card relative">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
              <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-foreground">
                Control Chart · Live
              </h3>
            </div>
            <span className={`bp-chip ${latestPoint?.outOfControl ? 'text-status-critical border-status-critical/40 bg-status-critical/10' : 'text-status-ok border-status-ok/40 bg-status-ok/10'}`}>
              {latestPoint?.outOfControl ? 'Out of control' : 'In control'}
            </span>
          </div>

          {/* Main SPC chart */}
          <div className="px-4 pt-4 pb-2">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spcHistory.slice(-120)} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="spcFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="timestamp" hide />
                  <YAxis domain={['dataMin - 0.3', 'dataMax + 0.3']} hide />
                  <ReferenceLine y={latestPoint?.ucl} stroke="hsl(var(--status-critical))" strokeDasharray="3 3" strokeWidth={1} opacity={0.6} />
                  <ReferenceLine y={latestPoint?.lcl} stroke="hsl(var(--status-critical))" strokeDasharray="3 3" strokeWidth={1} opacity={0.6} />
                  <ReferenceLine y={latestPoint?.mean} stroke="hsl(var(--muted-foreground))" strokeDasharray="1 3" strokeWidth={1} opacity={0.4} />
                  <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={1.5} fill="url(#spcFill)" isAnimationActive={false} dot={(props: any) => {
                    const { cx, cy, index, payload } = props;
                    if (payload.outOfControl) return <circle key={index} cx={cx} cy={cy} r={3} fill="hsl(var(--status-critical))" stroke="hsl(var(--background))" strokeWidth={1.5} />;
                    return <g key={index} />;
                  }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {/* Live value ticker along the bottom */}
            {latestPoint && (
              <div className="flex items-center justify-between text-xs pt-2 border-t border-border/60 mt-2">
                <div className="flex items-center gap-4 font-mono">
                  <span><span className="text-muted-foreground text-[10px] uppercase tracking-wider mr-1">Value</span><span className="text-foreground font-bold tabular-nums">{latestPoint.value}</span></span>
                  <span className="text-muted-foreground/40">·</span>
                  <span><span className="text-muted-foreground text-[10px] uppercase tracking-wider mr-1">μ</span><span className="tabular-nums">{latestPoint.mean}</span></span>
                  <span className="text-muted-foreground/40">·</span>
                  <span><span className="text-muted-foreground text-[10px] uppercase tracking-wider mr-1">UCL</span><span className="tabular-nums">{latestPoint.ucl}</span></span>
                  <span><span className="text-muted-foreground text-[10px] uppercase tracking-wider mr-1">LCL</span><span className="tabular-nums">{latestPoint.lcl}</span></span>
                </div>
              </div>
            )}
          </div>

          {/* Live context strip — three sub-panels with real info */}
          <div className="grid grid-cols-3 gap-px bg-border border-t border-border">
            {/* Capability summary */}
            <div className="bg-card px-4 py-3">
              <p className="bp-tile-label">Capability · Cpk</p>
              <p className="bp-tile-value text-2xl mt-1">{liveMetrics.cpk.toFixed(2)}</p>
              <p className="font-mono text-[10px] mt-1 text-muted-foreground">
                {liveMetrics.cpk >= 1.67 ? (
                  <span className="text-status-ok">Excellent · {'≥'}1.67</span>
                ) : liveMetrics.cpk >= 1.33 ? (
                  <span className="text-status-ok">Capable · {'≥'}1.33</span>
                ) : (
                  <span className="text-status-warning">Marginal · {'<'}1.33</span>
                )}
              </p>
            </div>

            {/* Recent violations */}
            <div className="bg-card px-4 py-3">
              <p className="bp-tile-label">Violations · Last Hr</p>
              <p className="bp-tile-value text-2xl mt-1">
                {spcHistory.slice(-60).filter(p => p.outOfControl).length}
              </p>
              <p className="font-mono text-[10px] mt-1 text-muted-foreground">
                of <span className="text-foreground tabular-nums">{Math.min(60, spcHistory.length)}</span> samples
              </p>
            </div>

            {/* Pattern / interpretation */}
            <div className="bg-card px-4 py-3">
              <p className="bp-tile-label">Pattern</p>
              <p className="text-sm font-semibold mt-1">
                {(() => {
                  const recent = spcHistory.slice(-10);
                  if (recent.length < 5) return 'Warming up';
                  const viols = recent.filter(p => p.outOfControl).length;
                  if (viols >= 2) return 'Unstable';
                  const trend = recent[recent.length - 1].value - recent[0].value;
                  if (Math.abs(trend) < 0.05) return 'Stable';
                  return trend > 0 ? 'Trending up' : 'Trending down';
                })()}
              </p>
              <p className="font-mono text-[10px] mt-1 text-muted-foreground">
                Auto-classified by Taskmaster
              </p>
            </div>
          </div>

          {/* Background activity row */}
          <div className="flex gap-1.5 px-4 py-3 flex-wrap border-t border-border">
            {[
              { label: 'Auto-limit adjustment', active: tick % 30 < 15 },
              { label: 'Drift monitoring', active: true },
              { label: 'Pattern recognition', active: tick % 50 < 35 },
              { label: 'Anomaly detection', active: true },
            ].map(action => (
              <span key={action.label} className={`inline-flex items-center gap-1.5 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider border transition-all duration-500 ${
                action.active ? 'border-primary/40 bg-primary/5 text-primary' : 'border-border bg-secondary/40 text-muted-foreground/60'
              }`} style={{ borderRadius: '2px' }}>
                <span className={`h-1 w-1 ${action.active ? 'bg-primary bp-blink' : 'bg-muted-foreground/30'}`} style={{ borderRadius: '50%' }} />
                {action.label}
              </span>
            ))}
          </div>
        </div>


        {/* ═══ Enhanced Event Feed ═══ */}
        <div className="lg:col-span-2 kpi-card p-5 flex flex-col max-h-[500px]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-primary animate-pulse" />
              <h3 className="text-sm font-semibold">AI Activity Feed</h3>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setFeedView(feedView === 'stream' ? 'grouped' : 'stream')} className="p-1 rounded hover:bg-secondary/50 transition-colors" title={feedView === 'stream' ? 'Switch to grouped view' : 'Switch to stream view'}>
                {feedView === 'stream' ? <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground" /> : <List className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>
              <button onClick={downloadLog} title="Download event log" className="p-1 rounded hover:bg-secondary/50 transition-colors">
                <Download className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          </div>

          {/* Severity breakdown mini donut + filter chips */}
          <div className="flex items-center gap-3 mb-3">
            {/* Mini donut */}
            <svg viewBox="0 0 24 24" className="h-8 w-8 flex-shrink-0">
              {(() => {
                const radius = 9;
                const circumference = 2 * Math.PI * radius;
                let offset = 0;
                const colors = { critical: '--status-critical', warning: '--status-warning', info: '--chart-blue', success: '--status-ok' };
                return (['critical', 'warning', 'info', 'success'] as const).map(sev => {
                  const pct = severityCounts[sev] / totalSevCount;
                  const dashLength = circumference * pct;
                  const el = (
                    <circle
                      key={sev}
                      cx="12" cy="12" r={radius}
                      fill="none"
                      stroke={`hsl(var(${colors[sev]}))`}
                      strokeWidth="3"
                      strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                      strokeDashoffset={-offset}
                      transform="rotate(-90 12 12)"
                      opacity="0.8"
                    />
                  );
                  offset += dashLength;
                  return el;
                });
              })()}
            </svg>

            {/* Filter chips */}
            <div className="flex flex-wrap gap-1">
              {(['critical', 'warning', 'info', 'success'] as const).map(sev => {
                const s = severityConfig[sev];
                const isActive = feedFilter === sev;
                return (
                  <button
                    key={sev}
                    onClick={() => setFeedFilter(isActive ? null : sev)}
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] border transition-colors ${
                      isActive ? `${s.bg} ${s.color} ${s.border}` : 'border-border bg-secondary/40 text-muted-foreground hover:text-foreground'
                    }`}
                    style={{ borderRadius: '2px' }}
                  >
                    {sev} · {severityCounts[sev]}
                  </button>
                );
              })}
            </div>
          </div>

          <div ref={feedRef} className="flex-1 overflow-y-auto space-y-2 pr-1">
            {feedView === 'stream' ? (
              <AnimatePresence initial={false}>
                {filteredEvents.slice(0, 20).map((event) => {
                  const sev = severityConfig[event.severity];
                  const TypeIcon = typeIcons[event.type] || Brain;
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: 20, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: 'auto' }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      onClick={() => setSelectedEvent(event)}
                      className={`rounded-lg border border-border/50 p-3 cursor-pointer hover:border-primary/30 transition-colors ${sev.bg}`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-md ${sev.bg} flex-shrink-0`}>
                          <TypeIcon className={`h-3.5 w-3.5 ${sev.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate">{event.title}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{event.description}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[9px] text-muted-foreground font-mono">{event.process}</span>
                            <span className={`status-badge-${event.severity === 'critical' ? 'critical' : event.severity === 'warning' ? 'warning' : 'ok'}`}>{event.severity}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            ) : (
              /* Grouped view */
              <div className="space-y-3">
                {groupedEvents.map(([processName, group]) => (
                  <div key={processName} className="rounded-lg border border-border/50 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold">{processName}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">{group.count} events</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {group.events.slice(0, 5).map(e => {
                        const sev = severityConfig[e.severity];
                        return (
                          <span
                            key={e.id}
                            onClick={() => setSelectedEvent(e)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-medium cursor-pointer hover:ring-1 hover:ring-primary/30 ${sev.bg} ${sev.color}`}
                          >
                            {e.type.replace(/-/g, ' ')}
                          </span>
                        );
                      })}
                      {group.count > 5 && <span className="text-[9px] text-muted-foreground self-center">+{group.count - 5} more</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {filteredEvents.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Sparkles className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">No events match current filters</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ AI Capabilities Status ═══ */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { title: 'SPC Auto-Limits', desc: 'Continuously recalculating UCL/LCL/Cpk from live production data', icon: Target, status: 'active' as const, metric: `Cpk ${liveMetrics.cpk.toFixed(2)}` },
          { title: 'Predictive Alerts', desc: 'ML model analyzing process trends to predict failures 2+ hours ahead', icon: Zap, status: 'active' as const, metric: `${liveMetrics.driftsCaught} caught` },
          { title: 'Smart Documentation', desc: 'Auto-formatting SOPs and work instructions from process changes', icon: FileText, status: (tick % 80 < 60 ? 'active' : 'processing') as 'active' | 'processing', metric: `${liveMetrics.docsGenerated} generated` },
          { title: 'Root Cause Engine', desc: 'Correlating environmental, supplier, and operator data for causality', icon: Brain, status: 'active' as const, metric: `${Math.floor(liveMetrics.actionsRecommended * 0.6)} analyses` },
        ].map(cap => (
          <div key={cap.title} className="kpi-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <cap.icon className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-semibold">{cap.title}</h4>
              </div>
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] border ${
                cap.status === 'active' ? 'border-status-ok/40 bg-status-ok/10 text-status-ok' : 'border-status-warning/40 bg-status-warning/10 text-status-warning'
              }`} style={{ borderRadius: '2px' }}>
                <span className={`h-1 w-1 rounded-full ${cap.status === 'active' ? 'bg-status-ok' : 'bg-status-warning bp-blink'}`} />
                {cap.status === 'active' ? 'Active' : 'Processing'}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">{cap.desc}</p>
            <div className="mt-3 pt-2 border-t border-border/50">
              <span className="text-xs font-mono font-bold">{cap.metric}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ Event detail drawer ═══ */}
      <AnimatePresence>
        {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-end">
          <div className="fixed inset-0 bg-background/70 backdrop-blur-md" onClick={() => setSelectedEvent(null)} />
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative z-10 w-full max-w-md bg-card border-l border-border shadow-2xl flex flex-col rounded-tl-2xl overflow-hidden"
          >
            <div className={`px-6 pt-6 pb-4 border-b border-border/50 ${severityConfig[selectedEvent.severity].bg}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {(() => { const TypeIcon = typeIcons[selectedEvent.type] || Brain; const sev = severityConfig[selectedEvent.severity]; return (
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${sev.bg} border border-border/30`}>
                      <TypeIcon className={`h-5 w-5 ${sev.color}`} />
                    </div>
                  ); })()}
                  <div>
                    <h2 className="text-base font-bold leading-tight">{selectedEvent.title}</h2>
                    <span className="text-[11px] text-muted-foreground font-mono">{selectedEvent.process}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedEvent(null)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-secondary/80 transition-colors text-muted-foreground hover:text-foreground">
                  <span className="text-lg">✕</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <p className="text-sm text-muted-foreground leading-relaxed">{selectedEvent.description}</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="kpi-card p-3">
                  <p className="bp-tile-label">Severity</p>
                  <span className={`inline-flex mt-1 status-badge-${selectedEvent.severity === 'critical' ? 'critical' : selectedEvent.severity === 'warning' ? 'warning' : 'ok'}`}>{selectedEvent.severity}</span>
                </div>
                <div className="kpi-card p-3">
                  <p className="bp-tile-label">Detected at</p>
                  <p className="text-sm font-mono mt-1 tabular-nums">T+{Math.floor(selectedEvent.tick / 60)}m</p>
                </div>
                <div className="kpi-card p-3">
                  <p className="bp-tile-label">Type</p>
                  <p className="text-xs font-medium mt-1 capitalize">{selectedEvent.type.replace(/-/g, ' ')}</p>
                </div>
                <div className="kpi-card p-3">
                  <p className="bp-tile-label">Process</p>
                  <p className="text-xs font-medium mt-1">{selectedEvent.process}</p>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-[10px] uppercase text-muted-foreground font-semibold mb-3">Recommended Actions</p>
                <div className="space-y-2">
                  {[
                    'Review flagged data points in SPC chart',
                    'Verify equipment calibration status',
                    'Check operator notes for recent shift',
                  ].map((action, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <ChevronRight className="h-3 w-3 text-primary" />
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border/50">
              <button
                onClick={() => setSelectedEvent(null)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                Acknowledge
              </button>
            </div>
          </motion.div>
        </div>
        )}
      </AnimatePresence>
    </div>
  );
}
