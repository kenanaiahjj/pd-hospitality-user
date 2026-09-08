# Guest app prototype design

## Outcome

Build a self-contained, clickable guest-app prototype for The Henry's Hotels pilot. The prototype must make the entry, pre-arrival, offline wallet, front desk chat, marketplace, service cancellation, folio, and account flows testable without real APIs, authentication, or payments.

## Product shape

The home route becomes a neutral mobile working surface sized for a 390 x 844 viewport. It reuses the repository's existing design-system typography, controls, spacing, and component patterns without adding official branding. A compact prototype control opens the complete screen inventory and guided flows A-I. Each screen uses realistic mock stay data and exposes the active connectivity state.

The interface prioritizes the Stay QR, the current stay, and on-property services. It does not include hotel discovery, public marketing, stored value, door access, additional-guest accounts, nearby vendors, localization, loyalty, flights, ferries, or e-Travel.

## Architecture

- `prototype-model.ts` defines the 38 screen IDs, guided scenarios, mock data, cancellation logic, and offline action rules.
- `guest-app-prototype.tsx` owns in-memory prototype state and renders all interactive screens.
- `guest-app-prototype.css` provides the neutral responsive mobile shell and semantic component states.
- The existing server-rendered home page imports the interactive client component.

All prototype data stays in memory. Connectivity can be toggled manually. Chat sends and pre-registration submissions queue offline; capacity and payment actions are blocked offline.

## Interaction and accessibility

Use native buttons, links, inputs, selects, and textareas. Every field has a visible label. Icon-only controls have accessible names. Status changes use live regions. The scenario panel uses a native dialog and returns focus when it closes. Touch targets are at least 44 pixels.

## Verification

Unit tests cover the exact 38-screen inventory, scenario entry points, cancellation cutoffs, and the offline action matrix. Component tests cover entry-path access and the offline Stay QR. Run the full test, type-check, lint, and production build commands before completion.
