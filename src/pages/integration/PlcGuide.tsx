import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Wifi, Check, ArrowRight, Clock, Shield, Cpu, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

const compatiblePlcs = [
  { brand: 'Siemens', models: 'S7-300, S7-1200, S7-1500', protocol: 'OPC-UA / S7 Protocol' },
  { brand: 'Allen-Bradley', models: 'ControlLogix, CompactLogix', protocol: 'OPC-UA / EtherNet/IP' },
  { brand: 'Mitsubishi', models: 'iQ-R, iQ-F, FX5', protocol: 'OPC-UA / MC Protocol' },
  { brand: 'Omron', models: 'NX/NJ Series', protocol: 'OPC-UA / FINS' },
  { brand: 'Beckhoff', models: 'TwinCAT 3', protocol: 'OPC-UA / ADS' },
  { brand: 'Schneider', models: 'Modicon M340/M580', protocol: 'OPC-UA / Modbus TCP' },
];

const gateways = [
  { name: 'Kepware KEPServerEX', type: 'Commercial', desc: 'Industry standard. Supports 150+ device drivers. Best for complex multi-vendor environments.', recommended: true },
  { name: 'Inductive Automation Ignition', type: 'Commercial', desc: 'Full SCADA platform with built-in OPC-UA server. Great if you also need HMI/SCADA.' },
  { name: 'Node-OPCUA', type: 'Open Source', desc: 'Free Node.js-based OPC-UA toolkit. Good for simple setups or custom integrations.' },
  { name: 'Eclipse Milo', type: 'Open Source', desc: 'Java-based OPC-UA stack. Enterprise-grade and well-documented.' },
];

export default function PlcGuide() {
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
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="page-callout">I4</span>
              <span className="page-eyebrow">Integration · PLC</span>
            </div>
            <h1 className="page-title">PLC / OPC-UA Integration</h1>
            <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mt-3">
              Connect directly to your machines · Bridge via Kepware or Ignition
            </p>
          </div>

          {/* Overview */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { icon: Clock, label: 'Setup time', value: '3–5 days' },
              { icon: Cpu, label: 'Supported PLCs', value: '6+ brands' },
              { icon: Shield, label: 'Security', value: 'OPC-UA Encrypted' },
            ].map((s) => (
              <div key={s.label} className="p-3 rounded-[var(--radius)] border border-border bg-card/50 text-center">
                <s.icon className="h-4 w-4 text-primary mx-auto mb-1.5" />
                <p className="text-sm font-bold font-mono">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Architecture */}
          <div className="rounded-[var(--radius)] border border-border bg-card/50 p-6 mb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Architecture</p>
            <div className="flex items-center justify-between gap-2 text-center flex-wrap">
              {[
                { label: 'Your PLCs', sub: 'Siemens, AB, Mitsubishi...' },
                { label: 'OPC-UA Gateway', sub: 'Kepware, Ignition, etc.' },
                { label: 'OpsPilot REST API', sub: 'Secure HTTPS ingestion' },
                { label: 'Live Dashboards', sub: 'SPC, OEE, Alerts' },
              ].map((node, i) => (
                <div key={node.label} className="flex items-center gap-2">
                  <div className="p-3 rounded-[var(--radius)] bg-secondary border border-border/50 min-w-[110px]">
                    <p className="text-xs font-semibold">{node.label}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">{node.sub}</p>
                  </div>
                  {i < 3 && <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                </div>
              ))}
            </div>
          </div>

          {/* Compatible PLCs */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              Compatible PLCs
            </h2>
            <div className="rounded-[var(--radius)] border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Brand</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Models</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Protocol</th>
                  </tr>
                </thead>
                <tbody>
                  {compatiblePlcs.map((plc) => (
                    <tr key={plc.brand} className="border-b border-border/50 hover:bg-secondary/20">
                      <td className="px-4 py-2.5 font-medium">{plc.brand}</td>
                      <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">{plc.models}</td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">{plc.protocol}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recommended gateways */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Recommended OPC-UA Gateways
            </h2>
            <div className="space-y-3">
              {gateways.map((gw) => (
                <div key={gw.name} className={`p-4 rounded-[var(--radius)] border ${gw.recommended ? 'border-primary/40 bg-primary/5' : 'border-border bg-card/50'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold">{gw.name}</span>
                    <span className="bp-chip">{gw.type}</span>
                    {gw.recommended && <span className="bp-chip bp-chip-primary">Recommended</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{gw.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Setup steps</h2>
            <div className="space-y-3">
              {[
                { step: '1', title: 'Install your OPC-UA gateway', desc: 'Deploy Kepware or Ignition on a server with network access to your PLCs. Configure device channels for each PLC.' },
                { step: '2', title: 'Select tags to monitor', desc: 'Browse the OPC-UA tag tree and select the tags you want to track — cycle time, temperature, pressure, part counts, etc.' },
                { step: '3', title: 'Configure the REST push', desc: 'Set up a REST client plugin (or a lightweight script) to push tag values to OpsPilot\'s API at your desired interval (1s, 5s, 1min).' },
                { step: '4', title: 'Map tags to OpsPilot processes', desc: 'In the OpsPilot integration panel, map each incoming tag to a process and parameter. Control limits auto-apply.' },
                { step: '5', title: 'Validate & go live', desc: 'Check live data in your dashboards. Our team validates the connection end-to-end before you go live.' },
              ].map((s) => (
                <div key={s.step} className="flex gap-4 items-start p-3 rounded-[var(--radius)] bg-secondary/20 border border-border/50">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold flex-shrink-0">{s.step}</div>
                  <div>
                    <h3 className="text-sm font-semibold">{s.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="rounded-[var(--radius)] border border-primary/30 bg-primary/5 p-6 text-center">
            <h3 className="text-lg font-bold">Need help connecting your PLCs?</h3>
            <p className="text-sm text-muted-foreground mt-1">Our integration engineers will walk you through the setup — free for all plans.</p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <Link to="/dashboard" className="px-6 py-2.5 rounded-[var(--radius)] bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors">
                Start free trial
              </Link>
              <Link to="/integration/contact" className="px-6 py-2.5 rounded-[var(--radius)] border border-border text-sm font-medium hover:bg-secondary/50 transition-colors">
                Book a walkthrough
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}