import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import userEvent from '@testing-library/user-event';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RoomScanner, RoomUnlocked } from './index';

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

    await user.click(screen.getByRole('button', { name: /Explore the property/ }));
    expect(onExplore).toHaveBeenCalledOnce();
  });

  it('falls back gracefully before a room is allocated', () => {
    render(<RoomUnlocked onExplore={vi.fn()} onViewStay={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Your room is open' })).toBeInTheDocument();
  });
});
