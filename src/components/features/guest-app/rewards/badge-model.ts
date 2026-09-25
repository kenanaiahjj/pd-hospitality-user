import {
  ESTATE_PROPERTIES,
  countNightsBetween,
  getRewards,
} from '../prototype-model';
import type { GuestSession } from '../prototype-model';

/*
  Traveller badges.

  Pure, like `points-model.ts` and for the same reason. Nothing a guest holds
  is stored: every badge is recomputed from the stays and bookings that earned
  it, so a badge cannot outlive the evidence behind it.

  Points and badges are separate axes and neither drives the other. Points say
  how much someone spent; a badge says what kind of traveller they are. Paying
  points for badges would turn them into a farm and distort what gets booked.

  A badge is not a trophy. It is an inference the guest can see, see the
  reasons for, and switch off -- which is why `evidence` returns the lines that
  earned it rather than a bare count.

  Badge identity -- name, family, threshold, glyph -- comes from
  `docs/badge-art-prompts.md`, which is the single source. This file encodes
  those rules; it does not restate them.
*/

export type BadgeFamily = 'taste' | 'company' | 'rhythm' | 'place' | 'house' | 'venue';

type IslandGroup = 'luzon' | 'visayas' | 'mindanao';

export type BadgeDefinition = {
  id: string;
  name: string;
  family: BadgeFamily;
  /** How many qualifying events earn it. */
  threshold: number;
  /** One line, as it reads on an in-progress row. */
  requirement: string;
  /** Phosphor icon name, for the medal that draws before artwork exists. */
  glyph: string;
  /**
   * Catalogue ids that count, where the badge is about what was booked.
   *
   * Handwritten per badge, for the same reason `story-model.ts` handwrites
   * STORY_FRAMES: which booking makes someone a Foodie is a judgement about
   * what it meant, not something a category rule picks well.
   */
  qualifyingIds?: string[];
  /** Artwork, once generated. Absent until then -- the medal falls back. */
  art?: string;
  /** The lines that count toward it, for the evidence list on the sheet. */
  evidence: (history: GuestHistory) => string[];
};

export type BadgeProgress = {
  definition: BadgeDefinition;
  count: number;
  earned: boolean;
  evidence: string[];
  /** A catalogue id that would advance it. Never something already booked. */
  nextStep?: string;
  /** ISO date it was earned, for the engraving and the detail page. Earned only. */
  earnedOn?: string;
};

export const BADGE_FAMILIES: Record<BadgeFamily, { label: string; shape: string; enamel: string }> = {
  taste: { label: 'How you eat and unwind', shape: 'circle', enamel: '#C8673F' },
  company: { label: 'Who you travel with', shape: 'shield', enamel: '#E8B44F' },
  rhythm: { label: 'How you book', shape: 'hexagon', enamel: '#2FA8A0' },
  place: { label: 'Where you have been', shape: 'pentagon', enamel: '#3D7BD6' },
  house: { label: 'Good guest', shape: 'square', enamel: '#6FAE7C' },
  venue: { label: 'Your regulars', shape: 'capsule', enamel: '#6E2A4C' },
};

/* --------------------------------------------------------------------------
   One normalised view of a guest's history

   Built once per derivation. Every badge reads this rather than the session,
   so a rule is a sentence about what the guest did instead of a walk over four
   collections.
   -------------------------------------------------------------------------- */

type BookedThing = {
  serviceId?: string;
  title: string;
  /** The venue or property it belonged to. */
  parent: string;
  hour?: number;
  /** ISO date it happened. */
  date: string;
  /** ISO date it was booked, where known. */
  bookedAt?: string;
  /** Distinct menu items, for the venue badges. */
  itemIds?: string[];
};

type StayRecord = {
  id: string;
  property: string;
  city: string;
  nights: number;
  guestCount: number;
  source: string;
  checkIn: string;
  islandGroup?: IslandGroup;
  propertyOpenedOn?: string;
  scanned: boolean;
  preRegistered: boolean;
  roomReported: boolean;
};

export type GuestHistory = {
  booked: BookedThing[];
  stays: StayRecord[];
  reviews: number;
};

const dayIndex = (iso: string): number => {
  const [year, month, day] = iso.split('-').map(Number) as [number, number, number];
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
};

