export type SourceTheme = 'system' | 'klarna' | 'wise';
export type ComponentCategory = 'controls' | 'views' | 'overlay' | 'imagery';

export const DEFAULT_COLOR_PICKER_VALUE = '#ffb3d9';

export const sourceThemeDetails: Record<
  SourceTheme,
  { label: string; description: string; className: string; accentName: string }
> = {
  system: {
    label: 'System',
    description: 'Cool white surfaces with quiet lilac accents for neutral comparison.',
    className: 'system',
    accentName: 'System lilac',
  },
  klarna: {
    label: 'Klarna',
    description: 'White surfaces, black ink, soft pink actions, and lilac supporting panels.',
    className: 'klarna',
    accentName: 'Klarna pink',
  },
  wise: {
    label: 'Wise',
    description: 'The same Klarna-shaped components with Wise green as the active accent.',
    className: 'wise',
    accentName: 'Wise green',
  },
};

export const designSystemCategories: Array<{
  id: ComponentCategory;
  label: string;
  count: number;
  description: string;
}> = [
  {
    id: 'controls',
    label: 'Controls',
    count: 14,
    description: 'Inputs and actions that help people make a choice, the Klarna way.',
  },
  {
    id: 'views',
    label: 'Views',
    count: 13,
    description: 'Content patterns that organize information, lists, and status.',
  },
  {
    id: 'overlay',
    label: 'Overlay',
    count: 4,
    description: 'Focused moments that temporarily sit above the page.',
  },
  {
    id: 'imagery',
    label: 'Imagery',
    count: 5,
    description: 'Visual identity, presence, imagery, and supporting illustration.',
  },
];

export const designSystemComponents: Array<{
  name: string;
  category: ComponentCategory;
  description: string;
}> = [
  { name: 'Accordion', category: 'controls', description: 'Progressive disclosure for secondary detail.' },
  { name: 'Button', category: 'controls', description: 'Primary, secondary, quiet, and destructive actions.' },
  { name: 'Checkbox', category: 'controls', description: 'Binary selections in a compact native control.' },
  { name: 'Color Picker', category: 'controls', description: 'A direct color value input with a swatch.' },
  { name: 'Date Picker', category: 'controls', description: 'A native date selection field for time-bound tasks.' },
  { name: 'Floating Action Button', category: 'controls', description: 'A single high-value action anchored to the viewport.' },
  { name: 'Radio Button', category: 'controls', description: 'A single choice from a mutually exclusive set.' },
  { name: 'Search Bar', category: 'controls', description: 'Fast filtering with a familiar leading icon.' },
  { name: 'Segmented Control', category: 'controls', description: 'Switch between a small set of peer views.' },
  { name: 'Slider', category: 'controls', description: 'A continuous value control with an immediate readout.' },
  { name: 'Switch', category: 'controls', description: 'An immediate on or off setting.' },
  { name: 'Tab', category: 'controls', description: 'A compact navigation choice within a view.' },
  { name: 'Text Field', category: 'controls', description: 'Labeled text input with hint and error states.' },
  { name: 'Tile', category: 'controls', description: 'A larger selectable option with supporting context.' },
  { name: 'Badge', category: 'views', description: 'Short metadata or status attached to nearby content.' },
  { name: 'Banner', category: 'views', description: 'Inline messaging with a visible level of importance.' },
  { name: 'Card', category: 'views', description: 'A contained surface for a focused piece of content.' },
  { name: 'Carousel', category: 'views', description: 'A small set of related content with paging controls.' },
  { name: 'Chip', category: 'views', description: 'A compact label or filter that can be dismissed.' },
  { name: 'Divider', category: 'views', description: 'A low-emphasis boundary between related content.' },
  { name: 'Gallery', category: 'views', description: 'A browseable set of visual items with a clear focal item.' },
  { name: 'Loading Indicator', category: 'views', description: 'A compact state signal while content is resolving.' },
  { name: 'Stacked List', category: 'views', description: 'Rows of scannable content with clear hierarchy.' },
  { name: 'Table', category: 'views', description: 'Structured comparison for repeated financial data.' },
  { name: 'Tab Bar', category: 'views', description: 'Persistent navigation across the primary app areas.' },
  { name: 'Toolbar', category: 'views', description: 'A horizontal utility row for actions and context.' },
  { name: 'Top Navigation Bar', category: 'views', description: 'A stable title and action anchor at the top of a screen.' },
  { name: 'Bottom Sheet', category: 'overlay', description: 'A contextual panel that enters from the bottom edge.' },
  { name: 'Dropdown Menu', category: 'overlay', description: 'A compact menu for related actions or choices.' },
  { name: 'Full-Screen Overlay', category: 'overlay', description: 'A focused surface for a high-attention task.' },
  { name: 'Toast', category: 'overlay', description: 'Transient feedback that confirms a completed action.' },
  { name: 'Avatar', category: 'imagery', description: 'A person or entity represented in a compact circle.' },
  { name: 'Icon', category: 'imagery', description: 'A small visual cue that supports an action or label.' },
  { name: 'Illustration', category: 'imagery', description: 'A supporting visual that adds warmth without noise.' },
  { name: 'Logo', category: 'imagery', description: 'A brand mark or product identity lockup.' },
  { name: 'Photo', category: 'imagery', description: 'A cropped image surface for product or editorial context.' },
];
