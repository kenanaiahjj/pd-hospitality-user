import type { ReactNode } from 'react';

/*
  Static drawings of the chat screens, redrawn from the running app with its
  demo data (Ana, Room 304, The Henry Resort Dumaguete). Photos are colour blocks. These
  are the one part of /cases that is drawn by hand: when a screen changes in
  the app, change it here.
*/

type Kind = 'bike' | 'tour' | 'table' | 'goods' | 'pool';
const TONE: Record<Kind, string> = {
  bike: 'linear-gradient(135deg,#2F4A3F,#8DA88F)',
  tour: 'linear-gradient(135deg,#1E6E8A,#7CC4C9)',
  table: 'linear-gradient(135deg,#7A4A2E,#D9A777)',
  goods: 'linear-gradient(135deg,#8A6A3E,#E6D2A4)',
  pool: 'linear-gradient(135deg,#17506B,#79B8CE)',
};

function Glyph({ name }: { name: Kind | 'back' | 'receipt' | 'up' | 'down' | 'wrench' | 'bell' | 'mic' | 'phone' }) {
  const p: Record<string, ReactNode> = {
    bike: <><circle cx="6" cy="16" r="3.5" /><circle cx="18" cy="16" r="3.5" /><path d="M6 16l4-8h4l4 8M10 8H8" /></>,
    tour: <><circle cx="12" cy="12" r="8" /><path d="M15 9l-2 6-4 0 2-6z" /></>,
    table: <path d="M8 4v16M5 4v6a3 3 0 006 0V4M17 4c-2 2-2 6 0 8v8" />,
    goods: <path d="M5 8h14l-1 12H6zM9 8a3 3 0 016 0" />,
    pool: <circle cx="12" cy="12" r="8" />,
    receipt: <path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6" />,
    back: <path d="M15 5l-7 7 7 7" />,
    up: <path d="M6 15l6-6 6 6" />,
    down: <path d="M6 9l6 6 6-6" />,
    wrench: <path d="M14 7a4 4 0 105 5l-8 8-3-3 8-8z" />,
    bell: <path d="M6 17h12l-2-3V10a4 4 0 00-8 0v4zM10 20h4" />,
    mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0014 0M12 18v3" /></>,
    phone: <path d="M6 4h4l1 5-2 1a11 11 0 005 5l1-2 5 1v4a2 2 0 01-2 2A15 15 0 014 6a2 2 0 012-2z" />,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {p[name]}
    </svg>
  );
}

const Tile = ({ kind }: { kind: Kind }) => (
  <div className="ca-tile" style={{ background: TONE[kind] }}>
    <span className="ca-badge">
      <Glyph name={kind} />
    </span>
  </div>
);

const Bell = () => (
  <svg className="ca-bellicon" viewBox="0 0 48 48" aria-hidden="true">
    <path d="M6 34a18 18 0 0136 0z" fill="#E8C770" />
    <rect x="4" y="34" width="40" height="4" rx="2" fill="#E8C770" />
    <circle cx="24" cy="12" r="3" fill="#E8C770" />
  </svg>
);

const Status = ({ children }: { children: ReactNode }) => <div className="ca-sbar"><span>{children}</span><span>5G</span></div>;
const Sys = ({ children }: { children: ReactNode }) => <div className="ca-sys">{children}</div>;
const Composer = ({ placeholder }: { placeholder: string }) => (
  <div className="ca-comp">
    <span className="ca-plus">+</span>
    <span className="ca-field">{placeholder}</span>
    <span className="ca-mic"><Glyph name="mic" /></span>
  </div>
);
const Head = ({ kind, title, sub }: { kind?: Kind; title: string; sub: string }) => (
  <div className="ca-head">
    <span className="ca-circ"><Glyph name="back" /></span>
    {kind ? <Tile kind={kind} /> : null}
    <div>
      <div className="ca-ttl">{title}</div>
      <div className="ca-sub">{sub}</div>
    </div>
  </div>
);
const Stub = ({ day = '12' }: { day?: string }) => (
  <div className="ca-stub">
    THU<b>{day}</b>
  </div>
);
const Receipt = ({ status = 'In question' }: { status?: string }) => (
  <div className="ca-rcpt">
    <div className="ca-rcpt-a">
      <span className="ca-ic"><Glyph name="receipt" /></span>
      <div className="ca-rcpt-t">
        <b>Late return fee</b>
        <span>From Partner bike shop · Bike rental</span>
      </div>
      <div className="ca-amt">
        <b>₱300</b>
        <span className="ca-chip ca-chip--warn">{status}</span>
      </div>
    </div>
    <div className="ca-rcpt-b">Charged to your room</div>
  </div>
);

