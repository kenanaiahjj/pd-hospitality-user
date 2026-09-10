/**
 * Cabana artwork, sliced from the supplied illustration sheets.
 *
 * Each set shares one canvas: the source strip is cropped on a common vertical
 * range and then padded to a common width, so every drawing's ground line
 * lands on the same baseline and every subject stays centred. That is what
 * lets a layout size them with a single width and skip per-image nudging.
 *
 * Raster, so unlike the logo these do not follow `currentColor` -- the plum and
 * pink are baked into the files and will not track a token change.
 */

export type GuestIllustration = {
  src: string;
  width: number;
  height: number;
};

/** The welcome pager: one per benefit. */
export const WELCOME_ILLUSTRATIONS = {
  arrival: { src: '/illustrations/arrival.png', width: 637, height: 545 },
  frontDesk: { src: '/illustrations/front-desk.png', width: 637, height: 545 },
  stay: { src: '/illustrations/stay.png', width: 637, height: 545 },
} satisfies Record<string, GuestIllustration>;

/** The booking-access options: one per way a guest can arrive. */
export const ENTRY_ILLUSTRATIONS = {
  bookingEmail: { src: '/illustrations/booking-email.png', width: 662, height: 452 },
  roomQr: { src: '/illustrations/room-qr.png', width: 662, height: 452 },
  hotelWifi: { src: '/illustrations/hotel-wifi.png', width: 662, height: 452 },
} satisfies Record<string, GuestIllustration>;

/** The experience categories: illustrated squircle badges. */
export const CATEGORY_ILLUSTRATIONS = {
  dining: { src: '/illustrations/category-dining.png', width: 196, height: 196 },
  spa: { src: '/illustrations/category-spa.png', width: 196, height: 196 },
  entertainment: { src: '/illustrations/category-tours.png', width: 196, height: 196 },
  services: { src: '/illustrations/category-services.png', width: 196, height: 196 },
} satisfies Record<string, GuestIllustration>;

