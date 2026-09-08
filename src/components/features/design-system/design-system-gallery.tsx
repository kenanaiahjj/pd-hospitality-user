'use client';

import { useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookmarkSimple,
  ChartLineUp,
  CheckCircle,
  CreditCard,
  DotsThree,
  Gear,
  Globe,
  House,
  Lightning,
  LockKey,
  MagnifyingGlass,
  Plus,
  ShieldCheck,
  SlidersHorizontal,
  Sparkle,
  UserCircle,
  Wallet,
} from '@phosphor-icons/react';
import {
  designSystemCategories,
  designSystemComponents,
  sourceThemeDetails,
} from '@/lib/design-system';
import type { ComponentCategory, SourceTheme } from '@/lib/design-system';
import {
  SourceAvatar,
  SourceAccordion,
  SourceBadge,
  SourceBanner,
  SourceBottomSheet,
  SourceButton,
  SourceCard,
  SourceCarousel,
  SourceCheckbox,
  SourceChip,
  SourceColorPicker,
  SourceDatePicker,
  SourceDropdownMenu,
  SourceDivider,
  SourceFloatingActionButton,
  SourceFullScreenOverlay,
  SourceGallery,
  SourceIcon,
  SourceIllustration,
  SourceLoadingIndicator,
  SourceLogo,
  SourcePhoto,
  SourceRadioGroup,
  SourceSearchBar,
  SourceSegmentedControl,
  SourceSlider,
  SourceStackedList,
  SourceStatusDot,
  SourceTable,
  SourceSwitch,
  SourceTab,
  SourceTabBar,
  SourceTextField,
  SourceTile,
  SourceToast,
  SourceToolbar,
  SourceTopNavigationBar,
} from '@/components/ui';

type GalleryCategory = 'all' | ComponentCategory;

const themeOptions = [
  { value: 'system', label: 'System' },
  { value: 'klarna', label: 'Klarna' },
  { value: 'wise', label: 'Wise' },
];

const categoryOptions = [
  { value: 'all', label: 'All elements' },
  ...designSystemCategories.map((category) => ({ value: category.id, label: category.label })),
];

function Specimen({
  name,
  description,
  children,
  className,
}: {
  name: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <article className={`specimen ${className ?? ''}`}>
      <div className="specimen__meta">
        <h3>{name}</h3>
        <p>{description}</p>
      </div>
      <div className="specimen__stage">{children}</div>
    </article>
  );
}

