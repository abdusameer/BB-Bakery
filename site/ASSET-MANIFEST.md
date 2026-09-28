# Asset Manifest (Phase 1, supersedes phase-0/PHASE-0-ASSET-MANIFEST.md for the site)

**Rule:** nothing generated is documentary. Every generated depiction on the site carries a visible **Concept image** or **Concept sketch** chip, and its alt text starts with "Concept image". None of it shows BB's real products, staff, shop, murals, patio, or packaging. Textures (paper, graphite) are non-depictive, carry no chip, and are disclosed in the footer.

Generator: Higgsfield · `gpt_image_2_5` · quality high · 2K · project "BB's Bakery — Bakery Sketchbook concept" (`57c0fbb2-4c7f-47f1-abb4-f14c3f57f66d`). No purchases. Nothing published.

## Authentic (documentary) media

**None.** There are no authentic BB's photographs on the site. Every slot that needs one (murals, patio, packaging, interior, storefront) is an empty, labeled "Owner photo" frame with the correct aspect ratio.

## Generated concept media used on the site

Sources live in `assets-src/generated/`. Processed web files live in `public/img/`, built by `npm run images` (white-point → align drawing to photo → AVIF/WebP).

| Site key | Photo (job) | Outline drawing (job) | Graphite drawing (job) | Source px | Used in | Replace before launch? |
| --- | --- | --- | --- | --- | --- | --- |
| `hero-loaf` | p1-11 `e0e9c623` | p1-21 `b9631321` | p1-22 `f08001b3` | 2048² | Opening hero; Media "Bread" slot | **Yes.** Real BB's loaf photo, and a hand-drawn line drawing traced from it |
| `salt-bread` | p0-03 `0e37285e` | p0-09 `b7d7fb2c` | p0-10 `a1b9ad3e` | 1792×2240 | Menu 01 | **Yes** |
| `garlic-cc` | p1-12 `8a04ae20` | p1-23 `b0b8d85b` | p1-24 `a936b108` | 1792×2240 | Menu 02 | **Yes** |
| `cranberry-cc` | p1-13 `552cbd6b` | p1-25 `86f4944b` | p1-26 `50d5753a` | 1792×2240 | Menu 03 | **Yes** |
| `twist-doughnut` | p1-14 `4dfcc3c1` | p1-27 `021dc7b6` | p1-28 `565fee5e` | 1792×2240 | Menu 04 | **Yes** |
| `croissant-sandwich` | p1-15 `eff2fdc9` | p1-29 `b7a34d6f` | p1-30 `757619e1` | 1792×2240 | Menu 05 | **Yes.** The filling shown is invented for the concept; the final trace is disabled because the drawing is posed differently |
| `sesame-latte` | p1-16 `9bf88acf` | p1-31 `b1432a32` | p1-32 `41b9b106` | 1792×2240 | Menu 06; Media "Coffee" slot | **Yes** |
| `story-sketch` | Phase 0 #06 `c375f3a7` (crop) | — | — | 560² crop | Story figure ("Concept sketch") | Optional. Better replaced by BB's own drawings |
| `paper-tile` | Phase 0 #04 `4fe0aff8` (mirrored 900 px tile) | — | — | 900² | Page background | No (texture) |

Full job IDs are in `phase-0/PHASE-0-ASSET-MANIFEST.md` (p0-*) and below (p1-*):
`e0e9c623-11cb-4655-acb2-7a4b484922ce` · `8a04ae20-5a10-4c14-9eb4-dd3441cc36ad` · `552cbd6b-5954-4b38-9ed9-589f3aa2235f` · `4dfcc3c1-641d-4aea-b34c-75beeeeac989` · `eff2fdc9-53f6-46d4-9cc2-81b32eefa73b` · `9bf88acf-29e4-4ab8-bb70-2cbbf9b22d5f` · `b9631321-2533-446a-a480-28e4355b8f5e` · `f08001b3-1f58-43f8-9518-97f67440ac34` · `b0b8d85b-2b53-4e69-ae7e-09e44ed9629b` · `a936b108-c3d2-40c9-a2fb-470de974db84` · `86f4944b-3e81-4186-9ddb-c07d68aeed44` · `50d5753a-0d5c-4952-8235-7325274233df` · `021dc7b6-5e40-4905-b9c6-eb4900d9e874` · `565fee5e-25ee-43c9-bf97-9a8440420433` · `b7a34d6f-e83a-4da1-8310-78eb61c7b89d` · `757619e1-cf20-439a-9ab0-8801c4a0401d` · `b1432a32-19db-4c36-87bf-e395c6d2b284` · `41b9b106-01b0-437c-aa37-4b3cca286d7d`

### Phase 1 prompts (verbatim)

**Product photos (p1-12 … p1-16)** share this preamble:

> Concept product photograph for an unofficial bakery website mockup. Plain warm off-white uncoated paper background with faint fibrous tooth, completely empty. Three-quarter overhead angle of about 45 degrees, subject centered and fully inside the frame with wide empty margins on all sides; the subject occupies about 55 percent of the frame width. Soft natural window light from the upper left, subtle realistic contact shadow. True natural food color. No props, no plate, no crumbs, no hands, no text, no letters, no numbers, no logos, no labels, no watermark.

