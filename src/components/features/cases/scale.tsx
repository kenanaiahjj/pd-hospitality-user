/*
  How the front desk's load grows with the property, computed from stated
  assumptions rather than typed in, so changing an assumption changes the
  chart and the table together.
*/

const ASSUME = {
  stayNights: 3,
  bookingsPerStay: 3,
  /** Messages the desk types per booking when it relays every one (direct chat: only on escalations). */
  deskOnlyTypedPerBooking: 6,
  directTypedPerBooking: 0.2,
  activeVendorChatsPerGuest: 2,
};

const typedDeskOnly = (guests: number) => (guests / ASSUME.stayNights) * ASSUME.bookingsPerStay * ASSUME.deskOnlyTypedPerBooking;
const typedDirect = (guests: number) => (guests / ASSUME.stayNights) * ASSUME.bookingsPerStay * ASSUME.directTypedPerBooking;

const TIERS = [
  { name: 'Pilot: Henry\'s Dumaguete', properties: 1, guests: 50, vendorsPerProperty: 10 },
  { name: 'Henry\'s network', properties: 13, guests: 650, vendorsPerProperty: 10 },
  { name: 'Platform', properties: 100, guests: 10000, vendorsPerProperty: 15 },
];

const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

export function ScaleTable() {
  const rows: [string, (t: (typeof TIERS)[number]) => string][] = [
    ['Properties', (t) => fmt(t.properties)],
    ['Guests in house, all properties', (t) => fmt(t.guests)],
    ['Vendors per property', (t) => fmt(t.vendorsPerProperty)],
    ['Open chats at one time, direct with desk fallback', (t) => fmt(t.guests * (1 + ASSUME.activeVendorChatsPerGuest) + t.properties * t.vendorsPerProperty)],
    ['Open chats at one time, front desk only', (t) => fmt(t.guests + t.properties * t.vendorsPerProperty)],
    ['Messages one desk types per day, direct', (t) => fmt(typedDirect(t.guests / t.properties))],
    ['Messages one desk types per day, front desk only', (t) => fmt(typedDeskOnly(t.guests / t.properties))],
  ];
  return (
    <div className="cases-tablewrap">
      <table className="cases-table">
        <thead>
          <tr>
            <th />
            {TIERS.map((t) => (
              <th key={t.name}>{t.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, cell]) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              {TIERS.map((t) => (
                <td key={t.name}>{cell(t)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ScaleChart() {
  const W = 640;
  const H = 300;
  const [ml, mr, mt, mb] = [64, 24, 20, 48];
  const xMax = 400;
  const yMax = 2400;
  const x = (v: number) => ml + ((W - ml - mr) * v) / xMax;
  const y = (v: number) => mt + (H - mt - mb) * (1 - v / yMax);
  const xs = [0, 25, 50, 100, 200, 400];
  const line = (f: (g: number) => number) => xs.map((g) => `${x(g).toFixed(1)},${y(f(g)).toFixed(1)}`).join(' ');
  return (
    <svg className="cases-chart" viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label="Messages the front desk types per day against guests in house: front desk only rises to 2,400 at 400 guests, direct chat stays under 100">
      {[0, 600, 1200, 1800, 2400].map((v) => (
        <g key={v}>
          <line x1={ml} x2={W - mr} y1={y(v)} y2={y(v)} className="cases-chart-grid" />
          <text x={ml - 8} y={y(v) + 4} textAnchor="end" className="cases-chart-tick">
            {v.toLocaleString('en-US')}
          </text>
        </g>
      ))}
      {[0, 100, 200, 300, 400].map((g) => (
        <text key={g} x={x(g)} y={H - mb + 18} textAnchor="middle" className="cases-chart-tick">
          {g}
        </text>
      ))}
      <line x1={x(50)} x2={x(50)} y1={mt} y2={H - mb} className="cases-chart-ref" />
      <text x={x(50) + 6} y={mt + 12} className="cases-chart-tick">
        Henry&apos;s pilot: 50 guests
      </text>
      <polyline points={line(typedDeskOnly)} className="cases-chart-line cases-chart-line--desk" />
      <polyline points={line(typedDirect)} className="cases-chart-line cases-chart-line--direct" />
      <text x={x(400) - 6} y={y(2400) + 16} textAnchor="end" className="cases-chart-label cases-chart-label--desk">
        Front desk only: {fmt(typedDeskOnly(400))}
      </text>
      <text x={x(400) - 6} y={y(typedDirect(400)) - 10} textAnchor="end" className="cases-chart-label cases-chart-label--direct">
        Direct chat: {fmt(typedDirect(400))}
      </text>
      <text x={(ml + W - mr) / 2} y={H - 8} textAnchor="middle" className="cases-chart-tick">
        Guests in house at one property
      </text>
    </svg>
  );
}
