import { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import { EightDStep } from './types';

interface Props {
  steps: EightDStep[];
  onUpdate: (steps: EightDStep[]) => void;
}

export default function EightDTracker({ steps, onUpdate }: Props) {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const completedCount = steps.filter(s => s.completed).length;
  const progressPct = Math.round((completedCount / steps.length) * 100);

  const toggleStep = (index: number) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], completed: !updated[index].completed };
    onUpdate(updated);
  };

  const updateNotes = (index: number, notes: string) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], notes };
    onUpdate(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          8D Problem Solving
        </label>
        <span className="text-xs font-mono font-medium text-primary">{completedCount}/{steps.length} complete</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full rounded-full bg-secondary/50 overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 rounded-full"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-1">
        {steps.map((step, i) => {
          const isExpanded = expandedStep === i;
          return (
            <div key={i} className="rounded-md border border-border overflow-hidden">
              <button
                onClick={() => setExpandedStep(isExpanded ? null : i)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-secondary/30 transition-colors"
              >
                <button
                  onClick={(e) => { e.stopPropagation(); toggleStep(i); }}
                  className="flex-shrink-0"
                >
                  {step.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-status-ok" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground/50" />
                  )}
                </button>
                <span className={`text-xs font-medium flex-1 ${step.completed ? 'line-through text-muted-foreground' : ''}`}>
                  {step.label}
                </span>
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>
              {isExpanded && (
                <div className="px-3 pb-3 space-y-2 border-t border-border bg-secondary/10">
                  <p className="text-[10px] text-muted-foreground pt-2">{step.description}</p>
                  <textarea
                    className="w-full rounded-md bg-secondary/50 border border-border px-2.5 py-2 text-xs text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                    rows={3}
                    placeholder="Add notes for this discipline..."
                    value={step.notes}
                    onChange={(e) => updateNotes(i, e.target.value)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
