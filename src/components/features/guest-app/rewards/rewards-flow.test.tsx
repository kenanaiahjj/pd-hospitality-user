import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MOCK_SESSION, SCREENS } from '../prototype-model';
import { GuestAppPrototype } from '../guest-app-prototype';
import {
  BADGES, BADGE_FAMILIES, badgeProgress, earnedBadges, findBadge, nearlyEarnedBadges,
} from './badge-model';
import { BadgeMedal, glyphFor } from './badge-medal';
import { BadgeShelf } from './badge-shelf';
import { EstateMap } from './estate-map';
import { PointsWallet } from './points-wallet';
import {
  REWARD_MENU, affordableRewards, buildPointsLedger, pointsBalance, pointsExpiry,
} from './points-model';

const anyBadge = BADGES[0]!;

describe('BadgeMedal', () => {
  /*
    The artwork is generated separately and does not exist yet, so the medal
    has to draw itself. This is the state the flow demos in until PNGs land,
    which makes the fallback a deliverable rather than a placeholder.
  */
  it('draws every badge with no artwork present', () => {
    for (const badge of BADGES) {
      const { unmount } = render(<BadgeMedal badge={{ ...badge, art: undefined }} earned />);

      const medal = screen.getByRole('img', { name: badge.name });
      expect(medal, badge.id).toBeInTheDocument();
      // A drawn medal, not an empty shape: the glyph has to be in there.
      expect(medal.querySelector('svg'), `${badge.id} drew no glyph`).not.toBeNull();

      unmount();
    }
  });

  /*
    The guard that stops a renamed icon silently leaving a hole. A badge whose
    glyph does not resolve would render an empty enamel field and look exactly
    like a badge whose artwork simply had not loaded.
  */
  it('resolves a glyph for every badge', () => {
    for (const badge of BADGES) {
      expect(glyphFor(badge.glyph), `${badge.id} names unknown glyph "${badge.glyph}"`)
        .toBeDefined();
    }
  });

  it('says a badge is unearned rather than only showing it greyed', () => {
    render(<BadgeMedal badge={{ ...anyBadge, art: undefined }} earned={false} />);

    expect(screen.getByRole('img', { name: /not yet earned/i })).toBeInTheDocument();
  });

  it('carries its family, so shape and enamel come from one place', () => {
    const badge = findBadge('island-hopper')!;
    render(<BadgeMedal badge={badge} earned />);

    const medal = screen.getByRole('img', { name: 'Island hopper' });
    expect(medal).toHaveAttribute('data-family', 'place');
    expect(medal).toHaveStyle({ '--medal-enamel': BADGE_FAMILIES.place.enamel });
  });

  it('shows the artwork once a badge has some', () => {
    render(<BadgeMedal badge={{ ...anyBadge, art: '/badges/foodie.png' }} earned />);

    const image = screen.getByRole('img', { name: anyBadge.name });
    expect(image.querySelector('img')).not.toBeNull();
    expect(image.querySelector('svg')).toBeNull();
  });

  it('renders at the size it is asked for', () => {
    render(<BadgeMedal badge={{ ...anyBadge, art: undefined }} earned size={64} />);

    expect(screen.getByRole('img', { name: anyBadge.name }))
      .toHaveStyle({ '--medal-size': '64px' });
  });
});


describe('PointsWallet', () => {
  const balance = pointsBalance(MOCK_SESSION);
  const affordable = affordableRewards(balance);

  const renderWallet = (onOpenReward = vi.fn()) => {
    render(
      <PointsWallet
        balance={balance}
        affordable={affordable}
        nextUp={REWARD_MENU.find((reward) => reward.points > balance)}
        ledger={buildPointsLedger(MOCK_SESSION)}
        expiry={pointsExpiry(MOCK_SESSION)}
        nearest={nearlyEarnedBadges(MOCK_SESSION)[0]}
        onOpenReward={onOpenReward}
      />,
    );
    return onOpenReward;
  };

  /*
    A balance on its own is a score. Stated as the thing it buys from the
    catalogue the guest is standing in, it is a reason to book something.
  */
  it('states the balance, its floor value, and what it buys', () => {
    renderWallet();

    expect(screen.getByText('37,220')).toBeInTheDocument();
    expect(screen.getByText(/₱3,700 off anything/)).toBeInTheDocument();
    expect(screen.getByText('Couples massage suite')).toBeInTheDocument();
  });

  it('names what is still out of reach, and how far', () => {
    renderWallet();

    expect(screen.getByText('A night on us')).toBeInTheDocument();
    expect(screen.getByText('17,780 points away')).toBeInTheDocument();
  });

  it('opens a reward from the balance', async () => {
    const onOpenReward = renderWallet();

    await userEvent.click(screen.getByRole('button', { name: /couples massage suite/i }));

    expect(onOpenReward).toHaveBeenCalledWith('couples-suite');
  });

  it('shows where the points came from, spends included', () => {
    renderWallet();

    expect(screen.getByText('Checked in before arriving')).toBeInTheDocument();
    expect(screen.getByText(/Points last until 2028-11-12/)).toBeInTheDocument();
  });
});

