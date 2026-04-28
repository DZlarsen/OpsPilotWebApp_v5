import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';
import { format, subMinutes } from 'date-fns';
import type { Process } from '@/data/mock-data';

interface CycleTimeChartProps {
  height?: number;
  timeframe?: number;
  process?: Process;
}

// Per-process cycle-time profile: target, UCL, LCL, noise, drift direction, unit
const cycleTimeProfiles: Record<string, {
  target: number; ucl: number; lcl: number;
  noise: number; driftMag: number; unit: string; decimals: number;
}> = {
  'proc-001': { target: 38,   ucl: 42,   lcl: 34,   noise: 2.0,   driftMag: 0.15,  unit: 's',   decimals: 1 }, // CNC — upward drift (tool wear)
  'proc-002': { target: 42,   ucl: 46,   lcl: 38,   noise: 2.5,   driftMag: 0.12,  unit: 's',   decimals: 1 }, // Injection molding
  'proc-003': { target: 95,   ucl: 108,  lcl: 82,   noise: 7.0,   driftMag: 0.20,  unit: 's',   decimals: 0 }, // Assembly — manual, high variability
  'proc-004': { target: 15,   ucl: 17,   lcl: 13,   noise: 0.8,   driftMag: 0.05,  unit: 's',   decimals: 1 }, // Packaging — automated, tight
  'batt-001': { target: 3.0,  ucl: 3.4,  lcl: 2.6,  noise: 0.18,  driftMag: 0.08,  unit: 'min', decimals: 2 }, // Electrode coating — slow, precise
  'batt-002': { target: 8.5,  ucl: 9.5,  lcl: 7.5,  noise: 0.45,  driftMag: 0.12,  unit: 's',   decimals: 1 }, // Stacking — per-cell
  'batt-003': { target: 4.2,  ucl: 4.7,  lcl: 3.7,  noise: 0.22,  driftMag: 0.06,  unit: 's',   decimals: 1 }, // Electrolyte fill
  'batt-004': { target: 6.5,  ucl: 7.2,  lcl: 5.8,  noise: 0.30,  driftMag: 0.04,  unit: 'hr',  decimals: 2 }, // Formation — hours per cycle
  'batt-005': { target: 72,   ucl: 85,   lcl: 59,   noise: 6.0,   driftMag: 0.18,  unit: 's',   decimals: 0 }, // Module assembly — manual
  'batt-006': { target: 45,   ucl: 52,   lcl: 38,   noise: 3.5,   driftMag: 0.10,  unit: 'min', decimals: 1 }, // Pack testing — test protocol length
};

function seedFromId(id: string | undefined): number {
  if (!id) return 0.5;
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  return Math.abs(h) / 0xffffffff;
}

function getProfile(process: Process | undefined) {
  if (!process) return cycleTimeProfiles['proc-002'];
  return cycleTimeProfiles[process.id] || cycleTimeProfiles['proc-002'];
}

const generateData = (timeframe: number, process: Process | undefined) => {
  const profile = getProfile(process);
  const seed = seedFromId(process?.id);
  const data: { time: string; value: number }[] = [];
  const now = new Date();
  const points = Math.min(80, Math.max(20, Math.round(timeframe / 5)));
  const interval = timeframe / points;
  const fmt = timeframe <= 60 ? 'HH:mm:ss' : timeframe <= 1440 ? 'HH:mm' : 'MM/dd HH:mm';

  for (let i = points; i >= 0; i--) {
    const date = subMinutes(now, i * interval);
    // Upward drift in the recent window (tool wear / process degradation)
    const driftFraction = i < points * 0.4 ? (points * 0.4 - i) / (points * 0.4) : 0;
    const drift = profile.driftMag * driftFraction;
    const r = Math.sin(seed * 300 + i * 4.1) * 0.5 + Math.sin(seed * 80 + i * 1.7) * 0.25;
    const value = profile.target + drift + r * profile.noise;
    data.push({ time: format(date, fmt), value: parseFloat(value.toFixed(profile.decimals)) });
  }
  return data;
};

export default function CycleTimeChart({ height = 250, timeframe = 1440, process }: CycleTimeChartProps) {
  const profile = useMemo(() => getProfile(process), [process]);
  const [data, setData] = useState(() => generateData(timeframe, process));
  const yPad = profile.noise * 1.5;

  useEffect(() => {
    setData(generateData(timeframe, process));
  }, [timeframe, process]);

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => {
        const seed = seedFromId(process?.id);
        const r = Math.sin(seed * 300 + Date.now() * 0.0008) * 0.5;
        const drift = profile.driftMag * 0.5;
        const value = profile.target + drift + r * profile.noise;
        const fmt = timeframe <= 60 ? 'HH:mm:ss' : timeframe <= 1440 ? 'HH:mm' : 'MM/dd HH:mm';
        return [...prev.slice(1), { time: format(new Date(), fmt), value: parseFloat(value.toFixed(profile.decimals)) }];
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [timeframe, process, profile]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 50, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 16%, 14%)" />
        <XAxis dataKey="time" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 10 }} tickLine={false} axisLine={{ stroke: 'hsl(220, 16%, 18%)' }} interval="preserveStartEnd" />
        <YAxis
          domain={[profile.lcl - yPad, profile.ucl + yPad]}
          tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 10 }} tickLine={false} axisLine={{ stroke: 'hsl(220, 16%, 18%)' }}
          tickFormatter={v => v.toFixed(profile.decimals === 0 ? 0 : profile.decimals === 2 ? 1 : 1)}
          label={{ value: profile.unit, angle: -90, position: 'insideLeft', fill: 'hsl(215, 15%, 45%)', fontSize: 9, dx: -4 }}
        />
        <Tooltip contentStyle={{ background: 'hsl(220, 18%, 12%)', border: '1px solid hsl(220, 16%, 18%)', borderRadius: '6px', fontSize: '12px', color: 'hsl(210, 20%, 92%)' }}
          formatter={(v: number) => [`${v} ${profile.unit}`, 'Cycle Time']} />
        <ReferenceLine y={profile.ucl} stroke="hsl(0, 72%, 51%)" strokeDasharray="6 3"
          label={{ value: 'UCL', position: 'right', fill: 'hsl(0, 72%, 65%)', fontSize: 10 }} />
        <ReferenceLine y={profile.target} stroke="hsl(142, 71%, 45%)" strokeDasharray="4 4"
          label={{ value: 'Target', position: 'right', fill: 'hsl(142, 71%, 60%)', fontSize: 10 }} />
        <ReferenceLine y={profile.lcl} stroke="hsl(0, 72%, 51%)" strokeDasharray="6 3"
          label={{ value: 'LCL', position: 'right', fill: 'hsl(0, 72%, 65%)', fontSize: 10 }} />
        <Line type="monotone" dataKey="value" stroke="hsl(38, 92%, 50%)" strokeWidth={1.5}
          dot={{ r: 1.5, fill: 'hsl(38, 92%, 50%)' }} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
