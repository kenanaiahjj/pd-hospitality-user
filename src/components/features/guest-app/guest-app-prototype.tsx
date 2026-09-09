'use client';

import {
  AirplaneTilt,
  ArrowLeft,
  ArrowRight,
  Bed,
  CalendarBlank,
  CaretRight,
  ChatCircleDots,
  Check,
  CheckCircle,
  Coffee,
  ForkKnife,
  House,
  IdentificationCard,
  MapPin,
  Person,
  QrCode,
  Receipt,
  ShieldCheck,
  SlidersHorizontal,
  Sparkle,
  SpinnerGap,
  Storefront,
  SuitcaseRolling,
  Users,
  WifiHigh,
  WifiSlash,
} from '@phosphor-icons/react';
import Image from 'next/image';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Button, Input } from '@/components/ui';
import {
  getPrimaryBooking,
  MOCK_SESSION,
  SERVICES,
  type Booking,
  type GuestSession,
  type ScreenId,
} from './prototype-model';
import { getServiceImage, type ServiceImageKey } from './service-images';
import './guest-app-prototype.css';

type ActiveScreen = ScreenId | 'entry-hub';

type FieldProps = {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
  helper?: string;
  required?: boolean;
};

function Field({ label, name, type = 'text', placeholder, defaultValue, helper, required }: FieldProps) {
  const helperId = helper ? `${name}-helper` : undefined;
  return (
    <label className="guest-field" htmlFor={name}>
      <span>{label}{required ? ' *' : ''}</span>
      <Input id={name} name={name} type={type} placeholder={placeholder} defaultValue={defaultValue} aria-describedby={helperId} required={required} />
      {helper ? <small id={helperId}>{helper}</small> : null}
    </label>
  );
}

function SelectField({ label, name, children, defaultValue }: { label: string; name: string; children: ReactNode; defaultValue?: string }) {
  return (
    <label className="guest-field" htmlFor={name}>
      <span>{label}</span>
      <select id={name} name={name} defaultValue={defaultValue}>{children}</select>
    </label>
  );
}

function HeroIcon({ children, tone = 'plain' }: { children: ReactNode; tone?: string }) {
  return <div className={`guest-hero-icon guest-hero-icon--${tone}`} aria-hidden="true">{children}</div>;
}

function Tag({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'positive' | 'warning' | 'dark' }) {
  return <span className={`guest-tag guest-tag--${tone}`}>{children}</span>;
}

function Notice({ icon, title, children, tone = 'neutral' }: { icon?: ReactNode; title: string; children: ReactNode; tone?: 'neutral' | 'positive' | 'warning' | 'offline' }) {
  return (
    <div className={`guest-notice guest-notice--${tone}`} role="status">
      {icon ? <span className="guest-notice__icon" aria-hidden="true">{icon}</span> : null}
      <div><strong>{title}</strong><p>{children}</p></div>
    </div>
  );
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <div className="guest-summary-row"><span>{label}</span><b className={strong ? 'is-strong' : ''}>{value}</b></div>;
}

function QrArtwork() {
  return (
    <svg className="guest-qr" viewBox="0 0 29 29" role="img" aria-label="Stay identity QR code">
      <rect width="29" height="29" rx="1" fill="white" />
      <path fill="currentColor" d="M2 2h8v8H2V2Zm2 2v4h4V4H4Zm15-2h8v8h-8V2Zm2 2v4h4V4h-4ZM2 19h8v8H2v-8Zm2 2v4h4v-4H4Zm8-19h2v2h-2V2Zm3 0h2v4h-2V2Zm-3 4h4v2h-4V6Zm1 3h2v2h-2V9Zm4 0h2v4h-4v-2h2V9Zm4 3h2v2h-2v-2Zm3 0h3v2h-3v-2Zm-12 3h2v4h-2v-4Zm3 0h4v2h-4v-2Zm5 0h2v2h-2v-2Zm3 0h5v2h-3v2h-2v-4Zm-8 4h2v2h-2v-2Zm3 0h3v2h-3v-2Zm5 0h2v5h-2v-5Zm3 0h4v2h-4v-2Zm-12 4h5v2h-5v-2Zm6-1h2v3h-2v-3Zm6 1h4v2h-4v-2Zm-10 4h2v2h-2v-2Zm4 0h3v2h-3v-2Zm5 0h2v2h-2v-2Zm3 0h3v2h-3v-2Z" />
    </svg>
  );
}

function ServiceVisual({ tone, icon }: { tone: string; icon: ReactNode }) {
  return <div className={`guest-service-visual guest-service-visual--${tone}`} aria-hidden="true"><span>{icon}</span><i /><i /></div>;
}

function ServiceImage({ imageKey, tone, icon, decorative = false }: { imageKey: ServiceImageKey; tone: string; icon: ReactNode; decorative?: boolean }) {
  const [failed, setFailed] = useState(false);
  const image = getServiceImage(imageKey);

  return (
    <div className={`guest-service-image guest-service-image--${imageKey} ${failed ? 'is-error' : ''}`}>
      <ServiceVisual tone={tone} icon={icon} />
      <Image
        src={image.src}
        alt={decorative ? '' : image.alt}
        fill
        sizes="(max-width: 720px) calc(100vw - 32px), 688px"
        style={{ objectPosition: image.focalPoint }}
        onError={() => setFailed(true)}
      />
    </div>
  );
}

type GuestAppPrototypeProps = {
  initialSession?: GuestSession;
  initialScreen?: ActiveScreen;
};

