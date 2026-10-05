'use client';

import { Notice, ServiceImage, SummaryRow, TextButton } from './guest-ui';
import { slug } from './prototype-controls';
import type { Booking, RestaurantVenue, ServiceBooking } from './prototype-model';
import { PROTOTYPE_TODAY, RESTAURANTS, describeStayStatus, formatPesoAmount, getRoomCharges, parsePesoAmount } from './prototype-model';
import { getServiceImageKey } from './service-images';
import { ArrowLeft, ArrowRight, Bell, CalendarPlus, CaretRight, ForkKnife, House, MapPin, Sparkle, Storefront, WifiSlash, X } from '@phosphor-icons/react';
import type { ReactNode, TouchEvent as ReactTouchEvent } from 'react';
import { useRef, useState } from 'react';

import Image from 'next/image';
/*
  Dining and the shop: venue menus, the order tray, the gift shop, reading an
  order out of a chat message, and a room charge's itemised receipt.
*/

export const GIFT_PRODUCTS = [
  { group: 'Local Favorites', name: 'Artisan pasalubong box', price: '₱850', availability: 'Available today', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=700&q=80' },
  { group: 'Local Favorites', name: 'Handwoven market tote', price: '₱680', availability: 'Limited stock', image: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=700&q=80' },
  { group: 'Food & Treats', name: 'Single-origin Philippine coffee', price: '₱420', availability: 'Available today', image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=700&q=80' },
  { group: 'Food & Treats', name: 'Dried mango & cacao set', price: '₱560', availability: 'Available today', image: 'https://images.unsplash.com/photo-1599599810694-57a3e2b5b2b2?auto=format&fit=crop&w=700&q=80' },
  { group: 'Hotel Exclusives', name: 'Cabana embroidered cap', price: '₱750', availability: 'Available today', image: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=700&q=80' },
  { group: 'Hotel Exclusives', name: 'Cabana slippers & shirt set', price: '₱1,250', availability: 'Available today', image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=700&q=80' },
  { group: 'Crafts & Keepsakes', name: 'Handmade ceramic keepsake', price: '₱980', availability: 'Limited stock', image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=700&q=80' },
  { group: 'Crafts & Keepsakes', name: 'Postcard & magnet set', price: '₱280', availability: 'Available today', image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=700&q=80' },
  { group: 'Gift Sets', name: 'Wellness bath set', price: '₱1,100', availability: 'Available today', image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=700&q=80' },
  { group: 'Gift Sets', name: 'Seasonal Manila bundle', price: '₱1,450', availability: 'Limited edition', image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=700&q=80' },
] as const;

/** One name for the hotel's shop, in the feed and on its own page. */
export const LOBBY_SHOP_NAME = 'The lobby shop';

/*
  What a chat message orders: the venue's own items it names, with a quantity
  when one is written in front ("2 calamari", "two tasting menus"). Only items
  the venue sells, so a "thank you" is never read as an order.
*/
export const GENERIC_ORDER_WORDS = new Set(['grilled', 'crispy', 'classic', 'fresh', 'wild', 'handmade', 'artisan', 'single', 'origin', 'seasonal', 'cabana', 'henry', 'signature', 'local', 'special', 'house', 'philippine', 'manila']);

export const NUMBER_WORDS: Record<string, number> = { one: 1, a: 1, an: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };

export function readChatOrder(venueName: string, message: string): { venue: string; items: { id: string; name: string; unitPrice: string; quantity: number }[]; total: string } | null {
  const catalogue = venueName === LOBBY_SHOP_NAME
    ? GIFT_PRODUCTS.map((product) => ({ id: slug(product.name), name: product.name, price: product.price }))
    : (RESTAURANTS.find((venue) => venue.name === venueName)?.menu ?? []).map((item) => ({ id: item.id, name: item.name, price: item.price }));
  const words = message.toLowerCase().replace(/[’']/g, '').split(/[^a-z0-9]+/).filter(Boolean);
  const singular = (word: string) => word.replace(/(es|s)$/, '');
  const items = catalogue.flatMap((item) => {
    // The item's own words -- "calamari", "mango", "postcard" -- as a guest would type them,
    // plural or not. Descriptive words shared across a menu ("grilled", "crispy") do not count.
    const keys = item.name.toLowerCase().replace(/[’']/g, '').split(/[^a-z0-9]+/).filter((word) => word.length > 3 && !GENERIC_ORDER_WORDS.has(word));
    const at = words.findIndex((word) => keys.some((key) => word === key || singular(word) === singular(key)));
    if (at < 0) return [];
    // A quantity in the few words before it: "2 grilled calamari", "one ribeye".
    const count = words.slice(Math.max(0, at - 3), at).reverse().map((word) => Number(word) || NUMBER_WORDS[word] || 0).find(Boolean);
    return [{ id: item.id, name: item.name, unitPrice: item.price, quantity: count || 1 }];
  });
  if (!items.length) return null;
  const total = formatPesoAmount(items.reduce((sum, item) => sum + parsePesoAmount(item.unitPrice) * item.quantity, 0));
  return { venue: venueName, items, total };
}

export const MENU_ITEM_IMAGE_URLS: Record<string, string> = {
  'a1b-calamari': 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80',
  'a1b-ribeye': 'https://images.unsplash.com/photo-1546964124-0cce460f38ef?auto=format&fit=crop&w=600&q=80',
  'a1b-1': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80',
  'a1b-2': 'https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=600&q=80',
  'a1b-3': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80',
  'a1b-4': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
  'a1b-5': 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=600&q=80',
  'a1b-6': 'https://images.unsplash.com/photo-1476124369491-eea7f0d3b5c5?auto=format&fit=crop&w=600&q=80',
  'a1b-7': 'https://images.unsplash.com/photo-1535399831218-d5bd36d1a5b0?auto=format&fit=crop&w=600&q=80',
  'a1b-8': 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=600&q=80',
  'a1b-9': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80',
  'a1b-10': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
  'a1b-11': 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=600&q=80',
  'ird-1': 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=600&q=80',
  'ird-2': 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=600&q=80',
  'ird-3': 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80',
  'ird-4': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
  'ird-5': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
  'ird-6': 'https://images.unsplash.com/photo-1515003190562-c5f5f8f1f4f5?auto=format&fit=crop&w=600&q=80',
  'ird-7': 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=600&q=80',
  'ird-8': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
};

export function ActionTile({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return <button className="guest-action-tile" onClick={onClick}><span>{icon}</span><b>{label}</b><CaretRight /></button>;
}

void ActionTile;

export function ServiceDetail({ kind, booking, online, onBook, onChat }: { kind: 'hotel' | 'vendor'; booking: Booking; online: boolean; onBook: () => void; onChat: () => void }) {
  const vendor = kind === 'vendor';
  const roomLabel = booking.roomNumber ? `room ${booking.roomNumber}` : 'your assigned room';
  return <div className="guest-stack guest-service-detail"><ServiceImage imageKey={vendor ? 'spa' : 'dining'} itemId={vendor ? 'spa' : 'dining'} variant="card" tone={vendor ? 'sage' : 'sand'} icon={vendor ? <Sparkle size={38} /> : <ForkKnife size={38} />} decorative /><div className="guest-page-title"><h1>{vendor ? 'Hilom signature massage' : 'In-room dining'}</h1><p>{vendor ? 'A 90-minute traditional Filipino therapeutic massage, delivered in the on-property spa.' : `Comforting Filipino favorites and all-day classics delivered to ${roomLabel}.`}</p></div><div className="guest-summary"><SummaryRow label="Price" value={vendor ? '₱2,400' : 'From ₱450'} /><SummaryRow label="Availability" value={online ? 'Today · 3 times' : 'Connect to check'} /><SummaryRow label="Provider" value={vendor ? 'Run by Hilom Spa & Wellness' : 'Operated by the hotel'} /><SummaryRow label="Location" value={vendor ? 'Spa & wellness · The Henry Manila' : booking.property} /><SummaryRow label="Operating hours" value={vendor ? 'Daily · 9:00 AM–10:00 PM' : 'Daily · 6:30 AM–11:00 PM'} /><SummaryRow label="Room" value={booking.roomNumber ? `Room ${booking.roomNumber}` : 'Assigned at arrival'} /><SummaryRow label="Cancellation" value={vendor ? 'Up to 24 hours before' : 'Up to 2 hours before'} /></div>{!online ? <Notice tone="offline" icon={<WifiSlash />} title="Live booking is unavailable">Capacity and price are never queued. Connect to see current times.</Notice> : null}<button className="guest-button guest-button--primary" onClick={onBook}>{online ? (vendor ? 'Choose a time' : 'View menu and order') : 'See connection options'}<ArrowRight /></button>{!online ? <TextButton onClick={onChat}>Message the front desk instead</TextButton> : null}</div>;
}

export function EstablishmentChatScreen({ kind, venue, booking, online, onChat }: { kind: 'restaurant' | 'gift'; venue?: RestaurantVenue; booking: Booking; online: boolean; onChat: (message: string) => void }) {
  const restaurant = kind === 'restaurant';
  const checkedOut = describeStayStatus(booking).status === 'checked-out';
  const name = venue?.name ?? LOBBY_SHOP_NAME;
  const provider = venue?.operator === 'Hotel operated' ? 'Operated by the hotel' : `Operated by ${venue?.operator ?? 'the hotel'}`;
  const location = venue?.location ?? `${booking.property} · Hotel lobby`;
  const hours = venue?.hours ?? 'Daily · 8:00 AM–10:00 PM';
  const description = venue?.description ?? 'Pasalubong, keepsakes, and thoughtful gifts selected for your stay.';
  const roomFolio = booking.roomNumber ? `Room ${booking.roomNumber}` : 'your room folio';
  const instructions = restaurant
    ? `Open the menu from Explore, then send the item names and quantities here. The front desk will confirm availability and the total, then add the approved order to ${roomFolio} for settlement at checkout.`
    : checkedOut
      ? 'Your stay is complete, so this purchase won’t go on the closed room folio. Ask the front desk what is in stock; they’ll confirm the total, take payment there, and add the purchase to your stay’s total charges.'
      : `Ask the front desk for the current product list, prices, and delivery or pickup options. Once you confirm a purchase, its total is added to ${roomFolio} and settled at checkout.`;
  const message = restaurant
    ? `Hi! I’d like to order from ${name}. Please confirm availability and the total before charging ${roomFolio}.`
    : `Hi! I’d like to see the available products from ${name}.`;

  return <div className="guest-stack guest-establishment-chat-screen">{venue ? <ServiceImage imageKey={getServiceImageKey({ id: venue.id, categoryId: 'dining' })} itemId={venue.id} categoryId="dining" variant="card" tone={venue.tone} icon={<Storefront size={38} />} decorative /> : <div className="guest-establishment-chat-screen__cover"><Image src={GIFT_PRODUCTS[0].image} alt="" fill sizes="(max-width: 720px) calc(100vw - 32px), 688px" /></div>}<div className="guest-page-title"><h1>{name}</h1><p>{description}</p><div className="guest-establishment-chat-screen__details"><span>{provider}</span><span>{location}</span><span>{hours}</span><span>{online ? 'Available · Confirm with the front desk' : 'Availability shown when connected'}</span></div></div><div className="guest-establishment-chat-screen__instructions"><b>{checkedOut && !restaurant ? 'Pay at the front desk' : 'How ordering works'}</b><p>{instructions}</p></div><button className="guest-button guest-button--primary" type="button" onClick={() => onChat(message)}>{restaurant ? 'Ask the front desk' : checkedOut ? 'Ask about products' : 'View products and order'}<ArrowRight /></button><TextButton onClick={() => onChat(message)}>Message the front desk</TextButton></div>;
}

export const RESTAURANT_MENU_IMAGE_PAGES = [
  '/menus/restaurant-menu-page-1.png',
  '/menus/restaurant-menu-page-2.png',
  '/menus/restaurant-menu-page-3.png',
];

export const getRestaurantMenuImages = (venue: RestaurantVenue) => {
  void venue;
  return RESTAURANT_MENU_IMAGE_PAGES;
};

export function RestaurantMenuScreen({ venue, onOrder, onReserve, onBack, onNotifications }: { venue: RestaurantVenue; onOrder: () => void; /** A venue with tables: the page's main action is a reservation, and ordering is a question for the desk. */ onReserve?: () => void; onBack: () => void; onNotifications: () => void }) {
  const [page, setPage] = useState(0);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const suppressPreview = useRef(false);
  const menuImages = getRestaurantMenuImages(venue);
  const currentImage = menuImages[page] ?? menuImages[0];
  // The garden line only fits a room you sit down in; it was being added to room service too.
  // Each venue's own description. A shared "garden atmosphere, morning plates" line fit only Apartment 1B.
  const aboutText = /room/i.test(venue.location)
    ? `${venue.description} Order from the menu and it comes up to your door, day or night.`
    : venue.id === 'apartment-1b'
      ? `${venue.description} Settle in for an unhurried meal surrounded by the hotel’s signature garden atmosphere, with thoughtful service and a menu that moves easily from morning plates to evening drinks.`
      : venue.description;

  const openPreview = () => {
    if (suppressPreview.current) {
      suppressPreview.current = false;
      return;
    }
    setPreviewZoom(1);
    setPreviewOpen(true);
  };

  const handleMenuTouchStart = (event: ReactTouchEvent<HTMLButtonElement>) => {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  };

  const handleMenuTouchEnd = (event: ReactTouchEvent<HTMLButtonElement>) => {
    const start = touchStartX.current;
    const end = event.changedTouches[0]?.clientX;
    touchStartX.current = null;
    if (start === null || end === undefined || menuImages.length < 2) return;
    const delta = end - start;
    if (Math.abs(delta) < 44) return;
    suppressPreview.current = true;
    setPage((current) => delta < 0 ? Math.min(menuImages.length - 1, current + 1) : Math.max(0, current - 1));
  };

  return (
    <div className="guest-stack guest-restaurant-browse guest-restaurant-browse--premium">
      <section className="guest-restaurant-hero" aria-label={`${venue.name} overview`}>
        <ServiceImage imageKey={getServiceImageKey({ id: venue.id, categoryId: 'dining' })} itemId={venue.id} categoryId="dining" variant="card" tone={venue.tone} icon={<ForkKnife size={38} />} decorative />
        <div className="guest-restaurant-hero__scrim" aria-hidden="true" />
        <button className="guest-restaurant-hero__control guest-restaurant-hero__back" type="button" onClick={onBack} aria-label="Back"><ArrowLeft /></button>
        <button className="guest-restaurant-hero__control guest-restaurant-hero__notifications" type="button" onClick={onNotifications} aria-label="Notifications"><Bell /></button>
        <div className="guest-restaurant-hero__copy">
          <h1>{venue.name}</h1>
          <div className="guest-restaurant-top-tags" aria-label="Restaurant details">
            <span>{venue.category}</span>{venue.id === 'apartment-1b' ? <span>Breakfast</span> : null}<span>{venue.operator}</span>
          </div>
        </div>
      </section>

      <section className="guest-restaurant-quick-info" aria-label="Quick information">
        <span className="guest-restaurant-quick-info__location"><MapPin aria-hidden="true" />{venue.location}</span>
        <div><span><small>Hours</small><b>{venue.hours}</b></span><span><small>Availability</small><b>Open now</b></span></div>
      </section>

      <section className="guest-restaurant-about">
        <h2>About</h2>
        <p className={aboutExpanded ? 'is-expanded' : ''}>{aboutText}</p>
        <button className="guest-restaurant-about__read-more" type="button" onClick={() => setAboutExpanded((expanded) => !expanded)}>{aboutExpanded ? 'Show less' : 'Read more'}</button>
      </section>

      <section className="guest-restaurant-menu-image-section guest-restaurant-additional-info">
        <h2>Menu</h2>
        <p>The latest menu and information from {venue.name}. Tap a page to enlarge it.</p>
        <div className="guest-restaurant-menu-carousel"><button type="button" className="guest-restaurant-menu-image" onClick={openPreview} onTouchStart={handleMenuTouchStart} onTouchEnd={handleMenuTouchEnd} aria-label={`Open menu page ${page + 1}; swipe left or right to change page`}><Image src={currentImage} alt={`${venue.name} information page ${page + 1}`} fill sizes="(max-width: 720px) calc(100vw - 32px), 688px" /></button>{menuImages.length > 1 ? <div className="guest-restaurant-menu-pagination"><div className="guest-restaurant-menu-dots" aria-label="Information pages">{menuImages.map((image, index) => <button key={image} type="button" aria-label={`Show information page ${index + 1}`} aria-current={page === index} className={page === index ? 'is-active' : ''} onClick={() => setPage(index)} />)}</div></div> : null}</div>
      </section>

      <section className="guest-restaurant-good-to-know">
        <h2>Good to know</h2>
        <div className="guest-restaurant-good-to-know__grid">
          {venue.operator.includes('Hotel') ? <span><Storefront aria-hidden="true" /><b>Hotel operated</b></span> : null}
          {venue.cutoff.includes('reservation') || venue.cutoff.includes('24-hour') ? <span><CalendarPlus aria-hidden="true" /><b>Reservations recommended</b></span> : null}
          {venue.menu.some((item) => item.dietary?.length) ? <span><Sparkle aria-hidden="true" /><b>Dietary requests available</b></span> : null}
          {venue.description.toLowerCase().includes('garden') ? <span><House aria-hidden="true" /><b>Garden seating</b></span> : null}
        </div>
      </section>

      {onReserve ? (
        <section className="guest-restaurant-good-to-know">
          <h2>Ordering</h2>
          <p>Reserve a table and order when you sit down, or send the front desk your order and they will bring it up.</p>
          <TextButton onClick={onOrder}>Ask the front desk about the menu</TextButton>
        </section>
      ) : null}

      <div className="guest-restaurant-browse__cta"><button className="guest-button guest-button--primary" type="button" onClick={onReserve ?? onOrder}>{onReserve ? 'Reserve a table' : `Order from ${venue.name}`}<ArrowRight /></button></div>

      {previewOpen ? <div className="guest-restaurant-menu-viewer" role="dialog" aria-modal="true" aria-label={`${venue.name} menu preview`} onClick={() => setPreviewOpen(false)}><button type="button" className="guest-restaurant-menu-viewer__close" aria-label="Close menu preview" onClick={() => setPreviewOpen(false)}><X /></button>{menuImages.length > 1 ? <button type="button" className="guest-restaurant-menu-viewer__prev" aria-label="Previous information page" onClick={(event) => { event.stopPropagation(); setPage((current) => (current - 1 + menuImages.length) % menuImages.length); }}><ArrowLeft /></button> : null}<div className="guest-restaurant-menu-viewer__image" onClick={(event) => event.stopPropagation()}><Image src={currentImage} alt={`${venue.name} information preview`} fill sizes="92vw" style={{ transform: `scale(${previewZoom})` }} /></div>{menuImages.length > 1 ? <button type="button" className="guest-restaurant-menu-viewer__next" aria-label="Next information page" onClick={(event) => { event.stopPropagation(); setPage((current) => (current + 1) % menuImages.length); }}><ArrowRight /></button> : null}<div className="guest-restaurant-menu-viewer__zoom"><button type="button" onClick={(event) => { event.stopPropagation(); setPreviewZoom((zoom) => Math.max(1, zoom - 0.25)); }}>−</button><span>{Math.round(previewZoom * 100)}%</span><button type="button" onClick={(event) => { event.stopPropagation(); setPreviewZoom((zoom) => Math.min(2.5, zoom + 0.25)); }}>+</button></div></div> : null}
    </div>
  );
}

/* A count and the newest line, never the total: the peso figure belongs on the folio, not on My Stay. */
export function describeRoomCharges(charges: ReturnType<typeof getRoomCharges>) {
  // Newest by when it happened, not by list order: posted charges and app bookings arrive in separate runs.
  const year = PROTOTYPE_TODAY.slice(0, 4);
  const endOfToday = Date.parse(`${PROTOTYPE_TODAY}T23:59:59`);
  const at = (charge: (typeof charges)[number]) => Date.parse(`${charge.date} ${year} ${charge.detail.match(/\d{1,2}:\d{2}\s*[AP]M/i)?.[0] ?? '11:59 PM'}`) || 0; // no time: the most recent of its day, e.g. an upgrade just approved
  const latest = charges.filter((charge) => at(charge) <= endOfToday).sort((a, b) => at(a) - at(b)).at(-1) ?? charges.at(-1);
  if (!latest) return 'Nothing charged yet';
  return `${charges.length} ${charges.length === 1 ? 'charge' : 'charges'} · Latest: ${latest.title}`;
}

export function RoomChargeDetails({ charge, service, roomLabel, onQuestion }: { charge: ReturnType<typeof getRoomCharges>[number]; service?: ServiceBooking; roomLabel: string; onQuestion: (message: string) => void }) {
  const isDining = Boolean(service?.diningOrder);
  const isTransfer = /airport transfer/i.test(charge.title);
  const rows = isTransfer
    ? [
        ['Pickup location', 'Airport'],
        ['Destination', 'The Henry Manila'],
        ['Pickup date and time', charge.detail],
        ['Vehicle type', 'Hotel sedan'],
        ['Passengers', '2 guests'],
      ]
    : isDining && service?.diningOrder
      ? [
          ...service.diningOrder.items.map((item) => [`${item.name} · ${item.quantity} × ${item.unitPrice}`, formatPesoAmount(parsePesoAmount(item.unitPrice) * item.quantity)]),
          ['Delivery or pickup', service.diningOrder.fulfillment.method === 'delivery' ? `Deliver to ${roomLabel}` : 'Pick up · Hotel lobby'],
          ['Delivery or pickup time', service.diningOrder.fulfillment.timing === 'asap' ? 'As soon as possible' : service.diningOrder.fulfillment.scheduledFor],
        ]
      : [
          ['Selected service', charge.title],
          ['Scheduled date and time', charge.detail],
          ...(service?.title.toLowerCase().includes('massage') ? [['Duration', '90 minutes'], ['Service location', 'Spa & Wellness']] : []),
        ];

  return <div className="guest-folio-details"><h3>Order summary</h3><div className="guest-summary">{rows.map(([label, value]) => <SummaryRow key={label} label={label} value={value} />)}<SummaryRow label="Subtotal" value={charge.amount} /><SummaryRow label="Total" value={charge.amount} strong /><SummaryRow label="Payment method" value={`Charged to ${roomLabel}`} /><SummaryRow label="Status" value="Charged to room" /><SummaryRow label="Reference" value={`CHG-${charge.id.replace(/[^a-z0-9]/gi, '').slice(-8).toUpperCase()}`} /></div><button type="button" className="guest-folio-details__question" onClick={(event) => { event.stopPropagation(); onQuestion(`I have a question about the ${charge.title} charge. Could you help me review it?`); }}>Question about this charge? <ArrowRight /></button></div>;
}
