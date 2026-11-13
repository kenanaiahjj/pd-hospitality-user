'use client';
import { useState, useEffect, Component, type ReactNode } from 'react';
import * as UI from '@/components/ui';
import * as Logo from '@/components/ui/cabana-logo';
import * as Icons from '@/components/ui/huge-icons';
import * as Guest from '@/components/features/guest-app/guest-ui';
import { GuestTabs } from '@/components/features/guest-app/guest-tabs';
import { ExpandableField, CalendarPicker, TimeWheel, StepperField } from '@/components/features/guest-app/field-controls';
import { ChatComposer } from '@/components/features/guest-app/chat-composer';
import { StayCard, UpcomingBookingCard, PreArrivalChecklist, UnlockTeaser, AnnouncementsSection, VendorFolioQrDialog } from '@/components/features/guest-app/stay-home';
import { GuestAppPrototype } from '@/components/features/guest-app/guest-app-prototype';
import { Home04Icon } from '@hugeicons-pro/core-stroke-rounded';
import { Home04Icon as HomeSolid } from '@hugeicons-pro/core-solid-rounded';
import { applyPrototypeStayState, PAST_STAYS, SCREENS, type PrototypeStayState } from '@/components/features/guest-app/prototype-model';
import type { ActiveScreen } from '@/components/features/guest-app/guest-shared';
import { StayReviewForm } from '@/components/features/guest-app/stay-review-form';
import { CabanaWaxSeal } from '@/components/features/guest-app/cabana-wax-seal';
import { StayInvitation, StayConfirm, RoomKey } from '@/components/features/guest-app/stay-invitation';
import { BadgeMedal } from '@/components/features/guest-app/rewards/badge-medal';
import { BadgeCoin } from '@/components/features/guest-app/rewards/badge-coin';
import { BadgeDetail } from '@/components/features/guest-app/rewards/badge-detail';
import { BadgeShelf } from '@/components/features/guest-app/rewards/badge-shelf';
import { badgeProgress } from '@/components/features/guest-app/rewards/badge-model';
import { RewardMenu, RewardDetail } from '@/components/features/guest-app/rewards/reward-menu';
import { PointsWallet, PointsActivity } from '@/components/features/guest-app/rewards/points-wallet';
import { PointsEarned } from '@/components/features/guest-app/rewards/points-earned';
import { PointsApply } from '@/components/features/guest-app/rewards/points-apply';
import { REWARD_MENU, buildPointsLedger } from '@/components/features/guest-app/rewards/points-model';
import { BookingSpecimen } from './engine';
import type { Specimen } from './catalog';
import './workbench.css';

