# Phase 1 — Implementation Report

**Project:** The Bakery Sketchbook, an unofficial concept site for BB Bakery and Cafe (not commissioned, not affiliated, not published).
**Location:** `~/Documents/bbs-bakery/site` · **Spec:** `~/Documents/bbs-bakery/phase-0/`
**Stack:** React 19 + Vite 8 + TypeScript 6 · GSAP 3.15 + ScrollTrigger · Lenis 1.3 (desktop fine pointer only) · build-time prerender · sharp image pipeline.

## What was built

| Area | What it does |
| --- | --- |
| **Opening** | Paper page, typeset "BB Bakery and Cafe" H1 (BB / Bakery / and Cafe), lead line, hours, **See the menu** / **Plan a visit**, all in the first viewport at every tested size. The hero loaf draws itself as authored SVG strokes, then graphite hatches in, then an eraser sweep reveals the photograph with steam curls. It takes about 1.5 s, starts right after hydration, and any input fast-forwards it. The loaf is scaled up (`scale: 1.28`) per your request |
| **Menu** | "Sample selection" of six customer-mentioned items. **Desktop (≥1024, fine pointer):** one pinned stage (6 × 140 vh) with a numbered index rail (clickable, `aria-current`), and each item scrubs outline → graphite → photo → drawn arrow and underline, then a pencil-drawn eraser wipes the product off the paper (left to right) before the next item draws in. Only one item's picture, text and "Concept image" label are ever visible. **Tablet/touch/mobile:** no pin; each item scrubs as it crosses the viewport. No prices, no cart. `status` slots exist for future Today / Sold out / Preorder, and the "Owner to confirm" end note is shown |
| **Story** | Notebook margin with a pencil line that draws as you read, pen notes with arrows, the verified description (paraphrased), a dashed "The people behind the bread" block reserved for the owners, and a labeled concept sketch |
| **Media** | Editorial contact sheet with crop marks that draw in: Murals (large, "mentioned by customers · to confirm"), Bread and Coffee (labeled concept images), and Patio, Packaging, Interior, Storefront (empty "Owner photo" frames at final aspect ratios) |
| **Visit** | Address (`<address>`), hours (`<time>`), takeout, wheelchair accessible, **Get directions** (Google Maps) + **Open in Apple Maps** (both built only from the verified address), a pencil street sketch whose route draws toward the pin, "Phone · social links: to be added" with **Owner to confirm**. The guide points at the directions button: from the nav line on desktop, and as a small hanging figure above the button on mobile |
| **Guide character** | Inline SVG salt-bread roll, now 96 px tall on desktop (78 px tablet) and bigger in the mobile peek. It climbs in along the line on load. The rAF controller has eyes (τ 80 ms, ±2.4/±1.6), head (τ 240 ms, ±9°), body lean (τ 450 ms, ±4°), and legs on damped springs driven by lean velocity (right leg lags). A dead zone, idle reset after 4 s, and neutral reset on pointer leave, blur or hidden tab. It travels hand over hand to the active section. Nav hover/focus reactions: Menu points down, Story climbs, Media shows a camera + wink + flash, Visit points at directions. Tracking pauses during reactions. It perches on the line for very short viewports or when focus lands under it. Touch: a 900 ms glance toward the tap. Mobile: peeks over the header rule beside the ☰ button (48 × 48 target untouched). Reduced motion: static poses |
| **Header / nav** | Pencil nav line; items sit on it with a drawn active underline; Directions button (icon-only below 1280, still named). A shelf band fades content under the line so the hanging guide never covers readable content. Mobile: BB · Menu · Visit · the croissant on the rule · ☰ Index sheet (`role=dialog`, focus trap, Escape, focus return, `inert` background) |
| **Footer** | Address and hours, **Unofficial website concept** notice, concept-image disclosure, credits |
| **"After hours" chapter** (added at your request, `/atmosphere-background`) | Visit + footer turn warm charcoal (`#17130F`). A **WebGL fragment shader** (`src/motion/atmosphereGL.ts`, from the `/webgl-landing-steering` review: Lane A, a subtle depth field; raw WebGL with no library, +3.6 KB gz) draws 8 tall crust-gold light folds (5 on mobile) that rise from the lower edge, drift slowly (sine sway, lean, ±10 % intensity) and are screen-blended so crossings brighten, with drifting fabric-crease noise, film grain against banding, a faint warm glow that follows the pointer on desktop, and a focal bloom in the lower right that continues into the footer. If WebGL is unavailable, the Canvas 2D version (`atmosphere.ts`) takes over automatically. Context loss is handled and GPU resources are released on cleanup. Measured contrast over the glow: primary facts ≥ 7:1, the smallest map caption 4.7:1 before its halo. The colors come from the bread photography, not cyan. Tokens flip inside `.is-dark`, so text becomes paper-toned, **Get directions** becomes a paper button, the map turns to chalk, and the guide is drawn in chalk (the header shelf and hanging guide switch while the chapter is under them). It renders at reduced resolution (DPR cap 1.5), is capped at 30 fps, and pauses off-screen or when the tab is hidden. Reduced motion shows one still frame; with JS off, a static CSS glow |