const daysBetween = (from: string, to: string): number => dayIndex(to) - dayIndex(from);

const propertyByCity = new Map(ESTATE_PROPERTIES.map((property) => [property.city, property]));

export function buildHistory(session: GuestSession): GuestHistory {
  const booked: BookedThing[] = [];

  for (const stay of session.pastStays) {
    for (const charge of stay.charges) {
      booked.push({
        serviceId: charge.serviceId,
        title: charge.title,
        parent: charge.parent,
        hour: charge.hour,
        date: stay.checkIn,
      });
    }
  }

  /*
    A settled stay already counted its services as charges -- `toFinishedStay`
    copies them across and leaves them on the session. Counting both would make
    one massage two spa visits.
  */
  const settled = new Set(session.pastStays.map((stay) => stay.id));

  for (const service of session.serviceBookings) {
    // Nothing the guest called off says anything about who they are.
    if (service.status === 'cancelled') continue;
    if (settled.has(service.bookingId)) continue;

    booked.push({
      serviceId: service.serviceId,
      title: service.title,
      parent: service.diningOrder?.venueName ?? service.title,
      hour: service.scheduledHour,
      date: service.scheduledDate,
      bookedAt: service.bookedAt,
      itemIds: service.diningOrder?.items.map((item) => item.id),
    });
  }

  const stays: StayRecord[] = [];
  const seen = new Set<string>();

  for (const stay of session.pastStays) {
    seen.add(stay.id);
    const property = propertyByCity.get(stay.city);
    stays.push({
      id: stay.id,
      property: stay.property,
      city: stay.city,
      nights: stay.nights,
      guestCount: stay.guestCount,
      source: stay.source,
      checkIn: stay.checkIn,
      islandGroup: property?.islandGroup,
      propertyOpenedOn: property?.openedOn,
      /* A settled stay does not record whether its code was ever scanned. */
      scanned: false,
      preRegistered: false,
      roomReported: false,
    });
  }

  for (const booking of session.bookings) {
    if (seen.has(booking.id)) continue;
    const property = propertyByCity.get(booking.city);
    stays.push({
      id: booking.id,
      property: booking.property,
      city: booking.city,
      nights: countNightsBetween(booking.checkIn, booking.checkOut),
      guestCount: booking.guestCount,
      source: booking.source,
      checkIn: booking.checkIn,
      islandGroup: property?.islandGroup,
      propertyOpenedOn: property?.openedOn,
      scanned: Boolean(booking.roomVerification),
      preRegistered: booking.preArrivalTotal > 0
        && booking.preArrivalCompleted >= booking.preArrivalTotal,
      roomReported: Boolean(booking.roomReadyAt),
    });
  }

  /*
    Oldest first, so every badge's evidence reads in the order it happened and
    the line at its threshold is the one that earned it. The sort is stable,
    so a stay's charges keep their own order within its day.
  */
  booked.sort((a, b) => a.date.localeCompare(b.date));
  stays.sort((a, b) => a.checkIn.localeCompare(b.checkIn));

  return { booked, stays, reviews: session.reviews.length };
}

/* --------------------------------------------------------------------------
   Evidence helpers
   -------------------------------------------------------------------------- */

const label = (thing: BookedThing): string =>
  thing.parent && thing.parent !== thing.title ? `${thing.title} · ${thing.parent}` : thing.title;

/** Everything booked from a named set of catalogue ids. */
const ofServices = (ids: string[]) => (history: GuestHistory): string[] =>
  history.booked.filter((thing) => thing.serviceId && ids.includes(thing.serviceId)).map(label);

const atHour = (matches: (hour: number) => boolean) => (history: GuestHistory): string[] =>
  history.booked.filter((thing) => thing.hour !== undefined && matches(thing.hour)).map(label);

const staysWhere = (matches: (stay: StayRecord) => boolean) => (history: GuestHistory): string[] =>
  history.stays.filter(matches).map((stay) => `${stay.property} · ${stay.checkIn}`);

/** How many distinct values a stay field takes, as evidence lines. */
const distinctStays = (pick: (stay: StayRecord) => string | undefined) =>
  (history: GuestHistory): string[] => {
    const values = new Set<string>();
    for (const stay of history.stays) {
      const value = pick(stay);
      if (value) values.add(value);
    }
    return [...values];
  };

