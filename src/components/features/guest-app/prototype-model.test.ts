import { describe, expect, it } from 'vitest';
import {
  SCENARIOS,
  SCREENS,
  getCancellationState,
  getOfflineAction,
} from './prototype-model';

describe('guest app prototype model', () => {
  it('contains the complete 38-screen inventory from the brief', () => {
    expect(SCREENS).toHaveLength(38);
    expect(new Set(SCREENS.map((screen) => screen.id)).size).toBe(38);
  });

  it('exposes every guided flow from A through I', () => {
    expect(SCENARIOS.map((scenario) => scenario.id)).toEqual([
      'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I',
    ]);
  });

  it('allows self-service cancellation before a service cutoff', () => {
    expect(getCancellationState(30, 24)).toBe('self-service');
  });

  it('routes cancellation to the front desk after a service cutoff', () => {
    expect(getCancellationState(4, 24)).toBe('front-desk');
  });

  it('queues communication offline but blocks capacity and money actions', () => {
    expect(getOfflineAction('chat')).toBe('queued');
    expect(getOfflineAction('pre-registration')).toBe('queued');
    expect(getOfflineAction('service-booking')).toBe('blocked');
    expect(getOfflineAction('payment')).toBe('blocked');
    expect(getOfflineAction('wallet')).toBe('available');
  });
});
