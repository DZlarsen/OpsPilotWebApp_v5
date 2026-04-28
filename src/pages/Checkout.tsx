import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Lock, CreditCard, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const PLANS = {
  starter: {
    grade: 'G1',
    name: 'Starter',
    price: 49,
    period: '/month',
    desc: 'Single-line operations',
    features: ['2 processes', '1 user', 'SPC charts', 'Kanban board', 'Email alerts'],
  },
  professional: {
    grade: 'G2',
    name: 'Professional',
    price: 149,
    period: '/month',
    desc: 'Growing plants',
    features: ['Unlimited processes', '10 users', 'OEE & Downtime', 'PFMEA & 8D', '5S Audits', 'Taskmaster AI', 'Priority support'],
    highlight: true,
  },
  enterprise: {
    grade: 'G3',
    name: 'Enterprise',
    price: null,
    period: '',
    desc: 'Multi-site operations',
    features: ['Everything in Pro', 'Unlimited users', 'SSO & RBAC', 'API access', 'Dedicated CSM'],
    isCustom: true,
  },
};

type PlanKey = keyof typeof PLANS;

export default function Checkout() {
  const { plan: planParam } = useParams<{ plan: string }>();
  const navigate = useNavigate();
  const planKey = (planParam as PlanKey) in PLANS ? (planParam as PlanKey) : 'professional';
  const plan = PLANS[planKey];

  const [form, setForm] = useState({
    email: '',
    name: '',
    company: '',
    card: '',
    expiry: '',
    cvc: '',
    billing: 'monthly' as 'monthly' | 'annual',
  });
  const [submitted, setSubmitted] = useState(false);

  const annualDiscount = 0.17; // 17% off annual
  const monthlyPrice = plan.price ?? 0;
  const effectivePrice = form.billing === 'annual'
    ? Math.round(monthlyPrice * (1 - annualDiscount))
    : monthlyPrice;
  const annualTotal = effectivePrice * 12;

  const inputClass = 'w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors';
  const labelClass = 'font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-1.5';

  const formatCard = (v: string) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d;
  };

  const handleSubmit = () => {
    if (plan.isCustom) { navigate('/integration/contact'); return; }
    if (!form.email || !form.name || !form.card) return;
    setSubmitted(true);
  };

  const ready = plan.isCustom || (form.email && form.name && form.company && form.card.replace(/\s/g, '').length === 16 && form.expiry.length >= 4 && form.cvc.length >= 3);

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center border-2 border-status-ok bg-status-ok/10 mx-auto mb-6">
            <Check className="h-8 w-8 text-status-ok" strokeWidth={2.5} />
          </div>
          <h1 className="font-display text-4xl mb-3">You're in.</h1>
          <p className="text-muted-foreground mb-2">
            <span className="font-semibold text-foreground">{plan.name}</span> plan activated for <span className="font-semibold text-foreground">{form.company || form.email}</span>.
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-8">
            Confirmation sent to {form.email}
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-mono text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors"
            style={{ borderRadius: 'var(--radius)' }}
          >
            Open Dashboard
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-background/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto max-w-4xl flex h-14 items-center justify-between px-4 sm:px-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <Lock className="h-3 w-3" />
            Secure checkout
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
        <div className="grid md:grid-cols-5 gap-10">

          {/* Left — form */}
          <div className="md:col-span-3 space-y-7">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-1">
                {plan.grade} · {plan.name}
              </p>
              <h1 className="font-display text-4xl leading-tight">
                {plan.isCustom ? 'Talk to our team' : 'Set up your plan'}
              </h1>
            </div>

            {/* Billing toggle */}
            {!plan.isCustom && (
              <div>
                <label className={labelClass}>Billing period</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['monthly', 'annual'] as const).map(b => (
                    <button
                      key={b}
                      onClick={() => setForm(f => ({ ...f, billing: b }))}
                      className={`px-4 py-3 border font-mono text-xs uppercase tracking-wider transition-colors text-left ${
                        form.billing === b
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border text-muted-foreground hover:text-foreground'
                      }`}
                      style={{ borderRadius: 'var(--radius)' }}
                    >
                      <span className="block font-bold">{b === 'monthly' ? 'Monthly' : 'Annual'}</span>
                      {b === 'annual' && (
                        <span className="text-status-ok text-[10px] normal-case tracking-normal">Save {Math.round(annualDiscount * 100)}%</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Account info */}
            <div className="space-y-4">
              <p className={labelClass + ' text-foreground font-semibold'}>Account</p>
              <div>
                <label className={labelClass}>Work email *</label>
                <input
                  className={inputClass}
                  style={{ borderRadius: 'var(--radius)' }}
                  type="email"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Full name *</label>
                  <input
                    className={inputClass}
                    style={{ borderRadius: 'var(--radius)' }}
                    placeholder="Jane Smith"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelClass}>Company</label>
                  <input
                    className={inputClass}
                    style={{ borderRadius: 'var(--radius)' }}
                    placeholder="Acme Manufacturing"
                    value={form.company}
                    onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Payment */}
            {!plan.isCustom && (
              <div className="space-y-4">
                <p className={labelClass + ' text-foreground font-semibold'}>Payment</p>
                <div>
                  <label className={labelClass}>Card number *</label>
                  <div className="relative">
                    <input
                      className={inputClass + ' pr-10'}
                      style={{ borderRadius: 'var(--radius)' }}
                      placeholder="4242 4242 4242 4242"
                      value={form.card}
                      onChange={e => setForm(f => ({ ...f, card: formatCard(e.target.value) }))}
                    />
                    <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Expiry *</label>
                    <input
                      className={inputClass}
                      style={{ borderRadius: 'var(--radius)' }}
                      placeholder="MM / YY"
                      value={form.expiry}
                      onChange={e => setForm(f => ({ ...f, expiry: formatExpiry(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>CVC *</label>
                    <input
                      className={inputClass}
                      style={{ borderRadius: 'var(--radius)' }}
                      placeholder="123"
                      maxLength={4}
                      value={form.cvc}
                      onChange={e => setForm(f => ({ ...f, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!ready}
              className="w-full py-3 bg-primary text-primary-foreground font-mono text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ borderRadius: 'var(--radius)' }}
            >
              {plan.isCustom
                ? 'Request a call →'
                : `Start ${plan.name} — $${effectivePrice}/mo →`}
            </button>

            <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
              <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.75} />
              <span>256-bit SSL. Cancel anytime. No setup fees.</span>
            </div>
          </div>

          {/* Right — order summary */}
          <div className="md:col-span-2">
            <div className="border border-border bg-card p-5 sticky top-24" style={{ borderRadius: 'var(--radius)' }}>
              {/* Corner ticks */}
              <span className="absolute -top-px -left-px h-3 w-3 border-t-2 border-l-2 border-primary" />
              <span className="absolute -bottom-px -right-px h-3 w-3 border-b-2 border-r-2 border-primary" />

              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-4">Order summary</p>

              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-semibold">{plan.name}</p>
                  <p className="text-xs text-muted-foreground">{plan.desc}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl">
                    {plan.isCustom ? 'Custom' : `$${effectivePrice}`}
                  </p>
                  {!plan.isCustom && (
                    <p className="font-mono text-[10px] text-muted-foreground">/month</p>
                  )}
                </div>
              </div>

              {!plan.isCustom && form.billing === 'annual' && (
                <div className="mb-4 px-3 py-2 border border-status-ok/30 bg-status-ok/5 text-xs text-status-ok font-mono">
                  Annual total: ${annualTotal}/yr — saving ${(monthlyPrice - effectivePrice) * 12}/yr
                </div>
              )}

              <div className="border-t border-border/60 pt-4 space-y-2">
                {plan.features.map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs">
                    <Check className="h-3 w-3 text-status-ok flex-shrink-0" strokeWidth={2.5} />
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-border/60">
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                  14-day free trial · No credit card required to try
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
