/*
  The shapes of the content on /cases. Text fields are "rich": **bold** and
  [[pill:kind:Label]] are the only markup, so the data files stay readable.
*/

export type Rich = string;

export type TableRow = { group: string } | { cells: Rich[] };

export type Block =
  | { t: 'p'; text: Rich; note?: boolean }
  | { t: 'h3'; text: string }
  | { t: 'rules'; items: { title: string; text: Rich }[] }
  | { t: 'cards'; items: { title: string; pill: string | null; pillText: string | null; lines: string[]; who: string | null }[] }
  | { t: 'table'; kind: 'cases' | 'plain'; head: string[]; rows: TableRow[] }
  | { t: 'flow'; key: string; caption: Rich }
  | { t: 'legend' }
  | { t: 'rulebook' }
  | { t: 'scale-chart'; caption: Rich }
  | { t: 'scale-table' };

export type Section = { id: string; eyebrow?: string; title?: string; blocks: Block[] };

export type FlowNode = { id: string; lane: string; col: number; text: string; kind?: 'act' | 'dec' | 'end' };
export type FlowEdge = [string, string] | [string, string, string];
export type Flow = { label: string; lanes: string[]; nodes: FlowNode[]; edges: FlowEdge[] };

export type RuleSource = 'Meeting' | 'Ken' | 'Test value' | 'App';
export type RuleStatus = 'Built' | 'Partly' | 'Not built';
export type Rule = { id: string; text: string; from: RuleSource; status: RuleStatus; note?: string; drawn: string };
export type RuleGroup = { group: string; rules: Rule[] };
export type KnownGap = { title: string; text: string };

export type ScenarioText = { title: string; given: string; when: string; then: string };
