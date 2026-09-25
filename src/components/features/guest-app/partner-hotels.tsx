import Image from 'next/image';
import { ArrowRight, ArrowSquareOut, CheckCircle, EnvelopeSimple, MapPin, Phone } from '@phosphor-icons/react';
import { getPropertyImage } from './service-images';

export type PartnerHotelLink = {
  name: string;
  detail: string;
  href: string;
};

export type PartnerHotel = {
  id: string;
  name: string;
  location: string;
  address: string;
  phone?: string;
  email?: string;
  summary: string;
  about: string;
  highlights: string[];
  bookingLinks: PartnerHotelLink[];
};

/**
 * Hotel profiles for the post-stay directory. Prices and availability stay on
 * the hotel and booking-partner sites, so the app never presents stale rates.
 */
export const PARTNER_HOTELS: PartnerHotel[] = [
  {
    id: 'manila',
    name: 'The Henry Hotel Manila',
    location: 'Pasay · Metro Manila',
    address: '2680 F.B. Harrison St., Pasay City, Philippines',
    phone: '+63 2 8807 8888',
    email: 'reservations.manila@thehenryhotel.com',
    summary: 'A modern vintage hideaway in a heritage home, surrounded by garden courtyards.',
    about: 'The Henry Hotel Manila pairs mid-century character with a quiet garden setting in Pasay. Guests can spend time by the pool, dine at Apartment 1B, or use the hotel as a base for exploring Manila.',
    highlights: ['Heritage home', 'Garden courtyards', 'Pool and restaurant'],
    bookingLinks: [
      { name: 'Agoda', detail: 'Check dates and availability', href: 'https://www.agoda.com/the-henry-hotel-manila/hotel/manila-ph.html' },
      { name: 'Booking.com', detail: 'See rooms and guest reviews', href: 'https://www.booking.com/hotel/ph/the-henry-manila.html' },
      { name: 'Hotel website', detail: 'Visit The Henry Hotel Manila', href: 'https://manila.thehenryhotel.com/' },
    ],
  },
  {
    id: 'cebu',
    name: 'The Henry Hotel Cebu',
    location: 'Banilad · Cebu City',
    address: 'Paseo Saturnino, Banilad, Cebu City, Philippines',
    summary: 'A boutique hotel in Banilad, Cebu City, with distinctive design and on-site dining.',
    about: 'The Henry Hotel Cebu is in the Banilad area, near Paseo Saturnino. See the hotel’s booking partners for current room options, rates, and availability.',
    highlights: ['Banilad location', 'Garden spaces', 'Airport transfer available'],
    bookingLinks: [
      { name: 'Agoda', detail: 'Check dates and availability', href: 'https://www.agoda.com/the-henry-hotel-cebu/hotel/cebu-ph.html' },
      { name: 'Booking.com', detail: 'Search for this hotel', href: 'https://www.booking.com/searchresults.html?ss=The%20Henry%20Hotel%20Cebu' },
      { name: 'Hotel website', detail: 'Explore The Henry Hotels & Resorts', href: 'https://www.thehenryhotel.com/location' },
    ],
  },
  {
    id: 'dumaguete',
    name: 'The Henry Resort Dumaguete',
    location: 'Dumaguete · Negros Oriental',
    address: 'Flores Avenue, Bantayan, Dumaguete City, Philippines',
    phone: '+63 35 531 5707',
    email: 'reservations.dumaguete@thehenryhotel.com',
    summary: 'A peaceful garden retreat for families and creative travelers in Dumaguete.',
    about: 'The Henry Resort Dumaguete combines landscaped grounds with a coastal setting and several on-site dining choices. Check the hotel or a booking partner for current room options and availability.',
    highlights: ['Garden resort', 'Outdoor pool', 'On-site restaurants'],
    bookingLinks: [
      { name: 'Agoda', detail: 'Check dates and availability', href: 'https://www.agoda.com/the-henry-resort-dumaguete/hotel/dumaguete-ph.html' },
      { name: 'Booking.com', detail: 'See rooms and guest reviews', href: 'https://www.booking.com/hotel/ph/the-henry-resort-dumaguete.html' },
      { name: 'Hotel website', detail: 'Visit The Henry Resort Dumaguete', href: 'https://dumaguete.thehenryhotel.com/' },
    ],
  },
];

export function findPartnerHotel(id: string): PartnerHotel | undefined {
  return PARTNER_HOTELS.find((hotel) => hotel.id === id);
}

