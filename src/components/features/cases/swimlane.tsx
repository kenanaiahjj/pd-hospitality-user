import type { Flow, FlowNode } from './data/types';

/*
  Draws one flow as swimlanes: a lane per party, a box per step, an arrow per
  hand-off. The flow is plain data (data/flows.ts), so changing the app means
  editing a node, not redrawing a picture.
*/

const COLW = 132;
const GAP = 34;
const BOXH = 58;
const LANEH = 98;
const GUT = 92;
const TOP = 10;
const LINE = 13.5;
const PITCH = COLW + GAP;

const LANE_NAMES: Record<string, string> = {
  guest: 'Guest app',
  desk: 'Front desk',
  kabana: 'Cabana + PMS',
  vendor: 'Vendor app',
  path: 'Main path',
  wait: 'Waiting',
  exit: 'Exits',
  room: 'Room charge',
  roomx: 'Room problems',
  card: 'Full payment',
  cardx: 'Card problems',
  goods: 'Goods',
  tables: 'Tables',
  tablesx: 'Table exits',
};

/** Greedy word wrap, the same rule for every box so labels line up. */
function wrap(text: string, width: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    if (line && `${line} ${word}`.length > width) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function Swimlane({ id, flow }: { id: string; flow: Flow }) {
  const rowOf = new Map(flow.lanes.map((lane, index) => [lane, index]));
  const columns = Math.max(...flow.nodes.map((node) => node.col)) + 1;
  const width = GUT + columns * PITCH + 6;
  const height = TOP * 2 + flow.lanes.length * LANEH;
  const byId = new Map(flow.nodes.map((node) => [node.id, node]));
  const place = (node: FlowNode) => ({ x: GUT + 8 + node.col * PITCH, cy: TOP + (rowOf.get(node.lane) ?? 0) * LANEH + LANEH / 2 });
  const marker = `cases-arrow-${id}`;

  return (
    <svg className="cases-flow" viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img" aria-label={flow.label}>
      <defs>
        <marker id={marker} viewBox="0 0 8 8" refX="7.5" refY="4" markerWidth="8" markerHeight="8" orient="auto">
          <path d="M0,0.5 L8,4 L0,7.5 z" fill="currentColor" />
        </marker>
      </defs>
      {flow.lanes.map((lane, index) => {
        const y = TOP + index * LANEH;
        return (
          <g key={lane} className={`cases-lane cases-lane--${lane}`}>
            <rect className="cases-band" x={0} y={y} width={width} height={LANEH} />
            <text className="cases-lane-label" x={12} y={y + LANEH / 2 + 4}>
              {LANE_NAMES[lane] ?? lane}
            </text>
          </g>
        );
      })}
      {flow.edges.map(([from, to, label], index) => {
        const source = byId.get(from);
        const target = byId.get(to);
        if (!source || !target) return null;
        const s = place(source);
        const t = place(target);
        let d: string;
        let lx: number;
        let ly: number;
        let anchor: 'start' | 'middle' | 'end';
        if (source.col === target.col) {
          const x = s.x + COLW / 2;
          const up = (rowOf.get(target.lane) ?? 0) < (rowOf.get(source.lane) ?? 0);
          const y1 = up ? s.cy - BOXH / 2 : s.cy + BOXH / 2;
          const y2 = up ? t.cy + BOXH / 2 : t.cy - BOXH / 2;
          d = `M${x},${y1} V${y2}`;
          [lx, ly, anchor] = [x + 6, (y1 + y2) / 2 + 4, 'start'];
        } else if (rowOf.get(source.lane) === rowOf.get(target.lane)) {
          const x1 = s.x + COLW;
          d = `M${x1},${s.cy} H${t.x}`;
          [lx, ly, anchor] = [(x1 + t.x) / 2, s.cy - 6, 'middle'];
        } else {
          const x1 = s.x + COLW;
          const xm = t.x - 14;
          d = `M${x1},${s.cy} H${xm} V${t.cy} H${t.x}`;
          [lx, ly, anchor] = [xm - 4, (s.cy + t.cy) / 2 + 4, 'end'];
        }
        return (
          <g key={`${from}-${to}-${index}`}>
            <path className="cases-edge" d={d} markerEnd={`url(#${marker})`} />
            {label ? (
              <text className="cases-edge-label" x={lx} y={ly} textAnchor={anchor}>
                {label}
              </text>
            ) : null}
          </g>
        );
      })}
      {flow.nodes.map((node) => {
        const { x, cy } = place(node);
        const y = cy - BOXH / 2;
        const kind = node.kind ?? 'act';
        const lines = wrap(node.text, kind === 'dec' ? 15 : kind === 'end' ? 17 : 19);
        const base = cy - ((lines.length - 1) * LINE) / 2 + 4;
        const hex = [
          [x + 14, y],
          [x + COLW - 14, y],
          [x + COLW, cy],
          [x + COLW - 14, y + BOXH],
          [x + 14, y + BOXH],
          [x, cy],
        ];
        return (
          <g key={node.id} className={`cases-node cases-node--${kind} cases-lane--${node.lane}`}>
            {kind === 'dec' ? (
              <polygon points={hex.map(([a, b]) => `${a},${b}`).join(' ')} />
            ) : (
              <rect x={x} y={y} width={COLW} height={BOXH} rx={kind === 'end' ? BOXH / 2 : 6} />
            )}
            <text className="cases-node-text" textAnchor="middle">
              {lines.map((text, index) => (
                <tspan key={text + index} x={x + COLW / 2} y={base + index * LINE}>
                  {text}
                </tspan>
              ))}
            </text>
            <text className="cases-node-tag" x={x + 2} y={y - 4}>
              {node.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
