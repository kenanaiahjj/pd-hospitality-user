# Reference-Inspired Front Desk Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the Hospitality front-desk chat to match the supplied reference's spacious welcome, horizontal request cards, warm neutral canvas, and large bottom composer.

**Status:** Implementation complete. The mobile welcome and sent-message layouts were reviewed. The preview stopped during cleanup after unrelated Rewards source errors, so after-hours, offline, closed-chat, and on-screen keyboard states were not visually rechecked.

**Architecture:** Keep chat routing, room context, quick-request callbacks, message state, and media behavior in their current components. Move the quick-request rail beside the composer in a chat dock, make the composer fit the reference's larger multiline surface, and scope the visual changes to the existing chat screen.

**Tech Stack:** Next.js App Router, React, TypeScript, global CSS, and the existing Phosphor icon set.

## Global constraints

- Keep the current front-desk and property identity, message behavior, quick request actions, back path, and focused full-screen chat navigation.
- Use a warm, light neutral canvas with generous open space.
- Center the welcome content in the empty conversation state.
- Present the existing five requests in a horizontally scrollable rail of larger, clearer cards.
- Restyle the composer as a large rounded surface anchored at the bottom of the chat screen, with a visible attachment control, voice recording, text entry, and send action.
- Keep the conversation thread, desk responses, and composer usable after a message is sent.
- Reuse the current design tokens, app assets, and icon set. Let the app frame provide device chrome.
- Keep the existing chat and after-hours routes, booking context, delivery and offline states, attachments, voice recording, unread indicator, and post-stay closure rules.
- Do not change booking, folio, payments, Explore, shared navigation, or server-backed behavior. Do not create a new route or introduce an automated concierge.
- Do not add or run automated tests for this request. Verify the rendered chat states in the existing local app.

---

## File map

- `src/components/features/guest-app/guest-app-prototype.tsx` owns the front-desk conversation markup and the five request messages. Keep the route, message model, and callbacks intact while moving the prompt rail into the dock and giving cards short supporting labels.
- `src/components/features/guest-app/chat-composer.tsx` owns the text field, attachment menu, recording, and submit behavior. Keep the current callback contract while adapting the field and controls to the taller composer.
- `src/components/features/guest-app/guest-app-prototype.css` owns the chat viewport, welcome composition, request rail, transcript spacing, and bottom dock styling.

## Task 1: Build the reference-inspired chat dock

**Files:**
- Modify: `src/components/features/guest-app/guest-app-prototype.tsx`

**Interfaces:**
- Consumes: `CHAT_QUICK_ACTIONS`, `contextRoom`, `sendQuickMessage`, `chatDraft`, `sendChatMessage`, `online`, `chatDisabled`, and existing message state.
- Produces: a `.guest-chat__dock` containing the existing quick-request buttons and `ChatComposer`; the buttons continue to call `sendQuickMessage(action.message(contextRoom))`.

- [x] **Step 1: Add concise descriptions without changing quick-request messages**

Extend each `ChatQuickAction` with a `description` field and retain its current `label` and `message` function:

~~~tsx
type ChatQuickAction = {
  label: string;
  description: string;
  message: (room: string) => string;
};

const CHAT_QUICK_ACTIONS: ChatQuickAction[] = [
  { label: 'Towels', description: 'Request fresh towels', message: () => 'Could we get two fresh towels, please?' },
  { label: 'Housekeeping', description: 'Ask for room cleaning', message: (room) => `Please arrange housekeeping for ${room.toLowerCase()}.` },
  { label: 'Late checkout', description: 'Ask for more time', message: () => 'Can we request a late checkout?' },
  { label: 'Room issue', description: 'Tell us what needs fixing', message: (room) => `There’s an issue in ${room.toLowerCase()}. Could someone help?` },
  { label: 'Transfers', description: 'Arrange transportation', message: () => 'We need help arranging a transfer.' },
];
~~~

- [x] **Step 2: Render each action as a title and description card**

Keep the existing label and callback and expose the text as separate spans so CSS can set the card hierarchy:

~~~tsx
<button
  key={action.label}
  type="button"
  disabled={chatDisabled}
  onClick={() => sendQuickMessage(action.message(contextRoom))}
>
  <span className="guest-quick-actions__copy">
    <b>{action.label}</b>
    <small>{action.description}</small>
  </span>
  <CaretRight aria-hidden="true" />
</button>
~~~

- [x] **Step 3: Move the request rail beside the composer**

Render the rail as a sibling of `ChatComposer` in `.guest-chat__dock`. Remove the `quickActions` prop from this call; preserve restaurant chat's existing behavior by rendering the rail only when `!restaurantChat`.

