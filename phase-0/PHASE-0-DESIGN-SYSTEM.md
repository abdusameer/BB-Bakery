# Phase 0 — Design System

One resolved system: warm paper, graphite, refined serif type, and real color only inside photographs. Every token below is meant to be copied directly into Phase 1 CSS custom properties.

---

## 1. Color

| Token | Hex | Role | Contrast on `paper` |
| --- | --- | --- | --- |
| `--paper` | `#F4EFE6` | Page field (≈80% of any viewport) | — |
| `--paper-2` | `#EAE3D6` | Recessed panels, hours block, image placeholders | — |
| `--paper-3` | `#DCD3C3` | Hairline fills, pressed states | — |
| `--graphite-900` | `#1E1C19` | Body text, headings, primary button fill | **14.84 : 1** |
| `--graphite-800` | `#2B2825` | Drawn lines, nav line, character | 12.80 : 1 |
| `--graphite-600` | `#57524B` | Secondary text, captions | **6.76 : 1** (AA body) |
| `--graphite-500` | `#6B655D` | Tertiary text (≥14 px only) | 5.03 : 1 (AA body) |
| `--graphite-400` | `#8A847B` | Construction lines, crop marks, disabled borders. **Not for text** | 3.24 : 1 (UI/graphics only) |
| `--graphite-300` | `#B3ADA3` | Faint hatching, texture tint. Decorative only | 1.95 : 1 |
| `--stamp` | `#A3322B` | Status only: sold-out stamp, "owner to confirm" marker dot, error text | **6.01 : 1** |

Rules
- There is no other accent. Warmth comes from photographs of bread.
- Text never uses `--graphite-400` or lighter.
- `--stamp` never takes up more than a small mark or a single word. It never fills a background.
- **Addendum (Phase 1, user request):** a single dark **"after hours"** chapter (Visit + footer) uses scoped tokens: night `#17130F`, night-2 `#221C17`, text `#F4EFE6` (16.1:1), secondary `#CFC5B6` (10.8:1), tertiary `#B6AC9D` (8.3:1), hairlines `#7E7468` (4.0:1, lines only), stamp `#EE9280` (8.0:1), plus crust-gold glow `rgb(214,146,72)` for the procedural light folds. Everything else stays paper.
- Site-wide dark mode is **not** offered. The concept is a physical paper page. The page sets `color-scheme: light` and an explicit background so OS dark mode can't invert it into illegibility.

## 2. Typography

| Family | Role | Weights | Source |
| --- | --- | --- | --- |
| **Young Serif** | Display: H1, H2, product names, big numerals | 400 | Google Fonts (OFL) |
| **Hanken Grotesk** | Reading and UI: body, nav, buttons, labels, hours | 400, 500, 600 | Google Fonts (OFL) |
| **Nanum Pen Script** | Margin notes only, 1–4 words, always decorative or duplicated in real text | 400 | Google Fonts (OFL) |
| Gowun Batang / Noto Sans KR | Reserved for future Korean product names | 400/700 · 400/500 | Google Fonts (OFL) |

### Fluid scale (rem = 16 px)

| Token | Use | Size | Line height | Tracking |
| --- | --- | --- | --- | --- |
| `--t-display` | H1 "BB's Bakery" (≥768) | `clamp(3.25rem, 0.5rem + 10.8vw, 10.25rem)` → 164 @1440 · 146 @1280 · 119 @1024 · 91 @768 | 0.92 | −0.02em |
| `--t-display-m` | H1 (<768) | `clamp(3.4rem, 1rem + 15vw, 5.25rem)` → 80 @430 · 75 @390 · 70 @360 | 0.92 | −0.02em |
| `--t-h2` | Section titles | `clamp(2.25rem, 1.4rem + 3.4vw, 4.75rem)` | 1.0 | −0.015em |
| `--t-h3` | Menu item name | `clamp(1.875rem, 1.2rem + 2.6vw, 3.75rem)` | 1.02 | −0.01em |
| `--t-title` | Info headings (Hours, Address) | `clamp(1.25rem, 1.1rem + 0.6vw, 1.625rem)` | 1.2 | 0 |
| `--t-body-l` | Lead paragraphs | `clamp(1.125rem, 1.05rem + 0.35vw, 1.3125rem)` | 1.55 | 0 |
| `--t-body` | Body | `clamp(1rem, 0.97rem + 0.12vw, 1.0625rem)` | 1.6 | 0 |
| `--t-label` | Eyebrows, nav, tags | `0.8125rem` / 600 / uppercase | 1.2 | 0.12em |
| `--t-note` | Nanum Pen notes | `clamp(1.375rem, 1.2rem + 0.5vw, 1.75rem)` | 1.1 | 0 |
| `--t-small` | Legal, captions | `0.8125rem` | 1.45 | 0.01em |

