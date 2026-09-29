/*
  Scroll smoothness: scrolls the whole page top → bottom at a steady speed, one step per frame,
  and records frame intervals per section, plus main-thread time (style, layout, script).
    node scripts/qa-perf.mjs [--base http://127.0.0.1:4174] [--out qa/perf] [--cpu 4] [--speed 1200]
  Runs desktop 1440×900 and phone 390×844 (touch, DPR 3). --cpu throttles the CPU (4 ≈ mid-range phone).
  Headless Chrome rasterizes on the CPU, so absolute numbers are pessimistic; compare runs, not devices.
*/
import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import path from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => a.startsWith('--') ? [a.slice(2), arr[i + 1]] : null).filter(Boolean));
const BASE = args.base || 'http://127.0.0.1:4174';
const OUT = path.resolve(args.out || 'qa/perf');
const CPU = Number(args.cpu || 4);
const SPEED = Number(args.speed || 1200);   // px per second
await fs.mkdir(OUT, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--hide-scrollbars'] });
const R = {};
for (const [name, vp] of [['desktop', { width: 1440, height: 900 }], ['phone', { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true }]]) {
  const p = await browser.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(String(e)));
  await p.setViewport(vp);
  await p.goto(BASE + '/?smooth=0', { waitUntil: 'networkidle0' });
  await wait(2500);
  const cdp = await p.createCDPSession();
  await cdp.send('Performance.enable');
  if (CPU > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
  const m0 = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
  const run = await p.evaluate(async (speed) => {
    const sections = [...document.querySelectorAll('#top, main section[id], footer')];
    const which = () => { const y = innerHeight / 2; const s = sections.find((el) => { const r = el.getBoundingClientRect(); return r.top <= y && r.bottom > y; }); return s ? (s.id || s.tagName.toLowerCase()) : 'other'; };
    const max = document.documentElement.scrollHeight - innerHeight;
    const per = {};
    let last = performance.now(), y = 0;
    window.scrollTo({ top: 0, behavior: 'instant' });
    await new Promise((r) => requestAnimationFrame(r));
    last = performance.now();
    while (y < max) {
      await new Promise((r) => requestAnimationFrame(r));
      const now = performance.now();
      const dt = now - last;
      last = now;
      const k = which();
      (per[k] ||= []).push(dt);
      y = Math.min(max, y + (speed * Math.min(dt, 50)) / 1000);
      window.scrollTo({ top: y, behavior: 'instant' });
    }
    const stat = (a) => { const s = [...a].sort((x, y) => x - y); return { frames: a.length, avg: +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1), p95: +s[Math.floor(s.length * 0.95)].toFixed(1), max: +s[s.length - 1].toFixed(1), over33: a.filter((d) => d > 33.4).length, over50: a.filter((d) => d > 50).length }; };
    const all = Object.values(per).flat();
    return { all: stat(all), sections: Object.fromEntries(Object.entries(per).map(([k, v]) => [k, stat(v)])) };
  }, SPEED);
  const m1 = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
  const d = (k) => +((m1[k] - m0[k]) * 1000).toFixed(0);
  R[name] = { ...run, mainThreadMs: { script: d('ScriptDuration'), style: d('RecalcStyleDuration'), layout: d('LayoutDuration'), task: d('TaskDuration') }, errors };
  await p.close();
}
await browser.close();
await fs.writeFile(path.join(OUT, `perf-cpu${CPU}.json`), JSON.stringify(R, null, 2));
for (const [k, v] of Object.entries(R)) {
  console.log(`${k}: frames ${v.all.frames}, avg ${v.all.avg} ms, p95 ${v.all.p95}, max ${v.all.max}, >33ms ${v.all.over33}, >50ms ${v.all.over50} | main thread`, JSON.stringify(v.mainThreadMs));
  for (const [s, st] of Object.entries(v.sections)) console.log(`   ${s.padEnd(8)} avg ${st.avg} p95 ${st.p95} max ${st.max} >33 ${st.over33} (${st.frames} frames)`);
}
process.exit(0);
