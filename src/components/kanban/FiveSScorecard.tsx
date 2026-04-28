import { useState } from 'react';
import { Star } from 'lucide-react';
import { FiveSScore } from './types';

interface Props {
  scores: FiveSScore[];
  onUpdate: (scores: FiveSScore[]) => void;
}

function RadarChart({ scores }: { scores: FiveSScore[] }) {
  const size = 180;
  const center = size / 2;
  const maxRadius = 70;
  const levels = 5;
  const angleStep = (2 * Math.PI) / 5;
  const startAngle = -Math.PI / 2;

  const getPoint = (index: number, value: number) => {
    const angle = startAngle + index * angleStep;
    const r = (value / 5) * maxRadius;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };

  const gridLines = Array.from({ length: levels }, (_, lvl) => {
    const r = ((lvl + 1) / levels) * maxRadius;
    const points = Array.from({ length: 5 }, (_, i) => {
      const angle = startAngle + i * angleStep;
      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
    }).join(' ');
    return points;
  });

  const dataPoints = scores.map((s, i) => getPoint(i, s.score));
  const dataPolygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  const labels = scores.map((s, i) => {
    const angle = startAngle + i * angleStep;
    const labelR = maxRadius + 18;
    return {
      x: center + labelR * Math.cos(angle),
      y: center + labelR * Math.sin(angle),
      text: s.category,
      score: s.score,
    };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {/* Grid */}
      {gridLines.map((points, i) => (
        <polygon key={i} points={points} fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity={0.5} />
      ))}
      {/* Axes */}
      {Array.from({ length: 5 }, (_, i) => {
        const p = getPoint(i, 5);
        return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="hsl(var(--border))" strokeWidth="0.5" opacity={0.5} />;
      })}
      {/* Data */}
      <polygon points={dataPolygon} fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))" strokeWidth="1.5" />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="hsl(var(--primary))" />
      ))}
      {/* Labels */}
      {labels.map((l, i) => (
        <text key={i} x={l.x} y={l.y} textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground" fontSize="8" fontWeight="500">
          {l.text}
        </text>
      ))}
    </svg>
  );
}

export default function FiveSScorecard({ scores, onUpdate }: Props) {
  const [expandedCat, setExpandedCat] = useState<number | null>(null);
  const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
  const maxTotal = scores.length * 5;
  const overallPct = maxTotal > 0 ? Math.round((totalScore / maxTotal) * 100) : 0;

  const updateScore = (index: number, score: number) => {
    const updated = [...scores];
    updated[index] = { ...updated[index], score };
    onUpdate(updated);
  };

  const updateNotes = (index: number, notes: string) => {
    const updated = [...scores];
    updated[index] = { ...updated[index], notes };
    onUpdate(updated);
  };

  const scoreColor = (score: number) => {
    if (score >= 4) return 'text-status-ok';
    if (score >= 3) return 'text-status-warning';
    if (score >= 1) return 'text-status-critical';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          5S Audit Scorecard
        </label>
        <span className={`text-xs font-mono font-medium ${scoreColor(totalScore / scores.length)}`}>
          {totalScore}/{maxTotal} ({overallPct}%)
        </span>
      </div>

      <RadarChart scores={scores} />

      <div className="space-y-1.5">
        {scores.map((s, i) => (
          <div key={s.category} className="rounded-md border border-border overflow-hidden">
            <button
              onClick={() => setExpandedCat(expandedCat === i ? null : i)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-secondary/30 transition-colors"
            >
              <span className="text-xs font-medium flex-1">{s.category}</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(v => (
                  <button
                    key={v}
                    onClick={(e) => { e.stopPropagation(); updateScore(i, v === s.score ? 0 : v); }}
                    className="p-0"
                  >
                    <Star className={`h-3.5 w-3.5 transition-colors ${v <= s.score ? 'fill-status-warning text-status-warning' : 'text-muted-foreground/30'}`} />
                  </button>
                ))}
              </div>
            </button>
            {expandedCat === i && (
              <div className="px-3 pb-3 border-t border-border bg-secondary/10">
                <textarea
                  className="w-full mt-2 rounded-md bg-secondary/50 border border-border px-2.5 py-2 text-xs text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                  rows={2}
                  placeholder="Findings and action items..."
                  value={s.notes}
                  onChange={(e) => updateNotes(i, e.target.value)}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
