import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom implements no `matchMedia`, so anything that respects
// prefers-reduced-motion would throw on mount. Report "no preference" -- tests
// that care about the reduced-motion branch should stub it themselves.
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

/*
  jsdom implements <dialog> markup but not its methods. The filter sheet uses
  the real API in the browser -- top layer, focus trap, Escape -- so the shim
  belongs here rather than as a fallback branch in the component.
*/
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.show = function show(this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement, returnValue?: string) {
    this.open = false;
    if (returnValue !== undefined) this.returnValue = returnValue;
    this.dispatchEvent(new Event('close'));
  };
}

afterEach(() => {
  cleanup();
});
