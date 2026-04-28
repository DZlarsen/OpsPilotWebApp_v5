import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, Upload, Smartphone, ArrowRight, Check, Clock, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

const paths = [
  {
    id: 'csv',
    icon: Upload,
    title: 'Upload a spreadsheet',
    time: '5 min',
    desc: 'Got data in Excel or CSV? Drag it in and your dashboards light up instantly.',
    link: '/integration/csv-import',
    cta: 'Open CSV Importer',
  },
  {
    id: 'manual',
    icon: Smartphone,
    title: 'Enter data manually',
    time: '10 min',
    desc: 'No files? No problem. Use our tablet-friendly forms to log your first measurements.',
    link: '/integration/operator-entry',
    cta: 'Try Operator Entry',
  },
  {
    id: 'demo',
    icon: BarChart3,
    title: 'Explore with demo data',
    time: '0 min',
    desc: 'Jump straight into a fully loaded dashboard with sample manufacturing data.',
    link: '/dashboard',
    cta: 'Open Demo Dashboard',
  },
];

export default function QuickStart() {
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
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto max-w-3xl flex h-14 items-center gap-4 px-4 sm:px-6">
          <button onClick={goToIntegration} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Integration
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="flex items-center gap-3 mb-3 justify-center">
            <span className="page-callout">Q1</span>
            <span className="page-eyebrow">Integration · Quick Start</span>
          </div>
          <h1 className="page-title">Quick Start</h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mt-3 max-w-md mx-auto">
            Go from zero to live dashboards in under 10 minutes. Pick the path that fits your situation.
          </p>
        </motion.div>

        <div className="space-y-3">
          {paths.map((path, i) => (
            <motion.div
              key={path.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <button
                onClick={() => setSelected(selected === path.id ? null : path.id)}
                className={`w-full text-left rounded-[var(--radius)] border p-5 transition-all ${
                  selected === path.id ? 'border-primary/40 bg-primary/5 shadow-lg shadow-primary/5' : 'border-border bg-card hover:border-border/80'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-[var(--radius)] transition-colors ${
                    selected === path.id ? 'bg-primary/15' : 'bg-secondary'
                  }`}>
                    <path.icon className={`h-6 w-6 ${selected === path.id ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold">{path.title}</h3>
                      <span className="bp-chip">
                        <Clock className="h-3 w-3" />
                        {path.time}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{path.desc}</p>
                  </div>
                  <ArrowRight className={`h-5 w-5 transition-colors ${selected === path.id ? 'text-primary' : 'text-muted-foreground/30'}`} />
                </div>
              </button>

              {selected === path.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2 ml-16 mr-5"
                >
                  <Link
                    to={path.link}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius)] bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
                  >
                    {path.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom reassurance */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-10 grid grid-cols-3 gap-3 text-center"
        >
          {[
            { icon: Check, label: 'No credit card required' },
            { icon: Check, label: 'Free integration support' },
            { icon: Check, label: '14-day full access trial' },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-1.5 p-3 rounded-[var(--radius)] bg-secondary/30 border border-border/50">
              <item.icon className="h-4 w-4 text-status-ok" />
              <span className="text-[11px] text-muted-foreground font-medium">{item.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}