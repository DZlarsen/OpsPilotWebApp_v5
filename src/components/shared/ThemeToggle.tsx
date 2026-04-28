import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * Theme toggle with two visual variants:
 *  - `spec`   → used in the landing footer title-block (looks like a toggle-able spec)
 *  - `icon`   → used in the app header (minimal icon-only button)
 *  - `inline` → used inside a row with "Lighting" label inline
 */
export function ThemeToggle({ variant = 'icon' }: { variant?: 'spec' | 'icon' | 'inline' }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — next-themes doesn't know the resolved theme until client-side
  useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme === 'dark' : true;
  const toggle = () => setTheme(isDark ? 'light' : 'dark');
  const label = isDark ? 'DARK' : 'LIGHT';

  if (variant === 'spec') {
    return (
      <button
        onClick={toggle}
        className="w-full text-left group"
        aria-label="Toggle theme"
        title="Toggle theme"
      >
        <div className="label">Lighting</div>
        <div className="value flex items-center gap-1.5 group-hover:text-primary transition-colors">
          {isDark ? <Moon className="h-3 w-3" strokeWidth={1.75} /> : <Sun className="h-3 w-3" strokeWidth={1.75} />}
          {label}
          <span className="text-muted-foreground ml-1 font-normal">⇄</span>
        </div>
      </button>
    );
  }

  if (variant === 'inline') {
    return (
      <button
        onClick={toggle}
        className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors"
        aria-label="Toggle theme"
        title="Toggle theme"
      >
        {isDark ? <Moon className="h-3 w-3" strokeWidth={1.75} /> : <Sun className="h-3 w-3" strokeWidth={1.75} />}
        <span>{label}</span>
      </button>
    );
  }

  // default icon variant (app header)
  return (
    <button
      onClick={toggle}
      className="flex items-center justify-center h-8 w-8 border border-border bg-secondary/30 hover:bg-secondary/60 transition-colors rounded-[var(--radius)]"
      aria-label="Toggle theme"
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? (
        <Moon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
      ) : (
        <Sun className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
      )}
    </button>
  );
}

export default ThemeToggle;
