# Assistant-style front desk chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (\`- [ ]\`) syntax for tracking.

**Goal:** Turn the existing front-desk chat into a welcoming, premium conversation surface with restrained glass materials while preserving every current message, media, offline, unread, booking, and post-stay flow.

**Architecture:** Keep GuestAppPrototype as the source of truth for chat state and callbacks. Isolate the chat markup in a focused renderChatScreen helper inside the existing prototype component so the presentation boundary can evolve without moving booking or delivery decisions. Keep ChatComposer as the controlled boundary for draft, image, voice, validation, recording, and object-URL lifecycle state.

**Tech Stack:** Next.js App Router, React, TypeScript, CSS custom properties, Vitest, Testing Library, existing Phosphor and Hugeicons packages.

## Global Constraints

- Keep the product role as the hotel front desk; do not add a bot name, persona, or AI claim.
- Use only the existing five quick requests and route each through sendQuickMessage.
- Preserve existing booking context, room verification, offline delivery, after-hours response copy, unread Chat badge, post-stay closure, image preview, voice recording, validation, and focus behavior.
- Use the existing guest-app tokens and Asbir Sans. Use purposeful glass only for the compact chat context and sticky composer.
- Provide a solid var(--guest-paper) fallback before applying backdrop-filter: blur(18px) saturate(1.12).
- Keep interactive controls at least 44 pixels, expose visible text for status and recording states, and retain reduced-motion behavior.
- Do not change Explore, My Stay, QR, navigation, booking, folio, or payment logic.

---

### Task 1: Add the assistant-first chat presentation boundary

**Files:**
- Modify: /Users/kenanaiahjolmfc/Documents/ChatGPT/Hospitality/src/components/features/guest-app/guest-app-prototype.tsx:1045-1047, 3622-3743
- Test: /Users/kenanaiahjolmfc/Documents/ChatGPT/Hospitality/src/components/features/guest-app/guest-app-prototype.test.tsx:2416-2424

**Interfaces:**
- Consumes: activeScreen, contextBooking, contextRoom, chatMessages, chatDraft, online, sending, unlockPending, chatDisabled, afterHours, and the existing sendChatMessage, sendQuickMessage, grantFrontDeskUnlock, openChatImagePreview, and closeChatImagePreview callbacks.
- Produces: a guest-chat element with data-chat-mode="welcome" until a guest message exists and data-chat-mode="conversation" afterward. Existing message payloads and callback signatures remain unchanged.

- [ ] **Step 1: Define the shared chat message type**

Replace the inline message shape near the chat state with a named type so the presentation helper and state use one contract:

~~~tsx
type ChatMessage = {
  from: 'guest' | 'desk';
  body: string;
  state?: string;
  images?: string[];
  attachment?: ChatAttachment;
};

const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
  { from: 'desk', body: 'Good afternoon, Ana. How can we help with your stay?' },
]);
~~~

- [ ] **Step 2: Extract the chat switch body into a focused render helper**

Move the existing chat and chat-after-hours JSX into renderChatScreen(afterHours). Derive the mode from the displayed message model and keep the existing static closed-chat messages intact:

