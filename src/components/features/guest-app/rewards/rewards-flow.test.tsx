import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BADGES, BADGE_FAMILIES, findBadge } from './badge-model';
import { BadgeMedal, glyphFor } from './badge-medal';

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
