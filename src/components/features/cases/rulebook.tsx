import { INVARIANT_TEXT } from './data/invariants';
import { KNOWN_GAPS, RULE_GROUPS } from './data/rules';
import { bookingStateRows, cardPaymentRows, invariantRows, lastRun, roomPaymentRows, settingRows, type StateRow } from './derived';

const SOURCE_CLASS: Record<string, string> = { Meeting: 'meeting', Ken: 'ken', 'Test value': 'test', App: 'app' };
const STATUS_CLASS: Record<string, string> = { Built: 'built', Partly: 'partly', 'Not built': 'not' };

function StateTable({ title, rows }: { title: string; rows: StateRow[] }) {
  return (
    <div className="cases-tablewrap">
      <table className="cases-table">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th>State</th>
            <th>Can move to</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.status}>
              <th scope="row" className="cases-mono">
                {row.status}
              </th>
              <td>{row.to.length ? row.to.join(', ') : 'Nothing. This is an end.'}</td>
              <td>{row.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Rulebook() {
  const total = RULE_GROUPS.reduce((n, g) => n + g.rules.length, 0);
  const count = (status: string) => RULE_GROUPS.reduce((n, g) => n + g.rules.filter((r) => r.status === status).length, 0);
  const run = lastRun();
  return (
    <>
      <p>
        {total} rules, each with an ID that can be quoted. <strong>From</strong> says where a rule came from: the design review meeting, a decision Ken made in chat, a test value chosen for the simulation, or the app itself. <strong>In the app</strong> says what the pilot code does today: {count('Built')} built, {count('Partly')} partly built,{' '}
        {count('Not built')} not built or left out on purpose. Single letters in Drawn in are the flows further down this page.
      </p>
      <div className="cases-legend">
        {Object.entries(SOURCE_CLASS).map(([name, cls]) => (
          <span key={name}>
            <i className={`cases-dot cases-src--${cls}`} />
            {name}
          </span>
        ))}
      </div>
      <div className="cases-tablewrap">
        <table className="cases-table cases-table--rules">
          <thead>
            <tr>
              <th>ID</th>
              <th>Rule</th>
              <th>From</th>
              <th>In the app</th>
              <th>Drawn in</th>
            </tr>
          </thead>
          <tbody>
            {RULE_GROUPS.map((group) => [
              <tr key={group.group} className="cases-group">
                <th colSpan={5}>{group.group}</th>
              </tr>,
              ...group.rules.map((rule) => (
                <tr key={rule.id} id={`rule-${rule.id}`}>
                  <td className="cases-id">{rule.id}</td>
                  <td>{rule.text}</td>
                  <td>
                    <span className={`cases-tag cases-src--${SOURCE_CLASS[rule.from]}`}>{rule.from}</span>
                  </td>
                  <td>
                    <span className={`cases-tag cases-status--${STATUS_CLASS[rule.status]}`}>{rule.status}</span>
                    {rule.note ? <span className="cases-stnote">{rule.note}</span> : null}
                  </td>
                  <td className="cases-drawn">{rule.drawn}</td>
                </tr>
              )),
            ])}
          </tbody>
        </table>
      </div>

      <h3>Settings at a glance</h3>
      <p>Read from the pilot&apos;s config file, so this table is always what the app runs on. All are test values.</p>
      <div className="cases-tablewrap">
        <table className="cases-table">
          <thead>
            <tr>
              <th>Setting</th>
              <th>Value</th>
              <th>Rule</th>
            </tr>
          </thead>
          <tbody>
            {settingRows().map((row) => (
              <tr key={row.key}>
                <td>{row.label}</td>
                <td>{row.value}</td>
                <td className="cases-id">{row.rule}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3>State tables, from the code</h3>
      <p>Every move a booking or a payment is allowed to make, read from the engine&apos;s rules file. The diagrams above are drawn by hand. If they disagree with these tables, these tables are right.</p>
      <StateTable title="Booking states" rows={bookingStateRows()} />
      <StateTable title="Room payment states" rows={roomPaymentRows()} />
      <StateTable title="Card payment states" rows={cardPaymentRows()} />

      <h3>Things that must always be true</h3>
      <p>Checked after every step of every test, not only at the end. The names are read from the code.</p>
      <ul className="cases-rules">
        {invariantRows().map((row) => (
          <li key={row.id}>
            <strong>
              {row.id} · {row.name}
            </strong>
            {INVARIANT_TEXT[row.id] ?? ''}
          </li>
        ))}
      </ul>
      {run ? (
        <p className="cases-note">
          Last recorded run: {run.passed} of {run.total} scenarios passed, {run.invariantChecks.toLocaleString('en-US')} invariant checks, seed {run.seed}, on {new Date(run.ranAt).toDateString()}. Run <span className="cases-mono">npm run pilot:report</span> to refresh it.
        </p>
      ) : null}

      <h3>Known gaps in the app</h3>
      <p>Found while checking the code. None changes a rule above.</p>
      <ul className="cases-rules">
        {KNOWN_GAPS.map((gap) => (
          <li key={gap.title}>
            <strong>{gap.title}</strong>
            {gap.text}
          </li>
        ))}
      </ul>
    </>
  );
}