export function GuestAppPrototype({ initialSession, initialScreen }: GuestAppPrototypeProps = {}) {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>(initialScreen ?? 'entry-hub');
  const [session] = useState<GuestSession>(() => initialSession ?? MOCK_SESSION);
  const [history, setHistory] = useState<ActiveScreen[]>([]);
  const [online, setOnline] = useState(true);
  const [chatMessages, setChatMessages] = useState<Array<{ from: 'guest' | 'desk'; body: string; state?: string }>>([
    { from: 'desk', body: 'Good afternoon, Ana. How can we help with your stay?' },
  ]);
  const [sending, setSending] = useState(false);
  const [serviceCancelled, setServiceCancelled] = useState(false);

  const go = (next: ActiveScreen) => {
    setHistory((items) => [...items, activeScreen]);
    setActiveScreen(next);
    window.scrollTo?.({ top: 0, behavior: 'smooth' });
  };

  const back = () => {
    setHistory((items) => {
      const next = [...items];
      setActiveScreen(next.pop() ?? 'entry-hub');
      return next;
    });
  };

  const sendQuickMessage = (body: string) => {
    const state = online ? 'Sent' : 'Will send when connected';
    setChatMessages((messages) => [...messages, { from: 'guest', body, state }]);
    if (!online) return;
    setSending(true);
    window.setTimeout(() => {
      setChatMessages((messages) => [...messages, { from: 'desk', body: body.includes('towel') ? 'We’ll bring two fresh towels to room 304 shortly.' : 'Thanks. The front desk has received your request.', state: 'Seen' }]);
      setSending(false);
    }, 850);
  };

  const showNav = ['stay-overview', 'wallet', 'wallet-offline', 'marketplace', 'category-listing', 'hotel-service', 'vendor-service', 'service-booking', 'booking-confirmation', 'booking-blocked', 'my-bookings', 'cancel-before-cutoff', 'cancel-after-cutoff', 'folio', 'chat', 'chat-after-hours', 'room-qr-midstay', 'profile', 'stay-history'].includes(activeScreen);
  const primaryBooking = getPrimaryBooking(session.bookings, session.activeBookingId) ?? MOCK_SESSION.bookings[0]!;

  const primary = (label: string, next: ActiveScreen, options?: { disabled?: boolean }) => (
    <Button className="guest-button guest-button--primary" type="button" onClick={() => go(next)} disabled={options?.disabled}>{label}<ArrowRight aria-hidden="true" /></Button>
  );

  const renderScreen = () => {
    switch (activeScreen) {
      case 'entry-hub':
        return (
          <div className="guest-entry">
            <div className="guest-entry__utility"><Tag>Clickable MVP</Tag><span>Guest app · Phase 1</span></div>
            <HeroIcon tone="dark"><SuitcaseRolling size={30} /></HeroIcon>
            <p className="guest-eyebrow">The Henry&apos;s Hotels pilot</p>
            <h1>Your stay starts here</h1>
            <p className="guest-lede">Open the link from your booking, scan the QR in your room, or connect through hotel Wi-Fi.</p>
            <div className="guest-entry-options">
              <button className="guest-entry-card" onClick={() => go('identify')}><span><Receipt /></span><div><b>Booking email</b><small>Pre-arrival · booking context attached</small></div><CaretRight /></button>
              <button className="guest-entry-card" aria-label="Simulate Room QR" onClick={() => go('room-qr-landing')}><span><QrCode /></span><div><b>Room QR</b><small>Already at the hotel</small></div><CaretRight /></button>
              <button className="guest-entry-card" aria-label="Open hotel Wi-Fi entry" onClick={() => go('wifi-landing')}><span><WifiHigh /></span><div><b>Hotel Wi-Fi</b><small>Arrival-day captive portal</small></div><CaretRight /></button>
            </div>
            <button className="guest-button guest-button--primary" type="button" onClick={() => go('identify')}>Open confirmation link<ArrowRight /></button>
            <p className="guest-footnote">Prototype only · No real booking data or payment is used.</p>
          </div>
        );

      case 'room-qr-landing':
        return <ScreenIntro icon={<QrCode size={30} />} eyebrow="Room QR detected" title="Let’s link this room to you" text="This permanent room code opens the guest app. Your last name confirms which live booking is yours."><StayMiniCard status="Room 304 detected" /> <Field label="Last name" name="qr-last-name" placeholder="Santos" required />{primary('Link my stay', 'room-qr-midstay')}<TextButton onClick={() => go('front-desk-assist')}>I need help</TextButton></ScreenIntro>;

      case 'wifi-landing':
        return <ScreenIntro icon={<WifiHigh size={30} />} eyebrow="Connected to hotel Wi-Fi" title="Welcome to The Henry Manila" text="You’re online through the hotel network. Find your booking to continue."><Notice title="Hotel-local connection" icon={<WifiHigh />}>Your Stay QR and itinerary remain available if this connection drops.</Notice>{primary('Find my booking', 'identify')}</ScreenIntro>;

      case 'identify':
        return <ScreenIntro eyebrow="Connect your stay" title="Find your booking" text="Use the details from your confirmation email. OTA references from Agoda and Booking.com work too."><form className="guest-form" onSubmit={(event) => { event.preventDefault(); go('booking-found'); }}><Field label="Booking or confirmation number" name="booking-number" placeholder="Any format" helper="We’ll match hotel and OTA references." required /><Field label="Last name" name="last-name" placeholder="As shown on the booking" required /><Button className="guest-button guest-button--primary" type="submit">Find booking<ArrowRight /></Button></form><TextButton onClick={() => go('lookup-fallback')}>Try the failed lookup path</TextButton></ScreenIntro>;

      case 'lookup-fallback':
        return <ScreenIntro eyebrow="We couldn’t match that number" title="Try another way" text="Legacy hotel systems can use a different reference. These stay details give us another way to look."><Notice tone="warning" title="No match yet">Your booking is not lost. We won’t ask you to reformat the reference.</Notice><div className="guest-form"><Field label="Last name" name="fallback-name" defaultValue="Santos" /><Field label="Check-in date" name="fallback-date" type="date" defaultValue="2026-11-09" /><SelectField label="Property" name="property" defaultValue="manila"><option value="manila">The Henry Manila</option><option value="cebu">The Henry Cebu</option><option value="dumaguete">The Henry Dumaguete</option></SelectField>{primary('Search again', 'front-desk-assist')}</div></ScreenIntro>;

      case 'front-desk-assist':
        return <ScreenIntro icon={<ChatCircleDots size={30} />} eyebrow="Human fallback" title="The front desk can connect you" text="Ask the front desk to send a secure link or give you a short code. You don’t need to understand the hotel’s booking system."><div className="guest-contact-card"><div><small>The Henry Manila</small><b>+63 2 8807 8888</b><span>Front desk · 6:00 AM–10:00 PM</span></div><button aria-label="Call the front desk" className="guest-icon-button"><ChatCircleDots /></button></div><Field label="Code from the front desk" name="staff-code" placeholder="6-digit code" />{primary('Connect my stay', 'booking-found')}<TextButton onClick={() => go('no-booking')}>I don’t have a booking</TextButton></ScreenIntro>;

      case 'no-booking':
        return <ScreenIntro icon={<Receipt size={30} />} eyebrow="No stay attached" title="You need a confirmed booking" text="This pilot starts after a hotel booking. The app does not search or compare hotels."><Notice title="Already booked?">Try your OTA reference or ask the property to send you a secure link.</Notice>{primary('Try again', 'identify')}<TextButton onClick={() => go('front-desk-assist')}>Contact the front desk</TextButton></ScreenIntro>;

      case 'booking-found':
        return <ScreenIntro eyebrow="Match found" title="Is this your stay?" text="Confirm the details before creating your guest profile."><StayCard booking={primaryBooking} /><div className="guest-summary"><SummaryRow label="Guest" value={session.guestName} /><SummaryRow label="Guests" value={`${primaryBooking.guestCount} guests`} /><SummaryRow label="Source" value={primaryBooking.source} /></div>{primary('Yes, this is my stay', 'create-account')}<TextButton onClick={() => go('identify')}>This isn’t my booking</TextButton></ScreenIntro>;

      case 'create-account':
        return <FormScreen step="1 of 5" title="Create your guest profile" text="We’ll recognize you across all 13 properties next time."><Field label="Full name" name="full-name" defaultValue={session.guestName} required /><Field label="Email" name="email" type="email" defaultValue={session.email} required /><Field label="Mobile number" name="mobile" type="tel" placeholder="+63" required />{primary('Continue', 'guest-details')}</FormScreen>;

      case 'welcome-back':
        return <ScreenIntro icon={<CheckCircle size={30} />} eyebrow="Returning guest recognized" title={`Welcome back, ${session.guestName.split(' ')[0]}`} text="Your saved identity and room preferences are ready for this stay at a new property."><StayCard booking={primaryBooking} /><Notice tone="positive" icon={<Sparkle />} title="No typing needed">Review what we already have, then confirm your stay.</Notice>{primary('Review saved details', 'repeat-review')}</ScreenIntro>;

      case 'stay-overview':
        return <div className="guest-stack"><section className="guest-home-hero"><div><p className="guest-eyebrow">Good afternoon, Ana</p><h1>Your Manila stay</h1><p>November 9–12 · Room 304</p></div><button className="guest-icon-button" aria-label="Open profile" onClick={() => go('profile')}><Person /></button></section>{!online ? <Notice tone="offline" icon={<WifiSlash />} title="You’re offline">Cached stay details are available. Requests will send when connected.</Notice> : null}<button className="guest-stay-banner" onClick={() => go('wallet')}><div><Tag tone="positive">Ready for arrival</Tag><h2>Stay QR</h2><p>Show this identity code at the front desk.</p></div><div className="guest-stay-banner__qr"><QrCode /></div></button><section><SectionHeading title="Stay details" action="View rate" onAction={() => go('rate-detail')} /><div className="guest-grid-2"><InfoTile icon={<CalendarBlank />} label="Check-in" value="Nov 9 · 3:00 PM" /><InfoTile icon={<Bed />} label="Room" value="King · Room 304" /></div></section><section><SectionHeading title="During your stay" action="See all" onAction={() => go('marketplace')} /><div className="guest-action-grid"><ActionTile icon={<ForkKnife />} label="Room dining" onClick={() => go('hotel-service')} /><ActionTile icon={<Sparkle />} label="Spa" onClick={() => go('vendor-service')} /><ActionTile icon={<AirplaneTilt />} label="Transfer" onClick={() => go('marketplace')} /><ActionTile icon={<ChatCircleDots />} label="Ask front desk" onClick={() => go('chat')} /></div></section><section><SectionHeading title="Your account" /><div className="guest-list-group" role="group" aria-label="Your account"><button className="guest-list-row" onClick={() => go('folio')}><span><Receipt /></span><div><b>Room charges</b><small>Current folio · ₱3,050</small></div><CaretRight /></button><button className="guest-list-row" onClick={() => go('my-bookings')}><span><CalendarBlank /></span><div><b>My bookings</b><small>1 upcoming service</small></div><CaretRight /></button></div></section></div>;

      case 'guest-details':
        return <FormScreen step="1 of 5" title="Your details" text="These details are sent securely to the property for registration."><Field label="Full name" name="guest-name" defaultValue="Ana Santos" required /><Field label="Nationality" name="nationality" defaultValue="Filipino" /><Field label="Email" name="guest-email" type="email" defaultValue="ana@example.com" /><Field label="Mobile" name="guest-mobile" type="tel" defaultValue="+63 917 555 0142" />{primary('Continue to ID', 'id-capture')}</FormScreen>;

      case 'id-capture':
        return <FormScreen step="2 of 5" title="ID or passport" text="International guests need passport details. This prototype does not upload a real document."><button className="guest-upload" type="button"><IdentificationCard size={28} /><b>Capture or upload ID</b><small>Passport, national ID, or driver’s license</small></button><Field label="Document number" name="document-number" placeholder="Enter document number" /><Field label="Expiry date" name="expiry" type="date" />{primary('Save and continue', 'room-preferences')}</FormScreen>;

      case 'room-preferences':
        return <FormScreen step="3 of 5" title="Room preferences" text="We’ll save these above the property level and pre-fill them on future stays."><SelectField label="Preferred floor" name="floor" defaultValue="high"><option value="high">Higher floor</option><option value="low">Lower floor</option><option value="none">No preference</option></SelectField><SelectField label="Bed type" name="bed" defaultValue="king"><option value="king">King bed</option><option value="twin">Twin beds</option></SelectField><fieldset className="guest-fieldset"><legend>Accessibility needs</legend><CheckOption label="Step-free room access" /><CheckOption label="Bathroom grab rails" /><CheckOption label="Visual door alert" /></fieldset>{primary('Save preferences', online ? 'additional-guests' : 'prereg-queued')}</FormScreen>;

      case 'additional-guests':
        return <FormScreen step="4 of 5" title="Who else is staying?" text="Add names only. Additional guests do not need accounts."><Field label="Additional guest 1" name="guest-2" defaultValue="Marco Santos" /><button type="button" className="guest-button guest-button--secondary">Add another guest</button><Notice title="One booking, one account">Your Stay QR can be shared as a screenshot with the people staying with you.</Notice>{primary('Continue', 'early-check-in')}</FormScreen>;

      case 'repeat-review':
        return <ScreenIntro eyebrow="Saved from your Cebu stay" title="Review, then confirm" text="Everything is pre-filled. Change only what’s different this time."><div className="guest-review-card"><ReviewBlock icon={<Person />} title="Ana Santos" lines={['Filipino · Passport on file', 'ana@example.com · +63 917 555 0142']} /><ReviewBlock icon={<SlidersHorizontal />} title="Room preferences" lines={['Higher floor · King bed', 'No accessibility requests']} /><ReviewBlock icon={<Users />} title="Additional guest" lines={['Marco Santos']} /></div>{primary('Confirm everything', 'prereg-complete')}<TextButton onClick={() => go('guest-details')}>Edit details</TextButton></ScreenIntro>;

      case 'rate-detail':
        return <ScreenIntro eyebrow={`Booking ${primaryBooking.id}`} title="Room and rate" text="The latest details returned by the hotel system."><StayCard booking={primaryBooking} /><div className="guest-summary"><SummaryRow label={`${primaryBooking.checkOut} · ${primaryBooking.roomType}`} value="₱18,000" /><SummaryRow label="Taxes and fees" value="₱2,160" /><SummaryRow label="Booking total" value="₱20,160" strong /><SummaryRow label={`Paid through ${primaryBooking.source}`} value="₱20,160" /></div><Notice title="Live hotel data">Availability, rates, and payment details require a connection.</Notice></ScreenIntro>;

      case 'early-check-in':
        return <ScreenIntro eyebrow="Arrival · 10:30 AM" title="Check in earlier" text="Standard check-in is 3:00 PM. A room can be held from 11:00 AM for an added charge."><div className="guest-price-card"><div><small>Early check-in</small><b>11:00 AM</b></div><strong>₱1,500</strong></div><GatewayChoices />{online ? primary('Pay ₱1,500', 'insurance-offer') : <button className="guest-button guest-button--primary" disabled>Connect to continue</button>}<TextButton onClick={() => go('insurance-offer')}>No thanks, keep 3:00 PM</TextButton></ScreenIntro>;

      case 'insurance-offer':
        return <ScreenIntro icon={<ShieldCheck size={30} />} eyebrow="Optional · before arrival" title="Protect this trip" text="Add mock travel cover for delays, medical emergencies, and trip interruption."><div className="guest-policy-card"><Tag>Prototype product</Tag><h2>Island travel cover</h2><p>Coverage up to ₱100,000 for this trip.</p><div><span>About 10% of ticket value</span><strong>₱620</strong></div></div>{online ? primary('Add cover · ₱620', 'prereg-complete') : <button className="guest-button guest-button--primary" disabled>Connect to purchase</button>}<TextButton onClick={() => go('prereg-complete')}>Continue without cover</TextButton></ScreenIntro>;

      case 'prereg-complete':
        return <ScreenIntro icon={<Check size={30} />} eyebrow="Pre-registered" title="You’re ready for arrival" text="Open your Stay QR at the front desk. A team member will verify your identity and complete check-in."><div className="guest-timeline"><TimelineItem title="Before arrival" text="Details received by the hotel" done /><TimelineItem title="At the front desk" text="Show your Stay QR and original ID" /><TimelineItem title="After verification" text="Room 304 becomes active in the app" /></div>{primary('Open my Stay QR', 'wallet')}<TextButton onClick={() => go('stay-overview')}>View stay overview</TextButton></ScreenIntro>;

      case 'prereg-queued':
        return <ScreenIntro icon={<WifiSlash size={30} />} eyebrow="Saved on this device" title="Ready to send when connected" text="Your pre-registration is safely queued. It will send automatically when a connection returns."><Notice tone="offline" title="No action needed">Your edits remain on this device. The hotel has not received them yet.</Notice>{primary('Open cached stay', 'stay-overview')}</ScreenIntro>;

      case 'wallet':
      case 'wallet-offline': {
        const isOfflineWallet = activeScreen === 'wallet-offline' || !online;
        return <div className="guest-wallet"><div className="guest-wallet__status"><Tag tone={isOfflineWallet ? 'warning' : 'positive'}>{isOfflineWallet ? 'Saved on this device' : 'Ready for arrival'}</Tag><span>Valid until Nov 12</span></div><h1>{isOfflineWallet ? 'Your Stay QR works offline' : 'Your Stay QR'}</h1><p>Show this identity code at the front desk. It does not authorize charges or unlock your room.</p><div className="guest-qr-card"><QrArtwork /><div className="guest-qr-card__identity"><b>Ana Santos</b><span>The Henry Manila · Room 304</span><code>STAY · HEN-7K2M</code></div></div><div className="guest-tag-row"><Tag>Identity only</Tag><Tag>Screenshot-shareable</Tag><Tag>Offline-ready</Tag></div>{isOfflineWallet ? <Notice tone="offline" icon={<WifiSlash />} title="Offline">This cached QR, your room, itinerary, booking details, last-known folio, and chat history are available.</Notice> : <Notice tone="positive" icon={<CheckCircle />} title="Saved for offline use">This QR remains available if your connection drops.</Notice>}<button className="guest-button guest-button--secondary" type="button">Save screenshot</button></div>;
      }

      case 'marketplace':
        return <div className="guest-stack"><div className="guest-page-title"><p className="guest-eyebrow">On-property only</p><h1>Make the most of your stay</h1><p>Book hotel services and verified on-property providers. Charges are added to room 304.</p></div>{!online ? <Notice tone="offline" icon={<WifiSlash />} title="Browsing saved services">Live availability and booking require a connection.</Notice> : null}<div className="guest-featured-service"><ServiceImage imageKey="spa" tone="sage" icon={<Sparkle size={32} />} /><div><Tag>Third-party · on property</Tag><h2>Hilom signature massage</h2><p>Traditional Filipino therapeutic massage.</p><button onClick={() => go('vendor-service')}>View service<ArrowRight /></button></div></div><section><SectionHeading title="Browse services" /><div className="guest-category-grid"><ActionTile icon={<ForkKnife />} label="In-room dining" onClick={() => go('hotel-service')} /><ActionTile icon={<Sparkle />} label="Spa & massage" onClick={() => go('category-listing')} /><ActionTile icon={<Coffee />} label="Restaurants & bar" onClick={() => go('category-listing')} /><ActionTile icon={<MapPin />} label="Activities & tours" onClick={() => go('category-listing')} /><ActionTile icon={<AirplaneTilt />} label="Transfers" onClick={() => go('category-listing')} /><ActionTile icon={<Storefront />} label="Other amenities" onClick={() => go('category-listing')} /></div></section><button className="guest-list-row" onClick={() => go('my-bookings')}><span><CalendarBlank /></span><div><b>My bookings</b><small>View upcoming and past services</small></div><CaretRight /></button></div>;

      case 'category-listing':
        return <div className="guest-stack"><div className="guest-page-title"><p className="guest-eyebrow">2 services</p><h1>Spa & massage</h1><p>Verified providers operating inside this property.</p></div>{SERVICES.filter((service) => service.id === 'spa' || service.id === 'tour').map((service) => <button key={service.id} className="guest-service-row" onClick={() => go('vendor-service')}><ServiceImage imageKey={service.id} tone={service.tone} icon={<Sparkle />} decorative /><div><Tag>{service.operator}</Tag><h2>{service.name}</h2><p>{service.price} · {service.cutoff}</p></div><CaretRight /></button>)}</div>;

      case 'hotel-service':
        return <ServiceDetail kind="hotel" online={online} onBook={() => go(online ? 'service-booking' : 'booking-blocked')} onChat={() => go('chat')} />;

      case 'vendor-service':
        return <ServiceDetail kind="vendor" online={online} onBook={() => go(online ? 'service-booking' : 'booking-blocked')} onChat={() => go('chat')} />;

      case 'service-booking':
        return <FormScreen step="Charged to room" title="Choose a time" text="Live availability is shown for Hilom signature massage."><div className="guest-date-strip"><button aria-pressed="false"><small>MON</small><b>10</b></button><button className="is-active" aria-pressed="true"><small>TUE</small><b>11</b></button><button aria-pressed="false"><small>WED</small><b>12</b></button></div><fieldset className="guest-fieldset"><legend>Available times</legend><div className="guest-chip-grid"><button type="button">10:00 AM</button><button type="button" className="is-active">1:30 PM</button><button type="button">4:00 PM</button></div></fieldset><SelectField label="Guests" name="party-size" defaultValue="1"><option value="1">1 guest</option><option value="2">2 guests</option></SelectField><div className="guest-summary"><SummaryRow label="Hilom signature massage" value="₱2,400" /><SummaryRow label="Room 304" value="Charge at checkout" /><SummaryRow label="Total added to folio" value="₱2,400" strong /></div>{primary('Confirm and charge to room', 'booking-confirmation')}</FormScreen>;

      case 'booking-confirmation':
        return <ScreenIntro icon={<Check size={30} />} eyebrow="Booking confirmed" title="Your massage is booked" text="The charge has been added to room 304 and settles with your hotel folio at checkout."><div className="guest-ticket"><div><small>Tuesday · November 11</small><h2>1:30 PM</h2><p>Hilom signature massage · 1 guest</p></div><Tag>Confirmed</Tag></div><Notice title="Cancellation cutoff">Cancel yourself until 1:30 PM on November 10. After that, contact the front desk. The folio line remains.</Notice>{primary('View my bookings', 'my-bookings')}<TextButton onClick={() => go('marketplace')}>Book another service</TextButton></ScreenIntro>;

      case 'booking-blocked':
        return <ScreenIntro icon={<WifiSlash size={30} />} eyebrow="Connection required" title="We can’t hold a time while offline" text="Live services are not queued because the slot or price could change before you reconnect."><Notice tone="offline" title="Nothing was booked">Connect to hotel Wi-Fi and try again. You can still message the front desk; the message will wait on this device.</Notice>{primary('Message the front desk', 'chat')}<TextButton onClick={() => { setOnline(true); go('vendor-service'); }}>Simulate reconnection</TextButton></ScreenIntro>;

      case 'my-bookings':
        return <div className="guest-stack"><div className="guest-page-title"><p className="guest-eyebrow">Services for this stay</p><h1>My bookings</h1></div><section><SectionHeading title="Upcoming" /><button className="guest-booking-card" onClick={() => go('cancel-before-cutoff')}><div><Tag tone={serviceCancelled ? 'neutral' : 'positive'}>{serviceCancelled ? 'Cancelled' : 'Confirmed'}</Tag><h2>Hilom signature massage</h2><p>Tue, Nov 11 · 1:30 PM · ₱2,400</p><small>Third-party · on property</small></div><CaretRight /></button></section><section><SectionHeading title="Past" /><div className="guest-booking-card is-static"><div><Tag>Completed</Tag><h2>Airport transfer</h2><p>Sun, Nov 9 · 9:00 AM · ₱1,200</p><small>Hotel arranged</small></div></div></section></div>;

      case 'cancel-before-cutoff':
        return <ScreenIntro eyebrow="30 hours before service" title="Cancel this booking?" text="This is before the provider’s 24-hour cutoff, so you can cancel it yourself."><div className="guest-ticket"><div><small>Tuesday · November 11</small><h2>1:30 PM</h2><p>Hilom signature massage · ₱2,400</p></div></div><Notice tone="positive" title="The folio line will be removed">This service has not settled. No money moves when you cancel.</Notice><button className="guest-button guest-button--danger" onClick={() => { setServiceCancelled(true); go('my-bookings'); }}>Cancel service</button><TextButton onClick={() => go('my-bookings')}>Keep booking</TextButton><div className="guest-provisional"><b>Provisional decision</b><p>Confirm that third-party providers accept a 24-hour self-service cancellation window.</p></div></ScreenIntro>;

      case 'cancel-after-cutoff':
        return <ScreenIntro eyebrow="4 hours before service" title="Contact the front desk to change this" text="The provider’s 24-hour self-service cutoff has passed. The charge stays on your room folio."><Notice tone="warning" title="Front desk help required">Send a message and the team will check what the provider can do.</Notice>{primary('Chat with front desk', 'chat')}<TextButton onClick={() => go('my-bookings')}>Keep booking</TextButton><div className="guest-provisional"><b>Provisional decision</b><p>Confirm that third-party providers accept a 24-hour self-service cancellation window.</p></div></ScreenIntro>;

      case 'folio':
        return <div className="guest-stack"><div className="guest-page-title"><p className="guest-eyebrow">Room 304 · Last updated 2:14 PM</p><h1>Room charges</h1><p>These charges settle with the hotel at checkout.</p></div>{!online ? <Notice tone="offline" title="Last-known folio">Reconnect for the latest charges.</Notice> : null}<div className="guest-total-card"><span>Current room total</span><strong>₱3,050</strong><small>Booking room rate paid through Agoda</small></div><div className="guest-folio"><FolioItem date="NOV 9" title="Airport transfer" meta="Hotel arranged" amount="₱1,200" /><FolioItem date="NOV 10" title="In-room dining" meta="Dinner · 2 guests" amount="₱850" /><FolioItem date="NOV 10" title="Laundry service" meta="Hotel operated" amount="₱1,000" /></div><Notice title="Questions about a charge?">The front desk can explain or correct a folio line before checkout.</Notice>{primary('Ask the front desk', 'chat')}</div>;

      case 'chat':
      case 'chat-after-hours': {
        const afterHours = activeScreen === 'chat-after-hours';
        return <div className="guest-chat"><div className="guest-chat__intro"><div><Tag tone={afterHours ? 'warning' : 'positive'}>{afterHours ? 'Outside staffed hours' : 'Front desk online'}</Tag><h1>Front desk</h1><p>{afterHours ? 'Messages send now. The team responds from 6:00 AM.' : 'Shared property inbox · Usually replies in a few minutes.'}</p></div></div>{!online ? <Notice tone="offline" title="Messages will send when connected">Your chat history is available. New requests wait on this device.</Notice> : null}<div className="guest-quick-actions" aria-label="Quick requests"><button onClick={() => sendQuickMessage('Could we get two fresh towels, please?')}>Towels</button><button onClick={() => sendQuickMessage('Please arrange housekeeping for room 304.')}>Housekeeping</button><button onClick={() => sendQuickMessage('Can we request a late checkout?')}>Late checkout</button><button onClick={() => sendQuickMessage('We need help arranging a transfer.')}>Transfers</button></div><div className="guest-messages" aria-live="polite">{chatMessages.map((message, index) => <div key={`${message.body}-${index}`} className={`guest-message guest-message--${message.from}`}><p>{message.body}</p>{message.state ? <small>{message.state}</small> : null}</div>)}{sending ? <div className="guest-message guest-message--desk guest-message--typing"><SpinnerGap className="guest-spin" /><span>Front desk is replying</span></div> : null}</div><form className="guest-composer" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); const body = String(form.get('message') ?? '').trim(); if (body) sendQuickMessage(body); event.currentTarget.reset(); }}><label className="sr-only" htmlFor="message">Message the front desk</label><input id="message" name="message" placeholder="Ask the front desk" /><button aria-label="Send message" type="submit"><ArrowRight /></button></form></div>;
      }

      case 'room-qr-midstay':
        return <ScreenIntro icon={<CheckCircle size={30} />} eyebrow="Room 304 linked" title="You’re checked in" text="Pre-arrival steps are no longer relevant. Go straight to services, your room charges, or the front desk."><StayMiniCard status="Active until November 12" />{primary('Explore services', 'marketplace')}<button className="guest-button guest-button--secondary" onClick={() => go('stay-overview')}>Open stay overview</button></ScreenIntro>;

      case 'profile':
        return <div className="guest-stack"><div className="guest-page-title"><p className="guest-eyebrow">Guest identity</p><h1>Ana Santos</h1><p>Recognized across all 13 participating properties.</p></div><div className="guest-profile-card"><div className="guest-avatar">AS</div><div><b>ana@example.com</b><span>+63 917 555 0142</span><small>Passport on file · ends 4821</small></div></div><section><SectionHeading title="Saved preferences" action="Edit" onAction={() => go('room-preferences')} /><div className="guest-summary"><SummaryRow label="Floor" value="Higher floor" /><SummaryRow label="Bed" value="King" /><SummaryRow label="Accessibility" value="None" /></div></section><button className="guest-list-row" onClick={() => go('stay-history')}><span><SuitcaseRolling /></span><div><b>Stay history</b><small>3 stays across 2 properties</small></div><CaretRight /></button><div className="guest-list-row is-muted"><span><Sparkle /></span><div><b>Loyalty</b><small>Reserved for a future phase</small></div></div></div>;

      case 'stay-history':
        return <div className="guest-stack"><div className="guest-page-title"><p className="guest-eyebrow">Across properties</p><h1>Stay history</h1></div><HistoryItem property="The Henry Cebu" dates="March 14–17, 2026" room="Room 211 · Completed" /><HistoryItem property="The Henry Manila" dates="October 2–4, 2025" room="Room 406 · Completed" /><HistoryItem property="The Henry Cebu" dates="May 8–10, 2025" room="Room 108 · Completed" /></div>;
    }
  };

  const focusDark = activeScreen === 'wallet' || activeScreen === 'wallet-offline';

  return (
    <main className={`guest-prototype guest-app ${focusDark ? 'guest-app--focus-dark' : ''}`}>
        <section className="guest-device" aria-label="Klarna hospitality guest app">
          <header className="guest-appbar">
            <div className="guest-appbar__side">
              {history.length ? <button className="guest-icon-button" type="button" onClick={back} aria-label="Go back"><ArrowLeft /></button> : <span className="guest-appbar__room guest-brand"><span className="guest-brand__mark" aria-hidden="true">K</span><strong>Klarna</strong></span>}
            </div>
            <div className="guest-appbar__center"><span className={`guest-connection ${online ? 'is-online' : 'is-offline'}`}>{online ? <WifiHigh /> : <WifiSlash />}{online ? 'Online' : 'Offline'}</span></div>
            <div className="guest-appbar__side guest-appbar__side--end">
              <button className="guest-icon-button" type="button" onClick={() => go('profile')} aria-label="Open profile"><Person /></button>
            </div>
          </header>

          <div className={`guest-screen ${showNav ? 'has-nav' : ''}`} key={activeScreen}>{renderScreen()}</div>

          {showNav ? <nav className="guest-bottom-nav" aria-label="Primary navigation"><NavButton label="Stay" icon={<House />} active={activeScreen === 'stay-overview'} onClick={() => go('stay-overview')} /><NavButton label="Services" icon={<Storefront />} active={['marketplace', 'category-listing', 'hotel-service', 'vendor-service', 'service-booking', 'booking-confirmation', 'booking-blocked', 'my-bookings', 'cancel-before-cutoff', 'cancel-after-cutoff'].includes(activeScreen)} onClick={() => go('marketplace')} /><NavButton label="Wallet" icon={<QrCode />} active={activeScreen === 'wallet' || activeScreen === 'wallet-offline'} onClick={() => go(online ? 'wallet' : 'wallet-offline')} /><NavButton label="Chat" icon={<ChatCircleDots />} active={activeScreen === 'chat' || activeScreen === 'chat-after-hours'} onClick={() => go('chat')} /></nav> : null}
        </section>
    </main>
  );
}

