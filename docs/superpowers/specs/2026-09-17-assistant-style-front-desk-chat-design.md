# Assistant-style front desk chat Design

> Produced by `superpowers:brainstorming`. Once this document is approved, the
> next step is `superpowers:writing-plans`.

| | |
|---|---|
| **Status** | `Draft` |
| **Created** | 2026-09-17 |
| **Updated** | 2026-09-17 |
| **Owner** | human partner |
| **Plan** | pending approval |
| **Supersedes** | `n/a` |
| **Superseded by** | `n/a` |

## Summary

Rework the existing front-desk chat into an assistant-first conversation
surface. The visual and interaction language can take cues from Grok and Genie:
a welcoming first state, suggested prompts, a quiet status header, an
unobtrusive typing state, and a rounded composer that stays close to the
conversation.

The product meaning remains explicit: this is a conversation with the hotel
front desk, not an autonomous Cabana bot. Existing quick requests, local image
attachments, local voice recordings, offline delivery, unread indicators,
after-hours messaging, closed post-stay chat, booking context, and navigation
remain intact.

## Context

The guest app renders the `chat` and `chat-after-hours` screens in
`src/components/features/guest-app/guest-app-prototype.tsx`. The screen already
has:

- a front-desk status and property description;
- five quick requests: Towels, Housekeeping, Late checkout, Room issue, and
  Transfers;
- a message timeline with guest and desk replies;
- a simulated typing state and desk response;
- local image and voice attachments through `ChatComposer`;
- offline delivery copy and a post-stay closure gate;
- a Chat tab unread indicator when a desk reply arrives elsewhere.

The current experience is functional but reads like a support form. The
redesign should create the immediate sense of a helpful conversation without
inventing an AI identity or changing the underlying front-desk contract.

## Goals

- Make the first chat view feel welcoming and ready to help.
- Make common hotel requests discoverable without making the screen feel like a
  menu of five equal actions.
- Give the conversation a stronger visual hierarchy and more natural rhythm.
- Keep the composer visually close to the active conversation and easy to use
  with one hand.
- Preserve every existing route, state gate, delivery status, attachment
  behavior, and desk-reply path.
- Keep the interface understandable when the desk is offline, after hours, or
  no longer available after checkout.

## Non-goals

- Do not create a new bot name, bot persona, or AI branding.
- Do not claim that an automated assistant is a hotel employee.
- Do not add generative answers, streaming responses, transcription, booking
  changes, service fulfillment, or server-backed chat.
- Do not change the existing quick-action messages or their send behavior.
- Do not change booking, room verification, folio, payment, Explore, or
  navigation logic.
- Do not replace the front-desk route with a separate assistant route.

## Approaches considered

### Recommended: Assistant-first front desk

Use a distinct first-use composition with a compact front-desk identity,
welcoming copy, and suggested request prompts. Once the guest sends a message,
the screen becomes a conversation-first timeline with the same header reduced to
status context. The composer remains a rounded, sticky control at the bottom.

**Why:** This delivers the strongest Grok/Genie-inspired feeling while keeping
the visual language subordinate to the hotel's actual service relationship. It
also gives the existing quick actions a natural home without changing their
semantics.

**Cost:** The screen needs a first-message state and a conversation-started
state, plus responsive rules so the welcome composition does not push the
composer below the fold on a small device.

### Alternative: Conversation-first refinement

Keep the current structure and refine the bubbles, message spacing, desk
identity, typing indicator, and composer.

**Rejected because:** It is the smallest change, but it does not provide the
immediate assistant-like entry moment the request calls for.

### Alternative: AI concierge shell

Add structured answer cards, suggested follow-up questions, service
recommendations, and an assistant identity above the existing front-desk
conversation.

**Rejected because:** It would imply autonomous capability, introduce more
behavior than the prototype supports, and blur the difference between a hotel
team reply and an automated suggestion.

## Design

### Experience model

The screen has two visual modes based on whether the guest has sent a message
in the current conversation:

1. **Welcome mode:** Show a compact front-desk identity, the property name,
   online/after-hours status, and the existing desk greeting. Place the five
   quick requests beneath the greeting as assistant-style prompt chips. The
   conversation area should have enough breathing room to feel intentional,
   but the composer remains visible without scrolling on a phone.
2. **Conversation mode:** Keep the identity and status available as a quiet
   header, then let the message timeline become the dominant surface. Keep
   quick requests available as a horizontally scrollable prompt rail above the
   composer so they remain useful without competing with the transcript.

Tapping a prompt continues to send its existing message immediately. It must
   not silently fill the composer or create a second message path.

### Header and identity

- Use `Front desk` as the primary label.
- Keep the property name in the supporting line so a guest with multiple stays
  knows which team will receive the message.
- Keep the existing status distinctions: `Front desk online`, `Outside staffed
  hours`, and `Chat unavailable`.
- Add a small, neutral desk/avatar mark only as a wayfinding cue. It must not
  look like a named AI character or a personal profile.
- Keep the response-time copy concise and factual.

### Welcome mode

Use a centered, assistant-like opening block without turning the page into a
marketing hero:

- a small desk identity/status row;
- the existing greeting as the first conversational cue;
- a short prompt such as `How can we help with your stay?`;
- the five existing quick requests as compact chips or prompt buttons;
- the composer anchored below the opening content.

The initial desk greeting remains part of the message model, so returning to a
conversation does not duplicate or lose it. Welcome mode ends after the first
guest message and does not return when the guest navigates away and back.

