# Premium welcome screen design

**Date:** September 9, 2026
**Status:** Implemented with the approved two-stage splash revision

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
- a short welcome headline;
- one sentence that explains that the guest can connect an existing booking;
- three concise benefits that explain what connecting a booking unlocks;
- one primary **Find my booking** action.

Remove the collection badge, destination count, carousel controls, promotional
property copy, feature tiles, account creation, and login. Do not place room QR
or hotel Wi-Fi actions on the welcome screen.

The composition fills the available mobile viewport. Keep the primary action
visible above the safe-area inset without scrolling. Use the existing typeface,
brand color, and button conventions, but reduce visible interface chrome.

## Booking and check-in flow

Selecting **Find my booking** opens the existing booking-access flow. That flow
can expose the supported ways to access a stay, including booking details, a
room QR, and the hotel Wi-Fi route. These are booking-access methods, not
welcome-screen content.

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

- the root route shows the welcome headline and **Find my booking**;
- account creation, login, feature tiles, destination counts, and carousel
  controls are absent;
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
