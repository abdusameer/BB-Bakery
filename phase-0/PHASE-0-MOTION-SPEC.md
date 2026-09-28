# Phase 0 — Motion Spec

**Motion idea in one line:** *draw → shade → reveal.* Every major moment is a pencil drawing becoming real. Everything else holds still so that moment reads.

**Stack:** GSAP 3 + ScrollTrigger (the only animation engine) · Lenis for smooth scrolling on desktop fine-pointer devices only (see Creative Direction §7) · CSS for hover, focus, and press · `gsap.matchMedia()` for every responsive and reduced-motion branch.

---

## 1. Motion goals (and nothing else)

| Goal | Where |
| --- | --- |
| Show *handmade* | Stroke drawing in the Opening and Menu |
| Earn *color* | The graphite → photo reveal |
| Guide attention | The character's travel, drawn arrows, and Story line |
| Confirm actions | Button press, nav underline, link underline |
| Keep continuity | The same nav line carries through the whole page |

Anything that serves none of these gets deleted.

## 2. Tokens

| Token | Value | Use |
| --- | --- | --- |
| micro | 160 ms, `power2.out` | hover, press |
| ui | 220 ms, `power2.out` | nav underline, menu sheet items |
| reveal | 600 ms, `power2.out` | text blocks entering |
| draw | 900 ms per stroke group, `power1.inOut` | SVG stroke drawing (time-based) |
| exit | 0.7 × the entry duration, `power2.in` | anything leaving |
| stagger (words) | 60 ms desktop · 40 ms mobile · max 10 words per heading | H1/H2 word reveal |
| offset | 16 px desktop · 10 px mobile | fade-and-rise distance |
| scrub | `scrub: 0.6` (desktop) · `scrub: true` (touch) | all scroll-linked timelines |

No elastic, back, or bounce easing anywhere.

## 3. The main event: sketch → photograph

One component, `SketchToPhoto`, used in the Opening (a lighter, time-based version) and in every Menu spread (scroll-scrubbed).

### Layer stack (bottom → top, all in one `aspect-ratio` box)

1. **Photograph** (`<img>`, real alt text). Hidden by mask **M2** at the start.
2. **Shaded graphite raster**: a pencil rendering of the same bread, aligned to the photo. Hidden by mask **M1** at the start.
3. **Line drawing** (SVG paths): the contour and a few construction lines. Starts undrawn.
4. **Annotations** (SVG + text): the arrow, circle, and margin note.

- Mask M1 is a **hatching mask**: 6–9 thick diagonal strokes whose `stroke-dashoffset` animates, so the shading appears as if hatched in.
- Mask M2 is an **eraser mask**: one wide, soft-edged S-curve stroke (plus a feathered blur ≤ 8 px) that sweeps across, so the photo appears as if the graphite were rubbed away.
- The line drawing's opacity fades from 1 to 0.18 as the photo arrives, so faint construction lines remain on top of the real bread, like a trace.

### Scroll timeline (Menu spread, desktop)

Pinned stage, 140 vh of scroll per item. Progress `p` runs 0 → 1:

