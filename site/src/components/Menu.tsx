import { menuIntro, menuItems } from '../content';
import { scrollToId } from '../lib/bus';
import { ConstructionMarks, SketchFigure } from './SketchFigure';
import { SplitHeading } from './SplitHeading';
import { Underline } from './Pencil';

const pad = (n: number) => String(n).padStart(2, '0');

export function Menu() {
  const total = menuItems.length;
  return (
    <section className="section menu" id="menu" aria-labelledby="menu-title" data-section="menu">
      <div className="menu-pin">
        <div className="wrap menu-inner">
          <div className="menu-rail">
            <p className="eyebrow">{menuIntro.eyebrow}</p>
            <SplitHeading id="menu-title" className="h2" text={menuIntro.title} />
            <p className="intro muted">{menuIntro.body}</p>
            <p><span className="tag">Sample selection</span></p>
            <nav aria-label="Sample breads">
              <ol className="menu-index">
                {menuItems.map((it, i) => (
                  <li key={it.id}>
                    <a
                      href={`#menu-${it.id}`}
                      data-index={i}
                      onClick={(e) => {
                        if (e.button !== 0 || e.metaKey || e.ctrlKey) return;
                        e.preventDefault();
                        // Pinned mode registers a position-aware handler (see buildPinnedMenu in motion/index.ts).
                        const handled = window.dispatchEvent(new CustomEvent('bbs:menu-index', { detail: i, cancelable: true }));
                        if (handled) scrollToId(`menu-${it.id}`, 'h3');
                      }}
                    >
                      <span>{pad(i + 1)}</span> {it.name}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </div>

          <ol className="menu-items">
            {menuItems.map((it, i) => (
              <li className="menu-item" id={`menu-${it.id}`} key={it.id} data-index={i}>
                <p className="menu-count" aria-hidden="true">
                  <span>{pad(i + 1)} / {pad(total)}</span>
                  <span className="ticks">{menuItems.map((_, j) => <i key={j} className={j === i ? 'on' : undefined} />)}</span>
                </p>
                <SketchFigure
                  img={it.img}
                  alt={it.alt}
                  label={it.name.toLowerCase()}
                  eraser
                  sizes="(max-width: 767px) 92vw, (max-width: 1023px) 48vw, 560px"
                  marks={<ConstructionMarks img={it.img} />}
                />
                <div className="menu-item-text">
                  <h3 className="menu-item-name">{it.name}</h3>
                  <Underline className="menu-item-underline" draw variant={i} />
                  <p className="menu-item-note">{menuIntro.itemNote} <span className="visually-hidden">(sample, not a current availability list)</span></p>
                  {it.status && <span className="stamp">{it.status === 'sold-out' ? 'Sold out today' : it.status === 'preorder' ? 'Preorder' : 'Today'}</span>}
                  <p className="note" aria-hidden="true">study no. {pad(i + 1)}</p>
                  <svg className="menu-arrow" viewBox="0 0 110 90" aria-hidden="true" focusable="false">
                    <path className="draw-path" pathLength={1} d="M100 12 C 76 22, 44 48, 12 76" />
                    <path className="draw-path" pathLength={1} d="M10 60 L 12 76 L 27 71" />
                  </svg>
                </div>
              </li>
            ))}
          </ol>

          <p className="menu-end">
            <span>{menuIntro.endNote}</span>
            <span className="tag tag-confirm">Owner to confirm</span>
          </p>
        </div>
      </div>
    </section>
  );
}
