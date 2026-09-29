import { business } from '../content';
import { scrollToId } from '../lib/bus';
import { IconArrowDown, IconClock } from './Icons';
import { PencilBox, Underline } from './Pencil';
import { SketchFigure } from './SketchFigure';

/* Vector pencil drawing of the hero loaf, traced against the concept photo (0–100 box). */
const heroMarks = (
  <>
    <circle className="construct draw-path" pathLength={1} cx="50" cy="49" r="29.5" />
    <path className="draw-path stroke-a" pathLength={1} d="M50 21.6 C 35.4 22, 24.6 33.6, 24.8 49.4 C 24.8 65, 35.6 76.4, 50 76.2" />
    <path className="draw-path stroke-a" pathLength={1} d="M50 76.2 C 65 76.2, 75.6 64, 75.4 48 C 75.2 32, 64 21.2, 50 21.6" />
    <path className="draw-path stroke-b" pathLength={1} d="M49.2 22.8 C 45.8 34, 45.4 64, 48.6 75.2" />
    <path className="draw-path stroke-b" pathLength={1} d="M51.4 22.8 C 55 34, 55.6 64, 52 75.2" />
    <path className="draw-path stroke-b" pathLength={1} d="M26.2 47.6 C 38 43.2, 62 43.2, 74.6 47.2" />
    <path className="draw-path stroke-b" pathLength={1} d="M26.2 51.4 C 38 55.4, 62 55.6, 74.6 51.8" />
    <path className="draw-path steam" pathLength={1} d="M43.6 18.6 C 40.4 14, 46.8 10.6, 43 5.4" />
    <path className="draw-path steam" pathLength={1} d="M51.2 17.4 C 48.2 12.4, 55.2 9.2, 51.4 3.2" />
    <path className="draw-path steam" pathLength={1} d="M58.8 18.8 C 56.2 14.6, 62.2 11.4, 59.4 6.2" />
  </>
);

export function Opening() {
  return (
    <section className="opening" id="top" aria-labelledby="page-title" data-section="top">
      <div className="wrap opening-grid">
        <div className="opening-copy">
          <p className="eyebrow">{business.category} · Los Angeles</p>
          <h1 id="page-title" className="h1">
            <span className="line">BB</span> <span className="line">Bakery</span> <span className="line">&amp; Cafe</span>
          </h1>
          <Underline className="h1-underline" draw />
          <p className="lead">Handcrafted bread, baked fresh every day.</p>
          <p className="hours-line">
            <IconClock />
            <span>Open daily · <time dateTime={business.opens}>8:00 AM</time> – <time dateTime={business.closes}>7:00 PM</time></span>
          </p>
          <div className="opening-actions">
            <a className="btn btn-primary" href="#menu" onClick={(e) => { if (e.button === 0 && !e.metaKey && !e.ctrlKey) { e.preventDefault(); scrollToId('menu'); } }}>
              See the menu <IconArrowDown className="icon-down" />
            </a>
            <a className="btn btn-secondary" href="#visit" onClick={(e) => { if (e.button === 0 && !e.metaKey && !e.ctrlKey) { e.preventDefault(); scrollToId('visit'); } }}>
              <PencilBox />Plan a visit
            </a>
          </div>
        </div>
        <div className="opening-figure">
          <SketchFigure
            img="hero-loaf"
            eager
            study={false}
            className="hero-sketch"
            sizes="(max-width: 767px) 118vw, (max-width: 1023px) min(97vw, 72vh, 717px), min(58vw, 97vh, 896px)"
            alt="Concept image: a round country loaf with a floured, cross-scored crust, seen from above on paper."
            label="the loaf"
            marks={heroMarks}
          />
          <p className="note" aria-hidden="true">baked fresh, every day</p>
        </div>
      </div>
    </section>
  );
}
