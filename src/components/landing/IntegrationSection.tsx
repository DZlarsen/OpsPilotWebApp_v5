import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Smartphone, Database, Wifi, Plug, ArrowRight, Check, ChevronDown, Zap, Clock,
} from 'lucide-react';
import { Link } from 'react-router-dom';

type Grade = 'G1' | 'G2' | 'G3';

interface IntegrationMethod {
  partNo: string;
  id: string;
  icon: React.ElementType;
  title: string;
  headline: string;
  desc: string;
  grade: Grade;
  setupTime: string;
  bestFor: string;
  steps: string[];
  tags: string[];
  cta: string;
  link: string;
}

const methods: IntegrationMethod[] = [
  {
    partNo: 'INT-001', id: 'csv', icon: Upload,
    title: 'CSV / Spreadsheet Import',
    headline: 'Already have data in Excel? Start here.',
    desc: 'Upload quality logs, inspection records, or downtime reports directly. Our importer auto-maps columns to processes, measurements, and timestamps. Zero coding, zero IT involvement.',
    grade: 'G1', setupTime: '< 30 min',
    bestFor: 'Shops transitioning from paper or spreadsheets',
    steps: [
      'Export existing data as CSV or Excel',
      'Drag & drop into the OpsPilot importer',
      'Map columns to process fields with the visual mapper',
      'Confirm — dashboards populate instantly',
    ],
    tags: ['CSV', 'Excel', 'Drag-and-drop', 'No-code'],
    cta: 'Try the importer', link: '/integration/csv-import',
  },
  {
    partNo: 'INT-002', id: 'manual', icon: Smartphone,
    title: 'Operator Data Entry',
    headline: 'No sensors? No problem.',
    desc: "Give operators tablet-friendly forms to log inspections, visual checks, and shift notes directly from the floor. Data validates against control limits in real-time and triggers instant alerts when something's off.",
    grade: 'G1', setupTime: '< 1 hour',
    bestFor: 'Manual inspection shops, visual quality checks',
    steps: [
      'Define processes and measurement targets',
      'Operators open OpsPilot on any tablet',
      'Log measurements with guided forms',
      'SPC charts + alerts update live',
    ],
    tags: ['Tablet-ready', 'Mobile', 'Guided forms', 'Real-time'],
    cta: 'See operator view', link: '/integration/operator-entry',
  },
  {
    partNo: 'INT-003', id: 'mqtt', icon: Database,
    title: 'MQTT / IoT Sensors',
    headline: 'Stream sensor data automatically.',
    desc: 'Publish temperature, vibration, pressure, or cycle-count data from edge devices to an MQTT broker. OpsPilot subscribes, ingests, and aggregates high-frequency readings into SPC-ready time series — no polling needed.',
    grade: 'G2', setupTime: '1–3 days',
    bestFor: 'Shops with IoT sensors or edge gateways',
    steps: [
      'Connect sensors to your MQTT broker (HiveMQ, Mosquitto)',
      'Configure topic mapping in the integration panel',
      'Set ingestion frequency and aggregation rules',
      'Data flows into dashboards with <5s latency',
    ],
    tags: ['MQTT', 'IoT edge', 'Real-time', 'Webhooks'],
    cta: 'View MQTT guide', link: '/integration/mqtt-guide',
  },
  {
    partNo: 'INT-004', id: 'plc', icon: Wifi,
    title: 'PLC / OPC-UA Gateway',
    headline: 'Connect directly to your machines.',
    desc: 'Bridge your PLCs to OpsPilot through an OPC-UA middleware like Kepware or Ignition. Tags for cycle time, temperature, pressure, and part counts stream automatically — the same data your SCADA already sees.',
    grade: 'G2', setupTime: '3–5 days',
    bestFor: 'Plants with Siemens, Allen-Bradley, or Mitsubishi PLCs',
    steps: [
      'Install OPC-UA gateway (Kepware, Ignition, Node-OPCUA)',
      'Select the PLC tags you want to track',
      "Configure the gateway to push via OpsPilot's REST API",
      'Map tags to processes — dashboards light up',
    ],
    tags: ['Siemens S7', 'Allen-Bradley', 'Modbus TCP', 'OPC-UA'],
    cta: 'View PLC guide', link: '/integration/plc-guide',
  },
  {
    partNo: 'INT-005', id: 'mes', icon: Plug,
    title: 'MES / ERP / SCADA',
    headline: 'Enrich OpsPilot with your existing systems.',
    desc: "Already running SAP, Oracle MES, Wonderware, or FactoryTalk? Use OpsPilot's REST API to pull work orders, BOM data, and production schedules. Enrich your quality analytics with context from your entire operation.",
    grade: 'G3', setupTime: '1–2 weeks',
    bestFor: 'Multi-system plants with existing MES/ERP',
    steps: [
      'Review API docs and identify data endpoints',
      'Configure authentication and sync schedule',
      'Map external fields to OpsPilot processes',
      'Integration team validates the connection',
    ],
    tags: ['SAP', 'Oracle MES', 'SCADA', 'REST API'],
    cta: 'Talk to our team', link: '/integration/contact',
  },
];

