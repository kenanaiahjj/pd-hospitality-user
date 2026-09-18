# Front desk chat media and quick actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Improve the existing front-desk chat with clearer quick requests, local image attachments, and short local voice recordings without changing the existing chat route or delivery semantics.

**Architecture:** Add a focused ChatComposer component that owns ephemeral picker and recorder state, then pass a typed attachment payload to GuestAppPrototype. GuestAppPrototype remains the source of truth for messages, offline delivery, front-desk replies, and post-stay gating. Keep received catalog images on their existing images field and add a separate local attachment field for outgoing media.

**Tech Stack:** Next.js 16.3.4, React 19.2.8, TypeScript 5, Vitest 5, Testing Library, @phosphor-icons/react, existing CSS tokens, and MediaRecorder/URL.createObjectURL browser APIs.

## Global Constraints

- This remains a browser-only prototype. Media is selected or recorded locally and is not uploaded to a server or persisted across reloads.
- Preserve the existing chat route, front-desk reply simulation, offline queue behavior, post-stay availability window, and navigation wiring.
- Limit each outgoing message to one image or one voice recording.
- Reject images larger than 10 MB.
- Limit recordings to 30 seconds.
- Keep the existing booking, room verification, folio, payment, service booking, and Explore behavior unchanged.
- Use native buttons, inputs, and audio controls; keep interactive targets at least 44 pixels high; respect reduced motion.

---

## File map

- Create src/components/features/guest-app/chat-composer.tsx for the controlled composer, image picker, local recorder, pending attachment preview, and media failure states.
- Create src/components/features/guest-app/chat-composer.test.tsx for isolated picker, recorder, validation, cancellation, and accessibility behavior.
- Modify src/components/features/guest-app/guest-app-prototype.tsx to define quick actions, accept outgoing attachments, render outgoing media, register object URLs for cleanup, and mount ChatComposer without changing route or delivery logic.
- Modify src/components/features/guest-app/guest-app-prototype.test.tsx to cover the integrated chat route, quick-action messages, offline delivery, closed-chat disabling, and existing desk replies.
- Modify src/components/features/guest-app/guest-app-prototype.css to style the two-level composer, attachment preview, recording state, media messages, and focus/disabled states.

## Task 1: Build the local media composer in isolation

**Files:**

- Create src/components/features/guest-app/chat-composer.tsx
- Test src/components/features/guest-app/chat-composer.test.tsx

**Interfaces:**

- Produces ChatAttachment, ChatComposerSubmit, and ChatComposer for the parent prototype.
- ChatAttachment is { kind: 'image' | 'audio'; url: string; name: string; duration?: number }.
- ChatComposerSubmit is { body: string; attachment?: ChatAttachment }.
- ChatComposer accepts disabled, controlled draft, onDraftChange, and onSubmit.

- [ ] **Step 1: Write the failing component tests**

Add tests for image selection, pending preview and removal, media send, recorder lifecycle, and unsupported or denied microphone states. Mock URL.createObjectURL and URL.revokeObjectURL.

~~~tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatComposer, type ChatComposerSubmit } from './chat-composer';

const renderComposer = (onSubmit: (payload: ChatComposerSubmit) => void = vi.fn()) => {
  const onDraftChange = vi.fn();
  render(<ChatComposer draft="" onDraftChange={onDraftChange} onSubmit={onSubmit} />);
  return { onDraftChange };
};

