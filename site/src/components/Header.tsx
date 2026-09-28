import { useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { business, links, nav } from '../content';
import type { SectionId } from '../content';
import { emit, scrollToId } from '../lib/bus';
import { GuideSVG, PeekSVG } from './Guide';
import { IconArrowUpRight, IconClose, IconMenu } from './Icons';
import { NavLine, NavUnderline } from './Pencil';

type Props = { active: SectionId | null };

export function Header({ active }: Props) {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const pendingTarget = useRef<string | null>(null);

  const go = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    if (open) { pendingTarget.current = id; setOpen(false); return; }
    scrollToId(id);
  };

  // Sheet: inert background, focus trap, Escape, body lock, and focus return.
  useEffect(() => {
    emit('sheet', open);
    const main = document.getElementById('main');
    const footer = document.querySelector('footer');
    const html = document.documentElement;
    if (!open) {
      main?.removeAttribute('inert'); footer?.removeAttribute('inert');
      html.classList.remove('sheet-open');
      if (pendingTarget.current) { const id = pendingTarget.current; pendingTarget.current = null; window.setTimeout(() => scrollToId(id, 'h2, h1, h3', { instant: true }), 30); }
      return;
    }
    main?.setAttribute('inert', ''); footer?.setAttribute('inert', '');
    html.classList.add('sheet-open');
    const sheet = sheetRef.current!;
    const focusables = () => Array.from(sheet.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'));
    focusables()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); setOpen(false); return; }
      if (e.key !== 'Tab') return;
      const f = focusables(); if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    const toggle = toggleRef.current;
    return () => {
      document.removeEventListener('keydown', onKey);
      main?.removeAttribute('inert'); footer?.removeAttribute('inert');
      html.classList.remove('sheet-open');
      if (!pendingTarget.current) toggle?.focus({ preventScroll: true });
    };
  }, [open]);

  // Close the sheet if the viewport grows past the mobile layout.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = () => { if (mq.matches) setOpen(false); };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="site-header">
        <div className="header-inner">
          <a className="wordmark" href="#top" onClick={(e) => { if (e.button === 0 && !e.metaKey && !e.ctrlKey) { e.preventDefault(); scrollToId('top', 'h1'); } }} aria-label="BB’s Bakery, back to top">
            <span className="wm-full">BB’s Bakery</span><span className="wm-short" aria-hidden="true">BB’s</span>
          </a>
          <nav className="primary-nav" aria-label="Primary">
            <ul className="nav-list">
              {nav.map((item, i) => (
                <li key={item.id}>
                  <a
                    className="nav-link"
                    href={`#${item.id}`}
                    data-nav={item.id}
                    aria-current={active === item.id ? 'true' : undefined}
                    onClick={(e) => go(e, item.id)}
                    onPointerEnter={() => emit('navHover', item.id)}
                    onPointerLeave={() => emit('navHover', null)}
                    onFocus={() => emit('navHover', item.id)}
                    onBlur={() => emit('navHover', null)}
                  >
                    {item.label}
                    <NavUnderline variant={i} />
                  </a>
                </li>
              ))}
            </ul>
            <a className="btn btn-primary header-directions" href={links.googleDirections} target="_blank" rel="noopener">
              <span className="hd-label">Directions</span><span className="visually-hidden"> to BB’s Bakery (opens Google Maps in a new tab)</span>
              <IconArrowUpRight />
            </a>
          </nav>
          <div className="quick-links">
            <a href="#menu" onClick={(e) => go(e, 'menu')}>Menu</a>
            <a href="#visit" onClick={(e) => go(e, 'visit')}>Visit</a>
            <span className="peek" aria-hidden="true"><PeekSVG /></span>
            <button
              ref={toggleRef}
              type="button"
              className="index-toggle"
              aria-expanded={open}
              aria-controls="site-index"
              onClick={() => setOpen(true)}
            >
              <IconMenu />
              <span className="visually-hidden">Open site index</span>
            </button>
          </div>
          <NavLine />
          <div className="guide" aria-hidden="true"><GuideSVG idSuffix="hdr" /></div>
        </div>
        <div className="shelf" aria-hidden="true" />
      </header>

      <div
        ref={sheetRef}
        id="site-index"
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Site index"
        data-open={open ? 'true' : 'false'}
        hidden={!open}
      >
        <div className="sheet-head">
          <span className="wordmark" aria-hidden="true">BB’s Bakery</span>
          <button type="button" className="sheet-close" onClick={() => setOpen(false)}>
            <IconClose /><span className="visually-hidden">Close site index</span>
          </button>
          <svg className="sheet-rule" viewBox="0 0 390 3" preserveAspectRatio="none" aria-hidden="true"><path d="M0 1.6 C 120 .8, 270 2.4, 390 1.2" /></svg>
          <div className="sheet-char" aria-hidden="true"><GuideSVG idSuffix="sheet" pose="menu" /></div>
        </div>
        <nav aria-label="Site index">
          <ol className="sheet-list">
            {nav.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} aria-current={active === item.id ? 'true' : undefined} onClick={(e) => go(e, item.id)}>{item.label}</a>
              </li>
            ))}
          </ol>
        </nav>
        <p className="sheet-facts">
          {business.hoursLabel}<br />
          <span className="muted">{business.street}<br />{business.cityLine}</span>
        </p>
        <a className="btn btn-primary" href={links.googleDirections} target="_blank" rel="noopener">
          Get directions<span className="visually-hidden"> (opens Google Maps in a new tab)</span> <IconArrowUpRight />
        </a>
      </div>
    </>
  );
}
