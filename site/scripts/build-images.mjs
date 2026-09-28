/*
  Image pipeline for the concept site.
  - White-points every image so its paper background maps to #FFFFFF. With
    mix-blend-mode: multiply the picture then melts into the page paper (no rectangle).
  - Measures the subject's bounding box in the photo and in both drawings, and aligns the
    drawings to the photo (scale + translate) so the sketch → photo transition registers.
  - Exports responsive AVIF + WebP photos, WebP drawings, a seamless paper tile, and
    writes src/generated/images.ts (sizes, focal points, alignment report).
  Sources: assets-src/generated/*.png (Higgsfield concept media, see ASSET-MANIFEST.md).
*/
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'assets-src/generated');
const OUT = path.join(root, 'public/img');
const GEN = path.join(root, 'src/generated');

const ITEMS = [
  { id: 'hero-loaf', ar: [1, 1], photo: 'p1-11-hero-loaf-photo', outline: 'p1-21-hero-loaf-outline', shaded: 'p1-22-hero-loaf-shaded', widths: [700, 1100, 1500], lineFinal: 0.16 },
  { id: 'salt-bread', ar: [4, 5], photo: 'p0-03-salt-bread-photo', outline: 'p0-09-salt-bread-outline', shaded: 'p0-10-salt-bread-shaded', widths: [600, 1000, 1400], lineFinal: 0.16 },
  { id: 'garlic-cc', ar: [4, 5], photo: 'p1-12-garlic-cc-photo', outline: 'p1-23-garlic-cc-outline', shaded: 'p1-24-garlic-cc-shaded', widths: [600, 1000, 1400], lineFinal: 0.14 },
  { id: 'cranberry-cc', ar: [4, 5], photo: 'p1-13-cranberry-cc-photo', outline: 'p1-25-cranberry-cc-outline', shaded: 'p1-26-cranberry-cc-shaded', widths: [600, 1000, 1400], lineFinal: 0.12 },
  { id: 'twist-doughnut', ar: [4, 5], photo: 'p1-14-twist-doughnut-photo', outline: 'p1-27-twist-doughnut-outline', shaded: 'p1-28-twist-doughnut-shaded', widths: [600, 1000, 1400], lineFinal: 0.1 },
  { id: 'croissant-sandwich', ar: [4, 5], photo: 'p1-15-croissant-sandwich-photo', outline: 'p1-29-croissant-sandwich-outline', shaded: 'p1-30-croissant-sandwich-shaded', widths: [600, 1000, 1400], lineFinal: 0 },
  { id: 'sesame-latte', ar: [4, 5], photo: 'p1-16-sesame-latte-photo', outline: 'p1-31-sesame-latte-outline', shaded: 'p1-32-sesame-latte-shaded', widths: [600, 1000, 1400], lineFinal: 0.14 }
];

/** median paper colour sampled from a 4% border ring */
async function paperColor(img) {
  const { data, info } = await img.clone().resize(200, null, { fit: 'inside' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const ring = Math.max(3, Math.round(w * 0.04));
  const ch = [[], [], []];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (x > ring && x < w - ring && y > ring && y < h - ring) continue;
    const i = (y * w + x) * 3;
    ch[0].push(data[i]); ch[1].push(data[i + 1]); ch[2].push(data[i + 2]);
  }
  return ch.map((a) => { a.sort((p, q) => p - q); return a[Math.floor(a.length * 0.3)]; });
}

async function whitePoint(file, headroom = 0.955) {
  const img = sharp(path.join(SRC, file + '.png')).removeAlpha();
  const paper = await paperColor(img);
  // Map (paper × headroom) → 255 so every tone within a few % of the paper becomes pure white.
  const mult = paper.map((c) => Math.min(1.6, 255 / Math.max(1, c * headroom)));
  return { img: img.linear(mult, [0, 0, 0]), paper, meta: await sharp(path.join(SRC, file + '.png')).metadata() };
}

/** subject bounding box (px, in source resolution) from a white-pointed image */
async function bbox(img, W, threshold) {
  const scale = 256 / W;
  const { data, info } = await img.clone().resize(256, null).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const xs = [], ys = [];
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    const i = (y * info.width + x) * 3;
    const dark = 255 - Math.min(data[i], data[i + 1], data[i + 2]);
    if (dark > threshold) { xs.push(x); ys.push(y); }
  }
  xs.sort((a, b) => a - b); ys.sort((a, b) => a - b);
  const q = (a, f) => a[Math.min(a.length - 1, Math.max(0, Math.floor(f * (a.length - 1))))];
  const b = { x0: q(xs, 0.004) / scale, y0: q(ys, 0.004) / scale, x1: q(xs, 0.996) / scale, y1: q(ys, 0.996) / scale };
  return { ...b, w: b.x1 - b.x0, h: b.y1 - b.y0, cx: (b.x0 + b.x1) / 2, cy: (b.y0 + b.y1) / 2, n: xs.length };
}

