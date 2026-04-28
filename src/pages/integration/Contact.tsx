import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Send, Check, Calendar, Phone, Mail, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Contact() {
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
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', company: '', lines: '', interest: '', message: '' });

  const update = (field: string, value: string) => setFormData({ ...formData, [field]: value });

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

      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
        {!submitted ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="grid md:grid-cols-5 gap-8">
              {/* Left info */}
              <div className="md:col-span-2">
                <div className="flex items-center gap-3 mb-3">
                  <span className="page-callout">I5</span>
                  <span className="page-eyebrow">Integration · Contact</span>
                </div>
                <h1 className="page-title">Book a walkthrough</h1>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                  Our integration team will help you choose the right data path, plan your rollout, and get connected — all for free.
                </p>

                <div className="mt-8 space-y-4">
                  {[
                    { icon: Calendar, label: '30-minute call', desc: 'Tailored to your setup' },
                    { icon: Clock, label: 'Usually within 24h', desc: 'We respond fast' },
                    { icon: Phone, label: 'Screen-share walkthrough', desc: 'We\'ll show you live' },
                    { icon: Mail, label: 'Follow-up guide', desc: 'Custom integration doc' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius)] bg-secondary flex-shrink-0">
                        <item.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form */}
              <div className="md:col-span-3">
                <div className="rounded-[var(--radius)] border border-border bg-card p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Name</label>
                      <input value={formData.name} onChange={(e) => update('name', e.target.value)} placeholder="Jordan Davis" className="w-full px-3 py-2 rounded-[var(--radius)] border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Email</label>
                      <input value={formData.email} onChange={(e) => update('email', e.target.value)} type="email" placeholder="jordan@company.com" className="w-full px-3 py-2 rounded-[var(--radius)] border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Company</label>
                      <input value={formData.company} onChange={(e) => update('company', e.target.value)} placeholder="Precision Mfg Co." className="w-full px-3 py-2 rounded-[var(--radius)] border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1.5"># of production lines</label>
                      <input value={formData.lines} onChange={(e) => update('lines', e.target.value)} placeholder="e.g. 4" className="w-full px-3 py-2 rounded-[var(--radius)] border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">What are you most interested in?</label>
                    <select value={formData.interest} onChange={(e) => update('interest', e.target.value)} className="w-full px-3 py-2 rounded-[var(--radius)] border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                      <option value="">Select an option...</option>
                      <option>PLC / OPC-UA integration</option>
                      <option>MQTT / IoT sensor setup</option>
                      <option>MES / ERP connection</option>
                      <option>CSV import & manual entry</option>
                      <option>Full platform demo</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Tell us about your setup (optional)</label>
                    <textarea value={formData.message} onChange={(e) => update('message', e.target.value)} placeholder="What PLCs do you use? What metrics matter most? Any existing systems we should know about?" rows={4} className="w-full px-3 py-2 rounded-[var(--radius)] border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <button
                    onClick={() => setSubmitted(true)}
                    className="w-full flex items-center justify-center gap-2 px-6 py-2.5 rounded-[var(--radius)] bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                  >
                    <Send className="h-4 w-4" />
                    Book my walkthrough
                  </button>
                  <p className="text-[11px] text-muted-foreground text-center">No sales pressure. Just help getting connected.</p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-status-ok/15 mx-auto mb-4">
              <Check className="h-8 w-8 text-status-ok" />
            </div>
            <h2 className="text-2xl font-bold">You're booked!</h2>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              We'll reach out within 24 hours to schedule your walkthrough. In the meantime, feel free to explore the platform.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link to="/dashboard" className="px-6 py-2.5 rounded-[var(--radius)] bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
                Explore Dashboard
              </Link>
              <Link to="/" className="px-6 py-2.5 rounded-[var(--radius)] border border-border text-sm font-medium hover:bg-secondary/50 transition-colors">
                Back to home
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}