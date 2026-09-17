import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MOCK_SESSION, SCREENS, applyPrototypeStayState } from '../prototype-model';
import { RewardDetail, RewardMenu } from './reward-menu';
import { PointsApply } from './points-apply';
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
    expect(screen.getByRole('button', { name: 'Foodie' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Nearly there' })).toBeInTheDocument();
  });

  it('shows every badge exactly once', () => {
    renderShelf();

    expect(screen.getAllByTestId('badge-progress-row').length
      + earnedBadges(MOCK_SESSION).length).toBe(BADGES.length);
  });

  /*
    One announcement, not three. The row's medal, its label and its count would
    otherwise each be read out, so the medal is decorative and the button
    carries name, requirement and progress together.
  */
  it('announces an in-progress badge as one thing', () => {
    renderShelf();

    expect(screen.getByRole('button', {
      name: 'Culture — Two museums or heritage walks, 1 of 2',
    })).toBeInTheDocument();
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
    expect(screen.getByRole('button', { name: 'Foodie' })).toBeInTheDocument();
  });

  /* Rewards lives inside Profile, so the bar must not lose its highlight. */
  it('keeps the Profile tab current while rewards is open', async () => {
    render(<GuestAppPrototype initialSession={MOCK_SESSION} initialScreen="profile" />);
    await userEvent.click(screen.getByRole('button', { name: /points and badges/i }));

    const profileTab = screen.getByRole('button', { name: /^profile$/i });
    expect(profileTab).toHaveAttribute('aria-current', 'page');
  });
});