~~~tsx
const renderChatScreen = (afterHours: boolean) => {
  const chatDisabled = checkedOutNav && (simulatePostStayExpired || !postStayWindow.deskOpen);
  const displayedChatMessages: ChatMessage[] = chatDisabled
    ? [
        { from: 'desk', body: 'Good afternoon, Ana. How can we help with your stay?', state: 'Seen' },
        { from: 'guest', body: 'Could we get two fresh towels, please?', state: 'Seen' },
        { from: 'desk', body: 'Of course — we will send two fresh towels to ' + contextRoom.toLowerCase() + ' shortly.', state: 'Seen' },
      ]
    : chatMessages;
  const chatStarted = displayedChatMessages.some((message) => message.from === 'guest');

  return (
    <div
      className={
        'guest-chat' +
        (chatDisabled ? ' guest-chat--disabled' : '') +
        (chatStarted ? ' guest-chat--conversation' : ' guest-chat--welcome')
      }
      data-chat-mode={chatStarted ? 'conversation' : 'welcome'}
      role="region"
      aria-label="Front desk conversation"
    >
      <div className="guest-chat__context">
        <div className="guest-chat__identity">
          <span className="guest-chat__mark" aria-hidden="true"><ChatCircleDots /></span>
          <div className="guest-chat__identity-copy"><h1>Front desk</h1><span>{contextBooking.property}</span></div>
          <Tag tone={chatDisabled ? 'neutral' : afterHours ? 'warning' : 'positive'}>{chatDisabled ? 'Chat unavailable' : afterHours ? 'Outside staffed hours' : 'Front desk online'}</Tag>
        </div>
        <p className="guest-chat__response-time">{chatDisabled ? 'The post-stay support window ended 24 hours after checkout.' : afterHours ? 'Messages send now. The team responds from 6:00 AM for ' + contextBooking.property + '.' : 'Shared property inbox · Usually replies in a few minutes.'}</p>
      </div>
      {chatDisabled ? <Notice tone="neutral" title="Chat is closed">For help after 24 hours, please contact the hotel directly.</Notice> : null}
      {!online ? <Notice tone="offline" title="Messages will send when connected">Your chat history is available. New requests wait on this device.</Notice> : null}
      {!chatStarted && !chatDisabled ? <div className="guest-chat__welcome" aria-labelledby="guest-chat-welcome-title"><span className="guest-chat__welcome-mark" aria-hidden="true"><Sparkle /></span><p className="guest-eyebrow">Here for your stay</p><h2 id="guest-chat-welcome-title">How can we help with your stay?</h2><p>Send a request and the front desk will take it from there.</p></div> : null}
      <div className="guest-messages" aria-label="Conversation" aria-live="polite" />
      <div className="guest-quick-actions" aria-label="Quick requests" />
      {unlockPending ? <div className="guest-desk-grant"><small>Front desk view — this prototype stands in for the desk’s own tool</small><Button className="guest-button guest-button--secondary" type="button" onClick={grantFrontDeskUnlock}>Confirm Ana Santos is in room {contextBooking.roomNumber ?? ''}</Button></div> : null}
      <ChatComposer disabled={chatDisabled} draft={chatDraft} onDraftChange={setChatDraft} onSubmit={({ body, attachment }) => sendChatMessage(body, attachment)} />
      {chatPreviewImage ? <div className="guest-chat-image-preview" role="dialog" aria-modal="true" aria-label="Image preview" /> : null}
    </div>
  );
};
~~~

Keep the two switch cases as direct calls:

~~~tsx
case 'chat':
  return renderChatScreen(false);
case 'chat-after-hours':
  return renderChatScreen(true);
~~~

- [ ] **Step 3: Add the premium chat context and welcome state markup**

Replace the old intro block with a compact desk identity that keeps Front desk as the page heading and the property/status copy visible. Add welcome copy only before the first guest message; keep the initial desk greeting in the existing message array so it is not duplicated or lost:

~~~tsx
<div className="guest-chat__context">
  <div className="guest-chat__identity">
    <span className="guest-chat__mark" aria-hidden="true"><ChatCircleDots /></span>
    <div className="guest-chat__identity-copy">
      <h1>Front desk</h1>
      <span>{contextBooking.property}</span>
    </div>
    <Tag tone={chatDisabled ? 'neutral' : afterHours ? 'warning' : 'positive'}>
      {chatDisabled ? 'Chat unavailable' : afterHours ? 'Outside staffed hours' : 'Front desk online'}
    </Tag>
  </div>
  <p className="guest-chat__response-time">
    {chatDisabled
      ? 'The post-stay support window ended 24 hours after checkout.'
      : afterHours
        ? 'Messages send now. The team responds from 6:00 AM for ' + contextBooking.property + '.'
        : 'Shared property inbox · Usually replies in a few minutes.'}
  </p>
</div>
{chatDisabled ? <Notice tone="neutral" title="Chat is closed">For help after 24 hours, please contact the hotel directly.</Notice> : null}
{!online ? <Notice tone="offline" title="Messages will send when connected">Your chat history is available. New requests wait on this device.</Notice> : null}
{!chatStarted && !chatDisabled ? (
  <div className="guest-chat__welcome" aria-labelledby="guest-chat-welcome-title">
    <span className="guest-chat__welcome-mark" aria-hidden="true"><Sparkle /></span>
    <p className="guest-eyebrow">Here for your stay</p>
    <h2 id="guest-chat-welcome-title">How can we help with your stay?</h2>
    <p>Send a request and the front desk will take it from there.</p>
  </div>
) : null}
~~~

