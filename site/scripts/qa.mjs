/*
  QA harness: drives the local Google Chrome (puppeteer-core) against a running server.
    node scripts/qa.mjs [--base http://127.0.0.1:4174] [--out qa/run] [--widths 1440,1024] [--reduced] [--nojs]
  For each viewport it captures the opening and every section (the pinned menu at three
  scrub points on desktop), and reports: horizontal overflow, console errors, failed
  requests, missing images, and whether the guide overlaps the nav labels.
*/
import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import path from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => a.startsWith('--') ? [a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true] : null).filter(Boolean));
const BASE = args.base || 'http://127.0.0.1:4174';
const OUT = path.resolve(args.out || 'qa/run');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const VIEWPORTS = {
  1440: { width: 1440, height: 900 },
  1280: { width: 1280, height: 800 },
  1024: { width: 1024, height: 768 },
  768: { width: 768, height: 1024, isMobile: true, hasTouch: true },
  430: { width: 430, height: 932, isMobile: true, hasTouch: true },
  390: { width: 390, height: 844, isMobile: true, hasTouch: true },
  360: { width: 360, height: 780, isMobile: true, hasTouch: true }
};
const widths = String(args.widths || '1440,1280,1024,768,430,390,360').split(',').map(Number);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

await fs.mkdir(OUT, { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--hide-scrollbars', '--force-color-profile=srgb'] });
const report = [];

for (const w of widths) {
  const vp = VIEWPORTS[w];
  const page = await browser.newPage();
  const errors = [], failed = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('requestfailed', (r) => failed.push(r.url()));
  page.on('response', (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });
  if (args.nojs) await page.setJavaScriptEnabled(false);
  await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: vp.isMobile ? 2 : 1, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch });
  if (vp.isMobile) await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1');
  if (args.reduced) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.goto(BASE + '/', { waitUntil: 'networkidle0' });
  await wait(2600);
  const tag = `${w}${args.reduced ? '-reduced' : ''}${args.nojs ? '-nojs' : ''}`;
  const shots = [];
  const shot = async (name) => { const f = path.join(OUT, `${tag}-${name}.png`); await page.screenshot({ path: f }); shots.push(path.basename(f)); };

  await shot('01-opening');

  // Scroll helper that works with and without Lenis.
  const scrollToY = async (y) => { await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y); await wait(1500); };
  const sectionY = (id) => page.evaluate((i) => { const el = document.getElementById(i); const h = document.querySelector('.site-header')?.offsetHeight ?? 0; return el.getBoundingClientRect().top + scrollY - h; }, id);

  const pinInfo = await page.evaluate(() => {
    const sp = document.querySelector('#menu .pin-spacer');
    if (!sp) return null;
    const h = document.querySelector('.site-header')?.offsetHeight ?? 0;
    const start = sp.getBoundingClientRect().top + scrollY - h;
    return { start, len: sp.offsetHeight - sp.firstElementChild.offsetHeight };
  });
  if (pinInfo) {
    for (const [p, name] of [[0.12 / 6, '02-menu-draw'], [0.55 / 6, '03-menu-graphite'], [0.95 / 6, '04-menu-photo'], [3.95 / 6, '05-menu-item4']]) {
      await scrollToY(pinInfo.start + pinInfo.len * p);
      await shot(name);
    }
  } else {
    await scrollToY(await sectionY('menu'));
    await shot('02-menu');
    const fig = await page.evaluate(() => { const f = document.querySelector('#menu-salt-bread .sketch'); return f.getBoundingClientRect().top + scrollY; });
    await scrollToY(fig - vp.height * 0.2);
    await shot('03-menu-item1');
  }
  for (const [id, n] of [['story', '06-story'], ['media', '07-media'], ['visit', '08-visit']]) {
    await scrollToY(await sectionY(id));
    await shot(n);
  }
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await wait(1200);
  await shot('09-footer');

  const metrics = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const docW = document.documentElement.scrollWidth;
    const imgs = [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.loading !== 'lazy').map((i) => i.src);
    const g = document.querySelector('.site-header .guide');
    let overlap = null;
    if (g && getComputedStyle(g).display !== 'none') {
      const gr = g.getBoundingClientRect();
      overlap = [...document.querySelectorAll('.nav-link, .header-directions')].some((a) => { const r = a.getBoundingClientRect(); return r.right > gr.left && r.left < gr.right && r.bottom > gr.top + 12 && r.top < gr.bottom; });
    }
    return { vw, docW, overflow: docW > vw, brokenImages: imgs, guideOverlapsNav: overlap, h1: document.querySelectorAll('h1').length, robots: document.querySelector('meta[name=robots]')?.content };
  });
  report.push({ viewport: tag, ...metrics, consoleErrors: errors, failedRequests: failed, shots });
  console.log(tag, JSON.stringify({ overflow: metrics.overflow, docW: metrics.docW, errors: errors.length, failed: failed.length, guideOverlapsNav: metrics.guideOverlapsNav }));
  await page.close();
}
await browser.close();
await fs.writeFile(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
console.log('report →', path.join(OUT, 'report.json'));
