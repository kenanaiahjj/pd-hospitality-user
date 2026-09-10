# Premium welcome screen design

**Date:** September 9, 2026
**Status:** Implemented with the approved two-stage splash and onboarding-pager revisions

## Goal

Replace the current content-heavy entry hub with a focused, premium hospitality
welcome screen. The screen introduces the Henry Hotels and Cabana guest
experience, then directs the guest to find a booking. It does not present
account creation or login as entry paths.

After the guest accesses a booking and completes any required check-in steps,
the app opens the guest home screen for that booking.

## Welcome screen

Open with a short, full-screen pink Cabana splash that centers the complete
logo and tagline. Fade the splash into a white welcome screen with a smaller
Cabana lockup at the top and the booking content near the bottom.

The screen contains only:

- the Cabana or Henry guest-app identity near the top;
- one illustration per benefit, shown one at a time;
- the step's stage label and title, in the screen-title slot directly above the
  action;
- a step indicator;
- one primary **Find my booking** action.

The three benefits are an onboarding pager rather than a static list. It
advances on its own, and a step indicator below the artwork doubles as
navigation; a horizontal swipe on the artwork pages it too. Autoplay is a
courtesy, not a control: the first guest interaction hands paging over
permanently, and autoplay never starts when reduced motion is requested.

The rotating step title occupies the slot the welcome headline used to hold, so
there is no separate headline or explanatory sentence on the screen. A heading
remains in the accessibility tree for the screen's name, because a visible
heading that rewrote itself every few seconds would not be a stable one.

**Superseded:** earlier revisions of this section required a short welcome
headline, one explanatory sentence, and the absence of carousel controls. The
pager replaces all three by direction of the human partner.

Remove the collection badge, destination count, promotional property copy,
feature tiles, account creation, and login. Do not place room QR or hotel Wi-Fi
actions on the welcome screen. The step indicator is progress and navigation
for the pager, not a competing action -- **Find my booking** stays the screen's
only action and is never gated behind reaching the last step.

The composition fills the available mobile viewport. Keep the primary action
visible above the safe-area inset without scrolling. Use the existing typeface,
brand color, and button conventions, but reduce visible interface chrome.

## Booking and check-in flow

Selecting **Find my booking** opens the existing booking-access flow. That flow
can expose the supported ways to access a stay, including booking details, a
room QR, and the hotel Wi-Fi route. These are booking-access methods, not
welcome-screen content.

Each access method is a tappable card carrying its own illustration, so the
three choices are told apart by picture as well as by label. These cards are
deliberately not the app's plain list row: a repeated list row takes a bare
glyph, because a screen of tinted discs marking nothing was the loudest thing
in the app. Here the picture is the point, and there are only three.

The booking flow preserves the existing validation and recovery states. A
failed lookup stays in the booking flow and provides a clear retry or recovery
action.

When the guest successfully accesses a booking:

- If no additional check-in information is required, open the home screen for
  the selected booking.
- If check-in information is required, complete those steps and then open the
  home screen.
- If the guest returns to an already connected booking, open the home screen
  directly.

The home screen remains the established stay dashboard. It exposes the active
or upcoming stay and its relevant actions, including the Stay QR, services,
folio, and front-desk contact when those actions are available.

## Component boundaries

The welcome screen is a focused entry component. It owns the splash, brand
treatment, welcome copy, booking benefits, and primary action. It does not own
booking data or authentication state.

The booking-access flow owns lookup methods, validation, recovery, and booking
selection. On success, it resolves the applicable booking and routes through
required check-in steps before entering the existing home variant.

The existing home components remain responsible for rendering booking-specific
content. This change does not redesign the home screen.

## Accessibility and responsive behavior

- Keep the primary action at least 44 CSS pixels high.
- Preserve visible keyboard focus and semantic button behavior.
- Keep the splash decorative so assistive technology reaches the welcome
  content without waiting for the visual transition.
- Maintain sufficient text contrast on both brand surfaces.
- Respect mobile safe-area insets and dynamic viewport height.
- Skip the splash animation when reduced motion is requested.

## Verification

Automated tests must confirm that:

- the root route shows the first step's title and **Find my booking**;
- account creation, login, feature tiles, and destination counts are absent;
- the pager shows one step at a time, exposes only the current step to
  assistive tech, and its indicator moves the pager;
- **Find my booking** is enabled on every step;
- the welcome screen does not show primary navigation;
- **Find my booking** opens the booking-access flow;
- successful booking access enters the correct home screen immediately when no
  check-in work remains;
- a completed check-in enters the correct home screen;
- room QR and hotel Wi-Fi access remain available within the booking flow.

Browser verification must cover the welcome screen at a representative mobile
viewport, the transition into booking access, and the transition from a
successful booking or completed check-in into the home screen.

## Out of scope

- Redesigning the guest home screen
- Adding account creation or login
- Adding a hotel discovery or collection-marketing experience
- Changing booking validation rules
- Changing Stay QR, folio, service, or front-desk behavior