describe('the badge sheet', () => {
  const openRewards = async () => {
    render(<GuestAppPrototype initialSession={MOCK_SESSION} initialScreen="profile" />);
    await userEvent.click(screen.getByRole('button', { name: /points and badges/i }));
  };

  /*
    A badge derived from spend is a profile, and one that appears unannounced
    reads as surveillance. Showing the bookings behind it is what makes it an
    inference the guest can argue with rather than a verdict.
  */
  it('shows the bookings that earned a badge', async () => {
    await openRewards();

    await userEvent.click(screen.getByRole('button', { name: 'Foodie' }));

    const sheet = screen.getByRole('dialog');
    expect(within(sheet).getByRole('heading', { name: 'Foodie' })).toBeInTheDocument();
    expect(within(sheet).getByText('Dinner for two · Azotea Rooftop')).toBeInTheDocument();
    expect(within(sheet).getByText('Drinks and snacks · The Poolside Bar')).toBeInTheDocument();
  });

  it('lets the guest deny it, and the badge leaves every surface', async () => {
    await openRewards();
    expect(screen.getByRole('button', { name: 'Foodie' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Foodie' }));
    await userEvent.click(screen.getByRole('button', { name: /turn this off/i }));

    expect(screen.queryByRole('button', { name: 'Foodie' })).not.toBeInTheDocument();
    expect(screen.getByText('12 earned')).toBeInTheDocument();
  });

  /*
    The correction has to outlive the screen, not just the view.

    Persistence to localStorage is not asserted here: `persistent` is
    `!initialSession`, so injecting a session deliberately turns writing off
    and a test cannot clobber the real stored record. That half is covered
    where it lives -- `muteBadge` writing the id, and `session-storage`
    round-tripping `rewards.mutedBadges`. What is left to prove is that the app
    keeps the correction on the session rather than in a component's state.
  */
  it('keeps the correction after leaving the screen', async () => {
    await openRewards();
    await userEvent.click(screen.getByRole('button', { name: 'Foodie' }));
    await userEvent.click(screen.getByRole('button', { name: /turn this off/i }));

    await userEvent.click(screen.getByRole('button', { name: /^profile$/i }));
    await userEvent.click(screen.getByRole('button', { name: /points and badges/i }));

    expect(screen.queryByRole('button', { name: 'Foodie' })).not.toBeInTheDocument();
    expect(screen.getByText('12 earned')).toBeInTheDocument();
  });

  it('says what is left on a badge still in progress', async () => {
    await openRewards();

    await userEvent.click(screen.getByRole('button', { name: /^Culture/ }));

    const sheet = screen.getByRole('dialog');
    expect(within(sheet).getByText('1 of 2')).toBeInTheDocument();
    expect(within(sheet).getByText(/one more/i)).toBeInTheDocument();
  });

  it('closes without changing anything', async () => {
    await openRewards();
    await userEvent.click(screen.getByRole('button', { name: 'Foodie' }));

    await userEvent.click(screen.getByRole('button', { name: /close/i }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Foodie' })).toBeInTheDocument();
  });
});


describe('RewardMenu', () => {
  const balance = pointsBalance(MOCK_SESSION);

  it('prices every reward in points, and against what the floor would charge', () => {
    render(<RewardMenu rewards={REWARD_MENU} balance={balance} onOpenReward={vi.fn()} />);

    const massage = screen.getByRole('button', { name: /hilom signature massage/i });
    expect(within(massage).getByText('16,000')).toBeInTheDocument();
    // The gap between ₱1,600 at the floor and a ₱2,400 treatment is the point.
    expect(within(massage).getByText(/₱1,600 at the floor · worth ₱2,400/)).toBeInTheDocument();
  });

  it('disables what the balance cannot cover, and says how far off it is', () => {
    render(<RewardMenu rewards={REWARD_MENU} balance={balance} onOpenReward={vi.fn()} />);

    const night = screen.getByRole('button', { name: /a night on us/i });
    expect(night).toBeDisabled();
    expect(within(night).getByText('17,780 away')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /couples massage suite/i })).toBeEnabled();
  });

  it('opens a reward', async () => {
    const onOpenReward = vi.fn();
    render(<RewardMenu rewards={REWARD_MENU} balance={balance} onOpenReward={onOpenReward} />);

    await userEvent.click(screen.getByRole('button', { name: /airport transfer/i }));

    expect(onOpenReward).toHaveBeenCalledWith('airport-transfer');
  });
});

describe('RewardDetail', () => {
  const massage = REWARD_MENU.find((reward) => reward.id === 'hilom-massage')!;

  it('says what it costs and what would be left', () => {
    render(
      <RewardDetail reward={massage} balance={37220} onRedeem={vi.fn()} />,
    );

    expect(screen.getByRole('heading', { level: 1, name: massage.title })).toBeInTheDocument();
    expect(screen.getByText('16,000')).toBeInTheDocument();
    expect(screen.getByText(/21,220 points left/)).toBeInTheDocument();
  });

  it('will not offer a redemption the balance cannot cover', () => {
    render(
      <RewardDetail reward={massage} balance={1000} onRedeem={vi.fn()} />,
    );

    expect(screen.getByRole('button', { name: /redeem/i })).toBeDisabled();
    expect(screen.getByText(/15,000 points short/)).toBeInTheDocument();
  });
});

describe('redeeming from the app', () => {
  const openRewards = async () => {
    render(<GuestAppPrototype initialSession={MOCK_SESSION} initialScreen="profile" />);
    await userEvent.click(screen.getByRole('button', { name: /points and badges/i }));
  };

  it('registers the reward detail as a screen', () => {
    expect(SCREENS.find((entry) => entry.id === 'reward-detail')).toMatchObject({
      group: 'Account',
    });
  });

  it('spends the points, and earns nothing back for spending them', async () => {
    await openRewards();

    await userEvent.click(screen.getByRole('button', { name: /hilom signature massage/i }));
    await userEvent.click(screen.getByRole('button', { name: /redeem/i }));

    // 37,220 − 16,000, and no earn for the redemption itself.
    expect(screen.getByText('21,220')).toBeInTheDocument();
    expect(screen.getByText('-16,000')).toBeInTheDocument();
  });
});


describe('PointsApply', () => {
  const render0 = (applied = 0, onChange = vi.fn()) => {
    render(<PointsApply balance={37220} amount="₱2,400" applied={applied} onChange={onChange} />);
    return onChange;
  };

  it('offers the balance against this booking, floored to what it can spend', () => {
    render0();

    // 37,220 points spends ₱3,700, not ₱3,722.
    expect(screen.getByText('37,220 points · ₱3,700 available')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /use points/i })).toBeEnabled();
  });

  /*
    Capped by the booking, not only by the balance. Points cannot pay more than
    the thing costs, and the floor spends in whole ₱100 blocks -- ₱2,400 is
    24 of them.
  */
  it('will not apply more points than the booking is worth', async () => {
    const onChange = render0(23000);

    await userEvent.click(screen.getByRole('button', { name: /add 1,000/i }));
    expect(onChange).toHaveBeenLastCalledWith(24000);

    render0(24000);
    expect(screen.getAllByRole('button', { name: /add 1,000/i }).at(-1)).toBeDisabled();
  });

  it('says what the points take off, and what is left to pay', () => {
    render0(10000);

    expect(screen.getByText('−₱1,000')).toBeInTheDocument();
    expect(screen.getByText('₱1,400')).toBeInTheDocument();
  });
});

describe('booking with points', () => {
  /*
    The live stay state, because booking needs a verified room -- and without
    the massage, since the fixture already holds it and a booking that changes
    nothing can earn nothing. Removing it puts Wellness at 2 of 3, so booking
    it is what tips the badge over.
  */
  const live = applyPrototypeStayState('live');
  const beforeMassage = {
    ...live,
    serviceBookings: live.serviceBookings.filter((s) => s.id !== 'service-hilom-1'),
  };

  const openBooking = async (session = beforeMassage) => {
    render(<GuestAppPrototype initialSession={session} initialScreen="service-booking" />);
    await userEvent.click(screen.getByRole('button', { name: /charge to room 304/i }));
  };

  it('charges less when points are applied', async () => {
    await openBooking();

    await userEvent.click(screen.getByRole('button', { name: /^use points$/i }));
    for (let i = 0; i < 9; i += 1) {
      await userEvent.click(screen.getByRole('button', { name: /add 1,000/i }));
    }

    // Ten blocks of 1,000 points is ₱1,000 off a ₱2,400 treatment.
    expect(screen.getByRole('button', { name: /charge ₱1,400 to room/i })).toBeInTheDocument();
  });

  /*
    The moment a booking tips a badge over, said in the same breath as what it
    changes -- a badge announced without its consequence is a sticker.
  */
  it('announces a badge the booking completed', async () => {
    await openBooking();

    await userEvent.click(screen.getByRole('button', { name: /charge ₱2,400 to room/i }));

    expect(await screen.findByText(/you.re now wellness/i)).toBeInTheDocument();
    expect(screen.getByText(/three spa treatments/i)).toBeInTheDocument();
  });

  /*
    Only what this booking changed, never everything the guest holds. Booking
    from the full live session re-books a massage they already had, so Wellness
    is untouched -- but it is booked for today, which is the third same-day
    booking and tips Spontaneous over.
  */
  it('announces only what the booking actually completed', async () => {
    await openBooking(live);

    await userEvent.click(screen.getByRole('button', { name: /charge ₱2,400 to room/i }));

    expect(await screen.findByText(/you.re now spontaneous/i)).toBeInTheDocument();
    expect(screen.queryByText(/you.re now wellness/i)).not.toBeInTheDocument();
  });
});
