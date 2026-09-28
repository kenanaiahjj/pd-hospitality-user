'use client';

import { HistoryItem, Notice, PropertyImage, SectionHeading, Tag, TextButton } from './guest-ui';
import type { FeedClock, FeedEntry } from './promoted';
import { RecommendedRail } from './promoted';
import type { Booking, GuestSession, PastStay, PropertyAnnouncement, RoomPreferences, StayEntry } from './prototype-model';
import { CHECK_IN_FROM, CHECK_OUT_BY, PROPERTY_ANNOUNCEMENTS, PROTOTYPE_TODAY, canUseOnPropertyServices, countNightsBetween, describeCheckoutCountdown, describeRoomAssignment, describeStayStatus, getHomeVariant, hasStayStarted, isAnnouncementLive, isStayUnderWay, summarizeRoomPreferences } from './prototype-model';
import { CATEGORY_IMAGES, PARTNER_IMAGES, getServiceImage } from './service-images';
import { Button } from '@/components/ui';
import { CalendarCheck01Icon as HugeCalendarCheckIcon, ChevronRightIcon as HugeChevronRightIcon } from '@hugeicons-pro/core-stroke-rounded';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight, Bed, BellRinging, CalendarBlank, Car, CaretRight, ChatCircleDots, Check, CheckCircle, Clock, Coffee, Compass, Copy, ForkKnife, Gift, Megaphone, PencilSimple, Phone, Plus, QrCode, Receipt, SignOut, Sparkle, Storefront, SwimmingPool, Ticket, Users, WifiHigh, Wrench, X } from '@phosphor-icons/react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import { Lock } from '@phosphor-icons/react';
import { EARLY_CHECK_IN, earlyCheckInBookingId } from './guest-shared';
import type { ActiveScreen } from './guest-shared';
/*
  Home and the stay's cards: the overview a guest opens the app to, and the
  pieces My Stay and Home share -- the stay card, booking rows, essentials.
*/

export function RoomReadyNotification({
  headline,
  detail,
  onViewStay,
  onDismiss,
  onFocusChange,
}: {
  headline: string;
  detail: string;
  onViewStay: () => void;
  onDismiss: () => void;
  onFocusChange: (focused: boolean) => void;
}) {
  return (
    <aside
      className="guest-room-ready-notification"
      role="region"
      aria-label="Room-ready notification"
      onFocus={() => onFocusChange(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onFocusChange(false);
      }}
    >
      <div className="guest-room-ready-notification__icon" aria-hidden="true">
        <BellRinging />
      </div>
      <div className="guest-room-ready-notification__content">
        <small>Cabana · now</small>
        <strong>{headline}</strong>
        <p>{detail}</p>
        <button type="button" onClick={onViewStay}>View stay</button>
      </div>
      <button
        className="guest-room-ready-notification__dismiss"
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        <X aria-hidden="true" />
      </button>
    </aside>
  );
}

/* The airport a property's guests fly into, for a pick-up or a drop-off. */
export function airportFor(booking: Booking) {
  return booking.city === 'Cebu'
    ? 'Mactan–Cebu International Airport'
    : booking.city === 'Dumaguete'
      ? 'Dumaguete–Sibulan Airport'
      : 'NAIA Terminal 3';
}

export function DepartureOptionsSection({
  booking,
  onNavigate,
  onRequestRide,
}: {
  booking: Booking;
  onNavigate: (screen: ActiveScreen) => void;
  onRequestRide?: (direction: 'arrival' | 'departure') => void;
}) {
  return (
    <section className="guest-before-you-go" data-testid="guest-departure-options-before-checkout">
      {/*
        Check-out is done by the front desk, not the app -- so the day's one
        fact is when and where, with the charges one tap away.
      */}
      <button className="guest-list-row guest-checkout-today" type="button" onClick={() => onNavigate('folio')}>
        <span><SignOut aria-hidden="true" /></span>
        <div><b>{`Check-out today by ${CHECK_OUT_BY}`}</b><small>At the front desk, where your room charges are settled</small></div>
        <CaretRight aria-hidden="true" />
      </button>
      <SectionHeading title="Before you go" />
      <button className="guest-ride-card" type="button" onClick={() => (onRequestRide ? onRequestRide('departure') : onNavigate('transfer-booking'))}>
        <Image className="guest-ride-card__image" src={getServiceImage('transfer').src} alt="" fill sizes="(max-width: 720px) 100vw, 560px" style={{ objectPosition: getServiceImage('transfer').focalPoint }} />
        <span className="guest-ride-card__action" aria-hidden="true"><ArrowRight /></span>
        <span className="guest-ride-card__body">
          <small>Airport drop-off</small>
          <b>Need a ride to the airport?</b>
          <span>A hotel car from the door to departures. It goes on your room charges.</span>
          <span className="guest-ride-card__pills">
            <span><Car aria-hidden="true" />₱1,200</span>
            <span><Users aria-hidden="true" />{`${booking.guestCount} ${booking.guestCount === 1 ? 'guest' : 'guests'}`}</span>
          </span>
        </span>
      </button>
      <button className="guest-ride-card guest-ride-card--busy" type="button" onClick={() => onNavigate('gifts-souvenirs')}>
        <Image className="guest-ride-card__image" src="https://images.unsplash.com/photo-1751725154557-b10ab73f1564?auto=format&fit=crop&w=1200&q=82" alt="" fill sizes="(max-width: 720px) 100vw, 560px" />
        <span className="guest-ride-card__action" aria-hidden="true"><ArrowRight /></span>
        <span className="guest-ride-card__body">
          <small>Gifts &amp; souvenirs</small>
          <b>Pick up something for the trip home</b>
          <span>Ask what is in stock. Approved purchases go on your room charges and are settled at checkout.</span>
          <span className="guest-ride-card__pills">
            <span><Gift aria-hidden="true" />Pasalubong &amp; keepsakes</span>
            <span><Storefront aria-hidden="true" />Lobby pick-up</span>
          </span>
        </span>
      </button>
    </section>
  );
}

