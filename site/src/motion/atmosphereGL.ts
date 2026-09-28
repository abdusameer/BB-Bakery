/*
  WebGL "after hours" atmosphere (webgl-landing-steering → Lane A: subtle depth field).
  One full-screen fragment shader, no library. It draws:
    · 8 tall crust-gold light folds (5 on narrow screens) rising from the lower edge, slowly swaying
      and leaning, with a drifting fabric-crease noise so they read like lit cloth, not columns
    · screen blending between folds, a focal bloom in the lower right (continues into the footer)
    · a faint warm glow that follows the pointer (desktop fine pointer only)
    · film grain / dither so the dark gradients never band
  The facts column (left) is shaded down so text contrast always holds.

  Gates: DPR cap 1.5 × resolution scale (0.75 desktop / 0.6 mobile), 30 fps cap, paused off-screen
  and on hidden tabs, one still frame for reduced motion, context loss handled, GPU resources
  released on cleanup. Returns null when WebGL is unavailable so the Canvas 2D version takes over.
*/

const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() { v_uv = a_pos * 0.5 + 0.5; gl_Position = vec4(a_pos, 0.0, 1.0); }`;

const FRAG = `
precision mediump float;
uniform vec2 u_res;
uniform float u_time;
uniform vec3 u_ptr;      // xy = pointer uv, z = amount 0..1
uniform float u_folds;
varying vec2 v_uv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
vec3 screenB(vec3 a, vec3 b) { return 1.0 - (1.0 - a) * (1.0 - b); }

