/*
  Mascot scene QA (desktop pinned menu): wave on first scroll → exit behind the nav line →
  recommendation beside an approved bread → hides behind it → returns home on the next section.
    node scripts/qa-mascot.mjs [--base http://127.0.0.1:4174] [--out qa/mascot] [--pick 0..0.99] [--width 1440 --height 900]
  --pick fixes Math.random so the approved spot is repeatable (0 = first spot still ahead).
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
if (args.pick) await p.evaluateOnNewDocument((v) => { Math.random = () => v; }, Number(args.pick));
await p.setViewport({ width: W, height: H });
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
  const hit = (sel) => [...document.querySelectorAll(sel)].filter((el) => {
    const r = el.getBoundingClientRect(); if (!r.width || getComputedStyle(el).visibility === 'hidden' || +getComputedStyle(el).opacity === 0) return false;
    return fig && r.left < fig.r && r.right > fig.l && r.top < fig.b && r.bottom > fig.t;
  }).map((el) => el.className || el.tagName);
  const active = document.querySelector('#menu .menu-item:not([data-inactive])');
  return {
    visibility: cs.visibility, pose: svg.dataset.pose, scene: svg.dataset.scene ?? null, clip: g.style.clipPath ? g.style.clipPath.slice(0, 22) : '',
    transform: g.style.transform, fig: fig && Object.fromEntries(Object.entries(fig).map(([k, v]) => [k, Math.round(v)])),
    overlaps: fig && cs.visibility !== 'hidden' ? [
      ...hit('.primary-nav a, .header-directions, .wordmark'),
      ...hit('.menu-index a'),
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

// STATE 4: settle on the approved spot the director picked
const pin = await p.evaluate(() => { const sp = document.querySelector('#menu .pin-spacer'); const h = document.querySelector('.site-header').offsetHeight; return { start: sp.getBoundingClientRect().top + scrollY - h, len: sp.offsetHeight - sp.firstElementChild.offsetHeight }; });
const spots = [0, 1, 2, 4];      // approved items (salt, garlic, cranberry, croissant sandwich)
let found = null;
for (const i of spots) {
  await p.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), pin.start + pin.len * ((i + 0.68) / 6));
  await wait(900);
  const s = await state();
  if (s.visibility !== 'hidden') { found = i; break; }
  await wait(600);
  const s2 = await state();
  if (s2.visibility !== 'hidden') { found = i; break; }
}
log.push({ name: 'scene-item', found });
await snap('06-peek-out', 0);
await snap('07-beside', 700);
await snap('08-present', 700);
await snap('09-nod', 700);
await snap('10-wink', 600);
await snap('11-hiding', 900);
await snap('12-hidden', 900);

// STATE 6: next section → peeks down from behind the line, lowers in, hangs
await p.evaluate(() => { const el = document.getElementById('story'); window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 120, behavior: 'instant' }); });
await snap('13-peek-down', 900);
await snap('14-look', 500);
await snap('15-lower', 1000);
await snap('16-home', 1400);

// the wave and the scene are once per visit: back to the menu spot, nothing happens
if (found !== null) {
  await p.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), pin.start + pin.len * ((found + 0.68) / 6));
  await snap('17-menu-again', 1800);
}
await browser.close();
await fs.writeFile(path.join(OUT, 'mascot.json'), JSON.stringify({ log, errors }, null, 2));
for (const l of log) console.log(l.name.padEnd(14), JSON.stringify(l).slice(0, 260));
console.log('errors:', errors);

process.exit(0);
