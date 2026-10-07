import { CANCEL } from './cancel';
import { CHAT } from './chat';
import { HAPPY } from './happy';
import type { Group, Scenario } from './kit';
import { PAYMENT } from './payment';
import { PMS } from './pms';
import { STRESS } from './stress';
import { TIMING } from './timing';
import { VENDORS } from './vendors';
import { VENUES } from './venues';

/** The 78 scenarios, in the order the scenarios page lists them. */
export const SCENARIOS: Scenario[] = [...HAPPY, ...TIMING, ...PAYMENT, ...PMS, ...CANCEL, ...VENDORS, ...VENUES, ...CHAT, ...STRESS];

export const GROUPS: Group[] = ['Happy paths', 'Timing and races', 'Payment', 'PMS and the bill', 'Cancellations', 'Vendors and listings', "Restaurants and pasalubong at Henry's", 'Chat and cards', 'Stress and chaos'];
