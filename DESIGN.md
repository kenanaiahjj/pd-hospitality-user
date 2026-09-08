---
version: alpha
name: Hospitality consumer app
description: A light mobile guest experience built from pink, white, and black design-system primitives.
colors:
  ink: "oklch(0.16 0.012 275)"
  paper: "oklch(1 0 0)"
  background: "oklch(0.985 0.005 285)"
  line: "oklch(0.88 0.018 285)"
  pink: "oklch(0.82 0.15 345)"
typography:
  sans:
    fontFamily: Asbir Sans
  mono:
    fontFamily: SFMono-Regular, Consolas, Liberation Mono, monospace
rounded:
  sm: 8px
  md: 14px
  lg: 24px
  pill: 999px
---

## Overview

The hospitality consumer app is a mobile-first product surface. It uses a light canvas, direct hierarchy, compact controls, and image-led service discovery. The interface remains unbranded until official property branding is available.

## Colors

Use white for the primary screen surface, black for text and primary actions, and pink for feature surfaces, selection, focus, and supporting emphasis. Reserve green, amber, and red for success, warning, and error states.

## Typography

Use Asbir Sans across the guest experience. Give screen titles the strongest weight and tightest spacing, while keeping body copy and labels readable at mobile sizes. Use the mono stack only for identifiers and technical values.

## Layout

Render the product as an app rather than a framed website. Keep content in one mobile reading column, preserve device safe areas, and group related controls through spacing or a shared surface instead of wrapping every row in its own outlined card.

## Elevation & Depth

Create hierarchy with tonal surfaces, photography, and contrast. Use shadows only for temporary overlays and floating navigation surfaces.

## Shapes

Use the shared small, medium, large, and pill radii consistently. Prefer the medium radius for cards and controls, the large radius for focused panels, and the pill radius for compact filters and status labels.

## Components

Primary buttons use black fills and white labels on light screens. Focused dark surfaces invert the primary action to white with black text. Feature cards use pink or photography; list groups use shared containers with internal dividers; icon actions use compact circular controls. Bottom navigation contains four stable destinations and uses pink with black to identify the active destination.
