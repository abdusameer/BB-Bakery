# Phase 0 — Content Map

Every visible string, its section, its source tier (see Truth Pack), and how it's treated. **A** = verified listing · **B** = customer-reported (provisional) · **—** = neutral interface or disclosure copy that makes no claim · **OWNER** = placeholder waiting for owner content.

---

## Document outline (headings)

```
H1  BB’s Bakery                                   (Opening)
H2  Breads people talk about                      (Menu)
    H3  Salt bread
    H3  Garlic cream cheese bread
    H3  Cranberry cream cheese bread
    H3  Cream-filled twisted doughnut
    H3  Croissant sandwich
    H3  Oat black sesame latte
H2  Baked fresh, every day                        (Story)
    H3  The people behind the bread               (OWNER placeholder)
H2  Around the shop                               (Media)
H2  Visit BB’s                                     (Visit)
    H3  Address · H3 Hours · H3 Good to know
```

Landmarks: `header` (banner, with `nav aria-label="Primary"`) · `main` · `footer` (contentinfo). A skip link, "Skip to content", targets `#main`.

---

## Global

| Element | Copy | Tier | Notes |
| --- | --- | --- | --- |
| `<title>` | BB’s Bakery — Handcrafted bread in Los Angeles (concept) | A + — | "(concept)" stays in the title |
| meta robots | `noindex, nofollow` | — | Required |
| meta description | Unofficial website concept for BB’s Bakery, 3130 W Olympic Blvd, Los Angeles. | A + — | |
| Wordmark | BB’s Bakery (Young Serif, typeset) | A | Placeholder until the owner's logo file arrives |
| Nav | Menu · Story · Media · Visit | — | Locked labels |
| Header action (≥1024) | Directions | — | External Google Maps link built from the verified address |
| Skip link | Skip to content | — | |

## 1. Opening

| Element | Copy | Tier |
| --- | --- | --- |
| Eyebrow | Bakery · Coffee & Tea · Los Angeles | A |
| H1 | BB’s Bakery | A |
| Lead | Handcrafted bread, baked fresh every day. | A |
| Hours line | Open daily · 8:00 AM – 7:00 PM | A |
| Primary action | See the menu → `#menu` | — |
| Secondary action | Plan a visit → `#visit` | — |
| Margin note (Nanum Pen, `aria-hidden`) | "fresh today" (arrow to the loaf) | Restates A |

Other decorative pen notes used on the page, all `aria-hidden`, no claims: "study no. 01…06" (Menu figures), "real photos go here" (Media).
| Image chip | Concept image | — |

## 2. Menu (sample selection)

| Element | Copy | Tier |
| --- | --- | --- |
| Eyebrow | Menu · Sample selection | — |
| H2 | Breads people talk about | B (framing) |
| Intro | A few breads and one drink that customers have mentioned. It's a sample, not the full menu. Ask in store for today's bread. | B + — |
| Status tag | Sample selection | — |
| Per item: H3 | *Product name exactly as reported* | B |
| Per item: note | Mentioned in customer reviews | — |
| Per item: chip | Concept image | — |
| Per item: data slots (hidden until real data) | `status: today \| sold-out \| preorder` · `price` · `description` | OWNER |
| End note | The full menu will appear here once the bakery shares it. · tag **Owner to confirm** | OWNER |

Featured items (only those with a usable visual): Salt bread · Garlic cream cheese bread · Cranberry cream cheese bread · Cream-filled twisted doughnut · Croissant sandwich · Oat black sesame latte.
**Not written:** prices, ingredients, sweetness or saltiness, "best seller", "signature", availability, dietary notes.

## 3. Story

| Element | Copy | Tier |
| --- | --- | --- |
| Eyebrow | The notebook | — |
| H2 | Baked fresh, every day | A |
| Body | BB’s Bakery specializes in premium, handcrafted bread, baked fresh daily with high-quality ingredients, with the aim of an exceptional and authentic taste. | A (paraphrase) |
| Margin notes (`aria-hidden`, duplicated in the body) | "by hand" · "every day" · "good ingredients" | Restate A |
| H3 | The people behind the bread | OWNER |
| Placeholder body | This space is saved for the owners' own story, in their words. | OWNER · tag **Owner to confirm** |

