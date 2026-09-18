# Guest app test suite — triage

`src/components/features/guest-app/guest-app-prototype.test.tsx`, **63 failing**
as of `c06717a`. Every other file in the suite is green (455 passing).

Written because "fix the failing tests" turned out to hide three very different
problems, and only one of them is safe to fix without a product ruling.

## The headline

**Almost nothing here is a stale selector.** Of the strings these tests look
for, only two — `"This stay so far"` and `"All Items"` — are absent from the
app. Everything else still exists; the tests simply cannot reach the screen it
lives on, or the feature it belonged to was removed wholesale.

That matters because the obvious repair — updating assertions until they match
what renders — would have silently erased a real bug. It already nearly did:
see *Already fixed* below.

## Already fixed (`c06717a`)

- **A genuine regression.** Continuing with Apple or Google landed on "Log in
  with a booking", asking a guest to look up the reservation they were already
  holding. `getPostAuthScreen()` existed and was used elsewhere; this call site
  had a screen hardcoded past it. Four tests recovered.
- Two real renames: `guest-scan-action` → `guest-room-qr-action`, and the
  dining category "Dining" → "Food & Drinks".

## Group A — the feature was removed, so the test is obsolete (7)

All seven dining-cart tests fail on `Add Crispy Calamari`. The venue screen no
longer has a menu or a cart: `restaurant-menu` renders `EstablishmentChatScreen`,
an enquiry surface, introduced in `8144c6c` and kept through the promotion.

- builds and edits a venue cart before opening order review
- keeps independent carts for each dining establishment
- clears only the establishment cart that was confirmed
- confirms a dining order once and adds its grouped total to the room folio
- supports scheduled pickup for a dining order
- preserves an offline dining cart and blocks submission
- disables room delivery until a room is assigned

**Ruling needed.** These were specced in
`docs/superpowers/specs/2026-09-09-dining-venue-carts-design.md`. Either in-app
dining carts were deliberately superseded by the enquiry screen — in which case
these tests and `restaurant-cart` should be deleted — or the menu was lost by
accident and the app needs restoring. I can't tell which from the code, and
guessing either way is expensive.

## Group B — suspected regressions, like the SSO one (6)

Each expects an affordance that still exists in the source but is no longer
reachable where the test looks. These are the ones most likely to be real bugs.

| Test | Expects |
|---|---|
| puts the scan in the app bar, reachable from every screen | `guest-room-qr-action` in the app bar |
| marks the scan while the room is still unverified | `/Scan room code, room not yet verified/` |
| drops the home row once the room is verified | one scan affordance only |
| reaches the front desk before arrival | `guest-front-desk-action` |
| keeps the desk reachable for 24 hours, and says how long is left | `guest-front-desk-action` |
| docks the front desk above the tab bar rather than burying it | `/Message the front desk/` |

The scan trio has its own shipped spec (scan discoverability); "reachable from
every screen" is a stated product intent, not an implementation detail. The
front-desk trio is complicated by the other session **currently adding a Chat
tab**, which moves that affordance again — those three should wait for it.

## Correction — Group C was wrong (2026-09-18)

Working through it turned up a second regression of the same kind as the SSO
one, and then the pattern behind both.

**The finished-stay treatment on My Stay is gone.** Its plan
(`docs/superpowers/plans/2026-09-11-finished-stay-summary-and-rebooking.md`)
opens: *"On a finished stay, My Stay reads as a settled receipt — the stay
total including the room, with the docked action becoming `Book another
stay`."* It was marked ✅ Complete on 2026-09-11. A guest who checks out now
sees a live-stay screen with an empty "Upcoming (0)" and no receipt; the only
link out goes to the folio.

`git log -S` places it exactly: `4257752` (the promotion) added those strings,
and **`420c356` — "refactor: preserve main flow wiring in promotions" —
removed them.** The commit named for preserving the main flow is the one that
dropped it.

So the shape of this whole file is not "stale tests". It is:

> The promotion reorganised the app and dropped several shipped features. The
> suite has been correctly reporting that ever since, and it reads as noise
> because nobody sorted it.

Confirmed lost so far, each with a shipped spec behind it:

| Feature | Tests | Spec |
|---|---|---|
| SSO lands on the booking-linked home | 4 | fixed in `c06717a` |
| Finished-stay receipt + rebook on My Stay | 4–5 | `2026-09-11-finished-stay-summary-and-rebooking` |
| Scan reachable from every screen | 3 | scan discoverability |
| Front desk docked above the tab bar | 3 | `13e9c32` |
| Post-stay review entry point | 3 | moved onto "Check out now" |

**Editing these assertions to match the app would erase the evidence.** They
should be treated as a restore-or-drop decision per feature, not as test
maintenance. Roughly 17 of the 51 are in this class; the rest really are copy
and path drift.

## Group C — cascades, safe to fix (was 50, now ~34)

The rest. The target exists, the path to it changed. These are mechanical once
the path is traced: SSO entry, menu filters and sorts, folio totals, profile
re-entry, post-stay, announcements, Explore Nearby headings.

Two in this group need a value rather than a path: `13 dishes` and `5 venues`
are counts that moved with the catalogue, and `"This stay so far"` /
`"All Items"` are the only genuinely deleted strings.

## Recommended order

1. Rule on Group A — it is 7 tests and one decision.
2. Fix Group C, which is the bulk and carries no product risk.
3. Leave the front-desk half of Group B until the Chat tab lands.
4. Treat the scan trio as a bug report, not a test failure.
