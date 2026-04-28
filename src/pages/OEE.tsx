import { useState, useMemo } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line, ReferenceLine,
  ComposedChart, Legend,
} from 'recharts';

// ── Semicircle gauge ─────────────────────────────────────────────────────────
function OEEGauge({ value, label, color }: { value: number; label: string; color: string }) {
  const circumference = Math.PI * 60;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="82" viewBox="0 0 140 82">
        <path d="M 10 76 A 60 60 0 0 1 130 76" fill="none" stroke="hsl(var(--secondary))" strokeWidth="10" strokeLinecap="round" />
        <path d="M 10 76 A 60 60 0 0 1 130 76" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-1000" />
        <text x="70" y="66" textAnchor="middle" fill="currentColor" fontSize="16" fontWeight="bold" fontFamily="monospace">{value.toFixed(1)}%</text>
      </svg>
      <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground mt-1">{label}</span>
    </div>
  );
}

// ── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ data, color }: { data: number[]; color: string }) {
  return (
    <ResponsiveContainer width={64} height={24}>
      <LineChart data={data.map((v, i) => ({ i, v }))} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
// Deterministic pseudo-random: mixes seed + weekOffset + day so every
// (process, week, day) triple produces a unique, stable value in [0, 1)
function prng(seed: number, week: number, day: number): number {
  // xorshift-ish mix — large primes to spread bits
  let h = seed * 2654435761 ^ week * 40503 ^ day * 6700417;
  h ^= h >>> 16; h = Math.imul(h, 0x45d9f3b);
  h ^= h >>> 16; h = Math.imul(h, 0x45d9f3b);
  h ^= h >>> 16;
  return (h >>> 0) / 0xffffffff;
}

// Weekly "personality" — makes each process have a slowly evolving baseline
// so navigating back in time feels realistic (gradual improvement or degradation)
function weeklyBaseline(seed: number, weekOffset: number): { avail: number; perf: number; qual: number } {
  // Longer-period sinusoidal drift per metric — different frequencies per process
  const w = weekOffset;
  const f1 = prng(seed, 999, 1) * 0.4 + 0.1;   // drift frequency
  const f2 = prng(seed, 999, 2) * 0.4 + 0.1;
  const f3 = prng(seed, 999, 3) * 0.4 + 0.1;
  const phase1 = prng(seed, 999, 4) * Math.PI * 2;
  const phase2 = prng(seed, 999, 5) * Math.PI * 2;
  const phase3 = prng(seed, 999, 6) * Math.PI * 2;

  // Base capability spread per process
  const baseAvail = 80 + prng(seed, 998, 1) * 15;
  const basePerf  = 76 + prng(seed, 998, 2) * 18;
  const baseQual  = 88 + prng(seed, 998, 3) * 10;

  return {
    avail: Math.min(99, Math.max(60, baseAvail + Math.sin(w * f1 + phase1) * 6)),
    perf:  Math.min(99, Math.max(58, basePerf  + Math.sin(w * f2 + phase2) * 7)),
    qual:  Math.min(99, Math.max(75, baseQual  + Math.sin(w * f3 + phase3) * 4)),
  };
}

function buildWeek(seed: number, weekOffset = 0) {
  const base = weeklyBaseline(seed, weekOffset);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i) - weekOffset * 7);

    // Day-level noise on top of weekly baseline — unique per (seed, week, day)
    const dailyNoiseAvail = (prng(seed, weekOffset, i * 3 + 0) - 0.5) * 10;
    const dailyNoisePerf  = (prng(seed, weekOffset, i * 3 + 1) - 0.5) * 12;
    const dailyNoiseQual  = (prng(seed, weekOffset, i * 3 + 2) - 0.5) * 6;

    const avail = Math.min(99, Math.max(55, base.avail + dailyNoiseAvail));
    const perf  = Math.min(99, Math.max(55, base.perf  + dailyNoisePerf));
    const qual  = Math.min(99, Math.max(70, base.qual  + dailyNoiseQual));
    const oee   = (avail * perf * qual) / 10000;

    // Loss categories — also vary meaningfully by week
    const lScale = 1 + (prng(seed, weekOffset, i + 100) - 0.5) * 0.6;
    return {
      day:   d.toLocaleDateString('en', { weekday: 'short' }),
      date:  d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      oee:          parseFloat(oee.toFixed(1)),
      avail:        parseFloat(avail.toFixed(1)),
      perf:         parseFloat(perf.toFixed(1)),
      qual:         parseFloat(qual.toFixed(1)),
      plannedDT:    parseFloat((2 + prng(seed, weekOffset, i*7+10) * 4 * lScale).toFixed(1)),
      unplannedDT:  parseFloat((1 + prng(seed, weekOffset, i*7+11) * 5 * lScale).toFixed(1)),
      setupLoss:    parseFloat((0.5 + prng(seed, weekOffset, i*7+12) * 3 * lScale).toFixed(1)),
      speedLoss:    parseFloat((1 + prng(seed, weekOffset, i*7+13) * 5 * lScale).toFixed(1)),
      minorStop:    parseFloat((0.5 + prng(seed, weekOffset, i*7+14) * 3 * lScale).toFixed(1)),
      scrap:        parseFloat((0.3 + prng(seed, weekOffset, i*7+15) * 2 * lScale).toFixed(1)),
      dayShift:     parseFloat((oee + (prng(seed, weekOffset, i*7+16) - 0.4) * 6).toFixed(1)),
      nightShift:   parseFloat((oee - (prng(seed, weekOffset, i*7+17) - 0.3) * 8).toFixed(1)),
    };
  });
}

