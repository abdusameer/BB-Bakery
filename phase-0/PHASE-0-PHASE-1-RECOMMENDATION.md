# Phase 0 → Phase 1 Implementation Recommendation

**Build:** a single-page React 18 + Vite + TypeScript site in `~/Documents/bbs-bakery/site/`. Plain CSS with custom properties (tokens from the Design System). No UI framework, no Tailwind, no component library.

## Stack

| Concern | Choice | Why |
| --- | --- | --- |
| App | React + Vite + TS | Fast local dev and build; small output |
| Animation | GSAP 3 + ScrollTrigger (`gsap.matchMedia`, `gsap.context`) | Scrub, pin, and reversible timelines with clean teardown |
| Smooth scroll | Lenis, desktop fine-pointer only, `?smooth=0` kill switch | Smooths the scrubbed transitions. Remove it if QA shows instability |
| Character | Hand-written TS module driving inline SVG groups via rAF | No React re-renders on pointer movement |
| Icons | Solar Linear, inlined SVG (Iconify source) | Consistent, licensed |
| Images | `sharp` build script: white-point + align + AVIF/WebP at 640/960/1400/1800 | Seamless multiply onto paper; small files |
| Fonts | Google Fonts with `display=swap` and preconnect; `document.fonts.ready` triggers refresh | Prevents trigger miscalculation |

## Component map

`App` → `Header` (nav line, links, Directions, mobile quick links, Index toggle, `Guide` character) · `MobileSheet` · `Opening` (`HeroSketch`) · `MenuSection` (`SketchToPhoto` × 6, `MenuIndex`) · `Story` (`MarginLine`, `OwnerPlaceholder`) · `Media` (`Frame`, `OwnerSlot`) · `Visit` (`InfoRows`, `PencilMap`, map links) · `Footer` (unofficial notice, credits).

Content lives in `src/content.ts` with a tier on each entry (`A | B | owner`), so provisional content is typed and auditable.

## Build order

1. Tokens, fonts, paper, header and nav line, skip link, footer notice, `noindex`.
2. Static, complete page for all five sections (the no-JS / reduced-motion baseline).
3. `SketchToPhoto` (masks, layers) → Opening time-based version → Menu scrubbed/pinned version.
4. Guide character: rig, follow, travel, reactions, touch glance, mobile peek, reduced motion.
5. Story line, Media crop marks, Visit route.
6. Image pipeline, responsive sources, lazy loading.
7. QA loop at 1440 / 1280 / 1024 / 768 / 430 / 390 / 360, plus reduced motion, keyboard, resize, reverse scroll, console, and overflow checks.

## Assets needed in Phase 1 (minimum generation)

The Menu shows only items with a usable visual. The five non-salt-bread items each need one concept photo and one aligned line drawing, and the hero needs a resolved loaf photo with its line drawing. That's about 12 generations (~33 credits). The graphite stage is produced in code (desaturate + contrast + graphite-texture multiply), so no third image per item is needed.

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Generated sketch and photo don't register | Measure bounding boxes and align in the sharp pipeline; fall back to a crossfade if still off |
| Pin + Lenis instability | Pin only on desktop fine pointer; Lenis optional; verify reverse and resize |
| Character overlaps content on desktop | 64 px size, `pointer-events: none`, tuck rule, positioned under nav items |
| Concept images mistaken for real | Mandatory chip on every generated image, footer notice, alt text starts with "Concept image" |
| Real murals differ from our pencil register | Flagged. The style is tokenized so line weight and filter can be retuned after the photos arrive |
