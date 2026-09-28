/*
  The guide: a pencil-drawn salt-bread roll hanging from the nav line.
  Geometry ported from phase-0/boards/sogeum.js. Decorative only (aria-hidden, no pointer events).
  The controller in src/motion/guide.ts drives the data-part groups with setAttribute('transform'),
  never through React state. Poses switch via the root's data-pose attribute (see guide.css rules).
*/

const FILL = { fill: 'var(--guide-fill, #F4EFE6)' } as const;
const EYE = { fill: 'var(--guide-eye, #1E1C19)' } as const;

const ROLL =
  'M27.6 70.2 C 26.8 64.4, 30.6 59.4, 36.8 57.6 C 41.8 50.6, 50.6 46.4, 60 46.4 C 69.4 46.4, 78.2 50.6, 83.2 57.6 C 89.4 59.4, 93.2 64.4, 92.4 70.2 C 91.8 74.8, 87.4 78, 80.2 78.8 C 67 80.6, 53 80.6, 39.8 78.8 C 32.6 78, 28.2 74.8, 27.6 70.2 Z';

function Mitten({ x, y, part }: { x: number; y: number; part: string }) {
  return (
    <g data-part={part}>
      <path style={FILL} d={`M${x - 3.4} ${y + 2.2} C ${x - 4} ${y - 1.6}, ${x - 2.4} ${y - 4}, ${x} ${y - 4} C ${x + 2.4} ${y - 4}, ${x + 4} ${y - 1.6}, ${x + 3.4} ${y + 2.2} C ${x + 2} ${y + 3.6}, ${x - 2} ${y + 3.6}, ${x - 3.4} ${y + 2.2} Z`} />
      <path strokeWidth={0.9} opacity={0.7} d={`M${x - 2} ${y + 1.2} C ${x - 0.8} ${y + 2.2}, ${x + 0.8} ${y + 2.2}, ${x + 2} ${y + 1.2}`} />
    </g>
  );
}

function Fist({ x, y, fx, fy }: { x: number; y: number; fx: number; fy: number }) {
  return (
    <>
      <circle cx={x} cy={y} r={2.3} style={FILL} />
      <path strokeWidth={1.4} d={`M${x} ${y} L ${fx} ${fy}`} />
    </>
  );
}

