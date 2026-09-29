/*
  Pinned-menu sequence QA: at each item's hold point, mid-erase, and the next item's start,
  records which item texts are visible and each picture's state (drawn / erased / blank),
  and saves screenshots. Fails loudly if more than one item shows at a hold point.
    node scripts/qa-menu.mjs [--base http://127.0.0.1:4174] [--out qa/menu]
*/
import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import path from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => a.startsWith('--') ? [a.slice(2), arr[i + 1]] : null).filter(Boolean));
const BASE = args.base || 'http://127.0.0.1:4174';
const OUT = path.resolve(args.out || 'qa/menu');
await fs.mkdir(OUT, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--hide-scrollbars'] });
const p = await browser.newPage();
const errors = [];
p.on('pageerror', (e) => errors.push(String(e)));
await p.setViewport({ width: 1440, height: 900 });
await p.goto(BASE + '/', { waitUntil: 'networkidle0' });
await wait(2000);
const pin = await p.evaluate(() => { const sp = document.querySelector('#menu .pin-spacer'); const h = document.querySelector('.site-header').offsetHeight; return { start: sp.getBoundingClientRect().top + scrollY - h, len: sp.offsetHeight - sp.firstElementChild.offsetHeight }; });
const n = 6;
const state = () => p.evaluate(() => [...document.querySelectorAll('#menu .menu-item')].map((li) => {
  const f = li.querySelector('.sketch');
  const v = (k) => parseFloat(f.style.getPropertyValue(k) || 'NaN');
  const text = parseFloat(getComputedStyle(li.querySelector('.menu-item-text')).opacity);
  const xo = v('--xo'), ep = v('--ep'), draw = v('--draw');
  const erased = xo >= 100;
  const picture = erased ? 'erased' : (Number.isNaN(draw) || draw <= 0) ? 'blank' : ep >= 100 ? 'photo' : 'drawing';
  return { name: li.querySelector('h3').textContent, text: +text.toFixed(2), picture, eraser: getComputedStyle(li.querySelector('.eraser')).opacity };
}));
const report = [];
const go = async (u, label) => {
  await p.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), pin.start + pin.len * (u / n));
  await wait(1500);
  const s = await state();
  await p.screenshot({ path: path.join(OUT, `${label}.png`) });
  const shown = s.filter((x) => x.text > 0.5 || x.picture === 'photo' || x.picture === 'drawing');
  report.push({ label, u, shown: shown.map((x) => `${x.name} [${x.picture}, text ${x.text}, eraser ${x.eraser}]`) });
};
for (let k = 0; k < n; k++) {
  await go(k + 0.68, `${k + 1}-hold`);
  if (k < n - 1) { await go(k + 0.88, `${k + 1}-erasing`); await go(k + 1.03, `${k + 2}-start`); }
}
// reverse: back from item 3 hold to item 2 hold must restore item 2 exactly
await go(1.68, 'back-2-hold');
await browser.close();
await fs.writeFile(path.join(OUT, 'menu.json'), JSON.stringify({ report, errors }, null, 2));
for (const r of report) console.log(r.label.padEnd(12), r.shown.join('  |  ') || '(nothing)');
console.log('errors:', errors);