- [ ] **Step 4: Keep the transcript, prompt rail, composer, and preview behavior unchanged**

Render the existing displayedChatMessages values in a named conversation container. Add only presentation classes for adjacent messages and prompt placement; do not alter message text, attachment payloads, state metadata, ChatComposer props, or image preview handlers:

~~~tsx
<div className="guest-messages" aria-label="Conversation" aria-live="polite">
  {displayedChatMessages.map((message, index) => {
    const continued = displayedChatMessages[index - 1]?.from === message.from;
    return (
      <div
        key={message.body + '-' + index}
        className={
          'guest-message guest-message--' + message.from +
          (continued ? ' guest-message--continued' : '')
        }
      >
        <p>{message.body}</p>
        {message.attachment ? message.attachment.kind === 'image' ? (
          <button className="guest-message__attachment guest-message__attachment--image" type="button" aria-label={message.attachment.name} onClick={(event) => openChatImagePreview(message.attachment!.url, event.currentTarget)}>
            <Image src={message.attachment.url} alt={message.attachment.name} width={220} height={160} unoptimized />
          </button>
        ) : (
          <div className="guest-message__attachment guest-message__attachment--audio"><audio controls src={message.attachment.url} aria-label={'Voice message · ' + formatChatDuration(message.attachment.duration ?? 0)} /></div>
        ) : null}
        {message.images?.length ? <div className="guest-chat-catalog-images">{message.images.map((image) => <button key={image} type="button" onClick={(event) => openChatImagePreview(image, event.currentTarget)}><Image src={image} alt="Current catalog" width={120} height={88} /></button>)}</div> : null}
        {message.state ? <small>{message.state}</small> : null}
      </div>
    );
  })}
  {sending ? (
    <div className="guest-message guest-message--desk guest-message--typing" role="status">
      <span className="guest-typing-dots" aria-hidden="true"><i /><i /><i /></span>
      <span>Front desk is replying</span>
    </div>
  ) : null}
</div>
<div className="guest-quick-actions" aria-label="Quick requests">
  <span className="guest-quick-actions__label">Start with a request</span>
  {CHAT_QUICK_ACTIONS.map((action) => (
    <button key={action.label} type="button" disabled={chatDisabled} onClick={() => sendQuickMessage(action.message(contextRoom))}>
      {action.label}
    </button>
  ))}
</div>
~~~

Keep the existing unlockPending grant, ChatComposer, controlled draft, image preview dialog, Escape listener, focus containment, and focus return exactly as currently wired.

- [ ] **Step 5: Add focused mode and flow assertions**

Extend the existing chat integration coverage with these tests:

~~~tsx
it('opens in welcome mode with the front desk identity and five prompt actions', () => {
  render(<GuestAppPrototype initialScreen="chat" initialSession={verified} />);

  expect(screen.getByRole('region', { name: 'Front desk conversation' }))
    .toHaveAttribute('data-chat-mode', 'welcome');
  expect(screen.getByRole('heading', { name: 'Front desk', level: 1 })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'How can we help with your stay?', level: 2 }))
    .toBeInTheDocument();
  expect(
    screen.getAllByRole('button').filter((button) =>
      ['Towels', 'Housekeeping', 'Late checkout', 'Room issue', 'Transfers']
        .includes(button.textContent ?? ''),
    ),
  ).toHaveLength(5);
});

it('changes to conversation mode after a prompt sends through the existing path', async () => {
  const user = userEvent.setup();
  render(<GuestAppPrototype initialScreen="chat" initialSession={verified} />);

  await user.click(screen.getByRole('button', { name: 'Room issue' }));

  expect(screen.getByRole('region', { name: 'Front desk conversation' }))
    .toHaveAttribute('data-chat-mode', 'conversation');
  expect(screen.getByText(/There’s an issue in room 304/)).toBeInTheDocument();
  expect(screen.getByText('Sent')).toBeInTheDocument();
});
~~~

### Task 2: Apply the restrained premium glass treatment