/** The largest group when stays are bucketed by one field. */
const mostRepeated = (pick: (stay: StayRecord) => string) => (history: GuestHistory): string[] => {
  const groups = new Map<string, string[]>();
  for (const stay of history.stays) {
    const key = pick(stay);
    groups.set(key, [...(groups.get(key) ?? []), `${stay.property} · ${stay.checkIn}`]);
  }
  return [...groups.values()].sort((a, b) => b.length - a.length)[0] ?? [];
};

const none = (): string[] => [];

/* --------------------------------------------------------------------------
   The 42
   -------------------------------------------------------------------------- */

/**
 * Badge ids whose artwork has been uploaded to `public/badges/<id>.png`.
 *
 * Add ids here as art lands, in batches or all at once -- the filename is
 * always the badge id, so this is the only edit. Anything not listed draws
 * itself from its family's shape and enamel instead, which is why the set can
 * sit empty without a hole appearing anywhere.
 */
export const ARTWORK_READY: readonly string[] = [
  /* Taste */
  'foodie', 'caffeine', 'sundowner', 'night-owl', 'early-riser', 'room-service',
  'homegrown', 'wellness', 'well-groomed', 'in-training', 'culture', 'outdoors',
  'sea-legs', 'maker',
  /* Company */
  'solo', 'pair', 'family', 'group', 'business', 'host',
  /* Rhythm */
  'weekender', 'long-stay', 'direct-booker', 'switched', 'planner', 'spontaneous',
  'regular', 'pre-checked',
  /* Place */
  'island-hopper', 'estate-explorer', 'archipelago', 'luzon-to-mindanao',
  'full-estate', 'new-opening', 'homecoming',
  /* House */
  'scanned-in', 'good-notes', 'self-sufficient', 'first-look',
  /* Venue */
  'venue-regular', 'venue-opener', 'menu-explorer',
];