function ScreenIntro({ icon, eyebrow, title, text, children }: { icon?: ReactNode; eyebrow: string; title: string; text: string; children: ReactNode }) {
  return <div className="guest-stack guest-stack--intro">{icon ? <HeroIcon>{icon}</HeroIcon> : null}<div className="guest-page-title"><p className="guest-eyebrow">{eyebrow}</p><h1>{title}</h1><p>{text}</p></div>{children}</div>;
}

function FormScreen({ step, title, text, children }: { step: string; title: string; text: string; children: ReactNode }) {
  return <div className="guest-stack"><div className="guest-step"><span>{step}</span><i><b /></i></div><div className="guest-page-title"><h1>{title}</h1><p>{text}</p></div><div className="guest-form">{children}</div></div>;
}

function TextButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <Button className="guest-text-button" variant="ghost" type="button" onClick={onClick}>{children}</Button>;
}

function StayCard({ booking }: { booking: Booking }) {
  const checkIn = new Date(`${booking.checkIn}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const checkOut = new Date(`${booking.checkOut}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  return <div className="guest-stay-card"><div className="guest-stay-card__art"><House size={28} /></div><div><Tag>Confirmed</Tag><h2>{booking.property}</h2><p>{booking.roomType} · {checkIn}–{checkOut}, {booking.checkIn.slice(0, 4)}</p><small>Booking {booking.id}</small></div></div>;
}

function StayMiniCard({ status }: { status: string }) {
  return <div className="guest-mini-stay"><span><House /></span><div><b>The Henry Manila</b><small>{status}</small></div><CheckCircle /></div>;
}

function GatewayChoices() {
  return <fieldset className="guest-fieldset"><legend>Mock payment method</legend><label className="guest-radio"><input type="radio" name="gateway" defaultChecked /><span>GCash</span></label><label className="guest-radio"><input type="radio" name="gateway" /><span>Maya</span></label><label className="guest-radio"><input type="radio" name="gateway" /><span>Card via PayMongo</span></label></fieldset>;
}

function CheckOption({ label }: { label: string }) {
  return <label className="guest-check"><input type="checkbox" /><span>{label}</span></label>;
}

function ReviewBlock({ icon, title, lines }: { icon: ReactNode; title: string; lines: string[] }) {
  return <div className="guest-review-block"><span>{icon}</span><div><b>{title}</b>{lines.map((line) => <small key={line}>{line}</small>)}</div><button aria-label={`Edit ${title}`}><CaretRight /></button></div>;
}

function TimelineItem({ title, text, done }: { title: string; text: string; done?: boolean }) {
  return <div className={`guest-timeline__item ${done ? 'is-done' : ''}`}><span>{done ? <Check /> : null}</span><div><b>{title}</b><small>{text}</small></div></div>;
}

function SectionHeading({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return <div className="guest-section-heading"><h2>{title}</h2>{action ? <button onClick={onAction}>{action}<CaretRight /></button> : null}</div>;
}

function InfoTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="guest-info-tile"><span>{icon}</span><small>{label}</small><b>{value}</b></div>;
}

function ActionTile({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return <button className="guest-action-tile" onClick={onClick}><span>{icon}</span><b>{label}</b><CaretRight /></button>;
}

function ServiceDetail({ kind, online, onBook, onChat }: { kind: 'hotel' | 'vendor'; online: boolean; onBook: () => void; onChat: () => void }) {
  const vendor = kind === 'vendor';
  return <div className="guest-stack guest-service-detail"><ServiceImage imageKey={vendor ? 'spa' : 'dining'} tone={vendor ? 'sage' : 'sand'} icon={vendor ? <Sparkle size={38} /> : <ForkKnife size={38} />} decorative /><div className="guest-page-title"><div className="guest-tag-row"><Tag>{vendor ? 'Third-party · on property' : 'Hotel operated'}</Tag><Tag>{vendor ? '24-hour cutoff' : '2-hour cutoff'}</Tag></div><h1>{vendor ? 'Hilom signature massage' : 'In-room dining'}</h1><p>{vendor ? 'A 90-minute traditional Filipino therapeutic massage, delivered in the on-property spa.' : 'Comforting Filipino favorites and all-day classics delivered to room 304.'}</p></div><div className="guest-summary"><SummaryRow label="Price" value={vendor ? '₱2,400' : 'From ₱450'} /><SummaryRow label="Availability" value={online ? 'Today · 3 times' : 'Connect to check'} /><SummaryRow label="Operator" value={vendor ? 'Hilom Wellness' : 'The Henry Manila'} /><SummaryRow label="Cancellation" value={vendor ? 'Up to 24 hours before' : 'Up to 2 hours before'} /></div>{!online ? <Notice tone="offline" icon={<WifiSlash />} title="Live booking is unavailable">Capacity and price are never queued. Connect to see current times.</Notice> : null}<button className="guest-button guest-button--primary" onClick={onBook}>{online ? (vendor ? 'Choose a time' : 'View menu and order') : 'See connection options'}<ArrowRight /></button>{!online ? <TextButton onClick={onChat}>Message the front desk instead</TextButton> : null}{vendor ? <div className="guest-provisional"><b>Provisional decision</b><p>Confirm that third-party providers accept a 24-hour self-service cancellation window.</p></div> : null}</div>;
}

function FolioItem({ date, title, meta, amount }: { date: string; title: string; meta: string; amount: string }) {
  return <div className="guest-folio-item"><span>{date}</span><div><b>{title}</b><small>{meta}</small></div><strong>{amount}</strong></div>;
}

function HistoryItem({ property, dates, room }: { property: string; dates: string; room: string }) {
  return <div className="guest-history-item"><span><House /></span><div><b>{property}</b><p>{dates}</p><small>{room}</small></div></div>;
}

function NavButton({ label, icon, active, onClick }: { label: string; icon: ReactNode; active: boolean; onClick: () => void }) {
  return <button aria-current={active ? 'page' : undefined} onClick={onClick}><span>{icon}</span><small>{label}</small></button>;
}
