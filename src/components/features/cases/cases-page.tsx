import './cases.css';
import { Blocks } from './blocks';
import { CHECKED } from './data/meta';
import { SECTIONS } from './data/sections';
import type { Block, Section } from './data/types';
import { lastRun, scenarioGroups, scenarioRows } from './derived';
import { Scenarios } from './scenarios';
import { CardStates, Screens } from './screens';

/*
  /cases: how requests, bookings, payments and chats work in the pilot, in one
  page. Parts are read from the pilot's code (settings, state tables, scenarios,
  invariants, the last run) so they cannot drift. The rest is written data in
  ./data, with a date, and the chat screens are drawn in ./screens.tsx.
*/

const CHOICES: Block[] = [
  {
    t: 'rules',
    items: [
      { title: 'Cancel lives on the card', text: 'Cancel and Withdraw both ask first, with Keep it or Yes. Outside the free window it reads Yes, ask to cancel and goes to the vendor.' },
      { title: 'One way to question a charge', text: 'The receipt card has one button. The front desk settles the question before checkout.' },
      { title: 'Quick actions stay with the desk', text: 'The desk chat keeps its quick-action cards. A vendor chat has a plus and a microphone and no quick actions.' },
      { title: 'Chats open at the newest message', text: 'A vendor chat starts with who is in it, so the guest knows nobody else can read it.' },
      { title: 'Before the vendor commits, no chat', text: 'The guest can call the vendor, ask the front desk or withdraw. When the vendor accepts, a banner opens the chat, the bell gets a note and the booking gets a Message row.' },
    ],
  },
];

type Extra = { after: string; section: Section; node?: 'screens' | 'states' | 'scenarios' };

const EXTRAS: Extra[] = [
  { after: 'situations', section: { id: 'screens', title: 'Chat screens, from the running app', eyebrow: 'Drawn by hand', blocks: [{ t: 'p', text: 'Redrawn from the app on the chat branch, using its demo data: Ana in Room 304 at The Henry Resort Dumaguete. Photos are shown as colour blocks.' }] }, node: 'screens' },
  { after: 'screens', section: { id: 'states', title: 'The same booking in eight states', blocks: [{ t: 'p', text: 'The card the desk chat shows for each state. The vendor chat shows the same facts in the booking bar.' }] }, node: 'states' },
  { after: 'states', section: { id: 'choices', title: 'Choices the app makes', blocks: CHOICES } },
  { after: 'open', section: { id: 'scenarios', title: 'Test scenarios', eyebrow: 'Read from the pilot code', blocks: [] }, node: 'scenarios' },
];

function ordered(): { section: Section; node?: Extra['node'] }[] {
  const out: { section: Section; node?: Extra['node'] }[] = [];
  const place = (after: string) => {
    for (const extra of EXTRAS.filter((e) => e.after === after)) {
      out.push({ section: extra.section, node: extra.node });
      place(extra.section.id);
    }
  };
  for (const section of SECTIONS) {
    out.push({ section });
    place(section.id);
  }
  return out;
}

export function CasesPage() {
  const sections = ordered();
  const run = lastRun();
  const rows = scenarioRows();
  return (
    <div className="cases">
      <div className="cases-layout">
        <nav className="cases-nav" aria-label="Sections">
          <ul>
            {sections.map(({ section }) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>{section.title ?? section.id}</a>
              </li>
            ))}
          </ul>
        </nav>
        <main className="cases-main">
          <header className="cases-header">
            <span className="cases-eyebrow">Pilot simulation · The Henry Resort Dumaguete</span>
            <h1>Cabana cases</h1>
            <p className="cases-lede">
              How a request moves between the guest, the front desk and the vendor, what state it can be in, what happens when something goes wrong, and what the app does today. Settings, state tables, scenarios and invariants are read from the app&apos;s code, so they stay true. The rest is written, and was last checked on {CHECKED.date} against {CHECKED.against}.
            </p>
            {run ? (
              <p className="cases-note">
                Last recorded scenario run: {run.passed} of {run.total} passed on {new Date(run.ranAt).toDateString()}.
              </p>
            ) : null}
          </header>
          {sections.map(({ section, node }) => (
            <section key={section.id} id={section.id} className="cases-section">
              {section.eyebrow ? <span className="cases-eyebrow">{section.eyebrow}</span> : null}
              {section.title ? <h2>{section.title}</h2> : null}
              <Blocks blocks={section.blocks} />
              {node === 'screens' ? <Screens /> : null}
              {node === 'states' ? <CardStates /> : null}
              {node === 'scenarios' ? <Scenarios rows={rows} groups={scenarioGroups()} /> : null}
            </section>
          ))}
          <footer className="cases-footer">
            Sources: the Cabana pilot code on the chat branch, the design review meeting, and the resort&apos;s public listings for its venues and services. Every value is a test setting for the simulation and has not been agreed with Henry&apos;s.
          </footer>
        </main>
      </div>
    </div>
  );
}