const DEFINITIONS: BadgeDefinition[] = [
  /* Taste — what the feed and story rail should lead with. */
  { id: 'foodie', name: 'Foodie', family: 'taste', threshold: 3, glyph: 'ForkKnife',
    requirement: 'Three meals booked',
    qualifyingIds: ['dining', 'restaurant', 'poolside-bar', 'cafe', 'rooftop'],
    evidence: ofServices(['dining', 'restaurant', 'poolside-bar', 'cafe', 'rooftop']) },
  { id: 'caffeine', name: 'Caffeine', family: 'taste', threshold: 3, glyph: 'Coffee',
    requirement: 'Three visits to the café', qualifyingIds: ['cafe'],
    evidence: ofServices(['cafe']) },
  { id: 'sundowner', name: 'Sundowner', family: 'taste', threshold: 3, glyph: 'Martini',
    requirement: 'Three evenings at a bar or rooftop',
    qualifyingIds: ['poolside-bar', 'rooftop', 'sunset-cruise', 'music'],
    evidence: ofServices(['poolside-bar', 'rooftop', 'sunset-cruise', 'music']) },
  { id: 'night-owl', name: 'Night owl', family: 'taste', threshold: 3, glyph: 'MoonStars',
    requirement: 'Three bookings after 7 PM', evidence: atHour((hour) => hour >= 19) },
  { id: 'early-riser', name: 'Early riser', family: 'taste', threshold: 3, glyph: 'SunHorizon',
    requirement: 'Three bookings before 9 AM', evidence: atHour((hour) => hour < 9) },
  { id: 'room-service', name: 'Room service', family: 'taste', threshold: 3, glyph: 'Tray',
    requirement: 'Three in-room dining orders', qualifyingIds: ['dining'],
    evidence: ofServices(['dining']) },
  { id: 'homegrown', name: 'Homegrown', family: 'taste', threshold: 3, glyph: 'CookingPot',
    requirement: 'Three Filipino experiences',
    qualifyingIds: ['food-crawl', 'cooking-class', 'heritage-walk'],
    evidence: ofServices(['food-crawl', 'cooking-class', 'heritage-walk']) },
  { id: 'wellness', name: 'Wellness', family: 'taste', threshold: 3, glyph: 'Flower',
    requirement: 'Three spa treatments',
    qualifyingIds: ['spa', 'scrub', 'hot-stone', 'couples-massage', 'reflexology'],
    evidence: ofServices(['spa', 'scrub', 'hot-stone', 'couples-massage', 'reflexology']) },
  { id: 'well-groomed', name: 'Well groomed', family: 'taste', threshold: 2, glyph: 'Scissors',
    requirement: 'Two grooming appointments',
    qualifyingIds: ['facial', 'mani-pedi', 'barber'],
    evidence: ofServices(['facial', 'mani-pedi', 'barber']) },
  /*
    Thinner than designed. The gym, pool, sauna, kids club and business centre
    are in the catalogue on `experiment/qr-and-explore` but were never promoted
    to main, so this, `sea-legs`, `family` and `business` each lost the service
    that best evidenced them. They widen again the day those land.
  */
  { id: 'in-training', name: 'In training', family: 'taste', threshold: 3, glyph: 'Barbell',
    requirement: 'Three sessions in the gym', qualifyingIds: ['trainer'],
    evidence: ofServices(['trainer']) },
  { id: 'culture', name: 'Culture', family: 'taste', threshold: 2, glyph: 'Bank',
    requirement: 'Two museums or heritage walks',
    qualifyingIds: ['heritage-walk', 'museum-pass'],
    evidence: ofServices(['heritage-walk', 'museum-pass']) },
  { id: 'outdoors', name: 'Outdoors', family: 'taste', threshold: 3, glyph: 'Mountains',
    requirement: 'Three tours or activities',
    qualifyingIds: ['tour', 'diving', 'sunset-cruise'],
    evidence: ofServices(['tour', 'diving', 'sunset-cruise']) },
  { id: 'sea-legs', name: 'Sea legs', family: 'taste', threshold: 3, glyph: 'Waves',
    requirement: 'Three days on or in the water',
    qualifyingIds: ['sunset-cruise', 'diving'],
    evidence: ofServices(['sunset-cruise', 'diving']) },
  { id: 'maker', name: 'Maker', family: 'taste', threshold: 2, glyph: 'Hammer',
    requirement: 'Two workshops or classes', qualifyingIds: ['cooking-class'],
    evidence: ofServices(['cooking-class']) },

  /* Company — what the property should offer at all. */
  { id: 'solo', name: 'Solo', family: 'company', threshold: 2, glyph: 'User',
    requirement: 'Two stays travelling alone',
    evidence: staysWhere((stay) => stay.guestCount === 1) },
  { id: 'pair', name: 'Pair', family: 'company', threshold: 2, glyph: 'Users',
    requirement: 'Two stays for two',
    evidence: staysWhere((stay) => stay.guestCount === 2) },
  { id: 'family', name: 'Family', family: 'company', threshold: 1, glyph: 'Baby',
    requirement: 'A stay with the family',
    qualifyingIds: ['babysitting'],
    evidence: (history) => [
      ...staysWhere((stay) => stay.guestCount >= 3)(history),
      ...ofServices(['babysitting'])(history),
    ] },
  { id: 'group', name: 'Group', family: 'company', threshold: 1, glyph: 'UsersThree',
    requirement: 'A stay for four or more',
    evidence: staysWhere((stay) => stay.guestCount >= 4) },
  { id: 'business', name: 'Business', family: 'company', threshold: 1, glyph: 'Briefcase',
    requirement: 'A meeting room or the business centre',
    qualifyingIds: ['meeting-room'],
    evidence: ofServices(['meeting-room']) },
  { id: 'host', name: 'Host', family: 'company', threshold: 1, glyph: 'Confetti',
    requirement: 'A celebration arranged', qualifyingIds: ['celebration'],
    evidence: ofServices(['celebration']) },

  /* Rhythm — when to prompt, and how far ahead. */
  { id: 'weekender', name: 'Weekender', family: 'rhythm', threshold: 2, glyph: 'CalendarCheck',
    requirement: 'Two two-night stays', evidence: staysWhere((stay) => stay.nights === 2) },
  { id: 'long-stay', name: 'Long stay', family: 'rhythm', threshold: 1, glyph: 'HourglassHigh',
    requirement: 'A stay of five nights or more',
    evidence: staysWhere((stay) => stay.nights >= 5) },
  { id: 'direct-booker', name: 'Direct booker', family: 'rhythm', threshold: 2, glyph: 'Handshake',
    requirement: 'Two stays booked direct',
    evidence: staysWhere((stay) => stay.source === 'Direct booking') },
  /*
    Fires once, on the stay where a guest stops being an OTA's and starts being
    the property's. It cannot be gamed and it cannot be repeated, which is why
    it is the single most valuable row in the set.
  */
  { id: 'switched', name: 'Switched', family: 'rhythm', threshold: 1, glyph: 'Repeat',
    requirement: 'Book direct after booking through an agent',
    evidence: (history) => {
      const ordered = [...history.stays].sort((a, b) => a.checkIn.localeCompare(b.checkIn));
      const firstOta = ordered.find((stay) => stay.source !== 'Direct booking');
      if (!firstOta) return [];
      const after = ordered.find(
        (stay) => stay.source === 'Direct booking' && stay.checkIn > firstOta.checkIn,
      );
      return after ? [`${after.property} · ${after.checkIn}`] : [];
    } },
  { id: 'planner', name: 'Planner', family: 'rhythm', threshold: 3, glyph: 'CalendarPlus',
    requirement: 'Three bookings a week ahead',
    evidence: (history) => history.booked
      .filter((thing) => thing.bookedAt && daysBetween(thing.bookedAt, thing.date) >= 7)
      .map(label) },
  { id: 'spontaneous', name: 'Spontaneous', family: 'rhythm', threshold: 3, glyph: 'Lightning',
    requirement: 'Three same-day bookings',
    evidence: (history) => history.booked
      .filter((thing) => thing.bookedAt && thing.bookedAt === thing.date)
      .map(label) },
  { id: 'regular', name: 'Regular', family: 'rhythm', threshold: 3, glyph: 'House',
    requirement: 'Three stays at one property',
    evidence: mostRepeated((stay) => stay.property) },
  { id: 'pre-checked', name: 'Pre-checked', family: 'rhythm', threshold: 2, glyph: 'SealCheck',
    requirement: 'Check in before arriving, twice',
    evidence: staysWhere((stay) => stay.preRegistered) },

  /* Place — the pull across the estate. */
  { id: 'island-hopper', name: 'Island hopper', family: 'place', threshold: 2, glyph: 'Island',
    requirement: 'Stay in two cities', evidence: distinctStays((stay) => stay.city) },
  { id: 'estate-explorer', name: 'Estate explorer', family: 'place', threshold: 4, glyph: 'MapTrifold',
    requirement: 'Four of the thirteen properties',
    evidence: distinctStays((stay) => stay.property) },
  { id: 'archipelago', name: 'Archipelago', family: 'place', threshold: 5, glyph: 'Globe',
    requirement: 'Stay in five cities', evidence: distinctStays((stay) => stay.city) },
  /*
    Sits at two of three until a Mindanao property opens: the estate is Manila
    in Luzon, Cebu and Dumaguete in the Visayas. A stretch goal, not a defect.
  */
  { id: 'luzon-to-mindanao', name: 'Luzon to Mindanao', family: 'place', threshold: 3,
    glyph: 'NavigationArrow', requirement: 'A stay in all three island groups',
    evidence: distinctStays((stay) => stay.islandGroup) },
  { id: 'full-estate', name: 'Full estate', family: 'place', threshold: 13, glyph: 'Compass',
    requirement: 'Every property in the estate',
    evidence: distinctStays((stay) => stay.property) },
  { id: 'new-opening', name: 'New opening', family: 'place', threshold: 1, glyph: 'Sparkle',
    requirement: 'A property in its first ninety days',
    evidence: staysWhere((stay) => Boolean(stay.propertyOpenedOn)
      && daysBetween(stay.propertyOpenedOn as string, stay.checkIn) >= 0
      && daysBetween(stay.propertyOpenedOn as string, stay.checkIn) <= 90) },
  { id: 'homecoming', name: 'Homecoming', family: 'place', threshold: 1, glyph: 'Door',
    requirement: 'Return to a property after a year away',
    evidence: (history) => {
      const byProperty = new Map<string, string[]>();
      for (const stay of history.stays) {
        byProperty.set(stay.property, [...(byProperty.get(stay.property) ?? []), stay.checkIn]);
      }
      const returns: string[] = [];
      for (const [property, dates] of byProperty) {
        const sorted = [...dates].sort();
        for (let i = 1; i < sorted.length; i += 1) {
          if (daysBetween(sorted[i - 1]!, sorted[i]!) >= 365) returns.push(`${property} · ${sorted[i]}`);
        }
      }
      return returns;
    } },

  /* House — what costs the property nothing and saves it real time. */
  { id: 'scanned-in', name: 'Scanned in', family: 'house', threshold: 3, glyph: 'QrCode',
    requirement: 'Scan the room code on three stays',
    evidence: staysWhere((stay) => stay.scanned) },
  { id: 'good-notes', name: 'Good notes', family: 'house', threshold: 3, glyph: 'ChatText',
    requirement: 'Three stay surveys',
    evidence: (history) => Array.from({ length: history.reviews }, (_, i) => `Survey ${i + 1}`) },
  { id: 'self-sufficient', name: 'Self sufficient', family: 'house', threshold: 5,
    glyph: 'DeviceMobile', requirement: 'Five things booked in the app',
    evidence: (history) => history.booked.map(label) },
  /*
    The app cannot yet tell who reported a room ready, only that it was. Close
    enough to be worth having and honest about what it means.
  */
  { id: 'first-look', name: 'First look', family: 'house', threshold: 1, glyph: 'Eye',
    requirement: 'Tell us your room is ready',
    evidence: staysWhere((stay) => stay.roomReported) },

  /*
    Venue badges ship as one aggregate each in v1 -- "three visits to any one
    venue" rather than a separate badge per venue. Generating them per venue
    multiplies the set by the catalogue and is a later refinement; the rule is
    already the one a per-venue badge would use.
  */
  { id: 'venue-regular', name: 'Regular', family: 'venue', threshold: 3, glyph: 'Storefront',
    requirement: 'Three visits to one venue',
    evidence: (history) => {
      const groups = new Map<string, string[]>();
      for (const thing of history.booked) {
        groups.set(thing.parent, [...(groups.get(thing.parent) ?? []), label(thing)]);
      }
      return [...groups.values()].sort((a, b) => b.length - a.length)[0] ?? [];
    } },
  { id: 'venue-opener', name: 'Opener', family: 'venue', threshold: 1, glyph: 'Star',
    requirement: 'Book a venue in its first month', evidence: none },
  { id: 'menu-explorer', name: 'Menu explorer', family: 'venue', threshold: 5, glyph: 'BookOpen',
    requirement: 'Five dishes at one venue',
    evidence: (history) => {
      const groups = new Map<string, Set<string>>();
      for (const thing of history.booked) {
        if (!thing.itemIds?.length) continue;
        const set = groups.get(thing.parent) ?? new Set<string>();
        thing.itemIds.forEach((id) => set.add(id));
        groups.set(thing.parent, set);
      }
      return [...groups.values()].map((set) => [...set]).sort((a, b) => b.length - a.length)[0] ?? [];
    } },
];

