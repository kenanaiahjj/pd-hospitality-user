# Onboarding and stay-aware home flows progress

- Task 1 — `npx vitest run src/components/features/guest-app/prototype-model.test.ts`; PASS with booking priority, home derivation, and fixture coverage; `c50efcf`.
- Task 2 — `npx vitest run src/components/features/guest-app/guest-app-prototype.test.tsx`; PASS with booking lookup, onboarding completion, room QR linking, and pre-arrival routing; `4702e8e`, `ff5b676`.
- Task 3 — `npx vitest run src/components/features/guest-app/guest-app-prototype.test.tsx`; PASS with active, upcoming, multiple-upcoming, completed, and empty home variants; `3fc7dd0`.
- Task 4 — `npx vitest run src/components/features/guest-app/guest-app-prototype.test.tsx src/components/features/guest-app/prototype-model.test.ts`; PASS with room-charge confirmation, cancellation, My bookings, folio continuity, and offline rules; `c843f6a`.
- Task 5 — `npx vitest run src/components/features/guest-app/guest-app-prototype.test.tsx`; PASS with visual-state, accessibility, focus-visible, target-size, imagery, and reduced-motion contracts; `ff5b676`.
- Task 6 — `API_BASE_URL=https://jsonplaceholder.typicode.com npm run typecheck && API_BASE_URL=https://jsonplaceholder.typicode.com npm run lint && API_BASE_URL=https://jsonplaceholder.typicode.com npm run build && API_BASE_URL=https://jsonplaceholder.typicode.com npm test`; PASS with 19 test files and 94 tests; Chrome preview at `http://localhost:3001/` verified onboarding, room QR, active home, services, confirmation, My bookings, and folio; this execution record.

The unscoped build command still requires the pre-existing `API_BASE_URL`
environment variable for the unrelated dashboard server environment contract.
No unrelated configuration or dirty-worktree files were changed to bypass it.