const oeeColor = (v: number) => v >= 85 ? 'hsl(var(--status-ok))' : v >= 65 ? 'hsl(var(--status-warning))' : 'hsl(var(--status-critical))';
const oeeLabel = (v: number) => v >= 85 ? 'World Class' : v >= 65 ? 'Average' : 'Low';
const oeeChip  = (v: number) => v >= 85 ? 'status-badge-ok' : v >= 65 ? 'status-badge-warning' : 'status-badge-critical';
const TT = { background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 4, fontSize: 11, color: 'hsl(var(--popover-foreground))' };

function reportHTML(biz: string, week: string, lines: any[], avgO: number, avgA: number, avgP: number, avgQ: number, losses: any[]) {
  const rows = lines.map((l: any) => `<tr><td>${l.name}</td><td>${l.avail.toFixed(1)}%</td><td>${l.perf.toFixed(1)}%</td><td>${l.qual.toFixed(1)}%</td><td><strong>${l.oee.toFixed(1)}%</strong></td><td>${oeeLabel(l.oee)}</td></tr>`).join('');
  const lossRows = losses.map((l: any) => `<tr><td>${l.name}</td><td>${l.value.toFixed(1)}%</td></tr>`).join('');
  return `<!DOCTYPE html><html><head><title>OEE Weekly Report — ${biz}</title>
<style>body{font-family:Arial,sans-serif;max-width:900px;margin:40px auto;color:#1a1a2e;font-size:13px}h1{font-size:22px;border-bottom:3px solid #0ea5e9;padding-bottom:8px}h2{font-size:13px;color:#555;margin:24px 0 8px;text-transform:uppercase;letter-spacing:.1em}.meta{color:#777;font-size:11px;margin-bottom:24px}.kpi{display:inline-block;border:1px solid #e5e7eb;padding:12px 20px;border-radius:4px;text-align:center;margin:0 8px 12px 0}.kpi-val{font-size:28px;font-weight:bold;font-family:monospace;color:#0ea5e9}.kpi-label{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#888;margin-top:4px}table{width:100%;border-collapse:collapse;margin-bottom:20px}th{background:#f3f4f6;text-align:left;padding:8px 10px;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#555;border-bottom:2px solid #e5e7eb}td{padding:8px 10px;border-bottom:1px solid #f0f0f0}.footer{margin-top:32px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:10px;color:#aaa;display:flex;justify-content:space-between}</style>
</head><body>
<h1>OEE Weekly Report</h1>
<div class="meta">${biz} &nbsp;·&nbsp; Week of ${week} &nbsp;·&nbsp; Generated ${new Date().toLocaleDateString()}</div>
<div><div class="kpi"><div class="kpi-val">${avgO.toFixed(1)}%</div><div class="kpi-label">Overall OEE</div></div><div class="kpi"><div class="kpi-val">${avgA.toFixed(1)}%</div><div class="kpi-label">Availability</div></div><div class="kpi"><div class="kpi-val">${avgP.toFixed(1)}%</div><div class="kpi-label">Performance</div></div><div class="kpi"><div class="kpi-val">${avgQ.toFixed(1)}%</div><div class="kpi-label">Quality</div></div></div>
<h2>OEE by Process Line</h2><table><thead><tr><th>Line</th><th>Availability</th><th>Performance</th><th>Quality</th><th>OEE</th><th>Rating</th></tr></thead><tbody>${rows}</tbody></table>
<h2>Six Big Losses — Weekly Average</h2><table><thead><tr><th>Loss Category</th><th>% of Time</th></tr></thead><tbody>${lossRows}</tbody></table>
<div class="footer"><span>OpsPilot · OEE Weekly Report</span><span>Confidential</span></div></body></html>`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function OEE() {
  const { processes, activeBusiness } = useBusiness();
  const [weekOffset, setWeekOffset] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview'|'losses'|'shifts'|'lines'>('overview');
  const [drillLine, setDrillLine] = useState<string|null>(null);

  const processData = useMemo(() => processes.map(p => {
    const seed = p.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const week = buildWeek(seed, weekOffset);
    const avg = (k: keyof typeof week[0]) => week.reduce((s, d) => s + (d[k] as number), 0) / 7;
    return {
      id: p.id, name: p.name.split('—')[0].trim(), week,
      oee: parseFloat(avg('oee').toFixed(1)), avail: parseFloat(avg('avail').toFixed(1)),
      perf: parseFloat(avg('perf').toFixed(1)), qual: parseFloat(avg('qual').toFixed(1)),
      sparkline: week.map(d => d.oee),
      mtbf: parseFloat((24 / (1 + Math.abs(Math.sin(seed * 99)) * 3)).toFixed(1)),
      mttr: parseFloat((0.5 + Math.abs(Math.sin(seed * 77)) * 2).toFixed(1)),
    };
  }), [processes, weekOffset]);

  const n = processData.length || 1;
  const avgOEE   = processData.reduce((s, d) => s + d.oee, 0) / n;
  const avgAvail = processData.reduce((s, d) => s + d.avail, 0) / n;
  const avgPerf  = processData.reduce((s, d) => s + d.perf, 0) / n;
  const avgQual  = processData.reduce((s, d) => s + d.qual, 0) / n;

  const trendData = useMemo(() => {
    if (!processData[0]) return [];
    return processData[0].week.map((_, i) => ({
      day: processData[0].week[i].day,
      oee:   parseFloat((processData.reduce((s,p) => s+p.week[i].oee,0)/n).toFixed(1)),
      avail: parseFloat((processData.reduce((s,p) => s+p.week[i].avail,0)/n).toFixed(1)),
      perf:  parseFloat((processData.reduce((s,p) => s+p.week[i].perf,0)/n).toFixed(1)),
      qual:  parseFloat((processData.reduce((s,p) => s+p.week[i].qual,0)/n).toFixed(1)),
    }));
  }, [processData, n]);

  const lossData = useMemo(() => {
    if (!processData[0]) return [];
    const avg = (k: keyof typeof processData[0]['week'][0]) =>
      parseFloat((processData.reduce((s,p) => s + p.week.reduce((ss,d) => ss+(d[k] as number),0)/7, 0)/n).toFixed(1));
    return [
      { name:'Planned Downtime',   value:avg('plannedDT'),   fill:'hsl(var(--muted-foreground))' },
      { name:'Unplanned Downtime', value:avg('unplannedDT'), fill:'hsl(var(--status-critical))' },
      { name:'Setup / Changeover', value:avg('setupLoss'),   fill:'hsl(var(--chart-orange))' },
      { name:'Speed Loss',         value:avg('speedLoss'),   fill:'hsl(var(--status-warning))' },
      { name:'Minor Stoppages',    value:avg('minorStop'),   fill:'hsl(var(--chart-blue))' },
      { name:'Scrap / Rework',     value:avg('scrap'),       fill:'hsl(var(--chart-purple))' },
    ];
  }, [processData, n]);

  const shiftData = useMemo(() => {
    if (!processData[0]) return [];
    return processData[0].week.map((_,i) => ({
      day: processData[0].week[i].day,
      Day:   parseFloat((processData.reduce((s,p)=>s+p.week[i].dayShift,0)/n).toFixed(1)),
      Night: parseFloat((processData.reduce((s,p)=>s+p.week[i].nightShift,0)/n).toFixed(1)),
    }));
  }, [processData, n]);

  const drillData = drillLine ? processData.find(p => p.id === drillLine) : null;

  const ws = new Date(); ws.setDate(ws.getDate() - 6 - weekOffset*7);
  const we = new Date(); we.setDate(we.getDate() - weekOffset*7);
  const weekLabel = `${ws.toLocaleDateString('en',{month:'short',day:'numeric'})} – ${we.toLocaleDateString('en',{month:'short',day:'numeric',year:'numeric'})}`;

  const oeeVsPrior = useMemo(() => processData.reduce((s,p) => {
    const seed = p.id.split('').reduce((a,c) => a+c.charCodeAt(0),0);
    const prior = buildWeek(seed, weekOffset+1);
    return s + prior.reduce((ss,d)=>ss+d.oee,0)/7;
  },0)/n, [processData, weekOffset, n]);
  const oeeDelta = parseFloat((avgOEE - oeeVsPrior).toFixed(1));

  const downloadReport = () => {
    const html = reportHTML(activeBusiness.name, weekLabel, processData, avgOEE, avgAvail, avgPerf, avgQual, lossData);
    const w = window.open(URL.createObjectURL(new Blob([html],{type:'text/html'})), '_blank');
    if (w) setTimeout(()=>w.print(),500);
  };

  const tabs = [
    {id:'overview',label:'Overview'},
    {id:'losses',  label:'Six Big Losses'},
    {id:'shifts',  label:'Shift Comparison'},
    {id:'lines',   label:'By Line'},
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="page-header flex items-center gap-3 mb-2">
            <span className="page-callout">02</span>
            <span className="page-eyebrow">Production · OEE</span>
          </div>
          <h1 className="page-title">OEE Dashboard</h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mt-2">
            {activeBusiness.name} · Overall Equipment Effectiveness
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 border border-border bg-secondary/30 px-3 py-1.5" style={{borderRadius:'var(--radius)'}}>
            <button onClick={()=>setWeekOffset(o=>o+1)} className="text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] min-w-[140px] text-center">
              {weekOffset===0?'This week':weekOffset===1?'Last week':`${weekOffset}w ago`}
            </span>
            <button onClick={()=>setWeekOffset(o=>Math.max(0,o-1))} disabled={weekOffset===0}
              className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <button onClick={downloadReport}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-mono text-[11px] font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors"
            style={{borderRadius:'var(--radius)'}}>
            <Download className="h-3.5 w-3.5" /> Weekly Report
          </button>
        </div>
      </div>

      {/* Week indicator */}
      <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        <span>{weekLabel}</span>
        {oeeDelta!==0 && (
          <span className={oeeDelta>0?'text-status-ok':'text-status-critical'}>
            {oeeDelta>0?'▲':'▼'} {Math.abs(oeeDelta)}pp vs prior week
          </span>
        )}
      </div>

      {/* Gauges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
        {[
          {val:avgOEE,   label:'Overall OEE',   color:oeeColor(avgOEE),          note:oeeLabel(avgOEE)},
          {val:avgAvail, label:'Availability',   color:'hsl(var(--chart-blue))',  note:'Operating / Planned time'},
          {val:avgPerf,  label:'Performance',    color:'hsl(var(--chart-purple))',note:'Ideal / Actual cycle time'},
          {val:avgQual,  label:'Quality',        color:'hsl(var(--status-ok))',   note:'Good count / Total count'},
        ].map(({val,label,color,note})=>(
          <div key={label} className="bg-card flex flex-col items-center py-5 px-2">
            <OEEGauge value={val} label={label} color={color} />
            <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/70 text-center mt-1 px-2">{note}</span>
          </div>
        ))}
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)}
            className={`px-4 py-2 font-mono text-[11px] uppercase tracking-[0.15em] border-b-2 -mb-px transition-colors ${
              activeTab===t.id?'border-primary text-primary':'border-transparent text-muted-foreground hover:text-foreground'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {activeTab==='overview' && (
        <div className="space-y-4">
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="kpi-card lg:col-span-2">
              <h3 className="section-header mb-4">7-Day OEE Trend</h3>
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{fontSize:11,fill:'hsl(var(--muted-foreground))'}} />
                  <YAxis domain={[50,100]} tick={{fontSize:11,fill:'hsl(var(--muted-foreground))'}} />
                  <Tooltip contentStyle={TT} />
                  <ReferenceLine y={85} stroke="hsl(var(--status-ok))" strokeDasharray="4 4"
                    label={{value:'World Class',position:'right',fill:'hsl(var(--status-ok))',fontSize:9}} />
                  <Area type="monotone" dataKey="oee" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.12)" strokeWidth={2} name="OEE %" />
                  <Line type="monotone" dataKey="avail" stroke="hsl(var(--chart-blue))"   strokeWidth={1.5} strokeDasharray="5 4" dot={false} name="Availability" />
                  <Line type="monotone" dataKey="perf"  stroke="hsl(var(--chart-purple))" strokeWidth={1.5} strokeDasharray="5 4" dot={false} name="Performance" />
                  <Line type="monotone" dataKey="qual"  stroke="hsl(var(--status-ok))"    strokeWidth={1.5} strokeDasharray="5 4" dot={false} name="Quality" />
                  <Legend iconSize={10} wrapperStyle={{fontSize:11}} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="kpi-card space-y-4">
              <h3 className="section-header">Reliability · Avg</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {label:'MTBF',value:`${(processData.reduce((s,p)=>s+p.mtbf,0)/n).toFixed(1)}h`,desc:'Mean time between failures'},
                  {label:'MTTR',value:`${(processData.reduce((s,p)=>s+p.mttr,0)/n).toFixed(1)}h`,desc:'Mean time to repair'},
                ].map(m=>(
                  <div key={m.label} className="border border-border bg-background/40 p-3" style={{borderRadius:'var(--radius)'}}>
                    <p className="bp-tile-label">{m.label}</p>
                    <p className="bp-tile-value text-2xl mt-1">{m.value}</p>
                    <p className="font-mono text-[9px] text-muted-foreground mt-1">{m.desc}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-border/60 pt-3 space-y-2">
                <p className="section-header">Top opportunities</p>
                {[...processData].sort((a,b)=>a.oee-b.oee).slice(0,3).map((p,i)=>(
                  <div key={p.id} className="flex items-center gap-2">
                    <span className="font-mono text-[9px] text-muted-foreground w-4">{i+1}.</span>
                    <span className="text-xs flex-1 truncate">{p.name}</span>
                    <span className="font-mono text-xs font-bold" style={{color:oeeColor(p.oee)}}>{p.oee}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Losses ── */}
      {activeTab==='losses' && (
        <div className="grid lg:grid-cols-5 gap-4">
          <div className="kpi-card lg:col-span-2">
            <h3 className="section-header mb-2">Loss Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={lossData} dataKey="value" cx="50%" cy="50%" innerRadius={48} outerRadius={76} paddingAngle={2}>
                  {lossData.map((e,i)=><Cell key={i} fill={e.fill}/>)}
                </Pie>
                <Tooltip contentStyle={TT}/>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {lossData.map(d=>(
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <div className="h-2 w-2 flex-shrink-0 rounded-full" style={{background:d.fill}}/>
                  <span className="flex-1 text-muted-foreground">{d.name}</span>
                  <span className="font-mono font-bold">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="kpi-card lg:col-span-3">
            <h3 className="section-header mb-2">Daily Loss Profile</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={processData[0]?.week.map((_,i)=>({
                day:processData[0].week[i].day,
                'Planned DT':   parseFloat((processData.reduce((s,p)=>s+p.week[i].plannedDT,0)).toFixed(1)),
                'Unplanned DT': parseFloat((processData.reduce((s,p)=>s+p.week[i].unplannedDT,0)).toFixed(1)),
                'Speed Loss':   parseFloat((processData.reduce((s,p)=>s+p.week[i].speedLoss,0)).toFixed(1)),
                'Minor Stops':  parseFloat((processData.reduce((s,p)=>s+p.week[i].minorStop,0)).toFixed(1)),
                'Scrap':        parseFloat((processData.reduce((s,p)=>s+p.week[i].scrap,0)).toFixed(1)),
              }))} margin={{top:10,right:10,left:0,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
                <XAxis dataKey="day" tick={{fontSize:11,fill:'hsl(var(--muted-foreground))'}}/>
                <YAxis tick={{fontSize:11,fill:'hsl(var(--muted-foreground))'}}/>
                <Tooltip contentStyle={TT}/>
                <Legend iconSize={10} wrapperStyle={{fontSize:11}}/>
                <Bar dataKey="Planned DT"   stackId="a" fill="hsl(var(--muted-foreground))"/>
                <Bar dataKey="Unplanned DT" stackId="a" fill="hsl(var(--status-critical))"/>
                <Bar dataKey="Speed Loss"   stackId="a" fill="hsl(var(--status-warning))"/>
                <Bar dataKey="Minor Stops"  stackId="a" fill="hsl(var(--chart-blue))"/>
                <Bar dataKey="Scrap"        stackId="a" fill="hsl(var(--chart-purple))" radius={[2,2,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Shifts ── */}
      {activeTab==='shifts' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="kpi-card">
            <h3 className="section-header mb-3">Day vs Night · OEE %</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={shiftData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
                <XAxis dataKey="day" tick={{fontSize:11,fill:'hsl(var(--muted-foreground))'}}/>
                <YAxis domain={[50,100]} tick={{fontSize:11,fill:'hsl(var(--muted-foreground))'}}/>
                <Tooltip contentStyle={TT}/>
                <Legend iconSize={10} wrapperStyle={{fontSize:11}}/>
                <ReferenceLine y={85} stroke="hsl(var(--status-ok))" strokeDasharray="4 4"/>
                <Bar dataKey="Day"   fill="hsl(var(--primary))"      radius={[2,2,0,0]}/>
                <Bar dataKey="Night" fill="hsl(var(--chart-purple))" radius={[2,2,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="kpi-card">
            <h3 className="section-header mb-3">Shift Summary</h3>
            <table className="data-table">
              <thead>
                <tr><th>Day</th><th className="text-right">Day Shift</th><th className="text-right">Night Shift</th><th className="text-right">Gap</th></tr>
              </thead>
              <tbody>
                {shiftData.map(row=>{
                  const gap = parseFloat((row.Day-row.Night).toFixed(1));
                  return (
                    <tr key={row.day}>
                      <td className="font-mono text-xs">{row.day}</td>
                      <td className="text-right font-mono text-sm font-bold" style={{color:oeeColor(row.Day)}}>{row.Day}%</td>
                      <td className="text-right font-mono text-sm font-bold" style={{color:oeeColor(row.Night)}}>{row.Night}%</td>
                      <td className="text-right">
                        <span className={`font-mono text-xs ${gap>2?'text-status-critical':gap<-2?'text-status-ok':'text-muted-foreground'}`}>
                          {gap>0?'+':''}{gap}pp
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground mt-4">
              Gaps {'>'} 3pp between shifts may indicate operator training or handoff issues.
            </p>
          </div>
        </div>
      )}

      {/* ── Lines ── */}
      {activeTab==='lines' && (
        <div className="space-y-4">
          <div className="kpi-card">
            <h3 className="section-header mb-3">OEE by Process Line — click to drill down</h3>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Process Line</th>
                    <th className="text-right">Avail</th>
                    <th className="text-right">Perf</th>
                    <th className="text-right">Quality</th>
                    <th className="text-right">OEE</th>
                    <th>Trend</th>
                    <th className="text-right">MTBF</th>
                    <th className="text-right">MTTR</th>
                    <th className="text-right">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {processData.map(row=>(
                    <tr key={row.id} onClick={()=>setDrillLine(drillLine===row.id?null:row.id)}
                      className={`cursor-pointer transition-colors ${drillLine===row.id?'bg-primary/5':'hover:bg-secondary/30'}`}>
                      <td className="font-medium text-sm">{row.name}</td>
                      <td className="text-right font-mono text-sm">{row.avail}%</td>
                      <td className="text-right font-mono text-sm">{row.perf}%</td>
                      <td className="text-right font-mono text-sm">{row.qual}%</td>
                      <td className="text-right font-mono text-sm font-bold" style={{color:oeeColor(row.oee)}}>{row.oee}%</td>
                      <td><Sparkline data={row.sparkline} color={oeeColor(row.oee)}/></td>
                      <td className="text-right font-mono text-xs text-muted-foreground">{row.mtbf}h</td>
                      <td className="text-right font-mono text-xs text-muted-foreground">{row.mttr}h</td>
                      <td className="text-right"><span className={oeeChip(row.oee)}>{oeeLabel(row.oee)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {drillData && (
            <div className="kpi-card" style={{borderColor:'hsl(var(--primary)/0.3)'}}>
              <div className="flex items-center gap-3 mb-4">
                <span className="page-callout text-[10px] h-5 w-5">↓</span>
                <h3 className="font-semibold">{drillData.name} · Drilldown</h3>
                <span className="font-mono text-[10px] text-muted-foreground ml-auto">{weekLabel}</span>
              </div>
              <div className="grid lg:grid-cols-2 gap-4">
                <div>
                  <p className="section-header mb-2">Daily A · P · Q</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={drillData.week} barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
                      <XAxis dataKey="day" tick={{fontSize:10,fill:'hsl(var(--muted-foreground))'}}/>
                      <YAxis domain={[50,100]} tick={{fontSize:10,fill:'hsl(var(--muted-foreground))'}}/>
                      <Tooltip contentStyle={TT}/>
                      <Bar dataKey="avail" name="Avail" fill="hsl(var(--chart-blue))"   radius={[2,2,0,0]}/>
                      <Bar dataKey="perf"  name="Perf"  fill="hsl(var(--chart-purple))" radius={[2,2,0,0]}/>
                      <Bar dataKey="qual"  name="Qual"  fill="hsl(var(--status-ok))"    radius={[2,2,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <p className="section-header mb-2">OEE over the week</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={drillData.week}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
                      <XAxis dataKey="day" tick={{fontSize:10,fill:'hsl(var(--muted-foreground))'}}/>
                      <YAxis domain={[50,100]} tick={{fontSize:10,fill:'hsl(var(--muted-foreground))'}}/>
                      <Tooltip contentStyle={TT}/>
                      <ReferenceLine y={85} stroke="hsl(var(--status-ok))" strokeDasharray="4 4"/>
                      <Area type="monotone" dataKey="oee" stroke={oeeColor(drillData.oee)}
                        fill={oeeColor(drillData.oee)} fillOpacity={0.12} strokeWidth={2} name="OEE %"/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
