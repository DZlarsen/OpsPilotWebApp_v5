import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Database, Copy, Check, Terminal, Wifi, ArrowRight, Clock, Shield } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

const codeSnippets = {
  publish: `# Publish a measurement to OpsPilot via MQTT
mosquitto_pub -h mqtt.opspilot.io -p 8883 \\
  -t "opspilot/<your-org>/cnc-mill-a/diameter" \\
  -m '{"value": 25.02, "unit": "mm", "ts": "2026-04-08T08:12:00Z"}' \\
  --cafile ca.crt --cert client.crt --key client.key`,
  webhook: `# Or use a simple HTTP webhook
curl -X POST https://api.opspilot.io/v1/ingest \\
  -H "Authorization: Bearer <your-api-key>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "process": "cnc-mill-a",
    "parameter": "diameter",
    "value": 25.02,
    "unit": "mm",
    "timestamp": "2026-04-08T08:12:00Z"
  }'`,
};

function CodeBlock({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-[var(--radius)] border border-border overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-secondary/30 border-b border-border">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <button
          onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? <Check className="h-3 w-3 text-status-ok" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 text-xs font-mono text-foreground overflow-x-auto bg-card/50 leading-relaxed">{code}</pre>
    </div>
  );
}

export default function MqttGuide() {
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
              <span className="page-callout">I3</span>
              <span className="page-eyebrow">Integration · MQTT</span>
            </div>
            <h1 className="page-title">MQTT / IoT Setup Guide</h1>
            <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mt-3">
              Stream sensor data · Sub-5-second latency into SPC charts
            </p>
          </div>

          {/* Overview cards */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { icon: Clock, label: 'Setup time', value: '1–3 days' },
              { icon: Wifi, label: 'Latency', value: '< 5 sec' },
              { icon: Shield, label: 'Security', value: 'TLS / mTLS' },
            ].map((s) => (
              <div key={s.label} className="p-3 rounded-[var(--radius)] border border-border bg-card/50 text-center">
                <s.icon className="h-4 w-4 text-primary mx-auto mb-1.5" />
                <p className="text-sm font-bold font-mono">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Architecture diagram */}
          <div className="rounded-[var(--radius)] border border-border bg-card/50 p-6 mb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Data Flow</p>
            <div className="flex items-center justify-between gap-2 text-center">
              {[
                { label: 'Sensors / Edge', sub: 'Temperature, vibration, pressure' },
                { label: 'MQTT Broker', sub: 'HiveMQ, Mosquitto, EMQX' },
                { label: 'OpsPilot Ingestion', sub: 'Auto-aggregation & validation' },
                { label: 'Live Dashboards', sub: 'SPC charts, alerts, OEE' },
              ].map((node, i) => (
                <div key={node.label} className="flex items-center gap-2">
                  <div className="p-3 rounded-[var(--radius)] bg-secondary border border-border/50 min-w-[120px]">
                    <p className="text-xs font-semibold">{node.label}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">{node.sub}</p>
                  </div>
                  {i < 3 && <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                </div>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-6 mb-8">
            <h2 className="text-lg font-semibold">Step-by-step setup</h2>

            <div className="space-y-4">
              {[
                { step: '1', title: 'Configure your MQTT broker', desc: 'Set up a broker (cloud-hosted HiveMQ or self-hosted Mosquitto). Create a dedicated topic namespace for OpsPilot, e.g. opspilot/<org>/<process>/<parameter>.' },
                { step: '2', title: 'Generate API credentials', desc: 'In OpsPilot Settings → Integrations, generate an MQTT client certificate or API key. We support TLS 1.3 and mutual TLS for maximum security.' },
                { step: '3', title: 'Map topics to processes', desc: 'Use the integration panel to map each MQTT topic to a process and parameter. Set aggregation rules (raw, 1-min avg, 5-min avg) and units.' },
                { step: '4', title: 'Start publishing', desc: 'Configure your edge gateway or sensors to publish JSON payloads to the mapped topics. Data appears in dashboards within seconds.' },
              ].map((s) => (
                <div key={s.step} className="flex gap-4 items-start">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold flex-shrink-0">{s.step}</div>
                  <div>
                    <h3 className="text-sm font-semibold">{s.title}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Code examples */}
          <div className="space-y-4 mb-8">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Terminal className="h-5 w-5 text-primary" />
              Code examples
            </h2>
            <CodeBlock code={codeSnippets.publish} label="MQTT Publish (mosquitto_pub)" />
            <CodeBlock code={codeSnippets.webhook} label="HTTP Webhook (alternative)" />
          </div>

          {/* CTA */}
          <div className="rounded-[var(--radius)] border border-primary/30 bg-primary/5 p-6 text-center">
            <h3 className="text-lg font-bold">Ready to connect your sensors?</h3>
            <p className="text-sm text-muted-foreground mt-1">Start your free trial and get integration support from our team.</p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <Link to="/dashboard" className="px-6 py-2.5 rounded-[var(--radius)] bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors">
                Start free trial
              </Link>
              <Link to="/integration/contact" className="px-6 py-2.5 rounded-[var(--radius)] border border-border text-sm font-medium hover:bg-secondary/50 transition-colors">
                Talk to engineering
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}