describe('BadgeShelf', () => {
  const renderShelf = (onOpenBadge = vi.fn()) => {
    render(
      <BadgeShelf
        earned={earnedBadges(MOCK_SESSION)}
        nearly={nearlyEarnedBadges(MOCK_SESSION)}
        all={badgeProgress(MOCK_SESSION)}
        onOpenBadge={onOpenBadge}
      />,
    );
    return onOpenBadge;
  };

  it('wraps what is earned and lists what is close', () => {
    renderShelf();

    expect(screen.getByText('13 earned')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Foodie' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Nearly there' })).toBeInTheDocument();
  });

  it('shows every badge exactly once', () => {
    renderShelf();

    const names = BADGES.map((badge) => badge.name);
    for (const name of new Set(names)) {
      const matches = names.filter((entry) => entry === name).length;
      expect(screen.getAllByRole('img', { name: new RegExp(`^${name}( —|$)`) })).toHaveLength(matches);
    }
  });

  it('tells assistive technology a locked badge is locked', () => {
    renderShelf();

    expect(screen.getByRole('img', { name: 'Culture — not yet earned' })).toBeInTheDocument();
  });

  it('opens a badge from its row', async () => {
    const onOpenBadge = renderShelf();

    const rows = screen.getAllByTestId('badge-progress-row');
    await userEvent.click(within(rows[0]!).getByRole('button'));

    expect(onOpenBadge).toHaveBeenCalledWith('homegrown');
  });
});

describe('EstateMap', () => {
  it('lights the cities the guest has stayed in', () => {
    render(<EstateMap visitedCities={['Manila', 'Cebu']} />);

    expect(screen.getByText('2 of 3')).toBeInTheDocument();
    expect(screen.getAllByText('Stayed')).toHaveLength(2);
    expect(screen.getByText('Not yet')).toBeInTheDocument();
  });

  /* The gap is the point: the badge is a stretch, not a defect. */
  it('admits the estate has not reached Mindanao', () => {
    render(<EstateMap visitedCities={[]} />);

    expect(screen.getByRole('heading', { name: 'Mindanao' })).toBeInTheDocument();
    expect(screen.getByText('No property here yet')).toBeInTheDocument();
  });
});


describe('the door from Profile', () => {
  it('registers Rewards as a screen of the app', () => {
    expect(SCREENS.find((screenEntry) => screenEntry.id === 'rewards')).toMatchObject({
      group: 'Account',
      title: 'Points and badges',
    });
  });

  it('opens the hub from Profile and derives everything on the spot', async () => {
    render(<GuestAppPrototype initialSession={MOCK_SESSION} initialScreen="profile" />);

    const door = screen.getByRole('button', { name: /points and badges/i });
    expect(within(door).getByText(/37,220 points · 13 badges/)).toBeInTheDocument();

    await userEvent.click(door);

    expect(screen.getByRole('heading', { level: 1, name: 'Points and badges' })).toBeInTheDocument();
    expect(screen.getByText('37,220')).toBeInTheDocument();
    expect(screen.getByText('13 earned')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Foodie' })).toBeInTheDocument();
  });

  /* Rewards lives inside Profile, so the bar must not lose its highlight. */
  it('keeps the Profile tab current while rewards is open', async () => {
    render(<GuestAppPrototype initialSession={MOCK_SESSION} initialScreen="profile" />);
    await userEvent.click(screen.getByRole('button', { name: /points and badges/i }));

    const profileTab = screen.getByRole('button', { name: /^profile$/i });
    expect(profileTab).toHaveAttribute('aria-current', 'page');
  });
});