Subjects, one per prompt:
- p1-12: "a Korean-style garlic cream cheese bread: a round soft bun cut into six wedges that open like petals, cream cheese filling visible between the wedges, the top glossy with garlic butter and flecked with chopped parsley."
- p1-13: "a soft oval bread loaf studded with dried cranberries, with a smooth golden top dusted lightly with flour, cut cleanly in half so one half faces the camera showing a soft crumb with red cranberries and a white cream cheese filling in the middle; the two halves sit slightly apart."
- p1-14: "a golden fried twisted doughnut, a long braided twist of dough lightly coated in fine sugar, split lengthwise along the top and generously filled with piped white cream, lying diagonally."
- p1-15: "a flaky golden butter croissant sliced horizontally and made into a simple sandwich with a visible layer of fresh green lettuce and sliced cheese, the top half resting slightly offset so the filling shows."
- p1-16 (subject ≈45% width; "no saucer, no spoon, no straw" added): "a plain unbranded matte white ceramic cup of hot black sesame oat latte, the smooth foam a soft pale ash-gray color with a simple poured latte-art heart and a light scattering of black sesame seeds on the foam."

**Hero loaf photo (p1-11), 1:1:**

> Concept product photograph for an unofficial bakery website mockup. Plain warm off-white uncoated paper background with faint fibrous tooth, completely empty. True natural food color, soft natural window light from the upper left, subtle realistic contact shadow. No props, no plate, no hands, no text, no letters, no numbers, no logos, no labels, no watermark. Subject: a single round rustic country loaf with a floured, deeply cross-scored crust (a four-way cross cut with open golden ears), seen from straight above. The loaf is centered and fully inside the frame with wide empty margins on all sides; it occupies about 60 percent of the frame width. A few tiny crumbs and flour specks on the paper near the loaf only.

**Outline drawings (p1-21, 23, 25, 27, 29, 31)**, with the matching photo job as the image reference:

> Image 1 is the content anchor. Redraw Image 1 as an unfinished graphite pencil line drawing on the same plain warm off-white paper. Keep the subject at exactly the same position, scale, angle and silhouette as in Image 1, so the drawing could be overlaid on the photograph. Only confident contour lines and the key interior lines of the form, with a few faint construction strokes and one faint construction ellipse [hero: circle]; no tonal shading, no hatching fill, no color at all. The paper background stays identical and empty. No text, letters, numbers, or watermark.

**Graphite drawings (p1-22, 24, 26, 28, 30, 32)**, with the matching photo job as the image reference:

> Image 1 is the content anchor. Redraw Image 1 as a finished, fully shaded graphite pencil drawing on the same plain warm off-white paper. Keep the subject at exactly the same position, scale, angle and silhouette as in Image 1, so the drawing could be overlaid on the photograph. Tonal graphite shading and directional hatching describe the volume and texture; the brightest highlights are left as bare paper; a soft graphite cast shadow matches the photograph. Completely monochrome gray graphite, no color. The paper background stays identical and otherwise empty. No text, letters, numbers, or watermark.

**Validation:** all 18 Phase 1 outputs were inspected. None has text, logos, people, or a watermark. No correction generations were needed.

## Processing (scripts/build-images.mjs)

| Step | What | Why |
| --- | --- | --- |
| White-point | Per-channel scale so paper × 0.965 (photos) / 0.94 (drawings) → #FFFFFF | `mix-blend-mode: multiply` then melts the frame into the page paper, with no rectangle |
| Register | Edge-map normalized cross-correlation (scale 0.82–1.2, ±26 px coarse, then refined) aligns each drawing to its photo | Sketch → photo registers during the scrub. Scores: shaded 0.88–0.92, outlines 0.56–0.82 |
| Export | Photos: AVIF q52 + WebP q78 at 600/1000/1400 (hero 700/1100/1500). Drawings: WebP at 600/1000 (hero 700/1100) | Responsive `srcset` + `sizes`. 73 files, 3.7 MB total, of which a first visit loads ~0.5 MB |
| Metadata | `src/generated/images.ts`: aspect ratio, subject center/size, final trace opacity, alignment report | Mask centers and construction ellipses follow the real subject |

## Authored (code) assets

| Asset | Where | Notes |
| --- | --- | --- |
| Guide character (salt-bread roll) | `src/components/Guide.tsx` | Editable SVG rig with `data-part` groups. Poses via CSS. Driven by `src/motion/guide.ts` |
| Mobile peek, sheet illustration, Visit finale | `Guide.tsx` (`PeekSVG`, `GuideSVG pose=…`) | Same geometry |
| Hero loaf vector drawing (contour, scoring, construction circle, steam) | `src/components/Opening.tsx` | Traced against the concept photo |
| Pencil line library (underlines, pencil box, crop marks, nav line, arrows) | `src/components/Pencil.tsx` | `pathLength=1` for dash drawing |
| Pencil street sketch (W Olympic Blvd, route, pin) | `src/components/Visit.tsx` | Not to scale. Labels only the verified street and suite |
| Favicon | `public/favicon.svg` | Simple roll mark (not BB's logo) |
| UI icons | `src/components/Icons.tsx` | Solar Linear set via Iconify (CC BY 4.0), inlined. The camera and gallery glyphs are simple authored equivalents |

## Procedural (code-drawn) media

| Asset | Where | Notes |
| --- | --- | --- |
| "After hours" atmosphere | `src/motion/atmosphereGL.ts` (WebGL shader), with `src/motion/atmosphere.ts` (Canvas 2D) as the fallback | Procedural light folds, fabric noise, grain and bloom in crust-gold tones taken from the bread photos. It's not an image file, and it depicts nothing real |

## Fonts

Young Serif, Hanken Grotesk, Nanum Pen Script. All SIL OFL, loaded from Google Fonts with `display=swap`.