export type StayOverviewHomeProps = {
  session: GuestSession;
  booking?: Booking;
  online?: boolean;
  onNavigate: (screen: ActiveScreen) => void;
  /** Recommended for you: the stay feed's best, specific things. */
  picks: FeedEntry[];
  onOpenPick: (entry: FeedEntry) => void;
  onOpenStay: (id: string) => void;
  /* A ride with both ends set: to the hotel before the stay, to the airport after it. */
  onRequestRide?: (direction: 'arrival' | 'departure') => void;
  /** Whether the front desk still answers after checkout: the 24-hour window. */
  deskOpen?: boolean;
  /** Opens one booking's receipt, e.g. the early check-in request. */
  onOpenEntry?: (id: string) => void;
  /** The prototype clock's hour, so time-bound updates stop once they are over. */
  clockHour?: number;
};

export function StayOverviewHome({ session, booking, onNavigate, picks, onOpenPick, onOpenStay, onRequestRide, deskOpen = false, onOpenEntry, clockHour = 19 }: StayOverviewHomeProps) {
  const variant = getHomeVariant(session.bookings, session.activeBookingId);
  const upcomingBookings = session.bookings
    .filter((item) => item.status === 'upcoming')
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn));

  if (variant === 'empty' || !booking) {
    return (
      <EmptyStayHome
        guestName={session.guestName}
        pastStays={session.pastStays}
        onNavigate={onNavigate}
        onOpenStay={onOpenStay}
      />
    );
  }

  if (variant === 'active') {
    const confirmedServices = session.serviceBookings.filter(
      (service) => service.status === 'confirmed' && service.bookingId === booking.id && service.scheduledDate >= PROTOTYPE_TODAY,
    // Soonest first: "Next up" is the next thing, not the first one booked.
    ).sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate) || (a.scheduledHour ?? 0) - (b.scheduledHour ?? 0));
    const roomLabel = booking.roomNumber ? `Room ${booking.roomNumber}` : 'Active room';
    const roomUpgrade = booking.roomUpgrade;
    return (
      <div className="guest-stack guest-home-booking guest-home-booking--active" data-testid="guest-home-active">
        {/* The greeting the photo card carried, now over the compact row. */}
        <h1 className="guest-home-greeting">{greetGuest(session.guestName, 'Welcome')}</h1>
        {/* A one-line reminder, as before arrival: the full stay card is My Stay's. */}
        <StayCard
          booking={booking}
          compact
          statusLabel={describeStayStatus(booking).label === 'Checked in' ? 'Checked in' : 'Confirmed'}
          onOpen={() => onNavigate('rate-detail')}
        />
        {booking.checkOut === PROTOTYPE_TODAY && describeStayStatus(booking).status === 'checked-in' ? (
          <DepartureOptionsSection booking={booking} onNavigate={onNavigate} onRequestRide={onRequestRide} />
        ) : null}
        <section className="guest-home-stay-actions">
          {roomUpgrade ? <div className="guest-stay-hero-card__actions">
            {roomUpgrade?.status === 'requested' ? <div className="guest-room-upgrade-status"><b>Upgrade requested</b><span>{roomUpgrade.newRoomType} · waiting for the hotel</span><p>Nothing is charged until the hotel confirms and assigns the room. You keep Room {booking.roomNumber} in the meantime.</p></div> : null}
            {roomUpgrade?.status === 'preparing' ? <div className="guest-room-upgrade-status"><b>Room upgrade approved</b><span>{roomUpgrade.newRoomType} · Room {roomUpgrade.newRoomNumber}</span><p>We&rsquo;re preparing your upgraded room. You can continue using Room {booking.roomNumber} until your new room is ready.</p></div> : null}
            {roomUpgrade?.status === 'ready' ? <div className="guest-room-transfer-preview"><div><small>Current room</small><b>Room {booking.roomNumber} · {booking.roomType}</b><span>Available until your room transfer is completed.</span></div><div><small>New room · Ready</small><b>Room {roomUpgrade.newRoomNumber} · {roomUpgrade.newRoomType}</b><span>Your upgraded room is ready. Complete the transfer before {roomUpgrade.transferDeadline}.</span></div><button className="guest-button guest-button--primary" type="button" onClick={() => onNavigate('room-transfer-details')}>View transfer details<ArrowRight /></button></div> : null}
          </div> : null}
          {/*
            Keep the room-code prompt beside the room context while the stay
            is still waiting for verification. Once the room is verified,
            repeating the action here would add noise to the stay overview.
          */}
          {canUseOnPropertyServices(booking) ? null : (
            <div className="guest-stay-hero-card__qr">
              <Button className="guest-button guest-button--primary" type="button" data-testid="guest-room-qr-row" onClick={() => onNavigate('scan-room-code')}>
                <QrCode aria-hidden="true" />Scan your room code<ArrowRight aria-hidden="true" />
              </Button>
            </div>
          )}
        </section>
        {/* One line under the stay: what changed at the property today. */}
        <AnnouncementsSection booking={booking} hour={clockHour} />
        <HotelEssentials booking={booking} hour={clockHour} />
        {confirmedServices[0] ? <section className="guest-home-next-service"><SectionHeading title="Next up" action="See all" onAction={() => onNavigate('my-stay')} /><button className="guest-next-service-card" type="button" aria-label={`View details for ${confirmedServices[0].title}`} onClick={() => onNavigate('my-stay')}>
          <span className="guest-next-service-card__marker" aria-hidden="true"><HugeiconsIcon icon={HugeCalendarCheckIcon} size={20} strokeWidth={1.75} focusable="false" /></span>
          <span className="guest-next-service-card__details">
            <b>{confirmedServices[0].title === 'Hilom signature massage' ? 'Hilom Signature Massage' : confirmedServices[0].title}</b>
            <small className="guest-next-service-card__schedule">{confirmedServices[0].scheduledFor}</small>
            <small className="guest-next-service-card__charge">{confirmedServices[0].amount} · Charged to {roomLabel}</small>
          </span>
          <span className="guest-next-service-card__action" aria-hidden="true"><span className="guest-next-service-card__action-icon"><HugeiconsIcon icon={HugeChevronRightIcon} size={15} strokeWidth={1.75} focusable="false" /></span></span>
        </button></section> : null}
        {canUseOnPropertyServices(booking) ? (
          <RecommendedRail entries={picks} onOpen={onOpenPick} heading={<SectionHeading title="Recommended for you" action="See all" onAction={() => onNavigate('marketplace')} />} />
        ) : null}
      </div>
    );
  }

  if (variant === 'multiple-upcoming') {
    return (
      <div className="guest-stack guest-home-booking guest-home-booking--multiple" data-testid="guest-home-multiple-upcoming">
        <div className="guest-page-title"><h1>Upcoming stays</h1><p>Keep every reservation in one place. Your nearest arrival is shown first.</p></div>
        {/*
        The label carries the truth the variant cannot. `getHomeVariant` keys
        off `status`, so the reference stay stays on the upcoming home with a
        window that already contains today -- and without this the card told a
        guest mid-stay that their arrival was still to come.
      */}
      <UpcomingBookingCard booking={booking} primary onNavigate={onNavigate} statusLabel={describeStayStatus(booking).label} />
        <section>
          <SectionHeading title="More upcoming stays" />
          <div className="guest-home-booking-list">
            {upcomingBookings.filter((item) => item.id !== booking.id).map((item) => <UpcomingBookingCard key={item.id} booking={item} onNavigate={onNavigate} />)}
          </div>
        </section>
      </div>
    );
  }

  if (variant === 'completed') {
    return (
      <div className="guest-stack guest-home-booking guest-home-booking--completed" data-testid="guest-home-completed">
        <div className="guest-page-title"><h1>Your latest stay</h1></div>
        <Notice tone="positive" icon={<CheckCircle />} title="Stay complete">Your previous room charges were settled at checkout.</Notice>
        <UpcomingBookingCard booking={booking} onNavigate={onNavigate} statusLabel="Checked out" showRoomBadge={false} hideEyebrow />
        {deskOpen ? (
          <button className="guest-after-checkout-card" type="button" onClick={() => onNavigate('chat')}>
            <ChatCircleDots aria-hidden="true" />
            <span>
              <b>Message the front desk</b>
              <small>Available for 24 hours after checkout for questions about your stay or charges.</small>
            </span>
            <strong>Open chat<ArrowRight aria-hidden="true" /></strong>
          </button>
        ) : null}
        {/* The stay first, then where to go next: selling before closing read as pushy. */}
        <button className="guest-add-booking-card guest-add-booking-card--secondary" type="button" onClick={() => onNavigate('partner-hotels')}>
          <span className="guest-add-booking-card__glyph" aria-hidden="true"><Plus /></span>
          <span className="guest-add-booking-card__text"><b>Explore partner hotels</b><small>Choose where you want to stay next.</small></span>
          <ArrowRight aria-hidden="true" />
        </button>
        {/* Stay history lives in Profile; a second way in here was noise. */}
      </div>
    );
  }

  const roomAssignment = describeRoomAssignment(booking);

  return (
    <div className="guest-stack guest-home-booking guest-home-booking--upcoming" data-testid="guest-home-upcoming">
      {/*
        The label carries the truth the variant cannot. `getHomeVariant` keys
        off `status`, so the reference stay stays on the upcoming home with a
        window that already contains today -- and without this the card told a
        guest mid-stay that their arrival was still to come.
      */}
      {/* A one-line reminder: the full stay card is My Stay's. */}
      <StayCard
        booking={booking}
        compact
        statusLabel={describeStayStatus(booking).label === 'Checked in' ? 'Checked in' : 'Confirmed'}
        onOpen={() => onNavigate('rate-detail')}
      />
      {booking.preArrivalCompleted < booking.preArrivalTotal ? (
        <PreArrivalChecklist booking={booking} onNavigate={onNavigate} />
      ) : roomAssignment.state !== 'pending' ? (
        booking.roomVerification ? null : (
          <section className="guest-home-booking guest-home-booking--primary guest-room-ready-card" data-testid="guest-room-ready-card">
            <div className="guest-home-booking__heading">
              {/* One fact for the heading and the line under it: "ready" once the stay is under way, "held" before. */}
              <h2>{isStayUnderWay(booking) ? `Room ${booking.roomNumber ?? 'assigned'} is ready` : `Room ${booking.roomNumber ?? 'assigned'} is held for you`}</h2>
            </div>
            <p className="guest-home-booking__room-type">
              <b>{booking.roomType}</b>
              <small>{(booking.honouredPreferences?.length ? booking.honouredPreferences : summarizeRoomPreferences(session.roomPreferences)).join(' · ')}</small>
            </p>
            {/*
              The scan is only offered while it can succeed. Days out, a button
              to scan a code the guest cannot be standing next to either fails
              or, before the model refused it, "unlocked" a stay that had not
              begun.
            */}
            {isStayUnderWay(booking) ? (
              <>
                <p>Your room is now ready. Once inside, scan the room code to connect your stay to the app.</p>
                <Button
                  className="guest-button guest-button--primary"
                  type="button"
                  data-testid="guest-room-qr-row"
                  onClick={() => onNavigate('scan-room-code')}
                >
                  <QrCode aria-hidden="true" />Scan room code<ArrowRight aria-hidden="true" />
                </Button>
              </>
            ) : (
              <p>{`Held for your arrival on ${formatStayDateRange(booking).split('–')[0]}. Once you are in the room, scan the code on the desk card to connect your stay to the app.`}</p>
            )}
          </section>
        )
      ) : (
        <section className="guest-home-booking guest-home-booking--primary">
          <div className="guest-home-booking__heading">
            <div><small>Your room</small><h2>{roomAssignment.headline}</h2></div>
            <Tag tone={roomAssignment.canGoUp ? 'positive' : undefined}>{roomAssignment.statusLabel}</Tag>
          </div>
          <p>{roomAssignment.detail}</p>
          {roomAssignment.action.tone === 'primary' ? (
            <Button className="guest-button guest-button--primary" type="button" onClick={() => onNavigate(roomAssignment.action.screen)}>
              {roomAssignment.action.label}<ArrowRight aria-hidden="true" />
            </Button>
          ) : (
            <TextButton onClick={() => onNavigate(roomAssignment.action.screen)}>{roomAssignment.action.label}</TextButton>
          )}
        </section>
      )}
      {/*
        The two things a guest can shape before arriving, as a pair of tiles
        that lead with their answer. Early check-in is its own ask, never a
        check-in step, and shows its request once sent. Preferences are
        offered only while they can still change the room: once the property
        allocates one, the ready card above echoes what it honoured.
      */}
      {booking.status === 'upcoming' && !hasStayStarted(booking) ? (
        <section className="guest-make-it-yours" aria-labelledby="guest-make-it-yours-title">
          <h2 id="guest-make-it-yours-title">Make it yours</h2>
          <div className="guest-make-it-yours__tiles">
            {booking.earlyCheckIn ? (
              <button className="guest-tile is-done" type="button" data-testid="guest-early-checkin-requested" onClick={() => onOpenEntry?.(earlyCheckInBookingId(booking.id))}>
                <span className="guest-tile__icon" aria-hidden="true"><Clock /></span>
                <small>Check in early</small>
                <b>{booking.earlyCheckIn.time}</b>
                <span className="guest-tile__meta"><CheckCircle weight="fill" aria-hidden="true" />Requested · view or withdraw</span>
              </button>
            ) : (
              <button className="guest-tile" type="button" onClick={() => onNavigate('early-check-in')} data-testid="guest-early-checkin-card">
                <span className="guest-tile__icon" aria-hidden="true"><Clock /></span>
                <span className="guest-tile__cue" aria-hidden="true">Request</span>
                <small>Check in early</small>
                <b>{EARLY_CHECK_IN.time}</b>
                <span className="guest-tile__meta">{EARLY_CHECK_IN.fee} · on your room</span>
              </button>
            )}
            {roomAssignment.state === 'pending' ? (
              <RoomPreferencesCard preferences={session.roomPreferences} onOpen={() => onNavigate('room-preferences')} />
            ) : null}
          </div>
        </section>
      ) : null}
      {/*
        Browsing opens once the guest is on property -- scanned in, or simply
        inside the stay's dates -- so a guest standing in the lobby is not
        left looking at an empty home. Booking stays behind the scan: the
        booking flow checks that, not this rail.
      */}
      {/*
        The hotel's own services open with the scan, so the story rail waits
        for it. A guest already inside the stay's dates is on property,
        though, and an empty home is no welcome: they get what the scan will
        open, the day's updates, and the essentials a lobby needs.
      */}
      {booking.roomVerification ? <RecommendedRail entries={picks} onOpen={onOpenPick} heading={<SectionHeading title="Recommended for you" action="See all" onAction={() => onNavigate('marketplace')} />} /> : null}
      {!booking.roomVerification && isStayUnderWay(booking) ? (
        <>
          {/* The ready-room card above carries the scan once there is a room; one button, not two. */}
          <UnlockTeaser onScan={roomAssignment.state === 'pending' ? () => onNavigate('scan-room-code') : undefined} />
          <AnnouncementsSection booking={booking} hour={clockHour} />
          <HotelEssentials booking={booking} hour={clockHour} />
        </>
      ) : null}
      {/* Arrival offers: once the stay has begun the guest is already here. */}
      {!booking.roomVerification && booking.status === 'upcoming' && !hasStayStarted(booking) ? (
        <>
          {/*
            The one arrival offer with a picture. A car waiting at arrivals is
            what a guest pictures before the trip, so it leads; the rest of
            the roster sits under it as a plain row.
          */}
          <button className="guest-ride-card" type="button" onClick={() => (onRequestRide ? onRequestRide('arrival') : onNavigate('transfer-booking'))}>
            <Image className="guest-ride-card__image" src={getServiceImage('transfer').src} alt="" fill sizes="(max-width: 720px) 100vw, 560px" style={{ objectPosition: getServiceImage('transfer').focalPoint }} />
            <span className="guest-ride-card__action" aria-hidden="true"><ArrowRight /></span>
            <span className="guest-ride-card__body">
              <small>Private pick-up</small>
              <b>Need a ride to the hotel?</b>
              <span>{`A hotel driver meets you at ${airportFor(booking)} and brings you to ${booking.property}.`}</span>
              <span className="guest-ride-card__pills">
                <span><CalendarBlank aria-hidden="true" />{`Arriving ${formatStayDateRange(booking).split('–')[0]}`}</span>
                <span><Users aria-hidden="true" />{`${booking.guestCount} ${booking.guestCount === 1 ? 'guest' : 'guests'}`}</span>
              </span>
            </span>
          </button>
          <button className="guest-transfer-card" type="button" onClick={() => onNavigate('pre-arrival-services')}>
            <Wrench aria-hidden="true" />
            <span>
              <b>More arrival services</b>
              <small>Early check-in, luggage assistance, private driver, and celebration setup</small>
            </span>
            <CaretRight aria-hidden="true" />
          </button>
        </>
      ) : null}
      {/* No property updates before arrival: a pool closing this morning is
          noise to a guest who lands next month. They start on the stay home. */}
    </div>
  );
}

