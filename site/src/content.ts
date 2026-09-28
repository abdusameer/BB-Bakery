/*
  Site content. Every entry carries its source tier (see phase-0/PHASE-0-TRUTH-PACK.md):
    A     = verified Yelp listing fact
    B     = mentioned only in customer reviews (provisional; shown as "sample selection")
    owner = placeholder waiting for the owner's own content
    ui    = neutral interface / disclosure copy that makes no business claim
  Do not add prices, phone numbers, social links, ordering, ingredients, dietary claims,
  availability, founder history, or testimonials here without written owner confirmation.
*/

export type Tier = 'A' | 'B' | 'owner' | 'ui';

export const business = {
  tier: 'A' as Tier,
  name: 'BB’s Bakery',
  category: 'Bakery · Coffee & Tea',
  street: '3130 W Olympic Blvd, Suite 100',
  cityLine: 'Los Angeles, CA 90006',
  hoursLabel: 'Open daily · 8:00 AM – 7:00 PM',
  hoursDays: 'Every day',
  opens: '08:00',
  closes: '19:00',
  hoursRange: '8:00 AM – 7:00 PM',
  services: ['Takeout available', 'Wheelchair accessible'],
  description:
    'BB’s Bakery specializes in premium, handcrafted bread, baked fresh daily with high-quality ingredients, with the aim of an exceptional and authentic taste.'
};

const destination = encodeURIComponent(`${business.street}, ${business.cityLine}`.replace('’', "'"));
export const links = {
  // Built only from the verified address. No invented URLs.
  googleDirections: `https://www.google.com/maps/dir/?api=1&destination=${destination}`,
  appleDirections: `https://maps.apple.com/?daddr=${destination}`
};

export const nav = [
  { id: 'menu', label: 'Menu' },
  { id: 'story', label: 'Story' },
  { id: 'media', label: 'Media' },
  { id: 'visit', label: 'Visit' }
] as const;

export type SectionId = (typeof nav)[number]['id'];

export type MenuItem = {
  id: string;
  tier: Tier;
  name: string;
  /** Alt text describes only what the concept picture shows. */
  alt: string;
  /** image base name inside /img (built by scripts/build-images.mjs) */
  img: string;
  /** Reserved for real owner data. Not rendered while undefined. */
  status?: 'today' | 'sold-out' | 'preorder';
};

export const menuIntro = {
  eyebrow: 'Menu · Sample selection',
  title: 'Breads people talk about',
  body: 'A few breads and one drink that customers have mentioned. It’s a sample, not the full menu. Ask in store for today’s bread.',
  itemNote: 'Mentioned in customer reviews',
  endNote: 'The full menu will appear here once the bakery shares it.'
};

export const menuItems: MenuItem[] = [
  { id: 'salt-bread', tier: 'B', name: 'Salt bread', img: 'salt-bread',
    alt: 'Concept image of salt bread: a glossy golden rolled bun with a few flakes of coarse salt, on plain paper.' },
  { id: 'garlic-cream-cheese', tier: 'B', name: 'Garlic cream cheese bread', img: 'garlic-cc',
    alt: 'Concept image of garlic cream cheese bread: a round bun cut into six wedges with cream cheese between them, flecked with green herbs.' },
  { id: 'cranberry-cream-cheese', tier: 'B', name: 'Cranberry cream cheese bread', img: 'cranberry-cc',
    alt: 'Concept image of cranberry cream cheese bread: an oval loaf with red cranberries, cut in half to show a white cream cheese center.' },
  { id: 'twisted-doughnut', tier: 'B', name: 'Cream-filled twisted doughnut', img: 'twist-doughnut',
    alt: 'Concept image of a cream-filled twisted doughnut: a long sugar-dusted twist split along the top and filled with white cream.' },
  { id: 'croissant-sandwich', tier: 'B', name: 'Croissant sandwich', img: 'croissant-sandwich',
    alt: 'Concept image of a croissant sandwich: a sliced croissant with a layer of green lettuce and sliced cheese.' },
  { id: 'sesame-latte', tier: 'B', name: 'Oat black sesame latte', img: 'sesame-latte',
    alt: 'Concept image of an oat black sesame latte: a white cup of pale gray foam with a latte-art heart and a few black sesame seeds.' }
];

export const story = {
  eyebrow: 'The notebook',
  title: 'Baked fresh, every day',
  notes: ['by hand', 'every day', 'good ingredients'],
  ownerTitle: 'The people behind the bread',
  ownerBody: 'This space is saved for the owners’ own story, in their words.'
};

export type MediaSlot = {
  id: string;
  label: string;
  kind: 'concept' | 'owner';
  img?: string;
  alt?: string;
  hint?: string;
};

export const media = {
  eyebrow: 'From the shop',
  title: 'Around the shop',
  body: 'Frames for the bakery’s own photos. Concept images are labeled; empty frames are waiting for real ones.',
  slots: [
    { id: 'murals', label: 'Murals', kind: 'owner', hint: 'the bread drawings on the wall' },
    { id: 'bread', label: 'Bread', kind: 'concept', img: 'hero-loaf',
      alt: 'Concept image of a round country loaf with a floured, cross-scored crust, seen from above on paper.' },
    { id: 'patio', label: 'Patio', kind: 'owner' },
    { id: 'coffee', label: 'Coffee', kind: 'concept', img: 'sesame-latte',
      alt: 'Concept image of a white cup of pale gray latte with a latte-art heart.' },
    { id: 'packaging', label: 'Packaging', kind: 'owner' },
    { id: 'interior', label: 'Interior', kind: 'owner' },
    { id: 'storefront', label: 'Storefront', kind: 'owner' }
  ] as MediaSlot[]
};

export const visit = {
  eyebrow: 'Visit',
  title: 'Visit BB’s',
  mapCaption: 'Pencil sketch, not to scale.',
  futureContact: 'Phone · social links: to be added'
};

export const footer = {
  notice: 'Unofficial website concept.',
  noticeBody: 'Not affiliated with, commissioned by, or approved by BB’s Bakery.',
  mediaNote: 'Images marked “Concept image” were generated for this mockup and do not show BB’s actual products or shop.',
  credits: 'Icons: Solar icon set (CC BY 4.0). Fonts: Young Serif, Hanken Grotesk, Nanum Pen Script (SIL OFL).'
};
