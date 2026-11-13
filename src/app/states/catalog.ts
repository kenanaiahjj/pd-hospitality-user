import screenIds from './screen-inventory.json';
import { SCREENS } from '@/components/features/guest-app/prototype-model';
import { BOOKING_TRANSITIONS } from '@/components/features/guest-app/pilot/rules';

export type Preset = { id: string; label: string; group: string };
export type Specimen = { id: string; name: string; group: string; source: string; states: Preset[]; note?: string };
const presets = (ids: string[], group = 'Appearance'): Preset[] => ids.map(id => ({ id, label: id.replaceAll('-', ' '), group }));
const ui = (name: string, states = ['default'], file = 'source-controls.tsx'): Specimen => ({ id: name, name, group: 'UI library', source: `src/components/ui/${file}`, states: presets(states) });
const guest = (id: string, name: string, states = ['default'], file = 'guest-ui.tsx'): Specimen => ({ id, name, group: 'Guest components', source: `src/components/features/guest-app/${file}`, states: presets(states, 'Content') });
const EXTRA_SCREENS = screenIds.filter(id=>!SCREENS.some(s=>s.id===id));
const ALL_SCREENS = [...SCREENS,...EXTRA_SCREENS.map(id=>({id,title:id.split('-').join(' '),group:id.startsWith('book-stay')?'Entry':'Stay'}))];
export const CATALOG: Specimen[] = [
  { id: 'booking-card', name: 'Engine booking card', group: 'Booking machine', source: 'src/components/features/guest-app/pilot/host/booking-card.tsx', states: presets(['requested','confirmed',...Object.keys(BOOKING_TRANSITIONS).filter(s=>s!=='requested'&&s!=='confirmed'), 'extra-charge', 'damage-claim', 'refund-failed', 'pms-pending'], 'Booking'), note: 'Real engine events create every fixture. Limit approval presets are engine-only; the guest app disables room limits.' },
  ui('Button', ['primary','secondary','ghost','small','disabled'], 'button.tsx'),
  ui('Input',['empty','filled','disabled','invalid'], 'input.tsx'),
  ui('Card',['default'], 'card.tsx'), ui('CardTitle',['default'],'card.tsx'), ui('CardDescription',['default'],'card.tsx'), ui('Spinner',['loading'], 'spinner.tsx'),
  ui('SourceButton',['primary','secondary','quiet','danger','small','large','disabled','with-icons']),
  ui('SourceAccordion',['closed','open']), ui('SourceCheckbox',['unchecked','checked','disabled']),
  ui('SourceSwitch',['off','on','disabled']), ui('SourceColorPicker',['default','disabled']),
  ui('SourceDatePicker',['empty','selected','disabled']), ui('SourceRadioGroup',['room','card','disabled']),
  ui('SourceRatingControl',['unrated','three-stars','five-stars','read-only','disabled']),
  ui('SourceSearchBar',['empty','query','disabled']), ui('SourceSegmentedControl',['upcoming','past']),
  ui('SourceSlider',['minimum','middle','maximum','disabled']), ui('SourceFloatingActionButton',['default','disabled']),
  ui('SourceTab',['inactive','active','disabled']), ui('SourceTextField',['empty','filled','hint','error','disabled']),
  ui('SourceTile',['unselected','selected']),
  ...['SourceBadge','SourceBanner'].map(n => ui(n,['neutral','accent','success','warning','danger'],'source-views.tsx')),
  ui('SourceCard',['simple','with-footer'],'source-views.tsx'), ui('SourceCarousel',['empty','one','multiple'],'source-views.tsx'),
  ui('SourceChip',['default','selected','dismissible'],'source-views.tsx'), ui('SourceDivider',['default'],'source-views.tsx'),
  ui('SourceGallery',['empty','one','multiple'],'source-views.tsx'), ui('SourceLoadingIndicator',['loading'],'source-views.tsx'),
  ui('SourceTable',['empty','one','multiple'],'source-views.tsx'), ui('SourceProgressIndicator',['zero','half','complete','hidden-value'],'source-views.tsx'),
  ui('SourceSkeleton',['lines','avatar'],'source-views.tsx'), ui('SourceStackedList',['empty','one','multiple'],'source-views.tsx'),
  ui('SourceStatusDot',['online','pending','offline','neutral'],'source-views.tsx'),
  ui('SourceTabBar',['home','chat','profile'],'source-views.tsx'), ui('SourceToolbar',['default'],'source-views.tsx'),
  ui('SourceTopNavigationBar',['simple','with-actions'],'source-views.tsx'), ui('SourceInlineAction',['default','disabled'],'source-views.tsx'),
  ui('SourceAvatar',['initials','photo','small','large'],'source-imagery.tsx'), ui('SourceIcon',['accent','neutral','soft'],'source-imagery.tsx'),
  ui('SourceIllustration',['default','caption'],'source-imagery.tsx'), ui('SourcePhoto',['placeholder','photo','caption'],'source-imagery.tsx'),
  ui('SourceLogo',['letter','image'],'source-imagery.tsx'),
  ui('SourceBottomSheet',['closed','open'],'source-overlays.tsx'), ui('SourceFullScreenOverlay',['closed','open'],'source-overlays.tsx'),
  ui('SourceDropdownMenu',['closed','open'],'source-overlays.tsx'), ui('SourceToast',['closed','open','with-action'],'source-overlays.tsx'),
  ...['CabanaMark','CabanaLockup','CabanaWordmark','CabanaFullLockup'].map(n => ui(n,['default'],'cabana-logo.tsx')),
  guest('state-panel','StatePanel',['empty','error']), guest('stale-notice','StaleDataNotice',['stale']), guest('guest-nav-icon','GuestNavIcon'), guest('nav-button','NavButton',['inactive','active','unread']),
  guest('field','Field',['empty','filled','helper','required']), guest('tag','Tag',['neutral','positive','warning','dark']),
  guest('choice-list','ChoiceList',['room','card','disabled']), guest('notice','Notice',['neutral','positive','warning','offline']),
  guest('payment-glyph','PaymentMethodGlyph',['card','gcash','maya']), guest('summary-row','SummaryRow',['default','strong']),
  guest('service-visual','ServiceVisual',['sand','sage','sun','blue']), guest('service-image','ServiceImage',['thumbnail','card']),
  guest('property-image','PropertyImage',['dumaguete','manila']), guest('screen-intro','ScreenIntro',['default','with-eyebrow']),
  guest('form-screen','FormScreen',['first-step','last-step']), guest('text-button','TextButton',['default','disabled']),
  guest('stay-mini-card','StayMiniCard',['upcoming','active','completed']), guest('review-block','ReviewBlock',['read-only','editable']),
  guest('notes-field','NotesField',['empty','filled','long-note']), guest('section-heading','SectionHeading',['simple','action','count']),
  guest('history-item','HistoryItem',['default']), guest('hero-icon','HeroIcon',['plain','sage']),
  guest('guest-tabs','GuestTabs',['upcoming','past'],'guest-tabs.tsx'),
  guest('expandable-field','ExpandableField',['closed','open'],'field-controls.tsx'),
  guest('calendar-picker','CalendarPicker',['selected','one-day','empty'],'field-controls.tsx'),
  guest('time-wheel','TimeWheel',['morning','afternoon','evening'],'field-controls.tsx'),
  guest('stepper-field','StepperField',['minimum','middle','maximum'],'field-controls.tsx'),
  guest('chat-composer','ChatComposer',['empty','draft','multiline','disabled'],'chat-composer.tsx'),
  guest('stay-card','StayCard',['upcoming','active','completed','compact'],'stay-home.tsx'),
  guest('upcoming-card','UpcomingBookingCard',['upcoming','assigned','ready'],'stay-home.tsx'),
  guest('arrival-checklist','PreArrivalChecklist',['incomplete','complete'],'stay-home.tsx'),
  guest('unlock-teaser','UnlockTeaser',['default'],'stay-home.tsx'),
  guest('announcements','AnnouncementsSection',['morning','afternoon','evening','late'],'stay-home.tsx'),
  guest('room-charge-qr','VendorFolioQrDialog',['closed','open'],'stay-home.tsx'),
  guest('stay-review-form','StayReviewForm',['unrated','submitted','checkout-day'],'stay-review-form.tsx'),
  guest('wax-seal','CabanaWaxSeal',['default'],'cabana-wax-seal.tsx'),
  guest('stay-invitation','StayInvitation',['idle','stamping','done','leaving'],'stay-invitation.tsx'),
  guest('stay-confirm','StayConfirm',['default'],'stay-invitation.tsx'),
  guest('room-key','RoomKey',['assigned','unassigned'],'stay-invitation.tsx'),
  guest('badge-medal','BadgeMedal',['locked','earned','shimmer'],'rewards/badge-medal.tsx'),
  guest('badge-coin','BadgeCoin',['earned'],'rewards/badge-coin.tsx'),
  guest('badge-detail','BadgeDetail',['locked','earned'],'rewards/badge-detail.tsx'),
  guest('badge-shelf','BadgeShelf',['empty','typical'],'rewards/badge-shelf.tsx'),
  guest('reward-menu','RewardMenu',['insufficient','affordable'],'rewards/reward-menu.tsx'),
  guest('reward-detail','RewardDetail',['insufficient','affordable','redeemed'],'rewards/reward-menu.tsx'),
  guest('points-wallet','PointsWallet',['zero','available','pending'],'rewards/points-wallet.tsx'),
  guest('points-activity','PointsActivity',['empty','earned','redeemed'],'rewards/points-wallet.tsx'),
  guest('points-earned','PointsEarned',['none','earned','with-badge'],'rewards/points-earned.tsx'),
  guest('points-apply','PointsApply',['insufficient','available','applied'],'rewards/points-apply.tsx'),
  { id: 'icons', name: 'Hugeicons catalog', group: 'UI library', source: 'src/components/ui/huge-icons.tsx', states: presets(['stroke','solid']) },
  { id: 'app-lifecycle', name: 'Guest lifecycle', group: 'Screen compositions', source: 'src/components/features/guest-app/guest-app-prototype.tsx', states: presets(['signed-out','account-only','pre-arrival','arrived','live','checkout-day','just-checked-out','closed'],'Stay'), note: 'The real guest app with injected session props. Internal components remain in their screen context. No guest session is saved.' },
  ...ALL_SCREENS.map(s => ({ id: `screen:${s.id}`, name: s.title, group: 'Screen compositions', source: 'src/components/features/guest-app/guest-app-prototype.tsx', states: presets(['fixture'],s.group), note: 'Screen composition, not an isolated component. Props seed its normal context; selection-dependent branches remain controlled by the guest UI.' })),
];
export function resolveSpecimen(component: string | null, state: string | null) {
  const item = CATALOG.find(x => x.id === component) ?? CATALOG[0];
  return { item, preset: item.states.find(x => x.id === state) ?? item.states[0] };
}
