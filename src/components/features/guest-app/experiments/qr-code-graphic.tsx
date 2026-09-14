'use client';

/*
  A QR code the camera "sees".

  Drawn rather than shipped as an asset: it has to sit inside the viewfinder
  at any size, and a synthetic one is deterministic -- the module pattern comes
  from a fixed seed, so it looks like a real code and never changes between
  renders or between screenshots.

  It encodes nothing. It is scenery for a camera that does not exist.
*/

const GRID = 21;
const FINDER_CELLS = new Set<string>();

for (const [ox, oy] of [[0, 0], [GRID - 7, 0], [0, GRID - 7]]) {
  for (let x = 0; x < 7; x += 1) {
    for (let y = 0; y < 7; y += 1) {
      FINDER_CELLS.add(`${ox + x},${oy + y}`);
    }
  }
}

/** Deterministic scatter: the same pattern every render, no Math.random. */
const isModuleOn = (x: number, y: number) => ((x * 73 + y * 151 + x * y * 31) % 7) < 3;

export function QrCodeGraphic({ className }: { className?: string }) {
  const modules: Array<{ x: number; y: number }> = [];
  for (let x = 0; x < GRID; x += 1) {
    for (let y = 0; y < GRID; y += 1) {
      // The centre is reserved for the property glyph, as a branded code does.
      const inCentre = x > 7 && x < 13 && y > 7 && y < 13;
      if (FINDER_CELLS.has(`${x},${y}`) || inCentre) continue;
      if (isModuleOn(x, y)) modules.push({ x, y });
    }
  }

  return (
    <svg className={className} viewBox="-2 -2 25 25" role="img" aria-label="QR code">
      <rect x="-2" y="-2" width="25" height="25" rx="3" fill="#fff" />
      {modules.map(({ x, y }) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="0.86" height="0.86" rx="0.3" fill="#1b1220" />
      ))}
      {[[0, 0], [GRID - 7, 0], [0, GRID - 7]].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width="7" height="7" rx="2" fill="none" stroke="#1b1220" strokeWidth="1" />
          <rect x={x + 2} y={y + 2} width="3" height="3" rx="1" fill="#1b1220" />
        </g>
      ))}
      <g transform={`translate(${GRID / 2 - 2.6} ${GRID / 2 - 2.2}) scale(0.09)`} fill="#1b1220">
        <path d="M6 34h48v4H6z" />
        <path d="M30 4 6 20v4h48v-4z" />
        <path d="M14 26h6v8h-6zM27 26h6v8h-6zM40 26h6v8h-6z" />
      </g>
    </svg>
  );
}
