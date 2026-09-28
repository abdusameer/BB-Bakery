/*
  Mobile interaction QA (touch emulation via puppeteer-core + local Chrome).
    node scripts/qa-mobile.mjs [--base http://127.0.0.1:4174] [--out qa/mobile]
  Checks: peek follows a finger and releases; watches scrolling; section reactions;
  "Sketch" toggle + press-and-hold on a menu picture; tablet rig follows a finger.
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
  const peek = () => p.evaluate(() => {
    const s = document.querySelector('.peek-svg'); const q = (n) => s.querySelector(`[data-part="${n}"]`);
    return { eyes: q('peek-eyes').getAttribute('transform'), body: q('peek-body').getAttribute('transform'), move: q('peek-move').getAttribute('transform') || getComputedStyle(q('peek-move')).transform, peek: s.dataset.peek, active: s.dataset.animationActive };
  });
  const headerClip = async () => ({ x: 170, y: await p.evaluate(() => window.scrollY), width: 220, height: 64 });

  // finger to the lower left, drag to the right
  await p.touchscreen.touchStart(40, 700); await wait(500);
  const left = await peek();
  await p.screenshot({ path: path.join(OUT, 'peek-finger-left.png'), clip: await headerClip() });
  await p.touchscreen.touchMove(370, 300); await wait(500);
  const right = await peek();
  await p.screenshot({ path: path.join(OUT, 'peek-finger-right.png'), clip: await headerClip() });
  await p.touchscreen.touchEnd(); await wait(1600);
  const released = await peek();
  R.peekFollow = { left, right, released };

  // watching the scroll: quick scroll down, sample mid-motion
  await p.evaluate(async () => { for (let i = 0; i < 8; i++) { window.scrollBy({ top: 60, behavior: 'instant' }); await new Promise((r) => requestAnimationFrame(r)); } });
  const scrolling = await peek();
  await wait(1500);
  R.peekScroll = { whileScrolling: scrolling, settled: await peek() };

  // section reactions: menu (nod) and media (wink + flash)
  const toSection = async (id) => p.evaluate((i) => { const el = document.getElementById(i); window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 60, behavior: 'instant' }); }, id);
  await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await wait(900);
  await toSection('menu'); await wait(250);
  const menuReact = await peek();
  await p.screenshot({ path: path.join(OUT, 'peek-menu-react.png'), clip: await headerClip() });
  await wait(1400);
  await toSection('media'); await wait(350);
  const mediaReact = await peek();
  await p.screenshot({ path: path.join(OUT, 'peek-media-react.png'), clip: await headerClip() });
  await wait(1500);
  R.peekReactions = { menu: menuReact, media: mediaReact, after: await peek() };

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
