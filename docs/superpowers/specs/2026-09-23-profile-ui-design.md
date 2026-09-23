# Profile UI polish

**Status:** Scope approved by the user on 2026-09-23.

## Goal

Make the guest Profile screen easier to scan while keeping its current information and actions. Preserve the existing Cabana light surface, restrained accent color, and hairline dividers.

## Current screen

The screen presents the guest name and recognition message, contact details, passport status, Achievements, Stay history, and Sign out. The signed-in shell uses a flat layout rather than stacked cards.

## Design

- Keep the guest name as the page heading and retain the recognition message.
- Remove the redundant “Personal space” eyebrow and shorten “Your account” to “Account.”
- Keep the identity block flat. Align the avatar, email, and phone as one compact group.
- Make passport status easier to identify with a document icon, clear “Passport on file” text, the existing last four digits, and the existing “On file” status.
- Keep Achievements and Stay history in one list. Align their icons, labels, supporting counts, and chevrons consistently; preserve the existing actions and data.
- Keep Sign out separate from account navigation, with its existing sign-out action and danger-colored icon.

## Constraints

- Do not add profile fields, settings, destinations, or new behavior.
- Do not change profile data, authentication, or bottom navigation.
- Use existing `.guest-*` styles and theme tokens. Do not add gradients, stacked cards, or new animation.
- Preserve keyboard focus visibility, accessible names, and comfortable mobile touch targets.

## Acceptance criteria

- The Profile screen keeps the current information and actions.
- A guest can scan identity, passport status, account destinations, and Sign out as distinct groups.
- The layout fits narrow mobile widths without horizontal overflow.
- Existing navigation and sign-out behavior remain unchanged.
