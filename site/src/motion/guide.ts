import { gsap } from 'gsap';
import { on } from '../lib/bus';
import { createDirector, createSpotPicker, inView, resolved, toVp } from './mascot';
import type { Look, Rig } from './mascot';

/*
  Guide character controller (spec: phase-0/PHASE-0-CHARACTER-BEHAVIOR.md).
  One requestAnimationFrame loop, running only while something is unsettled.
  All transforms are written straight to SVG attributes; nothing goes through React state.
*/

type Pose = 'neutral' | 'menu' | 'storyA' | 'storyB' | 'media' | 'visit' | 'visitRight' | 'tuck' | 'wave' | 'present';
type Mode = 'follow' | 'react' | 'travel' | 'perch' | 'scene';

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
  tuck: { ex: 0, ey: 1, head: 0, lean: 0 },
  wave: { ex: 0, ey: 0, head: 0, lean: 0 },
  present: { ex: 0, ey: 0, head: 0, lean: 0 }
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

  /* ---------------- mobile peek (phones) ----------------
     Eyes + head follow the finger while it touches or drags (even mid-scroll), the eyes watch
     the page scroll by, and each section gets a small reaction. One damped rAF loop that stops
     when settled; static under reduced motion. */
  if (peekSvg) {
    const pp = (n: string) => peekSvg.querySelector<SVGGElement>(`[data-part="${n}"]`)!;
    const PK = { move: pp('peek-move'), body: pp('peek-body'), face: pp('peek-face'), eyes: pp('peek-eyes') };
    const pc = { ex: 0, ey: 0, tilt: 0 };
    let fx: number | null = null, fy: number | null = null;
    let scrollV = 0, lastY = window.scrollY, lastT = performance.now();
    let praf = 0, plast = 0, releaseT = 0;
    const phone = () => !mq.wide.matches;
    const ptick = (t: number) => {
      const dt = Math.min(0.05, plast ? (t - plast) / 1000 : 0.016);
      plast = t;
      let tex = 0, tey = 0, ttilt = 0;
      if (fx !== null && fy !== null) {
        const r = peekSvg.getBoundingClientRect();
        const dx = fx - (r.left + r.width / 2), dy = fy - (r.top + r.height * 0.45);
        tex = clamp(dx / 220, -1, 1) * 2.4;
        tey = clamp(dy / 320, -1, 1) * 1.8;
        ttilt = clamp(dx / 260, -1, 1) * 11;
      }
      // watch the page move: eyes drift toward the scroll direction
      scrollV *= Math.exp(-dt / 0.28);
      tey = clamp(tey + clamp(scrollV * 1.6, -1.8, 1.8), -1.8, 1.8);
      ttilt += clamp(scrollV * 2.5, -4, 4); // a slight lean with the page's motion
      const k = (tau: number) => 1 - Math.exp(-dt / tau);
      pc.ex += (tex - pc.ex) * k(0.07);
      pc.ey += (tey - pc.ey) * k(0.07);
      pc.tilt += (ttilt - pc.tilt) * k(0.22);
      PK.eyes.setAttribute('transform', `translate(${pc.ex.toFixed(2)} ${pc.ey.toFixed(2)})`);
      PK.face.setAttribute('transform', `translate(${clamp(pc.ex * 0.5, -1.2, 1.2).toFixed(2)} 0)`);
      PK.body.setAttribute('transform', `rotate(${pc.tilt.toFixed(2)} 60 80)`);
      const busy = Math.abs(tex - pc.ex) > 0.01 || Math.abs(tey - pc.ey) > 0.01 || Math.abs(ttilt - pc.tilt) > 0.02 || Math.abs(scrollV) > 0.01;
      praf = busy ? requestAnimationFrame(ptick) : 0;
      peekSvg.dataset.animationActive = praf ? 'true' : 'false';
    };
    const pkick = () => { if (!praf && !document.hidden && !reduce() && phone()) { plast = 0; praf = requestAnimationFrame(ptick); } };
    const onTouch = (e: TouchEvent) => {
      const tt = e.touches[0];
      if (!tt || !phone() || reduce()) return;
      fx = tt.clientX; fy = tt.clientY;
      clearTimeout(releaseT);
      pkick();
    };
    const onTouchEnd = () => { clearTimeout(releaseT); releaseT = later(() => { fx = null; fy = null; pkick(); }, 700); };
    /* phone scenes (the simple version of mascot.ts): waves on the first scroll and ducks behind the
       header rule; later pops up to point at an approved bread, nods and winks; then stays home. */
    const hand = { l: pp('peek-hand-l'), r: pp('peek-hand-r') };
    const picker = createSpotPicker();
    const py0 = window.scrollY;
    let pWaved = false, pDone = false, pAway = false, pBusy = false, pAwaySince = 0, pLastScroll = 0, pSection: string | null = null, pT = 0;
    const setAway = (v: boolean) => { pAway = v; html.classList.toggle('peek-away', v); if (v) pAwaySince = performance.now(); };
    const pSchedule = (ms: number) => { clearTimeout(pT); pT = window.setTimeout(pConsider, ms); };
    const pWake = () => {
      pWaved = true; pBusy = true;
      peekTl?.kill();
      fx = window.innerWidth * 0.35; fy = window.innerHeight * 0.85; pkick();   // looks down at the page
      peekTl = gsap.timeline({ onComplete: () => { fx = null; fy = null; pkick(); setAway(true); pBusy = false; pSchedule(1000); } })
        .to(PK.move, { y: -9, duration: 0.2, ease: 'power2.out' })
        .to(hand.r, { x: 3, y: -15, rotation: -24, svgOrigin: '87 71', duration: 0.22, ease: 'power2.out' }, 0.1)   // hand up
        .to(hand.r, { rotation: 24, duration: 0.18, ease: 'sine.inOut', repeat: 4, yoyo: true })
        .to(hand.r, { x: 0, y: 0, rotation: 0, duration: 0.18, ease: 'power2.in' })
        .to(PK.move, { y: -5, duration: 0.2 }, '<')
        .to({}, { duration: 0.1 });
    };
    const pRecommend = (t: NonNullable<ReturnType<typeof picker.target>>) => {
      pDone = true; pBusy = true;
      peekTl?.kill();
      setAway(false);                                                            // pops back up
      const [cx, cy] = toVp(t.frame.getBoundingClientRect(), t.center);
      const left = cx < peekSvg.getBoundingClientRect().left + 30;
      const h = left ? hand.l : hand.r, dir = left ? -1 : 1;
      peekTl = gsap.timeline({ delay: 0.24, onComplete: () => { peekSvg.dataset.peek = 'neutral'; fx = null; fy = null; pkick(); pBusy = false; } })
        .call(() => { fx = cx; fy = cy; pkick(); })                              // leans and looks at the bread
        .to(h, { x: 4 * dir, y: -9, rotation: 40 * dir, svgOrigin: left ? '33 71' : '87 71', duration: 0.3, ease: 'back.out(1.6)' }, 0.12) // points at it
        .to(PK.move, { rotation: 7, y: -2, duration: 0.15, ease: 'sine.inOut', yoyo: true, repeat: 3 }, 0.7) // two nods
        .call(() => { peekSvg.dataset.peek = 'wink'; fx = null; fy = null; pkick(); }, [], 1.4)          // and a wink at you
        .to(h, { x: 0, y: 0, rotation: 0, duration: 0.24, ease: 'power2.inOut' }, 1.55)
        .call(() => { peekSvg.dataset.peek = 'neutral'; }, [], 1.95)
        .to({}, { duration: 0.2 });
    };
    function pConsider() {
      if (!phone() || reduce()) { if (pAway) setAway(false); return; }
      if (pBusy) { pSchedule(400); return; }
      const now = performance.now();
      if (!pWaved) { if (Math.abs(window.scrollY - py0) > 48) pWake(); return; }
      if (!pDone) {
        const t = picker.target();
        if (t && resolved(t) && inView(t)) {
          if (now - pLastScroll > 220) pRecommend(t); else pSchedule(240);   // wait for the reader to pause
          return;
        }
      }
      if (pAway) {
        const awayFor = now - pAwaySince;
        if ((pSection !== 'menu' && pSection !== null) || awayFor > (pSection === 'menu' ? 22000 : 12000)) {
          setAway(false);                                                        // home again
          peekTl?.kill();
          peekTl = gsap.timeline().to(PK.move, { y: -9, duration: 0.18, delay: 0.2 }).to(PK.move, { y: -5, duration: 0.24 });
          return;
        }
        pSchedule(1000);
      }
    }
    offs.push(on('section', (id) => { pSection = id; pSchedule(160); }));
    offs.push(() => { clearTimeout(pT); html.classList.remove('peek-away'); });

    const onScrollPk = () => {
      const now = performance.now(), y = window.scrollY;
      const v = (y - lastY) / Math.max(8, now - lastT); // px per ms
      lastY = y; lastT = now;
      pLastScroll = now;
      if (!phone() || reduce()) return;
      scrollV = clamp(scrollV * 0.5 + v * 0.5, -3, 3);
      pkick();
      if (!pWaved && !pBusy && Math.abs(y - py0) > 48) pWake();
      else pSchedule(260);
    };
    window.addEventListener('touchstart', onTouch, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });
    window.addEventListener('scroll', onScrollPk, { passive: true });
    offs.push(() => {
      window.removeEventListener('touchstart', onTouch);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
      window.removeEventListener('scroll', onScrollPk);
      cancelAnimationFrame(praf);
    });

    // section reactions (GSAP on the outer group, so they compose with the finger-follow tilt)
    gsap.set(PK.move, { y: -5, svgOrigin: '60 80' });
    let peekTl: gsap.core.Timeline | null = null;
    const pReacted = new Set<string>();
    offs.push(on('section', (id) => {
      if (!phone() || reduce() || pBusy || pAway) return;
      const key = id ?? 'top';
      if (id === 'menu' || pReacted.has(key)) return;
      pReacted.add(key);
      peekTl?.kill();
      peekSvg.dataset.peek = 'neutral';
      const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' }, onComplete: () => { peekSvg.dataset.peek = 'neutral'; } });
      if (id === 'menu') {
        // looks down at the food and nods twice
        fy = window.innerHeight; fx = window.innerWidth / 2; pkick();
        tl.to(PK.move, { rotation: 7, y: -2, duration: 0.18 }).to(PK.move, { rotation: 0, y: -5, duration: 0.18 })
          .to(PK.move, { rotation: 7, y: -2, duration: 0.18 }).to(PK.move, { rotation: 0, y: -5, duration: 0.22 });
        releaseT = later(() => { fx = null; fy = null; pkick(); }, 900);
      } else if (id === 'story') {
        // sways side to side, like climbing along the line
        tl.to(PK.move, { x: -5, rotation: -6, duration: 0.2 }).to(PK.move, { x: 5, rotation: 6, duration: 0.3 })
          .to(PK.move, { x: -3, rotation: -3, duration: 0.24 }).to(PK.move, { x: 0, rotation: 0, duration: 0.22 });
      } else if (id === 'media') {
        // wink and a camera flash
        tl.call(() => { peekSvg.dataset.peek = 'media'; }).to(PK.move, { y: -7, duration: 0.16 }).to(PK.move, { y: -5, duration: 0.2 }).to({}, { duration: 0.7 });
      } else if (id === null) {
        tl.to(PK.move, { y: -8, duration: 0.18 }).to(PK.move, { y: -5, duration: 0.24 });
      }
      peekTl = tl;
    }));
    offs.push(() => { peekTl?.kill(); gsap.killTweensOf(PK.move); });
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
  // scenes (src/motion/mascot.ts): the director takes the rig over through `look`
  const look: Look = { ex: 0, ey: 0, head: 0, lean: 0, legs: 0 };
  let sceneLive = false;
  let introUntil = 0;
  let director: ReturnType<typeof createDirector> | null = null;
  const away = () => !!director && !director.home();
  const reacted = new Set<string>();

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
    if (away()) return;
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

    const scene = mode === 'scene';
    if (scene) {
      tex = look.ex; tey = look.ey; thead = look.head; tlean = look.lean;
    } else if ((mode === 'follow' || mode === 'perch') && px !== null && py !== null && (followOK || glance)) {
      const cx = base.left + xNow() + base.w / 2;
      const cy = base.top + base.h * 0.55 + (pose === 'tuck' ? -base.h * 0.62 : 0);
      const dx = px - cx, dy = py - cy;
      const dist = Math.hypot(dx, dy);
      tex = clamp(dx / 480, -1, 1) * 2.4;
      tey = clamp(dy / 480, -1, 1) * 1.6;
      if (mode === 'follow' && dist > 24) {
        thead = clamp(dx / 700, -1, 1) * 9;
        tlean = clamp(dx / 900, -1, 1) * 4;
      } else if (dist <= 24) { thead = cur.head; tlean = cur.lean; }
    } else if (mode !== 'follow') {
      const pt = POSE_TARGETS[pose];
      tex = pt.ex; tey = pt.ey; thead = pt.head; tlean = pt.lean;
    }

    const k = (tau: number) => 1 - Math.exp(-dt / tau);
    // a scene's GSAP timelines already ease their values, so the loop follows them closely
    cur.ex += (tex - cur.ex) * k(scene ? 0.04 : 0.08);
    cur.ey += (tey - cur.ey) * k(scene ? 0.04 : 0.08);
    cur.head += (thead - cur.head) * k(scene ? 0.04 : 0.24);
    cur.face += (clamp(tex * 0.5, -1.2, 1.2) - cur.face) * k(scene ? 0.06 : 0.24);
    cur.lean += (tlean - cur.lean) * k(scene ? 0.1 : 0.45);

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
    if (pose === 'present') { cur.legL = cur.legR = cur.vL = cur.vR = 0; } // standing: feet stay planted
    const spread = scene ? look.legs : 0;

    P.lean.setAttribute('transform', `rotate(${cur.lean.toFixed(2)} 60 9)`);
    P.roll.setAttribute('transform', `rotate(${cur.head.toFixed(2)} 60 64)`);
    P.face.setAttribute('transform', `translate(${cur.face.toFixed(2)} 0)`);
    P.eyes.setAttribute('transform', `translate(${cur.ex.toFixed(2)} ${cur.ey.toFixed(2)})`);
    P.legL.setAttribute('transform', `rotate(${(cur.legL + spread).toFixed(2)} 53.6 79)`);
    P.legR.setAttribute('transform', `rotate(${(cur.legR - spread).toFixed(2)} 66.4 79)`);

    const unsettled =
      Math.abs(tex - cur.ex) > 0.01 || Math.abs(tey - cur.ey) > 0.01 || Math.abs(thead - cur.head) > 0.02 ||
      Math.abs(tlean - cur.lean) > 0.01 || Math.abs(cur.vL) > 0.02 || Math.abs(cur.vR) > 0.02 ||
      Math.abs(cur.legL) > 0.02 || Math.abs(cur.legR) > 0.02;
    raf = unsettled || mode === 'travel' || (scene && sceneLive) ? requestAnimationFrame(tick) : 0;
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
  // tablets (touch, ≥768): the whole rig follows the finger while it touches or drags, then lets go
  let touchT = 0;
  const onTouchT = (e: TouchEvent) => {
    const tt = e.touches[0];
    if (!tt || !mq.wide.matches || mq.fine.matches || reduce()) return;
    px = tt.clientX; py = tt.clientY; glance = true;
    clearTimeout(touchT);
    kick();
  };
  const onTouchEndT = () => { clearTimeout(touchT); touchT = later(() => { glance = false; px = null; py = null; kick(); }, 700); };
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('touchstart', onTouchT, { passive: true });
  window.addEventListener('touchmove', onTouchT, { passive: true });
  window.addEventListener('touchend', onTouchEndT, { passive: true });
  window.addEventListener('touchcancel', onTouchEndT, { passive: true });
  document.addEventListener('mouseout', onDoc);
  window.addEventListener('blur', onLeave);
  document.addEventListener('visibilitychange', onVis);
  offs.push(() => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('touchstart', onTouchT);
    window.removeEventListener('touchmove', onTouchT);
    window.removeEventListener('touchend', onTouchEndT);
    window.removeEventListener('touchcancel', onTouchEndT);
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
    director?.onSection(id);
    if (hoverId || away()) return;
    clearTimeout(arriveT);
    if (perched) { settle(); return; }
    // short arrival reaction once the section has held for 300 ms
    travelTo(xFor(id), () => {
      const p = holdPoseFor(id);
      setPose(p);
      mode = p === 'neutral' ? 'follow' : 'react';
      // the arrival reaction plays once per section per visit (breathing room, not a reflex)
      if (id && id !== 'visit' && !reacted.has(id)) {
        arriveT = later(() => { if (activeId === id && !hoverId && !perched && !away() && !reacted.has(id)) { reacted.add(id); react(id, true); } }, 300);
      }
    });
  }));

  let graceT = 0;
  offs.push(on('navHover', (id) => {
    if (!mq.wide.matches || perched || away()) return;
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
    if (next === perched || away()) return;
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
    if (away()) director?.reset();
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
    introUntil = performance.now() + 1700;
    later(() => { if (!hoverId) settle(); }, 650);
  } else {
    gsap.set(wrap, { x: perched ? xFor(null) : xFor(activeId) });
    setPose(perched ? 'tuck' : 'neutral');
    mode = perched ? 'perch' : 'follow';
    measure();
  }

  /* ---------------- scenes: wave, pastry recommendation, return (src/motion/mascot.ts) ---------------- */
  const rig: Rig = {
    wrap, svg, look,
    part: (n) => part(n),
    scene: (state) => {
      travelTween?.kill(); reactTl?.kill(); stopClimb(); clearTimeout(arriveT);
      if (mode !== 'scene') Object.assign(look, { ex: cur.ex, ey: cur.ey, head: cur.head, lean: cur.lean, legs: 0 });
      mode = 'scene';
      sceneLive = state === 'live';
      svg.dataset.scene = state;
      wrap.dataset.mode = 'scene';
      kick();
    },
    setPose: (p) => setPose(p as Pose),
    homeX: () => xFor(activeId),
    goHome: () => {
      sceneLive = false;
      delete svg.dataset.scene;
      gsap.set(P.lean.parentNode as SVGGElement, { clearProps: 'transform' });
      gsap.set(wrap, { x: xFor(activeId), y: 0, scale: 1 });
      measure();
      const p = holdPoseFor(activeId);
      setPose(p);
      mode = p === 'neutral' ? 'follow' : 'react';
      kick();
    },
    lineY: () => { const l = inner.querySelector('.nav-line')?.getBoundingClientRect(); return l ? l.top + l.height / 2 : inner.getBoundingClientRect().bottom; },
    ready: () => !perched && !hoverId && mode !== 'travel' && mode !== 'scene' && performance.now() > introUntil
  };
  director = createDirector(rig, () => mq.wide.matches && !mq.short.matches && !reduce());
  const onReduce = () => { if (reduce()) director?.reset(); };
  mq.reduce.addEventListener('change', onReduce);
  offs.push(() => mq.reduce.removeEventListener('change', onReduce));

  return () => {
    director?.destroy();
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
