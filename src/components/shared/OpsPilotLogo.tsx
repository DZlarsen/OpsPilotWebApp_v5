/**
 * OpsPilot logo mark — a drafting crosshair inside a squared frame.
 * Designed to read as precision/measurement/pilot-target.
 *
 * Use via <OpsPilotLogo size={32} /> or <OpsPilotLogo size={28} tone="subtle" />
 *
 * Tones:
 *  - default : primary cyan stroke + frame
 *  - subtle  : uses muted-foreground for sidebar/inline contexts
 */
export function OpsPilotLogo({
  size = 32,
  tone = 'default',
  showDot = true,
  className = '',
}: {
  size?: number;
  tone?: 'default' | 'subtle';
  showDot?: boolean;
  className?: string;
}) {
  const color = tone === 'subtle' ? 'hsl(var(--foreground))' : 'hsl(var(--primary))';
  return (
    <span
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-label="OpsPilot"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer frame — tight blueprint square */}
        <rect x="1.5" y="1.5" width="29" height="29" stroke={color} strokeWidth="1.5" />

        {/* Corner notches — drafting target feel */}
        <path d="M1.5 6 L1.5 1.5 L6 1.5" stroke={color} strokeWidth="2" />
        <path d="M26 1.5 L30.5 1.5 L30.5 6" stroke={color} strokeWidth="2" />
        <path d="M30.5 26 L30.5 30.5 L26 30.5" stroke={color} strokeWidth="2" />
        <path d="M6 30.5 L1.5 30.5 L1.5 26" stroke={color} strokeWidth="2" />

        {/* Inner crosshair */}
        <circle cx="16" cy="16" r="5.5" stroke={color} strokeWidth="1.25" />
        <circle cx="16" cy="16" r="2" fill={color} />

        {/* Crosshair arms (leaving tiny gap at center) */}
        <line x1="16" y1="9" x2="16" y2="12" stroke={color} strokeWidth="1.25" />
        <line x1="16" y1="20" x2="16" y2="23" stroke={color} strokeWidth="1.25" />
        <line x1="9" y1="16" x2="12" y2="16" stroke={color} strokeWidth="1.25" />
        <line x1="20" y1="16" x2="23" y2="16" stroke={color} strokeWidth="1.25" />
      </svg>

      {/* Optional status dot — shared with blinking indicator */}
      {showDot && (
        <span
          className="absolute h-1.5 w-1.5 bg-primary bp-blink"
          style={{ top: -2, right: -2 }}
        />
      )}
    </span>
  );
}

export default OpsPilotLogo;