export class PreviewBoundary extends Component<{ children:ReactNode },{ error:string|null }> {
  state={ error:null as string|null };
  static getDerivedStateFromError(error:Error) { return { error:error.message }; }
  render() { return this.state.error ? <div data-preview-ready data-preview-error role="alert"><h1>Fixture could not render</h1><p>{this.state.error}</p></div> : this.props.children; }
}
const image='/experiments/bayleaf-kitchen.jpg';
const options=[{ value:'room',label:'Charge to room' },{ value:'card',label:'Pay in full' }];
const nav=[{ value:'home',label:'Home',icon:<Icons.House/> },{ value:'chat',label:'Chat',icon:<Icons.ChatCircleDots/> },{ value:'profile',label:'Profile',icon:<Icons.UserCircle/> }];
export function SpecimenPreview({ item, state, onState }: { item:Specimen; state:string; onState:(s:string)=>void }) {
  const [text,setText]=useState(state==='empty' ? '' : state==='multiline' ? 'Could we have two extra towels?\nWe are in Room 304.' : state==='long-note' ? 'We are traveling with two children and would appreciate a quiet room near the garden. '.repeat(3) : 'Ana Reyes');
  const [selected,setSelected]=useState(['checked','on','open','selected'].includes(state));
  const [choice,setChoice]=useState(['past','chat','profile','card'].includes(state) ? state : 'room');
  const [number,setNumber]=useState(item.id==='stepper-field' ? (state==='minimum'?1:state==='maximum'?6:2) : item.id==='SourceRatingControl'?(state==='unrated'?0:state==='three-stars'?3:state==='five-stars'?5:4):state==='minimum'||state==='zero'||state==='unrated' ? 0 : state==='maximum'||state==='complete' ? 100 : state==='three-stars' ? 3 : state==='five-stars' ? 5 : 50);
  const [notice,setNotice]=useState('');
  const [applied,setApplied]=useState(state==='applied'?4000:0);
  const [redeemed,setRedeemed]=useState(state==='redeemed');
  const [review,setReview]=useState<import('@/components/features/guest-app/prototype-model').StayReview|undefined>(state==='submitted'?{bookingId:'HEN-241109',rating:5,comment:'A lovely stay.',submittedAt:'2026-11-11'}:undefined);
  const note=(s:string)=>setNotice(s);
  const changeBool=(next:boolean,a:string,b:string)=>{setSelected(next);onState(next?a:b);};
  const session=applyPrototypeStayState('live');
  const booking=session.bookings[0];
  const disabled=state==='disabled';
  const tone=state as 'neutral'|'accent'|'success'|'warning'|'danger';
  const content=()=>{
    switch(item.id){
      case 'booking-card': return <BookingSpecimen state={state} onState={onState}/>;
      case 'Button': return <UI.Button variant={state==='secondary'?'secondary':state==='ghost'?'ghost':'primary'} size={state==='small'?'sm':'md'} disabled={disabled} onClick={()=>note('Continue clicked')}>Continue</UI.Button>;
      case 'Input': return <UI.Input aria-label="Guest name" value={text} onChange={e=>setText(e.target.value)} disabled={disabled} aria-invalid={state==='invalid'} placeholder="Full name"/>;
      case 'Card': return <UI.Card><UI.CardTitle>The Henry Resort Dumaguete</UI.CardTitle><UI.CardDescription>Three nights · Deluxe room · Ana Reyes</UI.CardDescription></UI.Card>;
      case 'CardTitle': return <UI.CardTitle>Room charges</UI.CardTitle>;
      case 'CardDescription': return <UI.CardDescription>Settled with the hotel at checkout</UI.CardDescription>;
      case 'Spinner': return <UI.Spinner/>;
      case 'SourceButton': return <UI.SourceButton variant={['primary','secondary','quiet','danger'].includes(state)?state as 'primary'|'secondary'|'quiet'|'danger':'primary'} size={state==='small'?'sm':state==='large'?'lg':'md'} disabled={disabled} leadingIcon={state==='with-icons'?<Icons.Receipt/>:undefined} trailingIcon={state==='with-icons'?<Icons.ArrowRight/>:undefined} onClick={()=>note('Booking requested')}>Confirm booking</UI.SourceButton>;
      case 'SourceAccordion': return <UI.SourceAccordion title="Cancellation policy" open={selected} onOpenChange={v=>changeBool(v,'open','closed')}>Cancel free up to 24 hours before your booking.</UI.SourceAccordion>;
      case 'SourceCheckbox': return <UI.SourceCheckbox label="Save my guest details" checked={selected} disabled={disabled} onCheckedChange={v=>changeBool(v,'checked','unchecked')}/>;
      case 'SourceSwitch': return <UI.SourceSwitch label="Stay notifications" checked={selected} disabled={disabled} onCheckedChange={v=>changeBool(v,'on','off')}/>;
      case 'SourceColorPicker': return <UI.SourceColorPicker label="Accent color" disabled={disabled}/>;
      case 'SourceDatePicker': return <UI.SourceDatePicker label="Arrival date" defaultValue={state==='empty'?'':'2026-11-20'} disabled={disabled}/>;
      case 'SourceRadioGroup': return <UI.SourceRadioGroup label="Payment method" options={options} value={choice} onValueChange={v=>{setChoice(v);onState(v);}} disabled={disabled}/>;
      case 'SourceRatingControl': return <UI.SourceRatingControl label="How was your stay?" value={number} onValueChange={setNumber} readOnly={state==='read-only'} disabled={disabled}/>;
      case 'SourceSearchBar': return <UI.SourceSearchBar aria-label="Search hotels" defaultValue={state==='query'?'Dumaguete':''} disabled={disabled} placeholder="Search hotels"/>;
      case 'SourceSegmentedControl': return <UI.SourceSegmentedControl label="Bookings" options={[{value:'upcoming',label:'Upcoming'},{value:'past',label:'Past'}]} value={choice==='past'?'past':'upcoming'} onValueChange={v=>{setChoice(v);onState(v);}}/>;
      case 'SourceSlider': return <UI.SourceSlider label="Distance from hotel" value={number} onValueChange={setNumber} disabled={disabled}/>;
      case 'SourceFloatingActionButton': return <UI.SourceFloatingActionButton label="Ask the front desk" disabled={disabled} onClick={()=>note('Front desk requested')}/>;
      case 'SourceTab': return <UI.SourceTab label="My Stay" active={state==='active'} disabled={disabled} onClick={()=>onState(state==='active'?'inactive':'active')}/>;
      case 'SourceTextField': return <UI.SourceTextField label="Booking reference" placeholder="Your confirmation number" defaultValue={state==='filled'?'HEN-241109':''} hint={state==='hint'?'Find this in your confirmation email':undefined} error={state==='error'?'Enter your booking reference':undefined} disabled={disabled}/>;
      case 'SourceTile': return <UI.SourceTile title="Deluxe room" description="Garden view · King bed" icon={<Icons.Bed/>} selected={selected} onSelectedChange={v=>changeBool(v,'selected','unselected')}/>;
      case 'SourceBadge': return <UI.SourceBadge tone={tone}>{state==='success'?'Confirmed':state==='danger'?'Cancelled':state==='warning'?'Awaiting confirmation':'Room 304'}</UI.SourceBadge>;
      case 'SourceBanner': return <UI.SourceBanner title="Your room is ready" tone={tone}>Room 304 is ready. Stop by the front desk.</UI.SourceBanner>;
      case 'SourceCard': return <UI.SourceCard title="Room charges" eyebrow="The Henry Resort Dumaguete" icon={<Icons.Receipt/>} footer={state==='with-footer'?<UI.SourceButton onClick={()=>note('Folio requested')}>View room charges</UI.SourceButton>:undefined}>₱3,050 · Settled with the hotel at checkout</UI.SourceCard>;
      case 'SourceCarousel': return <UI.SourceCarousel items={state==='empty'?[]:(state==='one'?['Deluxe room']:['Deluxe room','Garden suite','Poolside villa']).map(title=><UI.SourceCard key={title} title={title}>Your stay at The Henry</UI.SourceCard>)}/>;
      case 'SourceChip': return <UI.SourceChip selected={state==='selected'} dismissible={state==='dismissible'} onClick={()=>note('Filter selected')}>Spa & wellness</UI.SourceChip>;
      case 'SourceDivider': return <UI.SourceDivider/>;
      case 'SourceGallery': return <UI.SourceGallery items={state==='empty'?[]:(state==='one'?[1]:[1,2,3]).map(n=>({id:String(n),label:`The Henry · photo ${n}`,children:<UI.SourcePhoto src={image} alt="Hotel dining room"/>}))}/>;
      case 'SourceLoadingIndicator': return <UI.SourceLoadingIndicator label="Finding your booking"/>;
      case 'SourceTable': return <UI.SourceTable caption="Room charges" columns={['Service','Amount']} rows={state==='empty'?[]:(state==='one'?[['Laundry','₱250']]:[['Laundry','₱250'],['Airport transfer','₱1,200'],['Signature massage','₱2,400']]).map((cells,i)=>({id:String(i),cells}))}/>;
      case 'SourceProgressIndicator': return <UI.SourceProgressIndicator value={state==='hidden-value'?50:number} label="Pre-arrival details" showValue={state!=='hidden-value'}/>;
      case 'SourceSkeleton': return <UI.SourceSkeleton avatar={state==='avatar'} lines={3}/>;
      case 'SourceStackedList': return <UI.SourceStackedList items={state==='empty'?[]:(state==='one'?['Airport transfer']:['Airport transfer','Signature massage','Bike rental']).map((title,i)=>({id:String(i),title,description:'November 12 · Confirmed',leading:<Icons.CheckCircle/>,trailing:'View'}))}/>;
      case 'SourceStatusDot': return <UI.SourceStatusDot status={state as 'online'|'pending'|'offline'|'neutral'} label={state}/>;
      case 'SourceTabBar': return <UI.SourceTabBar items={nav} value={choice==='room'?'home':choice} onValueChange={v=>{setChoice(v);onState(v);}}/>;
      case 'SourceToolbar': return <UI.SourceToolbar><UI.SourceButton size="sm">Filter</UI.SourceButton><UI.SourceButton size="sm" variant="quiet">Sort</UI.SourceButton></UI.SourceToolbar>;
      case 'SourceTopNavigationBar': return <UI.SourceTopNavigationBar title="My Stay" eyebrow="The Henry Resort Dumaguete" leading={state==='with-actions'?<Icons.ArrowLeft/>:undefined} trailing={state==='with-actions'?<Icons.Bell/>:undefined}/>;
      case 'SourceInlineAction': return <UI.SourceInlineAction disabled={disabled} onClick={()=>note('Guest details requested')}>Edit guest details</UI.SourceInlineAction>;
      case 'SourceAvatar': return <UI.SourceAvatar name="Ana Reyes" src={state==='photo'?image:undefined} size={state==='small'?'sm':state==='large'?'lg':'md'}/>;
      case 'SourceIcon': return <UI.SourceIcon tone={state as 'accent'|'neutral'|'soft'} label="Room charges"><Icons.Receipt/></UI.SourceIcon>;
      case 'SourceIllustration': return <UI.SourceIllustration caption={state==='caption'?'Your stay, connected':undefined}/>;
      case 'SourcePhoto': return <UI.SourcePhoto src={state==='placeholder'?undefined:image} alt="Dining at The Henry" caption={state==='caption'?'The Dining Room':undefined}/>;
      case 'SourceLogo': return <UI.SourceLogo src={state==='image'?'/globe.svg':undefined}/>;
      case 'SourceBottomSheet': return <><UI.SourceButton onClick={()=>changeBool(true,'open','closed')}>Open sheet</UI.SourceButton><UI.SourceBottomSheet open={selected} onOpenChange={v=>changeBool(v,'open','closed')} title="Choose a payment method"><UI.SourceRadioGroup options={options}/></UI.SourceBottomSheet></>;
      case 'SourceFullScreenOverlay': return <><UI.SourceButton onClick={()=>changeBool(true,'open','closed')}>Open overlay</UI.SourceButton><UI.SourceFullScreenOverlay open={selected} onOpenChange={v=>changeBool(v,'open','closed')} title="Your booking"><UI.SourceCard title="Room 304">The Henry Resort Dumaguete</UI.SourceCard></UI.SourceFullScreenOverlay></>;
      case 'SourceDropdownMenu': return <Dropdown initialOpen={state==='open'}/>;
      case 'SourceToast': return <><UI.SourceButton onClick={()=>changeBool(true,'open','closed')}>Show notification</UI.SourceButton><UI.SourceToast open={selected||state==='with-action'} title="Booking confirmed" message="Your bike rental is confirmed." action={state==='with-action'?<UI.SourceInlineAction onClick={()=>note('Booking requested')}>View booking</UI.SourceInlineAction>:undefined} onClose={()=>changeBool(false,'open','closed')}/></>;
      case 'CabanaMark': return <Logo.CabanaMark/>;
      case 'CabanaLockup': return <Logo.CabanaLockup/>;
      case 'CabanaWordmark': return <Logo.CabanaWordmark/>;
      case 'CabanaFullLockup': return <Logo.CabanaFullLockup/>;
      case 'field': return <Guest.Field label="Full name" name="name" placeholder="As shown on your ID" value={text} onValueChange={setText} helper={state==='helper'?'Match your booking name':undefined} required={state==='required'}/>;
      case 'tag': return <Guest.Tag tone={state as 'neutral'|'positive'|'warning'|'dark'}>Confirmed</Guest.Tag>;
      case 'state-panel': return <Guest.StatePanel tone={state as 'empty'|'error'} icon={<Icons.Receipt/>} title={state==='error'?'Could not load your booking':'No bookings yet'} actions={<Guest.TextButton onClick={()=>note('Retry requested')}>Try again</Guest.TextButton>}>Ask the front desk if you need help.</Guest.StatePanel>;
      case 'stale-notice': return <Guest.StaleDataNotice asOf="6:40 PM" onRetry={()=>note('Retry requested')} onAsk={()=>note('Front desk requested')}/>;
      case 'choice-list': return <Guest.ChoiceList legend="Payment method" options={options.map(o=>({value:o.value,title:o.label}))} value={choice} onChange={v=>{setChoice(v);onState(v);}} disabled={disabled}/>;
      case 'payment-glyph': return <Guest.PaymentMethodGlyph method={state as 'card'|'gcash'|'maya'}/>;
      case 'notice': return <Guest.Notice tone={state as 'neutral'|'positive'|'warning'|'offline'} icon={<Icons.WarningCircle/>} title={state==='warning'?'Please try again':state==='offline'?'You are offline':'Your stay is connected'}>Your booking and room details remain available.</Guest.Notice>;
      case 'summary-row': return <Guest.SummaryRow label="Total" value="₱3,050" strong={state==='strong'}/>;
      case 'service-visual': return <Guest.ServiceVisual tone={state} icon={<Icons.Bicycle/>}/>;
      case 'service-image': return <Guest.ServiceImage itemId="bike-rental" categoryId="rentals" variant={state as 'thumbnail'|'card'} tone="blue" icon={<Icons.Bicycle/>}/>;
      case 'property-image': return <Guest.PropertyImage property={state==='manila'?'The Henry Manila':'The Henry Resort Dumaguete'}/>;
      case 'screen-intro': return <Guest.ScreenIntro title="Find your booking" text="Enter the number from your confirmation." eyebrow={state==='with-eyebrow'?'Before you arrive':undefined}><Guest.Field name="ref" label="Booking reference"/></Guest.ScreenIntro>;
      case 'form-screen': return <Guest.FormScreen step={state==='first-step'?'1 of 2':'2 of 2'} title="Your details" text="Help the hotel prepare for your arrival."><Guest.Field name="name" label="Full name" defaultValue="Ana Reyes"/></Guest.FormScreen>;
      case 'text-button': return <Guest.TextButton onClick={()=>note('Action clicked')} disabled={disabled}>Ask the front desk</Guest.TextButton>;
      case 'stay-mini-card': return <Guest.StayMiniCard booking={{...booking,status:state as 'upcoming'|'active'|'completed'}} status={state}/>;
      case 'review-block': return <Guest.ReviewBlock icon={<Icons.Person/>} title="Guest details" lines={['Ana Reyes','Two guests']} onEdit={state==='editable'?()=>note('Edit requested'):undefined}/>;
      case 'notes-field': return <Guest.NotesField value={text} onChange={setText}/>;
      case 'section-heading': return <Guest.SectionHeading title="Upcoming bookings" action={state==='action'?'View all':undefined} onAction={()=>note('View all requested')} count={state==='count'?'3':undefined}/>;
      case 'history-item': return <Guest.HistoryItem stay={PAST_STAYS[0]} onOpen={()=>note('Stay receipt requested')}/>;
      case 'hero-icon': return <Guest.HeroIcon tone={state}><Icons.Bed/></Guest.HeroIcon>;
      case 'guest-nav-icon': return <Guest.GuestNavIcon icon={Home04Icon}/>;
      case 'nav-button': return <nav className="guest-bottom-nav" style={{position:'static'}}><Guest.NavButton label="Home" icon={Home04Icon} activeIcon={HomeSolid} active={state==='active'} unread={state==='unread'} onClick={()=>note('Home requested')}/></nav>;
      case 'guest-tabs': return <GuestTabs idPrefix="states-bookings" label="Bookings" options={[{value:'upcoming',label:'Upcoming'},{value:'past',label:'Past'}]} value={choice==='past'?'past':'upcoming'} onValueChange={v=>{setChoice(v);onState(v);}}/>;
      case 'expandable-field': return <ExpandableField label="Date" value="November 12" aside="Choose a date" open={selected} onToggle={()=>changeBool(!selected,'open','closed')}><CalendarPicker available={[tomorrow]} value={tomorrow} labelFor={v=>v} onChange={()=>note('Date selected')}/></ExpandableField>;
      case 'calendar-picker': return state==='empty'?<><CalendarPicker available={[]} value="" labelFor={v=>v} onChange={()=>{}}/><p className="states-empty">No available days. The component intentionally renders nothing.</p></>:<CalendarPicker available={state==='one-day'?[tomorrow]:['2026-11-11',tomorrow,'2026-11-13']} value={text.startsWith('2026')?text:tomorrow} onChange={setText} labelFor={v=>v}/>;
      case 'time-wheel': return <TimeWheel times={['8:00 AM','1:30 PM','7:00 PM']} value={text.includes('M')?text:state==='morning'?'8:00 AM':state==='afternoon'?'1:30 PM':'7:00 PM'} onChange={setText}/>;
      case 'stepper-field': return <StepperField label="Guests" value={number} min={1} max={6} unit="guest" onChange={setNumber}/>;
      case 'chat-composer': return <ChatComposer disabled={disabled} draft={text} onDraftChange={setText} onSubmit={payload=>{note(`Sent: ${payload.body}`);setText('');}}/>;
      case 'stay-card': return <StayCard booking={booking} compact={state==='compact'} statusLabel={state} onOpen={()=>note('Stay requested')}/>;
      case 'upcoming-card': return <UpcomingBookingCard booking={{...applyPrototypeStayState('pre-arrival').bookings[0],roomAssignment:state==='assigned'?'assigned':state==='ready'?'ready':'pending',roomNumber:state==='upcoming'?undefined:'304'}} onNavigate={screen=>note(`Open ${screen}`)}/>;
      case 'arrival-checklist': return <PreArrivalChecklist booking={{...applyPrototypeStayState('pre-arrival').bookings[0],preArrivalCompleted:state==='complete'?2:0}} onNavigate={screen=>note(`Open ${screen}`)}/>;
      case 'unlock-teaser': return <UnlockTeaser onScan={()=>note('Room scan requested')}/>;
      case 'announcements': return <AnnouncementsSection booking={booking} hour={state==='morning'?8:state==='afternoon'?14:state==='evening'?19:23}/>;
      case 'room-charge-qr': return <><Guest.TextButton onClick={()=>changeBool(true,'open','closed')}>Show room charge QR</Guest.TextButton><VendorFolioQrDialog booking={booking} open={selected} onClose={()=>changeBool(false,'open','closed')}/></>;
      case 'stay-review-form': return <StayReviewForm property={booking.property} mode="page" isCheckoutDay={state==='checkout-day'} review={review} onSubmit={(rating,comment)=>{setReview({bookingId:booking.id,rating,comment,submittedAt:'2026-11-11'});onState('submitted');}}/>;
      case 'wax-seal': return <CabanaWaxSeal/>;
      case 'stay-invitation': return <StayInvitation booking={booking} phase={state as 'idle'|'stamping'|'done'|'leaving'} art={<Guest.PropertyImage property={booking.property}/>} />;
      case 'stay-confirm': return <StayConfirm booking={booking} art={<Guest.PropertyImage property={booking.property}/>} doneText="Booking connected" onConfirm={()=>note('Booking connected')}/>;
      case 'room-key': return <RoomKey property={booking.property} roomNumber={state==='assigned'?'304':undefined} guestName="Ana Reyes" dates="November 9–12" art={<Guest.PropertyImage property={booking.property}/>}/>;
      case 'badge-medal': return <BadgeMedal badge={badgeProgress(session)[0].definition} earned={state!=='locked'} shimmer={state==='shimmer'} size={144}/>;
      case 'badge-coin': return <BadgeCoin badge={badgeProgress(session)[0].definition} holder="Ana Reyes" earnedOn="2026-11-11" serial="CBN-304"/>;
      case 'badge-detail': { const row=badgeProgress(session)[0]; return <BadgeDetail row={{...row,earned:state==='earned',count:state==='earned'?row.definition.threshold:0}} holder="Ana Reyes" onMute={()=>note('Achievement muted')}/>; }
      case 'badge-shelf': {const all=badgeProgress(session);return <BadgeShelf all={state==='empty'?[]:all} earned={state==='empty'?[]:all.filter(b=>b.earned)} nearly={state==='empty'?[]:all.filter(b=>!b.earned&&b.count>0)} onOpenBadge={id=>note(`Open ${id}`)}/>;}
      case 'reward-menu': return <RewardMenu rewards={REWARD_MENU} balance={state==='affordable'?20000:0} onOpenReward={id=>note(`Open ${id}`)}/>;
      case 'reward-detail': return <RewardDetail reward={REWARD_MENU[0]} balance={state==='insufficient'?0:20000} redeemed={redeemed?{code:'CBN-REWARD-304',toldDesk:true}:undefined} onRedeem={()=>{setRedeemed(true);onState('redeemed');}}/>;
      case 'points-wallet': return <PointsWallet balance={state==='zero'?0:20000} pending={state==='pending'?1500:0} affordable={state==='zero'?[]:REWARD_MENU.filter(r=>r.points<=20000)} ledger={state==='zero'?[]:buildPointsLedger(session)} expiry="November 2028"/>;
      case 'points-activity': return <PointsActivity ledger={state==='empty'?[]:state==='redeemed'?[{id:'redeem',date:'2026-11-11',title:'Late checkout',detail:'Reward redeemed',source:'redemption',points:-4000}]:buildPointsLedger(session)} expiry="November 2028"/>;
      case 'points-earned': return <><PointsEarned points={state==='none'?0:1000} badges={state==='with-badge'?[badgeProgress(session)[0]]:[]}/>{state==='none'&&<p className="states-empty">No points earned. The component intentionally renders nothing.</p>}</>;
      case 'points-apply': return <PointsApply balance={state==='insufficient'?0:20000} amount="₱2,400" applied={applied} onChange={setApplied}/>;
      case 'icons': return <div className="states-icon-grid">{Object.entries(Icons).filter(([name])=>/^[A-Z]/.test(name)).map(([name,Icon])=><figure key={name}><Icon size={24} weight={state==='solid'?'fill':'regular'}/><figcaption>{name}</figcaption></figure>)}</div>;
      case 'app-lifecycle': return <GuestAppPrototype initialSession={applyPrototypeStayState(state as PrototypeStayState)} initialScreen={state==='signed-out'?'entry-hub':'stay-overview'}/>;
      default: {
        if(item.id.startsWith('screen:')){
          const screen=item.id.slice(7) as ActiveScreen;
          const group=SCREENS.find(s=>s.id===screen)?.group;
          const seeded=applyPrototypeStayState(group==='Entry'?'account-only':group==='Pre-arrival'?'pre-arrival':'live');
          return <GuestAppPrototype initialSession={seeded} initialScreen={screen}/>;
        }
        return <p data-preview-error>No renderer registered for {item.id}.</p>;
      }
    }
  };
  const app=item.group==='Screen compositions';
  return <div data-preview-ready data-component={item.id} data-preset={state} className={app?'states-app-preview':'states-fixture'} data-source-theme="cabana">
    <div className={item.group==='Guest components'?'guest-app guest-stack':undefined}>{content()}</div>
    {notice&&<p className="states-feedback" role="status">{notice}</p>}
  </div>;
}
const tomorrow='2026-11-12';
function Dropdown({ initialOpen }: { initialOpen:boolean }){
  useEffect(()=>{if(initialOpen){const button=document.querySelector<HTMLButtonElement>('[data-slot="dropdown-menu"] > button');if(button?.getAttribute('aria-expanded')!=='true')button?.click();}},[initialOpen]);
  return <UI.SourceDropdownMenu label="Booking options" items={[{id:'receipt',label:'View receipt'},{id:'cancel',label:'Cancel booking'}]}/>;
}
