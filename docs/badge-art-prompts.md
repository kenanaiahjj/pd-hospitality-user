# Cabana — achievement badge art direction & generation prompts

Everything needed to generate the 42-badge collectible set for the Cabana guest
app's loyalty flow. Self-contained: hand this file to an image-generation
assistant and it has the full system, the prompts, and the production spec.

---

## Why these break the house style on purpose

`DESIGN.md` governs **chrome** — surfaces, controls, type, the canvas the app is
built from. Restraint, hairlines, one pink accent with three jobs, no
decoration. A badge is not chrome. It is **content**, the same category as the
full-bleed story photography and the bright banners already in the explore
flow, none of which obey the restrained palette either.

A badge has to stand out from the regular UI or it is not a reward. And it can:
the quiet everywhere else is precisely what makes it land. A lush artefact in a
lush app is noise — in a quiet app it is an event.

So the artwork goes maximal and the screen around it does not move. No tile, no
card, no frame. The badge sits as an object on the neutral canvas with its name
beneath it in Asbir Sans, and every surface, hairline and control around it
stays exactly as the design system specifies. The single pink progress track
under an unearned badge is the only accent on the screen.

---

## Instructions for an assistant reading this file

1. Run **Prompt 1** first to produce a style sheet of six badges. Show the
   result and let the human pick one before going further.
2. Attach the chosen style sheet as a **reference image** for every subsequent
   generation. Consistency comes from the reference image, not from the words.
3. For each row in the six tables below, substitute `[SHAPE]`, `[COLOUR]` and
   `[ICON]` into **Prompt 2** and generate one badge. Shape and colour come
   from the family heading; the icon comes from the row.
4. Save each result to `public/badges/<id>.png` using the `id` column.
5. Follow the **Production notes** at the end — particularly the background
   transparency requirement, which is not optional.

If a badge drifts from the set, re-attach the style sheet and regenerate rather
than rewriting the prompt.

---

## The collection system

Two things make 42 badges read as one collection rather than 42 pictures:
**shape encodes family, and enamel colour encodes family.** Only the icon
changes within a family. The rose-gold rim and near-black navy field are
identical on every single badge.

| Family | What it tracks | Shape | Enamel |
|---|---|---|---|
| **Taste** | what the guest books | circle | hot pink `#FF7EB3` |
| **Company** | who they travel with | rounded shield | warm gold `#E8B44F` |
| **Rhythm** | how and when they book | hexagon | teal `#2FA8A0` |
| **Place** | where they've stayed | pentagon | ocean blue `#3D7BD6` |
| **House** | behaviours the property values | rounded square | sage `#6FAE7C` |
| **Venue** | per-venue recognition | capsule | deep rose `#B92159` |

Reference palette: rose gold metal `#E0A090` → `#B76E79`, field `#1C1B24`.

**No text on any badge.** The app renders the badge name beneath the artwork in
Asbir Sans — sharper, translatable, accessible, and free of the lettering
artefacts image models produce.

---

## Prompt 1 — style sheet

Run once. Pick the best result and use it as the reference image for all 42.

```
A collection of six premium collectible achievement badges, arranged in a grid
on a pure black background. Rendered as real physical die-struck hard-enamel
pins — tactile objects photographed in a studio, not flat illustrations.

Identical construction on every badge:
- A raised, polished ROSE GOLD metal rim with a 3D bevel and a fine inner step,
  catching a warm specular highlight along its upper edge
- Inside the rim, a deep near-black navy enamel field (#1C1B24)
- Behind the central motif, a subtle radiating sunburst of thin darker rays
  fanning out from the centre
- One bold, simplified, vector-clean icon centred in the field, filled with
  glossy hard enamel in a single saturated colour, edged with a thin rose-gold
  outline, with a crisp glossy specular highlight across its upper surface
- Two or three small four-point sparkle glints in rose gold, scattered
  asymmetrically in the field
- A soft warm outer bloom where the metal catches the light

The six badges, each a different shape and enamel colour:
1. CIRCLE, hot pink enamel (#FF7EB3) — a fork and a knife crossed
2. ROUNDED SHIELD, warm gold enamel (#E8B44F) — a briefcase with a clasp
3. HEXAGON, teal enamel (#2FA8A0) — a lightning bolt
4. PENTAGON, ocean blue enamel (#3D7BD6) — a small island with one palm tree
5. ROUNDED SQUARE, sage green enamel (#6FAE7C) — an open eye
6. CAPSULE, deep rose enamel (#B92159) — a shopfront with an awning

Style: glossy, jewel-like, premium. Slight three-quarter perspective so the
metal reads as raised. Soft studio lighting, gentle bloom, rich reflections in
the enamel. Clean simple iconography inside a richly rendered metal object.
Cohesive set — same rim, same field, same lighting on all six.

Absolutely no text, no lettering, no numbers, no words anywhere.
Square composition. Pure black background.
```

