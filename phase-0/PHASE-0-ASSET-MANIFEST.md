# Phase 0 — Asset Manifest

**Rule:** nothing generated is documentary. Every generated *depiction* is **concept media** and must show a visible "Concept image" (or "Concept sketch") chip wherever it appears. Non-depictive textures (#04 paper, #05 graphite marks) are exempt from chips and disclosed in the footer credits instead. None of it depicts BB's real products, staff, storefront, interior, murals, or patio.

Generator: **Higgsfield**, model `gpt_image_2_5` (GPT Image 2.5, variant *flare*), quality `high`, resolution `2k`, project "BB's Bakery — Bakery Sketchbook concept" (`57c0fbb2-4c7f-47f1-abb4-f14c3f57f66d`). Generated 2026-09-28 UTC. Cost ≈ 2.75 credits each, 10 images ≈ 27.5 credits. No purchases.

Originals: `assets/generated/*.png`. Lightweight board copies (1600 px JPEG): `assets/generated/web/`.

---

## Generated concept media

| # | File | Job ID | Section / purpose | Type | Dimensions | Use | Replace before launch? |
| - | --- | --- | --- | --- | --- | --- | --- |
| 01 | `p0-01-hero-desktop-plate.png` | `470fada6-bf7c-417c-bdb7-e5350f59fb1b` | Opening: frozen mid-transition hero plate (desktop) | Concept image | 2688 × 1520 | Desktop | **Yes.** Replace with an owner photo of a real BB's loaf plus a hand-drawn overlay. The loaf shown is a generic country loaf |
| 02 | `p0-02-hero-mobile-plate.png` | `0b43382b-f7fe-4df7-884c-27d75c8abe85` | Opening: mobile hero plate | Concept image | 1520 × 2688 | Mobile | **Yes**, as above |
| 03 | `p0-03-saltbread-photo.png` | `0e37285e-7c74-4f02-9942-e0b2a5032241` | Menu: transition end frame (photograph stand-in) | Concept image | 1792 × 2240 | Both | **Yes.** Needs a photo of BB's actual salt bread, same framing |
| 04 | `p0-04-paper-texture.png` | `4fe0aff8-46c2-4ec6-857f-4bd621151af9` | Global paper background | Concept texture | 2048 × 2048 | Both (tile) | No. A texture, not a depiction. Can ship |
| 05 | `p0-05-graphite-marks.png` | `609720f5-c26e-4bcb-baf2-0cd6f9114c70` | Masks and brushes: hatching reveal, eraser sweep, smudge | Concept texture | 2048 × 1360 | Both | No. Cut into masks in Phase 1 |
| 06 | `p0-06-bread-sketch-sheet.png` | `c375f3a7-1f3e-4758-bc63-28518a5a8d45` | Story sketch and drawn-layer register reference | Concept sketch | 2048 × 1360 | Desktop D6, mobile board strip, Phase 1 Story crop | Optional. Ideally replaced by BB's own artist's drawings |
| 07 | `p0-07-menu-frame-plate.png` | `7150cdc4-cf98-4d54-9432-bc9136663fbe` | Menu direction frame; Media "Bread" slot stand-in | Concept image | 2688 × 1520 | Both | **Yes** in Media. OK as a Phase 0 direction frame |
| 08 | `p0-08-visit-frame-plate.png` | `0ddb19e6-529f-4bdc-a564-bfa688f093c4` | Visit mood frame (the production map is authored SVG) | Concept image | 2688 × 1520 | Desktop moodboard §12 only | Not used on the site |
| 09 | `p0-09-saltbread-outline.png` | `b7d7fb2c-1ee1-40f1-9e2b-b1edbcb964f9` | Menu transition, stage 1 (contour); made from #03 | Concept sketch | 1792 × 2240 | Both | **Yes.** Redraw from the real photo |
| 10 | `p0-10-saltbread-shaded.png` | `a1b9ad3e-b11d-4894-9d62-b0f6731ce48f` | Menu transition, stage 2 (graphite); made from #03 | Concept sketch | 1792 × 2240 | Both | **Yes**, as above |

**Alignment note (#03, #09, #10):** measured bread bounding boxes (px): photo center (910, 1134), width 1092 · outline center (892, 1108), width 1080 · shaded center (924, 1140), width 1120. Phase 1 should shift the outline by (+18, +26) and scale the shaded frame by 0.975 about its center before export, so all three register.

**Paper integration note:** every photo layer is multiplied onto the page paper. Phase 1 should white-point each image (map its paper background to #FFFFFF per channel) so `mix-blend-mode: multiply` leaves no visible rectangle.

### Prompts (verbatim)

Shared style preamble (used byte-for-byte in #01, #02, #07; #06 and #08 use the variants recorded verbatim in their own entries below):

> Concept art direction for an unofficial bakery website mockup, sketchbook world. Warm uncoated cotton paper, off-white with a faint cream warmth, visible fibrous tooth. Graphite pencil drawing in charcoal and soft grays with imperfect, varied line weight, loose confident construction lines and light hatching. Wherever real bread appears it is natural-light editorial food photography with true golden-brown crust color; everything else stays monochrome graphite on paper. Calm editorial composition, generous negative space. Absolutely no text, letters, numbers, logos, signage, labels, or watermarks.

<details><summary>#01 hero desktop</summary>

[preamble] Scene: straight-down overhead view of a large sheet of warm paper. Positioned in the right half of the frame, a round rustic country loaf with a floured, cross-scored crust is shown mid-transformation: its left side is still an unfinished graphite pencil drawing (contour strokes, a faint construction circle, cross-hatching) and toward its right side the drawing resolves seamlessly into a real photographed loaf with genuine crust texture and color. A few real flour specks and crumbs scattered near the loaf; faint pencil-drawn steam curls rising above it; a short worn graphite pencil lying near the lower right edge. The entire left 45 percent of the frame is empty paper reserved for typography. Soft window daylight from the upper left, gentle natural shadows. — `16:9`
</details>

<details><summary>#02 hero mobile</summary>

[preamble] Scene: vertical phone-screen composition, straight-down overhead view of warm paper. In the lower-middle of the frame, a round rustic country loaf with a floured, cross-scored crust is shown mid-transformation: its upper-left portion is still an unfinished graphite pencil drawing (contour strokes, construction circle, hatching) and it resolves downward into a real photographed loaf with genuine crust texture and color. Faint pencil-drawn steam curls rise above it. A few real crumbs and flour specks. The top 42 percent of the frame is empty paper reserved for typography. Soft daylight, gentle natural shadow. — `9:16`
</details>

<details><summary>#03 salt bread photo</summary>

Concept art direction for an unofficial bakery website mockup, sketchbook world. Warm uncoated cotton paper, off-white with a faint cream warmth, visible fibrous tooth. Natural-light editorial food photography with true golden-brown crust color; everything other than the bread stays plain paper. Calm editorial composition, generous negative space. Absolutely no text, letters, numbers, logos, signage, labels, or watermarks. Subject: a single Korean-style salt bread roll (a glossy golden rolled crescent with visible spiral layers, a crisp flat golden base, and a few flakes of coarse salt on top) resting on plain warm paper. Three-quarter overhead angle, the roll centered with wide empty margins on all sides and fully inside the frame, horizontal orientation. Soft natural window light from the upper left, a subtle realistic contact shadow. No props, no crumbs, no plate. — `4:5`
</details>

<details><summary>#04 paper texture</summary>

Flat, perfectly evenly lit high-resolution scan of a sheet of warm off-white cotton drawing paper with a faint cream warmth. Subtle fibrous tooth and very faint natural mottling only. No objects, no marks, no pencil lines, no folds, no vignette, no shadows, no border. Uniform texture edge to edge suitable for tiling. No text, no watermark. — `1:1`
</details>

<details><summary>#05 graphite marks</summary>

Flat, evenly lit scan of plain white drawing paper holding an assortment of isolated graphite pencil marks to be used as texture brushes: three soft tonal shading patches of different darkness, two cross-hatching swatches, one smudged finger-blended patch, two eraser strokes cutting cleanly through dark graphite, a small scatter of eraser crumbs, two loose scribble loops, and one long confident underline stroke. Each mark separated by generous white space. Monochrome gray graphite only. No text, letters, numbers, drawings of objects, or watermark. — `3:2`
</details>

<details><summary>#06 bread sketch sheet</summary>

Concept art direction for an unofficial bakery website mockup, sketchbook world. Warm uncoated cotton paper, off-white with a faint cream warmth, visible fibrous tooth. Graphite pencil drawing in charcoal and soft grays with imperfect, varied line weight, loose confident construction lines and light hatching. Calm editorial composition, generous negative space. Absolutely no text, letters, numbers, logos, signage, labels, or watermarks.

A sketchbook study page: six separate graphite pencil drawings of Korean bakery breads, arranged loosely in two rows of three with clear empty paper between each: a rolled salt bread roll, a round loaf with a scored top, a twisted sugar-dusted doughnut, a croissant, a soft pull-apart milk bread loaf, and a round filled bun. Each drawn with confident contour lines and light hatching for volume, a few crumbs and a small steam curl here and there. Drawings only, fully monochrome graphite, no color. — `3:2`
</details>

<details><summary>#07 menu frame plate</summary>

[preamble] Scene: straight-down overhead view of warm paper. Along a gentle diagonal in the right 60 percent of the frame sit three real photographed pastries spaced well apart: a glossy salt bread roll, a twisted sugar-dusted doughnut, and a small round soft bun. Beside each real pastry, drawn directly on the paper, is a loose graphite pencil sketch of the same pastry, linked to it by a single hand-drawn pencil arrow. One pastry is loosely circled in pencil. The left 40 percent of the frame is empty paper for typography. Soft daylight, gentle natural shadows. — `16:9`
</details>

<details><summary>#08 visit frame plate</summary>

Concept art direction for an unofficial bakery website mockup, sketchbook world. Warm uncoated cotton paper, off-white with a faint cream warmth, visible fibrous tooth. Graphite pencil drawing in charcoal and soft grays with imperfect, varied line weight, loose confident construction lines and light hatching. Wherever real objects appear they are natural-light editorial photography with true color; everything else stays monochrome graphite on paper. Calm editorial composition, generous negative space. Absolutely no text, letters, numbers, logos, signage, labels, or watermarks.

Scene: straight-down overhead view of warm paper. On the right side, a plain unbranded kraft paper takeout bag with the top of a crusty loaf peeking out, and next to it a plain unbranded paper coffee cup. Running beneath and around them, drawn directly on the paper in graphite, a simple abstract street grid of ruled pencil lines, a dotted walking route curving toward the bag, and a small hand-drawn map pin. The left half of the frame is empty paper for typography. Soft late-afternoon daylight, gentle shadows. — `16:9`
</details>

<details><summary>#09 salt bread outline (reference: job #03)</summary>

Image 1 is the content anchor. Redraw Image 1 as an unfinished graphite pencil line drawing on the same plain warm off-white paper. Keep the salt bread roll at exactly the same position, scale, angle and silhouette as in Image 1, so the drawing could be overlaid on the photograph. Only confident contour lines and the spiral layer lines, with a few faint construction strokes and one faint construction ellipse; no tonal shading, no hatching fill, no color at all. The paper background stays identical and empty. No text, letters, numbers, or watermark. — `4:5`
</details>

<details><summary>#10 salt bread shaded (reference: job #03)</summary>

Image 1 is the content anchor. Redraw Image 1 as a finished, fully shaded graphite pencil drawing on the same plain warm off-white paper. Keep the salt bread roll at exactly the same position, scale, angle and silhouette as in Image 1, so the drawing could be overlaid on the photograph. Tonal graphite shading and directional hatching describe the volume of each spiral layer; the glossy highlights are left as bare paper; the salt flakes are small untouched white specks; a soft graphite cast shadow matches the photograph. Completely monochrome gray graphite, no color. The paper background stays identical and otherwise empty. No text, letters, numbers, or watermark. — `4:5`
</details>

**Validation:** all 10 were inspected. They contain no text or letterforms, no logos, no people, and no watermark. None required a correction pass.

---

## Authored (non-generated) assets

| File | What | Editable | Notes |
| --- | --- | --- | --- |
| `assets/svg/sogeum-character.svg` | Guide character master, neutral pose | Yes (SVG) | Generated from `boards/sogeum.js` |
| `boards/sogeum.js` | Character rig and pose builder (10 poses) | Yes (JS) | Port to the Phase 1 component |
| `boards/board.css` | Board tokens mirroring the design system | Yes | |
| `boards/storyboard-desktop.html` | Desktop frames D1–D8 | Yes | Static mockup, not production |
| `boards/storyboard-mobile.html` | Mobile frames M1–M7 | Yes | Static mockup |
| `boards/moodboard-desktop.html` / `moodboard-mobile.html` | Moodboards | Yes | |
| `boards/character-pose-sheet.html` | Pose sheet | Yes | |
| Pencil map (in storyboard D8/M6) | Street sketch, route and pin | Yes (SVG) | Not to scale; labels only "W Olympic Blvd" |

## Exported boards (PNG)

| File | Size |
| --- | --- |
| `moodboards/desktop-moodboard.png` | 1800 × 1560 |
| `moodboards/mobile-moodboard.png` | 1800 × 1040 |
| `boards/character-pose-sheet.png` | 1600 × 1170 |
| `storyboards/desktop/d1–d8.png` | 1440 × 900 each |
| `storyboards/mobile/m1–m7.png` | 780 × 1688 each (390 × 844 @2x) |

## Third-party references (not used as media)

The bakery's menu board, logo, and product phone photos (from @bbsbakeryla), and two third-party YouTube frames, were **viewed for reference only**. None were downloaded into the project or reproduced. See the Truth Pack, "Visual evidence".

## Fonts and icons

Young Serif, Hanken Grotesk, Nanum Pen Script (SIL OFL, Google Fonts). The Solar icon set via Iconify (CC BY 4.0) is planned for Phase 1. The board icons are simple hand-authored equivalents.
