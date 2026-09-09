---
version: alpha
name: Cabana guest app
description: A light, neutral hospitality guest app where one pink accent marks the next action and nothing else.
colors:
  primary: "oklch(0.79 0.18 345)"
  ink: "oklch(0.16 0.012 275)"
  paper: "oklch(1 0 0)"
  background: "oklch(0.968 0.002 285)"
  surface: "oklch(0.972 0.003 285)"
  line: "oklch(0.912 0.004 285)"
  accentStrong: "oklch(0.5 0.19 351)"
  accentSoft: "oklch(0.955 0.028 345)"
typography:
  sans:
    fontFamily: Asbir Sans
  mono:
    fontFamily: SFMono-Regular, Consolas, Liberation Mono, monospace
rounded:
  xs: 8px
  sm: 10px
  md: 16px
  lg: 20px
  pill: 999px
---

## Overview

Cabana is a task-first mobile app for people who are mid-stay. The screen should
disappear into the task: find the room, book the massage, read the folio,
message the desk. Craft shows up as restraint — a quiet canvas, honest
hierarchy, and controls that answer instantly — not as decoration.

## Colors

The canvas is a light neutral grey; content sits on white surfaces separated by
hairlines. Ink carries the hierarchy.

Cabana pink is a **restrained** accent with exactly three jobs: the primary
action, the current selection, and live state (active tab, focus ring, progress).
It is never a background wash and never decoration. Because the brand pink is a
light surface colour, anything filled with it takes **ink** on top — white text
on pink fails contrast, ink clears it at 8.9:1. Where pink has to be text or an
icon on a light surface, use the darker `accentStrong`.

One inverted surface exists — near-black — and it is reserved for totals: the
folio total. It is the strongest object on a screen, so no more than one appears
at a time.

Green, amber, and red are status only, and never borrow the brand hue.

## Typography

Asbir Sans in one family across the app; hierarchy comes from weight and size,
not from a second face. The scale is fixed, not fluid: 30px screen titles at
weight 700 and -0.022em, 17px section titles, 15px body, 13–14px supporting text.
Headings balance, prose wraps pretty, and any number that can change is set in
tabular figures so rows never shift.

## Layout

One mobile reading column, capped at 480px and centred on wider screens. The
frame is three flex rows — navigation bar, scrolling content, tab bar — so nothing
overlaps and nothing needs a magic offset. Related rows share one inset surface
with internal separators instead of each row wearing its own card.

## Elevation & Depth

Depth comes from tonal surfaces first. A surface takes a hairline **or** a
shadow, never both. Shadows are layered and transparent, and are reserved for
things that genuinely float: sheets, toasts, menus. The navigation bar's hairline
only appears once content has scrolled under it.

## Shapes

Cards and grouped lists use the 16px radius; the folio total and sheets
use 20px; buttons, tags, chips, and the search field are pills. Nested shapes are
concentric — an inner radius plus its padding equals the outer radius.

## Motion

Motion conveys state and nothing else: 140ms press, 160ms hover and colour,
220ms screen change. Everything eases out on `cubic-bezier(0.23, 1, 0.32, 1)`;
nothing eases in. Every pressable element scales to 0.96–0.98 on `:active` so the
interface feels like it heard the tap. Hover states are gated behind
`(hover: hover) and (pointer: fine)` so a tap never leaves a stuck highlight, no
transition is declared on `all`, and reduced motion keeps the fades while dropping
every movement.

## Components

Primary actions are pink pills with ink labels. Secondary actions are white pills
with a hairline. Tertiary actions are accent-coloured text buttons. Every
interactive element clears a 44px target and ships default, hover, focus, active,
and disabled. Selection — a date, a time slot, a tile — is the accent fill with
ink on top. The tab bar is flat and full-width with four stable destinations, and
marks the current one with the accent, not with a coloured pill.
