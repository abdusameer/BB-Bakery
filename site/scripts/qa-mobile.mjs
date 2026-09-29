/*
  Mobile interaction QA (touch emulation via puppeteer-core + local Chrome).
    node scripts/qa-mobile.mjs [--base http://127.0.0.1:4174] [--out qa/mobile]
  Checks: on phones the real croissant (not the old peek) leans on the header rule; his eyes follow a
  finger and let go; they watch the page scroll; "Sketch" toggle + press-and-hold on a menu picture;
  the tablet rig follows a finger. (The scroll scenes are covered by qa-mascot.mjs at any size.)
*/
import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import path from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => a.startsWith('--') ? [a.slice(2), arr[i + 1]] : null).filter(Boolean));
const BASE = args.base || 'http://127.0.0.1:4174';
const OUT = path.resolve(args.out || 'qa/mobile');
await fs.mkdir(OUT, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--hide-scrollbars'] });
const R = { errors: [] };

/* ---------- phone 390 ---------- */
{
  const p = await browser.newPage();
  p.on('pageerror', (e) => R.errors.push(String(e)));
  p.on('console', (m) => { if (m.type() === 'error') R.errors.push(m.text()); });
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' });
  await wait(2200);
  // the real croissant (not the old peek) leans on the header rule
  const rig = () => p.evaluate(() => {
    const w = document.querySelector('.site-header .guide'), s = w.querySelector('.guide-svg');
    const q = (n) => s.querySelector(`[data-part="${n}"]`);
    return { display: getComputedStyle(w).display, vis: getComputedStyle(w).visibility, pose: s.dataset.pose, eyes: q('eyes').getAttribute('transform'), lean: q('lean').getAttribute('transform'),
      peekSvg: getComputedStyle(document.querySelector('.peek svg')).visibility, visitGuide: getComputedStyle(document.querySelector('.visit-guide')).display };
  });
  const headerClip = async () => ({ x: 170, y: await p.evaluate(() => window.scrollY), width: 220, height: 64 });
  R.home = await rig();
  await p.screenshot({ path: path.join(OUT, 'rig-home.png'), clip: await headerClip() });

  // finger to the left, then across to the right (horizontal, so the page doesn't scroll), then let go
  await p.touchscreen.touchStart(40, 420); await wait(500);
  const left = await rig();
  await p.touchscreen.touchMove(370, 420); await wait(500);
  const right = await rig();
  await p.screenshot({ path: path.join(OUT, 'rig-finger-right.png'), clip: await headerClip() });
  await p.touchscreen.touchEnd(); await wait(1600);
  R.fingerFollow = { left, right, released: await rig() };

  // watching the page: small scrolls (under the 48 px that wakes him) move his eyes
  await p.evaluate(async () => { for (let i = 0; i < 7; i++) { window.scrollBy({ top: 5, behavior: 'instant' }); await new Promise((r) => requestAnimationFrame(r)); } });
  const scrolling = await rig();
  await wait(1500);
  R.scrollWatch = { whileScrolling: scrolling, settled: await rig() };
  await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await wait(600);
  const toSection = async (id) => p.evaluate((i) => { const el = document.getElementById(i); window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 60, behavior: 'instant' }); }, id);

  // Sketch toggle on the first menu item
  await toSection('menu-salt-bread'); await wait(2200);
  const btn = await p.$('#menu-salt-bread .sketch-toggle');
  const box = await btn.boundingBox();
  await p.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2); await wait(600);
  const on = await p.$eval('#menu-salt-bread', (li) => ({ cls: li.querySelector('.sketch').className, pressed: li.querySelector('.sketch-toggle').getAttribute('aria-pressed'), label: li.querySelector('.sketch-toggle').textContent }));
  await p.screenshot({ path: path.join(OUT, 'sketch-toggle-on.png') });
  await p.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2); await wait(600);
  const off = await p.$eval('#menu-salt-bread .sketch', (f) => f.className);
  // press-and-hold on the picture
  const fr = await (await p.$('#menu-salt-bread .sketch-frame')).boundingBox();
  await p.touchscreen.touchStart(fr.x + fr.width / 2, fr.y + fr.height / 2); await wait(650);
  const holding = await p.$eval('#menu-salt-bread .sketch', (f) => f.className);
  await p.screenshot({ path: path.join(OUT, 'sketch-hold.png') });
  await p.touchscreen.touchEnd(); await wait(500);
  const afterHold = await p.$eval('#menu-salt-bread .sketch', (f) => f.className);
  R.sketch = { toggleBox: { w: Math.round(box.width), h: Math.round(box.height) }, on, off, holding, afterHold };
  await p.close();
}

/* ---------- tablet 768 (touch) ---------- */
{
  const p = await browser.newPage();
  p.on('pageerror', (e) => R.errors.push(String(e)));
  await p.setViewport({ width: 768, height: 1024, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' });
  await wait(2200);
  const g = () => p.$eval('.site-header .guide', (w) => ({ eyes: w.querySelector('[data-part="eyes"]').getAttribute('transform'), roll: w.querySelector('[data-part="roll"]').getAttribute('transform'), lean: w.querySelector('[data-part="lean"]').getAttribute('transform') }));
  await p.touchscreen.touchStart(700, 900); await wait(700);
  const fingerRight = await g();
  await p.screenshot({ path: path.join(OUT, 'tablet-finger-right.png'), clip: { x: 0, y: 0, width: 768, height: 220 } });
  await p.touchscreen.touchMove(40, 600); await wait(700);
  const fingerLeft = await g();
  await p.touchscreen.touchEnd(); await wait(1800);
  R.tablet = { fingerRight, fingerLeft, released: await g() };
  await p.close();
}

await browser.close();
await fs.writeFile(path.join(OUT, 'mobile.json'), JSON.stringify(R, null, 2));
console.log(JSON.stringify(R, null, 1));

process.exit(0);
