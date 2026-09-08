# Guest app Klarna-light redesign

## Outcome

Restyle the consumer guest prototype with Klarna-inspired component geometry and density while keeping the approved hospitality palette predominantly light. The experience remains pink, white, and black, uses generic hospitality photography, and does not include Klarna or hotel branding.

## Product boundary

The root route remains the interactive consumer mobile app. The `/components` route remains the design-system catalog. Existing guest journeys, prototype data, offline behavior, booking behavior, navigation destinations, and form outcomes remain unchanged.

## Visual direction

Use a white screen canvas, pink feature surfaces, black primary actions, and restrained neutral dividers. Dark surfaces appear only in focused identity and wallet moments. Translate the reference app's component treatment through large headings, compact page rhythm, flat rounded surfaces, dense list groups, full-width actions, circular utility buttons, image-led service cards, and minimal bottom navigation.

This is a component-language adaptation. Do not copy Klarna trademarks, logos, copy, product names, illustrations, or payment-specific content.

## Layout and hierarchy

- Render one full-height app surface without a desktop prototype frame.
- Keep content centered in a single column with a 720 px maximum width for browser previews.
- Use 16 px mobile gutters and safe-area-aware top and bottom padding.
- Use 32–36 px screen titles with tight leading and 16 px minimum body text for primary content.
- Separate major page sections with 24–32 px vertical space.
- Group related list rows in one shared surface with internal dividers instead of placing an outline around every row.

## Component treatment

### App bar

Use a quiet white app bar with compact connection and room context. Back, profile, and utility controls use 44 px circular hit targets. Avoid decorative borders around the full bar unless content scrolls beneath it.

### Feature cards

Use one dominant feature card near the top of Home. The Stay QR card uses a saturated pink surface, black text, a compact status pill, and a white QR action tile. Service discovery uses large landscape photography with copy below the image rather than text overlays.

### Buttons and selections

Use a full-width black primary button with white text on light screens. Use a white primary button with black text on dark wallet surfaces. Use light-pink fills for selected secondary controls. Choice rows use a single stacked group with leading icons and trailing radio or check indicators.

### Lists and cards

Use 56–72 px list rows with clear text hierarchy, compact icon backgrounds, and optional trailing chevrons. Remove unnecessary borders and shadows. Use a border only when it communicates selection, focus, or a semantic boundary.

### Bottom navigation

Keep four destinations: Stay, Services, Wallet, and Chat. Use simple line icons and short labels. Mark the active destination with pink and black, without adding a large floating or ornamental element.

### Imagery

Use stable remote Unsplash URLs for dining, spa, restaurants, tours, transfers, and amenities. Render images edge-to-edge with `object-fit: cover`, keep text outside the image, and preserve a pink gradient fallback when an image fails or is unavailable.

## Architecture

Keep `GuestAppPrototype` as the stateful flow controller. Extract repeated presentation concerns only where the redesign needs consistent behavior:

- a reusable remote service image with loading and failure fallback;
- grouped list and choice-row presentation;
- image-led service cards;
- shared app-bar and bottom-navigation treatments.

Keep screen state and navigation in the current in-memory prototype model. Do not add a router migration, backend, persistence layer, image-management system, or new product flow.

## Interaction and failure behavior

Preserve all existing button destinations and form submissions. Maintain 44 px minimum interactive targets, visible keyboard focus, semantic button and form elements, and reduced-motion behavior. Remote image failures reveal the pink fallback without hiding service names or actions. Offline booking remains blocked, cached identity remains available, and queued chat behavior remains unchanged.

## Component catalog

Update `/components` only where shared styling must match the redesigned app. The catalog must continue to show the reusable design-system components rather than becoming a second product screen.

## Verification

- Add or update tests for image mapping, image fallback, unchanged primary navigation, and existing offline states.
- Run the guest-app and route tests.
- Run the complete test suite, typecheck, lint, and production build.
- Inspect Home, Services, a service listing, hotel and vendor details, Wallet, Chat, and `/components` at the mobile viewport.
- Confirm that the page reads as a consumer app, the main palette remains pink, white, and black, photography has a visible fallback, and no Klarna branding appears.

## Source reference

Use the current official Klarna consumer mobile app listing as visual evidence for component styling only: <https://play.google.com/store/apps/details?id=com.myklarnamobile>.
