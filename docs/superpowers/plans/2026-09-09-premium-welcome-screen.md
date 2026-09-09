# Premium Welcome Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the promotional entry hub with a full-viewport booking-first welcome screen and route successful booking access or completed check-in into the correct booking home.

**Architecture:** Keep `entry-hub` as the public route state, but render it through a focused `WelcomeScreen` component inside the existing prototype module. Hide the standard app chrome only for that state. Keep booking lookup, room QR, and hotel Wi-Fi in their existing screens, then update successful room linking and online pre-arrival completion to enter `stay-overview` directly.

**Tech Stack:** Next.js 16.3.4 App Router, React 19.2.8, TypeScript, `next/image`, Phosphor Icons, CSS, Vitest, Testing Library

## Global constraints

- The welcome screen must contain no account creation or login action.
- **Find my booking** must be the only welcome-screen action.
- Room QR and hotel Wi-Fi must remain available inside the booking-access flow.
- A successful booking with no remaining check-in work must open Home.
- Completing required online check-in work must open Home.
- This change must not redesign Home or change booking validation rules.
- Preserve all unrelated working-tree changes and stage only files changed by this implementation.
- Follow the local Next.js Image documentation in `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md`: a `fill` image requires a positioned parent, a meaningful `sizes` value, and an empty `alt` value when the image is decorative.

---

## File structure

- Modify `src/components/features/guest-app/guest-app-prototype.tsx`: add the focused welcome component, hide shell chrome on `entry-hub`, remove carousel and pillar code, and route successful access to Home.
- Modify `src/components/features/guest-app/guest-app-prototype.css`: replace the old promotional welcome styles with a full-viewport media, scrim, brand, copy, and action composition.
- Modify `src/components/features/guest-app/guest-app-prototype.test.tsx`: specify the reduced welcome surface and direct-to-Home transitions.
- Modify `src/app/(marketing)/page.test.tsx`: keep the root-route contract aligned with the focused welcome screen.

### Task 1: Lock the focused welcome contract with failing tests

**Files:**
- Modify: `src/components/features/guest-app/guest-app-prototype.test.tsx`
- Modify: `src/app/(marketing)/page.test.tsx`

**Interfaces:**
- Consumes: `GuestAppPrototype` and `HomePage` as currently exported.
- Produces: executable requirements for the `entry-hub` DOM and its primary transition.

- [ ] **Step 1: Replace the promotional welcome assertions**

In `src/components/features/guest-app/guest-app-prototype.test.tsx`, replace the current welcome test and delete the carousel interaction test. Use this contract:

```tsx
it('opens on a focused booking-first welcome screen without app chrome', () => {
  render(<GuestAppPrototype />);

  expect(screen.getByText('Cabana', { exact: true })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Welcome to your stay' })).toBeInTheDocument();
  expect(screen.getByText('Find your booking to check in and access everything you need during your stay.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Find my booking' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /create account/i })).toBeNull();
  expect(screen.queryByRole('button', { name: /log in/i })).toBeNull();
  expect(screen.queryByRole('button', { name: /room qr/i })).toBeNull();
  expect(screen.queryByRole('button', { name: /hotel wi-fi/i })).toBeNull();
  expect(screen.queryByText(/13 destinations/i)).toBeNull();
  expect(screen.queryByRole('region', { name: /experience showcase/i })).toBeNull();
  expect(screen.queryByRole('banner')).toBeNull();
  expect(screen.queryByRole('navigation', { name: 'Primary navigation' })).toBeNull();
});
```

Replace the current **Find my booking** transition test with:

```tsx
it('opens the booking access methods from the welcome action', async () => {
  const user = userEvent.setup();
  render(<GuestAppPrototype />);

  await user.click(screen.getByRole('button', { name: 'Find my booking' }));

  expect(screen.getByRole('heading', { name: 'Find your booking' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Booking email' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Continue with room QR' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Open hotel Wi-Fi entry' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Update the root-route test**

In `src/app/(marketing)/page.test.tsx`, replace the current test body with:

```tsx
it('renders the booking-first welcome screen at the root route', () => {
  render(<HomePage />);

  expect(screen.getByText('Cabana', { exact: true })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Welcome to your stay' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Find my booking' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /create account/i })).toBeNull();
  expect(screen.queryByRole('button', { name: /log in/i })).toBeNull();
  expect(screen.queryByRole('navigation', { name: 'Primary navigation' })).toBeNull();
});
```

- [ ] **Step 3: Run the focused tests and confirm the expected failure**

Run:

```bash
npm test -- src/components/features/guest-app/guest-app-prototype.test.tsx 'src/app/(marketing)/page.test.tsx'
```

Expected: FAIL because the current page still renders `Your stay starts here`, room QR, hotel Wi-Fi, destination copy, and the carousel.

- [ ] **Step 4: Commit the failing contract**

```bash
git add -- src/components/features/guest-app/guest-app-prototype.test.tsx 'src/app/(marketing)/page.test.tsx'
git commit -m "test: define premium booking welcome"
```

### Task 2: Build the full-viewport premium welcome screen

**Files:**
- Modify: `src/components/features/guest-app/guest-app-prototype.tsx`
- Modify: `src/components/features/guest-app/guest-app-prototype.css`
- Test: `src/components/features/guest-app/guest-app-prototype.test.tsx`
- Test: `src/app/(marketing)/page.test.tsx`

**Interfaces:**
- Consumes: `getPropertyImage(propertyOrName?: string)`, `CabanaFullLockup`, `Button`, `Image`, and the existing `go(next)` navigation function.
- Produces: `WelcomeScreen({ onFindBooking }: { onFindBooking: () => void })` and the `.guest-welcome*` style contract.

- [ ] **Step 1: Remove the promotional welcome helpers**

In `guest-app-prototype.tsx`, delete `WELCOME_SLIDES`, `WelcomeHeroCarousel`, and `WelcomePillars`. Remove the now-unused `Buildings`, `CreditCard`, and `Key` imports. Keep `Sparkle` because other guest-app screens still use it.

- [ ] **Step 2: Add the focused welcome component**

Add this component above `GuestAppPrototype`:

```tsx
function WelcomeScreen({ onFindBooking }: { onFindBooking: () => void }) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = getPropertyImage('The Henry Manila');

  return (
    <section className="guest-welcome" aria-labelledby="guest-welcome-title">
      <div className={`guest-welcome__media ${imageFailed ? 'is-error' : ''}`} aria-hidden="true">
        <div className="guest-welcome__fallback" />
        <Image
          src={image.src}
          alt=""
          fill
          priority
          sizes="(max-width: 719px) 100vw, 480px"
          style={{ objectPosition: image.focalPoint }}
          className="guest-welcome__image"
          onError={() => setImageFailed(true)}
        />
      </div>
      <div className="guest-welcome__scrim" aria-hidden="true" />
      <div className="guest-welcome__content">
        <CabanaFullLockup className="guest-welcome__brand" markWidth={48} tagline="" />
        <div className="guest-welcome__message">
          <p className="guest-welcome__eyebrow">The Henry Hotels</p>
          <h1 id="guest-welcome-title">Welcome to your stay</h1>
          <p>Find your booking to check in and access everything you need during your stay.</p>
          <Button
            className="guest-button guest-button--primary guest-welcome__action"
            type="button"
            onClick={onFindBooking}
          >
            Find my booking<ArrowRight aria-hidden="true" />
          </Button>
        </div>
      </div>
    </section>
  );
}
```

Replace the `entry-hub` branch with:

```tsx
case 'entry-hub':
  return <WelcomeScreen onFindBooking={() => go('connect-booking')} />;
```

- [ ] **Step 3: Make the booking access hub account-neutral**

Replace the `connect-booking` branch with:

```tsx
case 'connect-booking':
  return (
    <ScreenIntro
      eyebrow="Connect your stay"
      title="Find your booking"
      text="Choose the way you arrived here. You can use your booking details, a room QR, or the hotel Wi-Fi connection."
    >
      <BookingEntryOptions onNavigate={go} />
      <Notice title="A booking is required">
        Cabana starts after a confirmed hotel booking. It does not search or compare hotels.
      </Notice>
    </ScreenIntro>
  );
```

- [ ] **Step 4: Remove app chrome from the welcome state**

Before the component return, add:

```tsx
const isWelcome = activeScreen === 'entry-hub';
```

Change the `<section>` opening tag to:

```tsx
<section className={`guest-device ${isWelcome ? 'is-welcome' : ''}`} aria-label="Cabana guest app">
```

Prefix the current header opening tag with the conditional:

```tsx
{!isWelcome ? <header className="guest-appbar" data-scrolled={scrolled}>
```

Change the current header closing tag from `</header>` to:

```tsx
</header> : null}
```

Change only the `className` expression on the screen container to:

```tsx
className={`guest-screen ${showNav ? 'has-nav' : ''} ${isWelcome ? 'guest-screen--welcome' : ''}`}
```

Do not change the header children, screen scroll handler, rendered screen, or bottom navigation expression.

- [ ] **Step 5: Replace the old welcome CSS**

Delete the blocks for `.guest-welcome-brand-*`, `.guest-welcome-hero*`, `.guest-welcome-intro`, `.guest-welcome-pillars*`, `.guest-welcome-actions`, `.guest-welcome-booking-link`, and the unused `.guest-welcome-card*` fallback.

Add:

```css
.guest-device.is-welcome {
  background: #171312;
}

