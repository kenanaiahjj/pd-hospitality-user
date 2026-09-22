/**
 * Holding a sheet on screen long enough to leave.
 *
 * A `<dialog>` that is conditionally rendered has a problem the CSS cannot
 * solve on its own: native `close` fires the instant it closes, the parent
 * drops it from the tree on the next render, and the exit transition never
 * gets a frame to run in. `allow-discrete` keeps the element displayed and in
 * the top layer, but only while it still exists.
 *
 * So the unmount waits. Not the close -- the sheet is gone as far as the guest
 * is concerned the moment they dismiss it -- only React's removal of the node.
 */

/**
 * Slightly longer than the longest exit in `.guest-sheet`: the panel travels
 * out over 220ms and the backdrop fades over 260ms. The slack absorbs a slow
 * frame without letting a dead pause show.
 *
 * Out of step with the stylesheet and one of two things goes wrong -- the sheet
 * vanishes mid-flight, or it has visibly finished leaving and the screen behind
 * it is still waiting.
 */
export const SHEET_EXIT_MS = 300;

/**
 * Runs `onClosed` once the sheet has finished leaving.
 *
 * Reduced motion skips the wait rather than shortening it: there is no exit to
 * wait for there, and a pause with nothing moving in it is just latency.
 */
export function afterSheetExit(onClosed: () => void): void {
  const reduced =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduced) {
    onClosed();
    return;
  }

  window.setTimeout(onClosed, SHEET_EXIT_MS);
}
