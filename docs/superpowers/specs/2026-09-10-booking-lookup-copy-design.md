# Booking lookup copy refinement

**Status:** Approved for implementation
**Date:** September 10, 2026
**Surface:** Connected booking flow in `src/components/features/guest-app/`

## Problem

The booking-connection flow explains the same idea in several places. Long
leads, internal terms, reassurance copy, and a fallback action that does not
match its destination make a simple lookup feel heavier than it is.

## Goal

Make the flow understandable at a glance for a guest who already has a hotel
booking. Keep the current visual system, route structure, fixture data, and
state behavior unchanged.

## Design

Use a surgical copy pass across the connected booking flow. Remove copy that
repeats the task or explains Cabana's product boundary before the guest needs
that context. Use sentence case, direct verbs, and the same booking terms
throughout.

### Shared entry options

`BookingEntryOptions` is shared by the entry hub and the connect-stay screen.
Update the first option so its visible title and accessible label are
`Confirmation number`, with the detail `From your hotel or booking site`.
Update the room option detail to `Scan the code in your room`. Keep both
destinations and their illustrations unchanged.

### Connect-stay screen

- Keep the eyebrow `Connect your stay`.
- Keep the title `Find your booking`.
- Replace the lead with `Choose how to connect your stay.`.
- Remove the `You’ll need a booking first` notice. The no-booking state owns
  that explanation.

### Booking lookup

- Keep the eyebrow and title.
- Replace the lead with `Enter the number from your booking confirmation.`.
- Keep the `Booking or confirmation number` label.
- Replace `Any format` with the example placeholder `HEN-241109`.
- Replace the helper with `Hotel, Agoda, or Booking.com reference` so the
  supported sources remain clear without using `OTA` jargon.
- Keep the `Last name` label and use `Santos` as the fixture example.
- Keep `Find booking` as the primary action.
- Replace `I can’t find my booking` with `Find another way`.

### Alternate lookup

- Replace the eyebrow with `Try another way`.
- Replace the title with `Use more booking details`.
- Replace the lead with `Enter the details from your booking.`.
- Remove the `No match yet` notice and its repeated reassurance.
- Keep the last-name, check-in-date, and property fields.
- Rename `Search again` to `Continue to front desk` because the existing
  destination is `front-desk-assist`.

### Front-desk fallback

- Replace the eyebrow `Human fallback` with `Front desk help`.
- Replace the title with `Let the front desk connect you`.
- Replace the lead with `Ask for a secure link or a 6-digit code.`.
- Keep the contact details, code field, `Connect my stay` action, and booking
  recovery route.
- Use `Call front desk` for the icon button's accessible label.

### No-booking state

- Replace the eyebrow with `No booking found`.
- Replace the title with `Connect a hotel booking`.
- Replace the lead with `Cabana connects to confirmed hotel bookings.`.
- Keep the `Already booked?` notice title.
- Replace its body with `Try your confirmation number or ask the front desk
  for a link.`.
- Keep the retry destination and rename `Contact the front desk` to
  `Contact front desk`.

### Matched booking

- Replace the eyebrow `Match found` with `Booking found`.
- Keep the title `Is this your stay?`.
- Replace the lead with `Check the details, then continue.`.
- Rename the summary label `Source` to `Booked through`.
- Replace `Yes, this is my stay` with `Use this booking`.
- Replace `This isn’t my booking` with `Use a different booking`.

## Boundaries

This change does not add booking search, validation, network behavior, new
screens, new components, or new design tokens. It does not change the room QR,
Wi-Fi, account, or pre-arrival copy outside text shared by the entry-option
component.

The fallback route remains a prototype transition to front-desk assistance.
The new action label makes that existing destination explicit; it does not
claim that the prototype performs a second live lookup.

## Verification

Update the focused guest-app assertions for the approved copy. Verify that:

1. The entry option opens the lookup form.
2. A booking lookup still opens the matched-booking screen.
3. The matched-booking confirmation still reaches the upcoming stay.
4. The no-booking state still offers lookup retry and front-desk help.
5. The source scan contains no stale copy from the refined states.
6. The focused test file, full test suite, build, and `git diff --check`
   pass.