const gradeConfig: Record<Grade, { label: string; color: string; bg: string; border: string }> = {
  G1: { label: 'G1 · Simple',      color: 'text-status-ok',        bg: 'bg-status-ok/10',        border: 'border-status-ok/40' },
  G2: { label: 'G2 · Moderate',    color: 'text-status-warning',   bg: 'bg-status-warning/10',   border: 'border-status-warning/40' },
  G3: { label: 'G3 · Advanced',    color: 'text-primary',          bg: 'bg-primary/10',          border: 'border-primary/40' },
};

function MethodRow({ method, isOpen, onToggle }: { method: IntegrationMethod; isOpen: boolean; onToggle: () => void }) {
  const g = gradeConfig[method.grade];
  return (
    <motion.div
      layout
      className={`group relative border transition-colors overflow-hidden bp-ticks ${
        isOpen ? 'border-primary/40 bg-card is-active' : 'border-border bg-card/40 hover:bg-card/60 hover:border-border'
      }`}
      style={{ borderRadius: 'var(--radius)' }}
    >
      <button onClick={onToggle} className="w-full text-left px-5 py-4 flex items-center gap-4">
        {/* Part number */}
        <span className="hidden sm:inline-block font-mono text-[10px] text-muted-foreground/70 tabular-nums flex-shrink-0 w-14">
          #{method.partNo}
        </span>

        {/* Icon */}
        <div
          className={`flex h-10 w-10 items-center justify-center border transition-colors flex-shrink-0 ${
            isOpen ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground group-hover:text-foreground'
          }`}
          style={{ borderRadius: 'var(--radius)' }}
        >
          <method.icon className="h-4 w-4" strokeWidth={1.75} />
        </div>

        {/* Title + headline */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold">{method.title}</h3>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-0.5">{method.headline}</p>
        </div>

        {/* Grade + time */}
        <div className="hidden md:flex items-center gap-3 flex-shrink-0">
          <span className={`inline-flex items-center px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] border ${g.bg} ${g.color} ${g.border}`} style={{ borderRadius: '2px' }}>
            {g.label}
          </span>
          <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            <Clock className="h-3 w-3" strokeWidth={1.75} />
            {method.setupTime}
          </span>
        </div>

        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <div className="px-5 pb-5 border-t border-border/60">
              {/* Mobile grade/time badges (hidden on md+) */}
              <div className="flex md:hidden items-center gap-2 mt-4">
                <span className={`inline-flex items-center px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] border ${g.bg} ${g.color} ${g.border}`} style={{ borderRadius: '2px' }}>
                  {g.label}
                </span>
                <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <Clock className="h-3 w-3" strokeWidth={1.75} />
                  {method.setupTime}
                </span>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed mt-4">{method.desc}</p>

              {/* Best for — spec-sheet field */}
              <div className="mt-4 flex items-start gap-3 px-3 py-2.5 border border-primary/20 bg-primary/[0.04]" style={{ borderRadius: 'var(--radius)' }}>
                <Zap className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" strokeWidth={1.75} />
                <p className="text-xs">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary mr-2">Best for</span>
                  <span className="text-foreground/85">{method.bestFor}</span>
                </p>
              </div>

              {/* Assembly instructions (numbered steps) */}
              <div className="mt-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="h-px flex-1 bg-border" />
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                    Assembly · 04 steps
                  </p>
                  <span className="h-px flex-1 bg-border" />
                </div>
                <div className="space-y-2">
                  {method.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3 group/step">
                      <div
                        className="flex h-6 w-6 items-center justify-center border border-primary/40 bg-primary/5 text-primary text-[10px] font-mono font-bold flex-shrink-0 tabular-nums"
                        style={{ borderRadius: '2px' }}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </div>
                      <p className="text-sm text-foreground/80 pt-0.5">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags + CTA */}
              <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {method.tags.map(tag => (
                    <span key={tag} className="bp-chip">
                      {tag}
                    </span>
                  ))}
                </div>
                <Link
                  to={method.link}
                  className="inline-flex items-center gap-2 px-4 h-9 bg-primary text-primary-foreground font-mono text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors flex-shrink-0"
                  style={{ borderRadius: 'var(--radius)' }}
                >
                  {method.cta}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function IntegrationSection() {
  const [openId, setOpenId] = useState<string>('csv');
  const [filter, setFilter] = useState<'all' | Grade>('all');

  const filtered = filter === 'all' ? methods : methods.filter(m => m.grade === filter);

  return (
    <section id="integration" className="relative px-4 sm:px-6 py-24 border-t border-border">
      <div className="mx-auto max-w-5xl">
        {/* Section head — same pattern as other landing sections */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="bp-callout">04</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Connection Methods
            </span>
          </div>
          <h2 className="font-display text-5xl md:text-6xl leading-[0.95] max-w-3xl">
            Plug in your plant.{' '}
            <span className="text-primary">Five paths.</span>
          </h2>
          <p className="mt-5 text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Start simple with CSV or operator entry — graduate to MQTT, PLC, and MES as you scale. No lock-in. No vendor-specific SDKs. The spec changes; the data substrate doesn't.
          </p>
        </div>

        {/* Most-specified configuration banner (replaces "quick start" pill callout) */}
        <div
          className="mb-6 relative border border-status-ok/30 bg-status-ok/[0.04] flex flex-col sm:flex-row items-start sm:items-center gap-4 overflow-hidden"
          style={{ borderRadius: 'var(--radius)' }}
        >
          {/* Diagonal stripe accent on the left */}
          <div
            className="hidden sm:block absolute top-0 left-0 bottom-0 w-1.5"
            style={{
              background: 'repeating-linear-gradient(-45deg, hsl(var(--status-ok) / 0.5) 0 4px, transparent 4px 8px)',
            }}
          />
          <div className="flex items-center gap-3 pl-5 pr-3 py-4 sm:py-4">
            <div
              className="flex h-10 w-10 items-center justify-center border border-status-ok/40 bg-status-ok/10 flex-shrink-0"
              style={{ borderRadius: 'var(--radius)' }}
            >
              <Check className="h-4 w-4 text-status-ok" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-status-ok mb-1">
                Most-specified configuration
              </p>
              <p className="text-sm font-semibold">80% of plants start here</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Begin with CSV upload or operator entry. Live in under 30 minutes. Add MQTT and PLC paths as you grow — without re-platforming.
              </p>
            </div>
          </div>
          <Link
            to="/integration/quick-start"
            className="inline-flex items-center gap-2 px-4 h-9 mr-5 mb-5 sm:mb-0 border border-status-ok/40 bg-status-ok/10 text-status-ok font-mono text-xs font-bold uppercase tracking-wider hover:bg-status-ok/20 transition-colors flex-shrink-0"
            style={{ borderRadius: 'var(--radius)' }}
          >
            Quick start
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Grade filter — square chips, mono */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mr-2">
            Filter
          </span>
          {(['all', 'G1', 'G2', 'G3'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] border transition-colors ${
                filter === f
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border bg-secondary/40 text-muted-foreground hover:text-foreground hover:border-border'
              }`}
              style={{ borderRadius: '2px' }}
            >
              {f === 'all' ? 'All' : gradeConfig[f].label}
            </button>
          ))}
        </div>

        {/* Spec-sheet header (table-style) */}
        <div className="hidden md:grid grid-cols-[56px_40px_1fr_auto_auto_16px] gap-4 px-5 py-2 border-y border-border bg-card/30 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground items-center">
          <span>Part</span>
          <span />
          <span>Method</span>
          <span className="text-center">Grade</span>
          <span className="text-center">Setup</span>
          <span />
        </div>

        {/* Method rows */}
        <div className="space-y-2 mt-2">
          {filtered.map(method => (
            <MethodRow
              key={method.id}
              method={method}
              isOpen={openId === method.id}
              onToggle={() => setOpenId(openId === method.id ? '' : method.id)}
            />
          ))}
        </div>

        {/* Footer note */}
        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground text-center">
          {filtered.length} method{filtered.length !== 1 ? 's' : ''} listed · Additional integrations available on request
        </p>
      </div>
    </section>
  );
}
