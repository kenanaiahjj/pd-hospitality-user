import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import userEvent from '@testing-library/user-event';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EXPERIMENT_FLOWS, RoomScanner, RoomUnlocked, isFlowId } from './index';
import { buildSearchIndex, buildStories, searchCatalogue } from './story-model';

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
