'use client';

/*
  A QR code the camera "sees".

  Drawn rather than shipped as an asset so it sits crisply inside the
  viewfinder at any size, and deterministic so it never changes between
  renders or screenshots. Styled to match Cabana's own printed code: circular
  modules, rounded finder rings, and the house glyph held in a clear centre.

  It encodes nothing. For a code that actually scans, pass `codeImageSrc` to
  `RoomScanner` and this is not used.
*/

const GRID = 25;
const FINDER_ORIGINS = [[0, 0], [GRID - 7, 0], [0, GRID - 7]] as const;

const inFinder = (x: number, y: number) =>
  FINDER_ORIGINS.some(([ox, oy]) => x >= ox && x < ox + 7 && y >= oy && y < oy + 7);

/** The glyph's clear area, the way a branded code reserves one. */
const inCentre = (x: number, y: number) => {
  const lo = GRID / 2 - 3.5;
  const hi = GRID / 2 + 2.5;
  return x >= lo && x <= hi && y >= lo && y <= hi;
};

/** Deterministic scatter: the same pattern every render, no Math.random. */
const isOn = (x: number, y: number) => ((x * 73 + y * 151 + x * y * 31) % 7) < 3;

export function QrCodeGraphic({ className }: { className?: string }) {
  const dots: Array<{ x: number; y: number }> = [];
  for (let x = 0; x < GRID; x += 1) {
    for (let y = 0; y < GRID; y += 1) {
      if (inFinder(x, y) || inCentre(x, y)) continue;
      if (isOn(x, y)) dots.push({ x, y });
    }
  }

  return (
    <svg className={className} viewBox="-2 -2 29 29" role="img" aria-label="QR code">
      <rect x="-2" y="-2" width="29" height="29" rx="3" fill="#fff" />

      {dots.map(({ x, y }) => (
        <circle key={`${x}-${y}`} cx={x + 0.5} cy={y + 0.5} r="0.42" fill="#141018" />
      ))}

      {FINDER_ORIGINS.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x + 0.4} y={y + 0.4} width="6.2" height="6.2" rx="2.1" fill="none" stroke="#141018" strokeWidth="1.05" />
          <circle cx={x + 3.5} cy={y + 3.5} r="1.55" fill="#141018" />
        </g>
      ))}

      {/* The property mark, in Cabana plum rather than the module black. */}
      <g transform={`translate(${GRID / 2 - 2.9} ${GRID / 2 - 2.5}) scale(0.098)`} fill="#4a1330">
        <path d="M4 36h52v3.4H4z" />
        <path d="M30 3 3 21v3.6h54V21z" />
        <path d="M12 27.5h7.5v8.5H12zM26.2 27.5h7.5v8.5h-7.5zM40.5 27.5H48v8.5h-7.5z" />
      </g>
    </svg>
  );
}
