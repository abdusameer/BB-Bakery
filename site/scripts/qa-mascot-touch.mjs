/*
  Mascot scenes on touch layouts (no pinned menu):
    tablet 768×1024 — same scenes as desktop, the mascot follows the bread while the page scrolls;
    phone 390×844  — the simple version: waves and ducks behind the header rule, pops up to point at
                     a bread, nods and winks, then stays home.
    node scripts/qa-mascot-touch.mjs [--base http://127.0.0.1:4174] [--out qa/mascot-touch] [--pick 0..0.99]
*/
import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import path from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => a.startsWith('--') ? [a.slice(2), arr[i + 1]] : null).filter(Boolean));
const BASE = args.base || 'http://127.0.0.1:4174';
const OUT = path.resolve(args.out || 'qa/mascot-touch');
await fs.mkdir(OUT, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--hide-scrollbars'] });
const R = { errors: [] };
const APPROVED = ['menu-salt-bread', 'menu-garlic-cream-cheese', 'menu-cranberry-cream-cheese', 'menu-croissant-sandwich'];
const centerOn = (p, id, at = 0.32) => p.evaluate((id, at) => { const f = document.querySelector(`#${id} .sketch-frame`); const r = f.getBoundingClientRect(); window.scrollTo({ top: r.top + scrollY + r.height / 2 - innerHeight * at, behavior: 'instant' }); }, id, at);

async function page(w, h) {
  const p = await browser.newPage();
  p.on('pageerror', (e) => R.errors.push(String(e)));
  p.on('console', (m) => { if (m.type() === 'error') R.errors.push(m.text()); });
  if (args.pick) await p.evaluateOnNewDocument((v) => { Math.random = () => v; }, Number(args.pick));
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' });
  await wait(2600);
  return p;
}

/* ---------- tablet ---------- */
{
  const p = await page(768, 1024);
  const g = () => p.evaluate(() => { const g = document.querySelector('.site-header .guide'); const s = g.querySelector('.guide-svg'); const r = g.getBoundingClientRect(); return { vis: getComputedStyle(g).visibility, pose: s.dataset.pose, scene: s.dataset.scene ?? null, box: [Math.round(r.left), Math.round(r.top), Math.round(r.width)] }; });
  const log = [];
  const snap = async (name, ms) => { if (ms) await wait(ms); log.push({ name, ...(await g()) }); await p.screenshot({ path: path.join(OUT, `tablet-${name}.png`) }); };
  await p.evaluate(() => window.scrollTo({ top: 140, behavior: 'instant' }));
  await snap('wave', 900);
  await snap('away', 2600);
  let found = null;
  for (const id of APPROVED) {
    await centerOn(p, id);
    await wait(1100);
    if ((await g()).vis !== 'hidden') { found = id; break; }
  }
  log.push({ name: 'scene', found });
  await snap('scene-a', 300);
  await snap('scene-b', 1300);
  if (!found) throw new Error('tablet: no scene');
  // the page scrolls a little mid-scene: he stays with the bread (same offset from it)
  const before = await p.evaluate((id) => { const g = document.querySelector('.site-header .guide').getBoundingClientRect(); const f = document.querySelector(`#${id} .sketch-frame`).getBoundingClientRect(); return [g.left - f.left, g.top - f.top]; }, found);
  await p.evaluate(() => window.scrollBy({ top: 30, behavior: 'instant' }));
  await wait(120);
  const after = await p.evaluate((id) => { const g = document.querySelector('.site-header .guide').getBoundingClientRect(); const f = document.querySelector(`#${id} .sketch-frame`).getBoundingClientRect(); return [g.left - f.left, g.top - f.top]; }, found);
  log.push({ name: 'follows-bread', before, after });
  await snap('scene-c', 900);
  await snap('hidden', 3200);
  await p.evaluate(() => { const el = document.getElementById('story'); window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 100, behavior: 'instant' }); });
  await snap('peek', 900);
  await snap('home', 2800);
  R.tablet = log;
  await p.close();
}

/* ---------- phone ---------- */
{
  const p = await page(390, 844);
  const st = () => p.evaluate(() => ({ away: document.documentElement.classList.contains('peek-away'), peek: document.querySelector('.peek-svg').dataset.peek, t: getComputedStyle(document.querySelector('.peek-svg')).transform }));
  const clip = async () => ({ x: 150, y: await p.evaluate(() => scrollY), width: 240, height: 64 });
  const log = [];
  const snap = async (name, ms, full = false) => { if (ms) await wait(ms); log.push({ name, ...(await st()) }); await p.screenshot({ path: path.join(OUT, `phone-${name}.png`), ...(full ? {} : { clip: await clip() }) }); };
  await p.evaluate(() => window.scrollTo({ top: 140, behavior: 'instant' }));
  await snap('wave', 450);
  await snap('ducked', 1900);
  let found = null;
  for (const id of APPROVED) {
    await centerOn(p, id, 0.32);
    await wait(900);
    const s = await st();
    if (!s.away) { found = id; break; }
  }
  log.push({ name: 'scene', found });
  await snap('points', 400);
  await snap('wink', 1000, true);
  await snap('after', 1500);
  R.phone = log;
  await p.close();
}

await browser.close();
await fs.writeFile(path.join(OUT, 'mascot-touch.json'), JSON.stringify(R, null, 2));
console.log(JSON.stringify(R, null, 1));

process.exit(0);