/**
 * Everyone on the booking, lead booker first.
 *
 * The lead's slot always exists; their *name* may not. The booking-lookup
 * entry path never asks for one, and collapsing the list with `filter(Boolean)`
 * promoted the first additional guest into the lead's row -- so a booking for
 * Ana and Marco showed Marco as "Lead booker · ID on file" and then claimed a
 * guest was missing. The slot is held open and reported as needing a name.
 *
 * `guestCount` is what the property reserved for; the rows are who has been
 * named. The two disagreeing is a real state the property has to resolve
 * before arrival, so it is stated rather than hidden.
 */
export type BookingGuest = { key: string; name: string | null; role: 'lead' | 'additional' };

export function listBookingGuests(booking: Booking, session: GuestSession) {
  const lead = session.guestName.trim();
  const additional = session.additionalGuests.map((name) => name.trim()).filter(Boolean);

  const rows: BookingGuest[] = [
    { key: 'lead', name: lead || null, role: 'lead' },
    ...additional.map((name, index) => ({ key: `guest-${index}`, name, role: 'additional' as const })),
  ];

  return {
    rows,
    count: Math.max(booking.guestCount, rows.length),
    /** Reserved for more people than the booking has rows for. */
    unnamed: Math.max(0, booking.guestCount - rows.length),
  };
}

