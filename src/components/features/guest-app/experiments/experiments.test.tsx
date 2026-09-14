import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import userEvent from '@testing-library/user-event';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EXPERIMENT_FLOWS, RoomScanner, RoomUnlocked, isFlowId } from './index';
import { buildCategoryCards, buildSearchIndex, buildStories, buildSwipeDeck, searchCatalogue } from './story-model';
import { SwipeDeck } from './swipe-deck';
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

    expect(screen.getByRole('heading', { name: 'Room 304 is open' })).toBeInTheDocument();
    expect(screen.getByText('Charge to room')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Explore' }));
    expect(onExplore).toHaveBeenCalledOnce();
  });

  it('falls back gracefully before a room is allocated', () => {
    render(<RoomUnlocked onExplore={vi.fn()} onViewStay={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Your room is open' })).toBeInTheDocument();
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
  it('offers experiences, not restaurants', () => {
    /*
      A restaurant is a decision against a time and a hunger; flicking past
      one at random is noise. An experience is the thing nobody knows they
      want until they see it, which is the only case where a pile beats a list.
    */
    const deck = buildSwipeDeck();
    expect(deck.length).toBeGreaterThan(0);
    expect(deck.some((item) => /restaurant|bar|caf/i.test(item.category))).toBe(false);
  });

  it('browses rather than judges', async () => {
    const user = userEvent.setup();
    const items = buildSwipeDeck();
    render(<SwipeDeck items={items} onOpen={vi.fn()} />);

    /*
      An earlier pass asked for a verdict on each card, which meant having an
      opinion about twenty-eight things before seeing any of them -- and made
      a throw irreversible, a strange price for looking.
    */
    expect(screen.queryByRole('button', { name: /save/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /pass/i })).toBeNull();

    expect(screen.getByText(`1 of ${items.length}`)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText(`2 of ${items.length}`)).toBeInTheDocument();
  });

  it('goes back, because browsing is reversible', async () => {
    const user = userEvent.setup();
    const items = buildSwipeDeck();
    render(<SwipeDeck items={items} onOpen={vi.fn()} />);

    // Nowhere to go at the first card; the control says so rather than
    // silently doing nothing.
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(await screen.findByRole('button', { name: 'Previous' }));
    expect(await screen.findByText(`1 of ${items.length}`)).toBeInTheDocument();
  });

  it('can be worked without a gesture', async () => {
    const user = userEvent.setup();
    render(<SwipeDeck items={buildSwipeDeck()} onOpen={vi.fn()} />);

    // A flick cannot be the only way through, or the pile is unreadable to a
    // keyboard and unusable one-handed.
    await user.tab();
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
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
    const items = buildSwipeDeck();
    render(<SwipeDeck items={items} onOpen={vi.fn()} />);

    const deck = screen.getByTestId('swipe-deck');
    const under = deck.querySelectorAll('.deck__card--under');
    expect(under).toHaveLength(3);

    // Stepped and tilted: a neat stack reads as a component, loose cards read
    // as something you can throw.
    const styles = [...under].map((c) => c as HTMLElement);
    expect(styles.map((c) => c.style.getPropertyValue('--depth'))).toEqual(['3', '2', '1']);
    for (const card of styles) {
      expect(card.style.getPropertyValue('--tilt')).toMatch(/-?\d/);
    }
  });

  it('never renders more cards behind than it has left', () => {
    const items = buildSwipeDeck().slice(0, 1);
    render(<SwipeDeck items={items} onOpen={vi.fn()} />);

    expect(screen.getByTestId('swipe-deck').querySelectorAll('.deck__card--under')).toHaveLength(0);
  });
});
