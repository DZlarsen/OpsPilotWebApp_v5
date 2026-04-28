import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } from 'recharts';

interface DefectBarChartProps {
  height?: number;
  processId?: string;
}

// Per-process defect profiles keyed by the actual process IDs in the data
const defectProfiles: Record<string, { category: string; base: number }[]> = {
  // Precision
  'proc-001': [ // CNC — Shaft Turning
    { category: 'Dim. OOT',        base: 16 },
    { category: 'Surface Finish',  base: 11 },
    { category: 'Tool Marks',      base: 7  },
    { category: 'Burr',            base: 5  },
    { category: 'Wrong OD',        base: 3  },
    { category: 'Other',           base: 2  },
  ],
  'proc-002': [ // Injection Molding
    { category: 'Flash',           base: 18 },
    { category: 'Short Shot',      base: 12 },
    { category: 'Sink Marks',      base: 8  },
    { category: 'Warpage',         base: 6  },
    { category: 'Gate Vestige',    base: 4  },
    { category: 'Other',           base: 2  },
  ],
  'proc-003': [ // Final Assembly
    { category: 'Missing Fastener',base: 14 },
    { category: 'Cross-Threaded',  base: 9  },
    { category: 'Misalignment',    base: 6  },
    { category: 'Wrong Component', base: 4  },
    { category: 'Torque Fail',     base: 3  },
    { category: 'Other',           base: 2  },
  ],
  'proc-004': [ // Packaging — Shrink Wrap
    { category: 'Seal Fail',       base: 15 },
    { category: 'Wrong Label',     base: 8  },
    { category: 'Missing Insert',  base: 6  },
    { category: 'Box Damage',      base: 4  },
    { category: 'Leak Test',       base: 3  },
    { category: 'Other',           base: 2  },
  ],
  // Volta battery
  'batt-001': [ // Electrode Coating — Cathode
    { category: 'Thickness OOT',   base: 19 },
    { category: 'Streaking',       base: 11 },
    { category: 'Pinholes',        base: 7  },
    { category: 'Edge Bead',       base: 5  },
    { category: 'Agglomerates',    base: 3  },
    { category: 'Other',           base: 2  },
  ],
  'batt-002': [ // Cell Assembly — Stacking
    { category: 'Stacking Misalign',base: 14},
    { category: 'Tab Weld Fail',   base: 9  },
    { category: 'Separator Fold',  base: 6  },
    { category: 'Contamination',   base: 5  },
    { category: 'ESD Event',       base: 3  },
    { category: 'Other',           base: 2  },
  ],
  'batt-003': [ // Electrolyte Filling
    { category: 'Moisture OOT',    base: 16 },
    { category: 'Weight Variance', base: 10 },
    { category: 'Seal Delamin.',   base: 7  },
    { category: 'Void/Gap',        base: 4  },
    { category: 'Wrong Recipe',    base: 3  },
    { category: 'Other',           base: 1  },
  ],
  'batt-004': [ // Formation Cycling
    { category: 'Low Capacity',    base: 18 },
    { category: 'Voltage Drift',   base: 11 },
    { category: 'Dendrite',        base: 6  },
    { category: 'Gas Generation',  base: 4  },
    { category: 'Swelling',        base: 3  },
    { category: 'Other',           base: 2  },
  ],
  'batt-005': [ // Module Assembly
    { category: 'Busbar Weld',     base: 13 },
    { category: 'TIM Placement',   base: 9  },
    { category: 'BMS Comm Fault',  base: 6  },
    { category: 'Torque Fail',     base: 5  },
    { category: 'Coolant Leak',    base: 3  },
    { category: 'Other',           base: 2  },
  ],
  'batt-006': [ // Pack Testing — HPPC
    { category: 'Capacity Fail',   base: 15 },
    { category: 'Balance Drift',   base: 10 },
    { category: 'Thermal Anomaly', base: 7  },
    { category: 'Isolation Fail',  base: 4  },
    { category: 'BMS Flash',       base: 3  },
    { category: 'Other',           base: 2  },
  ],
};

function seedFromId(id: string | undefined): number {
  if (!id) return 0.5;
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  return Math.abs(h) / 0xffffffff;
}

function getColorForIndex(i: number): string {
  const palette = [
    'hsl(0, 72%, 51%)',     // red  — top 2
    'hsl(0, 72%, 51%)',
    'hsl(38, 92%, 50%)',    // amber — mid
    'hsl(38, 92%, 50%)',
    'hsl(210, 100%, 56%)',  // blue
    'hsl(210, 100%, 56%)',
    'hsl(215, 15%, 55%)',   // gray — tail
  ];
  return palette[Math.min(i, palette.length - 1)];
}

const generateDefectData = (processId: string | undefined, tick: number) => {
  const profile = defectProfiles[processId || ''] || defectProfiles['proc-001'];
  const seed = seedFromId(processId);
  return profile.map((d, i) => ({
    category: d.category,
    count: d.base + Math.floor((Math.sin(seed * 50 + tick + i) + 1) * 2),
    color: getColorForIndex(i),
  }));
};

export default function DefectBarChart({ height = 250, processId }: DefectBarChartProps) {
  const [tick, setTick] = useState(0);
  const data = useMemo(() => generateDefectData(processId, tick), [processId, tick]);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 16%, 14%)" horizontal={false} />
        <XAxis type="number" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 10 }} axisLine={{ stroke: 'hsl(220, 16%, 18%)' }} />
        <YAxis type="category" dataKey="category" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 10 }} width={110} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ background: 'hsl(220, 18%, 12%)', border: '1px solid hsl(220, 16%, 18%)', borderRadius: '6px', fontSize: '12px', color: 'hsl(210, 20%, 92%)' }} />
        <Bar dataKey="count" radius={[0, 3, 3, 0]} isAnimationActive={false}>
          {data.map((e, i) => <Cell key={i} fill={e.color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