---

## Prompt 2 — per-badge template

Attach the style sheet as a reference image. Substitute the three bracketed
slots from the tables below.

```
One single collectible achievement badge, centred on a pure black background,
in exactly the style of the reference image.

Construction:
- A raised polished ROSE GOLD metal rim with a 3D bevel and fine inner step,
  catching a warm specular highlight along its upper edge
- Shape of the badge: [SHAPE]
- Inside the rim, a deep near-black navy enamel field (#1C1B24) with a subtle
  radiating sunburst of thin darker rays fanning from the centre
- Centred in the field: [ICON], bold and simplified, filled with glossy hard
  enamel in [COLOUR], edged with a thin rose-gold outline, with a crisp glossy
  specular highlight across its upper surface
- Two or three small four-point rose-gold sparkle glints scattered
  asymmetrically around the icon
- Soft warm outer bloom on the metal

Glossy, jewel-like, premium. Slight three-quarter perspective. Soft studio
lighting. A real physical enamel pin, not a flat illustration.

No text, no lettering, no numbers. Square composition. Pure black background.
The icon must fill roughly 55% of the badge's inner field.
```

---

## Taste — 14

`[SHAPE]` = **a circle** · `[COLOUR]` = **hot pink enamel (#FF7EB3)**

| # | Badge | id | Earned by | `[ICON]` |
|---|---|---|---|---|
| 1 | Foodie | `foodie` | 3 dining bookings, any venue | a fork and a knife crossed |
| 2 | Caffeine | `caffeine` | 3 café visits | a steaming coffee cup on a saucer |
| 3 | Sundowner | `sundowner` | 3 bar, rooftop or sunset bookings | a martini glass with a single olive |
| 4 | Night owl | `night-owl` | 3 bookings scheduled after 7 PM | a crescent moon with two small stars |
| 5 | Early riser | `early-riser` | 3 bookings scheduled before 9 AM | a half sun rising over a horizon line |
| 6 | Room service | `room-service` | 3 in-room dining orders | a domed room-service tray, held flat |
| 7 | Homegrown | `homegrown` | 3 Filipino experiences | a lidded cooking pot with rising steam |
| 8 | Wellness | `wellness` | 3 spa treatments | a five-petal flower blossom |
| 9 | Well groomed | `well-groomed` | 2 nails, barber or facial bookings | a pair of open scissors |
| 10 | In training | `in-training` | 3 gym sessions or personal training | a barbell |
| 11 | Culture | `culture` | 2 museum, gallery or heritage walks | a classical building facade with columns and a pediment |
| 12 | Outdoors | `outdoors` | 3 tours or activities | two overlapping mountain peaks |
| 13 | Sea legs | `sea-legs` | 3 water bookings — pool, cruise, dive | three stacked wave lines |
| 14 | Maker | `maker` | 2 workshops or classes | a claw hammer |

## Company — 6

`[SHAPE]` = **a rounded shield** · `[COLOUR]` = **warm gold enamel (#E8B44F)**

| # | Badge | id | Earned by | `[ICON]` |
|---|---|---|---|---|
| 15 | Solo | `solo` | 2 stays at 1 guest | a single person silhouette, head and shoulders |
| 16 | Pair | `pair` | 2 stays at 2 guests | two overlapping person silhouettes |
| 17 | Family | `family` | kids club, babysitting, or a stay with 3+ guests | a baby's head in silhouette with a single curl of hair |
| 18 | Group | `group` | a stay booking 2+ rooms | three person silhouettes side by side |
| 19 | Business | `business` | meeting room or business centre, or 2 midweek one-nighters | a briefcase with a handle and a clasp |
| 20 | Host | `host` | a celebration setup, or a table for 4+ | a party popper bursting with confetti |

## Rhythm — 8

`[SHAPE]` = **a hexagon** · `[COLOUR]` = **teal enamel (#2FA8A0)**

| # | Badge | id | Earned by | `[ICON]` |
|---|---|---|---|---|
| 21 | Weekender | `weekender` | 2 stays of exactly 2 nights | a calendar page with a checkmark |
| 22 | Long stay | `long-stay` | one stay of 5+ nights | an hourglass with sand falling |
| 23 | Direct booker | `direct-booker` | 2 stays booked direct | two hands clasped in a handshake |
| 24 | Switched | `switched` | first direct stay following an OTA-booked one | two arrows curving into a closed loop |
| 25 | Planner | `planner` | 3 services booked 7+ days ahead | a calendar page with a plus sign |
| 26 | Spontaneous | `spontaneous` | 3 same-day bookings | a lightning bolt |
| 27 | Regular | `regular` | 3 stays at one property | a simple house with a pitched roof |
| 28 | Pre-checked | `pre-checked` | pre-registration finished before arrival, twice | a wax seal with a checkmark inside |

## Place — 7

`[SHAPE]` = **a pentagon** · `[COLOUR]` = **ocean blue enamel (#3D7BD6)**

| # | Badge | id | Earned by | `[ICON]` |
|---|---|---|---|---|
| 29 | Island hopper | `island-hopper` | stays in 2 cities | a small island with a single palm tree |
| 30 | Estate explorer | `estate-explorer` | 4 of 13 properties | a folded paper map |
| 31 | Archipelago | `archipelago` | stays in 5 cities | a globe with meridian lines |
| 32 | Luzon to Mindanao | `luzon-to-mindanao` | a stay in all three island groups | a compass needle pointing north-east |
| 33 | Full estate | `full-estate` | all 13 properties | a four-point compass rose |
| 34 | New opening | `new-opening` | a property within 90 days of it opening | a single four-point sparkle star |
| 35 | Homecoming | `homecoming` | back to a property after 12+ months away | an open doorway with light coming through |

## House — 4

`[SHAPE]` = **a rounded square** · `[COLOUR]` = **sage green enamel (#6FAE7C)**

| # | Badge | id | Earned by | `[ICON]` |
|---|---|---|---|---|
| 36 | Scanned in | `scanned-in` | room code scanned on 3 stays | a QR code square with corner markers |
| 37 | Good notes | `good-notes` | stay survey completed 3 times | a speech bubble with three lines of text inside |
| 38 | Self sufficient | `self-sufficient` | 5 services booked in-app rather than at the desk | a mobile phone, screen facing forward |
| 39 | First look | `first-look` | reported a room ready before housekeeping did | an open eye |

## Venue — 3 patterns, generated per venue

`[SHAPE]` = **a capsule (rounded oblong)** · `[COLOUR]` = **deep rose enamel (#B92159)**

| # | Badge | id | Earned by | `[ICON]` |
|---|---|---|---|---|
| 40 | Venue regular | `venue-regular` | 3 visits to one venue | a shopfront with a striped awning |
| 41 | Venue opener | `venue-opener` | booked a venue within 30 days of it listing | a five-point star |
| 42 | Menu explorer | `menu-explorer` | 5 different items ordered at one venue | an open book |

These three are templates. Every venue in `RESTAURANTS` and every operator in
`SERVICES` inherits them — *Kape Manila regular*, *Hilom regular*, *Azotea
regular* — so the artwork is generated once and the venue name is rendered in
type beneath it, not baked into the image.

---

## Production notes

**One asset per badge, not two.** The locked state is CSS over the earned
artwork, not a second render:

```css
filter: grayscale(1) brightness(0.45);
opacity: 0.55;
```

42 assets, 84 states.

**Generate large, downsample.** Request 1024px square; export to 192px — 4× the
48px display size, which covers 3× screens with headroom.

**Transparency is required, not optional.** Pure black backgrounds composite
badly onto the app's light neutral canvas. The outer bloom must be preserved as
alpha rather than baked onto black, or every badge sits in a dark halo on a
white surface. If the model cannot emit transparency, key the black out and
rebuild the bloom as alpha in post.

**Naming.** `public/badges/<id>.png`, using the `id` column above.

**Display sizes.** 28px inline (beside the guest's name, on a pre-arrival note
to the property) · 48px in grids and rows · 64px in the detail sheet.

**Earn animation.** Scale `0.96 → 1` over 220ms on
`cubic-bezier(0.23, 1, 0.32, 1)`, with the existing `confetti.tsx`. Reduced
motion keeps the fade and drops both the movement and the confetti.

---

## Cutting to 36

If the set needs to be exactly 36, cut these six first — each is the thinnest
evidence base in its family: **Well groomed**, **Maker**, **Group**,
**Long stay**, **Archipelago**, **Menu explorer**.