describe('ChatComposer', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:chat-test'),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('previews, removes, and sends one selected image', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderComposer(onSubmit);
    const file = new File(['room photo'], 'room.jpg', { type: 'image/jpeg' });

    fireEvent.change(screen.getByLabelText('Choose an image to attach'), { target: { files: [file] } });
    expect(screen.getByRole('region', { name: 'Pending attachment' })).toHaveTextContent('room.jpg');
    await user.click(screen.getByRole('button', { name: 'Remove attachment' }));
    expect(screen.queryByRole('region', { name: 'Pending attachment' })).toBeNull();

    fireEvent.change(screen.getByLabelText('Choose an image to attach'), { target: { files: [file] } });
    await user.click(screen.getByRole('button', { name: 'Send message' }));
    expect(onSubmit).toHaveBeenCalledWith({
      body: '',
      attachment: { kind: 'image', url: 'blob:chat-test', name: 'room.jpg' },
    });
  });

  it('rejects non-images and images over 10 MB', () => {
    renderComposer();
    fireEvent.change(screen.getByLabelText('Choose an image to attach'), {
      target: { files: [new File(['text'], 'notes.txt', { type: 'text/plain' })] },
    });
    expect(screen.getByRole('status')).toHaveTextContent('Choose an image file.');

    const largeFile = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'large.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByLabelText('Choose an image to attach'), { target: { files: [largeFile] } });
    expect(screen.getByRole('status')).toHaveTextContent('Images must be 10 MB or smaller.');
  });

  it('records, previews, and sends a voice message', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    class MockMediaRecorder {
      static isTypeSupported = vi.fn(() => true);
      state = 'inactive';
      mimeType = 'audio/webm';
      ondataavailable?: (event: { data: Blob }) => void;
      onstop?: () => void;
      start = vi.fn(() => { this.state = 'recording'; });
      stop = vi.fn(() => {
        this.state = 'inactive';
        this.ondataavailable?.({ data: new Blob(['voice'], { type: 'audio/webm' }) });
        this.onstop?.();
      });
    }
    vi.stubGlobal('MediaRecorder', MockMediaRecorder);
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] }) },
    });
    renderComposer(onSubmit);

    await user.click(screen.getByRole('button', { name: 'Start voice recording' }));
    expect(screen.getByRole('status')).toHaveTextContent('Recording');
    await user.click(screen.getByRole('button', { name: 'Stop recording' }));
    expect(screen.getByRole('region', { name: 'Pending attachment' })).toHaveTextContent('Voice message');
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({
      body: '',
      attachment: expect.objectContaining({ kind: 'audio', name: 'Voice message' }),
    }));
  });

  it('announces microphone denial and leaves text entry available', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('MediaRecorder', class MockMediaRecorder {});
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    renderComposer();

    await user.click(screen.getByRole('button', { name: 'Start voice recording' }));
    expect(screen.getByRole('status')).toHaveTextContent('Microphone access was denied. You can type or attach an image instead.');
    expect(screen.getByRole('textbox', { name: 'Message the front desk' })).toBeEnabled();
  });
});
~~~

- [ ] **Step 2: Run the isolated tests and verify they fail**

~~~bash
npm test -- src/components/features/guest-app/chat-composer.test.tsx
~~~

Expected: FAIL because chat-composer.tsx does not exist yet.

- [ ] **Step 3: Implement the minimal composer**

Export these exact values:

~~~tsx
export type ChatAttachment = {
  kind: 'image' | 'audio';
  url: string;
  name: string;
  duration?: number;
};

export type ChatComposerSubmit = {
  body: string;
  attachment?: ChatAttachment;
};

export const MAX_CHAT_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_CHAT_RECORDING_SECONDS = 30;
~~~

Use a hidden native input[type=file] with accept="image/*" and capture="environment". Reject non-images and files above MAX_CHAT_IMAGE_BYTES, revoke a replaced pending object URL, and reset the input value after each selection. Request navigator.mediaDevices.getUserMedia({ audio: true }) only from the microphone button. Create a MediaRecorder from the returned stream, collect Blob chunks, stop after MAX_CHAT_RECORDING_SECONDS, and release every stream track after stop or cancel. If the API is absent or permission fails, put the exact user-facing message in a polite role=status region.

The idle composer renders an attachment button, a labeled message input, and a trailing button named Send message when text or a pending attachment exists and Start voice recording otherwise. While recording, render Recording, elapsed mm:ss, Stop recording, and Cancel recording. The pending attachment region exposes Remove attachment, an image thumbnail or audio controls, and the filename or Voice message label. On submit, transfer the pending object URL to onSubmit before clearing local pending state so the parent owns the sent media URL.

- [ ] **Step 4: Run the isolated tests and verify they pass**

~~~bash
npm test -- src/components/features/guest-app/chat-composer.test.tsx
~~~

Expected: all composer tests pass.

- [ ] **Step 5: Commit the isolated component**

~~~bash
git add src/components/features/guest-app/chat-composer.tsx src/components/features/guest-app/chat-composer.test.tsx
git commit -m "feat: add local chat media composer"
~~~