/** The set as the app sees it, with artwork attached where it exists. */
export const BADGES: BadgeDefinition[] = DEFINITIONS.map((badge) => (
  ARTWORK_READY.includes(badge.id) ? { ...badge, art: `/badges/${badge.id}.png` } : badge
));

export const findBadge = (id: string): BadgeDefinition | undefined =>
  BADGES.find((badge) => badge.id === id);

/* --------------------------------------------------------------------------
   Derivation
   -------------------------------------------------------------------------- */

/**
 * Every badge, with what has been done toward it.
 *
 * Muted badges are absent entirely rather than reported as zero: the guest
 * said the inference was wrong, and a row that keeps counting is an argument.
 */
export function badgeProgress(session: GuestSession): BadgeProgress[] {
  const history = buildHistory(session);
  /* Nothing is earned on a day that has not happened: an upcoming booking
     counts toward a badge but cannot date it. */
  const today = new Date().toISOString().slice(0, 10);
  const latest = [
    ...history.booked.map((thing) => thing.date),
    ...history.stays.map((stay) => stay.checkIn),
  ].filter((date) => date && date <= today).sort().at(-1) ?? today;
  const muted = new Set(getRewards(session).mutedBadges);
  const booked = new Set(history.booked.map((thing) => thing.serviceId).filter(Boolean));

  return BADGES.filter((badge) => !muted.has(badge.id)).map((badge) => {
    const evidence = badge.evidence(history);
    const earned = evidence.length >= badge.threshold;

    return {
      definition: badge,
      count: evidence.length,
      earned,
      evidence,
      // Never suggest what they have already done.
      nextStep: badge.qualifyingIds?.find((id) => !booked.has(id)),
      earnedOn: earned ? earnedOn(evidence, badge.threshold, latest) : undefined,
    };
  });
}

