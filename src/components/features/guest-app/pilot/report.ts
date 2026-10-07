import { INVARIANT_IDS, type RunSummary, type ScenarioResult } from './run';

/*
  Turns a run into one page that opens with no server and a JSON file a
  developer can diff. Pure string-building: the test that writes the files lives
  in report.test.ts.
*/

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const INVARIANT_NAMES: Record<string, string> = {
  I1: 'No overbooking',
  I2: 'No double charge',
  I3: 'Nothing charged without a yes',
  I4: 'No slot held forever',
  I5: 'Ledger matches the folio',
  I6: 'Only drawn transitions',
  I7: 'One state everywhere',
  I8: 'Every failure reaches the desk',
  I9: 'No open charge at checkout',
};

export function toJson(run: RunSummary) {
  return {
    ...run,
    invariantNames: INVARIANT_NAMES,
    adapted: run.results.filter((r) => r.adapted).map((r) => ({ id: r.id, change: r.adapted })),
    replay: `PILOT_SEED=${run.seed} PILOT_STEPS=${run.chaosSteps} npm run pilot:replay`,
  };
}

export function toHtml(run: RunSummary): string {
  const groups = [...new Set(run.results.map((r) => r.group))];
  const invariantRows = INVARIANT_IDS.map((id) => {
    const broke = run.results.filter((r) => r.invariants[id] !== 'held');
    return `<tr><td>${id}</td><td>${esc(INVARIANT_NAMES[id] ?? '')}</td><td class="${broke.length ? 'bad' : 'good'}">${broke.length ? `broke in ${broke.map((r) => r.id).join(', ')}` : `held through ${run.results.length} scenarios`}</td></tr>`;
  }).join('');
  const row = (r: ScenarioResult) =>
    `<tr class="${r.pass ? '' : 'fail'}"><td>${r.id}</td><td>${esc(r.title)}${r.adapted ? ` <span class="tag">adapted</span>` : ''}</td><td class="${r.pass ? 'good' : 'bad'}">${r.pass ? 'Pass' : 'Fail'}</td><td>${r.steps}</td><td>${r.ms} ms</td><td class="states">${r.states.map(esc).join('<br>')}${r.error ? `<br><b>${esc(r.error)}</b>` : ''}</td></tr>`;
  const sections = groups
    .map((g) => `<h2>${esc(g)}</h2><table><thead><tr><th>ID</th><th>Scenario</th><th>Result</th><th>Steps</th><th>Time</th><th>States reached</th></tr></thead><tbody>${run.results.filter((r) => r.group === g).map(row).join('')}</tbody></table>`)
    .join('');
  const adapted = run.results.filter((r) => r.adapted);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cabana pilot results</title>
<style>
:root{--bg:#fbfaf7;--fg:#1e2a26;--mut:#66726d;--line:#e3dfd5;--good:#1d7a4f;--bad:#b3261e;--tag:#f0e6c8}
@media (prefers-color-scheme:dark){:root{--bg:#161b19;--fg:#e8ece9;--mut:#9aa7a1;--line:#2c3532;--good:#5fcf97;--bad:#ff8a80;--tag:#3a3420}}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
main{max-width:1100px;margin:0 auto;padding:24px 16px 64px}
h1{margin:0 0 4px;font-size:26px}h2{margin:32px 0 8px;font-size:18px}
.sum{display:flex;gap:12px;flex-wrap:wrap;margin:16px 0}.card{border:1px solid var(--line);border-radius:12px;padding:12px 16px;min-width:140px}
.card b{display:block;font-size:24px}.mut{color:var(--mut)}
table{width:100%;border-collapse:collapse;font-size:13px}th,td{text-align:left;padding:6px 8px;border-bottom:1px solid var(--line);vertical-align:top}
.good{color:var(--good);font-weight:600}.bad{color:var(--bad);font-weight:600}.states{color:var(--mut);font-size:12px}
.tag{background:var(--tag);border-radius:6px;padding:1px 6px;font-size:11px}code{background:var(--line);padding:2px 6px;border-radius:6px}
@media (max-width:640px){th:nth-child(4),td:nth-child(4),th:nth-child(5),td:nth-child(5){display:none}}
</style></head><body><main>
<h1>Cabana pilot: bookings, payments and chat</h1>
<div class="mut">Run ${esc(run.ranAt)} · seed ${run.seed} · chaos run ${run.chaosSteps.toLocaleString()} steps</div>
<div class="sum">
<div class="card"><b class="${run.failed ? 'bad' : 'good'}">${run.passed} / ${run.total}</b>scenarios pass</div>
<div class="card"><b>${run.invariantChecks.toLocaleString()}</b>invariant checks</div>
<div class="card"><b class="${INVARIANT_IDS.every((id) => run.results.every((r) => r.invariants[id] === 'held')) ? 'good' : 'bad'}">9 / 9</b>rules ${INVARIANT_IDS.every((id) => run.results.every((r) => r.invariants[id] === 'held')) ? 'held' : 'checked'}</div>
</div>
<p>Re-run: <code>npm run pilot:report</code>. Replay a chaos failure: <code>PILOT_SEED=${run.seed} PILOT_STEPS=${run.chaosSteps} npm run pilot:replay</code></p>
<h2>The nine rules, checked after every step</h2>
<table><thead><tr><th>ID</th><th>Rule</th><th>Outcome</th></tr></thead><tbody>${invariantRows}</tbody></table>
${adapted.length ? `<h2>Scenarios adapted after the 7 Oct answers</h2><ul>${adapted.map((r) => `<li><b>${r.id}</b> ${esc(r.adapted ?? '')}</li>`).join('')}</ul>` : ''}
${sections}
</main></body></html>`;
}
