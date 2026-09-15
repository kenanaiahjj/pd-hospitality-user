import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import userEvent from '@testing-library/user-event';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EXPERIMENT_FLOWS, RoomScanner, RoomUnlocked, isFlowId } from './index';
import {
  STORY_URGENT_HOURS,
  buildCategoryCards,
  buildFeaturedDeck,
  buildSearchIndex,
  buildStories,
  formatPostedAgo,
  searchCatalogue,
  storyExpiryLabel,
  storyIsLive,
} from './story-model';
import { SwipeDeck } from './swipe-deck';
import { ServiceDetail } from './service-detail';
import { CategoryListing } from './category-listing';
import { NearbyDetail } from './nearby-detail';
import { nearbyForCategory, onPropertyForCategory } from './nearby-model';
import { SERVICE_VENUES, unclaimedServiceIds, venueForService } from './service-venues';
import { VenueMenu } from './venue-menu';
import { RESTAURANTS } from '../prototype-model';
import { INTENTS, matchIntent, resolveIntent } from './intent-model';

afterEach(cleanup);

const EXPERIMENTS_DIR = resolve(process.cwd(), 'src/components/features/guest-app/experiments');
const sourceFiles = readdirSync(EXPERIMENTS_DIR).filter((f) => f.endsWith('.tsx') || f.endsWith('.ts'));

describe('separation from the guest flow', () => {
  it('is never imported by the guest app except through the flow switcher', () => {
    const app = readFileSync(
      resolve(process.cwd(), 'src/components/features/guest-app/guest-app-prototype.tsx'),
      'utf8',
    );
    const specifiers = new Set(
      [...app.matchAll(/from '(\.\/experiments[^']*)'/g)].map((m) => m[1]),
    );

    // The barrel and nothing else. A deep import is how an experiment starts
    // growing roots into the flow it is supposed to be separable from.
    expect([...specifiers]).toEqual(['./experiments']);
  });

  it('never reaches into session state or the screen model', () => {
    /*
      The rule that keeps an experiment safe to break. Reading the catalogue
      is fine -- it is data. Touching a session, a screen id, or storage is
      how a sandbox stops being one.
    */
    for (const file of sourceFiles.filter((f) => !f.endsWith('.test.tsx'))) {
      // Comments stripped: this is about what the code does, and the comments
      // name these very types to explain why they are absent.
      const code = readFileSync(resolve(EXPERIMENTS_DIR, file), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '');
      expect(code, file).not.toMatch(/GuestSession|session-storage|ActiveScreen|setSession/);
    }
  });
});