**Files:**
- Modify: /Users/kenanaiahjolmfc/Documents/ChatGPT/Hospitality/src/components/features/guest-app/guest-app-prototype.css:1765-1957, 1997, 2067-2072
- Test: /Users/kenanaiahjolmfc/Documents/ChatGPT/Hospitality/src/components/features/guest-app/guest-app-prototype.test.tsx:2416-2521

**Interfaces:**
- Consumes: the new guest-chat__context, guest-chat__welcome, guest-chat__mark, guest-chat--welcome, guest-chat--conversation, guest-message--continued, and guest-typing-dots classes.
- Produces: a responsive visual system with solid fallbacks, targeted translucency, readable message contrast, safe-area spacing, and reduced-motion behavior.

- [ ] **Step 1: Style the chat context as the only sticky glass header**

Add a sticky context surface with a solid fallback and an @supports enhancement:

~~~css
.guest-chat__context {
  position: sticky;
  top: -12px;
  z-index: 2;
  display: grid;
  gap: 10px;
  margin: -12px calc(-1 * var(--app-inset)) 0;
  padding: 14px var(--app-inset) 12px;
  background: var(--guest-paper);
  box-shadow: var(--shadow-md);
}

@supports ((-webkit-backdrop-filter: blur(1px)) or (backdrop-filter: blur(1px))) {
  .guest-chat__context {
    background: rgb(255 255 255 / 0.78);
    -webkit-backdrop-filter: blur(18px) saturate(1.12);
    backdrop-filter: blur(18px) saturate(1.12);
  }
}
~~~

Use a 40-pixel circular neutral desk mark, an 18-pixel compact heading, a readable property line, and the existing Tag status. Do not add a border to the glass surface.

- [ ] **Step 2: Style welcome mode and the prompt rail**

Keep the welcome message intentional without turning it into a marketing hero. Let welcome mode place the composer at the bottom of the app frame, while conversation mode keeps the timeline dominant:

~~~css
.guest-chat--welcome .guest-chat__welcome {
  display: grid;
  justify-items: center;
  gap: 6px;
  padding: 22px 8px 4px;
  text-align: center;
}

.guest-chat__welcome h2 {
  max-width: 18ch;
  margin: 0;
  font-size: 24px;
  letter-spacing: -0.022em;
  line-height: 1.12;
}

.guest-chat__welcome > p:last-child {
  max-width: 32ch;
  margin: 0;
  color: var(--guest-muted);
}
.guest-chat--welcome .guest-messages {
  flex: 0 0 auto;
  align-items: center;
  padding-bottom: 0;
}
.guest-chat--welcome .guest-message { max-width: min(92%, 360px); }
.guest-chat--welcome .guest-message--desk p {
  padding: 0;
  background: transparent;
  box-shadow: none;
  color: var(--guest-muted);
  text-align: center;
}
.guest-chat--welcome .guest-composer { margin-top: auto; }

.guest-quick-actions { display: grid; gap: 8px; }
.guest-quick-actions__label { color: var(--guest-subtle); font-size: 12px; font-weight: 650; }
.guest-chat--conversation .guest-quick-actions {
  grid-template-columns: max-content repeat(5, max-content);
  align-items: center;
}
~~~

Retain horizontal overflow on narrow screens, 44-pixel minimum button height, keyboard focus rings, and the existing five labels. Add scroll-margin-bottom using the navigation height so a focused prompt or composer does not sit behind the bottom navigation.

- [ ] **Step 3: Refine messages and typing state**

Use opaque, calm desk bubbles and a dark ink guest bubble. Preserve readable state metadata and attachments. Group adjacent same-sender messages visually without changing their DOM order:

~~~css
.guest-message p {
  border-radius: var(--guest-radius-lg);
  background: var(--guest-paper);
  box-shadow: none;
}

.guest-message--desk p { border: 1px solid var(--guest-line); }
.guest-message--guest p { background: var(--guest-invert); color: var(--guest-on-invert); }
.guest-message--continued.guest-message--desk p { border-top-left-radius: 8px; }
.guest-message--continued.guest-message--guest p { border-top-right-radius: 8px; }
.guest-message--typing { gap: 8px; color: var(--guest-muted); }
.guest-typing-dots { display: inline-flex; gap: 3px; align-items: center; }
.guest-typing-dots i {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: currentColor;
  animation: guest-typing-pulse 900ms var(--ease-in-out) infinite;
}
.guest-typing-dots i:nth-child(2) { animation-delay: 120ms; }
.guest-typing-dots i:nth-child(3) { animation-delay: 240ms; }
~~~