.guest-screen--welcome {
  padding: 0;
  overflow: hidden;
}

.guest-welcome {
  position: relative;
  display: flex;
  min-height: 100%;
  overflow: hidden;
  isolation: isolate;
  color: #fff;
  background: #171312;
}

.guest-welcome__media,
.guest-welcome__scrim {
  position: absolute;
  inset: 0;
}

.guest-welcome__media {
  background: linear-gradient(145deg, #8f7466, #2f2723);
}

.guest-welcome__fallback {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 72% 18%, rgb(255 224 190 / 28%), transparent 34%),
    linear-gradient(145deg, #8f7466, #2f2723 72%);
}

.guest-welcome__image {
  object-fit: cover;
  transform: scale(1.015);
}

.guest-welcome__media.is-error .guest-welcome__image {
  display: none;
}

.guest-welcome__scrim {
  z-index: 1;
  background:
    linear-gradient(180deg, rgb(10 8 7 / 42%) 0%, transparent 28%),
    linear-gradient(180deg, transparent 36%, rgb(10 8 7 / 30%) 58%, rgb(10 8 7 / 90%) 100%);
}

.guest-welcome__content {
  position: relative;
  z-index: 2;
  display: flex;
  width: 100%;
  min-height: 100%;
  flex-direction: column;
  padding: max(28px, env(safe-area-inset-top)) 24px max(24px, calc(18px + env(safe-area-inset-bottom)));
}

.guest-welcome__brand {
  width: 154px;
  color: #fff;
  filter: drop-shadow(0 1px 8px rgb(0 0 0 / 24%));
}

.guest-welcome__message {
  display: grid;
  gap: 0;
  margin-top: auto;
}

.guest-welcome__eyebrow {
  margin: 0 0 10px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgb(255 255 255 / 78%);
}

.guest-welcome__message h1 {
  max-width: 9ch;
  margin: 0;
  font-size: clamp(40px, 11vw, 54px);
  font-weight: 650;
  line-height: 0.98;
  letter-spacing: -0.045em;
  color: #fff;
  text-wrap: balance;
}

.guest-welcome__message > p:not(.guest-welcome__eyebrow) {
  max-width: 31ch;
  margin: 18px 0 26px;
  font-size: 16px;
  line-height: 1.5;
  color: rgb(255 255 255 / 82%);
}

.guest-app .guest-welcome__action {
  min-height: 56px;
  box-shadow: 0 10px 30px rgb(0 0 0 / 24%);
}
```

In the hover media query, remove `.guest-welcome-card:hover`, `.guest-welcome-hero:hover`, and `.guest-welcome-pillar:hover` from the shared selector list.

- [ ] **Step 6: Run the focused tests**

```bash
npm test -- src/components/features/guest-app/guest-app-prototype.test.tsx 'src/app/(marketing)/page.test.tsx'
```

Expected: PASS for the new welcome contract and the transition into the three booking-access methods.

- [ ] **Step 7: Commit the welcome implementation**

```bash
git add -- src/components/features/guest-app/guest-app-prototype.tsx src/components/features/guest-app/guest-app-prototype.css src/components/features/guest-app/guest-app-prototype.test.tsx 'src/app/(marketing)/page.test.tsx'
git commit -m "feat: add premium booking welcome"
```

### Task 3: Enter Home after successful access or completed check-in

**Files:**
- Modify: `src/components/features/guest-app/guest-app-prototype.tsx`
- Modify: `src/components/features/guest-app/guest-app-prototype.test.tsx`

**Interfaces:**
- Consumes: `withActiveRoom(current)`, `connectBooking(session)`, `getPostAuthScreen(session)`, and the existing `stay-overview` renderer.
- Produces: direct `stay-overview` routing for room QR access and online pre-arrival completion.

- [ ] **Step 1: Update the room QR expectation**

Replace the current room QR test with:

```tsx
it('opens the active stay home as soon as a room QR links the stay', async () => {
  const user = userEvent.setup();
  render(<GuestAppPrototype initialScreen="room-qr-landing" />);

  await user.click(screen.getByRole('button', { name: 'Link my stay' }));

  expect(screen.getByTestId('guest-home-active')).toBeInTheDocument();
  expect(screen.getByText(/room 304/i)).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'You’re checked in' })).toBeNull();
});
```

- [ ] **Step 2: Add the completed check-in expectation**

Add:

```tsx
it('opens the upcoming home immediately after online pre-arrival completion', async () => {
  const user = userEvent.setup();
  render(<GuestAppPrototype initialScreen="early-check-in" initialSession={MOCK_SESSION} />);

  await user.click(screen.getByRole('button', { name: 'Keep standard 3:00 PM' }));

  expect(screen.getByTestId('guest-home-upcoming')).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'You’re ready for arrival' })).toBeNull();
});
```

- [ ] **Step 3: Add the already-complete booking expectation**

Add:

```tsx
it('opens home after confirming a booking with no check-in work remaining', async () => {
  const user = userEvent.setup();
  const readyBooking = makeBooking({ preArrivalCompleted: 4, preArrivalTotal: 4 });
  render(
    <GuestAppPrototype
      initialScreen="booking-found"
      initialSession={sessionFor([readyBooking], { auth: 'anonymous', accountStatus: 'none' })}
    />,
  );

  await user.click(screen.getByRole('button', { name: 'Yes, this is my stay' }));

  expect(screen.getByTestId('guest-home-upcoming')).toBeInTheDocument();
});
```

- [ ] **Step 4: Run the direct-to-Home tests and confirm failure**

```bash
npm test -- src/components/features/guest-app/guest-app-prototype.test.tsx
```

Expected: the room QR and pre-arrival completion tests FAIL because both paths currently stop on confirmation screens. The already-complete booking test should PASS and protects the existing `getPostAuthScreen` behavior.

- [ ] **Step 5: Route room access and completed online check-in to Home**

Replace the two handlers with:

```tsx
const linkRoomStay = () => {
  const next = withActiveRoom(session);
  setSession(next);
  go('stay-overview');
};