/** grayscale edge map (Sobel magnitude) at a given width */
async function edges(buf, w) {
  const { data, info } = await sharp(buf).resize(w, null).greyscale().blur(1.1).raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, E = new Float32Array(W * H);
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x;
    const gx = -data[i - W - 1] - 2 * data[i - 1] - data[i + W - 1] + data[i - W + 1] + 2 * data[i + 1] + data[i + W + 1];
    const gy = -data[i - W - 1] - 2 * data[i - W] - data[i - W + 1] + data[i + W - 1] + 2 * data[i + W] + data[i + W + 1];
    E[i] = Math.abs(gx) + Math.abs(gy);
  }
  return { E, W, H };
}

/** normalized cross-correlation of photo edges vs drawing edges under (s, dx, dy) */
function ncc(P, D, s, dx, dy) {
  let ab = 0, aa = 0, bb = 0;
  for (let y = 2; y < P.H - 2; y += 1) {
    const sy = Math.round((y - dy) / s); if (sy < 1 || sy >= D.H - 1) continue;
    for (let x = 2; x < P.W - 2; x += 1) {
      const sx = Math.round((x - dx) / s); if (sx < 1 || sx >= D.W - 1) continue;
      const a = P.E[y * P.W + x], b = D.E[sy * D.W + sx];
      ab += a * b; aa += a * a; bb += b * b;
    }
  }
  return aa && bb ? ab / Math.sqrt(aa * bb) : 0;
}

/** find the scale/offset that best registers the drawing onto the photo, then apply it */
async function alignTo(drawBuf, photoBuf, W, H) {
  const P1 = await edges(photoBuf, 160), D1 = await edges(drawBuf, 160);
  let best = { v: -1, s: 1, dx: 0, dy: 0 };
  for (let s = 0.82; s <= 1.2001; s += 0.02)
    for (let dx = -26; dx <= 26; dx += 2)
      for (let dy = -26; dy <= 26; dy += 2) {
        const v = ncc(P1, D1, s, dx - (s - 1) * P1.W / 2, dy - (s - 1) * P1.H / 2);
        if (v > best.v) best = { v, s, dx, dy };
      }
  // refine at double resolution
  const P2 = await edges(photoBuf, 320), D2 = await edges(drawBuf, 320);
  let fine = { v: -1, s: best.s, dx: best.dx * 2, dy: best.dy * 2 };
  for (let s = best.s - 0.02; s <= best.s + 0.0201; s += 0.005)
    for (let dx = best.dx * 2 - 4; dx <= best.dx * 2 + 4; dx += 1)
      for (let dy = best.dy * 2 - 4; dy <= best.dy * 2 + 4; dy += 1) {
        const v = ncc(P2, D2, s, dx - (s - 1) * P2.W / 2, dy - (s - 1) * P2.H / 2);
        if (v > fine.v) fine = { v, s, dx, dy };
      }
  // apply at full resolution: scale about the image centre, then translate
  const k = W / 320;
  const s = fine.s;
  const sw = Math.round(W * s), sh = Math.round(H * s);
  const scaled = await sharp(drawBuf).resize(sw, sh).png().toBuffer();
  const dx = Math.round(fine.dx * k - (sw - W) / 2), dy = Math.round(fine.dy * k - (sh - H) / 2);
  const srcLeft = Math.max(0, -dx), srcTop = Math.max(0, -dy);
  const destLeft = Math.max(0, dx), destTop = Math.max(0, dy);
  const w = Math.min(sw - srcLeft, W - destLeft), h = Math.min(sh - srcTop, H - destTop);
  const piece = await sharp(scaled).extract({ left: srcLeft, top: srcTop, width: w, height: h }).png().toBuffer();
  const out = await sharp({ create: { width: W, height: H, channels: 3, background: '#ffffff' } })
    .composite([{ input: piece, left: destLeft, top: destTop }]).png().toBuffer();
  return { buf: out, s: +s.toFixed(3), dx: Math.round(fine.dx * k), dy: Math.round(fine.dy * k), score: +fine.v.toFixed(3) };
}

