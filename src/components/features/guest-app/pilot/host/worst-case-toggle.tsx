'use client';

import { useSyncExternalStore } from 'react';

/*
  Demo data / Worst case, for the break-ui audit. Dev only: in a production
  build it renders nothing. Plain chrome, not part of the design under test.
  Flipping it reloads with ?data=worst (or without it); the catalogue's
  fingerprint changes with it, so the demo stay starts afresh.
*/

const read = () => new URLSearchParams(window.location.search).get('data') === 'worst';
const subscribe = () => () => {};

export function WorstCaseToggle() {
  const worst = useSyncExternalStore(subscribe, read, () => false);
  const ready = useSyncExternalStore(subscribe, () => true, () => false);
  if (process.env.NODE_ENV === 'production' || !ready) return null;
  const pick = (next: boolean) => {
    if (next === worst) return;
    const url = new URL(window.location.href);
    if (next) url.searchParams.set('data', 'worst');
    else url.searchParams.delete('data');
    window.location.assign(url.toString());
  };
  return (
    <div role="radiogroup" aria-label="Test data" style={{ position: 'fixed', insetBlockStart: 4, insetInlineStart: 4, zIndex: 2147483000, display: 'flex', gap: 2, padding: 2, borderRadius: 8, background: 'rgb(0 0 0 / 0.12)', font: '600 10px/1 system-ui, sans-serif' }}>
      {([['Demo data', false], ['Worst case', true]] as const).map(([label, value]) => (
        <button
          key={label}
          type="button"
          role="radio"
          aria-checked={worst === value}
          onClick={() => pick(value)}
          style={{ padding: '4px 7px', border: 0, borderRadius: 6, background: worst === value ? '#fff' : 'transparent', color: '#222', font: 'inherit' }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
