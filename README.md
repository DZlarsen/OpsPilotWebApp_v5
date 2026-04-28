# OpsPilot — Blueprint Redesign

Three files that transform OpsPilot's landing page and app shell into an
industrial blueprint / technical-drawing aesthetic.

## Installation

Drop these three files into your project at the exact paths shown,
overwriting the originals:

```
src/
├── index.css                         ← replace
├── pages/
│   └── Landing.tsx                   ← replace
└── components/
    └── layout/
        └── AppLayout.tsx             ← replace (logo block only changed)
```

No new dependencies. No new routes. No new data.

## What changed

**`src/index.css`** — new fonts (Instrument Serif + JetBrains Mono), new
palette (graphite + drafting cyan + warning amber), tighter radius,
and ~20 blueprint utility classes (`.bp-grid`, `.bp-title-block`,
`.bp-callout`, `.bp-blink`, `.bp-marquee`, etc.). All existing
design-token names are preserved — every other page in the app
automatically picks up the new palette.

**`src/pages/Landing.tsx`** — full rewrite. New sections:
- Hero with serif italic headline, corner title block, live coordinate
  readout, and dimension line
- "Fig. A" dashboard preview with corner brackets + checked ✓ stamp
- Live telemetry ticker (marquee)
- Features as a BOM-style parts list (#001–#016, PROD/QUAL/PROJ/OPS codes)
- Workflow as assembly instructions connected by a dashed leader line
- Taskmaster as a "Sub-Assembly · AI Engine" with live typing console
- Pricing as tolerance grades (G1/G2/G3)
- Footer as a real drawing stamp (Drawn/Checked/Date/Scale · Sheet 06/06)

**`src/components/layout/AppLayout.tsx`** — one change: the sidebar logo
now uses the crosshair + "DRW · 001" + blinking dot treatment so the
app shell matches the landing page.

## Verification

Run locally:

```bash
npm install      # (no new packages needed — all already in your deps)
npm run dev
```

Or build:

```bash
npm run build
```

Both were verified clean against a fresh install of your project.
