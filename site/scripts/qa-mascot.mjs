/*
  Mascot scene QA (desktop pinned menu): wave on first scroll → exit behind the nav line →
  presents every bread in turn (wink only on the last) → hides behind each → returns home on the next section.
    node scripts/qa-mascot.mjs [--base http://127.0.0.1:4174] [--out qa/mascot] [--width 1440 --height 900]
  Checks that the visible figure never overlaps the item text, index rail, Sketch button, chip or nav.
*/
import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import path from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => a.startsWith('--') ? [a.slice(2), arr[i + 1]] : null).filter(Boolean));
const BASE = args.base || 'http://127.0.0.1:4174';
const OUT = path.resolve(args.out || 'qa/mascot');
const W = Number(args.width || 1440), H = Number(args.height || 900);
await fs.mkdir(OUT, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--hide-scrollbars'] });
const p = await browser.newPage();
const errors = [];
p.on('pageerror', (e) => errors.push(String(e)));
p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const touch = W < 1024;
await p.setViewport({ width: W, height: H, ...(touch ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}) });
await p.goto(BASE + '/', { waitUntil: 'networkidle0' });
await wait(2600);

const state = () => p.evaluate(() => {
  const g = document.querySelector('.site-header .guide'), svg = g.querySelector('.guide-svg');
  const cs = getComputedStyle(g);
  // visible figure = roll + legs + whichever arms the pose shows
  const parts = ['roll', 'leg-l', 'leg-r', 'arm-l-grip', 'arm-r-grip', 'front-wave-r', 'front-present-r', 'front-down-l']
    .map((n) => svg.querySelector(`[data-part="${n}"]`)).filter((el) => el && getComputedStyle(el).opacity !== '0');
  const rs = parts.map((el) => el.getBoundingClientRect());
  const fig = rs.length ? { l: Math.min(...rs.map((r) => r.left)), t: Math.min(...rs.map((r) => r.top)), r: Math.max(...rs.map((r) => r.right)), b: Math.max(...rs.map((r) => r.bottom)) } : null;
  // a line clip hides everything above the nav line (he is behind the header border there)
  if (fig && g.style.clipPath.startsWith('polygon(-900px')) { const l = document.querySelector('.nav-line').getBoundingClientRect(); fig.t = Math.max(fig.t, l.top + l.height / 2 + 1); }
  // a box clip (the header rule on phones, the footer's top edge) hides everything below its bottom
  const bm = g.style.clipPath.match(/^polygon\(-900px -900px, 1100px -900px, 1100px ([\d.-]+)px/);
  if (fig && bm) { const gr = g.getBoundingClientRect(); const sc = gr.width / g.offsetWidth || 1; fig.b = Math.min(fig.b, gr.top + Number(bm[1]) * sc); }
  if (fig && fig.b <= fig.t) return { visibility: cs.visibility, pose: svg.dataset.pose, scene: svg.dataset.scene ?? null, fig: null, overlaps: [], winking: false, chalk: g.classList.contains('is-chalk') };
  const hit = (sel) => [...document.querySelectorAll(sel)].filter((el) => {
    const r = el.getBoundingClientRect(); if (!r.width || getComputedStyle(el).visibility === 'hidden' || +getComputedStyle(el).opacity === 0) return false;
    return fig && r.left < fig.r && r.right > fig.l && r.top < fig.b && r.bottom > fig.t;
  }).map((el) => el.className || el.tagName);
  const active = document.querySelector('#menu .menu-item:not([data-inactive])');
  return {
    winking: svg.classList.contains('is-winking'),
    chalk: g.classList.contains('is-chalk'),
    visibility: cs.visibility, pose: svg.dataset.pose, scene: svg.dataset.scene ?? null, clip: g.style.clipPath ? g.style.clipPath.slice(0, 22) : '',
    transform: g.style.transform, fig: fig && Object.fromEntries(Object.entries(fig).map(([k, v]) => [k, Math.round(v)])),
    overlaps: fig && cs.visibility !== 'hidden' ? [
      ...hit('.primary-nav a, .header-directions, .wordmark, .quick-links a, .index-toggle'),
      ...hit('.menu-index a'),
      ...hit('.visit-map .map-addr, .visit-map .map-label, .visit-map figcaption span, .visit-actions .btn, .visit-facts h3, .visit-facts address, .visit-facts li, .future-contact, .site-footer p'),
      ...(active ? [...active.querySelectorAll('.menu-item-text h3, .menu-item-note, .menu-count, .sketch-toggle, .chip')].filter((el) => { const r = el.getBoundingClientRect(); return fig && r.left < fig.r && r.right > fig.l && r.top < fig.b && r.bottom > fig.t && getComputedStyle(el).visibility !== 'hidden'; }).map((el) => el.className || el.tagName) : [])
    ] : []
  };
});
const shot = async (name) => p.screenshot({ path: path.join(OUT, `${name}.png`) });
const log = [];
const snap = async (name, ms) => { if (ms) await wait(ms); const s = await state(); log.push({ name, ...s }); await shot(name); return s; };

await snap('01-hang');
// STATE 2/3: first meaningful scroll
await p.evaluate(() => window.scrollTo({ top: 140, behavior: 'instant' }));
await snap('02-wake', 350);
await snap('03-wave', 600);
await snap('04-exit', 1250);
await snap('05-away', 900);

// STATE 4/5: every bread, in menu order — he presents each one once when the reader stops on it
const pin = await p.evaluate(() => { const sp = document.querySelector('#menu .pin-spacer'); const h = document.querySelector('.site-header').offsetHeight; return { start: sp.getBoundingClientRect().top + scrollY - h, len: sp.offsetHeight - sp.firstElementChild.offsetHeight }; });
const breads = [0, 1, 2, 3, 4];
const scenes = [];
for (const i of breads) {
  await p.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), pin.start + pin.len * ((i + 0.68) / 6));
  let appeared = false;
  const t0 = Date.now();
  while (Date.now() - t0 < 3000) { if ((await state()).visibility !== 'hidden') { appeared = true; break; } await wait(80); }
  const rec = { bread: i, appeared, winked: false, overlaps: new Set(), poses: new Set(), ms: 0 };
  const t1 = Date.now();
  let shotTaken = false;
  while (appeared && Date.now() - t1 < 9000) {
    const s = await state();
    if (s.visibility === 'hidden') break;
    s.overlaps.forEach((o) => rec.overlaps.add(o));
    rec.poses.add(s.pose);
    if (s.winking) rec.winked = true;
    if (!shotTaken && Date.now() - t1 > 2250) { await shot(`bread-${i}-present`); shotTaken = true; }
    await wait(100);
  }
  rec.ms = Date.now() - t1;
  scenes.push({ ...rec, overlaps: [...rec.overlaps], poses: [...rec.poses] });
  log.push({ name: `bread-${i}`, ...scenes.at(-1) });
}
await snap('12-after-breads', 1500);