**Not written:** founders, dates, origin, recipes, tradition, sourcing, Korea references.

## 4. Media

| Element | Copy | Tier |
| --- | --- | --- |
| Eyebrow | From the shop | — |
| H2 | Around the shop | — |
| Intro | Frames for the bakery's own photos. Concept images are labeled; empty frames are waiting for real ones. | — |
| Slot labels | Bread · Coffee (concept) · Murals · Patio · Packaging · Interior · Storefront | Slots only |
| Empty-slot text | "Owner photo: *Murals*" (etc.). The Murals and Patio slots also carry "Mentioned by customers · to confirm", because both features are known only from reviews (Tier B) | OWNER / B |

Generated images may fill **Bread** slots only (labeled). Murals, Packaging, Interior, Storefront and Patio are **owner photo only** and are never generated.

## 5. Visit

| Element | Copy | Tier |
| --- | --- | --- |
| Eyebrow | Visit | — |
| H2 | Visit BB’s | — |
| H3 Address | BB’s Bakery · 3130 W Olympic Blvd, Suite 100 · Los Angeles, CA 90006 (`<address>`) | A |
| H3 Hours | Every day · 8:00 AM – 7:00 PM (`<time>`) | A |
| H3 Good to know | Takeout available · Wheelchair accessible | A |
| Primary action | Get directions ↗ (Google Maps) | — |
| Secondary action | Open in Apple Maps ↗ | — |
| Map treatment caption | Pencil sketch, not to scale. | — |
| Future contact slots | "Phone · social links: to be added" with tag **Owner to confirm** | OWNER |

Directions URLs (built only from the verified address):
- Google: `https://www.google.com/maps/dir/?api=1&destination=3130%20W%20Olympic%20Blvd%20Suite%20100%2C%20Los%20Angeles%2C%20CA%2090006`
- Apple: `https://maps.apple.com/?daddr=3130%20W%20Olympic%20Blvd%20Suite%20100%2C%20Los%20Angeles%2C%20CA%2090006`

Both open in a new tab with `rel="noopener"` and a visible ↗ plus "(opens in a new tab)" visually-hidden text.

## Footer

| Copy | Tier |
| --- | --- |
| BB’s Bakery · 3130 W Olympic Blvd, Suite 100, Los Angeles, CA 90006 · Open daily 8:00 AM – 7:00 PM | A |
| **Unofficial website concept.** Not affiliated with, commissioned by, or approved by BB’s Bakery. | — |
| Images marked "Concept image" were generated for this mockup and do not show BB’s actual products or shop. | — |
| Icons: Solar icon set (CC BY 4.0). Fonts: Young Serif, Hanken Grotesk, Nanum Pen Script (SIL OFL). | — |

## Alt-text plan

| Image | Alt text pattern |
| --- | --- |
| Hero loaf (concept) | "Concept image: a round country loaf with a floured, cross-scored crust on paper, half pencil sketch and half photograph." |
| Menu photo (concept) | "Concept image of *salt bread*, a glossy golden rolled bun, on plain paper." *(describe only what the picture shows)* |
| Menu graphite and line layers | `alt=""` (decorative duplicates of the photo) |
| Reduced-motion pencil thumbnail | `alt=""` with visible caption "Pencil study" |
| Owner photos (future) | Written from the owner's photo. People are named only with permission. |
| Empty slots | No `<img>`. Visible text only |
| Pencil map | `role="img"` + `aria-label="Pencil sketch of the streets around the bakery, not to scale"` |
| Character | `aria-hidden="true"` |
| Texture | CSS background, no alt |

## Structured data

JSON-LD (`Bakery`) is **deliberately left out** of the concept. It would assert business facts on a page the business doesn't own. It gets added only at an official launch, with owner approval (neighborhood: Harvard Heights).