## Task 2: Preserve parent chat wiring and add quick actions

**Files:**

- Modify src/components/features/guest-app/guest-app-prototype.tsx:977-1210,3467-3490
- Test src/components/features/guest-app/guest-app-prototype.test.tsx:2240-2380

**Interfaces:**

- Consumes ChatComposer, ChatAttachment, and ChatComposerSubmit from Task 1.
- Produces the same chat and chat-after-hours screens, with existing Sent, Will send when connected, Seen, catalog-image, and front-desk reply behavior unchanged.

- [ ] **Step 1: Write the failing integration tests**

Add these tests beside the existing chat tests:

~~~tsx
it('sends each quick action through the existing front-desk message path', async () => {
  const user = userEvent.setup();
  render(<GuestAppPrototype initialScreen="chat" initialSession={verified} />);
  await user.click(screen.getByRole('button', { name: 'Room issue' }));
  expect(screen.getByText(/There’s an issue in room 304/)).toBeInTheDocument();
  expect(screen.getByText('Sent')).toBeInTheDocument();
});

it('renders an outgoing image and preserves the offline delivery state', async () => {
  const user = userEvent.setup();
  render(<GuestAppPrototype initialScreen="chat" initialSession={verified} initialOnline={false} />);
  const file = new File(['room'], 'room.jpg', { type: 'image/jpeg' });
  fireEvent.change(screen.getByLabelText('Choose an image to attach'), { target: { files: [file] } });
  await user.click(screen.getByRole('button', { name: 'Send message' }));
  expect(screen.getByRole('img', { name: 'room.jpg' })).toBeInTheDocument();
  expect(screen.getByText('Will send when connected')).toBeInTheDocument();
});

it('disables quick actions and media controls when the post-stay chat is closed', () => {
  render(<GuestAppPrototype initialScreen="chat" initialSession={applyPrototypeStayState('closed')} />);
  expect(screen.getByRole('button', { name: 'Towels' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Attach an image' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Start voice recording' })).toBeDisabled();
});
~~~

- [ ] **Step 2: Run the integration tests and verify they fail**

~~~bash
npm test -- src/components/features/guest-app/guest-app-prototype.test.tsx -t "quick action|outgoing image|post-stay chat is closed"
~~~

Expected: FAIL because the parent still renders its old composer and message shape.

- [ ] **Step 3: Add the explicit quick-action and message contracts**

Import the Task 1 types and define this action list near the existing screen constants:

~~~tsx
const CHAT_QUICK_ACTIONS = [
  { label: 'Towels', message: () => 'Could we get two fresh towels, please?' },
  { label: 'Housekeeping', message: (room: string) => 'Please arrange housekeeping for ' + room.toLowerCase() + '.' },
  { label: 'Late checkout', message: () => 'Can we request a late checkout?' },
  { label: 'Room issue', message: (room: string) => 'There’s an issue in ' + room.toLowerCase() + '. Could someone help?' },
  { label: 'Transfers', message: () => 'We need help arranging a transfer.' },
] as const;
~~~

Extend the in-memory message type with attachment?: ChatAttachment while retaining images?: string[] for existing desk catalog replies. Add chatObjectUrlsRef = useRef(new Set<string>()) and revoke each locally-created URL in one unmount cleanup effect. Register an attachment URL only when the parent accepts it; the child remains responsible for URLs still pending.

- [ ] **Step 4: Route text, quick actions, and media through one send function**

Keep the current desk reply body and 850 ms timer. Use this parent send shape:

~~~tsx
const sendChatMessage = (body: string, attachment?: ChatAttachment) => {
  const messageBody = body.trim() || (attachment?.kind === 'image' ? 'Image attached.' : 'Voice message attached.');
  const state = online ? 'Sent' : 'Will send when connected';

  if (attachment?.url.startsWith('blob:')) chatObjectUrlsRef.current.add(attachment.url);
  setChatDraft('');
  setChatMessages((messages) => [...messages, { from: 'guest', body: messageBody, state, attachment }]);
  if (!online) return;

  setSending(true);
  window.setTimeout(() => {
    const catalogRequest = /see the menu and order|see the available products|see the available options/i.test(messageBody);
    const establishment = messageBody.match(/from (.+?)\.$/i)?.[1] ?? 'the establishment';
    const catalogImages = catalogRequest
      ? messageBody.includes('products')
        ? GIFT_PRODUCTS.slice(0, 2).map((product) => product.image)
        : [getMenuItemImage('a1b-calamari'), getMenuItemImage('a1b-ribeye')]
      : undefined;
    const deskReply = messageBody.includes('towel')
      ? 'We’ll bring two fresh towels to ' + contextRoom.toLowerCase() + ' shortly.'
      : catalogRequest
        ? 'Here is the current ' + establishment + ' ' + (messageBody.includes('products') ? 'product catalog' : 'menu') + ' and ordering information. Please send the item names and quantities you would like to order.'
        : 'Thanks. The front desk has received your request.';
    setChatMessages((messages) => [...messages, { from: 'desk', body: deskReply, state: 'Seen', images: catalogImages }]);
    setSending(false);
  }, 850);
};

const sendQuickMessage = (body: string) => sendChatMessage(body);
~~~

- [ ] **Step 5: Mount the composer and render media without changing routes**

Map CHAT_QUICK_ACTIONS to native buttons that call sendQuickMessage(action.message(contextRoom)), preserve chatDisabled, and replace only the old chat form with:

~~~tsx
<ChatComposer
  disabled={chatDisabled}
  draft={chatDraft}
  onDraftChange={setChatDraft}
  onSubmit={({ body, attachment }) => sendChatMessage(body, attachment)}
/>
~~~

Keep the current displayedChatMessages branch for closed chat. Render outgoing images with alt text equal to their names and a button that opens chatPreviewImage. Render outgoing audio with native controls and an accessible label containing its duration. Keep received catalog images and their lightbox behavior unchanged.

- [ ] **Step 6: Run the integration tests and verify they pass**

~~~bash
npm test -- src/components/features/guest-app/guest-app-prototype.test.tsx -t "quick action|outgoing image|post-stay chat is closed|chat|front desk"
~~~

Expected: the new integration tests and all selected existing chat tests pass.

- [ ] **Step 7: Commit the parent integration**

~~~bash
git add src/components/features/guest-app/guest-app-prototype.tsx src/components/features/guest-app/guest-app-prototype.test.tsx
git commit -m "feat: connect chat media and quick actions"
~~~

## Task 3: Polish the chat surface and accessibility states

**Files:**

- Modify src/components/features/guest-app/guest-app-prototype.css:1684-1770,4567-4618
- Modify src/components/features/guest-app/guest-app-prototype.tsx:3476-3490 for image-dialog keyboard behavior

**Interfaces:**

- Consumes the class names rendered by ChatComposer and the outgoing media markup from Task 2.
- Produces responsive, keyboard-visible, reduced-motion-safe chat controls without changing message or navigation state.

- [ ] **Step 1: Write the style/accessibility regression assertion**

~~~tsx
it('closes an outgoing image preview with Escape', async () => {
  const user = userEvent.setup();
  render(<GuestAppPrototype initialScreen="chat" initialSession={verified} />);
  const file = new File(['room'], 'room.jpg', { type: 'image/jpeg' });
  fireEvent.change(screen.getByLabelText('Choose an image to attach'), { target: { files: [file] } });
  await user.click(screen.getByRole('button', { name: 'Send message' }));
  await user.click(screen.getByRole('button', { name: 'room.jpg' }));
  expect(screen.getByRole('dialog', { name: 'Image preview' })).toBeInTheDocument();
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('dialog', { name: 'Image preview' })).toBeNull();
});
~~~

- [ ] **Step 2: Run the regression test and verify it fails**

~~~bash
npm test -- src/components/features/guest-app/guest-app-prototype.test.tsx -t "Escape"
~~~

Expected: FAIL because the current lightbox does not expose the new dialog name or Escape handler.

- [ ] **Step 3: Add focused CSS states**

Update existing .guest-composer input selectors so only the text input receives field sizing. Add styles for .guest-composer__row, .guest-composer__tool, .guest-composer__recording, .guest-composer__pending, .guest-composer__remove, and .guest-message__attachment using existing tokens. Use a 44 px minimum target, a 48 px image preview, a 36 px audio control, scale(0.96) press feedback, and an image outline of oklch(0 0 0 / 0.1).