async function exportSet(buf, name, W, H, widths, formats) {
  const out = [];
  for (const w of widths) {
    const h = Math.round((w * H) / W);
    const base = sharp(buf).resize(w, h);
    if (formats.includes('avif')) await base.clone().avif({ quality: 52, effort: 4 }).toFile(path.join(OUT, `${name}-${w}.avif`));
    if (formats.includes('webp')) await base.clone().webp({ quality: 78, effort: 5 }).toFile(path.join(OUT, `${name}-${w}.webp`));
    out.push(w);
  }
  return out;
}

async function paperTile() {
  // mirror a 450px crop into a seamless 900px tile
  const src = sharp(path.join(SRC, 'p0-04-paper-texture.png'));
  const crop = await src.extract({ left: 600, top: 600, width: 900, height: 900 }).resize(450, 450).png().toBuffer();
  const flipX = await sharp(crop).flop().png().toBuffer();
  const flipY = await sharp(crop).flip().png().toBuffer();
  const flipXY = await sharp(crop).flip().flop().png().toBuffer();
  await sharp({ create: { width: 900, height: 900, channels: 3, background: '#F4EFE6' } })
    .composite([{ input: crop, left: 0, top: 0 }, { input: flipX, left: 450, top: 0 }, { input: flipY, left: 0, top: 450 }, { input: flipXY, left: 450, top: 450 }])
    .webp({ quality: 70 }).toFile(path.join(OUT, 'paper-tile.webp'));
}

async function storySketch() {
  // round loaf study from the Phase 0 sketch sheet (top middle), white-pointed
  const { img } = await whitePoint('p0-06-bread-sketch-sheet');
  const buf = await img.png().toBuffer();
  const crop = await sharp(buf).extract({ left: 760, top: 110, width: 560, height: 560 }).png().toBuffer();
  for (const w of [480, 800]) await sharp(crop).resize(w, w).webp({ quality: 76 }).toFile(path.join(OUT, `story-sketch-${w}.webp`));
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  await fs.mkdir(GEN, { recursive: true });
  const report = {};
  for (const it of ITEMS) {
    const P = await whitePoint(it.photo, 0.965);
    const W = P.meta.width, H = P.meta.height;
    const photoBuf = await P.img.png().toBuffer();
    const pb = await bbox(sharp(photoBuf), W, 62);
    const layers = {};
    for (const kind of ['outline', 'shaded']) {
      const D = await whitePoint(it[kind], 0.94);
      let buf = await D.img.resize(W, H).png().toBuffer();
      const al = await alignTo(buf, photoBuf, W, H);
      layers[kind] = { s: al.s, dx: al.dx, dy: al.dy, score: al.score };
      buf = al.buf;
      await exportSet(buf, `${it.id}-${kind}`, W, H, it.widths.slice(0, 2), ['webp']);
    }
    await exportSet(photoBuf, `${it.id}-photo`, W, H, it.widths, ['avif', 'webp']);
    report[it.id] = {
      ar: it.ar, widths: it.widths, drawWidths: it.widths.slice(0, 2),
      cx: +((pb.cx / W) * 100).toFixed(1), cy: +((pb.cy / H) * 100).toFixed(1),
      bw: +((pb.w / W) * 100).toFixed(1), bh: +((pb.h / H) * 100).toFixed(1),
      lineFinal: it.lineFinal, align: layers
    };
    console.log(it.id, JSON.stringify(report[it.id]));
  }
  await paperTile();
  await storySketch();
  const ts = `// Generated by scripts/build-images.mjs — do not edit by hand.\n// Percent values locate the subject inside each image (used for mask centers and marks).\nexport type ImageData = { ar: [number, number]; widths: number[]; drawWidths: number[]; cx: number; cy: number; bw: number; bh: number; lineFinal: number; align: Record<string, { s: number; dx: number; dy: number; score: number }> };\nexport const images: Record<string, ImageData> = ${JSON.stringify(report, null, 2)};\n`;
  await fs.writeFile(path.join(GEN, 'images.ts'), ts);
  console.log('done');
}

main().catch((e) => { console.error(e); process.exit(1); });