| p | What happens |
| --- | --- |
| 0.00–0.28 | Contour strokes draw in order: outline → layer lines → construction ellipse |
| 0.20–0.52 | Hatching mask M1 reveals the graphite shading (overlaps the drawing's end) |
| 0.46–0.82 | Eraser mask M2 sweeps and the photograph appears; the line layer fades to 0.18 |
| 0.70–0.90 | The arrow draws from the margin note to the bread; the name underline draws |
| 0.90–1.00 | Hold. Nothing moves, so the finished bread can be looked at |

- **Reverse:** it's the same timeline scrubbed backward, so the photo re-graphites and then un-draws. No `once`, no `toggleActions` on these sequences.
- **Stop:** scrub means that when scrolling stops, the state stops (within the 0.6 s scrub catch-up).
- **Text:** the product name and the sample note are **not** animated by scroll. They're present and readable from p = 0. Only the drawing changes. The chip reads "Concept image" at every stage (one label for the whole generated set).

### Mobile and tablet (< 1024 or coarse pointer)

- **No pin.** Each item is a normal-flow block. The sequence scrubs as the figure passes from 85% to 35% of the viewport height (`start: "top 85%"`, `end: "center 35%"`).
- The 0.90–1.00 hold is removed. The arrow is replaced by a short underline.

### Opening version (time-based, not scroll-based)

Runs on load, total **≤ 1.6 s**, and the page is fully usable from the first frame:

| t | Beat |
| --- | --- |
| 0 ms | Paper, header, H1, hours, and both buttons are already painted, static and complete |
| 0–700 ms | The hero loaf's contour draws (3 stroke groups, 90 ms stagger) |
| 450–950 ms | Hatching reveals the graphite shading |
| 900–1500 ms | The eraser sweep reveals the photo; steam curls draw (2 strokes) |
| 1200–1600 ms | The wordmark underline draws beneath the H1 |

- Starts after `document.fonts.ready` **or** 400 ms, whichever comes first.
- If the hero photo hasn't decoded by 1.2 s, the sequence stops at the graphite stage and completes when the image arrives.
- Any scroll, key press, or click during the intro **fast-forwards** it to the end state (`timeline.progress(1)`).
- After the intro, scrolling out of the hero applies a gentle 6% parallax (`y` of the photo layer) with `scrub`. It fully reverses.

## 4. Supporting motion (deliberately small)

| Element | Motion | Trigger | Reverse |
| --- | --- | --- | --- |
| H2 section titles | Word-by-word fade and rise, 60 ms stagger | Enters at 80% of the viewport, **plays once** | No (reading shouldn't re-animate) |
| Lead paragraphs | Fade and rise 16 px, 600 ms, after the H2 | Same trigger | No |
| Story guide line | A single pencil line draws down the margin column | `scrub`, section top → bottom | Yes |
| Story margin notes | Each note's arrow draws when the guide line reaches it | Part of the same scrub | Yes |
| Media frames | Crop marks draw at the corners (4 × 120 ms), then the photo fades in (300 ms) | Enters at 85%, once | No |
| Visit route | A dotted route line draws from the paper edge to the pin | `scrub`, Visit section enters → centered | Yes |
| Visit character | Travels under "Visit", then points at the Directions button | Section becomes active | Yes (back to follow) |
| Nav underline | Draws under the active item (ui 220 ms) | Active change | Yes |
| Buttons | Primary: arrow +3 px on hover. Secondary: a second pencil box pass | Hover/focus | Yes |
| Paper | **No motion.** The paper does not float, drift, or breathe | — | — |

**"Imperfect line changes":** each drawn underline, circle and arrow has 2–3 pre-drawn variants. A variant is chosen once per state change (e.g. each time the active nav item changes). There is no continuous boiling or jitter.

## 5. Pinning policy

| Section | ≥1024 fine pointer | Tablet / touch | Mobile |
| --- | --- | --- | --- |
| Opening | No pin | No pin | No pin |
| Menu | **Pin** the stage; the list advances through all 6 items (140 vh each, 840 vh total) | No pin | No pin |
| Story | No pin (scrubbed line in normal flow) | No pin | No pin |
| Media | No pin | No pin | No pin |
| Visit | No pin | No pin | No pin |

There is only one pinned region on the whole page. The pin spacer is created by ScrollTrigger with `pinSpacing: true` and `anticipatePin: 1`. The pinned stage sits below the fixed header (`top: var(--header-h)`) and never covers the navigation.

## 6. Responsive architecture

```js
const mm = gsap.matchMedia();
mm.add({
  desktop: '(min-width: 1024px) and (hover: hover) and (pointer: fine)',
  touch:   '(max-width: 1023px), (pointer: coarse)',
  reduce:  '(prefers-reduced-motion: reduce)'
}, (ctx) => {
  const { desktop, reduce } = ctx.conditions;
  if (reduce) return setFinalStates();   // no timelines at all
  desktop ? buildPinnedMenu() : buildFlowMenu();
  buildStoryLine(); buildVisitRoute();
  return () => {/* matchMedia reverts tweens and kills triggers automatically */};
});
```

- Breakpoint changes revert and rebuild every trigger through `matchMedia`. No stale pin spacers.
- `ScrollTrigger.refresh()` runs after `document.fonts.ready` and after every `img.decode()` in the Menu and Media. Refreshes are debounced to 150 ms.
- Lenis drives `ScrollTrigger.update` on its `scroll` event, and `gsap.ticker` drives `lenis.raf`. `gsap.ticker.lagSmoothing(0)`.
- **Transform ownership:** GSAP owns `transform` on animated layers. CSS never sets `transform` on those elements (it uses `translate`/`rotate` individual properties only for static offsets, or a wrapper element).

## 7. Reduced motion (`prefers-reduced-motion: reduce`)

This isn't "shorter animations". It's **final states, immediately**:
- Lenis isn't created.
- No pins, no scrub, no stroke drawing.
- Every `SketchToPhoto` renders its **final** state: the photo, with the pencil drawing shown as a small separate thumbnail beside it ("Pencil study" caption), so the concept still reads.
- Headings and paragraphs are visible with no fade.
- Story line, crop marks and route are drawn statically.
- Character: static poses (see Character Behavior §8).
- Hover and focus states remain, as color and underline changes only.

## 8. No-JavaScript and failure states

- All content is in the HTML. With JS off, the page shows final states (the photo is visible, lines drawn), because the initial "undrawn" states are applied **by JS** with a `.js` class on `<html>`, never by default CSS.
- If an image fails to load, the graphite raster stays as the visible layer and the figure caption still names the product.
- If GSAP fails to load, the `.js` class is removed in a `catch`, which restores the final states.

## 9. Performance contract

- Animate only `transform`, `opacity`, `stroke-dashoffset`, and mask-path stroke properties. No `filter` animation, and no blur larger than 8 px (and only on the eraser mask).
- Sketch-to-photo layers are ≤ 1600 px wide on desktop and ≤ 900 px on mobile, served as AVIF/WebP via `srcset`.
- Offscreen: the character's rAF stops when idle. ScrollTriggers scrub only while their section is in range. There are no CSS keyframe loops anywhere (verified with the animation-state probe in Phase 1).
- `will-change: transform` goes only on the pinned stage and the character's root, and only while active.
- Target: 60 fps scrubbing on a 2020 MacBook Air, and no long tasks > 50 ms during scroll on a mid-range Android.

## 10. Verification checklist for Phase 1

1. Scroll down slowly through each Menu item, stop halfway, and confirm the state holds.
2. Scroll back up and confirm each item re-graphites, then un-draws, in exact reverse.
3. Flick-scroll from the top to Visit and back: no stuck masks, no jump at pin start or end.
4. Resize from 1440 → 900 → 1440 without reloading: pins rebuild and nothing overlaps.
5. With reduced motion on: no pins, and every final state is visible.
6. With JS disabled: the photos and all text are visible.
7. Console: zero errors. Animation probe: zero running animations offscreen.
