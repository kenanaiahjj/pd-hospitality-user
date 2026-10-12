import { FLOWS } from './data/flows';
import type { Block } from './data/types';
import { Rich } from './rich';
import { Rulebook } from './rulebook';
import { ScaleChart, ScaleTable } from './scale';
import { Swimlane } from './swimlane';

function Legend() {
  return (
    <div className="cases-legend" aria-label="How to read the diagrams">
      {(
        [
          ['guest', 'Guest app'],
          ['desk', 'Front desk'],
          ['kabana', 'Cabana + PMS (system)'],
          ['vendor', 'Vendor app'],
        ] as const
      ).map(([lane, name]) => (
        <span key={lane}>
          <i className={`cases-swatch cases-lane--${lane}`} />
          {name}
        </span>
      ))}
      <span>
        <svg className="cases-shape" viewBox="0 0 26 14" aria-hidden="true">
          <rect x="1" y="1" width="24" height="12" rx="3" />
        </svg>
        Step
      </span>
      <span>
        <svg className="cases-shape" viewBox="0 0 26 14" aria-hidden="true">
          <polygon points="5,1 21,1 25,7 21,13 5,13 1,7" />
        </svg>
        Decision
      </span>
      <span>
        <svg className="cases-shape" viewBox="0 0 26 14" aria-hidden="true">
          <rect x="1" y="1" width="24" height="12" rx="6" strokeWidth="2.5" />
        </svg>
        Where the flow ends
      </span>
    </div>
  );
}

export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        switch (block.t) {
          case 'p':
            return (
              <p key={index} className={block.note ? 'cases-note' : undefined}>
                <Rich text={block.text} />
              </p>
            );
          case 'h3':
            return <h3 key={index}>{block.text}</h3>;
          case 'rules':
            return (
              <ul key={index} className="cases-rules">
                {block.items.map((item) => (
                  <li key={item.title}>
                    <strong>{item.title}</strong>
                    <Rich text={item.text} />
                  </li>
                ))}
              </ul>
            );
          case 'cards':
            return (
              <ul key={index} className="cases-cards">
                {block.items.map((item) => (
                  <li key={item.title}>
                    <div className="cases-card-head">
                      <strong>{item.title}</strong>
                      {item.pill ? <span className={`cases-pill cases-pill--${item.pill}`}>{item.pillText}</span> : null}
                    </div>
                    {item.lines.map((line) => (
                      <span key={line} className="cases-card-line">
                        {line}
                      </span>
                    ))}
                    {item.who ? <span className="cases-who">{item.who}</span> : null}
                  </li>
                ))}
              </ul>
            );
          case 'table':
            return (
              <div key={index} className="cases-tablewrap">
                <table className={`cases-table${block.kind === 'cases' ? ' cases-table--cases' : ''}`}>
                  <thead>
                    <tr>
                      {block.head.map((cell, i) => (
                        <th key={i}>{cell}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, r) =>
                      'group' in row ? (
                        <tr key={r} className="cases-group">
                          <th colSpan={block.head.length}>{row.group}</th>
                        </tr>
                      ) : (
                        <tr key={r}>
                          {row.cells.map((cell, c) =>
                            c === 0 ? (
                              <th key={c} scope="row">
                                <Rich text={cell} />
                              </th>
                            ) : (
                              <td key={c}>
                                <Rich text={cell} />
                              </td>
                            ),
                          )}
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            );
          case 'flow': {
            const flow = FLOWS[block.key];
            if (!flow) return <p key={index} className="cases-warn">No flow data for {block.key}.</p>;
            return (
              <figure key={index} className="cases-figure">
                <div className="cases-scroll">
                  <Swimlane id={block.key} flow={flow} />
                </div>
                <figcaption>
                  <Rich text={block.caption} />
                </figcaption>
              </figure>
            );
          }
          case 'legend':
            return <Legend key={index} />;
          case 'rulebook':
            return <Rulebook key={index} />;
          case 'scale-chart':
            return (
              <figure key={index} className="cases-figure">
                <div className="cases-scroll cases-scroll--pad">
                  <ScaleChart />
                </div>
                <figcaption>
                  <Rich text={block.caption} />
                </figcaption>
              </figure>
            );
          case 'scale-table':
            return <ScaleTable key={index} />;
        }
      })}
    </>
  );
}
