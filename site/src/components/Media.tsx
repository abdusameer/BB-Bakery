import { media } from '../content';
import { images } from '../generated/images';
import { IconCamera, IconGallery } from './Icons';
import { CropMarks } from './Pencil';
import { SplitHeading } from './SplitHeading';

const pad = (n: number) => String(n).padStart(2, '0');

export function Media() {
  return (
    <section className="section media" id="media" aria-labelledby="media-title" data-section="media">
      <div className="wrap">
        <div className="media-head">
          <div className="title-wrap">
            <p className="eyebrow">{media.eyebrow}</p>
            <SplitHeading id="media-title" className="h2" text={media.title} />
          </div>
          <p className="muted">{media.body}</p>
        </div>

        <ul className="media-grid">
          {media.slots.map((slot, i) => {
            const d = slot.img ? images[slot.img] : null;
            const tbc = slot.id === 'murals' || slot.id === 'patio';
            return (
              <li key={slot.id} className={`s-${slot.id}`}>
                <figure className="frame-slot" data-media>
                  <div className="frame-wrap">
                  <div className="frame">
                    {slot.kind === 'concept' && d ? (
                      <>
                        <picture>
                          <source type="image/avif" srcSet={d.widths.map((w) => `/img/${slot.img}-photo-${w}.avif ${w}w`).join(', ')} sizes="(max-width: 767px) 92vw, 40vw" />
                          <img
                            src={`/img/${slot.img}-photo-${d.widths[0]}.webp`}
                            srcSet={d.widths.map((w) => `/img/${slot.img}-photo-${w}.webp ${w}w`).join(', ')}
                            sizes="(max-width: 767px) 92vw, 40vw"
                            alt={slot.alt}
                            loading="lazy"
                            decoding="async"
                            width={d.widths[0]}
                            height={Math.round((d.widths[0] * d.ar[1]) / d.ar[0])}
                          />
                        </picture>
                        <span className="chip">Concept image</span>
                      </>
                    ) : (
                      <div className="owner-slot">
                        <div>
                          {slot.id === 'murals' ? <IconGallery /> : <IconCamera />}
                          <span className="op">Owner photo: </span><em>{slot.label}</em>
                          {tbc && <><br /><span className="tbc">Mentioned by customers · to confirm</span></>}
                        </div>
                      </div>
                    )}
                  </div>
                  <CropMarks />
                  </div>
                  <figcaption>
                    <b>{pad(i + 1)}</b> {slot.label}{slot.kind === 'concept' ? ' · concept image' : ' · awaiting owner photo'}
                  </figcaption>
                </figure>
              </li>
            );
          })}
        </ul>
        <p className="note media-note" aria-hidden="true">real photos go here ↑</p>
      </div>
    </section>
  );
}
