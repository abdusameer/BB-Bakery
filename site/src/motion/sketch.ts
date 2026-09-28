import { gsap } from 'gsap';

type Extras = { underline?: Element | null; arrow?: Element[] };

/**
 * Adds one sketch → graphite → photograph sequence to a timeline, starting at `t0`
 * (the sequence occupies ~0.9 time units). Every step is a fromTo with explicit start
 * values, so scrubbing backwards restores the exact prior state.
 */
export function addSketchSteps(tl: gsap.core.Timeline, fig: HTMLElement, t0: number, extras: Extras = {}, span = 1) {
  // `span` compresses the whole sequence (pinned menu uses ~0.66 so the finished photo holds longer)
  const at = (x: number) => t0 + x * span;
  const d = (x: number) => x * span;
  const outline = fig.querySelector('.layer-outline');
  const shaded = fig.querySelector('.layer-shaded');
  const marks = gsap.utils.toArray<SVGElement>('.sketch-marks .draw-path', fig);
  const lineFinal = parseFloat(getComputedStyle(fig).getPropertyValue('--line-final')) || 0;

  if (marks.length) {
    tl.fromTo(marks, { strokeDashoffset: 1, opacity: 1 }, { strokeDashoffset: 0, duration: d(0.18) }, at(0));
    tl.fromTo(marks, { opacity: 1 }, { opacity: 0, duration: d(0.18), immediateRender: false }, at(0.6));
  }
  tl.fromTo(fig, { '--draw': '0deg' }, { '--draw': '374deg', duration: d(0.28) }, at(0.02))
    .fromTo(fig, { '--hp': '-20%', '--hw': '0px' }, { '--hp': '130%', '--hw': '9px', duration: d(0.32) }, at(0.2))
    .fromTo(fig, { '--ep': '-30%' }, { '--ep': '130%', duration: d(0.36) }, at(0.46));
  if (outline) tl.fromTo(outline, { opacity: 1 }, { opacity: lineFinal, duration: d(0.3) }, at(0.5));
  if (shaded) tl.fromTo(shaded, { opacity: 1 }, { opacity: 0, duration: d(0.2) }, at(0.66));
  if (extras.underline) tl.fromTo(extras.underline, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: d(0.12) }, at(0.72));
  if (extras.arrow?.length) tl.fromTo(extras.arrow, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: d(0.12), stagger: d(0.04) }, at(0.74));
  return tl;
}

/** Time-based opening version (≤ 1.6 s). Waits at the eraser beat until the photo has decoded. */
export function heroIntro(fig: HTMLElement, underline: Element | null, startFinished = false) {
  const outline = fig.querySelector('.layer-outline');
  const shaded = fig.querySelector('.layer-shaded');
  const construct = fig.querySelector('.sketch-marks .construct');
  const contour = gsap.utils.toArray<SVGElement>('.sketch-marks .draw-path:not(.construct):not(.steam)', fig);
  const steam = gsap.utils.toArray<SVGElement>('.sketch-marks .steam', fig);
  const img = fig.querySelector<HTMLImageElement>('.layer-photo img');
  const lineFinal = parseFloat(getComputedStyle(fig).getPropertyValue('--line-final')) || 0.16;

  let photoReady = !!img && img.complete && img.naturalWidth > 0;
  let waiting = false;
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power1.inOut' } });
  tl.set(fig, { '--draw': '0deg', '--hp': '-20%', '--hw': '0px', '--ep': '-30%' }, 0)
    .to(construct, { strokeDashoffset: 0, duration: 0.45 }, 0)
    .to(contour, { strokeDashoffset: 0, duration: 0.55, stagger: 0.09 }, 0.05)
    .to(fig, { '--draw': '374deg', duration: 0.75 }, 0.1)
    .to(fig, { '--hp': '130%', '--hw': '9px', duration: 0.55 }, 0.45)
    .addLabel('photo', 0.9)
    .call(() => { if (!photoReady) { waiting = true; tl.pause(); } }, [], 'photo')
    .to(fig, { '--ep': '130%', duration: 0.6, ease: 'power2.inOut' }, 'photo')
    .to(outline, { opacity: lineFinal, duration: 0.5 }, 'photo+=0.1')
    .to(contour, { opacity: 0.22, duration: 0.5 }, 'photo+=0.1')
    .to(construct, { opacity: 0.45, duration: 0.5 }, 'photo+=0.1')
    .to(shaded, { opacity: 0, duration: 0.35 }, 'photo+=0.35')
    .to(steam, { strokeDashoffset: 0, duration: 0.5, stagger: 0.08 }, 'photo')
    .to(underline, { strokeDashoffset: 0, duration: 0.4, ease: 'power2.out' }, 1.2);

  const onReady = () => { photoReady = true; if (waiting) { waiting = false; tl.play(); } };
  if (!photoReady && img) {
    img.addEventListener('load', onReady, { once: true });
    img.addEventListener('error', onReady, { once: true });
  }

  // Any input fast-forwards the intro so it can never hold the visitor up.
  const skip = () => { if (tl.progress() < 1) { photoReady = true; tl.progress(1).pause(); } };
  const evs = ['wheel', 'keydown', 'pointerdown', 'touchstart'] as const;
  evs.forEach((e) => window.addEventListener(e, skip, { once: true, passive: true }));

  let started = false;
  const start = () => { if (!started) { started = true; tl.play(); } };
  if (startFinished) { photoReady = true; started = true; tl.progress(1).pause(); }
  // The drawing doesn't depend on web fonts; start on the next frame after hydration.
  requestAnimationFrame(start);

  return () => {
    evs.forEach((e) => window.removeEventListener(e, skip));
    img?.removeEventListener('load', onReady);
    tl.progress(1).kill();
  };
}
