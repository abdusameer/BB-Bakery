import { gsap } from 'gsap';
import { menuItems } from '../content';
import { silhouettes } from '../generated/silhouettes';

/*
  The croissant mascot's scroll scenes (tablet and desktop rig). It is the same hanging guide
  element from the header, moved with transforms only: it never duplicates or teleports.

    hang → wake → wave → exit ··· [ moveToPastry → recommend → hideBehindPastry ] × each bread ··· returnHome → hang
           (first scroll)   (behind the    (peeks over it, walks round, presents it,  (behind    (peeks down from behind
                            header line)    nods; the wink is saved for the last one)   it)        the line, then lowers in)

  The page is the scenery: he hangs from the pencil nav line and pulls himself up behind it,
  hides behind each bread in the menu photos (a clip-path hole traced from that photo), and
  comes back by peeking down from behind the line. The wave plays once per visit and each bread
  is presented once, when the reader pauses on it; between scenes he is simply away (hidden),
  so scrolling doesn't keep him moving. Positions come only from the approved spots in content.ts.

  In the "after hours" chapter (chalk): walkToShop — he walks in from the edge of the Visit map,
  follows its dotted route to the shop pin, presents it, glances at Get directions and walks back
  out; waveGoodbye — at the footer he climbs up behind its top edge, hands on the ledge, waves, and
  stays there until the reader scrolls back up.
*/

export type Pt = [number, number];
export type Look = { ex: number; ey: number; head: number; lean: number; legs: number };

/** What the rig controller (guide.ts) lends to the scenes. */
export type Rig = {
  wrap: HTMLElement;
  svg: SVGSVGElement;
  part: (name: string) => SVGGElement;
  /** eye / head / lean / leg targets the rig's loop follows while a scene runs */
  look: Look;
  /** 'live': a scene drives the rig; 'idle': the mascot is away (hidden), the loop may rest */
  scene: (state: 'live' | 'idle') => void;
  setPose: (pose: string) => void;
  /** x on the nav line under the current section */
  homeX: () => number;
  /** 'hang' below the nav line (tablet, desktop) or 'ledge' leaning on the header rule (phones) */
  homeKind: () => 'hang' | 'ledge';
  /** hand control back to the rig at home (pose, mode, pointer follow for the current section) */
  goHome: () => void;
  /** viewport y of the pencil nav line */
  lineY: () => number;
  /** hanging at home and free (not travelling, hovered, perched or in the opening climb-in) */
  ready: () => boolean;
};

/* ---------------------------------------------------------------------------
   Approved pastry spots
   --------------------------------------------------------------------------- */

export type Spot = {
  index: number;
  item: HTMLElement;
  fig: HTMLElement;
  frame: HTMLElement;
  at: Pt;                 // feet position, % of the photo frame
  center: Pt;             // traced pastry center, %
  box: [number, number, number, number];
  outline: Pt[];          // traced pastry outline, %
};

export function findSpots(): Spot[] {
  const out: Spot[] = [];
  document.querySelectorAll<HTMLElement>('#menu .menu-item').forEach((item, index) => {
    const m = menuItems[index];
    const sil = m && silhouettes[m.img];
    const fig = item.querySelector<HTMLElement>('.sketch');
    const frame = item.querySelector<HTMLElement>('.sketch-frame');
    if (!m?.mascotSpot || !sil || !fig || !frame) return;
    out.push({ index, item, fig, frame, at: [m.mascotSpot.x, m.mascotSpot.y], center: sil.center, box: sil.box, outline: sil.outline });
  });
  return out;
}

const cssNum = (el: HTMLElement, k: string) => parseFloat(el.style.getPropertyValue(k));
export const toVp = (r: DOMRect, p: Pt): Pt => [r.left + (r.width * p[0]) / 100, r.top + (r.height * p[1]) / 100];
export const headerBottom = () => document.querySelector('.site-header')?.getBoundingClientRect().bottom ?? 72;

/** The photograph has fully drawn in and nothing is erasing or replacing it. */
export const resolved = (s: Spot) =>
  !(cssNum(s.fig, '--ep') < 125) && !(cssNum(s.fig, '--xo') > -25) && !s.item.hasAttribute('data-inactive') && !s.fig.classList.contains('is-sketch');

/** The whole pastry (with room above it) is on screen, clear of the header. */
export function inView(s: Spot, margin = 16) {
  const r = s.frame.getBoundingClientRect();
  const top = toVp(r, [0, s.box[1]])[1];
  const bottom = toVp(r, [0, s.box[3]])[1];
  return top > headerBottom() + margin && bottom < window.innerHeight - margin;
}

const pinnedIndex = () => Number(document.querySelector('#menu .menu-index a[aria-current="true"]')?.getAttribute('data-index') ?? 0);
/** Already scrolled past (flow layout) or already erased (pinned layout). */
function isPast(s: Spot) {
  if (s.item.closest('.is-pinned')) {
    const cur = pinnedIndex();
    return s.index < cur || (s.index === cur && cssNum(s.fig, '--xo') > -25);
  }
  return toVp(s.frame.getBoundingClientRect(), [0, s.box[3]])[1] < headerBottom();
}

