# Cabana state workbench

Temporary component and state catalog at `/states`. Remove `src/app/states` to remove the workbench. It imports production components and never changes them.

## Implementation plan

- Inventory exported UI components, guest primitives, screen registry and booking state tables.
- Render actual components through props or the existing injected-session boundary in a preview iframe. Use realistic Cabana fixtures without browser session persistence.
- Use `__component` and `__state` as URL state; support back/forward, arrows and H to hide the inspector.
- Build booking fixtures through the engine's public events, with a visible transition graph and event history. Mark engine-only limit approval states explicitly.
- Keep nonisolated components visible in the coverage list instead of manufacturing unsupported fixtures or altering their props.
- Verify all registered presets in a real browser, URL restoration, invalid-state fallback, state-event transitions, mobile layout and no writes to the guest session. Retain a JSON report and screenshots.

## Failure modes before implementation

- A deep link can point to a missing component or state.
- Preview data can vanish across a server boundary.
- Timers or persisted state can override the selected fixture.
- A state transition can bypass the engine's allowed events.
- Modal and fixed-position components can escape the stage.
- State switching or browser back can desynchronize URL and preview.
- Keyboard shortcuts can capture text entry.
- A registry entry can look successful while rendering no actual component.
- An engine-only feature can be presented as guest-app behavior.

## Browser verification

Run `node src/app/states/verify.mjs`. The script uses the bundled Playwright runtime and installed Chrome; set `STATES_URL` to change the default `http://localhost:3000`. It writes `reports/states/results.json` and screenshots. This is a browser check, separate from the app's existing unit suite.