Rules
- Line length is 38–68 characters for body text (`max-width: 34rem`), and 12–18 characters per line for H2s.
- `text-wrap: balance` on headings, `text-wrap: pretty` on paragraphs.
- The wordmark is **typeset**, never generated: "BB's Bakery" in Young Serif with a real typographic apostrophe (’). A hand-drawn pencil underline sits beneath it as SVG.
- Nanum Pen Script is never used for hours, address, product names, prices, or navigation.

## 3. Space and grid

Spacing scale (px): `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128 · 160` → `--s-1 … --s-11`.

| Token | Value |
| --- | --- |
| `--gutter` (page side margin) | `clamp(16px, 4.5vw, 72px)` |
| `--col-gap` | `clamp(16px, 2vw, 32px)` |
| `--max` | `1360px` |
| `--section-pad` | `clamp(88px, 11vw, 176px)` block padding |
| `--header-h` | `72px` (≥768) · `60px` (<768) + `env(safe-area-inset-top)` |

Grid: 12 columns at ≥1024, 8 at 768–1023, 4 below 768. Named areas per section (see storyboards). The **margin column** is a recurring device: a narrow column (2–3 of 12) for pencil notes and small labels, like a notebook margin.

## 4. Breakpoints and layout matrix

Breakpoints are driven by content, not devices. Target test widths are in parentheses.

| Range | Name | Header | Character mode | Grid |
| --- | --- | --- | --- | --- |
| ≥1280 (1440, 1280) | `xl` | Full nav line, 4 items + Directions | Desktop rig (if fine pointer) | 12 |
| 1024–1279 (1024) | `lg` | Full nav line, 4 items; Directions becomes an icon + label | Desktop rig (fine) / touch rig (coarse) | 12 |
| 768–1023 (768) | `md` | Full nav line, 4 items, compact spacing; wordmark shortens to "BB's" | Touch rig (tablets are coarse) | 8 |
| 480–767 (430) | `sm` | Compact header: wordmark · Menu · Visit · Index toggle | Mobile peek | 4 |
| <480 (390, 360) | `xs` | Compact header, same as `sm` | Mobile peek | 4 |

The character's *behavior* follows `(hover: hover) and (pointer: fine)`. Its *layout* follows width. A 1024 px touch tablet gets the hanging layout with the touch behavior.

## 5. Line work (the drawn layer)

| Token | Value | Use |
| --- | --- | --- |
| `--line` | `#2B2825` | All drawn lines |
| `--line-w-1` | `1px` | Crop marks, construction lines (`--graphite-400`) |
| `--line-w-2` | `1.5px` | Frames, arrows, underlines |
| `--line-w-3` | `2px` | Nav line, character contour at small sizes |
| Wobble | `feTurbulence baseFrequency .75, displacement .7` | Static only. **Never animated** (no jitter) |

Library of authored SVG marks (Phase 1 builds these as components): underline (3 variants) · circle-around · arrow short/long/curved · crop marks (4-corner) · steam curl (3) · crumb scatter · route dotted line · map pin · star-free "signature" dot.

"Frame-by-frame" imperfection comes from **2–3 pre-drawn variants of a line that swap once per state change**, never from continuous noise.

## 6. Texture

| Asset | Treatment | Budget |
| --- | --- | --- |
| Paper grain (`p0-04`) | Tiled body background, 1024 px WebP tile, `background-blend-mode: normal`. The tile *is* the paper color | ≤60 KB |
| Graphite marks (`p0-05`) | Individual marks cut into masks: hatching for the shading reveal, eraser stroke for the photo reveal, smudge behind the hero | ≤40 KB each |
| Flour / crumbs | Small cutouts near products only | ≤20 KB |

Texture is never placed over body text, hours, address, or controls.

## 7. Components