export const describeParty = (booking: Booking, session: GuestSession) => {
  const { count } = listBookingGuests(booking, session);
  return `${count} ${count === 1 ? 'guest' : 'guests'}`;
};

export const countNights = (booking: Booking) => {
  return Math.max(
    1,
    Math.round(
      (Date.parse(`${booking.checkOut}T00:00:00Z`) - Date.parse(`${booking.checkIn}T00:00:00Z`)) / 86_400_000,
    ),
  );
};

export function greetGuest(guestName: string, fallback: string) {
  const first = guestName.trim().split(/\s+/).filter(Boolean)[0];
  return first ? `Welcome, ${first}` : fallback;
}

export function AnnouncementsSection({ booking, hour = 19 }: { booking?: Booking; hour?: number }) {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<PropertyAnnouncement | null>(null);
  const [showAllUpdates, setShowAllUpdates] = useState(false);
  const relevantAnnouncements = booking
    ? PROPERTY_ANNOUNCEMENTS.filter((announcement) => (
      announcement.important
      && announcement.activeFrom <= booking.checkOut
      && announcement.activeUntil >= booking.checkIn
      && isAnnouncementLive(announcement, hour)
    ))
    : [];

  if (!relevantAnnouncements.length) return null;

  /*
    A single slim row, not a section: the lead update's title and a count of
    the rest. The sheet behind it carries every update in full, so the home
    gives this one line instead of a heading and two paragraphs.
  */
  const [lead, ...rest] = relevantAnnouncements;
  const close = () => { setSelectedAnnouncement(null); setShowAllUpdates(false); };

  return (
    <section className="guest-updates-strip" aria-label="Updates for your stay">
      <button
        type="button"
        className="guest-updates-strip__row"
        onClick={() => (rest.length ? setShowAllUpdates(true) : setSelectedAnnouncement(lead!))}
      >
        <Megaphone aria-hidden="true" />
        <b>{lead!.title}</b>
        {rest.length ? <span className="guest-updates-strip__more" aria-label={`and ${rest.length} more`}>+{rest.length}</span> : null}
        <CaretRight aria-hidden="true" />
      </button>
      {selectedAnnouncement || showAllUpdates ? (
        <div className="guest-announcement-detail" role="dialog" aria-modal="true" aria-labelledby="announcement-detail-title">
          <div className="guest-announcement-detail__panel">
            <button type="button" className="guest-announcement-detail__close" aria-label="Close update" onClick={close}><X aria-hidden="true" /></button>
            <Megaphone aria-hidden="true" />
            {showAllUpdates ? (
              <>
                <h2 id="announcement-detail-title">Updates for your stay</h2>
                {relevantAnnouncements.map((announcement) => <div key={announcement.id} className="guest-announcement-detail__item"><h3>{announcement.title}</h3><p>{announcement.body}</p></div>)}
              </>
            ) : (
              <>
                <h2 id="announcement-detail-title">{selectedAnnouncement?.title}</h2>
                <p>{selectedAnnouncement?.body}</p>
              </>
            )}
            <Button className="guest-button guest-button--primary" type="button" onClick={close}>Done</Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

/**
 * One booking, as a card that names its parent first.
 *
 * The parent line is not decoration. A guest island-hopping through three
 * properties sees "Azotea Rooftop · 7:30 PM" and has to remember which hotel
 * that was; "The Henry Manila · Ninth floor terrace" answers it before they
 * ask.
 */
export function StayEntryCard({ entry, onOpen, showWhen = true, homeProperty }: { entry: StayEntry; onOpen?: () => void; showWhen?: boolean; homeProperty?: string }) {
  const date = new Date(`${entry.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const time = entry.detail.match(/\d{1,2}:\d{2}\s*[AP]M/i)?.[0] ?? '';
  const day = entry.date === PROTOTYPE_TODAY ? ((entry.hour ?? 0) >= 17 ? 'Tonight' : 'Today') : date;
  /*
    One quiet line: when, then where. The hotel is named only when it is not
    the one this stay is at -- repeating "The Henry Manila" on every card of a
    Henry Manila stay said nothing, while a venue at another property still
    answers "which building?" before the guest asks.
  */
  const place = homeProperty && entry.parent === homeProperty ? entry.parentDetail : entry.parent;
  // A booking that knows its own best line (a rental's window, a transfer's route) says it.
  const line = [showWhen ? day : undefined, ...(entry.summary ? [entry.summary] : [time, place])].filter(Boolean).join(' · ');
  // A food tour is still food: the tour photograph is an island beach.
  const image = entry.serviceId && PARTNER_IMAGES[entry.serviceId]
    ? PARTNER_IMAGES[entry.serviceId]!
    : entry.serviceId === 'transfer' || entry.serviceId === 'private-car'
    ? getServiceImage('transfer')
    : entry.category === 'entertainment' && /food|dining|dinner|breakfast|market/i.test(entry.title)
      ? CATEGORY_IMAGES.dining!
      : entry.serviceId === 'film-night' || entry.serviceId === 'luggage'
        ? getServiceImage('amenity')
        : CATEGORY_IMAGES[entry.category] ?? CATEGORY_IMAGES.services!;
  const body = (
    <>
      {/* A square photograph, as Places lists a saved place. */}
      <span className="guest-stay-entry__thumb" aria-hidden="true">
        <Image src={image.src} alt="" fill sizes="48px" style={{ objectPosition: image.focalPoint }} />
      </span>
      <span className="guest-stay-entry__body">
        <h3>{entry.title}</h3>
        {line ? <span className="guest-stay-entry__line">{line}</span> : null}
        {entry.settlement && !(entry.paidBy === 'complimentary' && !entry.cancelled) ? <span className="guest-stay-entry__settlement">{entry.settlement}</span> : null}
      </span>
      <strong className="guest-stay-entry__amount">{entry.amount}</strong>
    </>
  );

  if (!onOpen) return <div className="guest-stay-entry is-static" data-status={entry.status} data-cancelled={entry.cancelled || undefined}>{body}</div>;

  return <button className="guest-stay-entry" type="button" data-status={entry.status} data-cancelled={entry.cancelled || undefined} onClick={onOpen}>{body}</button>;
}

/**
 * "Checks out tomorrow" -> label "Check-out", value "Tomorrow · 12:00 PM": the
 * countdown as a stat cell on the stay card, where the dates already are.
 */
export function countdownCell(booking: Booking): { label: string; value: string } | undefined {
  const text = describeCheckoutCountdown(booking);
  const match = text.match(/^Checks (in|out) (.+)$/);
  if (!match) return undefined;
  const [, which, rest] = match as unknown as [string, 'in' | 'out', string];
  const when = rest.replace(/ (from|at|by) .+$/, '');
  const at = which === 'in' ? (booking.earlyCheckIn ? `${booking.earlyCheckIn.time} requested` : CHECK_IN_FROM) : CHECK_OUT_BY;
  return { label: which === 'in' ? 'Check-in' : 'Check-out', value: `${when.charAt(0).toUpperCase()}${when.slice(1)} · ${at}` };
}

export function UpcomingBookingCard({ booking, primary = false, onNavigate, statusLabel, showRoomBadge = true, hideEyebrow = false, showCountdown = false }: { booking: Booking; primary?: boolean; onNavigate: (screen: ActiveScreen) => void; statusLabel?: string; showRoomBadge?: boolean; hideEyebrow?: boolean; showCountdown?: boolean }) {
  const countdown = showCountdown ? countdownCell(booking) : undefined;
  return (
    <section className="guest-stay-hero-card guest-stay-hero-card--photo">
      <div className="guest-stay-hero-card__media">
        <PropertyImage property={booking.property} aspectRatio="1.6" decorative />
        <div className="guest-stay-hero-card__badges">
          <span className={`guest-stay-hero-card__status${statusLabel === 'Checked in' ? ' guest-stay-hero-card__status--positive' : ''}`}>{statusLabel ?? (primary ? 'Next arrival' : 'Upcoming')}</span>
          {showRoomBadge && booking.roomNumber ? <span className="guest-stay-hero-card__status guest-stay-hero-card__status--dark">Room {booking.roomNumber}</span> : null}
        </div>
        <div className="guest-stay-hero-card__overlay">
          {!hideEyebrow ? <p className="guest-eyebrow">{isStayUnderWay(booking) ? 'Your current stay' : booking.status === 'completed' ? 'Your last stay' : primary ? 'Your next stay' : 'Upcoming stay'}</p> : null}
          <h1>{booking.property}</h1>
        </div>
      </div>
      <div className="guest-stay-hero-card__body">
        <div className="guest-stay-hero-card__stats">
          <div><small>Dates</small><b>{formatStayDateRange(booking)}</b></div>
          {booking.roomNumber ? <div><small>Room</small><b>{booking.roomType} · {booking.roomNumber}</b></div> : null}
          <div><small>Guests</small><b>{booking.guestCount}</b></div>
          <div><small>Nights</small><b>{countNights(booking)}</b></div>
          {countdown ? <div><small>{countdown.label}</small><b>{countdown.value}</b></div> : null}
      </div>
      <button className="guest-stay-hero-card__booking" onClick={() => onNavigate('rate-detail')} type="button">
        <span><Ticket /></span>
        <span><b>View booking</b><small>Rate, policies and confirmation</small></span>
        <CaretRight />
      </button>
      </div>
    </section>
  );
}

export function VendorFolioQrDialog({ booking, onClose, open }: { booking: Booking; onClose: () => void; open: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;

    if (!dialog.open) dialog.showModal();
    closeButtonRef.current?.focus();

    return () => {
      if (dialog.open) dialog.close();
    };
  }, [open]);

  const qrValue = getVendorFolioQrValue(booking);

  return (
    <dialog
      ref={dialogRef}
      className="guest-vendor-folio-dialog"
      aria-labelledby="guest-vendor-folio-dialog-title"
      aria-describedby="guest-vendor-folio-dialog-description"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="guest-vendor-folio-dialog__header">
        <span className="guest-vendor-folio-dialog__eyebrow"><QrCode aria-hidden="true" /> Room folio</span>
        <button ref={closeButtonRef} className="guest-vendor-folio-dialog__close" type="button" aria-label="Close room charge QR" onClick={onClose}>
          <X aria-hidden="true" />
        </button>
      </div>
      <h2 id="guest-vendor-folio-dialog-title">Room charge QR</h2>
      <p id="guest-vendor-folio-dialog-description">Show this at a partner vendor. Your purchase is added to Room {booking.roomNumber} and settled at checkout.</p>
      <div className="guest-vendor-folio-dialog__code">
        <QRCodeSVG
          value={qrValue}
          size={232}
          level="M"
          includeMargin
          role="img"
          aria-label={`Room charge QR for ${booking.property}, Room ${booking.roomNumber}`}
        />
        <span>{booking.property} · Room {booking.roomNumber}</span>
      </div>
    </dialog>
  );
}

export function getVendorFolioQrValue(booking: Booking) {
  return JSON.stringify({
    type: 'hotel-vendor-folio',
    version: 1,
    property: booking.property,
    folioReference: booking.id,
  });
}

/**
 * Home for a signed-in guest with no live booking.
 *
 * This used to be the dead end of the entry flow -- one sentence and a
 * "Connect a booking" button -- and post-auth routing sent a guest with no
 * reservation straight past it into the lookup form. Both assumed the only
 * reason to open the app was to attach a booking. A guest also opens it to
 * look at what last March cost, so the home keeps the booking lookup and stay
 * history together.
 */
export function EmptyStayHome({
  guestName,
  pastStays,
  onNavigate,
  onOpenStay,
}: {
  guestName: string;
  pastStays: PastStay[];
  onNavigate: (screen: ActiveScreen) => void;
  onOpenStay: (id: string) => void;
}) {
  const firstName = guestName.trim().split(' ')[0];
  // Three is the most a home can show before it stops being a summary. The
  // rest live on `stay-history`, which is still the one full list.
  const recent = pastStays.slice(0, 3);

  return (
    <div className="guest-stack" data-testid="guest-home-empty">
      <div className="guest-page-title">
        {/* "Welcome back" to someone who has never stayed is a small lie the
            greeting does not need to tell. */}
        <h1>
          {!firstName
            ? 'Welcome to Cabana'
            : pastStays.length > 0
              ? `Welcome back, ${firstName}`
              : `Hello, ${firstName}`}
        </h1>
        <p>
          {pastStays.length > 0
            ? 'No stay is connected right now. Here is where you have been.'
            : 'Add your booking to open arrival details, hotel services and room charges in one place.'}
        </p>
      </div>

      {/*
        The main action, as a card rather than a pill. It is the one thing a
        signed-in guest with no reservation is here to do, and it sits above
        their history so it reads as the next step rather than a footnote to
        it.

        No scan here, deliberately. A guest with no booking has no room and
        therefore no code to point a camera at -- offering it was an action
        that could not succeed.
      */}
      <button className="guest-add-booking-card" type="button" onClick={() => onNavigate('identify')}>
        <span className="guest-add-booking-card__glyph" aria-hidden="true"><Ticket /></span>
        <span className="guest-add-booking-card__text">
          <b>Add a booking</b>
          <small>Enter your reference and last name to open arrival details, services and room charges.</small>
        </span>
        <ArrowRight aria-hidden="true" />
      </button>

      {/* No booking means no front-desk chat, so the way to reach a hotel has to be here. */}
      <button className="guest-add-booking-card guest-add-booking-card--secondary" type="button" onClick={() => onNavigate('partner-hotels')}>
        <span className="guest-add-booking-card__glyph" aria-hidden="true"><Phone /></span>
        <span className="guest-add-booking-card__text">
          <b>Contact a hotel</b>
          <small>A number to call and an address to email for every partner hotel.</small>
        </span>
        <ArrowRight aria-hidden="true" />
      </button>

      {recent.length > 0 ? (
        <section className="guest-empty-history">
          <div className="guest-section-heading-row">
            <SectionHeading title="Previous stays" />
            {pastStays.length > recent.length ? (
              <button className="guest-text-link" type="button" onClick={() => onNavigate('stay-history')}>
                See all {pastStays.length}
              </button>
            ) : null}
          </div>
          {recent.map((stay) => (
            <HistoryItem key={stay.id} stay={stay} onOpen={() => onOpenStay(stay.id)} />
          ))}
          {pastStays.length === recent.length ? (
            <button className="guest-text-link" type="button" onClick={() => onNavigate('stay-history')}>
              See all {pastStays.length} stays
            </button>
          ) : null}
        </section>
      ) : null}

    </div>
  );
}

export function formatStayDateRange(booking: Booking) {
  const checkIn = new Date(`${booking.checkIn}T12:00:00`);
  const checkOut = new Date(`${booking.checkOut}T12:00:00`);
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
  const start = formatter.format(checkIn);
  const end = formatter.format(checkOut);
  return `${start}–${end}, ${booking.checkIn.slice(0, 4)}`;
}

export function formatCheckoutDate(isoDate: string) {
  const date = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' }).format(date);
}

/**
 * `compact` is a one-line reminder of which stay a detail screen is about --
 * the home already shows this stay large, so a second hero only pushes the
 * details below the fold.
 */
export function StayCard({ booking, compact = false, statusLabel = 'Confirmed', onOpen }: { booking: Booking; compact?: boolean; statusLabel?: string; onOpen?: () => void }) {
  const checkIn = new Date(`${booking.checkIn}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const checkOut = new Date(`${booking.checkOut}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  if (compact) {
    const content = (
      <>
        <span className="guest-stay-card__thumb"><PropertyImage property={booking.property} aspectRatio="1" decorative /></span>
        <span className="guest-stay-card__summary">
          <b>{booking.property}</b>
          <small>{booking.roomType} · {formatStayDateRange(booking)}</small>
        </span>
        <span className="guest-stay-card__state">{statusLabel}</span>
      </>
    );
    return onOpen ? (
      <button type="button" className="guest-stay-card guest-stay-card--compact" onClick={onOpen} aria-label={`${booking.property}, ${formatStayDateRange(booking)} -- view booking`}>{content}</button>
    ) : (
      <div className="guest-stay-card guest-stay-card--compact">{content}</div>
    );
  }
  return (
    <div className="guest-stay-card">
      <div className="guest-stay-card__art">
        <PropertyImage property={booking.property} aspectRatio="16/8" decorative />
      </div>
      <div className="guest-stay-card__content">
        <Tag tone="positive">Confirmed</Tag>
        <h2>{booking.property}</h2>
        <p>{booking.roomType} · {checkIn}–{checkOut}, {booking.checkIn.slice(0, 4)}</p>
        <small>Booking {booking.id}</small>
      </div>
    </div>
  );
}

/** What the room scan opens, in the order a guest reaches for it. */
export const SCAN_UNLOCKS = [
  { label: 'Dining to your room', icon: <ForkKnife /> },
  { label: 'Spa & wellness', icon: <Sparkle /> },
  { label: 'Tours & activities', icon: <Compass /> },
  { label: 'Charge to your room', icon: <Receipt /> },
];

/*
  A guest on property who has not scanned in sees what the scan opens,
  each behind a small lock -- a reason to scan rather than an empty home.
  Once scanned, this card goes and the services themselves take its place.
*/
export function UnlockTeaser({ onScan }: { onScan?: () => void }) {
  return (
    <section className="guest-unlock" aria-labelledby="guest-unlock-title">
      <h2 id="guest-unlock-title">Scan your room code to unlock</h2>
      <ul className="guest-unlock__list">
        {SCAN_UNLOCKS.map((item) => (
          <li key={item.label}>
            <span className="guest-unlock__icon" aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
            <Lock className="guest-unlock__lock" weight="fill" aria-label="Locked" />
          </li>
        ))}
      </ul>
      {onScan ? (
        <Button className="guest-button guest-button--primary" type="button" onClick={onScan}>
          <QrCode aria-hidden="true" />Scan room code
        </Button>
      ) : null}
    </section>
  );
}

/** The house facts a guest asks the desk for first, by property. */
export const ESSENTIALS: Record<string, { wifi: string; password: string; breakfast: string; pool: string }> = {
  Manila: { wifi: 'HenryGuest', password: 'manila2026', breakfast: '6:00–10:30 AM · Kape Manila Café', pool: 'Rooftop · 7:00 AM–10:00 PM' },
  Cebu: { wifi: 'HenryGuest', password: 'cebu2026', breakfast: '6:30–10:30 AM · The Garden', pool: 'Garden pool · 7:00 AM–9:00 PM' },
};

/*
  What a guest in the lobby actually needs, none of it tied to the room:
  Wi-Fi with its password one tap from the clipboard, breakfast, the pool
  (today's closure wins over the usual hours), and when the stay ends.
*/
export function HotelEssentials({ booking, hour = 19 }: { booking: Booking; hour?: number }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);
  const facts = ESSENTIALS[booking.city];
  if (!facts) return null;
  const poolNotice = PROPERTY_ANNOUNCEMENTS.find((item) => item.id === 'announcement-pool' && item.activeFrom <= booking.checkOut && item.activeUntil >= booking.checkIn && isAnnouncementLive(item, hour));
  const checkout = new Date(`${booking.checkOut}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const copy = () => {
    try {
      void navigator.clipboard?.writeText(facts.password);
    } catch {
      // No clipboard: the password is on screen to read anyway.
    }
    setCopied(true);
  };
  return (
    <section className="guest-essentials" aria-labelledby="guest-essentials-title">
      <h2 id="guest-essentials-title">Hotel essentials</h2>
      <dl className="guest-essentials__list">
        <div>
          <dt><WifiHigh aria-hidden="true" />Wi-Fi</dt>
          <dd>
            <span>{facts.wifi} · <b>{facts.password}</b></span>
            <button type="button" className="guest-essentials__copy" onClick={copy} aria-label={copied ? 'Password copied' : 'Copy Wi-Fi password'}>
              {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}{copied ? 'Copied' : 'Copy'}
            </button>
          </dd>
        </div>
        <div><dt><Coffee aria-hidden="true" />Breakfast</dt><dd><span>{facts.breakfast}</span></dd></div>
        <div>
          <dt><SwimmingPool aria-hidden="true" />Pool</dt>
          <dd><span>{poolNotice ? `${facts.pool.split(' · ')[0]} · reopens 11:00 AM` : facts.pool}</span></dd>
        </div>
        <div><dt><SignOut aria-hidden="true" />Check-out</dt><dd><span>{checkout} · {CHECK_OUT_BY}</span></dd></div>
      </dl>
    </section>
  );
}

/** The pre-arrival steps, in order, and where each one is done. */
export const PRE_ARRIVAL_STEPS: { label: string; screen: ActiveScreen }[] = [
  { label: 'You and your ID', screen: 'guest-details' },
  { label: 'Who else is staying', screen: 'additional-guests' },
];

/*
  Pre-arrival as the checklist it is: the steps are the card, the next one
  carries the action, and a single ring says how far along. It replaced a
  heading, a percentage, a bar and a sentence that all said "1 of 2", with
  the actual next step in the smallest grey type on the card.
*/
export function PreArrivalChecklist({ booking, onNavigate }: { booking: Booking; onNavigate: (screen: ActiveScreen) => void }) {
  const total = Math.max(booking.preArrivalTotal, 1);
  const done = Math.min(booking.preArrivalCompleted, total);
  const steps = PRE_ARRIVAL_STEPS.slice(0, total);
  const nextStep = steps[done];
  const ring = 2 * Math.PI * 9;
  return (
    <section className="guest-checklist" aria-labelledby="guest-checklist-title">
      <div className="guest-checklist__head">
        {/* Already at the hotel, "before arrival" is past: it is registration left to finish. */}
        <h2 id="guest-checklist-title">{hasStayStarted(booking) ? 'Finish your registration' : 'Check-in before arrival'}</h2>
        <span
          className="guest-checklist__progress"
          role="progressbar"
          aria-label="Pre-arrival progress"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
        >
          <svg viewBox="0 0 22 22" aria-hidden="true">
            <circle cx="11" cy="11" r="9" />
            <circle cx="11" cy="11" r="9" strokeDasharray={ring} strokeDashoffset={ring * (1 - done / total)} />
          </svg>
          {done} of {total}
        </span>
      </div>
      <ol className="guest-checklist__steps">
        {steps.map((step, index) => {
          const complete = index < done;
          const next = index === done;
          return (
            <li key={step.label}>
              <button
                type="button"
                className={`guest-checklist__step${complete ? ' is-done' : ''}${next ? ' is-next' : ''}`}
                onClick={() => onNavigate(step.screen)}
              >
                <span className="guest-checklist__mark" aria-hidden="true">{complete ? <Check weight="bold" /> : null}</span>
                <span className="guest-checklist__label">{step.label}<span className="sr-only">{complete ? ', done' : ', to do'}</span></span>
                {next ? <span className="guest-checklist__action" aria-hidden="true">{complete ? 'Edit' : 'Add'}<CaretRight /></span> : null}
              </button>
            </li>
          );
        })}
      </ol>
      {nextStep ? (
        <Button
          className="guest-button guest-button--primary"
          type="button"
          onClick={() => onNavigate(nextStep.screen)}
        >
          Complete pre-arrival <ArrowRight aria-hidden="true" />
        </Button>
      ) : null}
    </section>
  );
}

export function RoomPreferencesCard({ preferences, onOpen }: { preferences: RoomPreferences; onOpen: () => void }) {
  const picks = summarizeRoomPreferences(preferences);
  const [first, second, ...rest] = picks;
  return (
    <button className="guest-tile" type="button" onClick={onOpen} data-testid="guest-room-preferences-card">
      <span className="guest-tile__icon" aria-hidden="true"><Bed /></span>
      {/* Says what it is and that it changes: a tile of answers alone read as fixed facts. */}
      <span className="guest-tile__cue" aria-hidden="true"><PencilSimple />Edit</span>
      <small>Room preferences</small>
      <b>{first ?? 'Set your preferences'}</b>
      <span className="guest-tile__meta">
        {second ?? (first ? 'Tap to add more' : 'Bed, floor, view and more')}
        {rest.length ? <i>+{rest.length}</i> : null}
      </span>
    </button>
  );
}

/**
 * The feed's clock by default: today within the stay, at 7 PM -- except on
 * checkout day, which starts in the morning. At 7 PM "check out by 12:00 PM"
 * and "before you go" were both seven hours stale.
 */
export function defaultFeedClock(booking: Booking): FeedClock {
  const nights = Math.max(1, countNightsBetween(booking.checkIn, booking.checkOut));
  const day = Math.min(nights + 1, Math.max(1, countNightsBetween(booking.checkIn, PROTOTYPE_TODAY) + 1));
  return { dayOfStay: day, hour: day > nights ? 8 : 19 };
}