/** The breads in menu order, each presented once per visit, when the reader stops on it. */
export function createSpotQueue() {
  const spots = findSpots();
  const done = new Set<number>();
  const tries = new Map<number, number>();
  const offCenter = (s: Spot) => { const r = s.frame.getBoundingClientRect(); return Math.abs(r.top + r.height / 2 - window.innerHeight / 2); };
  return {
    spots,
    /** the bread on screen now (drawn in, fully in view) still waiting to be presented */
    current(): Spot | null {
      const ready = spots.filter((s) => !done.has(s.index) && (tries.get(s.index) ?? 0) < 2 && resolved(s) && inView(s));
      return ready.sort((a, b) => offCenter(a) - offCenter(b))[0] ?? null;
    },
    tried(s: Spot) { tries.set(s.index, (tries.get(s.index) ?? 0) + 1); },
    done(s: Spot) { done.add(s.index); },
    count: () => done.size,
    /** no bread after this one is still waiting further down the menu */
    isLast: (s: Spot) => !spots.some((o) => o.index > s.index && !done.has(o.index) && !isPast(o)),
    /** some bread is still waiting further down (or on screen) */
    anyAhead: () => spots.some((o) => !done.has(o.index) && (tries.get(o.index) ?? 0) < 2 && !isPast(o))
  };
}

/* ---------------------------------------------------------------------------
   Geometry
   --------------------------------------------------------------------------- */

export function inside(poly: Pt[], x: number, y: number) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
const px = (n: number) => `${n.toFixed(1)}px`;
/** Everything visible except inside `hole` (even-odd polygon, element-local px). */
const holeClip = (hole: Pt[]) => {
  const o = [[-900, -900], [1100, -900], [1100, 1100], [-900, 1100], [-900, -900]];
  const pts = [...o, ...hole, hole[0], [-900, -900]].map(([x, y]) => `${px(x)} ${px(y)}`);
  return `polygon(evenodd, ${pts.join(', ')})`;
};
/** Everything below local y. */
const belowClip = (y: number) => `polygon(-900px ${px(y)}, 1100px ${px(y)}, 1100px 1100px, -900px 1100px)`;

/* ---------------------------------------------------------------------------
   The director (tablet + desktop rig)
   --------------------------------------------------------------------------- */

type Phase = 'home' | 'busy' | 'away' | 'pastry' | 'hidden' | 'ledge';
type Path = { H: Pt; P: Pt; L: Pt };
type Box = { l: number; t: number; r: number; b: number };
/** what hides him: nothing, the nav line (above it), a bread's outline, or the outside of a box */
type Clip = { kind: 'none' } | { kind: 'line'; offset: number } | { kind: 'pastry'; spot: Spot } | { kind: 'box'; box: () => Box };
const OPEN = 1e5;

// Rig geometry (viewBox 0 0 120 112): feet at (60, 101), hands on the line at y 9.2.
const FEET: Pt = [60, 101];
const HAND_Y = 9.2;
const FIG_H = 54.6;                 // roll top to feet, rig units
const EYE_Y = 62.4;
const SHOULDER_WAVE = '88.8 62.6';
const SHOULDER_PRESENT = '89.8 66.8';
const ARM_DOWN = 40;                // clockwise from the drawn pose: the arm hangs at his side
const HAND_PRESENT: Pt = [112.8, 58.8];   // the open hand of the presenting arm
const LEDGE: Pt = [60, 9.2];        // where the resting mittens sit (the line he hangs from / leans on)
const LEDGE_RAISE = -67;            // body lift so his head and eyes clear the ledge
const PIN_SIDE: Pt = [384, 254];    // just left of the shop pin's head (viewBox units): his hand rests there, not on it

