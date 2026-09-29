# BB Bakery & Cafe — "The Bakery Sketchbook" (unofficial concept site)

> **Unofficial private concept.** Not commissioned, reviewed, or approved by BB Bakery & Cafe. The page ships with `noindex, nofollow` and a footer notice. Do not deploy publicly unless that's separately decided. Every generated image is labeled "Concept image".

A single-page React + Vite + TypeScript site. Pencil drawings of bread shade in with graphite and resolve into photographs as you scroll. A small pencil salt-bread character hangs from the navigation line.

Spec: `../phase-0/` (truth pack, design system, motion spec, character behavior, content map).

## Run it

Requires Node 20+ (tested on 22.14) and npm.

```bash
cd ~/Documents/bbs-bakery/site
npm install
npm run dev          # http://localhost:5173 (hot reload, client-rendered)
```

Production build (typecheck → client bundle → server bundle → prerendered HTML):

```bash
npm run build
npm run preview      # http://127.0.0.1:4174 — serves dist/ exactly as built
```

`dist/index.html` contains the complete page (prerendered), so it's readable with JavaScript off. JS then hydrates it and lazy-loads the motion layer.

## Scripts

| Command | What |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | `tsc -b` + client build + SSR build + `scripts/prerender.mjs` |
| `npm run preview` | Serve `dist/` on port 4174 |
| `npm run images` | Rebuild `public/img/` from `assets-src/generated/` (white-point, align drawings to photos, AVIF/WebP). Takes ~50 s |
| `npm run silhouettes` | Trace each bread's outline from its photo into `src/generated/silhouettes.ts` (the mascot hides behind these). Rerun after `npm run images` |
| `node scripts/qa.mjs --base http://127.0.0.1:4174 --out qa/screens` | Screenshots at 1440/1280/1024/768/430/390/360, plus overflow, console, request, and nav-overlap checks (`--reduced`, `--nojs`, `--widths` optional) |
| `node scripts/qa-interactions.mjs --base http://127.0.0.1:4174` | Guide follow and reactions, anchor-jump accuracy, reverse scroll, live resize, keyboard, mobile sheet |
| `node scripts/qa-menu.mjs [--width 390 --height 844]` | Pinned menu (any size; phones and tablets use the compact stage): one item at a time at each hold, mid-erase and next start; eraser visible while wiping; reverse scroll |
| `node scripts/qa-mobile.mjs --base http://127.0.0.1:4174` | Touch: on phones the real croissant (not the old peek) leans on the header rule, follows a finger and watches the scroll; Sketch toggle and press-and-hold; tablet finger-follow |
| `node scripts/qa-mascot.mjs [--width 390 --height 844]` | Mascot scenes at any size (touch emulation below 1024): wave → exit behind the line → presents each of the five breads (wink on the last) → hides behind each → peek and return home → walks the Visit map route to the pin → waves goodbye over the footer edge; overlap check against nav, index, item text, Sketch button, labels, map labels, buttons and footer text throughout |
| `node scripts/qa-perf.mjs --cpu 4` | Scroll smoothness: whole page at a steady speed, desktop and phone (CPU throttled), frame intervals per section and main-thread time |

The QA scripts drive the locally installed Google Chrome via `puppeteer-core` (dev dependency; no browser download).

## Useful switches

- `?smooth=0`: disables Lenis smooth scrolling (native scroll), e.g. for debugging.
- OS "Reduce motion" setting: no pin, no scrub, no smooth scroll. Every drawing shows its final photo plus a small "Pencil study".

## Structure

```
src/
  content.ts              all copy, each entry tagged with its source tier (A / B / owner / ui)
  components/             Header (nav line, guide, mobile peek, index sheet), Opening, Menu, Story,
                          Media, Visit, Footer, SketchFigure (sketch → photo), Guide (character SVG),
                          Pencil (line library), Icons (Solar), SplitHeading
  motion/index.ts         GSAP + ScrollTrigger + Lenis orchestration (gsap.matchMedia per breakpoint)
  motion/sketch.ts        the draw → graphite → photo sequence (scrubbed and time-based versions)
  motion/guide.ts         character controller (rAF, clamped, no React re-renders) + the phone peek scenes
  motion/mascot.ts        the mascot's scroll scenes: hang, wake, wave, exit, moveToPastry, recommend,
                          hideBehindPastry, peek, returnHome (approved spots in content.ts)
  motion/atmosphereGL.ts  "after hours" WebGL glow for Visit + footer (fallback: motion/atmosphere.ts, Canvas 2D)
  lib/bus.ts              tiny event bus + scrollToId (Lenis-aware, moves focus to the heading)
  generated/images.ts     written by the image pipeline
  generated/silhouettes.ts  traced bread outlines (scripts/build-silhouettes.mjs)
  styles/global.css       tokens, layout, sections
  styles/guide.css        character poses, shelf band, peek
scripts/                  build-images, build-silhouettes, prerender, qa, qa-interactions, qa-mobile, qa-menu,
                          qa-mascot, qa-perf
assets-src/generated/     Higgsfield concept sources (see ASSET-MANIFEST.md)
public/img/               optimized images (generated by `npm run images`)
qa/                       latest screenshots + JSON reports
```

## Placeholders that need the owner

- Logo: the typeset "BB Bakery & Cafe" wordmark ("BB" on phones) stands in.
- Phone and social links: "to be added" (`src/content.ts → visit.futureContact`).
- The owners' story: dashed placeholder block (`story.ownerTitle / ownerBody`).
- Every photo: murals, patio, packaging, interior, storefront, and real product photos.
- Menu status (`today / sold-out / preorder`) and prices: data slots exist on `MenuItem`, not rendered.

See `PHASE-1-REPORT.md` and `../phase-0/PHASE-0-OWNER-CONFIRMATION.md`.
