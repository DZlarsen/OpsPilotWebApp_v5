import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';
import { format, subMinutes } from 'date-fns';
import type { Process } from '@/data/mock-data';

interface RangeChartProps {
  height?: number;
  timeframe?: number;
  process?: Process;
}

function seedFromId(id: string | undefined): number {
  if (!id) return 0.5;
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  return Math.abs(h) / 0xffffffff;
}

const generateRangeData = (timeframe: number, process: Process | undefined) => {
  if (!process) return [];
  const seed = seedFromId(process.id);
  // Noise scale proportional to process's control-limit range
  const halfRange = Math.max(process.ucl - process.targetMetric, process.targetMetric - process.lcl);
  const noiseScale = halfRange * 0.25;
  const decimals = halfRange < 0.01 ? 4 : halfRange < 0.1 ? 3 : halfRange < 1 ? 3 : 2;

  const data: { time: string; range: number }[] = [];
  let prev = process.targetMetric;
  const now = new Date();
  const points = Math.min(90, Math.max(30, Math.round(timeframe / 5)));
  const interval = timeframe / points;

  for (let i = points; i >= 0; i--) {
    const r = Math.sin(seed * 1000 + i * 7.3) * 0.5;
    const noise = r * noiseScale;
    const drift = i < points * 0.25 ? (noiseScale * 0.15) * (points * 0.25 - i) / (points * 0.25) : 0;
    const current = process.targetMetric + noise + drift;
    const range = Math.abs(current - prev);
    const date = subMinutes(now, i * interval);
    const fmt = timeframe <= 60 ? 'HH:mm:ss' : timeframe <= 1440 ? 'HH:mm' : 'MM/dd HH:mm';
    data.push({
      time: format(date, fmt),
      range: parseFloat(range.toFixed(decimals)),
    });
    prev = current;
  }
  return data;
};

export default function RangeChart({ height = 250, timeframe = 1440, process }: RangeChartProps) {
  const [data, setData] = useState(() => generateRangeData(timeframe, process));

  const halfRange = useMemo(() => {
    if (!process) return 0.01;
    return Math.max(process.ucl - process.targetMetric, process.targetMetric - process.lcl);
  }, [process]);
  const decimals = halfRange < 0.01 ? 4 : halfRange < 0.1 ? 3 : halfRange < 1 ? 3 : 2;
  const displayDecimals = Math.min(decimals, 3);

  useEffect(() => {
    setData(generateRangeData(timeframe, process));
  }, [timeframe, process]);

  useEffect(() => {
    if (!process) return;
    const noiseScale = halfRange * 0.25;
    const interval = setInterval(() => {
      setData(prev => {
        const last = prev[prev.length - 1];
        const prevValue = process.targetMetric + (last?.range || 0);
        const noise = (Math.random() - 0.5) * noiseScale;
        const current = process.targetMetric + noise;
        const range = Math.abs(current - prevValue);
        const now = new Date();
        const fmt = timeframe <= 60 ? 'HH:mm:ss' : timeframe <= 1440 ? 'HH:mm' : 'MM/dd HH:mm';
        return [...prev.slice(1), {
          time: format(now, fmt),
          range: parseFloat(range.toFixed(decimals)),
        }];
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [timeframe, process, halfRange, decimals]);

  const avgRange = data.reduce((s, d) => s + d.range, 0) / (data.length || 1);
  const uclR = avgRange * 3.267;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 16%, 14%)" />
        <XAxis dataKey="time" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 10 }} tickLine={false} axisLine={{ stroke: 'hsl(220, 16%, 18%)' }} interval="preserveStartEnd" />
        <YAxis tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 10 }} tickLine={false} axisLine={{ stroke: 'hsl(220, 16%, 18%)' }} tickFormatter={v => v.toFixed(displayDecimals)} />
        <Tooltip contentStyle={{ background: 'hsl(220, 18%, 12%)', border: '1px solid hsl(220, 16%, 18%)', borderRadius: '6px', fontSize: '12px', color: 'hsl(210, 20%, 92%)' }} />
        <ReferenceLine y={uclR} stroke="hsl(0, 72%, 51%)" strokeDasharray="6 3" label={{ value: 'UCL', position: 'right', fill: 'hsl(0, 72%, 65%)', fontSize: 10 }} />
        <ReferenceLine y={avgRange} stroke="hsl(142, 71%, 45%)" strokeDasharray="4 4" label={{ value: 'R̄', position: 'right', fill: 'hsl(142, 71%, 60%)', fontSize: 10 }} />
        <Line type="monotone" dataKey="range" stroke="hsl(270, 60%, 60%)" strokeWidth={1.5} dot={{ r: 1.5, fill: 'hsl(270, 60%, 60%)' }} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