// STATE 6: next section → peeks down from behind the line, lowers in, hangs
await p.evaluate(() => { const el = document.getElementById('story'); window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 120, behavior: 'instant' }); });
await snap('13-peek-down', 900);
await snap('14-look', 500);
await snap('15-lower', 1000);
await snap('16-home', 1400);

// Visit: walks the dotted route to the shop pin (chalk), presents it, glances at Get directions, walks back out
await p.evaluate(() => { const m = document.querySelector('.visit-map svg'); const r = m.getBoundingClientRect(); window.scrollTo({ top: r.top + scrollY - (innerHeight * 0.44 - r.height / 2), behavior: 'instant' }); });
await wait(700);
await p.evaluate(() => window.scrollBy({ top: 1, behavior: 'instant' }));
{
  let appeared = false; const t0 = Date.now();
  while (Date.now() - t0 < 4000) { const s = await state(); if (s.visibility !== 'hidden' && s.pose === 'present') { appeared = true; break; } await wait(80); }
  log.push({ name: 'map-scene', appeared });
  await snap('18-map-walk', 900);
  await snap('19-map-pin', 1500);
  await snap('20-map-glance', 900);
  await snap('21-map-leave', 900);
  await snap('22-map-gone', 1400);
}
// footer: climbs up behind its top edge, hands on the ledge, waves, stays
await p.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
{
  let appeared = false; const t0 = Date.now();
  while (Date.now() - t0 < 5000) { const s = await state(); if (s.visibility !== 'hidden' && (s.pose || '').startsWith('ledge')) { appeared = true; break; } await wait(80); }
  log.push({ name: 'footer-scene', appeared });
  await snap('23-ledge-rise', 300);
  await snap('24-ledge-wave', 1500);
  await snap('25-ledge-rest', 1600);
  await snap('26-ledge-still', 1500);
}
await p.evaluate(() => window.scrollBy({ top: -160, behavior: 'instant' }));
await snap('27-ledge-sink', 250);
await snap('28-home-again', 4200);

// each bread is presented once per visit: back to the first bread, nothing happens
await p.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), pin.start + pin.len * (0.68 / 6));
await snap('17-menu-again', 2200);
await browser.close();
await fs.writeFile(path.join(OUT, 'mascot.json'), JSON.stringify({ log, errors }, null, 2));
for (const l of log) console.log(l.name.padEnd(14), JSON.stringify(l).slice(0, 260));
console.log('errors:', errors);

process.exit(0);
