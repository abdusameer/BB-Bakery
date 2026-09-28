/*
  "After hours" atmosphere for the Visit + footer chapter (atmosphere-background skill).
  A warm-charcoal field with tall, overlapping light folds that rise from the lower edge and
  drift slowly, screen-blended so crossings brighten, plus a focal bloom in the lower right.
  The glow color is taken from the bread photography (crust gold), not a generic cyan.

  Performance: rendered at reduced resolution (≤ 0.6 × CSS px × DPR cap 1.5), capped at 30 fps,
  paused off-screen and when the tab is hidden. Reduced motion draws one still frame.
*/

type Fold = { x: number; w: number; h: number; speed: number; phase: number; sway: number; lean: number; alpha: number; hue: number };

const BASE = '#17130F';
const HUES: [number, number, number][] = [
  [214, 146, 72],   // crust gold
  [238, 186, 116],  // crumb light
  [170, 96, 46]     // deep bake
];

export function initAtmosphere(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return () => {};
  const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  let W = 1, H = 1, raf = 0, last = 0, visible = false;
  const t0 = performance.now();
  let folds: Fold[] = [];

  const build = () => {
    const n = window.innerWidth < 768 ? 5 : 8;
    // deterministic pseudo-random spread, concentrated toward the right (the facts column stays darker)
    folds = Array.from({ length: n }, (_, i) => {
      const f = i / (n - 1);
      const r = (k: number) => ((i * k) % 97) / 97;
      return {
        x: 0.38 + f * 0.7,
        w: 0.06 + r(37) * 0.08,
        h: 0.72 + r(53) * 0.4,
        speed: 0.035 + r(29) * 0.05,
        phase: i * 1.73,
        sway: 0.018 + r(17) * 0.03,
        lean: (i % 2 ? 1 : -1) * (0.05 + r(13) * 0.09),
        alpha: 0.14 + r(41) * 0.12,
        hue: i % HUES.length
      };
    });
  };

  const draw = (now: number) => {
    const t = (now - t0) / 1000;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = BASE;
    ctx.fillRect(0, 0, W, H);

    ctx.globalCompositeOperation = 'screen';
    for (const f of folds) {
      const cx = (f.x + Math.sin(t * f.speed + f.phase) * f.sway) * W;
      const hh = f.h * H;
      const ww = f.w * W;
      const lean = f.lean + Math.sin(t * f.speed * 0.7 + f.phase * 1.3) * 0.035;
      const a = f.alpha * (0.9 + 0.1 * Math.sin(t * f.speed * 1.3 + f.phase));
      const [r, g, b] = HUES[f.hue];
      // unit space: x ∈ [-1, 1] across the fold, y ∈ [-1, 0] from its top to the bottom edge
      ctx.setTransform(ww, 0, lean * hh, hh, cx, H);
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      grad.addColorStop(0, `rgba(${r},${g},${b},${a})`);
      grad.addColorStop(0.42, `rgba(${r},${g},${b},${a * 0.42})`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(-1, -1, 2, 1);
    }

    // focal bloom, lower right (continues into the footer)
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const bx = W * 0.86, by = H * 1.04, br = Math.max(W, H) * 0.62;
    const bloom = ctx.createRadialGradient(bx, by, 0, bx, by, br);
    bloom.addColorStop(0, 'rgba(242,178,100,0.34)');
    bloom.addColorStop(0.35, 'rgba(214,146,72,0.13)');
    bloom.addColorStop(1, 'rgba(214,146,72,0)');
    ctx.fillStyle = bloom;
    ctx.fillRect(0, 0, W, H);

    // keep the left (facts) side calm for contrast
    ctx.globalCompositeOperation = 'source-over';
    const shade = ctx.createLinearGradient(0, 0, W * 0.58, 0);
    shade.addColorStop(0, 'rgba(23,19,15,0.62)');
    shade.addColorStop(1, 'rgba(23,19,15,0)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, W * 0.58, H);
  };

  const loop = (now: number) => {
    raf = 0;
    if (!visible || document.hidden || reduceMQ.matches) return;
    if (now - last >= 33) { last = now; draw(now); }
    raf = requestAnimationFrame(loop);
  };
  const start = () => { if (!raf && visible && !document.hidden && !reduceMQ.matches) raf = requestAnimationFrame(loop); };
  const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    const k = (window.innerWidth < 768 ? 0.5 : 0.6) * dpr;
    W = Math.max(1, Math.round(r.width * k));
    H = Math.max(1, Math.round(r.height * k));
    canvas.width = W;
    canvas.height = H;
    build();
    draw(performance.now());
  };

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  const io = new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting);
    canvas.dataset.animationActive = String(visible && !reduceMQ.matches);
    if (visible) start(); else stop();
  }, { rootMargin: '120px 0px' });
  io.observe(canvas);
  const onVis = () => (document.hidden ? stop() : start());
  document.addEventListener('visibilitychange', onVis);
  const onReduce = () => { stop(); draw(performance.now()); start(); };
  reduceMQ.addEventListener('change', onReduce);

  resize();
  canvas.dataset.renderer = 'canvas2d';
  canvas.classList.add('is-live');

  return () => {
    stop();
    ro.disconnect();
    io.disconnect();
    document.removeEventListener('visibilitychange', onVis);
    reduceMQ.removeEventListener('change', onReduce);
    canvas.classList.remove('is-live');
  };
}

/** The header's shelf band takes the night tone while the dark chapter sits under it. */
export function initShelfTone(): () => void {
  const html = document.documentElement;
  const visit = document.getElementById('visit');
  const header = document.querySelector<HTMLElement>('.site-header');
  if (!visit || !header) return () => {};
  let pending = false;
  const check = () => {
    pending = false;
    const under = visit.getBoundingClientRect().top <= header.getBoundingClientRect().bottom + 2;
    html.classList.toggle('shelf-dark', under);
  };
  const onScroll = () => { if (!pending) { pending = true; requestAnimationFrame(check); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  check();
  return () => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    html.classList.remove('shelf-dark');
  };
}
