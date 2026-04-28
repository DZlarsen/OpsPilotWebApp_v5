import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronRight, ChevronLeft, CheckCircle2, Circle,
  Users, AlertTriangle, Shield, Search, Wrench, PlayCircle,
  RefreshCw, Award, ArrowRight, Check, Lightbulb, FileText,
} from 'lucide-react';
import { Task, EightDStep, defaultEightDSteps } from './types';

// ─────────────────────────────────────────────────────────
// Per-discipline content: icon, color accent, key questions,
// field prompts, and a guiding example.
// ─────────────────────────────────────────────────────────
interface DisciplineConfig {
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  accent: string;          // Tailwind class for the step's accent color
  accentBg: string;
  tagline: string;
  questions: string[];
  fieldLabel: string;
  placeholder: string;
  example: string;
  participants: string;
  output: string;
}

export const DISCIPLINE_CONFIG: DisciplineConfig[] = [
  {
    label: 'D1: Team Formation',
    shortLabel: 'Team',
    icon: Users,
    accent: 'text-chart-blue',
    accentBg: 'bg-chart-blue/10 border-chart-blue/30',
    tagline: 'Assemble the right people — quality, engineering, production',
    questions: [
      'Who has direct knowledge of this process?',
      'Is there a champion or sponsor accountable for resolution?',
      'Does the team span all relevant disciplines (quality, engineering, maintenance, operations)?',
    ],
    fieldLabel: 'Team members & roles',
    placeholder: 'e.g. Sarah Kim (Lead / Quality), Mike Chen (Process Engineering), James Rivera (Production), Lisa Park (Maintenance)…',
    example: 'Sarah Kim (Quality Lead), Mike Chen (Process Eng), James Rivera (Production Supervisor), Lisa Park (Maintenance)',
    participants: 'Quality Lead, Process Engineer, Production Supervisor, Maintenance',
    output: 'Team charter with named roles and a defined decision-making lead',
  },
  {
    label: 'D2: Problem Description',
    shortLabel: 'Problem',
    icon: AlertTriangle,
    accent: 'text-status-warning',
    accentBg: 'bg-status-warning/10 border-status-warning/30',
    tagline: 'Define the problem precisely — with data, not assumptions',
    questions: [
      'What exactly is wrong? (part, symptom, location)',
      'What is the measured defect rate or failure count?',
      'When was it first observed? Has it happened before?',
      'Is this a safety, regulatory, or customer-facing issue?',
    ],
    fieldLabel: 'IS / IS NOT problem statement',
    placeholder: 'IS: Flash on parting line of housing P/N 4420. 12% reject rate since batch 2026-B3.\nIS NOT: Present on other cavities. Not observed prior to tooling changeover.',
    example: 'IS: Flash on parting line of housing P/N 4420 — 12% reject rate since batch 2026-B3.\nIS NOT: Other cavities; not observed before tooling changeover on 2026-04-01.',
    participants: 'Full 8D team + customer-facing members if applicable',
    output: 'IS / IS NOT statement; quantified problem scope; timeline',
  },
  {
    label: 'D3: Interim Containment',
    shortLabel: 'Contain',
    icon: Shield,
    accent: 'text-status-critical',
    accentBg: 'bg-status-critical/10 border-status-critical/30',
    tagline: 'Protect the customer right now — before root cause is found',
    questions: [
      'Have we isolated all suspect inventory?',
      'Is 100% inspection in place at the affected operation?',
      'Have downstream customers been notified?',
      'Have we set a target date to replace containment with a permanent fix?',
    ],
    fieldLabel: 'Containment actions & owners',
    placeholder: 'e.g. 100% visual inspection added at station 3 (owner: James R., effective 2026-04-08). Suspect batches quarantined to cage B-12. Customer notified via quality alert QA-2026-021…',
    example: '100% visual inspection at Station 3 (James Rivera, 2026-04-08). Batches quarantined at cage B-12. Customer notified — QA-2026-021 issued.',
    participants: 'Quality + Production',
    output: 'Containment action list with owners, effective dates, and verification method',
  },
  {
    label: 'D4: Root Cause Analysis',
    shortLabel: 'Root Cause',
    icon: Search,
    accent: 'text-chart-purple',
    accentBg: 'bg-chart-purple/10 border-chart-purple/30',
    tagline: 'Find the real cause — not just the symptom',
    questions: [
      'Have you completed a 5-Why analysis?',
      'Have you created a Fishbone (Ishikawa) diagram?',
      'Can you reproduce the failure in controlled conditions?',
      'Have you verified the root cause with data — does fixing it eliminate the problem?',
    ],
    fieldLabel: 'Verified root cause(s)',
    placeholder: 'e.g. 5-Why:\n1. Why flash? → Parting line gap > 0.08mm\n2. Why gap? → Cavity insert worn beyond tolerance\n3. Why worn? → PM interval exceeded by 30%\n…\nVerified: Replacing insert eliminated defect in 50-piece trial.',
    example: '5-Why: Flash → parting line gap > 0.08mm → cavity insert worn → PM interval exceeded 30%. Verified: New insert eliminated defect in 50-piece trial.',
    participants: 'Full 8D team + process experts',
    output: 'Documented and verified root cause with supporting evidence',
  },
  {
    label: 'D5: Corrective Actions',
    shortLabel: 'Fix',
    icon: Wrench,
    accent: 'text-primary',
    accentBg: 'bg-primary/10 border-primary/30',
    tagline: 'Choose the permanent fix — and assess its risk',
    questions: [
      'What actions directly address the verified root cause?',
      'Have you evaluated risk of each proposed action (could it create new problems)?',
      'Have you confirmed the corrective action is feasible within your constraints (cost, time, tech)?',
      'Who owns each action and what is the target completion date?',
    ],
    fieldLabel: 'Proposed corrective actions',
    placeholder: 'e.g. 1. Replace cavity insert (owner: Mike Chen, due: 2026-04-18) — risk: low.\n2. Reduce PM interval from 5000 to 3500 shots (SOP-MLD-002 update) — owner: Sarah Kim, due: 2026-04-20…',
    example: '1. Replace cavity insert (Mike Chen, 2026-04-18). 2. Reduce PM interval to 3500 shots — update SOP-MLD-002 (Sarah Kim, 2026-04-20).',
    participants: 'Engineering + Quality',
    output: 'Ranked corrective action plan with owners, dates, and feasibility assessment',
  },
  {
    label: 'D6: Implementation & Validation',
    shortLabel: 'Implement',
    icon: PlayCircle,
    accent: 'text-status-ok',
    accentBg: 'bg-status-ok/10 border-status-ok/30',
    tagline: 'Execute the fix — and prove it worked with data',
    questions: [
      'Have all corrective actions been completed?',
      'Is there measurable improvement in the reject rate or process capability?',
      'Have SOPs, control plans, and work instructions been updated?',
      'Has the containment action been safely removed (or is it still needed)?',
    ],
    fieldLabel: 'Implementation results & verification data',
    placeholder: 'e.g. Insert replaced 2026-04-17. 200-piece run post-implementation: 0 flash defects (0% vs prior 12%). Cpk improved from 0.89 → 1.44. SOP-MLD-002 updated and released. Containment removed 2026-04-18…',
    example: '200-piece post-fix run: 0 flash (0% vs 12% baseline). Cpk 0.89 → 1.44. SOP-MLD-002 updated. Containment removed 2026-04-18.',
    participants: 'Full team + process validation',
    output: 'Before/after data showing problem elimination; updated documentation',
  },
  {
    label: 'D7: Prevent Recurrence',
    shortLabel: 'Prevent',
    icon: RefreshCw,
    accent: 'text-accent',
    accentBg: 'bg-accent/10 border-accent/30',
    tagline: 'Make this impossible to happen again — anywhere it could',
    questions: [
      'Has PFMEA been updated to reflect the new failure mode and controls?',
      'Are there similar processes or product lines that need the same fix?',
      'Have control plans and inspection criteria been updated?',
      'Have relevant operators and engineers been trained on the updated procedures?',
    ],
    fieldLabel: 'Systemic prevention actions',
    placeholder: 'e.g. PFMEA-MLD-001 updated (RPN reduced from 168 → 48). Same PM interval change applied to Lines C and D (2 additional tools). Training session scheduled for molding team 2026-04-25. Control plan updated to include dimensional check every 2000 shots…',
    example: 'PFMEA-MLD-001 updated (RPN 168→48). PM interval applied to Lines C & D. Molding team training scheduled 2026-04-25. Control plan dimensional check added.',
    participants: 'Quality + Engineering',
    output: 'Updated PFMEA, control plans, training records, and cross-process review',
  },
  {
    label: 'D8: Closure & Recognition',
    shortLabel: 'Close',
    icon: Award,
    accent: 'text-status-ok',
    accentBg: 'bg-status-ok/10 border-status-ok/30',
    tagline: 'Close with confidence — recognize the team',
    questions: [
      'Is the problem fully resolved — with data to prove sustained performance?',
      'Has the champion reviewed and approved closure?',
      'Have team contributions been formally recognized?',
      'Are all documents filed, archived, and accessible for future reference?',
    ],
    fieldLabel: 'Closure summary & team recognition',
    placeholder: 'e.g. Problem resolved — 30-day sustained run: 0 flash defects, Cpk 1.48. Closed with champion approval (VP Operations, 2026-05-12). Team recognition: Engineering achievement award. Files archived under QMS-2026-041…',
    example: '30-day sustained run: 0 defects, Cpk 1.48. Closed 2026-05-12 (VP approval). Team recognized — Engineering Achievement Award. Archived: QMS-2026-041.',
    participants: 'Champion + Team lead',
    output: 'Final signed-off 8D report; lessons-learned filed; team acknowledgment',
  },
];

