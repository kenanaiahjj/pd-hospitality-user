# Cabana — hospitality guest app

Cabana is a mobile-first guest-stay app prototype: a light, neutral canvas with
white surfaces, hairline separators, and a single pink accent reserved for the
primary action. It covers arrival, stay access, hotel services, bookings, folio,
and front-desk support, and it is built with Asbir Sans.

The home route opens the guest app. The design-system gallery is available at
`/components`. See
[docs/design-system.md](docs/design-system.md) for the component taxonomy, token
layers, and interaction contracts.

## Getting started

**Prerequisites** — Node.js `>=20.9` (Next 16's floor; developed on 24.x) and npm.
No database, no external services: the boilerplate boots against a public
placeholder API.

```bash
git clone https://github.com/lmfventures/templify.git
cd templify
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000 for the guest app. Open
http://localhost:3000/components for the 36-pattern design-system gallery. The
dashboard at `/dashboard` continues to exercise the template's full data path
(route handler → typed API layer → upstream).

### Environment

`src/config/env.ts` parses `process.env` with zod **at module load**, so a
missing or malformed value fails the boot with a readable error rather than
surfacing on the first request. Copy `.env.example` and adjust:

| Variable | Required | Default | Notes |
|---|---|---|---|
| `API_BASE_URL` | yes | `https://jsonplaceholder.typicode.com` (from `.env.example`) | Upstream the server-side client calls. Must be a valid URL. |
| `API_TOKEN` | no | — | Bearer token for the upstream. Server-only — never prefix it `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_APP_URL` | no | `http://localhost:3000` | Public origin, used for absolute internal fetches during SSR. |

Adding a variable means editing the schema in `src/config/env.ts` *and*
`.env.example` in the same commit — the parse is the only gate.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on port 3000 (Turbopack) |
| `npm run build` | Production build; runs typecheck and prerenders |
| `npm start` | Serve a build produced by `npm run build` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest run, once (jsdom + Testing Library) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run lint` | ESLint flat config — React Compiler rules are **errors**, not warnings |
| `npm run lint:fix` | Same, with autofix |

Before calling a change done, run the full gate:

```bash
npm run typecheck && npm run lint && npm run build && npm test
```

Tests live beside what they test, as `*.test.ts` / `*.test.tsx` under `src/`.
They stub the network at the `internalApi` seam rather than at the transport,
so the "only one HTTP client" rule holds in tests too.

### Troubleshooting

- **Typecheck fails on a page you deleted.** Stale `.next/types`. `rm -rf .next`
  and re-run.
- **Boot dies with "Invalid server environment variables".** A var in
  `serverSchema` is missing from `.env.local` — the message names it.
- **`serverEnv() was called in the browser`.** Server-only config reached a
  Client Component; move the call into a Server Component or route handler.

## Structure

```
src/
  app/                        # routes only — thin, no business logic
    (marketing)/              # route group: own layout, no URL segment
      layout.tsx
      page.tsx
    api/                      # route handlers (BFF layer)
      users/route.ts          # GET (list) + POST (create)
      users/[id]/route.ts     # GET one
    dashboard/
      layout.tsx  page.tsx  loading.tsx  error.tsx
    layout.tsx  not-found.tsx  globals.css
  components/
    ui/                       # dumb, reusable primitives
      button.tsx  card.tsx  input.tsx  spinner.tsx
    features/
      users/                  # feature-specific composed components
        user-card.tsx  user-list.tsx  user-search.tsx
        user-create-form.tsx  user-detail.tsx
  lib/
    api/                      # the fetch wrapper + configured clients
      client.ts               # axios wrapper (headers, timeout, zod, errors)
      errors.ts               # ApiError
      instances.ts            # internalApi — browser-safe, talks to this app's BFF
      instances.server.ts     # externalApi — server-only (`server-only` guarded)
      users.ts                # typed functions per resource
    queries/                  # BROWSER-side data access (TanStack Query)
      client.ts               # createQueryClient — cache and retry policy
      provider.tsx            # QueryProvider, mounted in the root layout
      bff.ts                  # reads the { data } envelope from a route handler
      users.ts                # userQueries + userMutations
    hooks/                    # use-debounce
    utils/                    # cn, format, http (route-handler helpers)
    validators/               # zod schemas
  types/                      # shared TS types (inferred from schemas)
  config/                     # env (zod-validated), constants
  test/                       # test helpers (render-with-query)
```

## The data flow

There is exactly one place that performs HTTP, and one place that owns each URL.

```
Server Component  ──────────────────────────────────►  usersApi.list()  ─►  externalApi  ─►  upstream
Client Component  ─►  useQuery(userQueries.list())  ─►  /api/users  ─►  usersApi.list()  ─►  externalApi  ─►  upstream
```

- **`lib/api/client.ts`** — the only HTTP client in the app, an axios instance
  pinned to `adapter: 'fetch'` so Next's cache directives still apply. Adds base
  URL, headers, query serialization, JSON body handling, a request timeout, and
  turns any failure into an `ApiError` with a `status` and a stable `code`. Pass a zod
  `schema` and you get a parsed, typed result; a mismatched upstream payload
  fails as `502 invalid_response` instead of leaking through your types.
- **`lib/api/users.ts`** — one typed function per operation. Components never
  know the upstream path, auth or cache tags. Server-only.
- **`app/api/users/route.ts`** — the BFF. Validates input with zod, delegates to
  `usersApi`, wraps the result in the app's envelope. The `route()` helper turns
  every thrown error into consistent JSON, so no handler needs a try/catch.
- **`lib/queries/users.ts`** — the browser's door to the data. Key and fetcher
  are declared together in one `queryOptions()` call, so a cache key can never
  drift from the function that fills it; `userMutations.create()` takes the
  `QueryClient` and invalidates `['users']` itself. Server twin of this file is
  `lib/api/users.ts` — same resource, different side of the wire.
- **`lib/queries/bff.ts`** — the read-side mirror of `ok()`: one place unwraps
  the `{ data }` envelope and validates the payload against its zod schema.

Responses use one envelope (`src/types/api.ts`):

```jsonc
{ "data": [ { "id": 1, "name": "…", "email": "…" } ] }
{ "error": { "message": "Invalid request body", "code": "validation_error",
             "fields": { "email": ["Enter a valid email address"] } } }
```

Try it:

```bash
curl -s "localhost:3000/api/users?pageSize=2"
curl -s "localhost:3000/api/users?pageSize=999"      # 422 with field messages
curl -s -X POST localhost:3000/api/users -H 'content-type: application/json' -d '{"name":"a","email":"nope"}'
```

## Conventions worth keeping

- **Routes are thin.** A `page.tsx` composes components and awaits a `lib/api`
  function. Business logic never lives under `app/`.
- **Types are inferred, not written twice.** `src/types/user.ts` derives `User`
  from `userSchema`, so the validator is the single source of truth.
- **Server-only stays server-only.** `serverEnv()` throws if called in the
  browser, and `API_TOKEN` only ever reaches `externalApi`. `lib/utils/index.ts`
  deliberately does not re-export `http.ts` (it imports `next/server`).
- **Env fails fast.** `src/config/env.ts` parses `process.env` with zod at
  module load, so a missing variable breaks the boot, not the first request.
- **Adding a resource** = a schema in `lib/validators/`, a type in `types/`, a
  server `lib/api/<resource>.ts`, a route handler, and a browser
  `lib/queries/<resource>.ts`. Five small files, always the same shape.
- **Client data goes through a query factory.** Components never call
  `internalApi` directly — they call `useQuery(userQueries.list())`. Keys are
  hierarchical (`['users'] → ['users','list'] → ['users','list',params]`), so
  invalidating the root reaches lists and details alike.

## Notes

`API_BASE_URL` defaults to `jsonplaceholder.typicode.com` so the boilerplate runs
with no setup — point it at your own API and delete the `users` example.

## Working in this repo with Claude Code

`CLAUDE.md` carries the architecture invariants and the local Superpowers
workflow (brainstorm → spec → plan → worktree → execute → review).

Specs live in `docs/superpowers/specs/`, plans in `docs/superpowers/plans/`.
Each has a template; start one with:

```bash
./scripts/new-spec.sh projects-resource
./scripts/new-plan.sh add-projects-resource
```

Both stamp today's date into the filename and the document's status header.

## License

MIT — see [LICENSE](LICENSE).
