/*
  Every setting the pilot simulation runs on, in one place.

  These are test values for the simulation, not agreed with Henry's. Changing
  one here changes it everywhere: the engine, the scenarios and the report all
  read this object. Times are minutes unless the name says otherwise.
*/

export type Settings = {
  /** A service starting within this many hours gets the short vendor timer. */
  nearServiceHours: number;
  vendorTimerNearMin: number;
  /** Otherwise: this many minutes, counted only while the vendor is open. */
  vendorTimerFarOpenMin: number;
  /** Never longer than this, wall clock. */
  vendorTimerMaxHours: number;
  /** The request lapses no later than this long before the service starts. */
  lapseBeforeStartMin: number;
  /** A vendor who has not opened a request gets an SMS after this long. */
  vendorSmsUnopenedMin: number;
  /** A vendor action taken offline counts if made before the deadline plus this. */
  offlineGraceMin: number;
  cardWindowMin: number;
  cardTries: number;
  /** The guest chose "pay in full or cancel" and has not decided. */
  payOrCancelMin: number;
  deskApprovalMin: number;
  perOrderLimit: number;
  perStayLimit: number;
  vendorCorrectionMin: number;
  noShowAfterStartMin: number;
  tableHoldMin: number;
  gatewayReconcileMin: number;
  pmsRetryMin: number;
  pmsRetryForHours: number;
  pmsDeskAlertMin: number;
  /** A critical push that is not opened in this long is sent again as an SMS. */
  guestSmsUnopenedMin: number;
  threadOpenHoursAfterService: number;
  /** Cancelling is free this long before a service starts, unless the listing says otherwise. */
  defaultFreeCancelHours: number;
  /** A stay change that leaves a booking outside it: the desk handles it this long before the service. */
  stayConflictDeskHours: number;
};

export const PILOT_SETTINGS: Settings = {
  nearServiceHours: 24,
  vendorTimerNearMin: 30,
  vendorTimerFarOpenMin: 240,
  vendorTimerMaxHours: 24,
  lapseBeforeStartMin: 15,
  vendorSmsUnopenedMin: 5,
  offlineGraceMin: 5,
  cardWindowMin: 15,
  cardTries: 3,
  payOrCancelMin: 15,
  deskApprovalMin: 10,
  perOrderLimit: 5000,
  perStayLimit: 20000,
  vendorCorrectionMin: 60,
  noShowAfterStartMin: 30,
  tableHoldMin: 15,
  gatewayReconcileMin: 2,
  pmsRetryMin: 5,
  pmsRetryForHours: 24,
  pmsDeskAlertMin: 30,
  guestSmsUnopenedMin: 10,
  threadOpenHoursAfterService: 48,
  defaultFreeCancelHours: 24,
  stayConflictDeskHours: 24,
};