export function PartnerHotelDirectory({ onOpenHotel }: { onOpenHotel: (id: string) => void }) {
  return (
    <div className="guest-stack guest-partner-directory">
      <div className="guest-page-title guest-partner-directory__title">
        <p className="guest-eyebrow">The Henry Hotels &amp; Resorts</p>
        <h1>Partner hotels</h1>
        <p>Explore a hotel, then choose where to book. Rates and availability are shown on the hotel or booking partner&rsquo;s site.</p>
      </div>

      <div className="guest-partner-directory__list">
        {PARTNER_HOTELS.map((hotel) => {
          const image = getPropertyImage(hotel.id);
          return (
            <button
              key={hotel.id}
              className="guest-estate-card guest-partner-card"
              type="button"
              onClick={() => onOpenHotel(hotel.id)}
            >
              <Image className="guest-estate-card__image" src={image.src} alt="" fill sizes="(max-width: 720px) calc(100vw - 32px), 480px" style={{ objectPosition: image.focalPoint }} />
              <span className="guest-estate-card__scrim" aria-hidden="true" />
              <span className="guest-estate-card__body">
                <small className="guest-estate-card__where">{hotel.location}</small>
                <b className="guest-estate-card__name">{hotel.name}</b>
                <span className="guest-estate-card__tagline">{hotel.summary}</span>
                <span className="guest-estate-card__foot">
                  <span className="guest-estate-card__rate">
                    <b>Hotel details</b>
                    <small>Photos, information, and booking sites</small>
                  </span>
                  <span className="guest-estate-card__go" aria-hidden="true"><ArrowRight /></span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PartnerHotelDetail({ hotel }: { hotel: PartnerHotel }) {
  const image = getPropertyImage(hotel.id);
  const aboutId = `partner-hotel-${hotel.id}-about`;
  const contactId = `partner-hotel-${hotel.id}-contact`;
  const bookingId = `partner-hotel-${hotel.id}-booking`;

  return (
    <div className="guest-stack guest-partner-detail">
      <div className="guest-partner-detail__hero">
        <Image src={image.src} alt="" fill sizes="(max-width: 720px) calc(100vw - 32px), 560px" style={{ objectPosition: image.focalPoint }} preload />
      </div>

      <div className="guest-page-title guest-partner-detail__title">
        <p className="guest-eyebrow">{hotel.location}</p>
        <h1>{hotel.name}</h1>
        <p>{hotel.summary}</p>
      </div>

      <section className="guest-partner-detail__section" aria-labelledby={aboutId}>
        <h2 id={aboutId}>About the hotel</h2>
        <p>{hotel.about}</p>
        <ul className="guest-partner-detail__highlights">
          {hotel.highlights.map((highlight) => (
            <li key={highlight}><CheckCircle weight="fill" aria-hidden="true" />{highlight}</li>
          ))}
        </ul>
      </section>

      <section className="guest-partner-detail__section" aria-labelledby={contactId}>
        <h2 id={contactId}>Location and contact</h2>
        <p className="guest-partner-detail__contact-row"><MapPin aria-hidden="true" />{hotel.address}</p>
        {hotel.phone ? (
          <a className="guest-partner-detail__contact-row" href={`tel:${hotel.phone.replace(/[^+\d]/g, '')}`}>
            <Phone aria-hidden="true" />{hotel.phone}
          </a>
        ) : null}
        {hotel.email ? (
          <a className="guest-partner-detail__contact-row" href={`mailto:${hotel.email}`}>
            <EnvelopeSimple aria-hidden="true" />{hotel.email}
          </a>
        ) : null}
      </section>

      <section className="guest-partner-detail__section" aria-labelledby={bookingId}>
        <div className="guest-partner-detail__booking-title">
          <h2 id={bookingId}>Choose where to book</h2>
          <p>Check current dates, room options, and rates with the hotel or a booking partner.</p>
        </div>
        <div className="guest-partner-detail__booking-links">
          {hotel.bookingLinks.map((link) => (
            <a
              className="guest-partner-detail__booking-link"
              key={link.name}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${link.name} for ${hotel.name} (opens in a new tab)`}
            >
              <span>
                <b>{link.name}</b>
                <small>{link.detail}</small>
              </span>
              <ArrowSquareOut aria-hidden="true" />
            </a>
          ))}
        </div>
        <p className="guest-partner-detail__note">Reservations and payment happen on the site you choose. Cabana does not take hotel bookings.</p>
      </section>
    </div>
  );
}
