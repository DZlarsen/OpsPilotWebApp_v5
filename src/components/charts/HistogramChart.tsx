import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell, ReferenceLine } from 'recharts';
import type { Process } from '@/data/mock-data';

interface HistogramChartProps {
  height?: number;
  process?: Process;
}

function seedFromId(id: string | undefined): number {
  if (!id) return 0.5;
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  return Math.abs(h) / 0xffffffff;
}

// Per-process-id character: skew, bias, noise amplification
const processCharacter: Record<string, { skew: number; bias: number; noiseAmp: number }> = {
  'proc-001': { skew:  0,    bias:  0,    noiseAmp: 1.0 },   // CNC — centered
  'proc-002': { skew:  0.3,  bias:  0.4,  noiseAmp: 1.4 },   // Injection — right skew (flash direction)
  'proc-003': { skew:  0.5,  bias:  0.2,  noiseAmp: 1.6 },   // Assembly — defect heavy right tail
  'proc-004': { skew: -0.2,  bias: -0.3,  noiseAmp: 1.1 },   // Packaging — slight left bias
  'batt-001': { skew:  0.2,  bias:  0.3,  noiseAmp: 1.2 },   // Cathode coating — positive bias
  'batt-002': { skew:  0.3,  bias:  0,    noiseAmp: 1.1 },   // Stacking offset — positive skew
  'batt-003': { skew: -0.1,  bias: -0.05, noiseAmp: 0.9 },   // Electrolyte — tight, slight under-fill
  'batt-004': { skew: -0.4,  bias: -0.5,  noiseAmp: 1.3 },   // Formation — skewing low (bad)
  'batt-005': { skew:  0,    bias:  0,    noiseAmp: 1.0 },   // Module torque — centered
  'batt-006': { skew:  0.3,  bias:  0.15, noiseAmp: 1.5 },   // Pack testing — right skew
};

const generateHistogramData = (process: Process | undefined, tick: number) => {
  if (!process) return [];
  const character = processCharacter[process.id] || { skew: 0, bias: 0, noiseAmp: 1 };
  const target = process.targetMetric;
  const halfRange = Math.max(process.ucl - target, target - process.lcl);
  // Bin width is 1/5 of half-range so 10 bins span ±2×halfRange
  const binWidth = (halfRange * 2) / 10;
  const spread = halfRange * 0.45 * character.noiseAmp; // sigma-ish
  const seed = seedFromId(process.id);
  const numBins = 10;
  const bins: { range: string; count: number; midpoint: number }[] = [];

  // Precision for label display
  const decimals = binWidth < 0.01 ? 3 : binWidth < 0.1 ? 2 : binWidth < 1 ? 2 : 1;

  for (let i = 0; i < numBins; i++) {
    const start = target - (numBins / 2) * binWidth + i * binWidth;
    const mid = start + binWidth / 2;
    const distFromCenter = mid - (target + character.bias * halfRange * 0.3);
    const z = distFromCenter / spread;
    // Skew via exponential adjustment
    const skewAdjustment = character.skew * distFromCenter / halfRange;
    const base = 36 * Math.exp(-0.5 * z * z - skewAdjustment * 0.6);
    const noise = (Math.sin(seed * 100 + tick + i * 0.7) + 1) * 2;
    const count = Math.max(0, Math.round(base + noise));
    bins.push({
      range: start.toFixed(decimals),
      count,
      midpoint: mid,
    });
  }
  return bins;
};

export default function HistogramChart({ height = 250, process }: HistogramChartProps) {
  const [tick, setTick] = useState(0);
  const data = useMemo(() => generateHistogramData(process, tick), [process, tick]);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 5000);
    return () => clearInterval(interval);
  }, []);

  if (!process) return null;

  const target = process.targetMetric;
  const halfRange = Math.max(process.ucl - target, target - process.lcl);
  const decimals = (halfRange / 10) < 0.01 ? 3 : (halfRange / 10) < 0.1 ? 2 : (halfRange / 10) < 1 ? 2 : 1;
  const warnDist = halfRange * 0.55;
  const critDist = halfRange * 0.85;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 30, right: 15, left: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 16%, 14%)" />
        <XAxis dataKey="range" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 9 }} axisLine={{ stroke: 'hsl(220, 16%, 18%)' }} interval={1} />
        <YAxis tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 10 }} axisLine={{ stroke: 'hsl(220, 16%, 18%)' }} />
        <Tooltip contentStyle={{ background: 'hsl(220, 18%, 12%)', border: '1px solid hsl(220, 16%, 18%)', borderRadius: '6px', fontSize: '12px', color: 'hsl(210, 20%, 92%)' }} />
        <ReferenceLine x={target.toFixed(decimals)} stroke="hsl(142, 71%, 45%)" strokeDasharray="4 4" label={{ value: `Target ${process.unit}`, position: 'top', fill: 'hsl(142, 71%, 60%)', fontSize: 10 }} />
        <Bar dataKey="count" radius={[2, 2, 0, 0]} isAnimationActive={false}>
          {data.map((entry, i) => {
            const dist = Math.abs(entry.midpoint - target);
            const color = dist > critDist ? 'hsl(0, 72%, 51%)' : dist > warnDist ? 'hsl(38, 92%, 50%)' : 'hsl(210, 100%, 56%)';
            return <Cell key={i} fill={color} />;
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
