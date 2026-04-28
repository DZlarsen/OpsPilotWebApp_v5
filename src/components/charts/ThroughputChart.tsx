import { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';
import { format, subMinutes } from 'date-fns';
import type { Process } from '@/data/mock-data';

interface ThroughputChartProps {
  height?: number;
  timeframe?: number;
  process?: Process;
}

// Per-process throughput profile — target units/hr and noise magnitude
// Values are thematically consistent with each process's nature
const throughputProfiles: Record<string, { target: number; noise: number; unit: string; dipFactor: number }> = {
  'proc-001': { target: 48,   noise: 6,    unit: 'parts/hr',  dipFactor: 0.18 }, // CNC — precise, moderate throughput
  'proc-002': { target: 120,  noise: 18,   unit: 'shots/hr',  dipFactor: 0.12 }, // Injection molding — high rate
  'proc-003': { target: 60,   noise: 10,   unit: 'units/hr',  dipFactor: 0.22 }, // Final assembly — manual, more variable
  'proc-004': { target: 240,  noise: 30,   unit: 'packs/hr',  dipFactor: 0.08 }, // Packaging — very high rate, automated
  'batt-001': { target: 1200, noise: 80,   unit: 'm²/hr',     dipFactor: 0.15 }, // Electrode coating — area throughput
  'batt-002': { target: 360,  noise: 40,   unit: 'cells/hr',  dipFactor: 0.20 }, // Stacking — automated but vision checks slow it
  'batt-003': { target: 480,  noise: 35,   unit: 'cells/hr',  dipFactor: 0.10 }, // Electrolyte fill — consistent
  'batt-004': { target: 96,   noise: 8,    unit: 'packs/day', dipFactor: 0.14 }, // Formation — slow cycling process
  'batt-005': { target: 12,   noise: 2,    unit: 'modules/hr',dipFactor: 0.25 }, // Module assembly — manual, low rate
  'batt-006': { target: 24,   noise: 3,    unit: 'packs/hr',  dipFactor: 0.12 }, // Pack testing — test-limited
};

function seedFromId(id: string | undefined): number {
  if (!id) return 0.5;
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  return Math.abs(h) / 0xffffffff;
}

function getProfile(process: Process | undefined) {
  if (!process) return throughputProfiles['proc-001'];
  return throughputProfiles[process.id] || throughputProfiles['proc-001'];
}

const generateData = (timeframe: number, process: Process | undefined) => {
  const profile = getProfile(process);
  const seed = seedFromId(process?.id);
  const data: { time: string; throughput: number; target: number }[] = [];
  const now = new Date();
  const points = Math.min(90, Math.max(20, Math.round(timeframe / 5)));
  const interval = timeframe / points;
  const fmt = timeframe <= 60 ? 'HH:mm:ss' : timeframe <= 1440 ? 'HH:mm' : 'MM/dd HH:mm';

  for (let i = points; i >= 0; i--) {
    const date = subMinutes(now, i * interval);
    // Pseudo-random seeded noise
    const r = Math.sin(seed * 200 + i * 3.7) * 0.5 + Math.sin(seed * 50 + i * 1.3) * 0.3;
    // Dip near the end of window (simulates maintenance / changeover)
    const dip = i < points * 0.15 ? -profile.target * profile.dipFactor : 0;
    const throughput = Math.max(0, Math.round(profile.target + r * profile.noise + dip));
    data.push({ time: format(date, fmt), throughput, target: profile.target });
  }
  return data;
};

export default function ThroughputChart({ height = 250, timeframe = 1440, process }: ThroughputChartProps) {
  const profile = useMemo(() => getProfile(process), [process]);
  const [data, setData] = useState(() => generateData(timeframe, process));

  useEffect(() => {
    setData(generateData(timeframe, process));
  }, [timeframe, process]);

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => {
        const seed = seedFromId(process?.id);
        const r = Math.sin(seed * 200 + Date.now() * 0.001) * 0.5;
        const throughput = Math.max(0, Math.round(profile.target + r * profile.noise));
        const fmt = timeframe <= 60 ? 'HH:mm:ss' : timeframe <= 1440 ? 'HH:mm' : 'MM/dd HH:mm';
        return [...prev.slice(1), { time: format(new Date(), fmt), throughput, target: profile.target }];
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [timeframe, process, profile]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 16%, 14%)" />
        <XAxis dataKey="time" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 10 }} tickLine={false} axisLine={{ stroke: 'hsl(220, 16%, 18%)' }} interval="preserveStartEnd" />
        <YAxis tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 10 }} tickLine={false} axisLine={{ stroke: 'hsl(220, 16%, 18%)' }}
          label={{ value: profile.unit, angle: -90, position: 'insideLeft', fill: 'hsl(215, 15%, 45%)', fontSize: 9, dx: -4 }} />
        <Tooltip contentStyle={{ background: 'hsl(220, 18%, 12%)', border: '1px solid hsl(220, 16%, 18%)', borderRadius: '6px', fontSize: '12px', color: 'hsl(210, 20%, 92%)' }}
          formatter={(v: number) => [`${v} ${profile.unit}`, 'Throughput']} />
        <ReferenceLine y={profile.target} stroke="hsl(142, 71%, 45%)" strokeDasharray="4 4"
          label={{ value: `Target ${profile.target}`, position: 'right', fill: 'hsl(142, 71%, 60%)', fontSize: 9 }} />
        <Area type="monotone" dataKey="throughput" stroke="hsl(185, 80%, 50%)" fill="hsl(185, 80%, 50%)" fillOpacity={0.1} strokeWidth={1.5} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