- [ ] **Step 4: Turn the composer into the second targeted glass surface**

Remove the existing gradient. Use the solid paper fallback by default, then apply the same controlled translucent finish under @supports, with a single shadow and rounded geometry:

~~~css
.guest-composer {
  position: sticky;
  bottom: calc(var(--guest-nav-h) + env(safe-area-inset-bottom) + 10px);
  z-index: 3;
  display: grid;
  gap: 8px;
  margin-inline: calc(-1 * var(--app-inset));
  padding: 10px;
  border-radius: var(--guest-radius-lg);
  background: var(--guest-paper);
  box-shadow: var(--shadow-md);
  scroll-margin-bottom: calc(var(--guest-nav-h) + env(safe-area-inset-bottom) + 18px);
}

@supports ((-webkit-backdrop-filter: blur(1px)) or (backdrop-filter: blur(1px))) {
  .guest-composer {
    background: rgb(255 255 255 / 0.78);
    -webkit-backdrop-filter: blur(18px) saturate(1.12);
    backdrop-filter: blur(18px) saturate(1.12);
  }
}
~~~

Keep image preview, recording, remove, send, and disabled styles legible inside the composer. Do not change the existing ChatComposer component or its media behavior.

- [ ] **Step 5: Add responsive and reduced-motion rules**

At narrow widths, reduce the welcome heading to 22 pixels and keep the prompt rail from widening the page. Disable movement while preserving visual state changes:

~~~css
@media (max-width: 400px) {
  .guest-chat__welcome h2 { font-size: 22px; }
  .guest-quick-actions__label { font-size: 11px; }
}

@media (prefers-reduced-motion: reduce) {
  .guest-chat__context,
  .guest-composer,
  .guest-quick-actions button,
  .guest-message { transition: none; }
  .guest-typing-dots i { animation: none; }
}
~~~

### Task 3: Run focused verification and preserve the dirty worktree

**Files:**
- Modify: none beyond Tasks 1–2
- Test: /Users/kenanaiahjolmfc/Documents/ChatGPT/Hospitality/src/components/features/guest-app/guest-app-prototype.test.tsx

**Interfaces:**
- Consumes: the completed chat presentation and the existing prototype test fixtures.
- Produces: evidence that the redesign is scoped to chat presentation and does not break the established flows.

- [ ] **Step 1: Run the focused chat integration tests**

Run:

~~~bash
npx vitest run src/components/features/guest-app/guest-app-prototype.test.tsx -t "chat|front desk|voice|image|unread"
~~~

Expected: the new welcome/conversation assertions and the existing chat media, offline, post-stay, unread, and preview tests pass. Report any unrelated prototype failures separately.

- [ ] **Step 2: Run lint and the production build**

Run:

~~~bash
npm run lint -- src/components/features/guest-app/guest-app-prototype.tsx src/components/features/guest-app/chat-composer.tsx
API_BASE_URL=https://jsonplaceholder.typicode.com npm run build
~~~

Expected: lint passes and the production build completes. Do not run concurrent Next.js processes that share .next.

- [ ] **Step 3: Run typecheck and diff validation**

Run:

~~~bash
npm run typecheck
git diff --check
git status --short --branch
~~~

Expected: typecheck and diff checks pass. If typecheck encounters the known duplicate generated .next/types files, report that as an existing environment failure and do not modify unrelated generated files. Confirm that pre-existing dirty files remain present and untouched outside the chat scope.

- [ ] **Step 4: Review the final diff before handoff**

Run:

~~~bash
git diff -- src/components/features/guest-app/guest-app-prototype.tsx src/components/features/guest-app/guest-app-prototype.css src/components/features/guest-app/guest-app-prototype.test.tsx
~~~

Expected: the diff contains only the chat presentation, targeted CSS, and focused test assertions described above. Do not stage or commit unrelated existing changes.
