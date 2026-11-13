'use client';
import { useState, useSyncExternalStore } from 'react';
import { Host, hostClock } from '@/components/features/guest-app/pilot/host/host';
import { EngineBookingCard } from '@/components/features/guest-app/pilot/host/booking-card';
import { BOOKING_TRANSITIONS } from '@/components/features/guest-app/pilot/rules';
import { PROTOTYPE_TODAY } from '@/components/features/guest-app/prototype-model';
import type { Result } from '@/components/features/guest-app/pilot/types';

const tomorrow = '2026-11-12';
export function bookingFixture(state: string) {
  const host = new Host(hostClock(PROTOTYPE_TODAY, 14));
  const { guestId } = host.ensureGuest({ id: 'states-stay', firstName: 'Ana', room: '304', checkIn: '2026-11-09', checkOut: '2026-11-14', status: 'in-house' });
  if (state === 'needs-approval' || state === 'pay-or-cancel') host.pilot.settings.perOrderLimit = 1;
  if (state === 'pms-pending') host.call('pilot.setPms', { mode: 'down' });
  const goods = state === 'ready' || state === 'collected';
  const table = state === 'reserved' || state === 'seated';
  const gateway = state === 'awaiting-payment' || state === 'payment-expired' || state === 'refund-failed';
  const listingId = goods ? 'sans-rival-0' : table ? 'si-senor' : gateway ? 'spa' : 'bike-rental';
  const time = table ? '19:00' : '13:30';
  const request = host.call<Result<{ bookingId: string }>>('guest.request', guestId, { listingId, date: tomorrow, time, qty: 1, payMode: gateway ? 'card' : 'room', note: 'Please prepare a helmet in size M.' });
  if (!request.ok) throw new Error(`Fixture request: ${request.message}`);
  const id = request.bookingId;
  const vendorId = host.pilot.listing(listingId).vendorId;
  const vendor = (action: string, ...args: unknown[]) => host.call(`vendor.${action}`, vendorId, id, ...args);
  let paymentId: string | undefined;
  if (state === 'pay-or-cancel') host.call('desk.declineApproval', id);
  else if (state === 'declined') vendor('decline','Fully booked at that time');
  else if (state === 'withdrawn') host.call('guest.cancel',guestId,id);
  else if (state === 'lapsed') host.call('pilot.advanceTo',host.now()+31*60_000);
  else if (state === 'payment-expired') host.call('pilot.advanceTo',host.now()+16*60_000);
  else if (state === 'ready' || state === 'collected') { host.call('desk.markReady',id); if (state === 'collected') host.call('desk.handOver',id); }
  else if (state === 'seated') vendor('seat');
  else if (state === 'refund-failed') { host.call('guest.payCard',guestId,id,'card'); host.call('pilot.setGateway',{ failRefunds:true }); vendor('cancel','Provider unavailable'); }
  else if (!['requested','awaiting-payment','reserved','needs-approval'].includes(state)) {
    vendor('confirm');
    if (['in-progress','completed','damage-claim'].includes(state)) vendor('scan');
    if (state === 'completed') vendor('complete');
    if (state === 'cancelled') vendor('cancel','Equipment unavailable');
    if (state === 'no-show') { host.call('pilot.advanceTo',host.pilot.booking(id).start+31*60_000); vendor('markNoShow'); }
    if (state === 'extra-charge' || state === 'damage-claim') {
      const result = vendor(state === 'damage-claim' ? 'claimDamage' : 'addExtra',300,state === 'damage-claim' ? 'Wheel damage' : 'Late return') as Result<{paymentId:string}>;
      if (!result.ok) throw new Error(result.message);
      paymentId=result.paymentId;
    }
  }
  return { host, id, guestId, vendorId, paymentId };
}

export function BookingSpecimen({ state, onState }: { state: string; onState: (state: string) => void }) {
  const [fixture] = useState(() => bookingFixture(state));
  const { host, id, guestId, vendorId, paymentId } = fixture;
  useSyncExternalStore(host.subscribe, host.getVersion, host.getVersion);
  const [history,setHistory] = useState<string[]>([]);
  const booking=host.pilot.booking(id);
  const run=(label:string,path:string,...args:unknown[]) => {
    const before=host.pilot.booking(id).status;
    const result=host.call<Result>(path,...args);
    const after=host.pilot.booking(id).status;
    setHistory(h=>[`${label}: ${before} → ${after}${result && !result.ok ? ` · ${result.message}` : ''}`,...h].slice(0,8));
    if (after!==before) onState(after);
  };
  const vendor=(label:string,action:string,...args:unknown[])=>run(label,`vendor.${action}`,vendorId,id,...args);
  return <>
    <div className="states-machine" data-engine-state={booking.status}>
      <p>Current state <strong>{booking.status}</strong></p>
      <div className="states-next" aria-label="Allowed next booking states">{BOOKING_TRANSITIONS[booking.status].length ? BOOKING_TRANSITIONS[booking.status].map(next=><span key={next}>→ {next}</span>) : <span>Terminal state</span>}</div>
      <div className="states-events" aria-label="Engine events">
        {booking.status==='requested' && <><button onClick={()=>vendor('Vendor confirms','confirm')}>Vendor confirms</button><button onClick={()=>vendor('Vendor declines','decline','Fully booked')}>Vendor declines</button></>}
        {booking.status==='confirmed' && <><button onClick={()=>vendor('Vendor scans','scan')}>Vendor scans</button><button onClick={()=>vendor('Vendor cancels','cancel','Unavailable')}>Vendor cancels</button></>}
        {booking.status==='in-progress' && <button onClick={()=>vendor('Service completed','complete')}>Service completed</button>}
        {booking.status==='reserved' && <button onClick={()=>vendor('Party seated','seat')}>Party seated</button>}
        {booking.status==='ready' && <button onClick={()=>run('Goods collected','desk.handOver',id)}>Goods collected</button>}
        {booking.status==='awaiting-payment' && <button onClick={()=>run('Payment succeeds','guest.payCard',guestId,id,'card')}>Payment succeeds</button>}
        {booking.status==='needs-approval' && <><button onClick={()=>run('Desk approves','desk.approve',id)}>Desk approves</button><button onClick={()=>run('Desk declines','desk.declineApproval',id)}>Desk declines</button></>}
        {['requested','awaiting-payment','confirmed','reserved','ready'].includes(booking.status) && <button onClick={()=>run('Guest cancels or withdraws','guest.cancel',guestId,id)}>Guest cancels or withdraws</button>}
        <button onClick={()=>run('Advance 15 minutes','pilot.advanceTo',host.now()+15*60_000)}>Advance 15 minutes</button>
      </div>
      {history.length>0 && <ol aria-label="Event history">{history.map((line,i)=><li key={i}>{line}</li>)}</ol>}
    </div>
    <div className="guest-app guest-stack">
      <EngineBookingCard host={host} bookingId={id} paymentId={paymentId} onPay={()=>run('Payment succeeds','guest.payCard',guestId,id,'card')} onNote={note=>setHistory(h=>[note.text,...h])} onOpenDesk={()=>setHistory(h=>['Front desk requested',...h])} onPickAnother={()=>setHistory(h=>['Choose another listing in the guest app',...h])} />
    </div>
  </>;
}
