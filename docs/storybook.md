# Cabana Storybook

Run `npm run storybook` to browse the shared component and screen catalog at
`http://localhost:6006`.

Start with `Cabana / Pages / Guest app` for full application context. The Page,
Stay context, and Connection controls let you inspect every registered app
screen across representative guest states. The app shell and product
components stay intact, so page compositions remain visible as the guest sees
them.

Use `Cabana / Design system / Component gallery` for shared foundations and
reusable UI patterns. Use `Cabana / Patterns / Booking lifecycle` to inspect a
vendor booking card against its actual state transitions and event history.

Add a story beside the component or feature it documents. Prefer a real app
screen or a component set that reflects a production page. Isolated controls
belong in the design-system gallery when their own state or API needs review.

Storybook displays the stories the repository defines. It does not discover or
create missing components automatically; a future GitHub assistant can generate
or update these stories from repository code.

## AI tools

The Storybook MCP addon exposes the live story catalog, component documentation,
and development tools to Codex. Start Storybook with `npm run storybook` before
using those tools. This repository registers the server at
`http://127.0.0.1:6006/mcp` in `.codex/config.toml` and enables the component
manifest so Codex can discover documented components and their stories.

The MCP setup is for design and development work. It does not enable Storybook's
test toolset, and the server only describes components that have stories or
documentation in this catalog.
