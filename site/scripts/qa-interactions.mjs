/*
  Interaction QA (puppeteer-core + local Chrome). Usage:
    node scripts/qa-interactions.mjs [--base http://127.0.0.1:4174] [--out qa/interactions]
  Checks: guide pointer-follow + nav reactions, reverse scroll through the pinned menu,
  live resize without reload, keyboard focus + skip link, mobile index sheet (focus trap,
  Escape, focus return), and that the guide's rAF loop stops when idle.
*/
import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import path from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => a.startsWith('--') ? [a.slice(2), arr[i + 1]] : null).filter(Boolean));
const BASE = args.base || 'http://127.0.0.1:4174';
const OUT = path.resolve(args.out || 'qa/interactions');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await fs.mkdir(OUT, { recursive: true });
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--hide-scrollbars'] });
const results = {};
const errors = [];
const snap = (page, name, clip) => page.screenshot({ path: path.join(OUT, name + '.png'), clip });

/* ---------- desktop ---------- */
{
  const page = await browser.newPage();
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(BASE + '/', { waitUntil: 'networkidle0' });
  await wait(2800);
  const guideClip = async () => {
    const r = await page.$eval('.site-header .guide', (g) => { const b = g.getBoundingClientRect(); return { x: Math.max(0, b.x - 60), y: 0, width: b.width + 120, height: b.bottom + 30 }; });
    return r;
  };
  const guideState = () => page.$eval('.site-header .guide', (g) => ({
    pose: g.querySelector('svg').dataset.pose,
    eyes: g.querySelector('[data-part="eyes"]').getAttribute('transform'),
    roll: g.querySelector('[data-part="roll"]').getAttribute('transform'),
    lean: g.querySelector('[data-part="lean"]').getAttribute('transform'),
    active: g.dataset.animationActive,
    mode: g.dataset.mode,
    x: Math.round(g.getBoundingClientRect().x)
  }));

  // pointer follow: far left, then far right
  await page.mouse.move(80, 600, { steps: 8 }); await wait(700);
  const left = await guideState();
  await snap(page, 'd-follow-left', await guideClip());
  await page.mouse.move(1380, 160, { steps: 8 }); await wait(700);
  const right = await guideState();
  await snap(page, 'd-follow-right', await guideClip());
  // leave the window → neutral
  await page.mouse.move(-10, -10); await page.evaluate(() => document.dispatchEvent(new MouseEvent('mouseout', { relatedTarget: null, bubbles: true }))); await wait(1400);
  const leave = await guideState();
  results.follow = { left, right, afterLeave: leave };

  // nav reactions (hover each item)
  results.reactions = {};
  for (const id of ['menu', 'story', 'media', 'visit']) {
    const box = await page.$eval(`[data-nav="${id}"]`, (a) => { const r = a.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
    await page.mouse.move(box.x, box.y, { steps: 4 });
    await wait(id === 'story' ? 300 : 1400);
    results.reactions[id] = await guideState();
    await snap(page, `d-react-${id}`, await guideClip());
  }
  await page.mouse.move(700, 600); await wait(1400);
  results.afterHover = await guideState();

  // idle: rAF loop should stop once settled
  await wait(8000);
  results.idle = await guideState();

  // reverse scroll through the pinned menu: state at p=.12 before and after visiting p=.95
  const pin = await page.evaluate(() => { const sp = document.querySelector('#menu .pin-spacer'); const h = document.querySelector('.site-header').offsetHeight; return sp ? { start: sp.getBoundingClientRect().top + scrollY - h, len: sp.offsetHeight - sp.firstElementChild.offsetHeight } : null; });
  const figState = () => page.$eval('#menu-salt-bread .sketch', (f) => ({ draw: f.style.getPropertyValue('--draw'), ep: f.style.getPropertyValue('--ep'), shaded: getComputedStyle(f.querySelector('.layer-shaded')).opacity }));
  if (pin) {
    const to = async (p) => { await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), pin.start + pin.len * p); await wait(1500); };
    await to(0.12 / 6); const a = await figState();
    await to(0.95 / 6); const b = await figState();
    await to(2.5 / 6);
    await to(0.12 / 6); const c = await figState();
    await snap(page, 'd-reverse-back-to-draw');
    results.reverse = { first: a, resolved: b, back: c, reversesExactly: a.draw === c.draw && a.ep === c.ep };
  }

  // live resize without reload: 1440 → 900 → 1440
  await page.evaluate(() => window.scrollTo(0, 0)); await wait(800);
  await page.setViewport({ width: 900, height: 900 }); await wait(1500);
  const mid = await page.evaluate(() => ({ docW: document.documentElement.scrollWidth, vw: innerWidth, pinned: document.getElementById('menu').classList.contains('is-pinned'), spacer: !!document.querySelector('#menu .pin-spacer') }));
  await snap(page, 'd-resized-900');
  await page.setViewport({ width: 1440, height: 900 }); await wait(1500);
  const back = await page.evaluate(() => ({ docW: document.documentElement.scrollWidth, vw: innerWidth, pinned: document.getElementById('menu').classList.contains('is-pinned'), spacers: document.querySelectorAll('.pin-spacer').length }));
  results.resize = { at900: mid, backTo1440: back };

  // keyboard: first Tab shows the skip link; Enter moves focus to main
  await page.goto(BASE + '/', { waitUntil: 'networkidle0' }); await wait(1500);
  await page.keyboard.press('Tab'); await wait(400);
  const skip = await page.evaluate(() => ({ active: document.activeElement?.className, visible: document.activeElement?.getBoundingClientRect().top >= 0 }));
  await snap(page, 'd-kbd-skip', { x: 0, y: 0, width: 600, height: 120 });
  const order = [];
  for (let i = 0; i < 9; i++) { await page.keyboard.press('Tab'); order.push(await page.evaluate(() => (document.activeElement?.textContent || document.activeElement?.getAttribute('aria-label') || '').trim().slice(0, 28))); }
  const ring = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle + ' ' + getComputedStyle(document.activeElement).outlineWidth);
  await snap(page, 'd-kbd-focus');
  results.keyboard = { skip, order, focusRing: ring };
  await page.close();
}

