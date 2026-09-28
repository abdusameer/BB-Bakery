/*
  Sogeum pose builder (Phase 0).
  Produces inline SVG markup for the guide character from one rig, so the pose sheet,
  storyboards, and Phase 1 component share the same geometry.
  All angles are in degrees and clamped to the ranges in PHASE-0-CHARACTER-BEHAVIOR.md.
*/
(function (root) {
  const INK = '#2B2825', PAPER = '#F4EFE6';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const hand = (x, y) =>
    `<path fill="${PAPER}" d="M${x - 3.4} ${y + 2.2} C ${x - 4} ${y - 1.6}, ${x - 2.4} ${y - 4}, ${x} ${y - 4} C ${x + 2.4} ${y - 4}, ${x + 4} ${y - 1.6}, ${x + 3.4} ${y + 2.2} C ${x + 2} ${y + 3.6}, ${x - 2} ${y + 3.6}, ${x - 3.4} ${y + 2.2} Z"/>` +
    `<path stroke-width=".9" opacity=".7" d="M${x - 2} ${y + 1.2} C ${x - 0.8} ${y + 2.2}, ${x + 0.8} ${y + 2.2}, ${x + 2} ${y + 1.2}"/>`;
  const fist = (x, y, fx, fy) =>
    `<circle cx="${x}" cy="${y}" r="2.3" fill="${PAPER}"/><path stroke-width="1.4" d="M${x} ${y} L ${fx} ${fy}"/>`;

  const ARMS = {
    gripL: `<path d="M46 53 C 43.6 40, 40.4 24, 38.2 11.5"/>`,
    gripR: `<path d="M74 53 C 76.4 40, 79.6 24, 81.8 11.5"/>`,
    reachR: `<path d="M76 54 C 84 42, 92 26, 96.6 11.5"/>`,
    reachL: `<path d="M44 54 C 36 42, 28 26, 23.4 11.5"/>`
  };
  const FRONT = {
    pointDownR: `<path d="M86.6 72 C 91 78, 93.6 85, 95.4 92"/>` + fist(96, 94.4, 97.6, 99.4),
    pointDownL: `<path d="M33.4 72 C 29 78, 26.4 85, 24.6 92"/>` + fist(24, 94.4, 22.4, 99.4),
    pointLeft: `<path d="M31.4 71 C 25 72.4, 19.6 72.8, 14.2 72.6"/>` + fist(12, 72.6, 6.8, 72.6),
    pointRight: `<path d="M88.6 71 C 95 72.4, 100.4 72.8, 105.8 72.6"/>` + fist(108, 72.6, 113.2, 72.6),
    camera:
      `<path d="M84 75 C 86.6 78.6, 87.6 81.6, 87.4 84"/>` +
      `<rect x="79" y="83.6" width="15" height="10" rx="1.6" fill="${PAPER}"/>` +
      `<circle cx="86.5" cy="88.6" r="3" fill="${PAPER}"/><circle cx="86.5" cy="88.6" r="1.1"/>` +
      `<path stroke-width="1" d="M81 83.6 L 82 81.6 L 84.8 81.6 L 85.6 83.6"/>` +
      `<path stroke-width=".9" opacity=".7" d="M96.8 82.6 L 100 80.2 M97.6 87 L 101.6 86.8 M96.8 91.2 L 100 93.4"/>`
  };

  function sogeum(o = {}) {
    const eyes = [clamp((o.eyes || [0, 0])[0], -2.4, 2.4), clamp((o.eyes || [0, 0])[1], -1.6, 1.6)];
    const head = clamp(o.head || 0, -10, 10);
    const lean = clamp(o.lean || 0, -6, 6);
    const legL = clamp((o.legs || [0, 0])[0], -12, 12);
    const legR = clamp((o.legs || [0, 0])[1], -12, 12);
    const left = o.left || 'grip';   // grip | reach | free
    const right = o.right || 'grip'; // grip | reach | free
    const front = o.front ? FRONT[o.front] : '';
    const faceShift = clamp(eyes[0] * 0.5, -1.2, 1.2);
    const wink = !!o.wink;
    const vb = o.viewBox || '0 0 120 112';
    const showLine = o.line !== false;
    const sit = !!o.sit;
    const noArms = !!o.noArms;

    const armsBack = noArms ? '' :
      (left === 'grip' ? ARMS.gripL : left === 'reach' ? ARMS.reachL : '') +
      (right === 'grip' ? ARMS.gripR : right === 'reach' ? ARMS.reachR : '');
    const hands = noArms ? '' :
      (left === 'grip' ? hand(38.2, 9.2) : left === 'reach' ? hand(23.4, 9.2) : '') +
      (right === 'grip' ? hand(81.8, 9.2) : right === 'reach' ? hand(96.6, 9.2) : '');

    // Roll body: centre (60,63). Face sits on the central band. Bands all slant the same way (rolled dough).
    const E = { lx: 56.4, rx: 64.6, y: 62.4 };
    const eyesSvg = wink
      ? `<ellipse cx="${E.lx + eyes[0]}" cy="${E.y + eyes[1]}" rx="1.7" ry="2.05" fill="#1E1C19" stroke="none"/>` +
        `<path stroke-width="1.1" d="M${E.rx - 2 + eyes[0]} ${E.y + 0.2 + eyes[1]} C ${E.rx - 1 + eyes[0]} ${E.y - 0.8 + eyes[1]}, ${E.rx + 0.8 + eyes[0]} ${E.y - 0.8 + eyes[1]}, ${E.rx + 1.8 + eyes[0]} ${E.y + 0.2 + eyes[1]}"/>`
      : `<g fill="#1E1C19" stroke="none" transform="translate(${eyes[0]} ${eyes[1]})"><ellipse cx="${E.lx}" cy="${E.y}" rx="1.7" ry="2.05"/><ellipse cx="${E.rx}" cy="${E.y}" rx="1.7" ry="2.05"/></g>`;

    const ROLL = 'M27.6 70.2 C 26.8 64.4, 30.6 59.4, 36.8 57.6 C 41.8 50.6, 50.6 46.4, 60 46.4 C 69.4 46.4, 78.2 50.6, 83.2 57.6 C 89.4 59.4, 93.2 64.4, 92.4 70.2 C 91.8 74.8, 87.4 78, 80.2 78.8 C 67 80.6, 53 80.6, 39.8 78.8 C 32.6 78, 28.2 74.8, 27.6 70.2 Z';
    const roll =
      `<g transform="rotate(${head} 60 64)">` +
      `<path stroke-width="1.7" fill="${PAPER}" d="${ROLL}"/>` +
      // same-direction bands (read as rolled layers, not gills)
      `<g stroke-width="1.05" opacity=".85">` +
        `<path d="M36.8 57.6 C 40.6 62.4, 41.4 70.6, 39 78.6"/>` +
        `<path d="M47.2 50 C 51.6 57.4, 52.6 68.8, 49.6 79.8"/>` +
        `<path d="M71.4 49.4 C 75.8 57, 76.6 68.6, 73.4 79.8"/>` +
        `<path d="M83.2 57.6 C 86.6 62.4, 87.2 70.4, 85 78.2"/>` +
      `</g>` +
      // volume: short hatch on the right flank of each band
      `<path d="M44.6 56 C 47 62, 47.4 71, 45.6 78.8 L 48.6 79.6 C 50.8 70, 50.2 61, 47.2 54.4 Z" fill="url(#sg-hatch)" stroke="none"/>` +
      `<path d="M81 56.8 C 83.6 62.4, 84 70.8, 82.6 78.4 L 85 78.2 C 87.2 70.4, 86.6 62.4, 83.2 57.6 Z" fill="url(#sg-hatch)" stroke="none"/>` +
      `<path d="M31.6 73.6 C 44 79.4, 76 79.4, 88.4 73.6 C 84 78.8, 36 78.8, 31.6 73.6 Z" fill="url(#sg-hatch)" stroke="none"/>` +
      // salt flakes on the crown
      `<g stroke-width=".85"><path d="M55.6 49.8 l1.6 -0.5 l0.5 1.6 l-1.6 0.5 z"/><path d="M61.6 48.6 l1.4 0.3 l-0.3 1.4 l-1.4 -0.3 z"/><path d="M66.4 50.8 l1.2 -0.5 l0.5 1.2 l-1.2 0.5 z"/></g>` +
      `<g transform="translate(${faceShift} 0)">` +
        `<g stroke-width="1" opacity=".75"><path d="M54.2 57.6 C 55.6 56.8, 57.2 56.8, 58.4 57.4"/><path d="M62.6 57.4 C 63.8 56.8, 65.4 56.8, 66.8 57.6"/></g>` +
        eyesSvg +
        `<path stroke-width="1" d="M59 67.8 C 60 68.6, 61.2 68.6, 62.2 67.8"/>` +
      `</g></g>`;

    const legs =
      `<g stroke-width="1.4"><g transform="rotate(${legL} 53.6 79)"><path d="M53.6 79.4 C 53 86, 52.4 93, 51.6 100"/><path stroke-width="1.6" d="M51.6 100 C 49 101.2, 46.2 101.2, 45 99.6"/></g>` +
      `<g transform="rotate(${legR} 66.4 79)"><path d="M66.4 79.4 C 67 86, 67.6 93, 68.4 100"/><path stroke-width="1.6" d="M68.4 100 C 71 101.2, 73.8 101.2, 75 99.6"/></g></g>`;

    let body;
    if (sit) {
      // tuck: sits on the line, mittens resting on it beside the roll, legs dangling in front
      body =
        `<g transform="translate(0 -70)">${legs}${roll}</g>` +
        hand(30.6, 9.2) + hand(89.4, 9.2);
    } else {
      body =
        `<g transform="rotate(${lean} 60 9)"><g stroke-width="1.45">${armsBack}</g>${legs}${roll}<g stroke-width="1.45">${front}</g></g>` +
        `<g stroke-width="1.45">${hands}</g>`;
    }

    return (
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" aria-hidden="true" focusable="false">` +
      `<defs><pattern id="sg-hatch" width="2.6" height="2.6" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><line x1="0" y1="0" x2="0" y2="2.6" stroke="${INK}" stroke-width=".5" opacity=".5"/></pattern>` +
      `<filter id="sg-pencil" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale=".7" xChannelSelector="R" yChannelSelector="G"/></filter></defs>` +
      (showLine ? `<path d="M-20 9.2 C 30 8.4, 72 10, 140 8.8" fill="none" stroke="${INK}" stroke-width="1.3" stroke-linecap="round"/>` : '') +
      `<g fill="none" stroke="${INK}" stroke-linecap="round" stroke-linejoin="round" filter="url(#sg-pencil)">${body}</g></svg>`
    );
  }

  const POSES = {
    neutral: { label: 'Neutral hang', note: 'Default and reduced-motion pose. Eyes centered.' },
    lookLeft: { eyes: [-2.4, 0.8], head: -8, lean: -3, legs: [7, 5], label: 'Follow · pointer left', note: 'Eyes lead (80 ms), head follows (240 ms), body leans (450 ms), legs trail.' },
    lookUpRight: { eyes: [2.4, -1.4], head: 7, lean: 3, legs: [-6, -4], label: 'Follow · pointer up-right', note: 'Clamped: eyes ±2.4/±1.6, head ±10°, lean ±4°.' },
    menu: { left: 'grip', right: 'free', front: 'pointDownR', eyes: [1.2, 1.6], head: 4, lean: -4, legs: [3, 2], label: 'Menu', note: 'Lets go with one hand and points down at the products.' },
    storyA: { left: 'grip', right: 'reach', eyes: [2.4, -0.4], head: 5, lean: 5, legs: [-9, -7], label: 'Story · climb A', note: 'Hand over hand along the line.' },
    storyB: { left: 'reach', right: 'grip', eyes: [2.4, -0.4], head: 3, lean: -3, legs: [-4, -9], label: 'Story · climb B', note: 'Alternates grips while travelling right.' },
    media: { left: 'grip', right: 'free', front: 'camera', wink: true, eyes: [1, 0.4], head: 3, lean: -3, legs: [2, 1], label: 'Media', note: 'Holds a drawn camera, one eye closed.' },
    visit: { left: 'free', right: 'grip', front: 'pointDownL', eyes: [-2.4, 1.6], head: -6, lean: 3, legs: [4, 3], label: 'Visit', note: 'Points down-left toward the Get directions button.' },
    tuck: { sit: true, viewBox: '0 -44 120 112', eyes: [0, 1], label: 'Tuck', note: 'Climbs up and sits on the line when something needs the space below.' }
  };

  root.Sogeum = { sogeum, POSES };
})(typeof window !== 'undefined' ? window : globalThis);