void main() {
  vec2 uv = v_uv;
  float aspect = u_res.x / u_res.y;
  float t = u_time;
  vec3 base = vec3(0.090, 0.075, 0.059);          // #17130F
  vec3 glow = vec3(0.0);

  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    if (fi >= u_folds) break;
    float f = fi / max(u_folds - 1.0, 1.0);
    float r1 = hash(vec2(fi, 1.3));
    float r2 = hash(vec2(fi, 7.1));
    float r3 = hash(vec2(fi, 3.7));
    float r4 = hash(vec2(fi, 9.2));
    float speed = 0.035 + r1 * 0.05;
    float x0 = 0.38 + f * 0.70 + sin(t * speed + fi * 1.73) * (0.018 + r2 * 0.03);
    float side = mod(fi, 2.0) < 1.0 ? -1.0 : 1.0;
    float lean = side * (0.05 + r3 * 0.09) + sin(t * speed * 0.7 + fi * 2.2) * 0.035;
    float w = 0.06 + r4 * 0.08;
    float h = 0.60 + r2 * 0.36;
    float d = (uv.x - (x0 - lean * uv.y)) / w;
    float body = exp(-d * d * 2.2) * (1.0 - smoothstep(0.0, 1.0, uv.y / h));
    // fabric creases drifting slowly upward
    float n = noise(vec2(d * 1.6 + fi * 3.1, uv.y * 3.2 - t * 0.06 * (0.5 + r1)));
    body *= 0.72 + 0.56 * n;
    float a = (0.14 + r3 * 0.12) * (0.9 + 0.1 * sin(t * speed * 1.3 + fi));
    float k = mod(fi, 3.0);
    vec3 hue = k < 1.0 ? vec3(0.839, 0.573, 0.282) : (k < 2.0 ? vec3(0.933, 0.729, 0.455) : vec3(0.667, 0.376, 0.180));
    glow = screenB(glow, hue * body * a * 1.25);
  }

  // focal bloom, lower right
  vec2 q = (uv - vec2(0.86, -0.04)) * vec2(aspect, 1.0);
  float bloom = exp(-dot(q, q) / (0.30 * max(aspect, 1.0)));
  glow = screenB(glow, vec3(0.949, 0.698, 0.392) * bloom * 0.28);

  // pointer glow (desktop)
  if (u_ptr.z > 0.001) {
    vec2 pq = (uv - u_ptr.xy) * vec2(aspect, 1.0);
    glow = screenB(glow, vec3(0.93, 0.70, 0.43) * exp(-dot(pq, pq) / 0.02) * 0.10 * u_ptr.z);
  }

  // keep the facts column calm for contrast
  glow *= mix(0.38, 1.0, smoothstep(0.0, 0.58, uv.x));
  vec3 col = screenB(base, glow);

  // grain / dither against banding
  col += (hash(uv * u_res + fract(t * 7.0)) - 0.5) * 0.028;
  gl_FragColor = vec4(col, 1.0);
}`;

export function initAtmosphereGL(canvas: HTMLCanvasElement): (() => void) | null {
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, powerPreference: 'low-power' });
  if (!gl) return null;

  const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fineMQ = window.matchMedia('(hover: hover) and (pointer: fine)');
  const section = canvas.closest('section') ?? canvas;
  let prog: WebGLProgram | null = null;
  let buf: WebGLBuffer | null = null;
  let loc: { res: WebGLUniformLocation | null; time: WebGLUniformLocation | null; ptr: WebGLUniformLocation | null; folds: WebGLUniformLocation | null } | null = null;
  let raf = 0, last = 0, visible = false, lost = false, disposed = false;
  const t0 = performance.now();
  const ptr = { x: 0.7, y: 0.4, amt: 0, tx: 0.7, ty: 0.4, tAmt: 0 };

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { const log = gl.getShaderInfoLog(s); gl.deleteShader(s); throw new Error(log ?? 'shader'); }
    return s;
  };
  const setup = () => {
    const vs = compile(gl.VERTEX_SHADER, VERT), fs = compile(gl.FRAGMENT_SHADER, FRAG);
    prog = gl.createProgram()!;
    gl.attachShader(prog, vs); gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.deleteShader(vs); gl.deleteShader(fs);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'link');
    gl.useProgram(prog);
    buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    loc = { res: gl.getUniformLocation(prog, 'u_res'), time: gl.getUniformLocation(prog, 'u_time'), ptr: gl.getUniformLocation(prog, 'u_ptr'), folds: gl.getUniformLocation(prog, 'u_folds') };
  };

  try { setup(); } catch { return null; }

  const draw = (now: number) => {
    if (lost || !loc) return;
    const still = reduceMQ.matches;
    const t = still ? 12 : (now - t0) / 1000;
    // pointer easing (τ ≈ 300 ms)
    const k = 1 - Math.exp(-33 / 300);
    ptr.x += (ptr.tx - ptr.x) * k; ptr.y += (ptr.ty - ptr.y) * k; ptr.amt += (ptr.tAmt - ptr.amt) * k;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(loc.res, canvas.width, canvas.height);
    gl.uniform1f(loc.time, t);
    gl.uniform3f(loc.ptr, ptr.x, ptr.y, still ? 0 : ptr.amt);
    gl.uniform1f(loc.folds, window.innerWidth < 768 ? 5 : 8);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const loop = (now: number) => {
    raf = 0;
    if (!visible || document.hidden || reduceMQ.matches || lost) return;
    if (now - last >= 33) { last = now; draw(now); }
    raf = requestAnimationFrame(loop);
  };
  const start = () => { if (!raf && visible && !document.hidden && !reduceMQ.matches && !lost) raf = requestAnimationFrame(loop); };
  const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    const scale = (window.innerWidth < 768 ? 0.6 : 0.75) * dpr;
    canvas.width = Math.max(1, Math.round(r.width * scale));
    canvas.height = Math.max(1, Math.round(r.height * scale));
    draw(performance.now());
  };

  const onMove = (e: PointerEvent) => {
    if (!fineMQ.matches || e.pointerType !== 'mouse') return;
    const r = canvas.getBoundingClientRect();
    ptr.tx = (e.clientX - r.left) / r.width;
    ptr.ty = 1 - (e.clientY - r.top) / r.height;
    ptr.tAmt = 1;
  };
  const onLeave = () => { ptr.tAmt = 0; };
  section.addEventListener('pointermove', onMove as EventListener, { passive: true });
  section.addEventListener('pointerleave', onLeave);

  const onLost = (e: Event) => { e.preventDefault(); lost = true; stop(); canvas.dataset.renderer = 'webgl-lost'; };
  const onRestored = () => {
    if (disposed) return;
    lost = false;
    try { setup(); canvas.dataset.renderer = 'webgl'; resize(); start(); } catch { /* keep the CSS glow underneath */ }
  };
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);

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
  canvas.dataset.renderer = 'webgl';
  canvas.classList.add('is-live');

  return () => {
    disposed = true;
    stop();
    ro.disconnect();
    io.disconnect();
    document.removeEventListener('visibilitychange', onVis);
    reduceMQ.removeEventListener('change', onReduce);
    section.removeEventListener('pointermove', onMove as EventListener);
    section.removeEventListener('pointerleave', onLeave);
    canvas.removeEventListener('webglcontextlost', onLost);
    canvas.removeEventListener('webglcontextrestored', onRestored);
    if (buf) gl.deleteBuffer(buf);
    if (prog) gl.deleteProgram(prog);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    canvas.classList.remove('is-live');
  };
}
