'use client';

import { useState } from 'react';
import { SCENARIO_TEXT } from './data/scenario-text';

export type ScenarioView = { id: string; group: string; title: string; adapted?: string };

/** The list comes from the pilot code. The given, when and then text is written, keyed by id. */
export function Scenarios({ rows, groups }: { rows: ScenarioView[]; groups: string[] }) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const text = (id: string) => SCENARIO_TEXT[id];
  const shown = rows.filter((row) => {
    if (!q) return true;
    const t = text(row.id);
    return `${row.id} ${row.title} ${t?.given ?? ''} ${t?.when ?? ''} ${t?.then ?? ''}`.toLowerCase().includes(q);
  });
  const missing = rows.filter((row) => !text(row.id)).map((row) => row.id);
  const stale = Object.keys(SCENARIO_TEXT).filter((id) => !rows.some((row) => row.id === id));

  return (
    <div className="cases-scenarios">
      <div className="cases-tools">
        <label htmlFor="cases-q">Filter scenarios</label>
        <input id="cases-q" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try: PMS, refund, Si Señor, race" autoComplete="off" />
        <span className="cases-count" aria-live="polite">
          {q ? `${shown.length} of ${rows.length} scenarios` : `${rows.length} scenarios`}
        </span>
      </div>
      {missing.length || stale.length ? (
        <p className="cases-warn">
          {missing.length ? `No written steps yet for: ${missing.join(', ')}. ` : ''}
          {stale.length ? `Written steps for scenarios that no longer exist: ${stale.join(', ')}.` : ''}
        </p>
      ) : null}
      {groups.map((group) => {
        const inGroup = shown.filter((row) => row.group === group);
        if (!inGroup.length) return null;
        return (
          <div key={group} className="cases-sub">
            <h3>{group}</h3>
            <div className="cases-tablewrap">
              <table className="cases-table cases-table--scenarios">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Scenario</th>
                    <th>Given</th>
                    <th>When</th>
                    <th>Then</th>
                  </tr>
                </thead>
                <tbody>
                  {inGroup.map((row) => {
                    const t = text(row.id);
                    return (
                      <tr key={row.id}>
                        <td className="cases-id">{row.id}</td>
                        <td className="cases-strong">
                          {row.title}
                          {row.adapted ? <span className="cases-stnote">Adapted: {row.adapted}</span> : null}
                        </td>
                        <td>{t?.given ?? ''}</td>
                        <td>{t?.when ?? ''}</td>
                        <td>{t?.then ?? ''}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