/* ---------- anchor jumps land under the header (desktop, tablet touch, mobile) ---------- */
results.jumps = {};
for (const vp of [{ width: 1440, height: 900 }, { width: 768, height: 1024, isMobile: true, hasTouch: true }, { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }]) {
  const page = await browser.newPage();
  await page.setViewport(vp);
  await page.goto(BASE + '/', { waitUntil: 'networkidle0' });
  await wait(1800);
  const out = [];
  const clickAndMeasure = async (selector, target) => {
    await page.evaluate((sel) => document.querySelector(sel)?.click(), selector);
    await wait(2600);
    return page.evaluate((t) => {
      const h = document.querySelector('.site-header').offsetHeight;
      const shelf = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--shelf-h')) || 0;
      const top = Math.round(document.getElementById(t).getBoundingClientRect().top);
      return { target: t, top, expected: h + shelf + 12, active: document.documentElement.dataset.section };
    }, target);
  };
  const navSel = vp.width >= 768 ? (id) => `.nav-link[data-nav="${id}"]` : (id) => `.quick-links a[href="#${id}"]`;
  for (const id of vp.width >= 768 ? ['visit', 'story', 'menu', 'media'] : ['visit', 'menu']) out.push(await clickAndMeasure(navSel(id), id));
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await wait(600);
  out.push(await clickAndMeasure('.opening-actions .btn-secondary', 'visit'));
  results.jumps[vp.width] = out.map((o) => ({ ...o, ok: Math.abs(o.top - o.expected) <= 3 && o.active === o.target }));
  await page.close();
}

/* ---------- mobile sheet ---------- */
{
  const page = await browser.newPage();
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(BASE + '/', { waitUntil: 'networkidle0' }); await wait(1800);
  const toggleBox = await page.$eval('.index-toggle', (b) => { const r = b.getBoundingClientRect(); return { w: r.width, h: r.height }; });
  await page.tap('.index-toggle'); await wait(500);
  const open = await page.evaluate(() => ({ expanded: document.querySelector('.index-toggle').getAttribute('aria-expanded'), dialog: !document.getElementById('site-index').hidden, mainInert: document.getElementById('main').hasAttribute('inert'), focus: document.activeElement?.textContent?.trim() }));
  await snap(page, 'm-sheet-open');
  const trap = [];
  for (let i = 0; i < 8; i++) { await page.keyboard.press('Tab'); trap.push(await page.evaluate(() => !!document.activeElement?.closest('#site-index'))); }
  await page.keyboard.press('Escape'); await wait(400);
  const closed = await page.evaluate(() => ({ expanded: document.querySelector('.index-toggle').getAttribute('aria-expanded'), hidden: document.getElementById('site-index').hidden, focusOnToggle: document.activeElement?.classList.contains('index-toggle'), mainInert: document.getElementById('main').hasAttribute('inert') }));
  // link inside the sheet closes it and scrolls to the section
  await page.tap('.index-toggle'); await wait(400);
  await page.evaluate(() => [...document.querySelectorAll('.sheet-list a')].find((a) => a.textContent === 'Visit').click()); await wait(3200);
  const nav = await page.evaluate(() => ({ hidden: document.getElementById('site-index').hidden, visitTop: Math.round(document.getElementById('visit').getBoundingClientRect().top) }));
  await snap(page, 'm-after-sheet-link');
  results.sheet = { toggleBox, open, focusStaysInside: trap.every(Boolean), closed, linkNavigates: nav };
  await page.close();
}

await browser.close();
results.errors = errors;
await fs.writeFile(path.join(OUT, 'interactions.json'), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 1));
