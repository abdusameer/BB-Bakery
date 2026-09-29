import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { setScroller } from '../lib/bus';
import { addSketchSteps, heroIntro } from './sketch';
import { initGuide } from './guide';
import { initAtmosphere, initShelfTone } from './atmosphere';
import { initAtmosphereGL } from './atmosphereGL';

const Q = {
  motion: '(prefers-reduced-motion: no-preference)',
  reduce: '(prefers-reduced-motion: reduce)',
  pinned: '(min-height: 560px)',                 // every width; very short screens (phones on their side) keep the flow menu
  wide: '(min-width: 1024px)',
  smooth: '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
  mobile: '(max-width: 767.98px)'
};

const headerH = () => document.querySelector<HTMLElement>('.site-header')?.offsetHeight ?? 72;

export function initMotion(): () => void {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  (window as unknown as { __bbsMotionReady: boolean }).__bbsMotionReady = true;
  if (import.meta.env.DEV) Object.assign(window, { __gsap: gsap, __ST: ScrollTrigger });
  const html = document.documentElement;
  const cleanups: (() => void)[] = [];

  /* ---------- smooth scroll: Lenis on desktop fine pointer only ---------- */
  const smoothMM = gsap.matchMedia();
  smoothMM.add(Q.smooth, () => {
    if (new URLSearchParams(location.search).get('smooth') === '0') return;
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false, wheelMultiplier: 1 });
    html.classList.add('has-lenis');
    lenis.on('scroll', ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    setScroller({
      scrollTo: (target, opts) => lenis.scrollTo(target as HTMLElement | number, { offset: opts?.offset ?? 0, immediate: opts?.immediate, duration: opts?.duration ?? 1.1 })
    });
    const onSheet = () => (html.classList.contains('sheet-open') ? lenis.stop() : lenis.start());
    const mo = new MutationObserver(onSheet);
    mo.observe(html, { attributes: true, attributeFilter: ['class'] });
    return () => {
      mo.disconnect();
      gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
      setScroller(null);
      html.classList.remove('has-lenis');
    };
  });
  cleanups.push(() => smoothMM.revert());

  /* ---------- reduced motion switch (runtime-safe) ---------- */
  const reduceMM = gsap.matchMedia();
  reduceMM.add(Q.reduce, () => {
    html.classList.remove('motion');
    return () => html.classList.add('motion');
  });
  cleanups.push(() => reduceMM.revert());

  /* ---------- late boot: the pre-paint fallback may have removed .motion after 4 s ---------- */
  const reduceNow = window.matchMedia(Q.reduce).matches;
  const late = !reduceNow && !html.classList.contains('motion');
  if (late) html.classList.add('motion');

  /* ---------- opening intro: time-based, once per load (skipped if we booted late) ---------- */
  const heroFig = document.querySelector<HTMLElement>('.hero-sketch');
  if (heroFig && !reduceNow) {
    cleanups.push(heroIntro(heroFig, document.querySelector('.h1-underline .draw-path'), late || window.scrollY > 200));
  }

  /* ---------- "after hours" atmosphere (Visit + footer) ---------- */
  const atmos = document.querySelector<HTMLCanvasElement>('.visit .atmos');
  // WebGL shader first; Canvas 2D if WebGL is unavailable; the CSS glow underneath if both fail.
  if (atmos) cleanups.push(initAtmosphereGL(atmos) ?? initAtmosphere(atmos));
  cleanups.push(initShelfTone());

  /* ---------- scroll choreography, rebuilt per breakpoint ---------- */
  const mm = gsap.matchMedia();
  mm.add({ pinned: Q.pinned, wide: Q.wide, motion: Q.motion, mobile: Q.mobile }, (ctx) => {
    const { pinned, wide, motion, mobile } = ctx.conditions as Record<string, boolean>;
    if (!motion) return;
    // Desktop scroll is already eased by Lenis; on touch screens the scroll-linked drawings get a short
    // ease of their own so they glide after the finger instead of tracking every jitter.
    const soft: true | number = window.matchMedia('(pointer: coarse)').matches ? 0.5 : true;
    const undo: (() => void)[] = [];

    // Menu first: ScrollTrigger measures in creation order, so the pin (and its spacer)
    // must exist before any trigger further down the page is calculated.
    const section = document.getElementById('menu');
    if (section) undo.push(pinned ? buildPinnedMenu(section, !wide) : buildFlowMenu(section, soft));

    // hero parallax (gentle, fully reversible)
    gsap.to('.opening-figure .sketch-frame', {
      yPercent: 6, ease: 'none',
      scrollTrigger: { trigger: '.opening', start: 'top top', end: 'bottom top', scrub: soft }
    });

    // section headings: words rise through a mask (plays once per visit, never reverses)
    gsap.utils.toArray<HTMLElement>('[data-split]').forEach((h) => {
      // y: 0 is explicit: GSAP would otherwise read the CSS start state (translateY(110%)) as a px offset
      playOnEnter(h, gsap.fromTo(h.querySelectorAll('.split-word'), { y: 0, yPercent: 110 }, {
        y: 0, yPercent: 0, duration: 0.8, ease: 'power3.out', stagger: mobile ? 0.04 : 0.06
      }), 'top 86%', pinned && wide && !!h.closest('.menu-pin') ? document.querySelector('.menu-pin') : undefined);
    });

    // Story: the margin line draws down as you read; its arrows follow
    const storyLine = document.querySelector('.story-line .draw-path');
    if (storyLine) {
      gsap.fromTo(storyLine, { strokeDashoffset: 1 }, {
        strokeDashoffset: 0, ease: 'none',
        scrollTrigger: { trigger: '.story', start: 'top 72%', end: 'bottom 72%', scrub: soft }
      });
    }
    gsap.utils.toArray<HTMLElement>('.story-note').forEach((note) => {
      gsap.fromTo(note.querySelectorAll('.draw-path'), { strokeDashoffset: 1 }, {
        strokeDashoffset: 0, ease: 'none',
        scrollTrigger: { trigger: note, start: 'top 78%', end: 'top 58%', scrub: soft }
      });
      gsap.fromTo(note.querySelector('.note'), { autoAlpha: 0 }, {
        autoAlpha: 1, ease: 'none', scrollTrigger: { trigger: note, start: 'top 80%', end: 'top 66%', scrub: soft }
      });
    });
    const storyUnder = document.querySelectorAll('.story .owner-block, .story-figure figcaption');
    storyUnder.forEach((el) => playOnEnter(el, gsap.fromTo(el, { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, ease: 'power2.out' }), 'top 88%'));

    // Media: crop marks draw at the corners, then the frame content fades in (once)
    gsap.utils.toArray<HTMLElement>('[data-media]').forEach((fig) => {
      const tl = gsap.timeline();
      playOnEnter(fig, tl, 'top 88%');
      tl.fromTo(fig.querySelectorAll('.crop'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.24, stagger: 0.1, ease: 'power1.inOut' })
        .fromTo(fig.querySelector('.frame > picture img, .frame > .owner-slot'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, ease: 'power1.out' }, 0.2);
    });

    // Visit: the dotted route draws toward the pin as the map comes into view
    const clip = document.querySelector('.route-clip-rect');
    if (clip) {
      gsap.fromTo(clip, { attr: { width: 0 } }, {
        attr: { width: 432 }, ease: 'none',
        scrollTrigger: { trigger: '.visit-map', start: 'top 82%', end: 'center 48%', scrub: soft }
      });
      const map = document.querySelector('.visit-map');
      if (map) playOnEnter(map, gsap.fromTo('.visit-map .pin', { autoAlpha: 0, y: -8 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out' }), 'center 60%');
    }

    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    return () => undo.forEach((f) => f());
  });
  cleanups.push(() => mm.revert());

  /* ---------- guide character ---------- */
  cleanups.push(initGuide());

  /* ---------- refresh after fonts / full load, but never mid-scroll ----------
     Image boxes are reserved (width/height + aspect-ratio), so per-image refreshes aren't needed;
     a refresh during a smooth anchor jump would interrupt it. */
  let t = 0, lastScroll = 0;
  const onScroll = () => { lastScroll = performance.now(); };
  window.addEventListener('scroll', onScroll, { passive: true });
  const refresh = () => {
    clearTimeout(t);
    t = window.setTimeout(() => {
      if (performance.now() - lastScroll < 300) { refresh(); return; }
      ScrollTrigger.refresh();
    }, 200);
  };
  document.fonts?.ready.then(refresh);
  window.addEventListener('load', refresh);
  cleanups.push(() => { clearTimeout(t); window.removeEventListener('load', refresh); window.removeEventListener('scroll', onScroll); });

  return () => cleanups.reverse().forEach((f) => f());
}

/**
 * Plays `anim` once when `trigger` enters. More robust than `once: true` for big scroll jumps:
 * the trigger persists, and if the page is already past the start, the animation completes at once.
 */
function playOnEnter(trigger: Element, anim: gsap.core.Animation, start: string, pinnedContainer?: Element | null) {
  anim.pause(0);
  const st = ScrollTrigger.create({
    trigger, start, pinnedContainer: pinnedContainer ?? undefined,
    onEnter: () => anim.play(),
    onEnterBack: () => anim.play(),
    onRefresh: (self) => { if (self.progress > 0 || window.scrollY > self.start) anim.progress(1); }
  });
  if (window.scrollY > st.start) anim.progress(1);
  return st;
}

/* One pinned stage; six items advance through 140 vh each (115 vh on phones and tablets, where only the
   picture stage pins and the intro scrolls away first). */
function buildPinnedMenu(section: HTMLElement, compact = false) {
  section.classList.add('is-pinned');
  section.classList.toggle('is-compact', compact);
  const pin = section.querySelector<HTMLElement>(compact ? '.menu-items' : '.menu-pin')!;
  const items = gsap.utils.toArray<HTMLElement>('.menu-item', section);
  const links = gsap.utils.toArray<HTMLAnchorElement>('.menu-index a', section);
  const n = items.length;

  const setIndex = (i: number) => links.forEach((a, j) => (j === i ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
  setIndex(0);
  // Text fades between items; pictures are drawn in and then ERASED off the paper (mask on the
  // frame driven by --xo, with a drawn eraser riding the front), so no wrapper ever fades.
  const texts = (item: HTMLElement) => item.querySelectorAll(':scope > .menu-count, :scope > .menu-item-text');
  items.slice(1).forEach((it) => gsap.set(texts(it), { opacity: 0 }));
  items.forEach((it, i) => it.toggleAttribute('data-inactive', i > 0));

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: pin,
      start: () => `top top+=${headerH()}`,
      end: () => `+=${Math.round(n * window.innerHeight * (compact ? 1.15 : 1.4))}`,
      pin: true,
      pinSpacing: true,
      scrub: 0.6,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const i = Math.min(n - 1, Math.floor(self.progress * n * 0.9999));
        setIndex(i);
        items.forEach((it, j) => it.toggleAttribute('data-inactive', j !== i));
      }
    }
  });
  items.forEach((item, i) => {
    const fig = item.querySelector<HTMLElement>('.sketch')!;
    const eraser = item.querySelector<HTMLElement>('.eraser');
    // text in (the first item's is already visible)
    if (i > 0) tl.fromTo(texts(item), { opacity: 0 }, { opacity: 1, duration: 0.05, immediateRender: false }, i);
    // draw → graphite → photograph (ends ~i+0.57), then hold the finished photo
    addSketchSteps(tl, fig, i + 0.04, {
      underline: item.querySelector('.menu-item-underline .draw-path'),
      arrow: gsap.utils.toArray<Element>('.menu-arrow .draw-path', item)
    }, 0.62);
    // the "Concept image" label arrives with the photograph, not over a blank page
    const chip = fig.querySelector('.chip');
    if (chip) tl.fromTo(chip, { opacity: 0 }, { opacity: 1, duration: 0.05 }, i + 0.36);
    // eraser cleans the product off the paper before the next one is drawn
    if (i < n - 1) {
      tl.fromTo(fig, { '--xo': '-30%' }, { '--xo': '132%', duration: 0.16, ease: 'power1.inOut' }, i + 0.8);
      if (eraser) {
        tl.fromTo(eraser, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.02, immediateRender: false }, i + 0.78)
          .fromTo(eraser, { xPercent: -50, yPercent: -50, rotation: -14 }, {
            keyframes: [
              { yPercent: -150, rotation: -18 }, { yPercent: 40, rotation: -10 }, { yPercent: -120, rotation: -16 },
              { yPercent: 20, rotation: -11 }, { yPercent: -50, rotation: -14 }
            ],
            duration: 0.16, ease: 'none', immediateRender: false
          }, i + 0.8)
          .fromTo(eraser, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.02, immediateRender: false }, i + 0.96);
      }
      tl.fromTo(texts(item), { opacity: 1 }, { opacity: 0, duration: 0.08, immediateRender: false }, i + 0.87);
    }
  });
  tl.to({}, { duration: 0.001 }, n); // total length = n units

  // Index: jump to the point where that item's photograph has resolved.
  const onIndex = (e: Event) => {
    e.preventDefault();
    const i = (e as CustomEvent<number>).detail;
    const st = tl.scrollTrigger!;
    const y = st.start + (st.end - st.start) * ((i + 0.68) / n);
    import('../lib/bus').then(({ scrollToY }) => scrollToY(y));
  };
  window.addEventListener('bbs:menu-index', onIndex);

  return () => {
    window.removeEventListener('bbs:menu-index', onIndex);
    section.classList.remove('is-pinned', 'is-compact');
    links.forEach((a) => a.removeAttribute('aria-current'));
    items.forEach((it) => it.removeAttribute('data-inactive'));
  };
}

/* Very short screens (a phone on its side): no pin. Each item scrubs as it passes through the viewport. */
function buildFlowMenu(section: HTMLElement, soft: true | number = true) {
  gsap.utils.toArray<HTMLElement>('.menu-item', section).forEach((item) => {
    const fig = item.querySelector<HTMLElement>('.sketch')!;
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: fig, start: 'top 85%', end: 'center 35%', scrub: soft }
    });
    addSketchSteps(tl, fig, 0, { underline: item.querySelector('.menu-item-underline .draw-path') });
  });
  return () => {};
}