~~~tsx
<div className="guest-chat__dock">
  {!restaurantChat ? (
    <div className="guest-quick-actions" aria-label="Popular requests">
      <div className="guest-quick-actions__rail">
        {CHAT_QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            type="button"
            disabled={chatDisabled}
            onClick={() => sendQuickMessage(action.message(contextRoom))}
          >
            <span className="guest-quick-actions__copy">
              <b>{action.label}</b>
              <small>{action.description}</small>
            </span>
            <CaretRight aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  ) : null}
  <ChatComposer
    disabled={chatDisabled}
    draft={chatDraft}
    onDraftChange={setChatDraft}
    placeholder={restaurantChat ? 'Type your order…' : undefined}
    autoFocus={restaurantChat}
    onSubmit={({ body, attachment }) => sendChatMessage(body, attachment)}
  />
</div>
~~~

## Task 2: Adapt the composer controls without changing message delivery

**Files:**
- Modify: `src/components/features/guest-app/chat-composer.tsx`

**Interfaces:**
- Consumes: the existing `ChatComposerProps`, controlled `draft`, attachment state, and recording state.
- Produces: the same `onSubmit({ body, attachment? })` callback payloads with a wrapped text area, an always-visible voice control, and a send control when text or an attachment is present.

- [x] **Step 1: Remove the prompt-rail prop**

Remove `quickActions?: ReactNode` and its render position. Remove the now-unused `ReactNode` import. The chat dock from Task 1 owns the rail.

- [x] **Step 2: Replace the single-line input with a bounded, auto-growing textarea**

Use a `textarea` with the existing `id="message"`, `name="message"`, and accessible label. Start at one row and grow up to the CSS maximum. Keep the controlled `draft` value and `onDraftChange` callback.

~~~tsx
<textarea
  ref={textAreaRef}
  className="guest-composer__text-input"
  id="message"
  name="message"
  rows={1}
  value={draft}
  onChange={(event) => onDraftChange(event.target.value)}
  onKeyDown={(event) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }}
  placeholder={disabled ? 'Chat is unavailable' : placeholder ?? 'Ask the front desk'}
  autoFocus={autoFocus}
  disabled={disabled || isRecording}
/>
~~~

Use a layout effect keyed by `draft` to set `height` to `auto`, then to `min(scrollHeight, 112px)`. Keep vertical scrolling available after the maximum height. Enter submits through the existing form; Shift+Enter inserts a line break.

- [x] **Step 3: Separate voice recording from sending**

Keep the plus attachment-menu button. Render a microphone button that calls the existing `startRecording` and has the accessible name `Start voice recording`. Render the arrow submit button only when `canSend`; give it the accessible name `Send message`. Keep both controls at least 44 pixels and disabled while the composer is disabled or recording. Keep pending attachment removal, recording stop/cancel, validation, and cleanup unchanged.

## Task 3: Apply chat-scoped reference styling

**Files:**
- Modify: `src/components/features/guest-app/guest-app-prototype.css`

**Interfaces:**
- Consumes: `.guest-chat__dock`, `.guest-quick-actions__copy`, existing chat welcome, identity, messages, and composer selectors.
- Produces: a warm-neutral, full-height chat canvas with clear welcome, request, transcript, and composer layers that fit the guest-app viewport.

- [x] **Step 1: Style the chat canvas and welcome state**

Use the existing neutral tokens for the chat canvas, surfaces, borders, and text. Keep the compact front-desk/property header and circular back control. Let the empty-state greeting use the open middle area; do not add a new brand mark or product identity.

- [x] **Step 2: Style the horizontal request cards**

Make `.guest-quick-actions__rail` a single horizontal, touch-scrollable row with snap alignment. Give each button a fixed mobile-friendly card width, minimum 72-pixel height, rounded neutral surface, title, muted description, and visible focus state. Keep the existing five actions available in both welcome and conversation states. Prevent page-level horizontal overflow.

- [x] **Step 3: Style the composer dock and conversation space**

Anchor `.guest-chat__dock` to the bottom of the chat viewport with the existing safe-area inset. Keep the request cards above the rounded composer. Give the composer a paper surface, subtle border and shadow, large rounded corners, spacing for the textarea and controls, and a high-contrast send action using the current brand accent. Increase the transcript's bottom clearance so its last message can scroll above the dock.

- [ ] **Step 4: Keep interaction states legible**

Retain visible focus rings, disabled contrast, attachment preview, recording timer/stop/cancel controls, offline and closed-chat notices, and reduced-motion behavior. Confirm the composer stays reachable when the keyboard is open and does not cover the last message.

## Task 4: Review the live chat states

**Files:**
- Modify: none

**Interfaces:**
- Consumes: the existing local Hospitality preview at `http://localhost:3000/`.
- Produces: a visual review of the approved mobile layout and the existing front-desk chat interactions.

- [x] **Step 1: Inspect the empty welcome state at phone width**

Open Chat from the existing guest app. Confirm the centered welcome, five horizontally scrollable cards, back control, and dock fit inside the phone viewport without clipping or horizontal page overflow.

- [x] **Step 2: Inspect a typed draft and sent message**

Enter a message long enough to wrap to multiple lines. Confirm the mic and send controls remain visible. Confirm Enter submits through the existing delivery path, Shift+Enter adds a line, and the transcript scrolls above the dock.

- [ ] **Step 3: Inspect the existing special states**

Use the prototype's current state controls to view after-hours, offline, and closed-chat messages. Confirm each notice and disabled state remains readable and reachable.

- [x] **Step 4: Review the final diff**

Run `git diff --check` and review only the chat component, composer, and scoped CSS changes. Do not run automated tests for this request.
