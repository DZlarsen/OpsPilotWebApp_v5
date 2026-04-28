import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, Dot } from 'recharts';
import { Measurement, Process } from '@/data/mock-data';
import { format } from 'date-fns';

export interface ChartSettings {
  lineColor: string;
  showGridlines: boolean;
  showDots: boolean;
  showLimits: boolean;
  timeframe: number; // minutes
}

export const defaultChartSettings: ChartSettings = {
  lineColor: 'hsl(210, 100%, 56%)',
  showGridlines: true,
  showDots: true,
  showLimits: true,
  timeframe: 1440, // 1 day in minutes
};

interface ControlChartProps {
  measurements: Measurement[];
  process: Process;
  height?: number;
  settings?: ChartSettings;
}

const LINE_COLORS: Record<string, string> = {
  'Blue': 'hsl(210, 100%, 56%)',
  'Cyan': 'hsl(185, 80%, 50%)',
  'Green': 'hsl(142, 71%, 45%)',
  'Purple': 'hsl(270, 60%, 60%)',
  'Amber': 'hsl(38, 92%, 50%)',
};

export { LINE_COLORS };

function CustomDot(props: any) {
  const { cx, cy, payload, process, settings } = props;
  if (!cx || !cy || !settings?.showDots) return null;
  const isOOC = payload.value > process.ucl || payload.value < process.lcl;
  return (
    <Dot
      cx={cx}
      cy={cy}
      r={isOOC ? 5 : 2.5}
      fill={isOOC ? 'hsl(0, 72%, 51%)' : settings.lineColor}
      stroke={isOOC ? 'hsl(0, 72%, 70%)' : 'none'}
      strokeWidth={isOOC ? 2 : 0}
    />
  );
}

export default function ControlChart({ measurements, process, height = 300, settings = defaultChartSettings }: ControlChartProps) {
  // Filter by timeframe
  const cutoff = new Date(Date.now() - settings.timeframe * 60 * 1000);
  const filtered = measurements.filter(m => new Date(m.timestamp) >= cutoff);

  const data = filtered.map(m => ({
    ...m,
    time: format(new Date(m.timestamp), 'MM/dd HH:mm'),
    value: m.value,
  }));

  const values = filtered.map(m => m.value);
  const yMin = Math.min(process.lcl, ...values) * 0.998;
  const yMax = Math.max(process.ucl, ...values) * 1.002;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 35, left: 10, bottom: 0 }}>
        {settings.showGridlines && (
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 16%, 14%)" />
        )}
        <XAxis
          dataKey="time"
          tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 10 }}
          tickLine={false}
          axisLine={{ stroke: 'hsl(220, 16%, 18%)' }}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[yMin, yMax]}
          tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 10 }}
          tickLine={false}
          axisLine={{ stroke: 'hsl(220, 16%, 18%)' }}
          tickFormatter={(v) => v.toFixed(process.unit === 'mm' ? 3 : 1)}
        />
        <Tooltip
          contentStyle={{
            background: 'hsl(220, 18%, 12%)',
            border: '1px solid hsl(220, 16%, 18%)',
            borderRadius: '6px',
            fontSize: '12px',
            color: 'hsl(210, 20%, 92%)',
          }}
          labelStyle={{ color: 'hsl(215, 15%, 55%)' }}
        />
        {settings.showLimits && (
          <>
            <ReferenceLine y={process.ucl} stroke="hsl(0, 72%, 51%)" strokeDasharray="6 3" label={{ value: 'UCL', position: 'right', fill: 'hsl(0, 72%, 65%)', fontSize: 10 }} />
            <ReferenceLine y={process.cl} stroke="hsl(142, 71%, 45%)" strokeDasharray="4 4" label={{ value: 'CL', position: 'right', fill: 'hsl(142, 71%, 60%)', fontSize: 10 }} />
            <ReferenceLine y={process.lcl} stroke="hsl(0, 72%, 51%)" strokeDasharray="6 3" label={{ value: 'LCL', position: 'right', fill: 'hsl(0, 72%, 65%)', fontSize: 10 }} />
          </>
        )}
        <Line
          type="monotone"
          dataKey="value"
          stroke={settings.lineColor}
          strokeWidth={1.5}
          dot={settings.showDots ? ((props: any) => <CustomDot {...props} process={process} settings={settings} />) : false}
          activeDot={{ r: 4, fill: settings.lineColor }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