~~~css
.guest-composer__row { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 8px; }
.guest-composer__tool, .guest-composer__recording-control, .guest-composer__remove { display: grid; min-width: 44px; min-height: 44px; place-items: center; border: 1px solid var(--guest-line-strong); border-radius: 50%; background: var(--guest-paper); color: var(--guest-ink); }
.guest-composer__text-input { min-width: 0; border-radius: var(--guest-radius-pill); }
.guest-composer__pending { display: flex; align-items: center; gap: 10px; min-height: 64px; padding: 8px 10px; border: 1px solid var(--guest-line); border-radius: var(--guest-radius-md); background: var(--guest-surface); }
.guest-composer__pending img { width: 48px; height: 48px; border-radius: 10px; object-fit: cover; }
.guest-composer__pending audio { min-width: 0; width: 100%; height: 36px; }
.guest-composer__recording { display: flex; align-items: center; gap: 8px; color: var(--guest-accent-strong); font-size: 13px; font-weight: 650; }
.guest-message__attachment { overflow: hidden; margin-top: 8px; border-radius: var(--guest-radius-md); }
.guest-message__attachment img { display: block; width: min(220px, 100%); height: auto; outline: 1px solid oklch(0 0 0 / 0.1); }
.guest-message__attachment audio { display: block; width: min(260px, 100%); }
~~~

Use existing focus, active, disabled, and reduced-motion conventions. Do not introduce a new color system or transition all properties.

- [ ] **Step 4: Make the existing image preview keyboard dismissible**

Give the preview role=dialog, aria-modal=true, aria-label=Image preview, and tabIndex=-1. Focus its close button when it opens, close it on Escape, and keep click-outside close behavior. Keep a visible focus style on the close button.

- [ ] **Step 5: Run the accessibility regression test and verify it passes**

~~~bash
npm test -- src/components/features/guest-app/guest-app-prototype.test.tsx -t "Escape"
~~~

Expected: the image preview opens with a usable close control and closes on Escape.

- [ ] **Step 6: Commit the visual and accessibility pass**

~~~bash
git add src/components/features/guest-app/guest-app-prototype.css src/components/features/guest-app/guest-app-prototype.tsx src/components/features/guest-app/guest-app-prototype.test.tsx
git commit -m "polish: improve front desk chat composer"
~~~

## Task 4: Run the complete verification pass

**Files:**

- Read docs/superpowers/specs/2026-09-17-chat-media-and-quick-actions-design.md
- Read the changed source and test files

- [ ] **Step 1: Run focused chat tests**

~~~bash
npm test -- src/components/features/guest-app/chat-composer.test.tsx src/components/features/guest-app/guest-app-prototype.test.tsx -t "ChatComposer|chat|quick action|image|voice|closed|offline|Escape"
~~~

Expected: all selected new and existing chat tests pass.

- [ ] **Step 2: Run lint and typecheck**

~~~bash
npm run lint
npm run typecheck
~~~

Expected: both commands exit with code 0 and no lint warnings.

- [ ] **Step 3: Run the full test suite and preserve baseline accounting**

~~~bash
npm test -- --reporter=dot
~~~

Expected: report the exact pass/fail count. If the known origin/main baseline mismatch remains, compare the count with a clean detached origin/main worktree and report it separately from focused chat results.

- [ ] **Step 4: Build the production app**

~~~bash
API_BASE_URL=https://jsonplaceholder.typicode.com npm run build
~~~

Expected: Next.js completes compilation, TypeScript, page generation, and optimization with exit code 0.

- [ ] **Step 5: Inspect the final repository boundary**

~~~bash
git diff --check
git status --short --branch
git diff --stat origin/main..HEAD
~~~

Expected: no whitespace errors, no changed tracked files outside this feature, and unrelated docs/badge-art-prompts.md remains untouched if it is still untracked.

- [ ] **Step 6: Verify the live preview**

Open http://localhost:3001/, enter a connected stay, open Chat, and verify quick actions, image preview/send, microphone recording/preview/send, offline delivery state, and closed-chat disabled controls. Do not alter other prototype flows.

- [ ] **Step 7: Commit only a required final correction**

If verification identifies a source-level issue, apply the smallest fix, rerun its affected check, and commit it with a message naming the correction. Do not stage unrelated files.
