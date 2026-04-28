import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Sparkles, HelpCircle } from 'lucide-react';

interface TourStep {
  target: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
  {
    target: '[data-tour="sidebar-nav"]',
    title: 'Navigation',
    description: 'Use the sidebar to switch between Dashboard, Quality/SPC, PFMEA, OEE, and more.',
    position: 'right',
  },
  {
    target: '[data-tour="kpi-row"]',
    title: 'KPI Cards',
    description: 'Key metrics update in real time. Click any card to drill into its detail page.',
    position: 'bottom',
  },
  {
    target: '[data-tour="customize-btn"]',
    title: 'Customize Layout',
    description: 'Toggle sections on/off, add charts, resize panels, and reorder your dashboard.',
    position: 'bottom',
  },
  {
    target: '[data-tour="search-btn"]',
    title: 'Quick Search',
    description: 'Press ⌘K to instantly jump to any page, process, alert, or PFMEA item.',
    position: 'bottom',
  },
  {
    target: '[data-tour="notifications"]',
    title: 'Notifications',
    description: 'Critical alerts and high-risk items appear here. Stay on top of what matters.',
    position: 'bottom',
  },
];

const TOOLTIP_WIDTH = 288;
const TOOLTIP_PADDING = 12;

export function TourTriggerButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors"
    >
      <HelpCircle className="h-4 w-4" />
      Guided Tour
    </button>
  );
}

export default function OnboardingTour({ externalActive, onClose }: { externalActive?: boolean; onClose?: () => void }) {
  const [internalActive, setInternalActive] = useState(false);
  const active = externalActive ?? internalActive;
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Auto-start for first-time users only when not externally controlled
  useEffect(() => {
    if (externalActive !== undefined) return;
    const dismissed = localStorage.getItem('opspilot-tour-dismissed');
    if (!dismissed) {
      const timer = setTimeout(() => setInternalActive(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [externalActive]);

  const updateRect = useCallback(() => {
    if (!active) return;
    const el = document.querySelector(tourSteps[step].target);
    if (el) {
      setRect(el.getBoundingClientRect());
    }
  }, [active, step]);

  useEffect(() => {
    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, [updateRect]);

  // Reset step when tour opens
  useEffect(() => {
    if (active) setStep(0);
  }, [active]);

  const dismiss = () => {
    setInternalActive(false);
    onClose?.();
    localStorage.setItem('opspilot-tour-dismissed', 'true');
  };

  const next = () => {
    if (step < tourSteps.length - 1) setStep(step + 1);
    else dismiss();
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  if (!active) return null;

  const currentStep = tourSteps[step];

  // Clamp tooltip so it stays fully within the viewport
  const getTooltipStyle = (): React.CSSProperties => {
    if (!rect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    const gap = 12;
    let top: number;
    let left: number;

    switch (currentStep.position) {
      case 'right':
        top = rect.top + rect.height / 2;
        left = rect.right + gap;
        // Adjust vertical centering
        top = Math.max(TOOLTIP_PADDING, Math.min(top, window.innerHeight - 180));
        left = Math.min(left, window.innerWidth - TOOLTIP_WIDTH - TOOLTIP_PADDING);
        return { top, left };
      case 'bottom':
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
        // Clamp horizontal
        left = Math.max(TOOLTIP_PADDING, Math.min(left, window.innerWidth - TOOLTIP_WIDTH - TOOLTIP_PADDING));
        // If would go below viewport, show above instead
        if (top + 180 > window.innerHeight) {
          top = Math.max(TOOLTIP_PADDING, rect.top - gap - 180);
        }
        return { top, left };
      case 'left':
        top = rect.top + rect.height / 2;
        left = rect.left - gap - TOOLTIP_WIDTH;
        top = Math.max(TOOLTIP_PADDING, Math.min(top, window.innerHeight - 180));
        left = Math.max(TOOLTIP_PADDING, left);
        return { top, left };
      case 'top':
        top = rect.top - gap - 180;
        left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
        left = Math.max(TOOLTIP_PADDING, Math.min(left, window.innerWidth - TOOLTIP_WIDTH - TOOLTIP_PADDING));
        top = Math.max(TOOLTIP_PADDING, top);
        return { top, left };
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[999] pointer-events-none">
        <div className="absolute inset-0 bg-background/70 pointer-events-auto" onClick={dismiss} />

        {rect && (
          <div
            className="absolute rounded-lg ring-2 ring-primary shadow-[0_0_0_9999px_hsl(var(--background)/0.7)] pointer-events-none"
            style={{
              top: rect.top - 4,
              left: rect.left - 4,
              width: rect.width + 8,
              height: rect.height + 8,
            }}
          />
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed z-[1000] rounded-lg border border-border bg-popover p-4 shadow-xl pointer-events-auto"
            style={{ width: TOOLTIP_WIDTH, ...getTooltipStyle() }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">{currentStep.title}</h3>
              </div>
              <button onClick={dismiss} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">{currentStep.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-mono">{step + 1}/{tourSteps.length}</span>
              <div className="flex items-center gap-1.5">
                {step > 0 && (
                  <button onClick={prev} className="flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                    <ChevronLeft className="h-3 w-3" />
                    Back
                  </button>
                )}
                <button onClick={next} className="flex items-center gap-1 px-3 py-1 rounded bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
                  {step === tourSteps.length - 1 ? 'Done' : 'Next'}
                  {step < tourSteps.length - 1 && <ChevronRight className="h-3 w-3" />}
                </button>
              </div>
            </div>
            <div className="flex justify-center gap-1 mt-3">
              {tourSteps.map((_, i) => (
                <div key={i} className={`h-1 rounded-full transition-all ${i === step ? 'w-4 bg-primary' : 'w-1 bg-muted-foreground/30'}`} />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}