function SectionHeader({
  number,
  eyebrow,
  title,
  description,
  titleId,
}: {
  number: string;
  eyebrow: string;
  title: string;
  description: string;
  titleId: string;
}) {
  return (
    <div className="gallery-section__header">
      <span className="gallery-section__number">{number}</span>
      <div>
        <span className="gallery-section__eyebrow">{eyebrow}</span>
        <h2 id={titleId}>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

function matchesComponent(category: ComponentCategory, name: string, query: string, selectedCategory: GalleryCategory) {
  if (selectedCategory !== 'all' && selectedCategory !== category) {
    return false;
  }

  if (!query.trim()) {
    return true;
  }

  const normalizedQuery = query.trim().toLowerCase();
  const component = designSystemComponents.find((item) => item.name === name);
  return Boolean(component && `${component.name} ${component.description}`.toLowerCase().includes(normalizedQuery));
}

export function DesignSystemGallery() {
  const [theme, setTheme] = useState<SourceTheme>('klarna');
  const [selectedCategory, setSelectedCategory] = useState<GalleryCategory>('all');
  const [query, setQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('card');
  const [selectedTab, setSelectedTab] = useState('activity');
  const [selectedNav, setSelectedNav] = useState('home');
  const [isRewardsEnabled, setIsRewardsEnabled] = useState(true);
  const [isNewsletterChecked, setIsNewsletterChecked] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [fullScreenOpen, setFullScreenOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(true);
  const [selectedTile, setSelectedTile] = useState('personal');

  const visibleCount = useMemo(
    () => designSystemComponents.filter((component) => matchesComponent(component.category, component.name, query, selectedCategory)).length,
    [query, selectedCategory],
  );

  const themeDetail = sourceThemeDetails[theme];

  const show = (category: ComponentCategory, name: string) => matchesComponent(category, name, query, selectedCategory);

  return (
    <div className="gallery" data-source-theme={theme}>
      <div className="gallery__grain" aria-hidden="true" />
      <header className="gallery-masthead">
        <a className="gallery-wordmark" href="#top" aria-label="Asbir Source UI home">
          <span className="gallery-wordmark__mark">A</span>
          <span>
            <strong>Asbir Source UI</strong>
            <small>component reference</small>
          </span>
        </a>
        <div className="gallery-masthead__right">
          <span className="gallery-masthead__status"><span /> synced to source patterns</span>
          <a className="gallery-masthead__link" href="/dashboard">Dashboard <ArrowUpRight aria-hidden="true" /></a>
        </div>
      </header>

      <main id="top" className="gallery__main">
        <section className="gallery-hero" aria-labelledby="gallery-title">
          <div className="gallery-hero__copy">
            <div className="gallery-kicker"><span>KLARNA UI ELEMENTS</span><span className="gallery-kicker__line" /><span>01—36</span></div>
            <h1 id="gallery-title">Klarna <span>×</span> Wise,<br /> <em>made reusable.</em></h1>
            <p className="gallery-hero__lede">
              A source-aware component library distilled from two of the clearest mobile finance systems. Warm enough to feel human, precise enough to ship.
            </p>
            <div className="gallery-hero__actions">
              <SourceButton size="lg" trailingIcon={<ArrowRight aria-hidden="true" />} onClick={() => document.querySelector('#controls')?.scrollIntoView({ behavior: 'smooth' })}>
                Explore components
              </SourceButton>
              <a className="gallery-text-link" href="#foundation">View tokens <ArrowUpRight aria-hidden="true" /></a>
            </div>
          </div>
          <div className="gallery-hero__visual" aria-label="Design system preview">
            <div className="hero-card hero-card--back hero-card--green">
              <span className="hero-card__tiny-label">WISE / BALANCE</span>
              <strong>$2,840.24</strong>
              <span className="hero-card__sparkline"><span /><span /><span /><span /><span /><span /><span /></span>
            </div>
            <div className="hero-card hero-card--front">
              <div className="hero-card__topline"><span className="hero-card__k-logo">K</span><span>Available to spend <DotsThree aria-hidden="true" /></span></div>
              <strong>$1,280.40</strong>
              <div className="hero-card__footline"><span>•••• 2488</span><span>Today</span></div>
            </div>
            <div className="hero-orbit hero-orbit--one" />
            <div className="hero-orbit hero-orbit--two" />
            <span className="hero-note hero-note--pink">soft signal</span>
            <span className="hero-note hero-note--green">clear action</span>
          </div>
        </section>

        <section className="gallery-toolbar" aria-label="Component filters">
          <div className="gallery-toolbar__intro">
            <span className="gallery-toolbar__eyebrow">Browse the system</span>
            <strong>{visibleCount} of {designSystemComponents.length} elements</strong>
          </div>
          <SourceSegmentedControl
            label="Source theme"
            options={themeOptions}
            value={theme}
            onValueChange={(value) => setTheme(value as SourceTheme)}
            className="gallery-theme-switcher"
          />
          <SourceSearchBar value={query} onValueChange={setQuery} placeholder="Search elements" className="gallery-search" />
        </section>
        <div className="gallery-filter-row" aria-label="Filter by component category">
          <span className="gallery-filter-row__label">Filter by</span>
          {categoryOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-label={option.value === 'all' ? option.label : `${option.label} ${designSystemCategories.find((category) => category.id === option.value)?.count}`}
              className="gallery-filter"
              data-state={selectedCategory === option.value ? 'active' : 'inactive'}
              onClick={() => setSelectedCategory(option.value as GalleryCategory)}
            >
              {option.label}
              {option.value !== 'all' ? <><span>{' '}</span><span>{designSystemCategories.find((category) => category.id === option.value)?.count}</span></> : null}
            </button>
          ))}
        </div>

        {selectedCategory === 'all' && !query ? (
          <section className="source-callout" aria-label="Source themes">
            <div className="source-callout__main">
              <span className="source-callout__icon"><Sparkle weight="fill" aria-hidden="true" /></span>
              <div>
                <span className="source-callout__eyebrow">Current lens / {themeDetail.label}</span>
                <h2>{themeDetail.accentName}, balanced for everyday use.</h2>
                <p>{themeDetail.description} The component contracts stay shared while color and emphasis shift with the selected source.</p>
              </div>
            </div>
            <div className="source-callout__tokens">
              <span><i className="token-swatch token-swatch--accent" />accent</span>
              <span><i className="token-swatch token-swatch--surface" />surface</span>
              <span><i className="token-swatch token-swatch--ink" />ink</span>
            </div>
          </section>
        ) : null}

        {designSystemCategories.map((category) => {
          const isVisible = category.id === 'controls' || category.id === 'views' || category.id === 'overlay' || category.id === 'imagery';
          if (!isVisible || (selectedCategory !== 'all' && selectedCategory !== category.id)) {
            return null;
          }

          const sectionHasVisibleItems = designSystemComponents.some((component) => matchesComponent(component.category, component.name, query, selectedCategory) && component.category === category.id);
          if (!sectionHasVisibleItems) {
            return null;
          }

          return (
            <section key={category.id} id={category.id} className={`gallery-section gallery-section--${category.id}`} aria-labelledby={`${category.id}-title`}>
              <SectionHeader
                number={String(designSystemCategories.indexOf(category) + 1).padStart(2, '0')}
                eyebrow={`${category.label} / ${category.count} patterns`}
                title={category.id === 'controls' ? 'Make the next step clear.' : category.id === 'views' ? 'Give information a shape.' : category.id === 'overlay' ? 'Bring focus forward.' : 'Let identity do some work.'}
                description={category.description}
                titleId={`${category.id}-title`}
              />

              {category.id === 'controls' ? (
                <div className="specimen-grid specimen-grid--controls">
                  {show('controls', 'Accordion') ? <Specimen name="Accordion" description="Progressive disclosure for secondary detail."><SourceAccordion title="Why Klarna?">Flexible payments, clear status, and secure controls in one place.</SourceAccordion></Specimen> : null}
                  {show('controls', 'Button') ? <Specimen name="Button" description="Action hierarchy without visual noise." className="specimen--wide"><div className="specimen-stack"><div className="specimen-row"><SourceButton trailingIcon={<ArrowRight aria-hidden="true" />}>Continue</SourceButton><SourceButton variant="secondary">Save for later</SourceButton><SourceButton variant="quiet" leadingIcon={<BookmarkSimple aria-hidden="true" />}>Save</SourceButton></div><div className="specimen-row"><SourceButton size="sm">Small action</SourceButton><SourceButton size="lg" variant="danger">Remove card</SourceButton></div></div></Specimen> : null}
                  {show('controls', 'Checkbox') ? <Specimen name="Checkbox" description="Native binary choice with a generous target."><SourceCheckbox label="Notify me about rate changes" checked={isNewsletterChecked} onCheckedChange={setIsNewsletterChecked} /></Specimen> : null}
                  {show('controls', 'Color Picker') ? <Specimen name="Color Picker" description="A compact value field that keeps the swatch visible."><SourceColorPicker label="Card accent" /></Specimen> : null}
                  {show('controls', 'Date Picker') ? <Specimen name="Date Picker" description="Use the native calendar affordance for a date."><SourceDatePicker label="Payment date" hint="Choose when you want the payment to be due." /></Specimen> : null}
                  {show('controls', 'Floating Action Button') ? <Specimen name="Floating Action Button" description="One high-value action, always within reach."><SourceFloatingActionButton label="Add payment" /></Specimen> : null}
                  {show('controls', 'Radio Button') ? <Specimen name="Radio Button" description="One answer, made scannable."><SourceRadioGroup label="Payment method" options={[{ value: 'card', label: 'Debit card' }, { value: 'bank', label: 'Bank transfer' }]} defaultValue="card" /></Specimen> : null}
                  {show('controls', 'Search Bar') ? <Specimen name="Search Bar" description="Filter long lists without hiding the field."><SourceSearchBar defaultValue="London" placeholder="Search a recipient" /></Specimen> : null}
                  {show('controls', 'Segmented Control') ? <Specimen name="Segmented Control" description="Peer choices stay in one comfortable row."><SourceSegmentedControl label="Statement period" options={[{ value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }, { value: 'year', label: 'Year' }]} defaultValue="month" /></Specimen> : null}
                  {show('controls', 'Slider') ? <Specimen name="Slider" description="A continuous value with an immediate readout."><SourceSlider label="Spending limit" defaultValue={68} /></Specimen> : null}
                  {show('controls', 'Switch') ? <Specimen name="Switch" description="Immediate settings with a clear current value."><SourceSwitch label="Rewards enabled" checked={isRewardsEnabled} onCheckedChange={setIsRewardsEnabled} /></Specimen> : null}
                  {show('controls', 'Tab') ? <Specimen name="Tab" description="An individual tab is still useful on its own."><div className="specimen-tab-row"><SourceTab label="Activity" active={selectedTab === 'activity'} onClick={() => setSelectedTab('activity')} /><SourceTab label="Details" active={selectedTab === 'details'} onClick={() => setSelectedTab('details')} /><SourceTab label="Notes" active={selectedTab === 'notes'} onClick={() => setSelectedTab('notes')} /></div></Specimen> : null}
                  {show('controls', 'Text Field') ? <Specimen name="Text Field" description="A calm field for high-intent input."><SourceTextField label="Recipient name" placeholder="Enter a name" hint="Use the name on their bank account" /></Specimen> : null}
                  {show('controls', 'Tile') ? <Specimen name="Tile" description="A bigger choice for moments that need context." className="specimen--wide"><div className="specimen-tile-row"><SourceTile title="Personal account" description="For everyday spending and saving" selected={selectedTile === 'personal'} onSelectedChange={() => setSelectedTile('personal')} icon={<UserCircle aria-hidden="true" />} /><SourceTile title="Business account" description="For your company and team" selected={selectedTile === 'business'} onSelectedChange={() => setSelectedTile('business')} icon={<ChartLineUp aria-hidden="true" />} /></div></Specimen> : null}
                </div>
              ) : null}

              {category.id === 'views' ? (
                <div className="specimen-grid specimen-grid--views">
                  {show('views', 'Badge') ? <Specimen name="Badge" description="Metadata that stays close to its subject."><div className="specimen-row"><SourceBadge>New</SourceBadge><SourceBadge tone="success">Verified</SourceBadge><SourceBadge tone="warning">Review</SourceBadge><SourceBadge tone="danger">Action needed</SourceBadge></div></Specimen> : null}
                  {show('views', 'Banner') ? <Specimen name="Banner" description="A visible message with an appropriate level of urgency." className="specimen--wide"><SourceBanner title="Your card is ready" icon={<CheckCircle weight="fill" aria-hidden="true" />} action={<button type="button" className="source-inline-action">View card <ArrowRight aria-hidden="true" /></button>}>Add it to your wallet to start spending.</SourceBanner></Specimen> : null}
                  {show('views', 'Card') ? <Specimen name="Card" description="A contained surface for one clear idea."><SourceCard eyebrow="CASHBACK" title="$12.40 earned" icon={<Sparkle weight="fill" aria-hidden="true" />} footer={<button type="button" className="source-inline-action">See rewards <ArrowRight aria-hidden="true" /></button>}><p className="source-card__metric-copy">You are on track to earn <strong>$18.00</strong> this month.</p></SourceCard></Specimen> : null}
                  {show('views', 'Carousel') ? <Specimen name="Carousel" description="Paging that tells you where you are."><SourceCarousel labels={['Main balance', 'Travel fund', 'Shared pot']} items={[<div key="one" className="carousel-slide carousel-slide--pink"><span>MAIN BALANCE</span><strong>$1,280.40</strong><small>Available now</small></div>, <div key="two" className="carousel-slide carousel-slide--green"><span>TRAVEL FUND</span><strong>$840.00</strong><small>Paris · October</small></div>, <div key="three" className="carousel-slide carousel-slide--blue"><span>SHARED POT</span><strong>$240.20</strong><small>4 contributors</small></div>]} /></Specimen> : null}
                  {show('views', 'Chip') ? <Specimen name="Chip" description="Small enough to group. Clear enough to scan."><div className="specimen-row"><SourceChip selected>All</SourceChip><SourceChip>Completed</SourceChip><SourceChip dismissible>Europe</SourceChip></div></Specimen> : null}
                  {show('views', 'Divider') ? <Specimen name="Divider" description="A quiet line that keeps related content together."><div className="divider-demo"><span>Account details</span><SourceDivider /><span>Recent activity</span><SourceDivider /><span>Support</span></div></Specimen> : null}
                  {show('views', 'Gallery') ? <Specimen name="Gallery" description="A browseable set of visual items with one clear focus." className="specimen--wide"><SourceGallery items={[{ id: 'stores', label: 'Stores for you', children: <span className="gallery-media gallery-media--pink">K</span> }, { id: 'offers', label: 'Offers', children: <span className="gallery-media gallery-media--lilac">%</span> }, { id: 'saved', label: 'Saved', children: <span className="gallery-media gallery-media--ink">♡</span> }]} /></Specimen> : null}
                  {show('views', 'Loading Indicator') ? <Specimen name="Loading Indicator" description="A compact signal while content is resolving."><SourceLoadingIndicator label="Loading recommendations" /></Specimen> : null}
                  {show('views', 'Stacked List') ? <Specimen name="Stacked List" description="Rows with a clear reading order." className="specimen--wide"><SourceStackedList items={[{ id: 'one', title: 'Coffee shop', description: 'Today, 09:42', value: '− $4.80', leading: <SourceIcon tone="soft"><Sparkle aria-hidden="true" /></SourceIcon> }, { id: 'two', title: 'Salary payment', description: 'Yesterday, 17:12', value: '+ $2,400.00', leading: <SourceIcon tone="soft"><ArrowRight aria-hidden="true" /></SourceIcon> }, { id: 'three', title: 'Wise transfer', description: 'Yesterday, 10:03', value: '− $120.00', leading: <SourceIcon tone="soft"><Globe aria-hidden="true" /></SourceIcon> }]} /></Specimen> : null}
                  {show('views', 'Table') ? <Specimen name="Table" description="Structured comparison for repeated financial data." className="specimen--wide"><SourceTable caption="Recent activity" columns={['Merchant', 'Date', 'Amount']} rows={[{ id: 'coffee', cells: ['Coffee shop', 'Today', '− $4.80'] }, { id: 'salary', cells: ['Salary payment', 'Yesterday', '+ $2,400.00'] }, { id: 'transfer', cells: ['Wise transfer', 'Yesterday', '− $120.00'] }]} /></Specimen> : null}
                  {show('views', 'Tab Bar') ? <Specimen name="Tab Bar" description="Persistent navigation belongs at the edge of the screen." className="specimen--wide"><SourceTabBar items={[{ value: 'home', label: 'Home', icon: <House aria-hidden="true" /> }, { value: 'cards', label: 'Cards', icon: <CreditCard aria-hidden="true" /> }, { value: 'activity', label: 'Activity', icon: <ChartLineUp aria-hidden="true" /> }, { value: 'profile', label: 'Profile', icon: <UserCircle aria-hidden="true" /> }]} value={selectedNav} onValueChange={setSelectedNav} /></Specimen> : null}
                  {show('views', 'Toolbar') ? <Specimen name="Toolbar" description="Utility actions grouped without competing with content."><SourceToolbar><span className="toolbar-demo__title">March 2026</span><span className="toolbar-demo__actions"><button type="button" className="source-icon-button" aria-label="Filter"><SlidersHorizontal aria-hidden="true" /></button><button type="button" className="source-icon-button" aria-label="Add"><Plus aria-hidden="true" /></button></span></SourceToolbar></Specimen> : null}
                  {show('views', 'Top Navigation Bar') ? <Specimen name="Top Navigation Bar" description="A stable anchor for the current screen." className="specimen--wide"><SourceTopNavigationBar eyebrow="WALLET" title="Your cards" leading={<button type="button" className="source-icon-button" aria-label="Back"><ArrowRight className="is-rotated-180" aria-hidden="true" /></button>} trailing={<button type="button" className="source-icon-button" aria-label="Settings"><Gear aria-hidden="true" /></button>} /></Specimen> : null}
                </div>
              ) : null}

              {category.id === 'overlay' ? (
                <div className="specimen-grid specimen-grid--overlay">
                  {show('overlay', 'Bottom Sheet') ? <Specimen name="Bottom Sheet" description="A contextual layer that keeps the original page in view."><div className="overlay-demo"><span className="overlay-demo__handle" /><p>Open a bottom sheet with a deliberate action.</p><SourceButton onClick={() => setSheetOpen(true)} trailingIcon={<ArrowUpRight aria-hidden="true" />}>Open sheet</SourceButton></div></Specimen> : null}
                  {show('overlay', 'Dropdown Menu') ? <Specimen name="Dropdown Menu" description="A compact menu for related actions or choices."><SourceDropdownMenu label="More actions" items={[{ id: 'save', label: 'Save card' }, { id: 'share', label: 'Share card' }, { id: 'report', label: 'Report issue' }]} onSelect={() => setToastOpen(true)} /></Specimen> : null}
                  {show('overlay', 'Full-Screen Overlay') ? <Specimen name="Full-Screen Overlay" description="Use the whole frame when the task needs attention."><div className="overlay-demo overlay-demo--dark"><ShieldCheck weight="duotone" aria-hidden="true" /><p>Protect the task with a focused surface.</p><SourceButton variant="secondary" onClick={() => setFullScreenOpen(true)} trailingIcon={<ArrowUpRight aria-hidden="true" />}>Open overlay</SourceButton></div></Specimen> : null}
                  {show('overlay', 'Toast') ? <Specimen name="Toast" description="Transient feedback with a clear dismissal path."><div className="overlay-demo"><p>Feedback stays brief and can be dismissed.</p><SourceButton variant="secondary" onClick={() => setToastOpen(true)} leadingIcon={<Bell aria-hidden="true" />}>Show toast</SourceButton></div></Specimen> : null}
                </div>
              ) : null}

              {category.id === 'imagery' ? (
                <div className="specimen-grid specimen-grid--imagery">
                  {show('imagery', 'Avatar') ? <Specimen name="Avatar" description="Presence with a useful fallback." className="specimen--compact"><div className="specimen-avatar-row"><SourceAvatar name="Ava Santos" size="sm" /><SourceAvatar name="Mina Lee" size="md" /><SourceAvatar name="Jules Park" size="lg" /></div></Specimen> : null}
                  {show('imagery', 'Icon') ? <Specimen name="Icon" description="A visual cue that supports the label." className="specimen--compact"><div className="specimen-icon-row"><SourceIcon label="Wallet"><Wallet aria-hidden="true" /></SourceIcon><SourceIcon tone="neutral" label="Security"><LockKey aria-hidden="true" /></SourceIcon><SourceIcon tone="soft" label="Instant transfer"><Lightning aria-hidden="true" /></SourceIcon></div></Specimen> : null}
                  {show('imagery', 'Illustration') ? <Specimen name="Illustration" description="A little warmth, used with restraint."><SourceIllustration caption="An open world for every transfer." /></Specimen> : null}
                  {show('imagery', 'Logo') ? <Specimen name="Logo" description="A mark and name that can travel together."><SourceLogo name="Klarna" /></Specimen> : null}
                  {show('imagery', 'Photo') ? <Specimen name="Photo" description="A cropped image surface for product context."><SourcePhoto alt="Abstract finance artwork" caption="Product imagery slot" /></Specimen> : null}
                </div>
              ) : null}
            </section>
          );
        })}

        {visibleCount === 0 ? (
          <section className="gallery-empty" aria-live="polite">
            <MagnifyingGlass aria-hidden="true" />
            <h2>No elements found</h2>
            <p>Try a broader search or reset the category filter.</p>
            <SourceButton variant="secondary" onClick={() => { setQuery(''); setSelectedCategory('all'); }}>Reset filters</SourceButton>
          </section>
        ) : null}

        <section id="foundation" className="gallery-foundation" aria-labelledby="foundation-title">
          <div className="gallery-section__header gallery-section__header--foundation">
            <span className="gallery-section__number">05</span>
            <div>
              <span className="gallery-section__eyebrow">Foundation / design system</span>
              <h2 id="foundation-title">A small set of rules. A lot of room to move.</h2>
              <p>Shared tokens keep the system coherent while the source themes give each surface a distinct point of view.</p>
            </div>
          </div>
          <div className="foundation-grid">
            <div className="foundation-card foundation-card--type">
              <span className="foundation-card__eyebrow">Typography / Asbir Sans</span>
              <strong className="foundation-card__display">Kind money,<br /><em>clear moves.</em></strong>
              <div className="foundation-card__type-row"><span>Display</span><strong>56 / 0.94 / 500</strong></div>
              <div className="foundation-card__type-row"><span>Body</span><strong>15 / 1.5 / 400</strong></div>
              <div className="foundation-card__type-row"><span>Label</span><strong>11 / 1.1 / 700</strong></div>
            </div>
            <div className="foundation-card foundation-card--colors">
              <span className="foundation-card__eyebrow">Color / source accents</span>
              <div className="foundation-swatches"><div><i className="foundation-swatch foundation-swatch--pink" /><span>soft pink</span></div><div><i className="foundation-swatch foundation-swatch--green" /><span>acid green</span></div><div><i className="foundation-swatch foundation-swatch--lilac" /><span>quiet lilac</span></div><div><i className="foundation-swatch foundation-swatch--ink" /><span>deep ink</span></div></div>
              <p>Accent color is expressive. Ink, surface, and border do the heavy lifting.</p>
            </div>
            <div className="foundation-card foundation-card--rules">
              <span className="foundation-card__eyebrow">Rules / useful defaults</span>
              <ul><li><strong>04</strong><span>base spacing unit</span></li><li><strong>16</strong><span>comfortable surface radius</span></li><li><strong>44</strong><span>minimum touch target</span></li><li><strong>02</strong><span>source-inspired themes</span></li></ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="gallery-footer">
        <span>Asbir Source UI / v0.1</span>
        <span>Built from source observation. No source screenshots shipped.</span>
        <a href="#top">Back to top <ArrowUpRight aria-hidden="true" /></a>
      </footer>

      <SourceBottomSheet open={sheetOpen} onOpenChange={setSheetOpen} title="Choose a transfer speed">
        <p className="dialog-lede">Move money when you need it. You can change this choice later.</p>
        <div className="dialog-options"><SourceTile title="Standard" description="Arrives in 1–2 business days · Free" selected={selectedPayment === 'card'} onSelectedChange={() => setSelectedPayment('card')} icon={<ChartLineUp aria-hidden="true" />} /><SourceTile title="Instant" description="Arrives in seconds · Small fee" selected={selectedPayment === 'bank'} onSelectedChange={() => setSelectedPayment('bank')} icon={<Lightning aria-hidden="true" />} /></div>
        <SourceButton className="dialog-primary-action" onClick={() => { setSheetOpen(false); setToastOpen(true); }} trailingIcon={<ArrowRight aria-hidden="true" />}>Continue with {selectedPayment === 'card' ? 'standard' : 'instant'}</SourceButton>
      </SourceBottomSheet>

      <SourceFullScreenOverlay open={fullScreenOpen} onOpenChange={setFullScreenOpen} title="Confirm your new card">
        <div className="dialog-fullscreen-content"><SourceIcon tone="soft"><CreditCard aria-hidden="true" /></SourceIcon><h4>Ready when you are.</h4><p>Your virtual card is protected by the same secure controls as the rest of your account.</p><div className="dialog-security-list"><SourceStatusDot label="Identity verified" status="online" /><SourceStatusDot label="Card details encrypted" status="online" /><SourceStatusDot label="Notifications on" status="online" /></div><SourceButton onClick={() => { setFullScreenOpen(false); setToastOpen(true); }}>Done</SourceButton></div>
      </SourceFullScreenOverlay>

      <SourceToast open={toastOpen} onClose={() => setToastOpen(false)} title="Changes saved" message="Your preferences are up to date." action={<button type="button" className="source-toast__link" onClick={() => setToastOpen(false)}>Dismiss</button>} />
    </div>
  );
}
