# Guest app color-system alignment

## Outcome

The guest app uses the existing design system's pink, white, and black visual
language. The change does not add hotel branding, a logo, or a new palette.

## Token architecture

Promote the existing gallery primitives for ink, paper, line, and pink accent
to shared semantic tokens in `src/app/globals.css`. Both the component gallery
and the guest app consume those shared values. Keep guest-specific token names
as aliases so the current component styles do not need structural changes.

| Guest token | Shared design-system role |
| --- | --- |
| `--guest-ink` | Black ink |
| `--guest-paper` | White surface |
| `--guest-bg` | Cool-white app background |
| `--guest-line` | Neutral border |
| `--guest-soft` | Soft pink surface |
| `--guest-blue` | Pink interactive accent |

Green, amber, and red remain restricted to success, warning, and error states.
They do not become decorative brand colors.

## Component behavior

Primary actions remain black with white text, matching the design-system button
contract. Pink marks selection, focus, supporting surfaces, and key highlights.
Large content surfaces remain white so the app stays readable and functional.

## Scope

This change affects color tokens only. It does not change navigation, content,
screen structure, interaction behavior, mock data, or the `/components` route.

## Verification

- Run the guest-app and route tests.
- Run the full test, typecheck, lint, and production-build gates.
- Inspect `/` in the browser and confirm black primary actions, white surfaces,
  pink accents, and unchanged semantic status colors.
- Inspect `/components` and confirm that its existing Klarna color lens is
  visually unchanged.