// ─────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────
interface Props {
  task: Task;
  onClose: () => void;
  onUpdate: (task: Task) => void;
}

export default function EightDWizard({ task, onClose, onUpdate }: Props) {
  const steps = task.eightDSteps?.length === 8 ? task.eightDSteps : [...defaultEightDSteps];
  const [activeStep, setActiveStep] = useState(() => {
    const first = steps.findIndex(s => !s.completed);
    return first >= 0 ? first : 0;
  });
  const [draftNotes, setDraftNotes] = useState<Record<number, string>>(
    () => Object.fromEntries(steps.map((s, i) => [i, s.notes]))
  );
  const [showExample, setShowExample] = useState(false);

  const config = DISCIPLINE_CONFIG[activeStep];
  const step = steps[activeStep];
  const completedCount = steps.filter(s => s.completed).length;
  const progressPct = Math.round((completedCount / 8) * 100);

  // Save draft on step change
  useEffect(() => {
    setShowExample(false);
  }, [activeStep]);

  const saveNotes = (idx: number, notes: string) => {
    const updated = steps.map((s, i) => i === idx ? { ...s, notes } : s);
    onUpdate({ ...task, eightDSteps: updated });
  };

  const toggleComplete = (idx: number) => {
    // Auto-save notes before toggling
    const updated = steps.map((s, i) =>
      i === idx ? { ...s, completed: !s.completed, notes: draftNotes[i] ?? s.notes } : s
    );
    onUpdate({ ...task, eightDSteps: updated });
    // Advance to next incomplete step when marking done
    if (!steps[idx].completed) {
      const next = updated.findIndex((s, i) => i > idx && !s.completed);
      if (next >= 0) setTimeout(() => setActiveStep(next), 300);
    }
  };

  const handleNotesBlur = (idx: number) => {
    saveNotes(idx, draftNotes[idx] ?? '');
  };

  const stepColor = (i: number) => {
    if (steps[i].completed) return 'bg-status-ok/20 border-status-ok/60 text-status-ok';
    if (i === activeStep) return 'bg-primary/20 border-primary/60 text-primary';
    return 'bg-secondary/30 border-border/50 text-muted-foreground/60';
  };

  return (
    <div className="fixed inset-0 z-[100] flex">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-background/70 backdrop-blur-md" onClick={onClose} />

      {/* Drawer — wide enough to feel spacious */}
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="relative ml-auto w-full max-w-3xl bg-card border-l border-border flex flex-col h-full shadow-2xl overflow-hidden rounded-tl-2xl"
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-border flex-shrink-0">
          <div className="min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">{task.key}</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">· 8D Problem Solving</span>
            </div>
            <h2 className="font-semibold text-base leading-snug truncate">{task.title}</h2>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
              {task.process} · {task.owner}
            </p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center hover:bg-secondary/70 transition-colors flex-shrink-0" style={{ borderRadius: 'var(--radius)' }}>
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* ── Progress bar ── */}
        <div className="px-6 py-3 border-b border-border/60 flex-shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Progress · {completedCount}/8 disciplines
            </span>
            <span className={`font-mono text-[10px] font-bold ${progressPct === 100 ? 'text-status-ok' : 'text-primary'}`}>
              {progressPct}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-secondary/50 overflow-hidden" style={{ borderRadius: '2px' }}>
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Step nav pills */}
          <div className="flex gap-1 mt-3 overflow-x-auto pb-0.5">
            {steps.map((s, i) => (
              <button
                key={i}
                onClick={() => setActiveStep(i)}
                title={DISCIPLINE_CONFIG[i].label}
                className={`flex-shrink-0 h-7 px-2 flex items-center gap-1 font-mono text-[10px] font-bold border transition-all ${stepColor(i)}`}
                style={{ borderRadius: '2px' }}
              >
                {s.completed ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : null}
                D{i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* ── Active discipline pane ── */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="px-6 py-5 space-y-5"
            >
              {/* Discipline header */}
              <div className={`border p-4 ${config.accentBg}`} style={{ borderRadius: 'var(--radius)' }}>
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center border ${config.accentBg} flex-shrink-0`} style={{ borderRadius: 'var(--radius)' }}>
                    <config.icon className={`h-5 w-5 ${config.accent}`} strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm">{config.label}</h3>
                      {step.completed && (
                        <span className="status-badge-ok">Complete</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{config.tagline}</p>
                  </div>
                </div>
              </div>

              {/* Key questions */}
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2.5">
                  Key questions for this discipline
                </p>
                <div className="space-y-2">
                  {config.questions.map((q, i) => (
                    <div key={i} className="flex items-start gap-2.5 group">
                      <span className="flex-shrink-0 mt-0.5 h-4 w-4 flex items-center justify-center font-mono text-[9px] font-bold border border-border bg-secondary/40 text-muted-foreground"
                        style={{ borderRadius: '2px' }}>
                        {i + 1}
                      </span>
                      <p className="text-sm text-foreground/85">{q}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Who & output */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-border bg-background/40 px-3 py-2.5" style={{ borderRadius: 'var(--radius)' }}>
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Participants</p>
                  <p className="text-xs text-foreground/80">{config.participants}</p>
                </div>
                <div className="border border-border bg-background/40 px-3 py-2.5" style={{ borderRadius: 'var(--radius)' }}>
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Expected output</p>
                  <p className="text-xs text-foreground/80">{config.output}</p>
                </div>
              </div>

              {/* Notes area */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {config.fieldLabel}
                  </label>
                  <button
                    onClick={() => setShowExample(v => !v)}
                    className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-primary hover:text-primary/80 transition-colors"
                  >
                    <Lightbulb className="h-3 w-3" />
                    {showExample ? 'Hide example' : 'Show example'}
                  </button>
                </div>

                <AnimatePresence>
                  {showExample && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mb-2 p-3 border border-primary/20 bg-primary/[0.04] text-xs text-foreground/80 leading-relaxed italic"
                        style={{ borderRadius: 'var(--radius)' }}>
                        <span className="not-italic font-mono text-[9px] uppercase tracking-wider text-primary block mb-1">Example</span>
                        {config.example}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <textarea
                  className="w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary resize-none transition-colors"
                  style={{ borderRadius: 'var(--radius)', minHeight: '120px' }}
                  placeholder={config.placeholder}
                  value={draftNotes[activeStep] ?? ''}
                  onChange={e => setDraftNotes(d => ({ ...d, [activeStep]: e.target.value }))}
                  onBlur={() => handleNotesBlur(activeStep)}
                />
              </div>

              {/* Mark complete */}
              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <button
                  onClick={() => toggleComplete(activeStep)}
                  className={`inline-flex items-center gap-2.5 px-4 py-2.5 border font-mono text-xs font-bold uppercase tracking-wider transition-all ${
                    step.completed
                      ? 'border-status-ok/60 bg-status-ok/10 text-status-ok hover:bg-status-ok/20'
                      : 'border-primary/60 bg-primary/5 text-primary hover:bg-primary/15'
                  }`}
                  style={{ borderRadius: 'var(--radius)' }}
                >
                  {step.completed
                    ? <><CheckCircle2 className="h-4 w-4" /> Mark incomplete</>
                    : <><Circle className="h-4 w-4" /> Mark D{activeStep + 1} complete</>}
                </button>

                {!step.completed && draftNotes[activeStep] && draftNotes[activeStep] !== step.notes && (
                  <button
                    onClick={() => handleNotesBlur(activeStep)}
                    className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Save notes
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Footer: step navigation ── */}
        <div className="flex-shrink-0 border-t border-border px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setActiveStep(i => Math.max(0, i - 1))}
            disabled={activeStep === 0}
            className="inline-flex items-center gap-2 px-4 py-2 border border-border font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ borderRadius: 'var(--radius)' }}
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Previous
          </button>

          <div className="flex items-center gap-1">
            {steps.map((s, i) => (
              <button
                key={i}
                onClick={() => setActiveStep(i)}
                className={`h-1.5 transition-all ${
                  i === activeStep ? 'w-6 bg-primary' : s.completed ? 'w-1.5 bg-status-ok' : 'w-1.5 bg-border'
                }`}
                style={{ borderRadius: '2px' }}
              />
            ))}
          </div>

          {activeStep < 7 ? (
            <button
              onClick={() => {
                handleNotesBlur(activeStep);
                setActiveStep(i => Math.min(7, i + 1));
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-mono text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors"
              style={{ borderRadius: 'var(--radius)' }}
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 px-4 py-2 bg-status-ok text-white font-mono text-xs font-bold uppercase tracking-wider hover:bg-status-ok/90 transition-colors"
              style={{ borderRadius: 'var(--radius)' }}
            >
              <Check className="h-3.5 w-3.5" /> Finish
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
