'use client';

/*
  The pilot's side of the prototype controls. The app is always the guest's;
  everything the vendor or the front desk would do, and everything that can go
  wrong, is a button here. What they do shows up in the guest's chat and cards.
*/
import { useState } from 'react';
import { SCENE } from '../catalog';
import type { Booking, Pilot, Result } from '../types';
import { act, resetPilot, setTarget, usePilot } from './use-pilot';

const peso = (n: number) => `₱${n.toLocaleString('en-US')}`;
const stamp = (ms: number) => {
  const d = new Date(ms);
  const h = d.getUTCHours();
  return `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getUTCDay()]} ${d.getUTCDate()} Oct, ${((h + 11) % 12) + 1}:${String(d.getUTCMinutes()).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

export function PilotControls({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  const { pilot: p, target } = usePilot();
  const [last, setLast] = useState<string>('');
  const bookings = p.bookings();
  const chosen: Booking | undefined = (target ? bookings.find((b) => b.id === target) : undefined) ?? bookings.at(-1);
  const vendorId = chosen ? p.listing(chosen.listingId).vendorId : undefined;
  const vendorState = vendorId ? p.vendorState(vendorId) : undefined;
  const status = chosen?.status;

  const run = (label: string, fn: (q: Pilot) => Result<object> | void) => () => {
    const r = act(fn);
    setLast(r && !r.ok ? `${label}: refused (${r.reason}). ${r.message}` : `${label}: done`);
  };
  const V = (fn: (q: Pilot, v: string, b: Booking) => Result<object> | void) => (q: Pilot) => (chosen && vendorId ? fn(q, vendorId, chosen) : undefined);
  const needs = (ok: boolean | undefined, reason: string) => (ok ? undefined : reason);

  const tasks = p.tasks('open');
  const log = p.log().slice(-14).reverse();

  return (
    <div className="pilot-ctl">
      <button type="button" className="guest-prototype-event" onClick={onToggle}>
        <span className="guest-prototype-event__copy"><b>{active ? 'Leave the pilot' : 'Open the pilot'}</b><small>{active ? 'Back to the normal prototype.' : 'Maria, Villa 12, The Henry Resort Dumaguete. The app is always the guest’s.'}</small></span>
      </button>
      {last ? <p className="pilot-ctl__last" role="status">{last}</p> : null}

      <Section title={`Clock · ${stamp(p.now())}`}>
        <Btn label="+15 min" onClick={run('Clock', (q) => q.advanceMinutes(15))} />
        <Btn label="+1 hour" onClick={run('Clock', (q) => q.advanceHours(1))} />
        <Btn label="+4 hours" onClick={run('Clock', (q) => q.advanceHours(4))} />
        <Btn label="+1 day" onClick={run('Clock', (q) => q.advanceDays(1))} />
        <Btn label="To Fri 7:00 AM" onClick={run('Clock', (q) => q.advanceTo(q.at(SCENE.fri, '07:00')))} />
        <Btn label="To Sat 8:10 AM" onClick={run('Clock', (q) => q.advanceTo(q.at(SCENE.sat, '08:10')))} />
      </Section>

      <Section title="Which booking">
        {bookings.length === 0 ? <p className="pilot-muted">Nothing booked yet. Ask for something in the pilot first.</p> : (
          <label className="guest-field">
            <span>The vendor and desk buttons act on</span>
            <select value={chosen?.id ?? ''} onChange={(e) => setTarget(e.currentTarget.value)}>
              {bookings.map((b) => <option key={b.id} value={b.id}>{b.id} · {p.listing(b.listingId).title} · {b.status}</option>)}
            </select>
          </label>
        )}
      </Section>

      <Section title={`The vendor${vendorId ? ` · ${p.vendors().find((v) => v.id === vendorId)?.name}` : ''}`}>
        <Btn label="Open the request" onClick={run('Open', V((q, v, b) => q.vendor(v).open(b.id)))} disabled={needs(status === 'requested', 'Needs a request waiting for the vendor')} />
        <Btn label="Accept" onClick={run('Accept', V((q, v, b) => q.vendor(v).confirm(b.id)))} disabled={needs(status === 'requested', 'Needs a request waiting for the vendor')} />
        <Btn label="Not available" onClick={run('Decline', V((q, v, b) => q.vendor(v).decline(b.id, 'Fully booked that day')))} disabled={needs(status === 'requested', 'Needs a request waiting for the vendor')} />
        <Btn label="Send a message" onClick={run('Message', V((q, v, b) => q.vendor(v).message(b.threadId, 'Hi Maria, we will see you then. Anything we should prepare?')))} disabled={needs(Boolean(chosen), 'Needs a booking')} />
        <Btn label="Scan the QR" onClick={run('Scan', V((q, v, b) => q.vendor(v).scan(b.id)))} disabled={needs(status === 'confirmed' && chosen?.kind !== 'goods', 'Needs a confirmed rental or service')} />
        <Btn label="Mark completed" onClick={run('Complete', V((q, v, b) => q.vendor(v).complete(b.id)))} disabled={needs(status === 'in-progress', 'Needs a service in progress')} />
        <Btn label="Seat the table" onClick={run('Seat', V((q, v, b) => q.vendor(v).seat(b.id)))} disabled={needs(status === 'reserved', 'Needs a reservation')} />
        <Btn label="Pack and send to desk" onClick={run('Pack', V((q, v, b) => q.vendor(v).sendToDesk(b.id)))} disabled={needs(chosen?.kind === 'goods' && status === 'confirmed', 'Needs a confirmed goods order')} />
        <Btn label="Add extra charge ₱300" onClick={run('Extra charge', V((q, v, b) => q.vendor(v).addExtra(b.id, 300, 'Late return fee')))} disabled={needs(Boolean(chosen) && ['confirmed', 'in-progress', 'completed'].includes(status ?? '') && chosen?.kind !== 'goods' && chosen?.kind !== 'table', 'Needs a confirmed rental or service')} />
        <Btn label="Correct last extra to ₱150" onClick={run('Correct', V((q, v, b) => {
          const extra = q.payments(b.id).filter((x) => x.purpose === 'extra').at(-1);
          return extra ? q.vendor(v).correctExtra(extra.id, 150) : undefined;
        }))} disabled={needs(Boolean(chosen && p.payments(chosen.id).some((x) => x.purpose === 'extra')), 'Needs an extra charge')} />
        <Btn label="Mark no-show" onClick={run('No-show', V((q, v, b) => q.vendor(v).markNoShow(b.id)))} disabled={needs(status === 'confirmed' || status === 'reserved', 'Needs a booking that has not started')} />
        <Btn label="Cancel it (reason)" onClick={run('Cancel', V((q, v, b) => q.vendor(v).cancel(b.id, 'Equipment breakdown')))} disabled={needs(Boolean(chosen), 'Needs a booking')} />
        <Btn label="Accept guest’s cancel" onClick={run('Answer cancel', V((q, v, b) => q.vendor(v).answerCancel(b.id, true)))} disabled={needs(chosen?.cancelRequested, 'Needs a cancel request inside the window')} />
        <Btn label="Decline guest’s cancel" onClick={run('Answer cancel', V((q, v, b) => q.vendor(v).answerCancel(b.id, false)))} disabled={needs(chosen?.cancelRequested, 'Needs a cancel request inside the window')} />
        <Btn label="Cancel the whole slot (weather)" onClick={run('Cancel slot', V((q, v, b) => q.vendor(v).cancelSlot(b.listingId, b.slotKeys[0]!, 'Weather')))} disabled={needs(Boolean(chosen), 'Needs a booking')} />
        <Btn label={vendorState?.online === false ? 'Back online' : 'Go offline'} onClick={run('Signal', V((q, v) => q.vendor(v).setOnline(vendorState?.online === false)))} disabled={needs(Boolean(chosen), 'Needs a booking')} />
        <Btn label={vendorState?.away ? 'Stop being away' : 'Set away'} onClick={run('Away', V((q, v) => q.vendor(v).setAway(!vendorState?.away)))} disabled={needs(Boolean(chosen), 'Needs a booking')} />
      </Section>

      <Section title="The front desk">
        <Btn label="Message the guest" onClick={run('Desk message', (q) => q.desk.message('Good afternoon Maria. Is there anything we can arrange for you today?'))} />
        <Btn label="Message in this booking" onClick={run('Desk message', (q) => (chosen ? q.desk.messageBooking(chosen.threadId, 'Noted, I have added that to your booking.') : undefined))} disabled={needs(Boolean(chosen), 'Needs a booking')} />
        <Btn label="Private note to vendor" onClick={run('Private note', (q) => (vendorId ? q.desk.privateNote(vendorId, 'Guest is a regular, please look after her.', chosen?.id) : undefined))} disabled={needs(Boolean(chosen), 'Needs a booking')} />
        <Btn label="Approve over-limit charge" onClick={run('Approve', (q) => (chosen ? q.desk.approve(chosen.id) : undefined))} disabled={needs(status === 'needs-approval', 'Needs a charge waiting for approval')} />
        <Btn label="Decline over-limit charge" onClick={run('Decline', (q) => (chosen ? q.desk.declineApproval(chosen.id) : undefined))} disabled={needs(status === 'needs-approval', 'Needs a charge waiting for approval')} />
        <Btn label="Book yoga for her (she asked in person)" onClick={run('Desk booking', (q) => q.desk.bookFor(q.maria.guestId, { listingId: 'yoga-class', date: SCENE.fri, time: '06:30', qty: 1, payMode: 'room' }, { staffName: 'Ana', asked: 'in-person' }))} />
        <Btn label="Mark goods ready" onClick={run('Ready', (q) => (chosen ? q.desk.markReady(chosen.id) : undefined))} disabled={needs(chosen?.kind === 'goods' && status === 'confirmed', 'Needs a confirmed goods order')} />
        <Btn label="Hand goods over" onClick={run('Hand over', (q) => (chosen ? q.desk.handOver(chosen.id) : undefined))} disabled={needs(chosen?.kind === 'goods' && status === 'ready', 'Needs goods that are ready')} />
        <Btn label="Reinstate lapsed request" onClick={run('Reinstate', (q) => (chosen ? q.desk.reinstate(chosen.id) : undefined))} disabled={needs(status === 'lapsed', 'Needs a lapsed request')} />
        <Btn label="Move her to Villa 14" onClick={run('Move room', (q) => q.desk.moveRoom(q.maria.stayId, 'Villa 14'))} />
        <Btn label="Shorten stay to Sun 11" onClick={run('Shorten stay', (q) => q.desk.shortenStay(q.maria.stayId, SCENE.sun))} />
        <Btn label="Cancel the stay" onClick={run('Cancel stay', (q) => q.desk.cancelStay(q.maria.stayId))} />
        <Btn label="Check out" onClick={run('Check out', (q) => q.desk.checkout(q.maria.stayId))} />
      </Section>

      <Section title="Things going wrong">
        <Btn label={`Hotel system: ${p.pms.mode}`} onClick={run('Hotel system', (q) => q.setPms({ mode: q.pms.mode === 'up' ? 'down' : q.pms.mode === 'down' ? 'reject' : 'up' }))} />
        <Btn label={`Drop next hotel reply: ${p.pms.dropNextReply ? 'on' : 'off'}`} onClick={run('Hotel reply', (q) => q.setPms({ dropNextReply: !q.pms.dropNextReply }))} />
        <Btn label={`Refuse reversals: ${p.pms.refuseReversal ? 'on' : 'off'}`} onClick={run('Reversals', (q) => q.setPms({ refuseReversal: !q.pms.refuseReversal }))} />
        <Btn label={`Gateway: ${p.gateway.mode}`} onClick={run('Gateway', (q) => q.setGateway({ mode: q.gateway.mode === 'ok' ? 'fail' : q.gateway.mode === 'fail' ? 'abandon' : 'ok' }))} />
        <Btn label={`Lose gateway callbacks: ${p.gateway.loseCallbacks ? 'on' : 'off'}`} onClick={run('Callbacks', (q) => q.setGateway({ loseCallbacks: !q.gateway.loseCallbacks }))} />
        <Btn label={`Fail refunds: ${p.gateway.failRefunds ? 'on' : 'off'}`} onClick={run('Refunds', (q) => q.setGateway({ failRefunds: !q.gateway.failRefunds }))} />
        <Btn label={`Allow paying twice: ${p.gateway.allowDoublePay ? 'on' : 'off'}`} onClick={run('Double pay', (q) => q.setGateway({ allowDoublePay: !q.gateway.allowDoublePay }))} />
        <Btn label="Guest notifications off / on" onClick={run('Notifications', (q) => q.setGuestNotifications(q.maria.guestId, q.outbox().some((n) => n.to === 'guest' && !n.delivered)))} />
      </Section>

      <Section title="Races">
        <Btn label="Withdraw and accept at the same instant" onClick={run('Race', (q) => {
          if (!chosen || !vendorId) return;
          q.together(() => q.guest().cancel(chosen.id), () => q.vendor(vendorId).confirm(chosen.id));
        })} disabled={needs(status === 'requested', 'Needs a request waiting for the vendor')} />
        <Btn label="Guest taps the request twice" onClick={run('Double tap', (q) => {
          if (!chosen) return;
          const draft = { listingId: chosen.listingId, date: new Date(chosen.start).toISOString().slice(0, 10), time: new Date(chosen.start).toISOString().slice(11, 16), qty: chosen.qty, days: chosen.days, payMode: chosen.payMode ?? undefined };
          q.guest().request(draft);
          return q.guest().request(draft);
        })} disabled={needs(Boolean(chosen), 'Needs a booking to copy')} />
        <Btn label="Another guest takes the same slot" onClick={run('Second guest', (q) => {
          if (!chosen) return;
          const ben = q.addGuest({ firstName: 'Ben', room: 'Villa 14', checkIn: '2026-10-05', checkOut: SCENE.tue });
          return q.guest(ben.guestId).request({ listingId: chosen.listingId, date: new Date(chosen.start).toISOString().slice(0, 10), time: new Date(chosen.start).toISOString().slice(11, 16), qty: chosen.qty, days: chosen.days, payMode: chosen.payMode ?? undefined });
        })} disabled={needs(Boolean(chosen), 'Needs a booking to copy')} />
      </Section>

      <Section title={`Front desk queue · ${tasks.length} open`}>
        {tasks.length === 0 ? <p className="pilot-muted">Nothing for the desk to do.</p> : tasks.map((t) => (
          <div key={t.id} className="pilot-task">
            <span><b>{t.kind}</b><small>{t.detail}</small><small>Due {stamp(t.dueAt)}</small></span>
            <Btn label="Resolve" onClick={run('Resolve', (q) => q.desk.resolveTask(t.id))} />
          </div>
        ))}
      </Section>

      <Section title="Event log">
        <ol className="pilot-log">
          {log.map((l) => <li key={l.seq}><time>{stamp(l.at)}</time> {l.kind}: {l.detail}</li>)}
        </ol>
      </Section>

      <button type="button" className="guest-prototype-toolbar__reset" onClick={() => { resetPilot(); setLast('Pilot reset'); }}>Reset the pilot</button>
      <p className="pilot-muted">Money today: {peso(p.foliosTotal(p.maria.stayId))} on Maria’s bill.</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="guest-prototype-events" aria-label={title}>
      <h3>{title}</h3>
      <div className="pilot-ctl__grid">{children}</div>
    </section>
  );
}

function Btn({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: string }) {
  return (
    <button type="button" className="pilot-ctl__btn" onClick={onClick} disabled={Boolean(disabled)} title={disabled}>
      {label}
      {disabled ? <small>{disabled}</small> : null}
    </button>
  );
}