**Mobile Index sheet.** The toggle is a `<button aria-expanded aria-controls="site-index">`. The sheet is `role="dialog" aria-modal="true" aria-label="Site index"`. While it's open, `main` and `footer` are `inert` and focus is trapped inside. Escape or ✕ closes it, and focus returns to the toggle. Links close the sheet, then scroll.

**Header / nav line.** Wordmark left. Items on the right *sit on* one long pencil line that spans the header width. The active item gets a short drawn underline, and the character hangs beneath it. Items are real `<a href="#menu">` links, 44 px minimum height, `aria-current="true"` on the active one. The header stays pinned with a paper background, and its bottom edge is the line itself.

**Buttons** (no pills)
- *Primary*: "Get directions" (header and Visit), and "See the menu" in the Opening. Graphite-900 fill, paper text, 2 px radius, 52 px tall, 0 24 px padding, arrow icon. Hover: fill becomes graphite-800 and the arrow moves 3 px. Active: moves down 1 px. Focus: 3 px graphite-900 outline, 3 px offset.
- *Secondary*: "See the menu". Transparent, with an SVG pencil-box border (a slightly irregular rectangle path). Text graphite-900, 52 px tall. Hover: a second pass of the box line draws over the first (150 ms).
- *Text link*: 1 px underline at 0.2em offset. Hover: a pencil underline draws.
- *Disabled* (future): graphite-400 border, graphite-500 text, `aria-disabled`, not focus-trapped.

**Labels and tags** (square corners, 1 px border)
- `Sample selection`: outlined label, uppercase `--t-label`.
- `Concept image`: small paper chip in the bottom-left of every generated *depiction* (bread, drinks, scenes). 12 px / 600, graphite-900 on paper at 92% opacity. **Mandatory.** Non-depictive textures (paper grain, graphite marks) carry no chip and are disclosed in the footer credits instead.
- `Owner to confirm`: dashed 1 px graphite-600 outline with a stamp-red dot. Used in the concept to show provisional content.
- Future states, designed now: `Sold out today` (stamp-red 2 px border, rotated −3°, stamp texture), `Preorder` (outlined), `Today` (graphite fill). These are rendered only from real data, never hard-coded.

**Sketch-to-photo figure.** A stable `aspect-ratio` box (4:5 portrait default, 16:10 landscape for the hero) holding four layers: SVG line drawing, shaded graphite raster, photograph, and mask. It includes a `<figcaption>` (product name, "Concept image" chip) and complete alt text on the photo.

**Margin note.** Nanum Pen Script, graphite-600, with an optional drawn arrow. Always `aria-hidden="true"` *unless* it is the only carrier of meaning, in which case the same words appear in normal text.

**Info rows (Visit).** Solar line icon (20 px, graphite-800) + label + value. The value is selectable text, and hours use `<time>` elements.

**Image placeholder (owner photo needed).** Paper-2 fill, crop marks, a centered graphite line icon, and the text "Owner photo: *Patio*". It keeps the final aspect ratio so nothing shifts when the real photo arrives.

## 8. Iconography

Solar **Linear** set via Iconify, inlined as SVG (license CC BY 4.0, credited in the footer source comment): map point, clock, bag (takeout), wheelchair (accessibility), arrow up-right, hamburger, close. Icons are 1.5 px strokes at 20–24 px, `currentColor`, and `aria-hidden` next to a visible label. The drawn layer never replaces an interface icon.

## 9. Focus, states, and targets

- Focus ring: `outline: 3px solid var(--graphite-900); outline-offset: 3px;` on everything interactive. It's never removed, and a lighter drawn underline is never swapped in for it.
- Minimum target: 44 × 44 px (48 × 48 for the mobile Index toggle).
- Hover is only ever an extra. Every hover-revealed thing is also visible or reachable without hover.

## 10. Motion tokens (detail in `PHASE-0-MOTION-SPEC.md`)

| Token | Value |
| --- | --- |
| `--dur-micro` | 160 ms |
| `--dur-ui` | 220 ms |
| `--dur-reveal` | 600 ms |
| `--dur-draw` | 900 ms (per stroke group) |
| `--ease-out` | `cubic-bezier(.22,.61,.36,1)` ≈ `power2.out` |
| `--ease-in` | `cubic-bezier(.55,.06,.68,.19)` ≈ `power2.in` |
| `--ease-draw` | `cubic-bezier(.45,.05,.35,1)` ≈ `power1.inOut` |
| Word stagger | 60 ms desktop · 40 ms mobile |