function Phone({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="ca-phone" role="group" aria-label={label}>
      {children}
    </div>
  );
}

function Fig({ label, title, caption, children }: { label: string; title: string; caption: string; children: ReactNode }) {
  return (
    <figure className="cases-slot">
      <Phone label={label}>{children}</Phone>
      <figcaption>
        <b>{title}</b>
        {caption}
      </figcaption>
    </figure>
  );
}

type CardOptions = { tone: Kind; chip: string; chipClass: string; title: string; vendor: string; line?: string; amount?: string; primary?: string; secondary?: string; count?: [string, string]; note?: string };
function BookingCard({ tone, chip, chipClass, title, vendor, line, amount, primary, secondary, count, note }: CardOptions) {
  return (
    <div className="ca-bk">
      <div className="ca-ph" style={{ background: TONE[tone] }}>
        <span className={`ca-chip ca-chip--${chipClass}`}>{chip}</span>
      </div>
      <div className="ca-bd">
        <h5>{title}</h5>
        <div className="ca-vn">{vendor}</div>
        {count ? (
          <div className="ca-count">
            <i />
            {count[0]}
            <u>{count[1]}</u>
          </div>
        ) : null}
        {line ? (
          <div className="ca-price">
            <span>{line}</span>
            <b>{amount}</b>
          </div>
        ) : null}
        {note ? <div className="ca-note">{note}</div> : null}
        {primary ? <button type="button" className="ca-btn ca-btn--pri">{primary}</button> : null}
        {secondary ? <button type="button" className="ca-btn ca-btn--ghost">{secondary}</button> : null}
      </div>
    </div>
  );
}

