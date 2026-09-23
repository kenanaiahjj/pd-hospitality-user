import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MOCK_SESSION, PAST_STAYS, SCREENS, applyPrototypeStayState } from '../prototype-model';
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
const rewardsStyles = readFileSync(resolve(process.cwd(), 'src/components/features/guest-app/rewards/rewards.css'), 'utf8');

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

  it('uses a lock treatment for unearned badges', () => {
    render(<BadgeMedal badge={{ ...anyBadge, art: undefined }} earned={false} />);

    const medal = screen.getByRole('img', { name: /not yet earned/i });
    expect(medal).toHaveClass('badge-medal--locked');
    expect(medal.querySelector('.badge-medal__locked-field')).not.toBeNull();
    expect(medal.querySelector('.badge-medal__lock')).not.toBeNull();
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
    expect(screen.getByRole('heading', { name: 'In progress' })).toBeInTheDocument();
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
  it('announces an in-progress badge as one non-interactive thing', () => {
    renderShelf();

    expect(screen.getByRole('group', {
      name: 'Culture — Two museums or heritage walks, 1 of 2',
    })).toBeInTheDocument();
  });

  it('does not make an in-progress badge tappable', () => {
    const onOpenBadge = renderShelf();

    const rows = screen.getAllByTestId('badge-progress-row');

    expect(within(rows[0]!).queryByRole('button')).not.toBeInTheDocument();
    expect(onOpenBadge).not.toHaveBeenCalled();
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
      title: 'Achievements',
    });
  });

  it('opens the hub from Profile and derives everything on the spot', async () => {
    render(<GuestAppPrototype initialSession={MOCK_SESSION} initialScreen="profile" />);

    const door = screen.getByRole('button', { name: /achievements/i });
    expect(within(door).getByText(/13 badges · 37,220 points/)).toBeInTheDocument();

    await userEvent.click(door);

    expect(screen.getByRole('heading', { level: 1, name: 'Your achievements' })).toBeInTheDocument();
    expect(screen.getByText('37,220')).toBeInTheDocument();
    expect(screen.getByText('13 earned')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Foodie' })).toBeInTheDocument();
    expect(document.querySelector('.guest-achievements-overview')).toBeInTheDocument();
    expect(document.querySelector('.guest-achievements-overview__image')).toBeInTheDocument();
    expect(document.querySelector('.guest-achievements-points')).toBeInTheDocument();
  });

  it('keeps the achievements hub on one quiet grouped-surface system', () => {
    expect(rewardsStyles).toMatch(/\.guest-achievements-page \.badge-shelf\s*\{[\s\S]*?padding:\s*0;[\s\S]*?background:\s*transparent;[\s\S]*?box-shadow:\s*none/);
    expect(rewardsStyles).toMatch(/\.guest-achievements-page \.badge-shelf__held\s*\{[\s\S]*?background:\s*var\(--guest-surface\);[\s\S]*?border:\s*1px solid var\(--guest-line\);/);
    expect(rewardsStyles).toMatch(/\.guest-achievements-page \.badge-shelf__rows\s*\{[\s\S]*?background:\s*var\(--guest-paper\);[\s\S]*?border:\s*1px solid var\(--guest-line\);/);
    expect(rewardsStyles).toMatch(/\.guest-achievements-page \.reward-menu\s*\{[\s\S]*?padding:\s*0;[\s\S]*?background:\s*transparent;[\s\S]*?box-shadow:\s*none/);
    expect(rewardsStyles).toMatch(/\.guest-achievements-page \.estate-map\s*\{[\s\S]*?padding:\s*0;[\s\S]*?background:\s*transparent;[\s\S]*?box-shadow:\s*none/);
  });

  it('gives earned badge labels room to wrap on narrow screens', () => {
    expect(rewardsStyles).toMatch(/\.guest-achievements-page \.badge-shelf__held\s*\{[\s\S]*?padding:\s*12px;/);
    expect(rewardsStyles).toMatch(/\.guest-achievements-page \.badge-shelf__held li > \*\s*\{[\s\S]*?min-block-size:\s*104px;[\s\S]*?padding:\s*14px 8px 12px;/);
    expect(rewardsStyles).toMatch(/@media \(max-width:\s*480px\)[\s\S]*?\.guest-achievements-page \.badge-shelf__held\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3/);
  });

  /* Rewards lives inside Profile, so the bar must not lose its highlight. */
  it('keeps the Profile tab current while rewards is open', async () => {
    render(<GuestAppPrototype initialSession={MOCK_SESSION} initialScreen="profile" />);
    await userEvent.click(screen.getByRole('button', { name: /achievements/i }));

    const profileTab = screen.getByRole('button', { name: /^profile$/i });
    expect(profileTab).toHaveAttribute('aria-current', 'page');
  });
});


describe('the badge detail page', () => {
  const openRewards = async () => {
    render(<GuestAppPrototype initialSession={MOCK_SESSION} initialScreen="profile" />);
    await userEvent.click(screen.getByRole('button', { name: /achievements/i }));
  };

  /*
    A badge derived from spend is a profile, and one that appears unannounced
    reads as surveillance. Showing the bookings behind it is what makes it an
    inference the guest can argue with rather than a verdict.
  */
  it('shows the bookings that earned a badge', async () => {
    await openRewards();

    await userEvent.click(screen.getByRole('button', { name: 'Foodie' }));

    const detail = screen.getByTestId('badge-detail');
    expect(within(detail).getByRole('heading', { level: 1, name: 'Foodie' })).toBeInTheDocument();
    expect(within(detail).getByText('Dinner for two · Azotea Rooftop')).toBeInTheDocument();
    expect(within(detail).getByText('Drinks and snacks · The Poolside Bar')).toBeInTheDocument();
    expect(detail.querySelector('.badge-medal--shimmer')).toBeInTheDocument();
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
    await userEvent.click(screen.getByRole('button', { name: /achievements/i }));

    expect(screen.queryByRole('button', { name: 'Foodie' })).not.toBeInTheDocument();
    expect(screen.getByText('12 earned')).toBeInTheDocument();
  });

  it('shows what is left on a badge still in progress without opening it', async () => {
    await openRewards();

    const cultureRow = screen.getAllByTestId('badge-progress-row').find((row) => (
      within(row).queryByText('Culture')
    ));

    expect(cultureRow).toBeDefined();
    expect(within(cultureRow!).getByText(/1\s+of\s+2/)).toBeInTheDocument();
    expect(within(cultureRow!).getByText('Two museums or heritage walks')).toBeInTheDocument();
    expect(within(cultureRow!).queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('badge-detail')).not.toBeInTheDocument();
  });

  it('goes back without changing anything', async () => {
    await openRewards();
    await userEvent.click(screen.getByRole('button', { name: 'Foodie' }));

    await userEvent.click(screen.getByRole('button', { name: 'Go back' }));

    expect(screen.queryByTestId('badge-detail')).not.toBeInTheDocument();
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
    await userEvent.click(screen.getByRole('button', { name: /achievements/i }));
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


describe('points where money is already being discussed', () => {
  const live = applyPrototypeStayState('live');

  it('offers the balance against the folio', () => {
    render(<GuestAppPrototype initialSession={live} initialScreen="folio" />);

    expect(screen.getByText(/38,220 points/)).toBeInTheDocument();
    expect(screen.getByText(/₱3,800 off this bill/)).toBeInTheDocument();
  });

  /*
    The scan is the one earn that costs the property nothing and saves it real
    desk time, so it is worth saying out loud at the moment it happens.
  */
  it('pays for scanning the room code, on the screen that follows the scan', () => {
    render(<GuestAppPrototype initialSession={live} initialScreen="room-qr-midstay" />);

    expect(screen.getByText(/\+1,000 points/)).toBeInTheDocument();
  });

  /*
    Stated on a receipt for a stay already taken, where it cannot be argued
    with -- never as a prompt before one. This is the whole zero-CAC mechanic
    in a single line.
  */
  it('says what an OTA stay would have earned booked direct', async () => {
    render(<GuestAppPrototype initialSession={live} initialScreen="stay-history" />);

    const agoda = PAST_STAYS.find((stay) => stay.source === 'Agoda')!;
    await userEvent.click(screen.getAllByRole('button', { name: new RegExp(agoda.property, 'i') })[0]!);

    // Split across <b> tags, so read the sentence rather than a text node.
    const line = document.querySelector('.stay-earned') as HTMLElement;
    expect(line.textContent?.replace(/\s+/g, ' ')).toContain('4,110 points');
    expect(line.textContent?.replace(/\s+/g, ' '))
      .toContain('6,860 points instead of 1,960 on the room');
  });

  it('says nothing of the kind on a stay already booked direct', async () => {
    render(<GuestAppPrototype initialSession={live} initialScreen="stay-history" />);

    const direct = PAST_STAYS.find((stay) => stay.source === 'Direct booking')!;
    await userEvent.click(screen.getAllByRole('button', { name: new RegExp(direct.property, 'i') })[0]!);

    const line = document.querySelector('.stay-earned') as HTMLElement;
    expect(line.textContent).toContain('22,370 points');
    expect(line.textContent).not.toContain('instead of');
  });
});