const ISO_DATE = /\d{4}-\d{2}-\d{2}/;

/**
 * The day the threshold was crossed, where the evidence says; otherwise the
 * guest's latest dated activity.
 *
 * Stay evidence carries its check-in date, so a stay badge is exact. A booked
 * line carries only its title -- close enough for an engraving, and the
 * fallback is never earlier than the truth.
 */
function earnedOn(evidence: string[], threshold: number, latest: string): string {
  const dated = evidence
    .map((line) => line.match(ISO_DATE)?.[0])
    .filter((date): date is string => Boolean(date))
    .sort();
  const crossed = dated.length >= threshold ? dated[threshold - 1]! : latest;
  return crossed < latest ? crossed : latest;
}

/* --------------------------------------------------------------------------
   Rarity and serials

   SEEDED, NOT MEASURED. There is no guest population behind the prototype, so
   "earned by 2.4% of guests" is a stable figure made from the threshold and a
   hash of the id -- harder badges read rarer, and the same badge always says
   the same thing. Replace both with real counts from the loyalty service when
   one exists; nothing else on screen needs to change.
   -------------------------------------------------------------------------- */

/** A small, stable string hash (FNV-1a). Good enough to seed a figure. */
const hash = (text: string): number => {
  let value = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 0x01000193);
  }
  return value >>> 0;
};

