import fs from 'node:fs';
import path from 'node:path';
import { PILOT_SETTINGS, type Settings } from '../guest-app/pilot/config';
import { BOOKING_INITIAL, BOOKING_TRANSITIONS, CARD_TRANSITIONS, DONE_STATUSES, EXIT_STATUSES, ROOM_TRANSITIONS } from '../guest-app/pilot/rules';
import { INVARIANT_NAMES } from '../guest-app/pilot/report';
import { INVARIANT_IDS } from '../guest-app/pilot/run';
import { GROUPS, SCENARIOS } from '../guest-app/pilot/scenarios';

/*
  Everything on /cases that is read straight from the pilot code, so it cannot
  drift: the settings, the state tables, the scenario list, the invariants and
  the last recorded run. The written content lives in data/.
*/

type SettingLabel = { label: string; unit: 'min' | 'hours' | 'peso' | 'count'; rule: string };

/** A new setting in config.ts still shows up here, under its raw name, until it gets a label. */
const SETTING_LABELS: Partial<Record<keyof Settings, SettingLabel>> = {
  nearServiceHours: { label: 'A service this close gets the short vendor timer', unit: 'hours', rule: 'BKG-3' },
  vendorTimerNearMin: { label: 'Vendor timer, service within that time', unit: 'min', rule: 'BKG-3' },
  vendorTimerFarOpenMin: { label: 'Vendor timer, otherwise (counted while the vendor is open)', unit: 'min', rule: 'BKG-3' },
  vendorTimerMaxHours: { label: 'Vendor timer, never longer than', unit: 'hours', rule: 'BKG-3' },
  lapseBeforeStartMin: { label: 'A request lapses no later than this before the start', unit: 'min', rule: 'BKG-4' },
  vendorSmsUnopenedMin: { label: 'SMS to the vendor if a request is unopened', unit: 'min', rule: 'BKG-4' },
  offlineGraceMin: { label: 'A vendor tap made offline still counts for', unit: 'min', rule: 'BKG-6' },
  cardWindowMin: { label: 'Card payment window', unit: 'min', rule: 'PAY-4' },
  cardTries: { label: 'Card payment tries', unit: 'count', rule: 'PAY-4' },
  payOrCancelMin: { label: 'Pay in full or cancel window', unit: 'min', rule: 'PAY-13' },
  deskApprovalMin: { label: 'Front desk approval of an over-limit order', unit: 'min', rule: 'PAY-7' },
  perOrderLimit: { label: 'Per-order limit for charge to room', unit: 'peso', rule: 'PAY-6' },
  perStayLimit: { label: 'Per-stay limit for charge to room', unit: 'peso', rule: 'PAY-6' },
  vendorCorrectionMin: { label: 'Vendor can correct an extra charge for', unit: 'min', rule: 'EXT-2' },
  noShowAfterStartMin: { label: 'No-show can be marked after the start', unit: 'min', rule: 'CAN-5' },
  tableHoldMin: { label: 'Table held, then no-show', unit: 'min', rule: 'BKG-9' },
  gatewayReconcileMin: { label: 'Gateway checked for unfinished payments every', unit: 'min', rule: 'PAY-16' },
  pmsRetryMin: { label: 'PMS retry every', unit: 'min', rule: 'PMS-2' },
  pmsRetryForHours: { label: 'PMS retry for', unit: 'hours', rule: 'PMS-2' },
  pmsDeskAlertMin: { label: 'Desk alert for an unposted charge after', unit: 'min', rule: 'PMS-2' },
  guestSmsUnopenedMin: { label: 'SMS to the guest if a critical push is unopened', unit: 'min', rule: 'CHT-11' },
  threadOpenHoursAfterService: { label: 'Guest and vendor chat stays open after the service', unit: 'hours', rule: 'CHT-2' },
  defaultFreeCancelHours: { label: 'Default free-cancel window (each listing sets its own)', unit: 'hours', rule: 'CAN-10' },
  stayConflictDeskHours: { label: 'Stay conflict: the desk handles it before the service by', unit: 'hours', rule: 'CAN-9' },
};

const formatSetting = (value: number, unit: SettingLabel['unit']): string => {
  if (unit === 'peso') return `₱${value.toLocaleString('en-US')}`;
  if (unit === 'min') return value === 1 ? '1 minute' : `${value} minutes`;
  if (unit === 'hours') return value === 1 ? '1 hour' : `${value} hours`;
  return String(value);
};

export type SettingRow = { key: string; label: string; value: string; rule: string };

/** Room-bill limits are switched off in the app, so they are not listed. */
const HIDDEN: (keyof Settings)[] = ['perOrderLimit', 'perStayLimit'];

export const settingRows = (): SettingRow[] =>
  (Object.entries(PILOT_SETTINGS) as [keyof Settings, number][])
    .filter(([key]) => !HIDDEN.includes(key))
    .map(([key, value]) => {
    const meta = SETTING_LABELS[key];
    return { key, label: meta?.label ?? key, value: meta ? formatSetting(value, meta.unit) : String(value), rule: meta?.rule ?? '' };
  });

export type StateRow = { status: string; to: string[]; note: string };

const note = (status: string): string => {
  const bits: string[] = [];
  if ((BOOKING_INITIAL as string[]).includes(status)) bits.push('can start here');
  if ((EXIT_STATUSES as string[]).includes(status)) bits.push('exit');
  if ((DONE_STATUSES as string[]).includes(status)) bits.push('done');
  return bits.join(', ');
};

export const bookingStateRows = (): StateRow[] =>
  Object.entries(BOOKING_TRANSITIONS).map(([status, to]) => ({ status, to, note: note(status) }));

export const roomPaymentRows = (): StateRow[] => Object.entries(ROOM_TRANSITIONS).map(([status, to]) => ({ status, to, note: '' }));
export const cardPaymentRows = (): StateRow[] => Object.entries(CARD_TRANSITIONS).map(([status, to]) => ({ status, to, note: '' }));

export type InvariantRow = { id: string; name: string };
export const invariantRows = (): InvariantRow[] => INVARIANT_IDS.map((id) => ({ id, name: INVARIANT_NAMES[id] ?? '' }));

export type ScenarioRow = { id: string; group: string; title: string; adapted?: string };
export const scenarioRows = (): ScenarioRow[] => SCENARIOS.map(({ id, group, title, adapted }) => ({ id, group, title, adapted }));
export const scenarioGroups = (): string[] => [...GROUPS];

export type LastRun = { ranAt: string; total: number; passed: number; failed: number; invariantChecks: number; seed: number; ids: string[] } | null;

/** The last run the report script wrote, if the file is deployed with the app. */
export function lastRun(): LastRun {
  try {
    const file = path.join(process.cwd(), 'reports', 'pilot', 'results.json');
    const data = JSON.parse(fs.readFileSync(file, 'utf8')) as { ranAt: string; total: number; passed: number; failed: number; invariantChecks: number; seed: number; results: { id: string }[] };
    return { ranAt: data.ranAt, total: data.total, passed: data.passed, failed: data.failed, invariantChecks: data.invariantChecks, seed: data.seed, ids: data.results.map((r) => r.id) };
  } catch {
    return null;
  }
}