export function Screens() {
  const rows: [Kind, string, string, string][] = [
    ['bike', 'Partner bike shop', 'Ana questioned the ₱300 charge. The front desk will settle it before checkout.', 'Bike rental · Confirmed · Thu, Nov 12'],
    ['table', 'The Poolside Bar & Lounge', 'See you at 12:00! Your table is ready for you.', 'Table for 4 · Confirmed · Today'],
    ['goods', 'Artisan pasalubong', 'Your order is at the front desk, held for you.', 'Pasalubong · Ready to collect'],
  ];
  return (
    <div className="cases-phones">
      <Fig label="Chat page with the front desk card and one chat per booking" title="Chat" caption="The front desk is its own plum card with a gold pill. Under it, one chat per outside-vendor booking that has opened, newest first, each with a photo tile, a type badge and its status in the line under the preview. A request still waiting for its vendor has no chat, so it is not listed.">
        <Status>7:31</Status>
        <div className="ca-top"><span className="ca-circ"><Glyph name="back" /></span><span className="ca-circ ca-circ--dash"><Glyph name="wrench" /></span><span className="ca-circ ca-circ--bell"><Glyph name="bell" /></span></div>
        <div className="ca-h1">Chat</div>
        <div className="ca-deskcard">
          <Bell />
          <div>
            <b>Front desk</b>
            <span>Booked by Marites at the front desk, as you asked.</span>
            <em>Chat with the front desk</em>
          </div>
        </div>
        {rows.map(([kind, name, preview, meta]) => (
          <div key={name} className="ca-row">
            <Tile kind={kind} />
            <div className="ca-rt">
              <div className="ca-n">{name}<i>7:31 PM</i></div>
              <div className="ca-p">{preview}</div>
              <div className="ca-m">{meta}</div>
            </div>
          </div>
        ))}
        <Sys>A request still waiting for its vendor has no chat yet. It shows on its booking page.</Sys>
      </Fig>

      <Fig label="Vendor chat for a confirmed bike rental with an automatic greeting and an extra charge in question" title="Guest and vendor" caption="One to one, opened when the vendor committed. It starts with the request, the note and who is in it. The vendor's greeting is an automatic message and says so. It arrives once the booking is confirmed, so a card hold waits for its payment first. The booking bar keeps the booking in view, and the extra charge is a receipt card with its status.">
        <Status>7:31</Status>
        <Head kind="bike" title="Partner bike shop" sub="Bike rental" />
        <div className="ca-bar">
          <div className="ca-l1">
            <Stub />
            <div className="ca-stat"><span className="ca-chip ca-chip--ok">Confirmed</span><span className="ca-facts">1:30 PM · 2 bikes · Back by 8:00 PM</span></div>
            <span className="ca-chev"><Glyph name="down" /></span>
          </div>
        </div>
        <div className="ca-thread">
          <Sys>You asked for Bike rental: 2 bikes, Thu 12 Nov, 1:30 PM.</Sys>
          <div className="ca-bub ca-bub--me">One with a child seat, if you have it.</div>
          <Sys>Only you and them are in this chat.</Sys>
          <div className="ca-bub ca-bub--them">Hi Ana, thanks for booking with us! Your 2 bikes are set for Thu 12 Nov, 1:30 PM. Please bring an ID.<span className="ca-auto">Auto-reply</span></div>
          <div className="ca-bub ca-bub--them">The child seat is on the second one, and helmets are in the basket.</div>
          <Receipt />
          <Sys>You questioned the ₱300 charge. The front desk will settle it before checkout.</Sys>
        </div>
        <Composer placeholder="Message Partner bike shop" />
      </Fig>

      <Fig label="Booking page for a request waiting for the vendor, with no chat yet" title="Waiting for the vendor" caption="There is no chat yet. The guest sees the price, a quiet countdown, the note they sent and three actions: call the vendor, ask the front desk, or withdraw. Nothing is charged, and a card is only held. The chat opens when the vendor accepts.">
        <Status>7:31</Status>
        <Head title="Apo Island boat trip" sub="Partner boat operator" />
        <div className="ca-bk">
          <div className="ca-ph ca-ph--tall" style={{ background: TONE.tour }}><span className="ca-chip ca-chip--warn">Awaiting confirmation</span></div>
          <div className="ca-bd">
            <div className="ca-tk"><Stub /><div><b>10:00 AM</b><span>2 guests</span></div></div>
            <div className="ca-price"><span>Held, not charged · taken only if they confirm</span><b>₱3,800</b></div>
            <div className="ca-count"><i />Partner boat operator has 30 min to confirm<u>until 8:01 PM</u></div>
            <div className="ca-note">Your note: The early boat, if there is a choice.</div>
            <button type="button" className="ca-btn ca-btn--line"><Glyph name="phone" />Call Partner boat operator</button>
            <button type="button" className="ca-btn">Ask the front desk</button>
            <button type="button" className="ca-btn ca-btn--ghost">Withdraw request</button>
          </div>
        </div>
        <Sys>A chat with Partner boat operator opens once they accept.</Sys>
      </Fig>

      <Fig label="Front desk chat with an outlet's automatic message and a booking card" title="Guest and front desk" caption="The app's own desk chat. The hotel's outlets talk here instead of in a chat of their own, labelled Auto-reply. A booking the desk made is a card with a photo, a status chip, a date stub, the price line, one main action and a quiet Cancel. Quick actions stay under it.">
        <Status>7:31</Status>
        <Head title="Front desk" sub="The Henry Resort Dumaguete" />
        <div className="ca-thread ca-thread--tight">
          <div className="ca-bub ca-bub--them">Booked by Marites at the front desk, as you asked.</div>
        </div>
        <div className="ca-bk">
          <div className="ca-ph" style={{ background: TONE.pool }}><span className="ca-chip ca-chip--ok">Confirmed</span></div>
          <div className="ca-bd">
            <h5>Personal training session</h5>
            <div className="ca-vn">The Henry</div>
            <div className="ca-tk"><Stub /><div><b>10:00 AM</b><span>1 guest</span></div></div>
            <div className="ca-price"><span>Charged to your room</span><b>₱1,400</b></div>
            <button type="button" className="ca-btn ca-btn--pri">Show QR</button>
            <button type="button" className="ca-btn ca-btn--ghost">Cancel</button>
          </div>
        </div>
        <div className="ca-thread ca-thread--tight"><div className="ca-bub ca-bub--them">Hi Ana, your session is booked for Thu 12 Nov, 10:00 AM.<span className="ca-auto">Auto-reply</span></div></div>
        <div className="ca-qa"><div>Towels<span>Request fresh towels</span></div><div>Housekeeping<span>Ask for room cleaning</span></div></div>
        <Composer placeholder="Ask the front desk" />
      </Fig>

      <Fig label="Front desk dispute sheet showing the guest and vendor chat read only" title="Front desk reads a dispute" caption="A sheet opened from the prototype controls. It has a Read only tag, no composer, and the three decisions. A disputed vendor cancellation shows Cancellation stands and Reinstate instead.">
        <Status>2:15</Status>
        <div className="ca-head"><span className="ca-circ"><Glyph name="back" /></span><div><div className="ca-ttl ca-ttl--sm">Late return fee</div><div className="ca-sub">Ana · Room 304 · Partner bike shop</div></div><span className="ca-tagpill">Read only</span></div>
        <div className="ca-thread">
          <Sys>The front desk is reading this chat because a dispute is open. Ana and Partner bike shop were told.</Sys>
          <div className="ca-bub ca-bub--me">I returned the bikes at 5:50, not 6:10.</div>
          <div className="ca-bub ca-bub--them">Our log says 6:10. That is 70 minutes late.</div>
          <div className="ca-bub ca-bub--me">Can you check again?</div>
          <div className="ca-bub ca-bub--them">Checked. It is 6:10.</div>
          <Receipt />
        </div>
        <div className="ca-foot">
          <Sys>You cannot write here. Ask each side in your own chat with them.</Sys>
          <div className="ca-row3"><button type="button" className="ca-btn">Waive</button><button type="button" className="ca-btn">Adjust</button><button type="button" className="ca-btn ca-btn--pri">Uphold</button></div>
        </div>
      </Fig>

      <Fig label="Prototype controls Events tab showing vendor and front desk actions" title="How vendor and desk are simulated" caption="There is no vendor app or desk app yet. A tester plays both from this tab. Actions are grouped by booking, and the ones that cannot happen yet are greyed with the reason. Clock, Stay and Problems move time, change the stay, and break the PMS or the gateway.">
        <Status>7:31</Status>
        <Head title="Prototype controls" sub="Events" />
        <div className="ca-ctl">
          <div className="ca-tabs"><span className="on">Bookings</span><span>Stay</span><span>Clock</span><span>Problems</span></div>
          <div className="ca-grp">Bike rental · Partner bike shop</div>
          <div className="ca-grp2">Vendor</div>
          <div className="ca-acts">{['Confirm', 'Decline', 'Scan QR', 'Mark done', 'Add ₱300 charge', 'Claim ₱500 damage', 'Running late', 'Cancel'].map((a) => <span key={a}>{a}</span>)}</div>
          <div className="ca-grp2">Front desk</div>
          <div className="ca-acts">{['Approve', 'Reinstate', 'Mark ready', 'Read dispute', 'Uphold', 'Waive', 'Adjust to ₱100'].map((a) => <span key={a}>{a}</span>)}</div>
          <div className="ca-grp">Every vendor</div>
          <div className="ca-acts">{['Set Away', 'Lose signal', 'Block slot', 'Remove listing'].map((a) => <span key={a}>{a}</span>)}</div>
          <div className="ca-grp">Not possible yet</div>
          <div className="ca-acts"><span className="off">Scan before it is confirmed</span><span className="off">Cancel after the start</span></div>
        </div>
      </Fig>
    </div>
  );
}

