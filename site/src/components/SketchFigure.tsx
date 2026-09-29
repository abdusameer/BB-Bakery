import { useEffect, useId, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as RPointerEvent, ReactNode } from 'react';
import { IconPencil, IconPhoto } from './Icons';
import { images } from '../generated/images';
import { asset } from '../lib/asset';

type Props = {
  img: string;                 // key in generated/images.ts
  alt: string;                 // describes only what the concept picture shows
  sizes: string;
  eager?: boolean;
  chip?: string;
  marks?: ReactNode;           // extra authored SVG marks (draw-path elements), in 0–100 viewBox
  className?: string;
  study?: boolean;             // reduced-motion "Pencil study" thumbnail
  label?: string;              // what the bread is (for the sketch toggle's accessible name)
  eraser?: boolean;            // pinned menu: a drawn eraser that wipes the product off before the next
};

/**
 * Pencil → graphite → photograph, stacked in one stable aspect-ratio box.
 * All three rasters are white-pointed, so `mix-blend-mode: multiply` melts them into the paper.
 * With JS off or reduced motion the final state (photo + faint trace) is what renders.
 */
export function SketchFigure({ img, alt, sizes, eager, chip = 'Concept image', marks, className, study = true, label, eraser }: Props) {
  // "Sketch" toggle (tap / click) and press-and-hold peek (touch): swap the photo back to its drawing.
  const [pinned, setPinned] = useState(false);
  const [holding, setHolding] = useState(false);
  const [fading, setFading] = useState(false);
  const holdT = useRef(0);
  const fadeT = useRef(0);
  const showSketch = pinned || holding;
  // brief transition window around each swap (scrub updates stay instant otherwise)
  const fade = () => {
    setFading(true);
    window.clearTimeout(fadeT.current);
    fadeT.current = window.setTimeout(() => setFading(false), 420);
  };
  useEffect(() => () => { window.clearTimeout(fadeT.current); window.clearTimeout(holdT.current); }, []);
  const onDown = (e: RPointerEvent) => {
    if (e.pointerType !== 'touch') return;
    window.clearTimeout(holdT.current);
    holdT.current = window.setTimeout(() => { fade(); setHolding(true); }, 320);
  };
  const onUp = () => { window.clearTimeout(holdT.current); if (holding) { fade(); setHolding(false); } };
  const d = images[img];
  const [aw, ah] = d.ar;
  const src = (kind: string, w: number, ext: string) => asset(`img/${img}-${kind}-${w}.${ext}`);
  const set = (kind: string, ws: number[], ext: string) => ws.map((w) => `${src(kind, w, ext)} ${w}w`).join(', ');
  const style = {
    '--ar': `${aw} / ${ah}`,
    '--cx': `${d.cx}%`,
    '--cy': `${d.cy}%`,
    '--bw': `${d.bw}%`,
    '--bh': `${d.bh}%`,
    '--line-final': d.lineFinal
  } as CSSProperties;
  const loading = eager ? 'eager' : 'lazy';
  const mid = d.drawWidths[1];

  return (
    <figure className={`sketch ${className ?? ''}${showSketch ? ' is-sketch' : ''}${fading ? ' is-sketch-fading' : ''}`} data-anim="" data-img={img} style={style}>
      <div className="sketch-crop">
      <div
        className="sketch-frame"
        onPointerDown={onDown}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onPointerLeave={onUp}
        onContextMenu={(e) => { if (holding) e.preventDefault(); }}
      >
        <picture className="layer layer-photo">
          <source type="image/avif" srcSet={set('photo', d.widths, 'avif')} sizes={sizes} />
          <img
            src={src('photo', d.widths[1], 'webp')}
            srcSet={set('photo', d.widths, 'webp')}
            sizes={sizes}
            alt={alt}
            width={d.widths[1]}
            height={Math.round((d.widths[1] * ah) / aw)}
            loading={loading}
            decoding="async"
            fetchPriority={eager ? 'high' : undefined}
          />
        </picture>
        <img className="layer layer-shaded" src={src('shaded', mid, 'webp')} srcSet={set('shaded', d.drawWidths, 'webp')} sizes={sizes} alt="" aria-hidden="true" loading={loading} decoding="async" width={mid} height={Math.round((mid * ah) / aw)} />
        <img className="layer layer-outline" src={src('outline', mid, 'webp')} srcSet={set('outline', d.drawWidths, 'webp')} sizes={sizes} alt="" aria-hidden="true" loading={loading} decoding="async" width={mid} height={Math.round((mid * ah) / aw)} />
        {marks && (
          <svg className="sketch-marks" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            {marks}
          </svg>
        )}
        <span className="chip">{chip}</span>
      </div>
      {eraser && <Eraser />}
      <button type="button" className="sketch-toggle" aria-pressed={pinned} onClick={() => { fade(); setPinned((v) => !v); }}>
        {pinned ? <IconPhoto /> : <IconPencil />}
        <span>{pinned ? 'Photo' : 'Sketch'}</span>
        <span className="visually-hidden">{pinned ? ` — show the concept photo${label ? ` of ${label}` : ''}` : ` — show the pencil drawing${label ? ` of ${label}` : ''}`}</span>
      </button>
      </div>
      {study && (
        <figcaption className="sketch-study">
          <img src={src('shaded', d.drawWidths[0], 'webp')} alt="" loading="lazy" decoding="async" width={72} height={Math.round((72 * ah) / aw)} />
          <span>Pencil study for the concept image above.</span>
        </figcaption>
      )}
    </figure>
  );
}

