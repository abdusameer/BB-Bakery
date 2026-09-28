import { useEffect, useState } from 'react';
import type { SectionId } from './content';
import { emit } from './lib/bus';
import { Header } from './components/Header';
import { Opening } from './components/Opening';
import { Menu } from './components/Menu';
import { Story } from './components/Story';
import { Media } from './components/Media';
import { Visit } from './components/Visit';
import { Footer } from './components/Footer';

const TRACKED: (SectionId | 'top')[] = ['top', 'menu', 'story', 'media', 'visit'];

export default function App() {
  const [active, setActive] = useState<SectionId | null>(null);

  // Active section = the one crossing ~40% of the viewport height.
  useEffect(() => {
    const els = TRACKED.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const id = e.target.id === 'top' ? null : (e.target.id as SectionId);
          setActive(id);
        }
      },
      { rootMargin: '-40% 0px -55% 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.section = active ?? 'top';
    emit('section', active);
  }, [active]);

  // Motion is progressive enhancement: loaded after hydration, torn down on unmount.
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let cancelled = false;
    import('./motion')
      .then((m) => { if (!cancelled) cleanup = m.initMotion(); })
      .catch(() => document.documentElement.classList.remove('motion'));
    return () => { cancelled = true; cleanup?.(); };
  }, []);

  return (
    <>
      <Header active={active} />
      <main id="main" tabIndex={-1}>
        <Opening />
        <Menu />
        <Story />
        <Media />
        <Visit />
      </main>
      <Footer />
    </>
  );
}