const STATES: { title: string; text: string; where: string; card: ReactNode }[] = [
  { title: 'Awaiting confirmation', text: 'The request waits for the vendor. A quiet countdown shows how long they have. Nothing is charged: a card is only held, and a room charge is made on accept. There is no chat yet, and the guest can call the vendor.', where: 'Booking page and desk chat. No vendor chat yet.', card: <BookingCard tone="tour" chip="Awaiting confirmation" chipClass="warn" title="Apo Island boat trip" vendor="Partner boat operator" line="Held, not charged · taken only if they confirm" amount="₱3,800" secondary="Withdraw request" count={['Partner boat operator has 30 min to confirm', 'until 8:01 PM']} /> },
  { title: 'Pay to confirm', text: 'An instant listing paid in full is waiting for the payment to finish. The slot is held for 15 minutes. A confirm-first vendor never shows this: its money is held at booking, so there is no second payment.', where: 'Desk chat, vendor chat.', card: <BookingCard tone="bike" chip="Pay to confirm" chipClass="warn" title="Bike rental" vendor="Partner bike shop" line="Pay in full" amount="₱700" primary="Pay now" secondary="Cancel" count={['Pay within 15 min to keep it', 'until 7:46 PM']} /> },
  { title: 'Confirmed', text: 'Charged as chosen. The main button is what the guest needs next, here the QR. Tables read Confirmed too, with nothing charged.', where: 'Everywhere the booking shows.', card: <BookingCard tone="bike" chip="Confirmed" chipClass="ok" title="Bike rental" vendor="Partner bike shop" line="Charged to your room" amount="₱700" primary="Show QR" secondary="Cancel" /> },
  { title: 'Ready to collect', text: 'Goods are marked ready by the desk and held. The card says where to collect.', where: 'Vendor chat, desk chat.', card: <BookingCard tone="goods" chip="Ready to collect" chipClass="ok" title="Single-origin coffee, 2" vendor="The lobby shop" line="Charged to your room" amount="₱840" secondary="Message the front desk" note="At the front desk, held for you." /> },
  { title: 'In progress', text: 'The vendor scanned the QR. The only thing left for the guest is to question a charge.', where: 'Vendor chat.', card: <BookingCard tone="bike" chip="In progress" chipClass="live" title="Bike rental" vendor="Partner bike shop" line="Charged to your room" amount="₱700" note="Back by 8:00 PM." /> },
  { title: 'Not booked', text: 'Withdrawn, declined, lapsed or not paid in time. The line under it says which, and nothing was charged. The guest can book again.', where: 'Booking page and desk chat.', card: <BookingCard tone="bike" chip="Not booked" chipClass="mute" title="Scooter" vendor="Partner bike shop" primary="Book again" secondary="Message the front desk" note="No answer in time · nothing charged" /> },
  { title: 'Cancelled', text: 'It says what happened to the money. A card payment says the refund is on its way.', where: 'Everywhere the booking shows.', card: <BookingCard tone="tour" chip="Cancelled" chipClass="bad" title="Apo Island boat trip" vendor="Partner boat operator" note="Your room charge was undone." /> },
  { title: 'Extra charge', text: 'A receipt card with who added it, a large amount and its status: Added, In question or Removed. The guest can question it.', where: 'Vendor chat.', card: <div className="ca-pad"><Receipt /></div> },
];

export function CardStates() {
  return (
    <div className="cases-states">
      {STATES.map((s) => (
        <div key={s.title} className="cases-state">
          <div className="ca-stage">{s.card}</div>
          <strong>{s.title}</strong>
          <p>{s.text}</p>
          <span className="cases-where">{s.where}</span>
        </div>
      ))}
    </div>
  );
}
