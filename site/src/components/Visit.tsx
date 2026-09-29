import { business, links, visit } from '../content';
import { GuideSVG } from './Guide';
import { IconAccessibility, IconArrowUpRight, IconBag, IconClock, IconMapPoint } from './Icons';
import { PencilBox } from './Pencil';
import { SplitHeading } from './SplitHeading';

export function Visit() {
  return (
    <section className="section visit is-dark" id="visit" aria-labelledby="visit-title" data-section="visit">
      {/* "after hours" atmosphere (motion/atmosphere.ts); CSS gradient fallback without JS */}
      <canvas className="atmos" aria-hidden="true" />
      <div className="wrap visit-grid">
        <div className="visit-facts">
          <p className="eyebrow">{visit.eyebrow}</p>
          <SplitHeading id="visit-title" className="h2" text={visit.title} />

          <div className="info-row">
            <IconMapPoint />
            <div>
              <h3>Address</h3>
              <address>{business.name}<br />{business.street}<br />{business.cityLine}</address>
            </div>
          </div>
          <div className="info-row">
            <IconClock />
            <div>
              <h3>Hours</h3>
              <p>{business.hoursDays} · <time dateTime={business.opens}>8:00 AM</time> – <time dateTime={business.closes}>7:00 PM</time></p>
            </div>
          </div>
          <div className="info-row">
            <IconBag />
            <div>
              <h3>Good to know</h3>
              <ul>
                <li>Takeout available</li>
                <li className="with-icon"><IconAccessibility className="inline-icon" /> Wheelchair accessible</li>
              </ul>
            </div>
          </div>

          <div className="visit-actions">
            <div className="visit-guide" aria-hidden="true">
              <svg className="visit-guide-line" viewBox="0 0 100 4" preserveAspectRatio="none"><path d="M0 2.2 C 30 1.4, 70 2.8, 100 1.8" /></svg>
              <GuideSVG idSuffix="visit" pose="visit-static" />
            </div>
            <a className="btn btn-primary" id="get-directions" href={links.googleDirections} target="_blank" rel="noopener">
              Get directions<span className="visually-hidden"> to BB Bakery and Cafe (opens Google Maps in a new tab)</span> <IconArrowUpRight />
            </a>
            <a className="btn btn-secondary" href={links.appleDirections} target="_blank" rel="noopener">
              <PencilBox />Open in Apple Maps<span className="visually-hidden"> (new tab)</span> <IconArrowUpRight />
            </a>
          </div>
          <p className="future-contact">
            {/* Placeholder: no phone or social account is verified. Add only after owner confirmation. */}
            <span>{visit.futureContact}</span>
            <span className="tag tag-confirm">Owner to confirm</span>
          </p>
        </div>

        <figure className="visit-map">
          <a href={links.googleDirections} target="_blank" rel="noopener" aria-label="Open BB Bakery and Cafe’s address in Google Maps (new tab)">
            <svg viewBox="0 0 668 520" role="img" aria-label="Pencil sketch of W Olympic Blvd with a dotted route to the bakery, not to scale" focusable="false">
              <defs>
                <pattern id="map-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
                  <line x1="0" y1="0" x2="0" y2="6" stroke="#8A847B" strokeWidth=".8" />
                </pattern>
                {/* dashed route is revealed with a growing clip (dash-offset drawing would break its dashes) */}
                <clipPath id="route-clip"><rect className="route-clip-rect" x="0" y="0" width="668" height="520" /></clipPath>
              </defs>
              <rect x="330" y="140" width="160" height="96" fill="url(#map-hatch)" opacity=".55" />
              <rect x="140" y="304" width="140" height="80" fill="url(#map-hatch)" opacity=".4" />
              <rect x="540" y="304" width="110" height="86" fill="url(#map-hatch)" opacity=".4" />
              <path className="street" d="M0 110 C 200 106, 460 114, 668 108" />
              <path className="street" d="M0 410 C 220 406, 450 414, 668 408" />
              <path className="street" d="M120 0 C 116 170, 124 350, 118 520" />
              <path className="street" d="M300 0 C 304 170, 296 350, 302 520" />
              <path className="street" d="M520 0 C 516 170, 524 350, 518 520" />
              <path className="main-street" d="M0 262 C 220 256, 460 268, 668 260" />
              <path className="main-street-2" d="M0 272 C 220 266, 460 278, 668 270" />
              <path className="route" clipPath="url(#route-clip)" d="M40 500 C 110 450, 150 400, 210 360 C 260 326, 330 310, 392 282" />
              <g className="pin">
                <path d="M404 230 c -12 0 -20 9 -20 19 c 0 14 20 32 20 32 s 20 -18 20 -32 c 0 -10 -8 -19 -20 -19 z" />
                <circle cx="404" cy="249" r="5.5" />
              </g>
              <text className="map-label" x="486" y="296">W Olympic Blvd</text>
              <text className="map-addr" x="430" y="236">3130 · Suite 100</text>
            </svg>
          </a>
          <figcaption><span>{visit.mapCaption}</span><span>Opens Google Maps</span></figcaption>
        </figure>
      </div>
    </section>
  );
}