## Mobile & touch interactivity (added on request)

| Where | What happens |
| --- | --- |
| **Phone character (peek)** | A bigger peek that looks over the header rule beside ☰. Its eyes and head follow your finger while it touches or drags (even mid-scroll), then return to neutral 0.7 s after you lift. Its eyes watch the page scroll by, leaning slightly with the motion. Each section gets a small reaction: **Menu** looks down and nods twice at the food, **Story** sways like climbing along the line, **Media** winks with a camera flash, **Visit** ducks while the chalk guide above *Get directions* takes over. It uses one damped rAF loop that stops when settled, and it's static under reduced motion |
| **Tablet character** | The full hanging rig (eyes, head, body lean, leg swing) follows your finger while you touch, like the mouse on desktop, then releases |
| **Sketch toggle** (every bread, all sizes) | A **Sketch** button (44 px, `aria-pressed`, label names the bread) swaps the photo back to its pencil drawing and becomes **Photo** to swap back. On touch, **press and hold** a picture to peek at the drawing while you hold. There's a soft crossfade, no fade under reduced motion, and the long-press image callout is suppressed |
| **Visit glow** | The WebGL glow follows your finger on touch screens, and the mouse on desktop |

Evidence: `qa/mobile/mobile.json`, `qa/mobile-peek-states.jpg`, `qa/mobile-sketch-toggle.jpg` (run with `node scripts/qa-mobile.mjs`).

## Same effects on phones and tablets (added on request)

- **Pinned menu everywhere.** Phones and tablets now get the pinned menu too, with the same draw → graphite → photo → eraser hand-off and the same eased scrub. The intro and index scroll away first, then only the picture stage pins (phones: count, square picture, name in one column; tablets: picture left, text right). Very short screens (a phone on its side, under 560 px tall) keep the scrolling version. The pinned stage carries its own paper so the multiply-blended pictures never show white boxes.
- **The real croissant on phones.** The small header peek is replaced by the same rig as on desktop. His home on phones is the header rule: he leans on it, head and mittens over the edge, where the peek used to be. From there he plays every scene: the wave (then ducks behind the rule), presenting each bread, the map walk and the footer goodbye, and he rises back over the rule to come home. His eyes follow your finger and watch the page scroll, he sways at Story and winks at Media (once each). The Visit section's static croissant steps aside, since he walks there himself. No-JS and reduced motion keep the little static peek.
- **Smoother touch.** Scroll-linked drawings (hero drift, Story line and notes, map route) now ease after the finger on touch screens instead of tracking every jitter; desktop keeps Lenis.
- **Measured** with `scripts/qa-perf.mjs` (whole page, steady scroll, CPU throttled 4×): no frame over 33 ms on desktop or phone, 95th percentile about 18 ms (`qa/perf/perf-cpu4.json`).

## The croissant mascot's scroll scenes (added on request)

The existing hanging character is the only mascot; it is the same element moving between places (transforms and a clip-path only, no second copy, no layout shift). New arm poses were added to the existing pencil rig in the same stroke style: a waving arm and an outstretched presenting arm.

