/*
  The experiment registry.

  Experiments are separate flows that share the app's design system and its
  device frame, and nothing else. They do not read or write `GuestSession`,
  they are not reachable from the guest app's own navigation, and the guest
  flow's screen model knows nothing about them -- so an experiment can be
  torn apart without putting a single production screen at risk.

  Adding one is a row here plus a component. Nothing in the guest flow
  changes.
*/

export type ExperimentFlowId = 'qr-scan' | 'explore';

export type ExperimentFlow = {
  id: ExperimentFlowId;
  label: string;
  detail: string;
  /**
   * Whether the app bar and tab bar stay on screen.
   *
   * A scanner is a full-bleed takeover -- chrome around a viewfinder reads as
   * a screenshot of a camera rather than a camera. A discovery page is a tab,
   * and judging its density without the bars around it would flatter it.
   */
  chrome: 'full-bleed' | 'app';
};

export const EXPERIMENT_FLOWS: ExperimentFlow[] = [
  {
    id: 'qr-scan',
    label: 'QR scanning',
    detail: 'Viewfinder, detection, and what happens after',
    chrome: 'full-bleed',
  },
  {
    id: 'explore',
    label: 'Activity discovery',
    detail: 'Browsing and finding things to book',
    chrome: 'app',
  },
];

/** What the controls panel switches between: the real app, or one experiment. */
export type FlowId = 'guest' | ExperimentFlowId;

export const findExperiment = (id: FlowId): ExperimentFlow | undefined =>
  EXPERIMENT_FLOWS.find((flow) => flow.id === id);

/** The query parameter that opens a flow directly: `/?flow=qr-scan`. */
export const FLOW_PARAM = 'flow';

/** Guards a value off the URL, which is user input like any other. */
export function isFlowId(value: string | null): value is FlowId {
  return value === 'guest' || EXPERIMENT_FLOWS.some((flow) => flow.id === value);
}
