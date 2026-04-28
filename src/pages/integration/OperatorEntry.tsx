import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Smartphone, Check, AlertTriangle, Clock, ChevronDown, Send } from 'lucide-react';
import { motion } from 'framer-motion';

const processes = ['CNC Mill A', 'CNC Mill B', 'Press Line 1', 'Heat Treat Oven'];
const parameters: Record<string, { name: string; unit: string; target: number; ucl: number; lcl: number }[]> = {
  'CNC Mill A': [
    { name: 'Diameter', unit: 'mm', target: 25.0, ucl: 25.1, lcl: 24.9 },
    { name: 'Surface Finish', unit: 'Ra', target: 0.8, ucl: 1.2, lcl: 0.4 },
  ],
  'CNC Mill B': [
    { name: 'Bore Depth', unit: 'mm', target: 12.5, ucl: 12.7, lcl: 12.3 },
  ],
  'Press Line 1': [
    { name: 'Force', unit: 'kN', target: 340, ucl: 360, lcl: 320 },
  ],
  'Heat Treat Oven': [
    { name: 'Temperature', unit: '°C', target: 850, ucl: 870, lcl: 830 },
  ],
};

export default function OperatorEntry() {
  const navigate = useNavigate();
  const goToIntegration = () => {
    navigate('/');
    setTimeout(() => {
      const el = document.getElementById('integration');
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 64;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      }
    }, 80);
  };
  const [process, setProcess] = useState('CNC Mill A');
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [note, setNote] = useState('');

  const params = parameters[process] || [];

  const getStatus = (param: typeof params[0], val: string) => {
    const n = parseFloat(val);
    if (isNaN(n)) return 'empty';
    if (n > param.ucl || n < param.lcl) return 'alert';
    if (n > param.target + (param.ucl - param.target) * 0.7 || n < param.target - (param.target - param.lcl) * 0.7) return 'warning';
    return 'ok';
  };

  const handleSubmit = () => setSubmitted(true);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto max-w-lg flex h-14 items-center gap-4 px-4">
          <Link to="/#integration" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="flex-1 text-center">
            <span className="text-sm font-semibold">Operator Entry</span>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 py-8">
        {!submitted ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {/* Simulated mobile frame hint */}
            <div className="text-center mb-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-secondary/50 text-xs font-medium text-muted-foreground">
                <Smartphone className="h-3 w-3" />
                Tablet / Mobile optimized view
              </div>
            </div>

            {/* Shift info */}
            <div className="flex items-center justify-between p-3 rounded-[var(--radius)] bg-secondary/30 border border-border/50">
              <div>
                <p className="text-xs text-muted-foreground">Shift</p>
                <p className="text-sm font-semibold">Morning — 06:00–14:00</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Operator</p>
                <p className="text-sm font-semibold">J. Martinez</p>
              </div>
            </div>

            {/* Process selector */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Process / Line</label>
              <div className="relative">
                <select
                  value={process}
                  onChange={(e) => { setProcess(e.target.value); setValues({}); }}
                  className="w-full appearance-none px-4 py-3 rounded-[var(--radius)] border border-border bg-card text-sm font-medium pr-10"
                >
                  {processes.map((p) => <option key={p}>{p}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Measurement inputs */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Measurements</label>
              <div className="space-y-3">
                {params.map((param) => {
                  const val = values[param.name] || '';
                  const status = getStatus(param, val);
                  return (
                    <div key={param.name} className={`p-4 rounded-[var(--radius)] border transition-colors ${
                      status === 'alert' ? 'border-destructive/50 bg-destructive/5' :
                      status === 'warning' ? 'border-status-warning/50 bg-status-warning/5' :
                      status === 'ok' ? 'border-status-ok/30 bg-status-ok/5' : 'border-border bg-card'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold">{param.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {param.lcl} – {param.ucl} {param.unit}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          step="0.01"
                          placeholder={`Target: ${param.target}`}
                          value={val}
                          onChange={(e) => setValues({ ...values, [param.name]: e.target.value })}
                          className="flex-1 px-3 py-2.5 rounded-[var(--radius)] border border-border bg-background text-base font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <span className="text-xs text-muted-foreground w-8">{param.unit}</span>
                        {status === 'ok' && <Check className="h-5 w-5 text-status-ok" />}
                        {status === 'warning' && <AlertTriangle className="h-5 w-5 text-status-warning" />}
                        {status === 'alert' && <AlertTriangle className="h-5 w-5 text-destructive" />}
                      </div>
                      {status === 'alert' && (
                        <p className="text-xs text-destructive mt-2 font-medium">⚠ Value outside control limits — alert will be triggered</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Notes (optional)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Tool change, visual defect, batch note..."
                className="w-full px-3 py-2.5 rounded-[var(--radius)] border border-border bg-card text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-[var(--radius)] bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-colors"
            >
              <Send className="h-4 w-4" />
              Submit Measurement
            </button>

            <p className="text-center text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3 inline mr-1" />
              Auto-saves every 30 seconds · Last saved 2s ago
            </p>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-status-ok/15 mx-auto mb-4">
              <Check className="h-8 w-8 text-status-ok" />
            </div>
            <h2 className="text-xl font-bold">Measurement recorded!</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
              Your data has been added to the SPC chart for {process}. Dashboards are updated in real-time.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <button onClick={() => { setSubmitted(false); setValues({}); setNote(''); }} className="w-full px-6 py-3 rounded-[var(--radius)] bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
                Log another measurement
              </button>
              <Link to="/dashboard" className="w-full px-6 py-3 rounded-[var(--radius)] border border-border text-sm font-medium hover:bg-secondary/50 transition-colors text-center">
                View Dashboard
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}