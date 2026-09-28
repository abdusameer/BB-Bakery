/* Tiny shared runtime: one event bus and one scroll helper (Lenis when active, native otherwise). */

type Handler<T> = (payload: T) => void;
type Events = {
  section: string | null;        // active section id (null = opening)
  sheet: boolean;                // mobile index sheet open/closed
  navHover: string | null;       // nav item hovered/focused (desktop reactions)
};

const handlers = new Map<keyof Events, Set<Handler<never>>>();

export function on<K extends keyof Events>(type: K, fn: Handler<Events[K]>) {
  let set = handlers.get(type);
  if (!set) { set = new Set(); handlers.set(type, set); }
  set.add(fn as Handler<never>);
  return () => { set.delete(fn as Handler<never>); };
}
export function emit<K extends keyof Events>(type: K, payload: Events[K]) {
  handlers.get(type)?.forEach((fn) => (fn as Handler<Events[K]>)(payload));
}

type Scroller = { scrollTo: (target: number | HTMLElement, opts?: { offset?: number; immediate?: boolean; duration?: number }) => void };
let scroller: Scroller | null = null;
export function setScroller(s: Scroller | null) { scroller = s; }

export function headerOffset() {
  if (typeof window === 'undefined') return 0;
  const h = document.querySelector<HTMLElement>('.site-header');
  const shelf = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--shelf-h')) || 0;
  return (h?.offsetHeight ?? 72) + shelf + 12;
}

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Scroll to a section/element and move focus to its heading for keyboard and screen-reader users. */
export function scrollToId(id: string, focusSelector = 'h2, h1, h3', opts: { instant?: boolean } = {}) {
  const el = document.getElementById(id);
  if (!el) return;
  // One exact Y for both engines (element targets would double-count scroll-padding in Lenis).
  const top = Math.max(0, Math.round(el.getBoundingClientRect().top + window.scrollY - headerOffset()));
  const instant = opts.instant || prefersReducedMotion();
  if (scroller) scroller.scrollTo(top, { immediate: instant });
  else window.scrollTo({ top, behavior: instant ? 'instant' : 'smooth' });
  const focusEl = (el.matches(focusSelector) ? el : el.querySelector<HTMLElement>(focusSelector)) ?? el;
  if (!focusEl.hasAttribute('tabindex')) focusEl.setAttribute('tabindex', '-1');
  focusEl.focus({ preventScroll: true });
  if (history.replaceState) history.replaceState(null, '', `#${id}`);
}

/** Scroll to an absolute document position (used by the pinned menu index). */
export function scrollToY(y: number) {
  if (scroller) scroller.scrollTo(y, { immediate: prefersReducedMotion() });
  else window.scrollTo({ top: y, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}
