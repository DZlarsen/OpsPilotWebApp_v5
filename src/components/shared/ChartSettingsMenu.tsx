import { useState, useRef, useEffect } from 'react';
import { ChartSettings, defaultChartSettings, LINE_COLORS } from './ControlChart';
import { Settings2 } from 'lucide-react';

interface ChartSettingsMenuProps {
  settings: ChartSettings;
  onChange: (settings: ChartSettings) => void;
}

const timeframeOptions = [
  { value: 5, label: '5m' },
  { value: 15, label: '15m' },
  { value: 60, label: '1h' },
  { value: 360, label: '6h' },
  { value: 1440, label: '1d' },
  { value: 10080, label: '7d' },
  { value: 43200, label: '30d' },
];

export default function ChartSettingsMenu({ settings, onChange }: ChartSettingsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const labelClass = 'text-[10px] font-medium text-muted-foreground uppercase tracking-wider';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-secondary/80 transition-colors text-muted-foreground hover:text-foreground"
        title="Chart settings"
      >
        <Settings2 className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-64 rounded-lg border border-border bg-popover shadow-xl p-3 space-y-3">
          <p className="text-xs font-semibold">Chart Settings</p>

          {/* Timeframe */}
          <div className="space-y-1">
            <label className={labelClass}>Timeframe</label>
            <div className="flex gap-1 flex-wrap">
              {timeframeOptions.map(t => (
                <button
                  key={t.value}
                  onClick={() => onChange({ ...settings, timeframe: t.value })}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                    settings.timeframe === t.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Line Color */}
          <div className="space-y-1">
            <label className={labelClass}>Line Color</label>
            <div className="flex gap-1.5">
              {Object.entries(LINE_COLORS).map(([name, color]) => (
                <button
                  key={name}
                  onClick={() => onChange({ ...settings, lineColor: color })}
                  className={`h-6 w-6 rounded-full border-2 transition-transform ${
                    settings.lineColor === color ? 'border-foreground scale-110' : 'border-transparent'
                  }`}
                  style={{ background: color }}
                  title={name}
                />
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2">
            {[
              { key: 'showGridlines' as const, label: 'Gridlines' },
              { key: 'showDots' as const, label: 'Data Points' },
              { key: 'showLimits' as const, label: 'Control Limits' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center justify-between cursor-pointer">
                <span className="text-xs">{label}</span>
                <button
                  onClick={() => onChange({ ...settings, [key]: !settings[key] })}
                  className={`relative h-5 w-9 rounded-full transition-colors ${
                    settings[key] ? 'bg-primary' : 'bg-secondary'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-foreground transition-transform ${
                      settings[key] ? 'translate-x-4' : ''
                    }`}
                  />
                </button>
              </label>
            ))}
          </div>

          {/* Reset */}
          <button
            onClick={() => onChange(defaultChartSettings)}
            className="w-full text-center text-[11px] text-muted-foreground hover:text-foreground transition-colors pt-1"
          >
            Reset to defaults
          </button>
        </div>
      )}
    </div>
  );
}