export function GuideSVG({ idSuffix = 'g', pose = 'neutral' }: { idSuffix?: string; pose?: string }) {
  const hatch = `sg-hatch-${idSuffix}`;
  const pencil = `sg-pencil-${idSuffix}`;
  return (
    <svg viewBox="0 0 120 112" aria-hidden="true" focusable="false" data-pose={pose} className="guide-svg">
      <defs>
        <pattern id={hatch} width="2.6" height="2.6" patternUnits="userSpaceOnUse" patternTransform="rotate(40)">
          <line x1="0" y1="0" x2="0" y2="2.6" style={{ stroke: 'var(--guide-ink, #2B2825)' }} strokeWidth=".5" opacity=".5" />
        </pattern>
        <filter id={pencil} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves={2} seed={7} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale=".7" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <g className="g-ink" filter={`url(#${pencil})`}>
        <g data-part="body">
          <g data-part="lean">
            <g strokeWidth={1.45}>
              <path data-part="arm-l-grip" d="M46 53 C 43.6 40, 40.4 24, 38.2 11.5" />
              <path data-part="arm-r-grip" d="M74 53 C 76.4 40, 79.6 24, 81.8 11.5" />
              <path data-part="arm-l-reach" d="M44 54 C 36 42, 28 26, 23.4 11.5" />
              <path data-part="arm-r-reach" d="M76 54 C 84 42, 92 26, 96.6 11.5" />
            </g>
            <g strokeWidth={1.4}>
              <g data-part="leg-l">
                <path d="M53.6 79.4 C 53 86, 52.4 93, 51.6 100" />
                <path strokeWidth={1.6} d="M51.6 100 C 49 101.2, 46.2 101.2, 45 99.6" />
              </g>
              <g data-part="leg-r">
                <path d="M66.4 79.4 C 67 86, 67.6 93, 68.4 100" />
                <path strokeWidth={1.6} d="M68.4 100 C 71 101.2, 73.8 101.2, 75 99.6" />
              </g>
            </g>
            <g data-part="roll">
              <path strokeWidth={1.7} style={FILL} d={ROLL} />
              <g strokeWidth={1.05} opacity={0.85}>
                <path d="M36.8 57.6 C 40.6 62.4, 41.4 70.6, 39 78.6" />
                <path d="M47.2 50 C 51.6 57.4, 52.6 68.8, 49.6 79.8" />
                <path d="M71.4 49.4 C 75.8 57, 76.6 68.6, 73.4 79.8" />
                <path d="M83.2 57.6 C 86.6 62.4, 87.2 70.4, 85 78.2" />
              </g>
              <path d="M44.6 56 C 47 62, 47.4 71, 45.6 78.8 L 48.6 79.6 C 50.8 70, 50.2 61, 47.2 54.4 Z" fill={`url(#${hatch})`} stroke="none" />
              <path d="M81 56.8 C 83.6 62.4, 84 70.8, 82.6 78.4 L 85 78.2 C 87.2 70.4, 86.6 62.4, 83.2 57.6 Z" fill={`url(#${hatch})`} stroke="none" />
              <path d="M31.6 73.6 C 44 79.4, 76 79.4, 88.4 73.6 C 84 78.8, 36 78.8, 31.6 73.6 Z" fill={`url(#${hatch})`} stroke="none" />
              <g strokeWidth={0.85}>
                <path d="M55.6 49.8 l1.6 -0.5 l0.5 1.6 l-1.6 0.5 z" />
                <path d="M61.6 48.6 l1.4 0.3 l-0.3 1.4 l-1.4 -0.3 z" />
                <path d="M66.4 50.8 l1.2 -0.5 l0.5 1.2 l-1.2 0.5 z" />
              </g>
              <g data-part="face">
                <g strokeWidth={1} opacity={0.75}>
                  <path d="M54.2 57.6 C 55.6 56.8, 57.2 56.8, 58.4 57.4" />
                  <path d="M62.6 57.4 C 63.8 56.8, 65.4 56.8, 66.8 57.6" />
                </g>
                <g data-part="eyes" style={EYE} stroke="none">
                  <g data-part="blink">
                    <ellipse cx="56.4" cy="62.4" rx="1.7" ry="2.05" />
                    <ellipse data-part="eye-r" cx="64.6" cy="62.4" rx="1.7" ry="2.05" />
                  </g>
                </g>
                <path data-part="wink" strokeWidth={1.1} d="M62.6 62.6 C 63.6 61.6, 65.4 61.6, 66.4 62.6" />
                <path strokeWidth={1} d="M59 67.8 C 60 68.6, 61.2 68.6, 62.2 67.8" />
              </g>
            </g>
            <g strokeWidth={1.45}>
              <g data-part="front-down-r">
                <path d="M86.6 72 C 91 78, 93.6 85, 95.4 92" />
                <Fist x={96} y={94.4} fx={97.6} fy={99.4} />
              </g>
              <g data-part="front-point-r">
                <path d="M88.6 71 C 95 72.4, 100.4 72.8, 105.8 72.6" />
                <Fist x={108} y={72.6} fx={113.2} fy={72.6} />
              </g>
              <g data-part="front-down-l">
                <path d="M33.4 72 C 29 78, 26.4 85, 24.6 92" />
                <Fist x={24} y={94.4} fx={22.4} fy={99.4} />
              </g>
              <g data-part="front-camera">
                <path d="M84 75 C 86.6 78.6, 87.6 81.6, 87.4 84" />
                <rect x="79" y="83.6" width="15" height="10" rx="1.6" style={FILL} />
                <circle cx="86.5" cy="88.6" r="3" style={FILL} />
                <circle cx="86.5" cy="88.6" r="1.1" />
                <path strokeWidth={1} d="M81 83.6 L 82 81.6 L 84.8 81.6 L 85.6 83.6" />
                <path data-part="flash" strokeWidth={0.9} d="M96.8 82.6 L 100 80.2 M97.6 87 L 101.6 86.8 M96.8 91.2 L 100 93.4" />
              </g>
            </g>
          </g>
        </g>
        <g strokeWidth={1.45}>
          <Mitten part="hand-l-grip" x={38.2} y={9.2} />
          <Mitten part="hand-r-grip" x={81.8} y={9.2} />
          <Mitten part="hand-l-reach" x={23.4} y={9.2} />
          <Mitten part="hand-r-reach" x={96.6} y={9.2} />
          <Mitten part="hand-l-sit" x={30.6} y={9.2} />
          <Mitten part="hand-r-sit" x={89.4} y={9.2} />
        </g>
      </g>
    </svg>
  );
}

