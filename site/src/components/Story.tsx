import { business, story } from '../content';
import { SplitHeading } from './SplitHeading';
import { asset } from '../lib/asset';

export function Story() {
  return (
    <section className="section story" id="story" aria-labelledby="story-title" data-section="story">
      <div className="wrap story-grid">
        <div className="story-margin" aria-hidden="true">
          <svg className="story-line" viewBox="0 0 24 1000" preserveAspectRatio="none" focusable="false">
            <path className="draw-path" pathLength={1} d="M12 0 C 8 180, 16 360, 11 540 C 7 700, 15 850, 12 1000" />
          </svg>
          <ul className="story-notes">
            {story.notes.map((n, i) => (
              <li className="story-note" key={n}>
                <span className="note">{n}</span>
                <svg viewBox="0 0 46 14" focusable="false">
                  <path className="draw-path" pathLength={1} d={['M2 8 C 16 5, 30 6, 42 8 M35 3 L 43 8 L 35 12', 'M2 6 C 18 9, 30 6, 42 7 M35 2 L 43 7 L 35 11', 'M2 7 C 14 6, 32 5, 42 8 M35 3 L 43 8 L 36 12'][i % 3]} />
                </svg>
              </li>
            ))}
          </ul>
        </div>

        <div className="story-body">
          <p className="eyebrow">{story.eyebrow}</p>
          <SplitHeading id="story-title" className="h2" text={story.title} />
          <p className="story-text">{business.description}</p>
          <p className="note story-inline-note" aria-hidden="true">by hand · every day</p>
          <div className="owner-block">
            <span className="tag tag-confirm">Owner to confirm</span>
            <h3>{story.ownerTitle}</h3>
            <p className="muted">{story.ownerBody}</p>
          </div>
        </div>

        <figure className="story-figure">
          <div className="frame">
            <img src={asset('img/story-sketch-800.webp')} srcSet={`${asset('img/story-sketch-480.webp')} 480w, ${asset('img/story-sketch-800.webp')} 800w`} sizes="(max-width: 1023px) 45vw, 22vw" alt="" loading="lazy" decoding="async" width={800} height={800} />
            <span className="chip">Concept sketch</span>
          </div>
          <figcaption>A pencil study of a round loaf, drawn for this concept.</figcaption>
        </figure>
      </div>
    </section>
  );
}
