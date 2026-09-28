import { gsap } from 'gsap';
import { on } from '../lib/bus';

/*
  Guide character controller (spec: phase-0/PHASE-0-CHARACTER-BEHAVIOR.md).
  One requestAnimationFrame loop, running only while something is unsettled.
  All transforms are written straight to SVG attributes; nothing goes through React state.
*/

type Pose = 'neutral' | 'menu' | 'storyA' | 'storyB' | 'media' | 'visit' | 'visitRight' | 'tuck';
type Mode = 'follow' | 'react' | 'travel' | 'perch';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

// Channel targets per held pose (eyes in SVG units, angles in degrees).
const POSE_TARGETS: Record<Pose, { ex: number; ey: number; head: number; lean: number }> = {
  neutral: { ex: 0, ey: 0, head: 0, lean: 0 },
  menu: { ex: 1.2, ey: 1.6, head: 4, lean: -4 },
  storyA: { ex: 2.4, ey: -0.4, head: 5, lean: 4 },
  storyB: { ex: 2.4, ey: -0.4, head: 3, lean: -3 },
  media: { ex: 1, ey: 0.4, head: 3, lean: -3 },
  visit: { ex: -2.4, ey: 1.6, head: -6, lean: 3 },
  visitRight: { ex: 2.4, ey: 0.4, head: 6, lean: -3 },
  tuck: { ex: 0, ey: 1, head: 0, lean: 0 }
};

