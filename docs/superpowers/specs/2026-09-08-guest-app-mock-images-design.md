# Guest app mock-image design

## Outcome

Replace abstract service artwork with contextual hospitality photography from
Unsplash. The imagery remains generic and unbranded so official property assets
can replace it later without changing the interface.

## Image set

Use one landscape image for each service context:

| Context | Subject |
| --- | --- |
| In-room dining | Filipino or hotel breakfast service |
| Spa and massage | A calm massage or treatment room |
| Restaurants and bar | A refined restaurant interior or table setting |
| Activities and tours | A Philippine island or boat excursion |
| Transfers | A clean passenger vehicle or airport pickup |
| Other amenities | A pool, lounge, or hotel amenity |

Use the spa image for the featured marketplace card and service-detail screen.
Use the dining image for the hotel-operated service-detail screen. Category and
listing cards use the image that matches their service context.

## Presentation

- Render images edge-to-edge inside the existing visual containers.
- Use `object-fit: cover` with a centered focal point.
- Preserve the current radii and card dimensions.
- Keep text outside the image instead of overlaying it.
- Keep the pink design-system gradient behind every image as its loading and
  error fallback.

## Delivery and failure behavior

Use stable `images.unsplash.com` URLs rather than query-based random-image URLs.
Allow only the Unsplash image CDN in the Next.js image configuration. Render
through `next/image` with responsive `sizes`, meaningful alt text where the
image conveys service context, and an empty alt only where the same service name
is already adjacent.

If an image cannot load, hide the broken image and reveal the existing pink
gradient and icon. The app must remain navigable with remote images disabled.

## Scope

This change adds mock imagery to service and marketplace surfaces only. It does
not add property photography, logos, official colors, tracking, image uploads,
or image-management features.

## Verification

- Verify each service context resolves to the intended image URL.
- Verify the image CDN returns an image content type.
- Test the mapping and fallback behavior.
- Run tests, typecheck, lint, and the production build.
- Inspect Home, Services, a service listing, and both service-detail variants in
  the browser.
