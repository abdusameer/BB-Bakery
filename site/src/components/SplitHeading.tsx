import { createElement } from 'react';

/**
 * Heading whose words can rise through a mask. The accessible name comes from an unsplit,
 * visually-hidden copy; the split words are aria-hidden. With JS off the words simply show.
 * Never used for headings that contain links or inline markup.
 */
export function SplitHeading({ as = 'h2', id, className, text }: { as?: 'h2' | 'h3'; id?: string; className?: string; text: string }) {
  const words = text.split(/\s+/);
  return createElement(
    as,
    { id, className, 'data-split': '' },
    <span className="visually-hidden">{text}</span>,
    <span aria-hidden="true" className="split">
      {words.map((w, i) => (
        <span key={i}>
          <span className="split-word-mask"><span className="split-word">{w}</span></span>
          {i < words.length - 1 ? ' ' : null}
        </span>
      ))}
    </span>
  );
}
