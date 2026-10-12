/** What each invariant means. The ids and names are read from the code; only the explanation is written here. */
export const INVARIANT_TEXT: Record<string, string> = {
  I1: 'A slot or stock line never has more holds plus confirmed bookings than its capacity.',
  I2: 'A charge reference is on the folio once, and there is one live gateway payment per record.',
  I3: 'No room charge is posted and no card payment is taken for a confirm-first booking the vendor has not accepted.',
  I4: 'The engine\'s holds equal the bookings\' holds, and no hold outlives its timer or payment window.',
  I5: 'The folio equals the room payments, and the gateway total equals its payments.',
  I6: 'Every state change is an arrow in the state tables. Anything else is refused.',
  I7: 'Every booking is in one state, and every chat and card that shows it agrees.',
  I8: 'Every failure the system cannot settle appears as a desk task with an owner and a due time.',
  I9: 'A checked-out stay has no blocking payment.',
};