export function initGuide(): () => void {
  const wrap = document.querySelector<HTMLElement>('.site-header .guide');
  const svg = wrap?.querySelector<SVGSVGElement>('.guide-svg');
  const inner = document.querySelector<HTMLElement>('.header-inner');
  const peekSvg = document.querySelector<SVGSVGElement>('.peek-svg');
  const html = document.documentElement;
  const offs: (() => void)[] = [];
  const timers = new Set<number>();
  const later = (fn: () => void, ms: number) => { const id = window.setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); return id; };

  const mq = {
    fine: window.matchMedia('(hover: hover) and (pointer: fine)'),
    reduce: window.matchMedia('(prefers-reduced-motion: reduce)'),
    wide: window.matchMedia('(min-width: 768px)'),
    short: window.matchMedia('(max-height: 559.98px)')
  };
  const reduce = () => mq.reduce.matches;

  /* ---------------- mobile peek ---------------- */
  if (peekSvg) {
    const eyes = peekSvg.querySelector('[data-part="peek-eyes"]');
    let glanceT = 0;
    const onDown = (e: PointerEvent) => {
      if (mq.wide.matches || reduce() || !eyes) return;
      const r = peekSvg.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy) || 1;
      gsap.to(eyes, { x: (dx / d) * 2.2, y: clamp((dy / d) * 1.6, -1, 1.6), duration: 0.08, overwrite: true });
      clearTimeout(glanceT);
      glanceT = later(() => gsap.to(eyes, { x: 0, y: 0, duration: 0.3, overwrite: true }), 900);
    };
    window.addEventListener('pointerdown', onDown, { passive: true });
    offs.push(() => window.removeEventListener('pointerdown', onDown));
    offs.push(on('section', () => {
      if (mq.wide.matches || reduce()) return;
      peekSvg.classList.remove('is-bobbing');
      void peekSvg.getBoundingClientRect();
      peekSvg.classList.add('is-bobbing');
    }));
    const endBob = () => peekSvg.classList.remove('is-bobbing');
    peekSvg.addEventListener('animationend', endBob);
    offs.push(() => peekSvg.removeEventListener('animationend', endBob));
  }

  if (!wrap || !svg || !inner) return () => { offs.forEach((f) => f()); timers.forEach((t) => clearTimeout(t)); };

  /* ---------------- hanging guide ---------------- */
  const part = (n: string) => svg.querySelector<SVGGElement>(`[data-part="${n}"]`)!;
  const P = { lean: part('lean'), roll: part('roll'), face: part('face'), eyes: part('eyes'), legL: part('leg-l'), legR: part('leg-r'), flash: part('flash') };

  let activeId: string | null = null;
  let hoverId: string | null = null;
  let mode: Mode = 'follow';
  let pose: Pose = 'neutral';
  let perched = false;
  let focusBlocked = false;
  const cur = { ex: 0, ey: 0, head: 0, face: 0, lean: 0, legL: 0, legR: 0, vL: 0, vR: 0 };
  let px: number | null = null, py: number | null = null;
  let glance = false;
  let raf = 0, last = 0, leanPrev = 0;
  let base = { left: 0, top: 0, w: 0, h: 0 };
  let travelTween: gsap.core.Tween | gsap.core.Timeline | null = null;
  let climbTimer = 0;

  const setPose = (p: Pose) => { pose = p; svg.dataset.pose = p; kick(); };
  const measure = () => {
    const x = Number(gsap.getProperty(wrap, 'x')) || 0;
    const r = wrap.getBoundingClientRect();
    base = { left: r.left - x, top: r.top, w: r.width, h: r.height };
  };
  const xNow = () => Number(gsap.getProperty(wrap, 'x')) || 0;

  /** x (px, relative to header-inner) that centers the guide under a nav item, or the perch spot. */
  const xFor = (id: string | null): number => {
    const ir = inner.getBoundingClientRect();
    if (id) {
      const link = inner.querySelector<HTMLElement>(`[data-nav="${id}"]`);
      if (link) { const r = link.getBoundingClientRect(); return r.left + r.width / 2 - ir.left - base.w / 2; }
    }
    // perch / opening: the free stretch of line just after the wordmark
    const wm = inner.querySelector<HTMLElement>('.wordmark');
    const wr = wm?.getBoundingClientRect();
    return (wr ? wr.right - ir.left : 180) + 28;
  };

  const stopClimb = () => { if (climbTimer) { clearInterval(climbTimer); climbTimer = 0; } };
  const startClimb = () => {
    stopClimb();
    let flip = 0;
    setPose('storyA');
    climbTimer = window.setInterval(() => setPose(flip++ % 2 ? 'storyA' : 'storyB'), 130);
  };

  /** Move along the line (hand over hand), then run `done`. */
  const travelTo = (x: number, done?: () => void) => {
    travelTween?.kill();
    const dist = Math.abs(x - xNow());
    if (reduce() || dist < 6) {
      gsap.set(wrap, { x });
      measure();
      if (mode === 'travel') mode = 'react';
      done?.();
      kick();
      return;
    }
    mode = 'travel';
    startClimb();
    travelTween = gsap.to(wrap, {
      x, duration: clamp(0.35 + dist / 900, 0.4, 0.8), ease: 'power2.inOut', overwrite: true,
      // never leave the loop in 'travel': default to 'react', then let `done` decide
      onComplete: () => { stopClimb(); measure(); mode = 'react'; done?.(); kick(); }
    });
  };

  const directionsVisible = () => { const b = document.querySelector<HTMLElement>('.header-directions'); return !!b && b.offsetParent !== null; };
  const visitPose = (): Pose => (directionsVisible() ? 'visitRight' : 'visit');
  const holdPoseFor = (id: string | null): Pose => (id === 'visit' ? visitPose() : 'neutral');

  /** Settle under the active section (or perch when space is needed). */
  const settle = () => {
    if (perched) {
      travelTo(xFor(null), () => { setPose('tuck'); mode = 'perch'; });
      return;
    }
    travelTo(xFor(activeId), () => {
      const p = holdPoseFor(activeId);
      setPose(p);
      mode = p === 'neutral' ? 'follow' : 'react';
    });
  };

  /* reactions on nav hover / focus (desktop) and on arrival (short, touch) */
  let reactTl: gsap.core.Timeline | null = null;
  const react = (id: string, short = false) => {
    reactTl?.kill();
    mode = 'react';
    const run = () => {
      if (reduce()) { setPose(id === 'story' ? 'storyA' : id === 'visit' ? visitPose() : (id as Pose)); return; }
      if (id === 'menu') setPose('menu');
      else if (id === 'visit') setPose(visitPose());
      else if (id === 'media') {
        setPose('media');
        reactTl = gsap.timeline().fromTo(P.flash, { opacity: 0 }, { opacity: 1, duration: 0.08, delay: 0.25 }).to(P.flash, { opacity: 0, duration: 0.16, delay: 0.1 });
      } else if (id === 'story') {
        const x0 = xNow();
        startClimb();
        reactTl = gsap.timeline({ onComplete: () => { stopClimb(); setPose('neutral'); measure(); } })
          .to(wrap, { x: x0 + 24, duration: 0.26, ease: 'power1.inOut' })
          .to(wrap, { x: x0, duration: 0.26, ease: 'power1.inOut' });
      }
      if (short && id !== 'visit') later(() => { if (!hoverId) { setPose('neutral'); mode = 'follow'; } }, id === 'story' ? 560 : 450);
    };
    travelTo(xFor(id), run);
  };

  /* ---------------- the loop ---------------- */
  const tick = (t: number) => {
    const dt = Math.min(0.05, last ? (t - last) / 1000 : 0.016);
    last = t;
    const followOK = mq.fine.matches && !reduce();
    let tex = 0, tey = 0, thead = 0, tlean = 0;

    if ((mode === 'follow' || mode === 'perch') && px !== null && py !== null && (followOK || glance)) {
      const cx = base.left + xNow() + base.w / 2;
      const cy = base.top + base.h * 0.55 + (pose === 'tuck' ? -base.h * 0.62 : 0);
      const dx = px - cx, dy = py - cy;
      const dist = Math.hypot(dx, dy);
      tex = clamp(dx / 480, -1, 1) * 2.4;
      tey = clamp(dy / 480, -1, 1) * 1.6;
      if (!glance && mode === 'follow' && dist > 24) {
        thead = clamp(dx / 700, -1, 1) * 9;
        tlean = clamp(dx / 900, -1, 1) * 4;
      } else if (dist <= 24) { thead = cur.head; tlean = cur.lean; }
    } else if (mode !== 'follow') {
      const pt = POSE_TARGETS[pose];
      tex = pt.ex; tey = pt.ey; thead = pt.head; tlean = pt.lean;
    }

    const k = (tau: number) => 1 - Math.exp(-dt / tau);
    cur.ex += (tex - cur.ex) * k(0.08);
    cur.ey += (tey - cur.ey) * k(0.08);
    cur.head += (thead - cur.head) * k(0.24);
    cur.face += (clamp(tex * 0.5, -1.2, 1.2) - cur.face) * k(0.24);
    cur.lean += (tlean - cur.lean) * k(0.45);

    // legs: damped springs driven by the lean's velocity; the right leg is softer, so it lags
    const leanVel = (cur.lean - leanPrev) / dt;
    leanPrev = cur.lean;
    const legT = clamp(-leanVel * 2.2, -10, 10);
    const spring = (x: number, v: number, target: number, kk: number) => {
      const a = kk * (target - x) - 2 * 0.55 * Math.sqrt(kk) * v;
      v += a * dt;
      return [clamp(x + v * dt, -10, 10), v] as const;
    };
    [cur.legL, cur.vL] = spring(cur.legL, cur.vL, legT, 38);
    [cur.legR, cur.vR] = spring(cur.legR, cur.vR, cur.legL * 0.9, 30);

    P.lean.setAttribute('transform', `rotate(${cur.lean.toFixed(2)} 60 9)`);
    P.roll.setAttribute('transform', `rotate(${cur.head.toFixed(2)} 60 64)`);
    P.face.setAttribute('transform', `translate(${cur.face.toFixed(2)} 0)`);
    P.eyes.setAttribute('transform', `translate(${cur.ex.toFixed(2)} ${cur.ey.toFixed(2)})`);
    P.legL.setAttribute('transform', `rotate(${cur.legL.toFixed(2)} 53.6 79)`);
    P.legR.setAttribute('transform', `rotate(${cur.legR.toFixed(2)} 66.4 79)`);

    const unsettled =
      Math.abs(tex - cur.ex) > 0.01 || Math.abs(tey - cur.ey) > 0.01 || Math.abs(thead - cur.head) > 0.02 ||
      Math.abs(tlean - cur.lean) > 0.01 || Math.abs(cur.vL) > 0.02 || Math.abs(cur.vR) > 0.02 ||
      Math.abs(cur.legL) > 0.02 || Math.abs(cur.legR) > 0.02;
    raf = unsettled || mode === 'travel' ? requestAnimationFrame(tick) : 0;
    wrap.dataset.animationActive = raf ? 'true' : 'false';
    wrap.dataset.mode = mode;
  };
  const kick = () => {
    if (raf || document.hidden || reduce()) return;
    last = 0;
    raf = requestAnimationFrame(tick);
  };

  /* ---------------- input ---------------- */
  let idleT = 0;
  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    px = e.clientX; py = e.clientY;
    clearTimeout(idleT);
    idleT = later(() => { px = null; py = null; kick(); }, 4000);
    kick();
  };
  const onLeave = () => { px = null; py = null; kick(); };
  const onDoc = (e: MouseEvent) => { if (!e.relatedTarget) onLeave(); };
  const onVis = () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; onLeave(); } };
  // touch / coarse: brief glance toward the tap, eyes only
  const onDown = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' || !mq.wide.matches || reduce()) return;
    px = e.clientX; py = e.clientY; glance = true;
    kick();
    later(() => { glance = false; px = null; py = null; kick(); }, 900);
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onDown, { passive: true });
  document.addEventListener('mouseout', onDoc);
  window.addEventListener('blur', onLeave);
  document.addEventListener('visibilitychange', onVis);
  offs.push(() => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerdown', onDown);
    document.removeEventListener('mouseout', onDoc);
    window.removeEventListener('blur', onLeave);
    document.removeEventListener('visibilitychange', onVis);
  });

  /* blink: one slow blink every 7–11 s while following, never in reduced motion */
  const blinkLoop = () => {
    later(() => {
      if (!reduce() && !document.hidden && mode === 'follow' && mq.fine.matches) {
        svg.classList.add('is-blinking');
        later(() => svg.classList.remove('is-blinking'), 160);
      }
      blinkLoop();
    }, 7000 + Math.random() * 4000);
  };
  blinkLoop();

  /* ---------------- section + nav events ---------------- */
  let arriveT = 0;
  offs.push(on('section', (id) => {
    activeId = id;
    if (hoverId) return;
    clearTimeout(arriveT);
    if (perched) { settle(); return; }
    // short arrival reaction once the section has held for 300 ms
    travelTo(xFor(id), () => {
      const p = holdPoseFor(id);
      setPose(p);
      mode = p === 'neutral' ? 'follow' : 'react';
      if (id && id !== 'visit') arriveT = later(() => { if (activeId === id && !hoverId && !perched) react(id, true); }, 300);
    });
  }));

  let graceT = 0;
  offs.push(on('navHover', (id) => {
    if (!mq.wide.matches || perched) return;
    clearTimeout(graceT);
    if (id) {
      hoverId = id;
      if (mq.fine.matches || reduce()) react(id);
    } else {
      graceT = later(() => { hoverId = null; reactTl?.kill(); stopClimb(); settle(); }, 250);
    }
  }));

  /* ---------------- perch (tuck) conditions ---------------- */
  const hangZone = () => { const r = wrap.getBoundingClientRect(); return { top: r.top, bottom: r.bottom + 4, left: r.left - 8, right: r.right + 8 }; };
  const updatePerch = () => {
    const next = mq.short.matches || focusBlocked;
    if (next === perched) return;
    perched = next;
    html.classList.toggle('guide-perched', perched);
    if (!hoverId) settle();
  };
  const onFocusIn = (e: FocusEvent) => {
    const t = e.target as HTMLElement;
    if (!t || t.closest('.site-header')) { focusBlocked = false; updatePerch(); return; }
    const r = t.getBoundingClientRect(), z = hangZone();
    focusBlocked = r.bottom > z.top && r.top < z.bottom && r.right > z.left && r.left < z.right;
    updatePerch();
  };
  const onFocusOut = () => later(() => { if (!document.activeElement || document.activeElement === document.body) { focusBlocked = false; updatePerch(); } }, 800);
  document.addEventListener('focusin', onFocusIn);
  document.addEventListener('focusout', onFocusOut);
  mq.short.addEventListener('change', updatePerch);
  offs.push(() => {
    document.removeEventListener('focusin', onFocusIn);
    document.removeEventListener('focusout', onFocusOut);
    mq.short.removeEventListener('change', updatePerch);
  });

  /* ---------------- layout changes ---------------- */
  const onResize = () => {
    travelTween?.kill();
    stopClimb();
    measure();
    gsap.set(wrap, { x: perched ? xFor(null) : xFor(hoverId ?? activeId) });
    measure();
    kick();
  };
  let rT = 0;
  const onResizeDebounced = () => { clearTimeout(rT); rT = later(onResize, 120); };
  window.addEventListener('resize', onResizeDebounced);
  document.fonts?.ready.then(onResize);
  offs.push(() => window.removeEventListener('resize', onResizeDebounced));

  // initial placement: climb in from the left end of the line (skipped for reduced motion)
  measure();
  perched = mq.short.matches;
  html.classList.toggle('guide-perched', perched);
  if (!reduce() && !perched && mq.wide.matches && window.scrollY < 40) {
    gsap.set(wrap, { x: -base.w - 24 });
    measure();
    later(() => { if (!hoverId) settle(); }, 650);
  } else {
    gsap.set(wrap, { x: perched ? xFor(null) : xFor(activeId) });
    setPose(perched ? 'tuck' : 'neutral');
    mode = perched ? 'perch' : 'follow';
    measure();
  }

  return () => {
    offs.forEach((f) => f());
    timers.forEach((t) => clearTimeout(t));
    stopClimb();
    cancelAnimationFrame(raf);
    travelTween?.kill();
    reactTl?.kill();
    gsap.killTweensOf([wrap, P.flash]);
    html.classList.remove('guide-perched');
  };
}
