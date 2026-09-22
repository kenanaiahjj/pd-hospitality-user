'use client';

import Image from 'next/image';
import {
  Baby, Bank, Barbell, BookOpen, Briefcase, CalendarCheck, CalendarPlus, ChatText,
  Coffee, Compass, Confetti as ConfettiGlyph, CookingPot, DeviceMobile, Door, Eye,
  Flower, ForkKnife, Globe, Hammer, Handshake, HourglassHigh, House, Island,
  Lightning, Lock, MapTrifold, Martini, MoonStars, Mountains, NavigationArrow, QrCode,
  Repeat, Scissors, SealCheck, Sparkle, Star, Storefront, SunHorizon, Tray, User,
  Users, UsersThree, Waves,
} from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';

import { BADGE_FAMILIES } from './badge-model';
import type { BadgeDefinition } from './badge-model';

/*
  A badge, as an object.

  `DESIGN.md` governs chrome -- surfaces, controls, type, the canvas. A badge
  is not chrome. It is content, the same category as the full-bleed story
  photography already in `promoted/`, which does not obey the restrained
  palette either. A badge has to stand out from the regular UI or it is not a
  reward, and the quiet everywhere else is exactly what lets it.

  So the medal goes maximal and nothing around it moves: no tile, no card, no
  frame. It sits on the neutral canvas with its name beneath it, and every
  surface and control around it stays as the design system specifies.

  Artwork is generated separately, against `docs/badge-art-prompts.md`, and
  does not exist yet. Until it does the medal draws itself from its family's
  shape and enamel plus a Phosphor glyph -- which makes this a deliverable
  rather than a placeholder, because it is what the flow demos with. Adopting
  a real asset is one field on one badge.
*/

/**
 * Explicit, not `import * as`.
 *
 * The whole icon set is 1,512 components; pulling it in by namespace to index
 * it with a string defeats tree-shaking and ships all of them. The cost is
 * that a new badge needs a line here, and `rewards-flow.test.tsx` fails until
 * it gets one -- which is the point, since a glyph that does not resolve
 * renders an empty enamel field and looks exactly like artwork that failed.
 */
const GLYPHS: Record<string, Icon> = {
  Baby, Bank, Barbell, BookOpen, Briefcase, CalendarCheck, CalendarPlus, ChatText,
  Coffee, Compass, Confetti: ConfettiGlyph, CookingPot, DeviceMobile, Door, Eye,
  Flower, ForkKnife, Globe, Hammer, Handshake, HourglassHigh, House, Island,
  Lightning, MapTrifold, Martini, MoonStars, Mountains, NavigationArrow, QrCode,
  Repeat, Scissors, SealCheck, Sparkle, Star, Storefront, SunHorizon, Tray, User,
  Users, UsersThree, Waves,
};

/**
 * For tests and anything outside a render. Components read `GLYPHS` directly.
 *
 * The React Compiler rejects `const Glyph = glyphFor(...)` with "cannot create
 * components during render": it cannot prove a function call returns a stable
 * reference, only that a module constant's property is one. Indexing the map
 * inline is the same lookup and compiles; routing it back through this helper
 * to tidy it up turns a lint error back on.
 */
export const glyphFor = (name: string): Icon | undefined => GLYPHS[name];

export type BadgeMedalProps = {
  badge: BadgeDefinition;
  earned: boolean;
  /** 28 inline · 48 in grids and rows · 64 in the legacy sheet · 144 on detail. */
  size?: 28 | 48 | 64 | 112 | 144;
  /** Adds a clipped light sweep to the medal artwork itself. */
  shimmer?: boolean;
  /**
   * Hidden from assistive technology, for a medal inside something already
   * named. Two announcements of the same badge is worse than one: a button
   * holding both the medal and its label reads "Foodie Foodie".
   */
  decorative?: boolean;
};

export function BadgeMedal({ badge, earned, size = 48, shimmer = false, decorative = false }: BadgeMedalProps) {
  const family = BADGE_FAMILIES[badge.family];
  const Glyph = GLYPHS[badge.glyph];

  return (
    <span
      className={`badge-medal${earned ? '' : ' badge-medal--locked'}${shimmer ? ' badge-medal--shimmer' : ''}`}
      data-family={badge.family}
      data-shape={family.shape}
      {...(decorative
        ? { 'aria-hidden': true }
        : {
            role: 'img',
            /*
              The locked state is a filter, and a filter says nothing to a
              screen reader. Without this the only difference between a badge
              someone has earned and one they have not is a visual one.
            */
            'aria-label': earned ? badge.name : `${badge.name} — not yet earned`,
          })}
      style={{
        '--medal-size': `${size}px`,
        '--medal-enamel': family.enamel,
      } as React.CSSProperties}
    >
      {!earned ? (
        <span className="badge-medal__locked-field">
          <Lock className="badge-medal__lock" weight="fill" aria-hidden="true" />
        </span>
      ) : badge.art ? (
        <Image src={badge.art} alt="" width={size * 4} height={size * 4} />
      ) : (
        <span className="badge-medal__field">
          {Glyph ? <Glyph weight="duotone" aria-hidden="true" /> : null}
        </span>
      )}
    </span>
  );
}
