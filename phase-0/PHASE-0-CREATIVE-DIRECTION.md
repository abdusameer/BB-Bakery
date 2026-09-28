# Phase 0 — Creative Direction

**Internal concept name:** The Bakery Sketchbook (never shown to visitors)
**Status:** Unofficial private concept. Not commissioned or approved by BB's Bakery.

---

## 1. Locked creative thesis

> **Every bread at BB's starts as a pencil line.**
> The site is one sketchbook page that the bakery's black-and-white bread drawings have walked off the wall onto. You scroll, and each drawing picks up graphite shading, then resolves into the real bread, in real color. Everything that isn't bread stays graphite on warm paper, so the only color on the page comes from what comes out of the oven.

Three rules make this a system rather than a decoration:

1. **Color is earned.** The interface is monochrome: paper, graphite, charcoal. Color appears only inside product photography. The page gets warmer as you scroll because more bread becomes real.
2. **Lines do work.** Every drawn line has a job: it underlines, frames, points, connects, or holds up the character. There are no ambient doodles.
3. **The drawing never blocks the facts.** Hours, address, directions, and navigation are set in real type on clean paper. They never sit under animation, texture, or illustration.

## 2. Why this fits BB's specifically

| Real BB's signal (source tier) | How the concept answers it |
| --- | --- |
| Cartoon-style bread drawings and murals in the shop (customer theme, Tier B) | The whole page is those drawings coming to life. Media reserves the first slots for real mural photos |
| "Handcrafted bread, baked fresh daily" (Tier A) | Opening and Story show the hand. A drawing is literally hand-made in front of you each time you scroll |
| Handwritten sample labels on the counter (seen in the bakery's own posts, Tier C reference) | The *only* handwriting on the site: short 1–4-word marginal notes, like a sample card |
| Their serif menu board with a red-star "signature" convention (Tier C reference) | A refined serif carries the type system. One restrained stamp-red accent marks status (e.g. future sold-out), never decoration |
| Korean-style soft bread; salt bread is a customer favorite (Tier B) | The guide character is a salt-bread roll drawn in pencil |

## 3. Visual DNA (from the reference pack)

**Reference inputs:** BB's menu board (EN/KR), logo badge, product phone photos, customer descriptions of the murals. *Real mural photos were not available. They are the largest gap in the direction and must be reviewed before Phase 2 styling is final.*

**Similarity dial:** about 70% to BB's own in-store materials (it is their brand), and 0% to any other bakery's site.

Reusable grammar:
- black line on white, cartoon-leaning bread forms (murals, as described)
- a calm, classic serif menu hierarchy with generous leading
- small handwritten labels next to products
- warm, casual product photography on wood and paper

Protected elements, never reproduced by us:
- the BB's Bakery Cafe logo badge (toast slice and steam). The concept uses a typographic placeholder wordmark until the owner supplies the file and permission
- the menu-board line "Good bread, good life"
- the actual mural drawings. Our pencil work is original and in a different register (graphite construction drawing, not their cartoon line)
- the red-star menu device as a literal copy. We use a stamp-red *dot*, and only for status

## 4. Story map (5 beats)

| # | id | Scene | Eyebrow | Headline (draft) | Body (≤24 words) | Evidence | Motion verb | Scroll weight |
| - | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `opening` | Blank paper → a loaf drawn in pencil → the loaf becomes real | Bakery · Coffee & Tea · Los Angeles | **BB's Bakery** (H1), sub: *Handcrafted bread, baked fresh every day.* | Hours + Menu / Visit actions visible without scrolling | Tier A | draw → reveal | 100 vh (no pin) |
| 2 | `menu` | One bread per spread: sketch, shading, photograph | Sample selection | **Breads people talk about** | Named in customer reviews. A sample, not the full menu. Ask in store for today's bread. | Tier B (marked provisional) | draw → shade → erase-to-photo | 140 vh per item × 6, desktop pin |
| 3 | `story` | A notebook page with a margin column | The notebook | **Baked fresh, every day** | Premium handcrafted bread with high-quality ingredients, baked daily. | Tier A only; reserved owner-story block | line guides the eye | ~120 vh |
| 4 | `media` | Contact sheet of the shop: products, murals, packaging, interior, patio | From the shop | **Around the shop** | Owner photos fill these frames. Concept frames are labeled. | Slots, not claims (Murals/Patio slots marked provisional) | frame lines draw in | ~100 vh |
| 5 | `visit` | Pencil street grid, route line, and the character pointing | Visit | **Visit BB's** | Address, daily hours, takeout, wheelchair accessible. Directions link. | Tier A | route draws to pin | ~100 vh |

**Actions.** The page's one *external* conversion is **Get directions** (header and Visit). In the Opening, the two in-page actions are **See the menu** (primary style, because Menu is the first thing visitors want) and **Plan a visit** (secondary, which jumps to Visit where Get directions lives).

## 5. Style bible

| Field | Decision |
| --- | --- |
| Mood | warm · observant · unhurried |
| World metaphor | one continuous sketchbook page. The navigation line is the page's top rule, and the character hangs from it |
| Dominant field | Paper `#F4EFE6`, 80% of every viewport |
| Ink | Graphite 900 `#1E1C19` for text; graphite line `#2B2825` for drawing |
| Accent | Stamp red `#A3322B`, status only (≤1% of any viewport) |
| Color source | Product photography, and nothing else |
| Display type | **Young Serif**: warm, bookish, slightly naive old-style serif |
| Reading type | **Hanken Grotesk**: quiet, open, legible at small sizes |
| Annotation type | **Nanum Pen Script**: 1–4-word notes only. Never paragraphs, never essential information |
| Korean support | Gowun Batang (display) and Noto Sans KR (text), reserved for future bilingual product names |
| Material | cotton paper grain · graphite (hatching, smudge, eraser) · flour specks · real photography |
| Motion grammar | **staged reveal**: draw, shade, resolve. One grammar, repeated with variation |
| Pacing | Fast at the top (facts in the first viewport). Slows in Menu (the main event). Calm in Story. Quick in Media. Steady and clear in Visit |
| Exclusions | pastel bakery templates · beige luxury minimalism · cartoon clip art and sticker pileups · scrapbook mess · gradient blobs · glass · marquees · 3D spectacle |

## 6. Rendering decision (scroll-world mode)

**Mode 3: HTML / SVG / type, with photographic layers.** Not video scrub, not Three.js.

- The core effect (pencil lines draw, graphite fills, photo appears) is naturally a stack of SVG stroke animation, a raster sketch layer, and a photo revealed by an SVG mask. All three stay crisp, accessible, and cheap.
- Video scrub would lock us into generated footage of products we can't verify, and it's heavy on mobile.
- **Three.js: rejected.** There is no spatial idea here, and a WebGL canvas would compete with the paper.

## 7. Motion stack decision

- **GSAP + ScrollTrigger** is the only animation system. CSS handles simple hover and focus states.
- **Smooth scrolling:** we compared Lenis and Locomotive and **chose Lenis**, but only on desktop fine-pointer devices, with a conservative `lerp: 0.1`, `syncTouch: false`, and no wheel multiplier. It is wired into `ScrollTrigger.update` and the GSAP ticker. It is **off** on touch devices, under `prefers-reduced-motion`, and whenever `?smooth=0` is set. Locomotive was rejected because it's heavier and v5 wraps Lenis anyway. If Lenis causes any pinning instability in Phase 1 QA, remove it. Native scroll is the fallback, not a downgrade.
- No scroll hijacking, no snap, no wheel-jacking. Every scrubbed sequence reverses when you scroll up.

## 8. The guide character (summary)

A small pencil-drawn **salt-bread roll** with thin pencil limbs. It hangs by its hands from the navigation line under the active section. Its eyes follow the pointer, its head follows after a short delay, and its body leans a little. It's a quiet guide, 64 px tall on desktop (52 px tablet, 40 px mobile peek), not a mascot. Full spec: `PHASE-0-CHARACTER-BEHAVIOR.md`. Internal working name: **Sogeum** (Korean for "salt"). The name is not shown to visitors.

## 9. Asset provenance plan

| Layer | Source | Status |
| --- | --- | --- |
| UI, type, lines, character, arrows, frames, map | Hand-authored SVG and CSS in the repo | Original, editable |
| Paper / graphite textures | Higgsfield concept plates (no text) | Concept. Can ship as texture |
| Product photographs | **Owner photography required.** Higgsfield concept photos stand in, each visibly labeled "Concept image" | Must be replaced before launch |
| Pencil product drawings | Higgsfield concept drawings made from the concept photos. Ideally redrawn by hand from the owner's real photos | Replace or redraw before launch |
| Murals, interior, patio, storefront, packaging | **Owner photography only.** Labeled placeholder frames until then | Never generated as "the shop" |
| Logo | Owner-supplied vector with permission | Typographic placeholder until then |
| UI icons | Solar icon set via Iconify, inlined | Licensed (CC BY 4.0) |

## 10. What this direction deliberately does not do

- It does not invent a founder story, a menu, prices, hours variants, or amenities.
- It does not show generated images of "the shop" (interior, patio, murals, people).
- It does not put the Yelp rating, reviews, or testimonials on the page.
- It does not claim awards or recognition of any kind.
