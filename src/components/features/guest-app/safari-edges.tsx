'use client';

import { useEffect } from 'react';
import './safari-edges.css';

type Palette = { top: string; bottom: string };

/**
 * Blends every background stacked at a point, bottom layer first, into one
 * opaque colour. The canvas does the alpha compositing and parses whatever
 * syntax the computed style hands back (oklch included). html and body are
 * left out, since they carry the colours this writes; `base` stands in for them.
 */
function colourAt(context: CanvasRenderingContext2D, x: number, y: number, base: string): string {
  const layers = document
    .elementsFromPoint(x, y)
    .filter((element) => element !== document.documentElement && element !== document.body)
    .map((element) => getComputedStyle(element).backgroundColor)
    .filter((colour) => colour && colour !== 'transparent' && colour !== 'rgba(0, 0, 0, 0)');
  context.globalCompositeOperation = 'copy';
  context.fillStyle = base;
  context.fillRect(0, 0, 1, 1);
  context.globalCompositeOperation = 'source-over';
  for (const colour of layers.reverse()) {
    context.fillStyle = colour;
    context.fillRect(0, 0, 1, 1);
  }
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
  return `rgb(${r} ${g} ${b})`;
}

/**
 * Matches the colours behind mobile Safari's status bar and bottom controls to
 * the page's visible top and bottom edges. One palette is calculated per
 * change and applied to the edge strips, the html and body backgrounds, and
 * the theme-color meta tag; everything shared is restored on unmount.
 */
export function SafariEdges() {
  useEffect(() => {
    const root = document.documentElement;
    const { body } = document;

    /* Appended to body directly, so no transformed ancestor can trap them. */
    const strips = (['edge-top', 'edge-bottom'] as const).map((name) => {
      const strip = document.createElement('div');
      strip.className = name;
      strip.setAttribute('aria-hidden', 'true');
      body.append(strip);
      return strip;
    });
    const [topStrip, bottomStrip] = strips;

    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const createdMeta = !meta;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.append(meta);
    }
    const themeMeta = meta;

    const previous = {
      rootBackground: root.style.getPropertyValue('background-color'),
      bodyBackground: body.style.getPropertyValue('background-color'),
      themeColor: themeMeta.getAttribute('content'),
    };

    /* The page colour the stylesheet gives, read before anything here overrides it. */
    const base = getComputedStyle(body).backgroundColor;
    const context = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    let palette: Palette | null = null;
    let frame = 0;

    const apply = () => {
      frame = 0;
      if (!context) return;
      /* Sample just inside each strip, the background it sits against. */
      const x = window.innerWidth / 2;
      const next: Palette = {
        top: colourAt(context, x, topStrip.offsetHeight + 1, base),
        bottom: colourAt(context, x, window.innerHeight - bottomStrip.offsetHeight - 1, base),
      };
      if (palette && palette.top === next.top && palette.bottom === next.bottom) return;
      palette = next;
      root.style.setProperty('--edge-top-background', next.top);
      root.style.setProperty('--edge-bottom-background', next.bottom);
      root.style.setProperty('background-color', next.top);
      body.style.setProperty('background-color', next.bottom);
      themeMeta.setAttribute('content', next.top);
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };

    /* The app scrolls inside its own containers, so scroll is caught at the document. */
    const listeners: [EventTarget, string][] = [
      [document, 'scroll'],
      [document, 'transitionend'],
      [document, 'animationend'],
      [window, 'resize'],
      [window, 'pageshow'],
      [window, 'load'],
    ];
    if (window.visualViewport) {
      listeners.push([window.visualViewport, 'resize'], [window.visualViewport, 'scroll']);
    }
    for (const [target, type] of listeners) {
      target.addEventListener(type, schedule, { capture: true, passive: true });
    }

    /* Screens and sheets change the edges without any scroll. Our own body style write is skipped. */
    const observer = new MutationObserver((mutations) => {
      if (mutations.some((m) => !(m.target === body && m.attributeName === 'style'))) schedule();
    });
    observer.observe(body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style', 'hidden', 'open'] });

    apply();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      for (const [target, type] of listeners) {
        target.removeEventListener(type, schedule, { capture: true });
      }
      for (const strip of strips) strip.remove();
      root.style.removeProperty('--edge-top-background');
      root.style.removeProperty('--edge-bottom-background');
      if (previous.rootBackground) root.style.setProperty('background-color', previous.rootBackground);
      else root.style.removeProperty('background-color');
      if (previous.bodyBackground) body.style.setProperty('background-color', previous.bodyBackground);
      else body.style.removeProperty('background-color');
      if (createdMeta) themeMeta.remove();
      else if (previous.themeColor === null) themeMeta.removeAttribute('content');
      else themeMeta.setAttribute('content', previous.themeColor);
    };
  }, []);

  return null;
}