/** Mobile peek: the roll looking over the header rule. Parts are driven by motion/guide.ts:
    peek-move (GSAP reactions), peek-body (finger-follow tilt), peek-face, peek-eyes, wink, flash. */
export function PeekSVG() {
  return (
    <svg viewBox="22 38 76 48" aria-hidden="true" focusable="false" className="peek-svg" data-peek="neutral">
      <g className="g-ink" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <g data-part="peek-move">
          <g data-part="peek-body">
            <path strokeWidth={1.8} style={FILL} d={ROLL} />
            <g strokeWidth={1.15} opacity={0.85}>
              <path d="M36.8 57.6 C 40.6 62.4, 41.4 70.6, 39 78.6" />
              <path d="M47.2 50 C 51.6 57.4, 52.6 68.8, 49.6 79.8" />
              <path d="M71.4 49.4 C 75.8 57, 76.6 68.6, 73.4 79.8" />
              <path d="M83.2 57.6 C 86.6 62.4, 87.2 70.4, 85 78.2" />
            </g>
            <g strokeWidth={0.95}>
              <path d="M55.6 49.8 l1.6 -0.5 l0.5 1.6 l-1.6 0.5 z" />
              <path d="M61.6 48.6 l1.4 0.3 l-0.3 1.4 l-1.4 -0.3 z" />
              <path d="M66.4 50.8 l1.2 -0.5 l0.5 1.2 l-1.2 0.5 z" />
            </g>
            <g data-part="peek-face">
              <g strokeWidth={1} opacity={0.75}>
                <path d="M54.2 57.6 C 55.6 56.8, 57.2 56.8, 58.4 57.4" />
                <path d="M62.6 57.4 C 63.8 56.8, 65.4 56.8, 66.8 57.6" />
              </g>
              <g data-part="peek-eyes" style={EYE} stroke="none">
                <ellipse cx="56.4" cy="62.4" rx="1.9" ry="2.25" />
                <ellipse data-part="peek-eye-r" cx="64.6" cy="62.4" rx="1.9" ry="2.25" />
              </g>
              <path data-part="peek-wink" strokeWidth={1.2} d="M62.6 62.6 C 63.6 61.6, 65.4 61.6, 66.4 62.6" />
              <path strokeWidth={1} d="M59 67.8 C 60 68.6, 61.2 68.6, 62.2 67.8" />
            </g>
          </g>
          <path data-part="peek-flash" strokeWidth={1.1} d="M88 47 L 92 43 M90.5 52 L 95.5 51 M84 44 L 85 39" />
        </g>
        <g strokeWidth={1.4}>
          <Mitten part="peek-hand-l" x={33} y={68.4} />
          <Mitten part="peek-hand-r" x={87} y={68.4} />
        </g>
      </g>
    </svg>
  );
}