export function createDirector(rig: Rig, enabled: () => boolean) {
  const { wrap, svg, look } = rig;
  const body = rig.part('body');
  const waveArm = rig.part('front-wave-r');
  const ticks = rig.part('wave-ticks');
  const present = rig.part('front-present-r');
  const queue = createSpotQueue();

  let phase: Phase = 'home';
  let waved = false;
  let mapDone = false, byeDone = false;
  /** where he is pinned each frame (a rig point → a viewport point) and what may cut a scene short */
  let follow: (() => { pt: Pt; vp: Pt }) | null = null;
  let guard: (() => void) | null = null;
  let tl: gsap.core.Timeline | null = null;
  let clip: Clip = { kind: 'none' };
  // at a pastry: feet position in % of its photo frame, hop height (px), the path, and whether he is behind it
  let at: { spot: Spot; pf: { x: number; y: number }; hop: { v: number }; path: Path; behind: boolean; hiding: boolean } | null = null;
  let base: Pt = [0, 0];
  let section: string | null = null;
  let awaySince = 0, lastScroll = 0, checkT = 0, ticking = false, idlePeeked = false;
  const y0 = window.scrollY;
  const timers = new Set<number>();
  const later = (fn: () => void, ms: number) => { const id = window.setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); };

  /* ---- geometry of the element ---- */
  const unit = () => Math.min(wrap.offsetWidth / 120, wrap.offsetHeight / 112);   // px per rig unit at scale 1
  const feetLocal = (): Pt => {
    const k = unit();
    return [(wrap.offsetWidth - 120 * k) / 2 + FEET[0] * k, (wrap.offsetHeight - 112 * k) / 2 + FEET[1] * k];
  };
  const origin = () => { const [fx, fy] = feetLocal(); return `${fx}px ${fy}px`; };
  /** Untransformed top-left of the element in the viewport (the header is fixed, so it's stable). */
  const measureBase = () => {
    const r = wrap.getBoundingClientRect();
    const x = Number(gsap.getProperty(wrap, 'x')) || 0, y = Number(gsap.getProperty(wrap, 'y')) || 0;
    const s = Number(gsap.getProperty(wrap, 'scale')) || 1;
    const [fx, fy] = feetLocal();
    base = [r.left - x - fx * (1 - s), r.top - y - fy * (1 - s)];
  };
  const rigLocal = ([x, y]: Pt): Pt => { const k = unit(); return [(wrap.offsetWidth - 120 * k) / 2 + x * k, (wrap.offsetHeight - 112 * k) / 2 + y * k]; };
  /** Moves the element so rig point `pt` lands on viewport point `vp` (scale is about the feet). */
  const placeAt = (pt: Pt, [vx, vy]: Pt) => {
    const [fx, fy] = feetLocal();
    const [px, py] = rigLocal(pt);
    const s = Number(gsap.getProperty(wrap, 'scale')) || 1;
    gsap.set(wrap, { x: vx - base[0] - fx - (px - fx) * s, y: vy - base[1] - fy - (py - fy) * s });
  };
  const chalk = (on: boolean) => wrap.classList.toggle('is-chalk', on);
  /** y offset that hangs him upside down by the feet, hooked just behind the line. */
  const hookY = () => { const k = unit(); const [, fy] = feetLocal(); return -(fy - (wrap.offsetHeight - 112 * k) / 2 - HAND_Y * k) - 2; };

  /* ---- per-frame: follow the pastry (it may scroll) and keep the occluder in place ---- */
  const applyClip = () => {
    // the bread only hides him while he is behind it (in front of it, it must never cut him)
    if (clip.kind === 'none' || (clip.kind === 'pastry' && at && !at.behind)) { wrap.style.clipPath = ''; return; }
    const r = wrap.getBoundingClientRect();
    const s = Number(gsap.getProperty(wrap, 'scale')) || 1;
    if (clip.kind === 'line') { wrap.style.clipPath = belowClip((rig.lineY() + clip.offset - r.top) / s); return; }
    if (clip.kind === 'box') {
      const b = clip.box();
      const lx = (v: number) => gsap.utils.clamp(-900, 1100, (v - r.left) / s), ly = (v: number) => gsap.utils.clamp(-900, 1100, (v - r.top) / s);
      const [l, t, rr, bb] = [lx(b.l), ly(b.t), lx(b.r), ly(b.b)];
      wrap.style.clipPath = `polygon(${px(l)} ${px(t)}, ${px(rr)} ${px(t)}, ${px(rr)} ${px(bb)}, ${px(l)} ${px(bb)})`;
      return;
    }
    const fr = clip.spot.frame.getBoundingClientRect();
    wrap.style.clipPath = holeClip(clip.spot.outline.map((p) => { const [vx, vy] = toVp(fr, p); return [(vx - r.left) / s, (vy - r.top) / s] as Pt; }));
  };
  const frame = () => {
    if (follow) { const f = follow(); placeAt(f.pt, f.vp); }
    guard?.();
    applyClip();
  };
  const startTicker = () => { if (!ticking) { ticking = true; gsap.ticker.add(frame); } };
  const stopTicker = () => { if (ticking) { ticking = false; gsap.ticker.remove(frame); } };

  const blink = () => { svg.classList.add('is-blinking'); later(() => svg.classList.remove('is-blinking'), 160); };
  const wink = () => { svg.classList.add('is-winking'); later(() => svg.classList.remove('is-winking'), 460); };
  const play = (next: gsap.core.Timeline) => { tl?.kill(); tl = next; return next; };
  const setLook = (v: Partial<Look>) => Object.assign(look, { ex: 0, ey: 0, head: 0, lean: 0, legs: 0 }, v);

  /** Out of sight, parked at home size; the rig's loop can rest. */
  const park = (next: Phase) => {
    gsap.set(wrap, { autoAlpha: 0, scale: 1, y: 0 });
    gsap.set(svg, { rotation: 0 });
    gsap.set(body, { y: 0, rotation: 0 });
    gsap.set([waveArm, present], { rotation: 0 });
    gsap.set(ticks, { opacity: 0 });
    svg.classList.remove('is-winking');
    rig.setPose('neutral');
    setLook({});
    at = null;
    follow = null;
    guard = null;
    chalk(false);
    clip = { kind: 'none' };
    applyClip();
    stopTicker();
    rig.scene('idle');
    phase = next;
    awaySince = performance.now();
    schedule(1000);
  };

  /* =======================  the states  ======================= */

  /** STATE 1: at home on the nav line; the rig's own loop (pointer follow, nav travel) is in charge. */
  function hang() {
    tl = null;
    follow = null;
    guard = null;
    chalk(false);
    clip = { kind: 'none' };
    applyClip();
    stopTicker();
    gsap.set(wrap, { autoAlpha: 1, y: 0, scale: 1 });
    gsap.set(svg, { rotation: 0 });
    rig.goHome();
    phase = 'home';
    schedule(500);                                                        // something may be waiting already
  }

  /** STATE 2: notices the scroll, looks down at the page, waves, then (STATE 3) leaves. */
  function wake() {
    phase = 'busy';
    waved = true;
    rig.scene('live');
    const r = wrap.getBoundingClientRect();
    const toward = r.left + r.width / 2 < window.innerWidth / 2 ? 1 : -1;
    const ledge = rig.homeKind() === 'ledge';
    play(gsap.timeline({ onComplete: () => exit() }))
      .to(body, { y: '-=2.6', duration: 0.12, ease: 'power2.out' }, 0)            // a small start: someone's here
      .to(body, { y: '+=2.6', duration: 0.26, ease: 'power2.in' }, 0.12)
      .to(look, { ex: 1.6 * toward, ey: 1.8, head: 5 * toward, duration: 0.3, ease: 'power2.out' }, 0.04)
      .call(blink, [], 0.32)
      .add(wave(ledge ? 'ledgeWave' : 'wave'), 0.5)
      .call(() => rig.setPose(ledge ? 'ledge' : 'neutral'))                        // grabs the line again
      .to(look, { ex: 0.4 * toward, ey: 0.6, head: 0, lean: 0, duration: 0.24 }, '+=0.02')
      .to({}, { duration: 0.16 });
  }

  /** Lets go with the right hand and waves (about 1.2 s). */
  function wave(pose = 'wave') {
    return gsap.timeline()
      .call(() => rig.setPose(pose))
      .fromTo(waveArm, { rotation: ARM_DOWN, svgOrigin: SHOULDER_WAVE }, { rotation: -14, duration: 0.26, ease: 'power2.out', immediateRender: false }) // raises it
      .to(ticks, { opacity: 0.85, duration: 0.1 }, 0.14)
      .to(waveArm, { rotation: 14, duration: 0.19, ease: 'sine.inOut', repeat: 4, yoyo: true })
      .to(look, { lean: -2.2, duration: 0.19, ease: 'sine.inOut', repeat: 4, yoyo: true }, '<')
      .to(ticks, { opacity: 0, duration: 0.12 }, '>-0.12')
      .to(waveArm, { rotation: ARM_DOWN, duration: 0.16, ease: 'power2.in' });
  }

  /** STATE 3: pulls himself up and slips behind the header's border. */
  function exit(then?: () => void) {
    phase = 'busy';
    rig.scene('live');
    measureBase();
    const h = wrap.offsetHeight;
    if (rig.homeKind() === 'ledge') {                                              // phones: ducks behind the header rule
      clip = { kind: 'box', box: () => ({ l: -OPEN, t: -OPEN, r: OPEN, b: rig.lineY() + 0.5 }) };
      startTicker();
      applyClip();
      play(gsap.timeline({ onComplete: () => { park('away'); then?.(); } }))
        .to(look, { ex: 0, ey: 1.4, head: 0, lean: 0, duration: 0.15 }, 0)
        .to(wrap, { y: h * 0.5, duration: 0.34, ease: 'power2.in' }, 0.08);
      return;
    }
    clip = { kind: 'line', offset: -4 };
    startTicker();
    play(gsap.timeline({ onComplete: () => { park('away'); then?.(); } }))
      .to(look, { ex: 0, ey: -1.4, head: 0, lean: 0, duration: 0.2 }, 0)          // looks up at the line
      .to(body, { y: -15, duration: 0.3, ease: 'power2.inOut' }, 0.06)            // pull-up
      .to(look, { legs: 14, duration: 0.3, ease: 'power2.inOut' }, 0.06)          // knees out
      .to(wrap, { y: -(h + 18), duration: 0.42, ease: 'power2.in' }, 0.3);        // up and over, behind the line
  }

  /** Walk the feet to a point in a few small hops (a pencil character doesn't glide). */
  function walk(t: gsap.core.Timeline, a: NonNullable<typeof at>, to: Pt, dur: number, hops: number, pos?: number | string) {
    t.to(a.pf, { x: to[0], y: to[1], duration: dur, ease: 'power1.inOut' }, pos);
    t.to(a.hop, { v: 7, duration: dur / (hops * 2), ease: 'sine.out', yoyo: true, repeat: hops * 2 - 1 }, '<');
    return t;
  }

  /** STATE 4a: peeks over the top of an approved bread, walks around its end and stands beside it. */
  function moveToPastry(spot: Spot) {
    queue.tried(spot);
    const first = queue.count() === 0;                                    // the first bread gets the full hello
    phase = 'pastry';
    rig.scene('live');
    gsap.set(wrap, { scale: 1, transformOrigin: origin() });
    measureBase();
    const fr = spot.frame.getBoundingClientRect();
    const s = gsap.utils.clamp(0.8, 1.7, (0.105 * fr.height) / (FIG_H * unit()));
    const path = pathFor(spot, s, fr);
    at = { spot, pf: { x: path.H[0], y: path.H[1] }, hop: { v: 0 }, path, behind: true, hiding: false };
    rig.setPose('present');
    gsap.set(present, { rotation: ARM_DOWN, svgOrigin: SHOULDER_PRESENT });
    gsap.set(body, { y: 0, rotation: 0 });
    gsap.set(svg, { rotation: 0 });
    setLook({});
    gsap.set(wrap, { scale: s });
    clip = { kind: 'pastry', spot };
    const a = at;
    follow = () => { const [vx, vy] = toVp(a.spot.frame.getBoundingClientRect(), [a.pf.x, a.pf.y]); return { pt: FEET, vp: [vx, vy - a.hop.v] }; };
    // the reader moved on (scrolled, erased, toggled to the sketch): leave at once, behind the bread
    guard = () => { if (phase === 'pastry' && !a.hiding && (!resolved(a.spot) || !inView(a.spot, 0))) hideBehindPastry(true); };
    startTicker();
    frame();
    gsap.set(wrap, { autoAlpha: 1 });
    const go = first ? 0.8 : 0.55;
    const t = play(gsap.timeline({ onComplete: () => recommend(spot, first) }))
      .to(a.pf, { x: path.P[0], y: path.P[1], duration: 0.45, ease: 'power2.out' })            // eyes come up over the bread
      .to(look, { ex: -1.6, ey: 0.6, head: -5, duration: 0.3, ease: 'power2.out' }, 0.2);      // …and find you
    if (first) t.call(blink, [], 0.62);
    t.to(body, { rotation: -5, svgOrigin: `${FEET[0]} ${FEET[1]}`, duration: 0.2 }, go)         // turns to go round
      .to(look, { ex: -2.2, ey: 0.2, head: -3, duration: 0.2 }, go);
    walk(t, a, path.L, 0.5, 2, go + 0.05)                                                       // behind the bread's end…
      .call(() => { a.behind = false; })                                                        // …and out in the open
      .to(body, { rotation: 0, duration: 0.2 }, '>');
    walk(t, a, spot.at, 0.46, 2, '<')                                                           // forward to his spot
      .to(look, { ex: 1.4, ey: 0.4, head: 2, duration: 0.25 }, '<0.2')
      .to(body, { y: 1.6, duration: 0.08, ease: 'power2.out' })                                 // lands
      .to(body, { y: 0, duration: 0.14, ease: 'power2.inOut' });
  }

  /**
   * STATE 4b: leans toward the bread, presents it with an open hand, looks back at you and nods
   * (two nods for the first bread, one after that). The wink is saved for the last bread. No words.
   */
  function recommend(spot: Spot, first: boolean) {
    queue.done(spot);
    const last = queue.isLast(spot);
    const nods = first ? 2 : 1;
    const t = play(gsap.timeline({ onComplete: () => hideBehindPastry() }))
      .to(present, { rotation: 0, duration: 0.34, ease: 'back.out(1.7)' }, 0)                       // "this one"
      .to(body, { rotation: 4, svgOrigin: `${FEET[0]} ${FEET[1]}`, duration: 0.42, ease: 'power2.out' }, 0)
      .to(look, { ex: 2.4, ey: -0.9, head: 4, duration: 0.3, ease: 'power2.out' }, 0.05)           // looks at it
      .to(present, { rotation: -7, duration: 0.16, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 0.62)
      .to(look, { ex: 0.3, ey: 0.4, head: 0, duration: 0.24, ease: 'power2.inOut' }, 0.95)         // back to you
      .to(look, { head: 6.5, duration: 0.13, ease: 'sine.inOut', yoyo: true, repeat: nods * 2 - 1 }, 1.22);
    const end = 1.22 + nods * 0.26;
    if (last) t.call(wink, [], end + 0.08).to({}, { duration: 0.55 }, end + 0.08);
    else t.to({}, { duration: 0.3 }, end);
  }

  /** STATE 5: walks back round the bread and ducks down behind it (clipped by its outline), no fade. */
  function hideBehindPastry(fast = false) {
    if (!at) return;
    const a = at;
    a.hiding = true;
    const k = fast ? 0.55 : 1;
    const t = play(gsap.timeline({ onComplete: () => park('hidden') }))
      .to(present, { rotation: ARM_DOWN, duration: 0.2 * k, ease: 'power2.in' }, 0)
      .to(look, { ex: -2, ey: -1, head: -2, duration: 0.2 * k }, 0);
    if (!a.behind) {
      t.to(body, { rotation: -5, svgOrigin: `${FEET[0]} ${FEET[1]}`, duration: 0.2 * k }, 0);
      walk(t, a, a.path.L, 0.46 * k, 2, 0.1 * k)                                                 // back round the end…
        .call(() => { a.behind = true; })
        .to(body, { rotation: 5, duration: 0.2 * k }, '>')
        .to(look, { ex: 2.2, ey: -0.6, duration: 0.2 * k }, '<');
      walk(t, a, a.path.P, 0.4 * k, 1, '<');                                                     // …behind it…
    }
    t.to(a.pf, { x: a.path.H[0], y: a.path.H[1], duration: 0.26 * k, ease: 'power2.in' }, '>');  // …and ducks down
  }

  /**
   * The route round an approved bread, in % of its frame: H hidden behind it (whole figure inside the
   * traced outline), P just risen so his eyes clear its top edge, L clear of its left end.
   */
  function pathFor(spot: Spot, s: number, fr: DOMRect): Path {
    const u = unit() * s;
    const ex = (v: number) => ((v * u) / fr.width) * 100, ey = (v: number) => ((v * u) / fr.height) * 100;
    const [bx0, , bx1, by1] = spot.box;
    const x = bx0 + (bx1 - bx0) * 0.36;
    let top = spot.center[1];
    for (let y = 0; y < 100; y += 0.5) if (inside(spot.outline, x, y)) { top = y; break; }
    const P: Pt = [x, top + ey(FEET[1] - EYE_Y - 3)];
    const probes: Pt[] = [];
    for (const gx of [-38, -12, 12, 40]) for (const gy of [-58, -29, 0]) probes.push([ex(gx), ey(gy)]);
    let H: Pt = [x, Math.min(by1, P[1] + ey(40))];
    for (let dy = 10; dy <= 70; dy += 3) {
      const c: Pt = [x, P[1] + ey(dy)];
      if (probes.every(([dx, dyy]) => inside(spot.outline, c[0] + dx, c[1] + dyy))) { H = c; break; }
    }
    const L: Pt = [Math.max(ex(40), bx0 - ex(38 + 8)), P[1] + ey(12)];
    return { H, P, L };
  }

  /* ---------------- the after-hours chapter ---------------- */

  const mapSvg = () => document.querySelector<SVGSVGElement>('.visit-map svg');
  /** Route drawn, pin placed, whole map on screen. */
  const mapReady = () => {
    const m = mapSvg();
    const pin = document.querySelector('.visit-map .pin');
    const clipW = Number(document.querySelector('.route-clip-rect')?.getAttribute('width') ?? 0);
    if (!m || !pin || clipW < 425 || Number(getComputedStyle(pin).opacity) < 0.9) return false;
    const r = m.getBoundingClientRect();
    return r.top > headerBottom() + 8 && r.bottom < window.innerHeight - 8;
  };
  const footerReady = () => {
    const f = document.querySelector('.site-footer');
    if (!f) return false;
    const r = f.getBoundingClientRect();
    return r.top < window.innerHeight - Math.min(r.height * 0.7, 90) && r.top > headerBottom() + 120;
  };

  /** Visit: walks in from the map's left edge along the dotted route to the pin and presents it. */
  function walkToShop() {
    const m = mapSvg();
    const route = m?.querySelector<SVGPathElement>('.route');
    if (!m || !route) { mapDone = true; return; }
    mapDone = true;
    phase = 'busy';
    rig.scene('live');
    chalk(true);
    gsap.set(wrap, { scale: 1, transformOrigin: origin() });
    measureBase();
    const ctm = () => m.getScreenCTM()!;
    const toMapVp = ([x, y]: Pt): Pt => { const c = ctm(); return [c.a * x + c.c * y + c.e, c.b * x + c.d * y + c.f]; };
    const ppu = ctm().a;
    const s = gsap.utils.clamp(0.95, 1.5, (66 * ppu) / (FIG_H * unit()));
    // stop where the presenting hand meets the pin's head
    const L = route.getTotalLength();
    const hx = ((HAND_PRESENT[0] - FEET[0]) * unit() * s) / ppu, hy = ((HAND_PRESENT[1] - FEET[1]) * unit() * s) / ppu;
    let stop = L * 0.8, best = Infinity;
    for (let l = L * 0.45; l <= L * 0.97; l += L / 240) {
      const q = route.getPointAtLength(l);
      const d = Math.hypot(q.x + hx - PIN_SIDE[0], q.y + hy - PIN_SIDE[1]);
      if (d < best) { best = d; stop = l; }
    }
    // the walk, in map units: in from beyond the drawing's left edge, then along the route
    const pts: Pt[] = [[-80, 506], [-20, 504]];
    for (let i = 0; i <= 48; i++) { const q = route.getPointAtLength((stop * i) / 48); pts.push([q.x, q.y]); }
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const total = cum[cum.length - 1];
    const along = (v: number): Pt => {
      const d = gsap.utils.clamp(0, total, v * total);
      let i = 1;
      while (i < cum.length - 1 && cum[i] < d) i++;
      const t = (d - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
      return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t];
    };
    const prog = { v: 0 }, hop = { v: 0 };
    let leaving = false;
    rig.setPose('present');
    gsap.set(present, { rotation: ARM_DOWN, svgOrigin: SHOULDER_PRESENT });
    gsap.set(body, { y: 0, rotation: 0 });
    gsap.set(svg, { rotation: 0 });
    setLook({ ex: 1.6, ey: -0.6 });
    gsap.set(wrap, { scale: s });
    follow = () => { const [vx, vy] = toMapVp(along(prog.v)); return { pt: FEET, vp: [vx, vy - hop.v] }; };
    clip = { kind: 'box', box: () => ({ l: m.getBoundingClientRect().left, t: -OPEN, r: OPEN, b: OPEN }) };  // off the drawing = out of sight
    const leave = (fast: boolean) => {
      if (leaving) return;
      leaving = true;
      const k = fast ? 0.5 : 1;
      const t = play(gsap.timeline({ onComplete: () => park('hidden') }))
        .to(present, { rotation: ARM_DOWN, duration: 0.2 * k }, 0)
        .to(body, { rotation: -4, svgOrigin: `${FEET[0]} ${FEET[1]}`, duration: 0.25 * k }, 0)
        .to(look, { ex: -2.2, ey: 0.6, head: -3, duration: 0.25 * k }, 0)
        .to(prog, { v: 0, duration: 1.5 * k, ease: 'power1.in' }, 0.15 * k);
      t.to(hop, { v: 6, duration: (1.5 * k) / 8, ease: 'sine.out', yoyo: true, repeat: 7 }, 0.15 * k);
    };
    // the reader scrolled the map away: he heads back off the edge
    guard = () => { if (!leaving && (!m.isConnected || m.getBoundingClientRect().bottom < headerBottom() + 20 || m.getBoundingClientRect().top > window.innerHeight - 40)) leave(true); };
    startTicker();
    frame();
    gsap.set(wrap, { autoAlpha: 1 });
    const walkT = 2.1;
    play(gsap.timeline({ onComplete: () => leave(false) }))
      .to(body, { rotation: 3, svgOrigin: `${FEET[0]} ${FEET[1]}`, duration: 0.2 }, 0)             // leans into the walk
      .to(prog, { v: 1, duration: walkT, ease: 'power1.inOut' }, 0)
      .to(hop, { v: 6, duration: walkT / 12, ease: 'sine.out', yoyo: true, repeat: 11 }, 0)
      .to(body, { rotation: 0, duration: 0.2 }, walkT - 0.1)
      .to(present, { rotation: 0, duration: 0.34, ease: 'back.out(1.7)' }, walkT)                   // "here it is"
      .to(body, { rotation: 4, duration: 0.4, ease: 'power2.out' }, walkT)
      .to(look, { ex: 2.2, ey: -1.4, head: 4, duration: 0.3 }, walkT + 0.05)                       // looks at the pin
      .to(look, { ex: 0.3, ey: 0.4, head: 0, duration: 0.24 }, walkT + 0.8)                        // at you
      .to(look, { head: 6.5, duration: 0.13, ease: 'sine.inOut', yoyo: true, repeat: 1 }, walkT + 1.08)
      .to(look, { ex: -2.4, ey: 0.9, head: -6, duration: 0.3 }, walkT + 1.45)                      // "Get directions is over there"
      .to({}, { duration: 0.55 }, walkT + 1.75);
  }

  /** Footer: climbs up behind its top edge, rests his hands on it, waves goodbye and stays. */
  function waveGoodbye() {
    const f = document.querySelector<HTMLElement>('.site-footer');
    if (!f) { byeDone = true; return; }
    byeDone = true;
    phase = 'busy';
    rig.scene('live');
    chalk(true);
    gsap.set(wrap, { scale: 1, transformOrigin: origin() });
    measureBase();
    // a free stretch of the edge: under the map column (nothing above or below there), else the right third
    const anchorEl = document.querySelector('.visit-map') ?? f;
    const ar = anchorEl.getBoundingClientRect();
    const seatX = ar.left + ar.width * 0.72;
    const edge = () => f.getBoundingClientRect().top;
    const rise = { v: 1 };
    const drop = 110;
    rig.setPose('ledge');
    gsap.set(body, { y: LEDGE_RAISE, rotation: 0 });
    gsap.set([waveArm, present], { rotation: 0 });
    gsap.set(svg, { rotation: 0 });
    setLook({ ey: -0.6 });
    gsap.set(wrap, { scale: window.innerWidth < 1024 ? 1.3 : 1.5 });
    follow = () => ({ pt: LEDGE, vp: [seatX, edge() + rise.v * drop] });
    clip = { kind: 'box', box: () => ({ l: -OPEN, t: -OPEN, r: OPEN, b: edge() + 0.5 }) };        // behind the footer
    startTicker();
    frame();
    gsap.set(wrap, { autoAlpha: 1 });
    let sinking = false;
    const sink = () => {
      if (sinking) return;
      sinking = true;
      play(gsap.timeline({ onComplete: () => { park('hidden'); } }))
        .to(look, { ey: -1, duration: 0.15 }, 0)
        .to(rise, { v: 1, duration: 0.36, ease: 'power2.in' }, 0.05);
    };
    const y0b = window.scrollY;
    // he stays on the ledge until the reader heads back up (or the footer leaves the screen)
    guard = () => {
      if (phase !== 'ledge' || sinking) return;
      if (window.scrollY < y0b - 40 || f.getBoundingClientRect().top > window.innerHeight - 30) sink();
    };
    play(gsap.timeline({ onComplete: () => { phase = 'ledge'; rig.scene('idle'); } }))
      .to(rise, { v: 0, duration: 0.55, ease: 'power3.out' })                                     // hands, then eyes, over the edge
      .to(look, { ex: -1.4, ey: 0.4, head: -3, duration: 0.25 }, 0.4)
      .to(look, { ex: 1.4, duration: 0.3 }, 0.8)
      .call(blink, [], 1.1)
      .to(look, { ex: 0.2, ey: 0.4, head: 0, duration: 0.2 }, 1.2)
      .add(wave('ledgeWave'), 1.35)                                                               // goodbye
      .call(() => rig.setPose('ledge'))
      .to(look, { head: 5, duration: 0.14, ease: 'sine.inOut', yoyo: true, repeat: 1 }, '+=0.05')
      .to(look, { ey: 0.6, duration: 0.3 });
  }

  /** Phones: comes back up over the header rule (all the way home, or just his eyes for a peek). */
  function rise(full: boolean, then: () => void) {
    phase = 'busy';
    rig.scene('live');
    const h = wrap.offsetHeight;
    rig.setPose('ledge');
    gsap.set(body, { y: LEDGE_RAISE, rotation: 0 });
    gsap.set(svg, { rotation: 0 });
    gsap.set(wrap, { x: rig.homeX(), y: h * 0.5, scale: 1, autoAlpha: 1, transformOrigin: origin() });
    setLook({ ey: -0.8 });
    clip = { kind: 'box', box: () => ({ l: -OPEN, t: -OPEN, r: OPEN, b: rig.lineY() + 0.5 }) };
    startTicker();
    applyClip();
    const t = play(gsap.timeline({ onComplete: then }))
      .to(wrap, { y: full ? 0 : h * 0.14, duration: 0.45, ease: 'power3.out' })
      .to(look, { ex: -1.8, ey: 0.4, duration: 0.22 }, 0.4)
      .to(look, { ex: 1.8, duration: 0.3 }, 0.75)
      .call(blink, [], 1.05)
      .to(look, { ex: 0, ey: 0, duration: 0.2 }, 1.1);
    if (!full) t.to(wrap, { y: h * 0.5, duration: 0.3, ease: 'power2.in' }, 1.35).set(wrap, { autoAlpha: 0 });
  }

  /** Occasional peek: hangs upside down by his feet from behind the line and looks around. */
  function peek(then: () => void) {
    if (rig.homeKind() === 'ledge') { rise(false, then); return; }
    phase = 'busy';
    rig.scene('live');
    rig.setPose('neutral');
    gsap.set(wrap, { x: rig.homeX(), y: 0, scale: 1, transformOrigin: origin() });
    const hy = hookY();
    const up = hy - 104 * unit();
    gsap.set(svg, { rotation: 180, transformOrigin: origin() });
    gsap.set(wrap, { y: up, autoAlpha: 1 });
    setLook({});
    clip = { kind: 'line', offset: 1.2 };
    startTicker();
    applyClip();
    play(gsap.timeline({ onComplete: then }))
      .to(wrap, { y: hy, duration: 0.6, ease: 'power3.out' })                   // head first, upside down
      .to(svg, { rotation: 186, duration: 0.3, ease: 'sine.out' }, 0.32)        // swings a little from his feet
      .to(svg, { rotation: 177, duration: 0.45, ease: 'sine.inOut' })
      .to(svg, { rotation: 180, duration: 0.35, ease: 'sine.inOut' })
      .to(look, { ex: -2.2, ey: -1, duration: 0.22 }, 0.45)                     // looks one way…
      .to(look, { ex: 2.2, duration: 0.3 }, 0.95)                               // …and the other
      .call(blink, [], 1.35)
      .to(look, { ex: 0, ey: 0, duration: 0.2 }, 1.45)
      .to(wrap, { y: up, duration: 0.34, ease: 'power2.in' }, 1.62)
      .set(wrap, { autoAlpha: 0 })
      .set(svg, { rotation: 0 });
  }

  /** STATE 6: a peek, then he lowers himself from behind the line back into his hang. */
  function returnHome() {
    if (rig.homeKind() === 'ledge') { rise(true, hang); return; }
    peek(() => {
      const h = wrap.offsetHeight;
      rig.setPose('neutral');
      gsap.set(wrap, { x: rig.homeX(), y: -(h + 18), scale: 1, autoAlpha: 1 });
      setLook({ ey: 1.2, legs: 12 });
      clip = { kind: 'line', offset: -4 };
      play(gsap.timeline({ onComplete: hang }))
        .to(wrap, { y: 0, duration: 0.62, ease: 'power3.out' })
        .to(look, { legs: 0, duration: 0.5, ease: 'power2.out' }, 0.2)
        .to(look, { lean: 3, duration: 0.2, ease: 'sine.out' }, 0.45)          // a little swing on arrival
        .to(look, { lean: 0, duration: 0.5, ease: 'sine.inOut' })
        .to(look, { ex: 0.2, ey: 0.5, duration: 0.3 }, 0.55);
    });
  }

  /* =======================  when things happen  ======================= */

  const moved = () => Math.abs(window.scrollY - y0) > 48;
  /** The picked bread is drawn and on screen: 'go' once the reader has paused, 'wait' while still scrolling. */
  const readiness = (): { spot: Spot; go: boolean } | null => {
    const t = queue.current();
    return t ? { spot: t, go: performance.now() - lastScroll > 220 } : null;
  };

  function consider() {
    if (!enabled()) { if (phase === 'away' || phase === 'hidden' || phase === 'ledge') hang(); return; }
    const now = performance.now();
    const idle = now - lastScroll > 220;
    /** the next scene that is ready right here, if any */
    const next = (): (() => void) | null | 'wait' => {
      const r = readiness();
      if (r) return r.go ? () => moveToPastry(r.spot) : 'wait';
      if (!mapDone && mapReady()) return idle ? walkToShop : 'wait';
      if (!byeDone && footerReady()) return idle ? waveGoodbye : 'wait';
      return null;
    };
    if (phase === 'home') {
      if (!rig.ready()) { if (!waved || queue.anyAhead() || !mapDone || !byeDone) schedule(400); return; }
      if (!waved && moved()) { wake(); return; }
      if (waved) {
        const n = next();
        if (n === 'wait') schedule(240);
        else if (n) exit(n);                                             // leaves the line, then appears there
      }
      return;
    }
    if (phase === 'busy') { schedule(500); return; }                     // mid-move: look again shortly
    if (phase !== 'away' && phase !== 'hidden') return;
    const n = next();
    if (n === 'wait') { schedule(240); return; }
    if (n) { n(); return; }
    const away = now - awaySince;
    // after a bread: stay behind the breads while more are coming; home once the menu is done or left
    if (phase === 'hidden' && ((section !== 'menu' && away > 1500) || (!queue.anyAhead() && away > 1200) || away > 30000)) { returnHome(); return; }
    if (phase === 'away' && ((section !== 'menu' && section !== null) || away > (section === 'menu' ? 22000 : 12000))) { returnHome(); return; }
    if (phase === 'away' && !idlePeeked && away > 5000 && now - lastScroll > 5000) {
      idlePeeked = true;
      peek(() => park('away'));
      return;
    }
    schedule(1000);
  }
  function schedule(ms: number) { clearTimeout(checkT); checkT = window.setTimeout(consider, ms); }

  const onScroll = () => {
    lastScroll = performance.now();
    if (phase === 'ledge') guard?.();
    if (phase === 'home' && !waved && enabled() && moved() && rig.ready()) wake();
    schedule(260);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  gsap.set(wrap, { transformOrigin: origin() });

  return {
    home: () => phase === 'home',
    onSection(id: string | null) { section = id; schedule(160); },
    /** break off whatever is running and hang at home (reduced motion, breakpoint change) */
    reset() { tl?.kill(); if (phase !== 'home') hang(); },
    destroy() {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(checkT);
      timers.forEach((t) => clearTimeout(t));
      tl?.kill();
      stopTicker();
      wrap.style.clipPath = '';
      chalk(false);
      gsap.set(wrap, { autoAlpha: 1, y: 0, scale: 1 });
      gsap.set(svg, { rotation: 0 });
      gsap.set(body, { y: 0, rotation: 0 });
      svg.classList.remove('is-winking');
    }
  };
}