/** Share of guests holding it, as a percentage. Seeded -- see above. */
export function badgeRarity(badge: BadgeDefinition): number {
  const jitter = 0.6 + (hash(badge.id) % 800) / 1000;
  return Math.min(64, (48 / badge.threshold ** 1.35) * jitter);
}

export const formatRarity = (percent: number): string =>
  `${percent < 1 ? percent.toFixed(2) : percent.toFixed(1)}%`;

/**
 * The holder's number for this badge, as engraved on its back.
 *
 * Bounded by rarity, so a rare badge carries a low number -- fewer people got
 * there first. Stable per guest and badge.
 */
export function badgeSerial(badge: BadgeDefinition, holder: string): string {
  const pool = Math.max(40, Math.round(badgeRarity(badge) * 120));
  return `#${String(1 + (hash(`${holder}:${badge.id}`) % pool)).padStart(5, '0')}`;
}

/** The rarest earned badge, for the collection's hero. */
export const rarestBadge = (rows: BadgeProgress[]): BadgeProgress | undefined =>
  rows
    .filter((row) => row.earned)
    .sort((a, b) => badgeRarity(a.definition) - badgeRarity(b.definition))[0];

export const earnedBadges = (session: GuestSession): BadgeProgress[] =>
  badgeProgress(session).filter((row) => row.earned);

/**
 * The badges closest to completion, nearest first.
 *
 * The most useful rows on the screen: each one resolves to a specific thing
 * the guest could book, which is a badge doing merchandising rather than
 * sitting in a case.
 *
 * Progress has to have started. A badge worth one event sits one event from
 * earned the moment an account is opened, and eight of those crowding out the
 * six a guest is genuinely close to is how a useful list becomes a wall. They
 * are not lost -- they sit in their family section like everything else.
 */
export function nearlyEarnedBadges(session: GuestSession, within = 1): BadgeProgress[] {
  return badgeProgress(session)
    .filter((row) => !row.earned
      && row.count > 0
      && row.definition.threshold - row.count <= within)
    .sort((a, b) => (a.definition.threshold - a.count) - (b.definition.threshold - b.count));
}

/** The guest's correction, and it has to be real: derivation drops it after. */
export function muteBadge(session: GuestSession, id: string): GuestSession {
  const rewards = getRewards(session);
  if (rewards.mutedBadges.includes(id)) return session;

  return { ...session, rewards: { ...rewards, mutedBadges: [...rewards.mutedBadges, id] } };
}