### Conversation mode

- Align desk messages to the leading edge and guest messages to the trailing
  edge.
- Use surface contrast and spacing to distinguish speakers rather than heavy
  bubble decoration or tails.
- Keep message copy, attachments, catalog previews, and delivery states
  unchanged.
- Group adjacent messages from the same sender visually when possible without
  changing the message array or accessibility order.
- Make `Sent`, `Seen`, and `Will send when connected` secondary metadata. They
  must remain available to assistive technology.
- Represent `Front desk is replying` as a quiet typing row with visible text;
  animation is supplemental.

### Composer

Keep `ChatComposer` as the controlled media/composer boundary:

- Use a rounded surface that visually belongs to the chat rather than a generic
  form row.
- Keep image attachment, text entry, and voice/send controls at touch-sized
  targets.
- Show pending image or voice media above the input row with a clear remove
  action.
- Switch the trailing control between `Start voice recording` and `Send
  message` using the existing draft/attachment rule.
- Keep the existing recording state, cancellation, playback, image validation,
  and object URL cleanup behavior.
- Keep the composer disabled when the existing post-stay chat gate closes.

### State behavior

| State | Required presentation | Existing behavior to preserve |
|---|---|---|
| Welcome | Desk identity, greeting, prompt chips, visible composer | Initial desk message and quick-action sends |
| Conversation | Message timeline, compact status, prompt rail, composer | Guest/desk messages, attachments, delivery state |
| Desk replying | Typing row with visible fallback text | Existing simulated reply and 850 ms delay |
| Offline | Conversation remains readable with offline notice | Messages show `Will send when connected` |
| Outside staffed hours | Warning status and response-time copy | Messages can send and receive later |
| Chat closed | Neutral closed state and disabled composer/actions | Existing post-stay 24-hour gate |
| Unread reply elsewhere | Chat tab badge and accessible label | Existing `Chat, new message` behavior |

### Visual system

Use the existing guest-app CSS system and tokens. The visual direction is
restrained and service-oriented:

- neutral page background and white or near-white conversation surfaces;
- one quiet accent for online/active state and prompt emphasis;
- darker ink for guest messages and readable neutral surfaces for desk replies;
- no gradients, decorative bot imagery, or excessive pink surfaces;
- consistent rounded geometry between the chat shell, prompt chips, and
  composer;
- visible focus rings and at least 44-pixel interactive targets.

The assistant inspiration comes from hierarchy, prompt affordances, and
conversation density—not from copying Grok or Genie colors, logos, names, or
specific branded UI.

### Motion

- Use a short, one-time reveal for welcome content only if it does not delay
  access to the composer.
- Use a subtle insertion transition for newly added messages and the typing row.
- Keep prompt press feedback and composer state changes interruptible.
- Do not animate every message or repeatedly animate quick-action chips.
- Provide an immediate static state for `prefers-reduced-motion: reduce`.

## Architecture and data flow

`GuestAppPrototype` remains the source of truth for session, screen, chat
messages, online state, unread state, desk replies, and post-stay gating.

The chat presentation should be isolated behind a focused
`FrontDeskChatView` boundary, either as a small component in the guest-app
feature folder or as a clearly separated render helper if extraction would add
noise. It receives the existing state and callbacks; it must not own booking or
delivery decisions.

`ChatComposer` remains responsible for ephemeral draft, file-picker, recorder,
pending attachment, validation, and object URL lifecycle state. The parent
continues to receive the typed `ChatComposerSubmit` payload and appends the
message through the existing `sendChatMessage` path.

The welcome/conversation distinction is derived from the existing message
history: a conversation is started once at least one guest message exists.
This avoids a second source of truth and keeps navigation away-and-back
behavior consistent.

## Accessibility and failure handling

- Keep a named chat surface and a logical reading order: status, conversation,
  quick requests, then composer.
- Keep prompt buttons keyboard reachable and give them meaningful accessible
  names.
- Announce new desk replies through the existing polite live region without
  repeating the entire transcript.
- Keep visible text for online, after-hours, offline, replying, recording, and
  closed states. Never rely on color, animation, or an icon alone.
- Preserve accessible names for image attachment, voice recording, stop,
  cancel, remove, and send controls.
- Keep failed image selection and microphone permission messages actionable;
  typing and image attachment must remain available when voice is unavailable.
- Preserve the existing image preview dialog, Escape handling, focus return,
  and focus containment.

## Testing and verification

Add focused integration coverage for:

- welcome mode rendering the front-desk identity, greeting, and all five prompt
  actions;
- a prompt sending the same expected guest message and transitioning to
  conversation mode;
- conversation mode preserving existing guest/desk message alignment,
  delivery metadata, catalog images, and simulated typing;
- the composer retaining text, image, voice, validation, and closed-chat
  behavior;
- offline and after-hours states remaining understandable and interactive
  according to the existing rules;
- unread Chat navigation behavior remaining unchanged;
- keyboard names, focus states, and reduced-motion CSS rules for new controls.

Run the focused chat tests, the full test suite, lint, typecheck, production
build, and `git diff --check`. Report unrelated existing prototype failures
separately from failures introduced by this redesign.

## Decisions

- Keep the product role as the hotel front desk.
- Borrow assistant-app interaction patterns, not external branding or claims.
- Use the existing five quick actions and send path.
- Keep the implementation browser-only and prototype-safe.
- Preserve all existing booking, stay, folio, Explore, media, offline, and
  post-stay behavior.