/** A faint construction ellipse around the subject, drawn first (authored SVG). */
export function ConstructionMarks({ img }: { img: string }) {
  const d = images[img];
  return (
    <ellipse className="construct draw-path" pathLength={1} cx={d.cx} cy={d.cy} rx={(d.bw / 2) * 1.06} ry={(d.bh / 2) * 1.12} />
  );
}

/** A pencil-drawn block eraser with a paper sleeve and a few crumbs trailing behind it. */
function Eraser() {
  const hatch = `eraser-hatch-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <span className="eraser" aria-hidden="true">
      <svg viewBox="0 0 150 96" focusable="false">
        <defs>
          <pattern id={hatch} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(40)">
            <line x1="0" y1="0" x2="0" y2="4" className="eraser-hatch" />
          </pattern>
        </defs>
        <g className="eraser-ink">
          {/* top face */}
          <path className="eraser-top" d="M34 24 L 43 13 L 130 13 C 136 13, 139 17, 136 22 L 128 24 Z" />
          {/* worn rubber end + body */}
          <path className="eraser-body" d="M34 24 L 128 24 C 134 24, 137 28, 137 34 L 137 62 C 137 68, 133 72, 127 72 L 34 72 C 22 71, 14 63, 14 52 L 14 44 C 14 32, 22 25, 34 24 Z" />
          <path d="M137 34 L 142 27 L 142 55 L 137 62" />
          {/* paper sleeve */}
          <path className="eraser-sleeve" style={{ fill: `url(#${hatch})` }} d="M76 24 L 128 24 C 134 24, 137 28, 137 34 L 137 62 C 137 68, 133 72, 127 72 L 76 72 Z" />
          <path d="M76 24 L 84 13" />
          <path d="M88 40 L 124 40 M88 48 L 116 48 M88 56 L 120 56" className="eraser-label" />
          {/* crumbs */}
          <path className="eraser-crumb" d="M6 80 c 3 -3 7 -1 6 2 c -2 3 -6 2 -6 -2 z M18 88 c 2 -2 5 -1 4 2 c -1 2 -4 1 -4 -2 z M2 68 c 2 -1 4 0 3 2 c -1 1 -3 1 -3 -2 z M26 82 c 1 -1 3 0 2 1 c 0 1 -2 1 -2 -1 z" />
        </g>
      </svg>
    </span>
  );
}
