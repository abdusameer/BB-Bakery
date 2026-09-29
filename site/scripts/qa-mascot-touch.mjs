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
const BREADS = ['menu-salt-bread', 'menu-garlic-cream-cheese', 'menu-cranberry-cream-cheese', 'menu-twisted-doughnut', 'menu-croissant-sandwich'];
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
  const shown = [];
  for (const id of BREADS) {
    await centerOn(p, id);
    let appeared = false;
    const t0 = Date.now();
    while (Date.now() - t0 < 3000) { if ((await g()).vis !== 'hidden') { appeared = true; break; } await wait(80); }
    if (appeared && id === BREADS[0]) {
      // mid-scene the page scrolls a little: he stays with the bread (same offset from it)
      await wait(1800);
      await p.screenshot({ path: path.join(OUT, 'tablet-present.png') });
      const rel = () => p.evaluate((id) => { const g = document.querySelector('.site-header .guide').getBoundingClientRect(); const f = document.querySelector(`#${id} .sketch-frame`).getBoundingClientRect(); return [Math.round(g.left - f.left), Math.round(g.top - f.top)]; }, id);
      const before = await rel();
      await p.evaluate(() => window.scrollBy({ top: 30, behavior: 'instant' }));
      await wait(120);
      log.push({ name: 'follows-bread', before, after: await rel() });
    }
    const t1 = Date.now();
    while (appeared && Date.now() - t1 < 9000) { if ((await g()).vis === 'hidden') break; await wait(100); }
    shown.push({ id, appeared });
  }
  log.push({ name: 'breads', shown });
  await snap('hidden', 600);
  await p.evaluate(() => { const el = document.getElementById('story'); window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 100, behavior: 'instant' }); });
  await snap('peek', 900);
  await snap('home', 2800);
  // Visit map walk and the footer goodbye
  await p.evaluate(() => { const m = document.querySelector('.visit-map svg'); const r = m.getBoundingClientRect(); window.scrollTo({ top: r.top + scrollY - (innerHeight * 0.4 - r.height / 2), behavior: 'instant' }); });
  { let ok = false; const t0 = Date.now(); while (Date.now() - t0 < 5000) { const s = await g(); if (s.vis !== 'hidden' && s.pose === 'present') { ok = true; break; } await wait(80); } log.push({ name: 'map-scene', ok }); }
  await snap('map', 2300);
  await wait(3500);
  await p.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  { let ok = false; const t0 = Date.now(); while (Date.now() - t0 < 6000) { const s = await g(); if (s.vis !== 'hidden' && (s.pose || '').startsWith('ledge')) { ok = true; break; } await wait(80); } log.push({ name: 'footer-scene', ok }); }
  await snap('ledge', 1900);
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
  const seen = [];
  for (const id of BREADS) {
    await centerOn(p, id, 0.32);
    const rec = { id, popped: false, pointed: false, winked: false };
    const t0 = Date.now();
    while (Date.now() - t0 < 2800) {
      const s = await p.evaluate(() => ({ away: document.documentElement.classList.contains('peek-away'), peek: document.querySelector('.peek-svg').dataset.peek,
        hands: [...document.querySelectorAll('.peek-svg [data-part^="peek-hand"]')].map((h) => h.getAttribute('transform') || '') }));
      if (!s.away) rec.popped = true;
      if (s.hands.some((t) => /rotate|matrix/.test(t) && !/^matrix\(1,0,0,1,0,0\)$/.test(t.replace(/\s/g, '')))) rec.pointed = true;
      if (s.peek === 'wink') rec.winked = true;
      await wait(90);
    }
    if (id === BREADS[4]) await p.screenshot({ path: path.join(OUT, 'phone-last.png') });
    seen.push(rec);
  }
  log.push({ name: 'breads', seen });
  // footer goodbye: the Visit croissant waves if it is on screen, otherwise the header peek pops up and waves
  await p.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  {
    const rec = { peekBye: false, visitWave: false };
    const t0 = Date.now();
    while (Date.now() - t0 < 3000) {
      const s = await p.evaluate(() => ({ bye: document.documentElement.classList.contains('peek-bye'), vg: document.querySelector('.visit-guide .guide-svg')?.dataset.pose }));
      if (s.bye) rec.peekBye = true;
      if (s.vg === 'wave') rec.visitWave = true;
      if (rec.peekBye && !rec.shot) { await p.screenshot({ path: path.join(OUT, 'phone-bye.png'), clip: await clip() }); rec.shot = true; }
      await wait(90);
    }
    log.push({ name: 'goodbye', ...rec });
  }
  R.phone = log;
  await p.close();
}

await browser.close();
await fs.writeFile(path.join(OUT, 'mascot-touch.json'), JSON.stringify(R, null, 2));
console.log(JSON.stringify(R, null, 1));

process.exit(0);
