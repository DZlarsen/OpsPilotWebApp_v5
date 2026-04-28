import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileSpreadsheet, Check, AlertCircle, ChevronRight, Table, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

const sampleHeaders = ['Timestamp', 'Process', 'Measurement', 'Value', 'Operator', 'Batch'];
const sampleRows = [
  ['2026-04-08 08:12', 'CNC Mill A', 'Diameter', '25.02', 'J. Martinez', 'B-4401'],
  ['2026-04-08 08:15', 'CNC Mill A', 'Diameter', '25.04', 'J. Martinez', 'B-4401'],
  ['2026-04-08 08:18', 'CNC Mill B', 'Surface Finish', '0.81', 'R. Chen', 'B-4402'],
  ['2026-04-08 08:21', 'Press Line 1', 'Force (kN)', '342.1', 'A. Okafor', 'B-4403'],
  ['2026-04-08 08:24', 'CNC Mill A', 'Diameter', '24.98', 'J. Martinez', 'B-4401'],
];

const fieldMappings = [
  { source: 'Timestamp', target: 'Measurement Time', status: 'mapped' },
  { source: 'Process', target: 'Process Name', status: 'mapped' },
  { source: 'Measurement', target: 'Parameter', status: 'mapped' },
  { source: 'Value', target: 'Measured Value', status: 'mapped' },
  { source: 'Operator', target: 'Operator ID', status: 'mapped' },
  { source: 'Batch', target: 'Batch / Lot #', status: 'mapped' },
];

export default function CsvImporter() {
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
  const [step, setStep] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto max-w-4xl flex h-14 items-center gap-4 px-4 sm:px-6">
          <button onClick={goToIntegration} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Integration
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
        <div className="text-center mb-10">
          <div className="flex items-center gap-3 mb-3 justify-center">
            <span className="page-callout">I1</span>
            <span className="page-eyebrow">Integration · CSV Import</span>
          </div>
          <h1 className="page-title">Import your data in 3 simple steps</h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mt-3 max-w-lg mx-auto">
            Drag & drop a spreadsheet · We'll map it to your processes automatically
          </p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {['Upload File', 'Map Columns', 'Review & Import'].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                i <= step ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'
              }`}>
                {i < step ? <Check className="h-3 w-3" /> : <span className="font-mono">{i + 1}</span>}
                <span className="hidden sm:inline">{label}</span>
              </div>
              {i < 2 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
            </div>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => setStep(1)}
              className={`border-2 border-dashed rounded-[var(--radius)] p-16 text-center cursor-pointer transition-colors ${
                dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-secondary/30'
              }`}
            >
              <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-semibold">Drop your CSV or Excel file here</p>
              <p className="text-sm text-muted-foreground mt-1">or click to browse — supports .csv, .xlsx, .xls up to 50MB</p>
              <div className="mt-6 flex items-center justify-center gap-4">
                <span className="bp-chip">.csv</span>
                <span className="bp-chip">.xlsx</span>
                <span className="bp-chip">.xls</span>
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-4">
              <span className="font-medium text-foreground">Demo mode:</span> Click to see the importer in action with sample data
            </p>
          </motion.div>
        )}

        {/* Step 2: Column mapping */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="rounded-[var(--radius)] border border-border bg-card overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-secondary/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-status-ok" />
                  <span className="text-sm font-medium">quality_data_april.csv</span>
                  <span className="text-xs text-muted-foreground">— 5 rows, 6 columns detected</span>
                </div>
              </div>

              {/* Preview table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-secondary/20">
                      {sampleHeaders.map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-semibold text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sampleRows.map((row, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-secondary/20">
                        {row.map((cell, j) => (
                          <td key={j} className="px-3 py-2 font-mono">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 rounded-[var(--radius)] border border-border bg-card p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Table className="h-4 w-4 text-primary" />
                Column Mapping
              </h3>
              <div className="space-y-2">
                {fieldMappings.map((m) => (
                  <div key={m.source} className="flex items-center gap-3 px-3 py-2 rounded-[var(--radius)] bg-secondary/30 border border-border/50">
                    <span className="text-xs font-mono font-medium w-28 flex-shrink-0">{m.source}</span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-medium text-primary flex-1">{m.target}</span>
                    <Check className="h-3.5 w-3.5 text-status-ok" />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <button onClick={() => setStep(0)} className="px-4 py-2 rounded-[var(--radius)] border border-border text-sm font-medium hover:bg-secondary/50 transition-colors">Back</button>
              <button onClick={() => setStep(2)} className="px-6 py-2 rounded-[var(--radius)] bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">Continue to Review</button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Review */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="rounded-[var(--radius)] border border-status-ok/30 bg-status-ok/5 p-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-status-ok/15 mx-auto mb-4">
                <Check className="h-7 w-7 text-status-ok" />
              </div>
              <h3 className="text-lg font-bold">Ready to import!</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                5 measurements across 3 processes will be imported. Your SPC charts and dashboards will update automatically.
              </p>

              <div className="mt-6 grid grid-cols-3 gap-3 max-w-sm mx-auto">
                <div className="p-3 rounded-[var(--radius)] bg-card border border-border">
                  <p className="text-xl font-bold font-mono">5</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Records</p>
                </div>
                <div className="p-3 rounded-[var(--radius)] bg-card border border-border">
                  <p className="text-xl font-bold font-mono">3</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Processes</p>
                </div>
                <div className="p-3 rounded-[var(--radius)] bg-card border border-border">
                  <p className="text-xl font-bold font-mono">0</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Errors</p>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link to="/dashboard" className="flex items-center gap-2 px-6 py-2.5 rounded-[var(--radius)] bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
                  <BarChart3 className="h-4 w-4" />
                  Import & View Dashboard
                </Link>
                <button onClick={() => setStep(0)} className="px-4 py-2 rounded-[var(--radius)] border border-border text-sm font-medium hover:bg-secondary/50 transition-colors">
                  Upload another file
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-start">
              <button onClick={() => setStep(1)} className="px-4 py-2 rounded-[var(--radius)] border border-border text-sm font-medium hover:bg-secondary/50 transition-colors">Back to mapping</button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}