describe('promotion seam', () => {
  it('RoomScanner takes the callbacks the guest app already has', async () => {
    const user = userEvent.setup();
    const onDetected = vi.fn();
    const onCancel = vi.fn();
    const onPickFromPhotos = vi.fn();

    render(
      <RoomScanner
        roomNumber="304"
        autoDetectMs={null}
        onDetected={onDetected}
        onCancel={onCancel}
        onPickFromPhotos={onPickFromPhotos}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Place QR code in the frame' })).toBeInTheDocument();
    expect(screen.getByText(/desk card in room 304/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Choose a photo instead' }));
    expect(onPickFromPhotos).toHaveBeenCalledOnce();

    await user.click(screen.getByRole('button', { name: 'Close scanner' }));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onDetected).not.toHaveBeenCalled();
  });

  it('detects on its own timer, and only once', async () => {
    vi.useFakeTimers();
    try {
      const onDetected = vi.fn();
      render(<RoomScanner autoDetectMs={2000} onDetected={onDetected} onCancel={vi.fn()} />);

      vi.advanceTimersByTime(5000);
      expect(onDetected).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });

  it('waits indefinitely when a real decoder owns detection', () => {
    vi.useFakeTimers();
    try {
      const onDetected = vi.fn();
      render(<RoomScanner autoDetectMs={null} onDetected={onDetected} onCancel={vi.fn()} />);

      vi.advanceTimersByTime(60_000);
      expect(onDetected).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('hides the photo control when the host cannot offer one', () => {
    render(<RoomScanner autoDetectMs={null} onDetected={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Choose a photo instead' })).toBeNull();
  });

  it('RoomUnlocked names what the scan opened and routes onward', async () => {
    const user = userEvent.setup();
    const onExplore = vi.fn();

    render(<RoomUnlocked roomNumber="304" onExplore={onExplore} onViewStay={vi.fn()} />);

    /*
      Never "your room is open": the scan opens services, not a door. The
      room number still has to appear -- it is what the guest checks the
      screen against -- but as the thing that was confirmed.
    */
    expect(screen.getByRole('heading', { name: /all set/i })).toBeInTheDocument();
    expect(screen.getByText(/Room 304 is confirmed/)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/room (304 )?is open|unlock(ed)? (your|the) (room|door)/i);
    expect(screen.getByText('Charge to room')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Explore' }));
    expect(onExplore).toHaveBeenCalledOnce();
  });

  it('falls back gracefully before a room is allocated', () => {
    render(<RoomUnlocked onExplore={vi.fn()} onViewStay={vi.fn()} />);
    expect(screen.getByRole('heading', { name: /all set/i })).toBeInTheDocument();
    expect(screen.getByText(/Your stay is confirmed/)).toBeInTheDocument();
  });
});

describe('addressing a flow', () => {
  it('accepts the flows it knows and rejects anything else off the URL', () => {
    // The URL is user input like any other.
    expect(isFlowId('guest')).toBe(true);
    expect(isFlowId('qr-scan')).toBe(true);
    expect(isFlowId('explore')).toBe(true);

    expect(isFlowId(null)).toBe(false);
    expect(isFlowId('')).toBe(false);
    expect(isFlowId('qr-scan-typo')).toBe(false);
    expect(isFlowId('__proto__')).toBe(false);
  });

  it('names every registered experiment, so a new one is addressable for free', () => {
    for (const flow of EXPERIMENT_FLOWS) {
      expect(isFlowId(flow.id)).toBe(true);
    }
  });
});

describe('discovery search', () => {
  it('reaches past the curation to everything bookable', () => {
    const index = buildSearchIndex();

    // The rail shows eight things; search must find the ones it does not.
    expect(index.length).toBeGreaterThan(buildStories().length);
    expect(searchCatalogue(index, 'massage').length).toBeGreaterThan(0);
    expect(searchCatalogue(index, 'laundry').length).toBeGreaterThan(0);
  });

  it('matches what a guest would actually type', () => {
    const index = buildSearchIndex();

    // Name, category and the who-or-where line, case-insensitively.
    expect(searchCatalogue(index, 'HILOM')[0]?.title).toMatch(/Hilom/);
    expect(searchCatalogue(index, 'spa').length).toBeGreaterThan(0);
    expect(searchCatalogue(index, 'rooftop').length).toBeGreaterThan(0);
  });

  it('returns nothing for an empty query rather than everything', () => {
    // The feed shows curation when the field is empty; a full dump here would
    // put a list of every service under it.
    const index = buildSearchIndex();
    expect(searchCatalogue(index, '')).toEqual([]);
    expect(searchCatalogue(index, '   ')).toEqual([]);
  });
});

describe('experiment imagery', () => {
  it('never puts a third party in the render path', () => {
    /*
      These were live Unsplash URLs, which Next fetches server-side at request
      time -- so a blocked network, an offline laptop, or rate-limiting across
      fifteen images all rendered as a broken glyph in front of whoever was
      being shown the prototype.
    */
    const source = readFileSync(resolve(EXPERIMENTS_DIR, 'story-imagery.ts'), 'utf8');
    expect(source).not.toMatch(/https?:\/\//);
  });

  it('ships every image it references', () => {
    const source = readFileSync(resolve(EXPERIMENTS_DIR, 'story-imagery.ts'), 'utf8');
    const paths = [...source.matchAll(/shot\('([^']+)'/g)].map((m) => m[1]!);

    expect(paths.length).toBeGreaterThan(0);
    for (const id of paths) {
      expect(
        existsSync(resolve(process.cwd(), 'public/experiments', `${id}.jpg`)),
        `public/experiments/${id}.jpg`,
      ).toBe(true);
    }
  });
});

describe('category cards', () => {
  it('counts what it promises', () => {
    /*
      Counted from the catalogue, never written down: a card that says
      "11 to book" and opens onto four is the kind of small lie that costs
      trust in a booking surface.
    */
    const cards = buildCategoryCards();
    expect(cards).toHaveLength(4);

    for (const card of cards) {
      expect(card.count, card.title).toBeGreaterThan(0);
      expect(card.image.src, card.title).toMatch(/^\/experiments\//);
    }
  });

  it('gives each category its own ground, so colour is the label', () => {
    const tones = buildCategoryCards().map((c) => c.tone);
    expect(new Set(tones).size).toBe(tones.length);
  });

  it('keeps text legible over imagery with a scrim, not a lighter colour', () => {
    // White on the light end of these gradients lands near 2:1. Darkening the
    // ground is what survives a photograph changing behind it.
    const css = readFileSync(resolve(EXPERIMENTS_DIR, 'experiments.css'), 'utf8');
    expect(css).toMatch(/\.categories__card::after\s*\{[^}]*linear-gradient/);
  });
});

describe('swipe deck', () => {
  const topTitle = () =>
    screen.getByTestId('swipe-deck').querySelector('.deck__copy b')?.textContent;

  it('offers experiences, not restaurants', () => {
    /*
      A restaurant is a decision against a time and a hunger; flicking past
      one at random is noise. An experience is the thing nobody knows they
      want until they see it, which is the only case where a pile beats a list.
    */
    const deck = buildFeaturedDeck();
    expect(deck.length).toBeGreaterThan(0);
    expect(deck.some((item) => /restaurant|bar|caf/i.test(item.category))).toBe(false);
  });

  it('browses rather than judges', () => {
    render(<SwipeDeck items={buildFeaturedDeck()} onOpen={vi.fn()} />);

    /*
      An earlier pass asked for a verdict on each card, which meant having an
      opinion about twenty-eight things before seeing any of them -- and made
      a throw irreversible, a strange price for looking.
    */
    expect(screen.queryByRole('button', { name: /save/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /pass/i })).toBeNull();
  });

  it('stays operable once the arrows are gone', async () => {
    const user = userEvent.setup();
    render(<SwipeDeck items={buildFeaturedDeck()} onOpen={vi.fn()} />);

    /*
      The chrome came off, so the card itself has to carry the affordance: a
      flick cannot be the only way through, or the pile is unreachable by
      keyboard. The label says which keys, because nothing on screen does.
    */
    const card = screen.getByRole('button', { name: /left and right arrows to browse/ });
    const first = topTitle();

    await user.click(card);
    await user.keyboard('{ArrowRight}');
    expect(topTitle()).not.toBe(first);

    await user.keyboard('{ArrowLeft}');
    expect(topTitle()).toBe(first);
  });

  it('opens on Enter, the same as a tap', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const items = buildFeaturedDeck();
    render(<SwipeDeck items={items} onOpen={onOpen} />);

    await user.click(screen.getByRole('button', { name: /Press Enter to open/ }));
    await user.keyboard('{Enter}');
    expect(onOpen).toHaveBeenCalledWith(items[0]!.id);
  });

  it('never runs out, because a thrown card goes to the back', async () => {
    const user = userEvent.setup();
    const items = buildFeaturedDeck();
    render(<SwipeDeck items={items} onOpen={vi.fn()} />);

    const first = topTitle();
    await user.click(screen.getByRole('button', { name: /Press Enter to open/ }));
    for (let i = 0; i < items.length; i += 1) {
      await user.keyboard('{ArrowRight}');
    }

    // All the way round and back to where it started.
    expect(topTitle()).toBe(first);
  });

  it('ends without pretending there is more', () => {
    render(<SwipeDeck items={[]} onOpen={vi.fn()} />);
    expect(screen.getByTestId('swipe-deck-empty')).toBeInTheDocument();
  });
});

describe('ask', () => {
  it('understands a situation, not a keyword', () => {
    /*
      "spa" is not a question anyone has. "it is raining and I have three
      hours" is, and a catalogue cannot answer it.
    */
    expect(matchIntent('its raining')?.id).toBe('rain');
    expect(matchIntent('somewhere to eat tonight')?.id).toBe('dinner');
    expect(matchIntent('we have kids')?.id).toBe('kids');
    expect(matchIntent('flight is at 4')?.id).toBe('before-checkout');
  });

  it('says nothing rather than guessing', () => {
    // A wrong answer delivered confidently is worse than none; anything
    // unmatched falls through to catalogue search, which never claims to
    // have understood.
    expect(matchIntent('')).toBeUndefined();
    expect(matchIntent('x')).toBeUndefined();
    expect(matchIntent('zzzzz qqqq')).toBeUndefined();
  });

  it('answers with real, bookable things and a reason for each', () => {
    for (const intent of INTENTS) {
      const result = resolveIntent(intent);

      expect(result.items.length, intent.id).toBeGreaterThan(0);
      for (const item of result.items) {
        // Resolved from the catalogue, so an answer can never list something
        // the property cannot sell.
        expect(item.title, `${intent.id}/${item.id}`).toBeTruthy();
        expect(item.price, `${intent.id}/${item.id}`).toMatch(/₱|Complimentary/);
        // The reason is the difference between this and a filtered list.
        expect(item.why.length, `${intent.id}/${item.id}`).toBeGreaterThan(8);
      }
    }
  });

  it('drops a pick the catalogue no longer sells', () => {
    const ghost = { ...INTENTS[0]!, picks: [{ id: 'does-not-exist', why: 'nope' }] };
    expect(resolveIntent(ghost).items).toEqual([]);
  });
});

describe('the deck reads as a deck', () => {
  it('shows the cards behind before anyone drags', () => {
    /*
      One card tucked directly under the top one is invisible: the deck read
      as a single page until it was already being dragged, which is exactly
      when the affordance has stopped mattering.
    */
    const items = buildFeaturedDeck();
    render(<SwipeDeck items={items} onOpen={vi.fn()} />);

    const deck = screen.getByTestId('swipe-deck');
    const under = deck.querySelectorAll('.deck__card--under');
    expect(under).toHaveLength(3);

    // Every slot is derived from `--depth` -- position, tilt and scale alike --
    // so a rotation is four numbers changing and CSS does the choreography.
    const depths = [...under].map((c) => (c as HTMLElement).style.getPropertyValue('--depth'));
    expect(depths).toEqual(['1', '2', '3']);
  });

  it('never renders more cards behind than it has left', () => {
    const items = buildFeaturedDeck().slice(0, 1);
    render(<SwipeDeck items={items} onOpen={vi.fn()} />);

    expect(screen.getByTestId('swipe-deck').querySelectorAll('.deck__card--under')).toHaveLength(0);
  });
});

describe('service detail', () => {
  it('opens a full screen with the price and the settlement terms', () => {
    const item = buildFeaturedDeck()[0]!;
    render(<ServiceDetail item={item} onBack={vi.fn()} onBook={vi.fn()} />);

    expect(screen.getByRole('heading', { name: item.title, level: 1 })).toBeInTheDocument();
    expect(screen.getByText(item.price)).toBeInTheDocument();
    // A card is a way in to booking, never a way around what it costs.
    expect(screen.getByText(/settled with the property at checkout/i)).toBeInTheDocument();
    expect(screen.getByText(/Nothing is charged now/i)).toBeInTheDocument();
  });

  it('books through the host, so the gate still decides', async () => {
    const user = userEvent.setup();
    const onBook = vi.fn();
    const item = buildFeaturedDeck()[0]!;

    render(<ServiceDetail item={item} onBack={vi.fn()} onBook={onBook} />);
    await user.click(screen.getByRole('button', { name: 'Choose a time' }));

    expect(onBook).toHaveBeenCalledWith(item.id);
  });
});

describe('deck motion', () => {
  it('never re-renders React while a finger is down', () => {
    /*
      The jank was architectural, not a curve: an earlier pass called setState
      on every pointermove, re-rendering the images, scrim and copy once per
      frame. No easing rescues a component that re-renders at 60fps.
    */
    const source = readFileSync(resolve(EXPERIMENTS_DIR, 'swipe-deck.tsx'), 'utf8');
    const onMove = source.slice(source.indexOf('const onPointerMove'), source.indexOf('const onPointerUp'));

    expect(onMove).not.toMatch(/setState|setIndex|useState/);
    expect(onMove).toMatch(/requestAnimationFrame/);
  });

  it('enumerates the properties it transitions, and ships a reduced-motion path', () => {
    const css = readFileSync(resolve(EXPERIMENTS_DIR, 'experiments.css'), 'utf8');

    // `transition: all` lets unrelated style changes ride along for free.
    expect(css).not.toMatch(/\.deck__card[^{]*\{[^}]*transition:\s*all/);
    expect(css).toMatch(/prefers-reduced-motion[\s\S]*?\.deck__card/);
  });
});

describe('category listing', () => {
  it('keeps what the hotel can book separate from what it can only point at', () => {
    render(
      <CategoryListing
        title="Food & Drink"
        onProperty={onPropertyForCategory('dining')}
        nearby={nearbyForCategory('dining')}
        onBack={vi.fn()}
        onOpenItem={vi.fn()}
        onOpenNearby={vi.fn()}
      />,
    );

    /*
      Merging them into one ranked list is what makes hotel directories
      useless: a guest cannot tell what the building can actually do for them.
    */
    expect(screen.getByRole('heading', { name: 'In the building' })).toBeInTheDocument();
    expect(screen.getByText(/charged to your room/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Places nearby' })).toBeInTheDocument();
    expect(screen.getByText(/Not ours to book/i)).toBeInTheDocument();
  });

  it('lists each venue once, though the catalogue holds it twice', () => {
    // The same dining rooms appear as venues and as services, under names
    // that differ only by a suffix.
    const names = onPropertyForCategory('dining').map((item) => item.title);
    expect(new Set(names).size).toBe(names.length);
    expect(names.filter((n) => /poolside/i.test(n))).toHaveLength(1);
  });

  it('sorts nearby by how far it actually is', () => {
    const distances = nearbyForCategory('dining').map((place) => place.distanceKm);
    expect([...distances].sort((a, b) => a - b)).toEqual(distances);
  });
});

describe('nearby place', () => {
  const place = nearbyForCategory('dining')[0]!;

  it('offers the ride, because the ride is the only thing the hotel sells here', async () => {
    const user = userEvent.setup();
    const onBookRide = vi.fn();
    render(<NearbyDetail place={place} onBack={vi.fn()} onBookRide={onBookRide} />);

    /*
      No booking button: the property does not hold this restaurant's tables,
      and a button implying otherwise fails the first guest who presses it.
    */
    expect(screen.queryByRole('button', { name: /book a table|reserve/i })).toBeNull();

    await user.click(screen.getByRole('button', { name: /Book a hotel car/ }));
    expect(onBookRide).toHaveBeenCalledWith(place.id);
  });

  it('gives a guest what they need to decide, and a number they can press', () => {
    render(<NearbyDetail place={place} onBack={vi.fn()} onBookRide={vi.fn()} />);

    expect(screen.getByText(place.address)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: place.phone })).toHaveAttribute(
      'href',
      `tel:${place.phone.replace(/\s/g, '')}`,
    );
    expect(screen.getByRole('img', { name: new RegExp(place.name) })).toBeInTheDocument();
  });

  it('draws its map rather than fetching one', () => {
    // A tile service in the render path is a third party that can be blocked
    // or rate-limited in front of a guest -- and this needs to say "roughly
    // here, this far", not navigate.
    const source = readFileSync(resolve(EXPERIMENTS_DIR, 'nearby-detail.tsx'), 'utf8');
    expect(source).not.toMatch(/https?:\/\//);
  });
});

describe('grids that contain rails', () => {
  it('state their track, so a scroller cannot widen the page', () => {
    /*
      Four separate bugs this session came from the same place: a grid item's
      automatic minimum size refuses to shrink below its content, so a
      horizontal rail sizes its whole parent column to its scroll width.
      Every grid here that holds an overflowing child says minmax(0, 1fr).
    */
    const css = readFileSync(resolve(EXPERIMENTS_DIR, 'experiments.css'), 'utf8');

    for (const parent of ['.discover', '.listing']) {
      const rule = css.slice(css.indexOf(`\n${parent} {`));
      const block = rule.slice(0, rule.indexOf('}'));
      expect(block, parent).toMatch(/grid-template-columns:\s*minmax\(0/);
    }
  });
});

describe('the venue screen a category tap lands on', () => {
  const venue = RESTAURANTS[0];

  it('serves the venue its own menu, not a generic service page', () => {
    render(<VenueMenu venue={venue} roomLabel="Room 304" onBack={vi.fn()} onReserve={vi.fn()} />);

    expect(screen.getByRole('heading', { level: 1, name: venue.name })).toBeInTheDocument();
    for (const dish of venue.menu.slice(0, 3)) {
      expect(screen.getByRole('heading', { name: dish.name })).toBeInTheDocument();
    }
  });

  it('adds up a cart with the app\'s own helper rather than its own arithmetic', async () => {
    const user = userEvent.setup();
    render(<VenueMenu venue={venue} roomLabel="Room 304" onBack={vi.fn()} onReserve={vi.fn()} />);

    // No cart until there is something in it: an empty bar is furniture.
    expect(screen.queryByRole('button', { name: /cart/i })).not.toBeInTheDocument();

    const first = venue.menu[0];
    await user.click(screen.getByRole('button', { name: `Add ${first.name}` }));

    expect(screen.getByRole('button', { name: new RegExp(`1 item .* ${first.price.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`) })).toBeInTheDocument();
  });

  it('routes every on-property card somewhere real', () => {
    /*
      The bug this guards: a category listing is built from one model and the
      screens it opens from another, so an id can exist in the list and match
      nothing downstream -- and the tap silently does nothing, which is the
      hardest failure to spot by clicking around.
    */
    // The catalogue, which is what the detail screen resolves against --
    // not the curated deck, which is a selection out of it.
    const bookable = new Set(buildSearchIndex().map((item) => item.id));
    const venues = new Set(RESTAURANTS.map((entry) => entry.id));

    for (const category of buildCategoryCards()) {
      for (const item of onPropertyForCategory(category.id)) {
        expect(venues.has(item.id) || bookable.has(item.id), `${category.id} / ${item.id}`).toBe(true);
      }
    }
  });

  it('is written against the app\'s classes, so promoting it is a deletion', () => {
    // The point of restating this markup is that it renders with the shipping
    // stylesheet. Renaming these to experiment-only classes would make it a
    // lookalike that drifts, and promotion a rewrite.
    const source = readFileSync(resolve(EXPERIMENTS_DIR, 'venue-menu.tsx'), 'utf8');
    for (const shared of ['guest-restaurant-menu', 'guest-menu-tabs', 'guest-menu-item-card', 'guest-mini-cart']) {
      expect(source, shared).toContain(shared);
    }
  });
});

describe('screen entry animation', () => {
  it('does not fill forwards, because a filling transform traps fixed children', () => {
    /*
      An animation that fills keeps computing its properties, and an
      interpolated `transform: none` computes to `matrix(1, 0, 0, 1, 0, 0)` --
      not `none`. A transform or filter other than `none` makes the element a
      containing block for fixed-position descendants, so `both` left
      `.guest-mini-cart` resolving against the page instead of the viewport
      and sitting 2,154px down an 812px screen: in the DOM, correct in its
      numbers, never on screen.

      Nothing about the markup says this screen holds a fixed child, which is
      why it needs a test rather than a comment.
    */
    const css = readFileSync(resolve(EXPERIMENTS_DIR, 'experiments.css'), 'utf8');
    const rules = [...css.matchAll(/\.experiment-page[^{]*\{([^}]*)\}/g)].map((m) => m[1]);

    expect(rules.length).toBeGreaterThan(0);
    for (const rule of rules) {
      for (const declaration of rule.match(/animation:[^;]*/g) ?? []) {
        expect(declaration).not.toMatch(/\bboth\b|\bforwards\b/);
      }
    }
  });
});

describe('a story is a post, not a profile', () => {
  it('is signed and dated', () => {
    // Without these two the rail is a row of thumbnails, and a guest cannot
    // tell it apart from the featured deck three sections below it.
    for (const story of buildStories()) {
      expect(story.author.name, story.id).toBeTruthy();
      expect(['property', 'venue']).toContain(story.author.kind);
      expect(Number.isFinite(story.postedHoursAgo), story.id).toBe(true);
      expect(story.livesForHours, story.id).toBeGreaterThan(0);
    }
  });

  it('drops posts that have outlived their window', () => {
    /*
      Decay is the whole reason a venue has to come back and publish again.
      A post that never expires is a banner, and a rail of banners needs no
      merchant on the other end of it.
    */
    const stories = buildStories();
    expect(stories.every(storyIsLive)).toBe(true);

    const expired = { ...stories[0]!, postedHoursAgo: 48, livesForHours: 24 };
    expect(storyIsLive(expired)).toBe(false);
  });

  it('sorts newest first, because that is what makes it a feed', () => {
    const posted = buildStories().map((story) => story.postedHoursAgo);
    expect(posted).toEqual([...posted].sort((a, b) => a - b));
  });

  it('gives no two posts the same timestamp', () => {
    // Half a rail reading "7h" is the tell that nobody wrote them.
    const posted = buildStories().map((story) => formatPostedAgo(story.postedHoursAgo));
    expect(new Set(posted).size).toBe(posted.length);
  });

  it('counts time the way every other feed does', () => {
    expect(formatPostedAgo(0.4)).toBe('Just now');
    expect(formatPostedAgo(1)).toBe('1h');
    expect(formatPostedAgo(23.9)).toBe('23h');
    expect(formatPostedAgo(24)).toBe('1d');
    expect(formatPostedAgo(50)).toBe('2d');
  });

  it('only counts down once the countdown is information', () => {
    const base = buildStories()[0]!;
    const at = (hoursAgo: number) => storyExpiryLabel({ ...base, postedHoursAgo: hoursAgo, livesForHours: 24 });

    // Twenty hours left is pressure with nothing behind it.
    expect(at(4)).toBeUndefined();
    expect(at(24 - STORY_URGENT_HOURS - 1)).toBeUndefined();
    expect(at(22)).toBe('Ends in 2h');
    expect(at(23.5)).toBe('Ends within the hour');
  });
});

describe('featured says why', () => {
  it('carries a reason on every card', () => {
    for (const card of buildFeaturedDeck()) {
      expect(card.reason.label, card.id).toBeTruthy();
      expect(['hotel-pick', 'stay-context', 'popular']).toContain(card.reason.kind);
    }
  });

  it('is no longer the search index wearing a different layout', () => {
    /*
      The deck used to return `SearchableItem[]` -- literally the type the
      search field renders. That made "featured" the catalogue in a different
      shape: no curator, no reason, and nothing a guest could tell apart from
      search results that happened to be stacked.
    */
    const searchRow = buildSearchIndex()[0]!;
    expect('reason' in searchRow).toBe(false);
    expect(buildFeaturedDeck().every((card) => 'reason' in card)).toBe(true);
  });

  it('names something specific rather than something that fits anything', () => {
    // "Recommended for you" is the same as no reason at all.
    for (const card of buildFeaturedDeck()) {
      expect(card.reason.label, card.id).not.toMatch(/recommended for you|just for you|you may (also )?like/i);
    }
  });
});

describe('services have venues behind them', () => {
  it('leaves no service without an account', () => {
    /*
      `venueForService` falls back to the house account, which is the right
      behaviour at runtime and a terrible thing to rely on: it would let every
      new service quietly post as the hotel. This is what stops the fallback
      becoming the answer.
    */
    expect(unclaimedServiceIds()).toEqual([]);
  });

  it('claims each service exactly once', () => {
    const claimed = SERVICE_VENUES.flatMap((venue) => venue.operates);
    expect(new Set(claimed).size).toBe(claimed.length);
  });

  it('posts a treatment under the venue that sells it, not under its own name', () => {
    // The bug this replaces: "Hilom signature massage" in the rail as if a
    // massage could publish something.
    const spa = venueForService('spa');
    expect(spa.name).toBe('Hilom Spa & Wellness');
    expect(venueForService('hot-stone').id).toBe(spa.id);

    const story = buildStories().find((entry) => entry.author.name === spa.name);
    expect(story?.author.kind).toBe('venue');
    expect(story?.subtitle).toBe(spa.location);
  });

  it('gives an account one ring however much it has published', () => {
    // Five treatments are five posts by one spa, not five rings.
    const names = buildStories().map((story) => story.author.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('shows featured cards the account, not the contract term', () => {
    // "Third-party on property" is not a thing a guest can decide about.
    const details = buildFeaturedDeck().map((card) => card.detail);
    for (const detail of details) {
      expect(detail).not.toMatch(/third-party|hotel (operated|arranged)|curated guide/i);
    }
    expect(details).toContain('Lakbay Island Tours');
  });
});

describe('the featured deck is a selection, not a dump', () => {
  it('gives every card a picture of its own', () => {
    /*
      Twenty-eight cards drew ten images between them, nineteen of them the
      same resort photo, because the deck was every non-dining service and
      `storyImage` falls back to the house shot. Side by side that reads as
      broken whatever the copy says.
    */
    const deck = buildFeaturedDeck();
    const images = deck.map((card) => card.image.src);
    expect(new Set(images).size).toBe(deck.length);
  });

  it('is small enough to have been chosen by somebody', () => {
    const deck = buildFeaturedDeck();
    expect(deck.length).toBeGreaterThan(4);
    expect(deck.length).toBeLessThan(
      buildSearchIndex().length,
    );
  });
});