| State | Desktop / tablet | Phone (simplified) |
| --- | --- | --- |
| Hang | Starts exactly where it always hung, under the nav line | Peeks over the header rule |
| Wake + wave | On the first real scroll (48 px): a small start, looks down at the page, lets go with one hand and waves (~1.2 s) | The peek rises and waves a mitten |
| Exit | Pulls himself up and slips behind the header border (clipped at the line) | Ducks behind the header rule |
| Present every bread | Each time you pause on a bread in the menu: his eyes come up over its top edge (hidden behind it), he walks round its end, stands beside it, leans in, presents it with an open hand, looks back at you and nods (two nods for the first bread, one after). The wink is saved for the last bread. No words | Pops up, looks and points at each bread, nods; winks at the last |
| Disappear | After each bread, walks back round and ducks down behind it (clipped by the bread's traced outline), not a fade; he reappears from behind the next bread | Stays home |
| Return home | Once the breads are done or you leave the menu: hangs upside down by his feet from behind the line and looks around, then lowers himself back into his hang | Pops back up if still away |
| Walk to the shop (Visit) | Once the map's dotted route has drawn and the map is on screen: drawn in chalk, he walks in from the map's left edge, follows the route to the shop pin, rests his open hand beside it, nods, glances toward Get directions, then walks back out the way he came. He stops short of the street labels and never covers the pin | Skipped (the Visit croissant there already points at Get directions) |
| Goodbye (footer) | At the bottom of the page he climbs up from behind the footer's top edge, mittens on the edge like someone peeking over a wall, waves goodbye and stays there. When you scroll back up he drops behind the edge and returns home | The croissant on screen waves: the Visit one, or the header peek pops up |

- **Approved spots only.** All five breads (salt bread, garlic cream cheese bread, cranberry cream cheese bread, cream-filled twisted doughnut, croissant sandwich) have a fixed spot (`mascotSpot` in `content.ts`), computed from each bread's traced outline so he stands on its table line without covering it. The latte (a drink) has none.
- **Once per visit.** The wave plays once and each bread is presented once. If the reader scrolls on mid-scene (or toggles Sketch), he leaves at once, behind the bread, and may try that bread once more if the reader comes back to it. Arrival reactions on the nav line now play once per section, and the phone peek's section reactions once each. While away, hover and section travel stand down.
- **An occasional peek.** If the reader lingers while he's away, he peeks upside down from behind the line once.
- **Never in the way.** Verified throughout the bread, map and footer scenes (also against the map labels, Get directions buttons, map caption and footer text): no overlap with the nav, index rail, bread name, note, count, Sketch button or Concept image label (`qa/mascot/mascot.json`).
- **Reduced motion:** no scenes; he stays home, still. Short viewports (perched) also skip the scenes.

## Verification (evidence in `qa/`)

| Check | Result |
| --- | --- |
| Production build | `npm run build` passes (typecheck, client, SSR, prerender) |
| Widths 1440 / 1280 / 1024 / 768 / 430 / 390 / 360 | Screenshots in `qa/screens/`. **No horizontal overflow, 0 console errors, 0 failed requests** at every width; the guide never overlaps nav labels |
| Anchor jumps | Every nav link, hero button and sheet link lands the section top exactly under the header (184 px desktop, 166 px at 768, 72 px mobile) with the right section active (`qa/interactions/interactions.json → jumps`) |
| Pinned menu sequence | At each item's hold, mid-erase and next-item start (1440 px), exactly one item shows; undrawn items leave no marks; scrolling back restores the earlier item (`node scripts/qa-menu.mjs`, `qa/menu/`) |
| Scroll reversal | Pinned menu state at p = 0.12 is identical before and after scrolling to p = 0.95 and beyond (`qa/interactions/interactions.json`) |
| Resize without reload | 1440 → 900 → 1440: pin removed, then rebuilt as a single spacer. No overflow |
| Guide | Eyes and head follow left/right, reset to neutral on leave; each nav item gives the right pose; the rAF loop stops when idle (`data-animation-active="false"`) |
| Keyboard | First Tab shows the skip link; the order is wordmark → nav → Directions → hero actions → menu index; 3 px focus ring |
| Mobile sheet | `aria-expanded` toggles, `main` inert, focus trapped, Escape closes and returns focus to ☰, links close the sheet and land the section heading under the header |
| Reduced motion | `qa/screens-reduced/`: no pin, no scrub; final photos with "Pencil study" thumbnails; static character |
| JavaScript off | `qa/screens-nojs/`: complete page from the prerendered HTML, final states visible |
| Performance | LCP 352 ms desktop / 304 ms mobile (4× CPU throttle); CLS ≤ 0.003; 0 CSS animations running at rest; JS heap ~5 MB; ~0.5 MB of images on first view; motion code lazy-loaded (55 KB gz) |
| Metadata | `noindex, nofollow` (+ googlebot), one H1, landmarks, skip link |

## What was generated with Higgsfield (concept only)

28 images across both phases (~77 credits), with no correction attempts. On the site: the hero loaf and six menu items (photo + outline + graphite each), one Phase 0 pencil study (Story) and the paper texture. Full list, job IDs and verbatim prompts: `ASSET-MANIFEST.md`.

## What is authentic

**Only the facts.** Business name, category, address, daily hours, takeout, wheelchair access and the paraphrased description come from the Yelp listing you supplied. There are **no authentic photographs** on the site.

## What remains provisional

- The six menu items: mentioned in customer reviews, shown as a sample, with no availability implied.
- All product imagery: concept images, labeled as such. The fillings and toppings shown are illustrative.
- The Murals and Patio slots: features known only from reviews (marked "to confirm").
- The typeset wordmark standing in for the real logo.

## Needs owner confirmation (see `phase-0/PHASE-0-OWNER-CONFIRMATION.md`)

The canonical name (the site now uses "BB Bakery and Cafe", as you asked on 2026-09-29; the Yelp listing reads "BB's Bakery") · hours (other listings disagree) · phone · official social accounts · whether to show prices and live sold-out/preorder states · Korean product names · the owners' story · permission to use the logo and mural photos · real product, interior, patio, storefront and packaging photos · the exact map pin/entrance.

## Independent review rounds

- **Phase 0:** a reviewer found unsupported claims, contradictions between documents and board defects. All were fixed and the boards re-exported.
- **Phase 1:** a reviewer found:
  - Anchor jumps landed in the wrong section: Lenis double-counted `scroll-padding`, and image-load refreshes interrupted native smooth scrolls.
  - Pencil strokes rendered as dashes (`non-scaling-stroke` combined with `pathLength`).
  - Crop marks were clipped.
  - The finished photo was held for too little scroll.
  - The hero was downloaded twice at 768.
  - Some targets were under 44 px.
  - Pinned items were hidden from screen readers.
  - Map labels were unreadable on phones.
  - Chips sat far from the bread, and the media note was misplaced.
  - The desktop Visit pose pointed away from Directions, and the "fresh today" note read as a claim.

  **All fixed and re-verified.** Jumps are regression-tested in `scripts/qa-interactions.mjs`.

## Known limitations / Phase 2

- **Real media swap.** Every concept image and drawing should be replaced with owner photos, and the line drawings traced from them. The pencil style must be re-tuned once the real murals have been seen (they're the creative premise, and no photo of them was available).
- **Cross-browser.** Verified in Chromium (Chrome 1xx desktop + mobile emulation). Safari/iOS and Firefox should be checked, especially `mask-composite` on the hatching mask (a `-webkit-` fallback is included) and `mix-blend-mode` on masked images.
- **Real devices.** Touch behavior was emulated in Chrome; test on a real iPhone/Android for the peek glance and scroll feel.
- **Fonts.** These come from Google Fonts at runtime. Self-hosting them would remove the third-party request.
- **Structured data.** Deliberately omitted until an official launch with owner approval.
- **Lenis.** On for desktop fine pointers. `?smooth=0` turns it off if any instability shows on a specific setup.
- **Dark chapter.** It departs from the Phase 0 "no dark mode" rule because you requested it. It's scoped to Visit + footer, and its tokens are documented in the design-system addendum.
- **Pinned menu images.** In pinned mode, all six items' layers load when the menu approaches (they share one stage). Deferring items 2–6 until the previous item resolves would save ~1 MB on desktop.
