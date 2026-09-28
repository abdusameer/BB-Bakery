/* Hand-authored pencil line library. Every path uses pathLength="1" so motion can draw it
   with a single dashoffset (1 → 0). Two or three variants per mark; a variant is chosen
   once per state change, never animated continuously (no jitter). */

const UNDERLINES = [
  'M2 9 C 80 4, 190 3.4, 296 7.4',
  'M2 7 C 60 10, 170 3, 296 8',
  'M3 8 C 90 5.6, 200 5, 297 6'
];

export function Underline({ className, variant = 0, draw = false }: { className?: string; variant?: number; draw?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 300 14" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path className={draw ? 'draw-path' : undefined} pathLength={1} d={UNDERLINES[variant % UNDERLINES.length]} />
    </svg>
  );
}

/** Slightly irregular rectangle drawn around a secondary button (two passes). */
export function PencilBox() {
  return (
    <svg className="pencil-box" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M1.2 1.6 C 30 .8, 70 1.4, 98.8 1 C 99.2 14, 98.6 27, 99 38.8 C 70 39.4, 30 38.6, 1 39.2 C .6 26, 1.4 14, 1.2 1.6 Z" />
      <path className="pass-2" pathLength={1} d="M.8 2.4 C 34 1.6, 66 2.2, 99.2 1.8 C 98.8 16, 99.4 28, 98.6 38.2 C 66 38.8, 34 38, 1.6 38.6 C 1 24, .6 12, .8 2.4" />
    </svg>
  );
}

/** Four unscaled corner marks (so dash-drawing and stroke width stay exact at any frame size). */
export function CropMarks() {
  return (
    <span className="crop-marks" aria-hidden="true">
      {(['tl', 'tr', 'br', 'bl'] as const).map((c) => (
        <svg key={c} className={`crop-corner ${c}`} viewBox="0 0 16 16" focusable="false">
          <path className="crop draw-path" pathLength={1} d="M1 15 V1 H15" />
        </svg>
      ))}
    </span>
  );
}

export function NavLine({ className = 'nav-line' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 1000 4" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M0 2.3 C 300 1.2, 680 3.3, 1000 1.8" />
    </svg>
  );
}

export function NavUnderline({ variant = 0 }: { variant?: number }) {
  const d = ['M1 4 C 16 2.4, 38 2.2, 59 3.4', 'M1 3 C 20 4.6, 40 2, 59 3.8', 'M2 3.6 C 18 3, 44 2.6, 58 3'][variant % 3];
  return (
    <svg className="nav-underline" viewBox="0 0 60 6" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path pathLength={1} d={d} />
    </svg>
  );
}