const completePreArrival = () => {
  const next: GuestSession = {
    ...session,
    bookings: session.bookings.map((booking) =>
      booking.id === contextBooking.id
        ? {
            ...booking,
            preArrivalCompleted: booking.preArrivalTotal,
            stayQrAvailable: true,
          }
        : booking,
    ),
  };

  setSession(next);
  go(online ? 'stay-overview' : 'prereg-queued');
};
```

Do not change the offline branch: queued registration is not completed check-in.

- [ ] **Step 6: Run the component tests**

```bash
npm test -- src/components/features/guest-app/guest-app-prototype.test.tsx
```

Expected: PASS, including the direct-to-Home tests and the existing home-variant tests.

- [ ] **Step 7: Commit the routing change**

```bash
git add -- src/components/features/guest-app/guest-app-prototype.tsx src/components/features/guest-app/guest-app-prototype.test.tsx
git commit -m "fix: open booking home after check-in"
```

### Task 4: Verify the complete experience

**Files:**
- Verify: `src/components/features/guest-app/guest-app-prototype.tsx`
- Verify: `src/components/features/guest-app/guest-app-prototype.css`
- Verify: `src/components/features/guest-app/guest-app-prototype.test.tsx`
- Verify: `src/app/(marketing)/page.test.tsx`

**Interfaces:**
- Consumes: the root route at `http://localhost:3001/` and the repository scripts.
- Produces: automated and browser evidence for the final handoff.

- [ ] **Step 1: Run static and automated checks**

```bash
npm test
npm run typecheck
npm run lint
npm run build
git diff --check
```

Expected: every command exits with status 0. Record unrelated pre-existing warnings separately instead of treating them as regressions.

- [ ] **Step 2: Verify the welcome screen in the browser**

At a representative mobile viewport around `390 × 844`, open `http://localhost:3001/` and confirm:

- the welcome screen fills the viewport without scrolling;
- the image crop remains legible behind the gradient;
- the white Cabana lockup appears near the top;
- the headline, one sentence, and **Find my booking** remain visible;
- no app bar, account action, login action, tiles, badges, dots, room QR action, hotel Wi-Fi action, or bottom navigation appears;
- keyboard focus on **Find my booking** is visible.

- [ ] **Step 3: Verify the booking journey in the browser**

Select **Find my booking**, select **Booking email**, enter `HEN-241109` and `Santos`, confirm the matched stay, and complete the required pre-arrival path. Confirm that the booking-specific upcoming Home opens without a post-completion interstitial.

Open the room QR scenario, select **Link my stay**, and confirm that the active Home opens immediately with Room 304 and the active-stay actions.

- [ ] **Step 4: Inspect the final diff**

```bash
git status --short
git diff --check
git log -4 --oneline
```

Expected: no uncommitted changes from this implementation remain. Existing unrelated user changes may still be present and must remain untouched.
