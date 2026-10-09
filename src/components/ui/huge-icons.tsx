/*
  The app's icons, all Hugeicons (stroke rounded, and solid rounded where a
  glyph is filled). Never Phosphor. The names are the ones the app already
  uses, so a screen asks for <Bell /> and gets Hugeicons' bell.

  `weight` keeps meaning what it did: "fill" and "duotone" draw the solid
  glyph, "bold" a heavier stroke, "light" and "thin" a finer one. Icons size
  to the text around them (1em) unless given a size.
*/
import type { ComponentType, CSSProperties, SVGProps } from 'react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  Airplane01Icon as AirplaneTiltStroke,
  AnchorIcon as AnchorStroke,
  ArrowLeft02Icon as ArrowLeftStroke,
  ArrowRight02Icon as ArrowRightStroke,
  ArrowUp02Icon as ArrowUpStroke,
  ArrowUpRight02Icon as ArrowUpRightStroke,
  Baby01Icon as BabyStroke,
  BankIcon as BankStroke,
  Dumbbell01Icon as BarbellStroke,
  ShoppingBasket01Icon as BasketStroke,
  BedIcon as BedStroke,
  Notification01Icon as BellStroke,
  NotificationSquareIcon as BellRingingStroke,
  BicycleIcon as BicycleStroke,
  BookOpen01Icon as BookOpenStroke,
  Bookmark01Icon as BookmarkSimpleStroke,
  Briefcase01Icon as BriefcaseStroke,
  Building03Icon as BuildingsStroke,
  Calendar03Icon as CalendarBlankStroke,
  CalendarCheckIn01Icon as CalendarCheckStroke,
  CalendarAdd01Icon as CalendarPlusStroke,
  ConciergeBellIcon as CallBellStroke,
  Camera01Icon as CameraStroke,
  Car01Icon as CarStroke,
  ArrowDown01Icon as CaretDownStroke,
  ArrowLeft01Icon as CaretLeftStroke,
  ArrowRight01Icon as CaretRightStroke,
  ChartLineData01Icon as ChartLineUpStroke,
  Chatting01Icon as ChatCircleDotsStroke,
  Message01Icon as ChatTextStroke,
  Tick02Icon as CheckStroke,
  CheckmarkCircle02Icon as CheckCircleStroke,
  ChurchIcon as ChurchStroke,
  Clock01Icon as ClockStroke,
  Timer02Icon as ClockCountdownStroke,
  Clock05Icon as ClockCounterClockwiseStroke,
  Coffee01Icon as CoffeeStroke,
  Compass01Icon as CompassStroke,
  PartyPopperIcon as ConfettiStroke,
  ChefHatIcon as CookingPotStroke,
  Copy01Icon as CopyStroke,
  CreditCardIcon as CreditCardStroke,
  SmartPhone01Icon as DeviceMobileStroke,
  Door01Icon as DoorStroke,
  Mail01Icon as EnvelopeSimpleStroke,
  ViewIcon as EyeStroke,
  FilterHorizontalIcon as FadersHorizontalStroke,
  FirstAidKitIcon as FirstAidKitStroke,
  FlowerIcon as FlowerStroke,
  Restaurant01Icon as ForkKnifeStroke,
  Settings01Icon as GearStroke,
  GiftIcon as GiftStroke,
  Globe02Icon as GlobeStroke,
  HammerIcon as HammerStroke,
  HandHeartIcon as HandHeartStroke,
  Agreement02Icon as HandshakeStroke,
  FavouriteIcon as HeartStroke,
  HourglassIcon as HourglassHighStroke,
  Home01Icon as HouseStroke,
  IdentityCardIcon as IdentificationCardStroke,
  Image01Icon as ImageStroke,
  Image02Icon as ImagesStroke,
  IslandIcon as IslandStroke,
  FlashIcon as LightningStroke,
  LeftToRightListBulletIcon as ListBulletsStroke,
  SquareLock02Icon as LockStroke,
  LockKeyIcon as LockKeyStroke,
  SquareLock01Icon as LockSimpleStroke,
  Search01Icon as MagnifyingGlassStroke,
  Location01Icon as MapPinStroke,
  MapsIcon as MapTrifoldStroke,
  DrinkIcon as MartiniStroke,
  Megaphone01Icon as MegaphoneStroke,
  Mic01Icon as MicrophoneStroke,
  MinusSignIcon as MinusStroke,
  Money03Icon as MoneyStroke,
  Moon02Icon as MoonStarsStroke,
  Motorbike01Icon as MopedStroke,
  MountainIcon as MountainsStroke,
  Navigation03Icon as NavigationArrowStroke,
  Route01Icon as PathStroke,
  PencilEdit01Icon as PencilSimpleStroke,
  UserIcon as PersonStroke,
  WalkingIcon as PersonSimpleWalkStroke,
  CallIcon as PhoneStroke,
  PlusSignIcon as PlusStroke,
  QrCode01Icon as QrCodeStroke,
  Invoice01Icon as ReceiptStroke,
  RepeatIcon as RepeatStroke,
  RulerIcon as RulerStroke,
  Scissor01Icon as ScissorsStroke,
  CheckmarkBadge01Icon as SealCheckStroke,
  Share08Icon as ShareNetworkStroke,
  Shield02Icon as ShieldCheckStroke,
  ShoppingBag01Icon as ShoppingBagStroke,
  ShoppingCart01Icon as ShoppingCartSimpleStroke,
  Logout01Icon as SignOutStroke,
  Settings05Icon as SlidersHorizontalStroke,
  SparklesIcon as SparkleStroke,
  Menu01Icon as SquaresFourStroke,
  StarIcon as StarStroke,
  StopIcon as StopStroke,
  Store01Icon as StorefrontStroke,
  TravelBagIcon as SuitcaseRollingStroke,
  SunsetIcon as SunHorizonStroke,
  SwimmingIcon as SwimmingPoolStroke,
  Tag01Icon as TagStroke,
  Ticket01Icon as TicketStroke,
  Delete02Icon as TrashSimpleStroke,
  InboxIcon as TrayStroke,
  Tree01Icon as TreeStroke,
  UmbrellaIcon as UmbrellaStroke,
  Upload01Icon as UploadSimpleStroke,
  UserIcon as UserStroke,
  UserCircleIcon as UserCircleStroke,
  UserMultipleIcon as UsersStroke,
  UserGroupIcon as UsersThreeStroke,
  Wallet01Icon as WalletStroke,
  Alert02Icon as WarningStroke,
  AlertCircleIcon as WarningCircleStroke,
  AudioWave01Icon as WaveformStroke,
  WaveTriangleIcon as WavesStroke,
  Wifi01Icon as WifiHighStroke,
  WifiDisconnected01Icon as WifiSlashStroke,
  Wrench01Icon as WrenchStroke,
  Cancel01Icon as XStroke,
} from '@hugeicons-pro/core-stroke-rounded';
import {
  Airplane01Icon as AirplaneTiltSolid,
  AnchorIcon as AnchorSolid,
  ArrowLeft02Icon as ArrowLeftSolid,
  ArrowRight02Icon as ArrowRightSolid,
  ArrowUp02Icon as ArrowUpSolid,
  ArrowUpRight02Icon as ArrowUpRightSolid,
  Baby01Icon as BabySolid,
  BankIcon as BankSolid,
  Dumbbell01Icon as BarbellSolid,
  ShoppingBasket01Icon as BasketSolid,
  BedIcon as BedSolid,
  Notification01Icon as BellSolid,
  NotificationSquareIcon as BellRingingSolid,
  BicycleIcon as BicycleSolid,
  BookOpen01Icon as BookOpenSolid,
  Bookmark01Icon as BookmarkSimpleSolid,
  Briefcase01Icon as BriefcaseSolid,
  Building03Icon as BuildingsSolid,
  Calendar03Icon as CalendarBlankSolid,
  CalendarCheckIn01Icon as CalendarCheckSolid,
  CalendarAdd01Icon as CalendarPlusSolid,
  ConciergeBellIcon as CallBellSolid,
  Camera01Icon as CameraSolid,
  Car01Icon as CarSolid,
  ArrowDown01Icon as CaretDownSolid,
  ArrowLeft01Icon as CaretLeftSolid,
  ArrowRight01Icon as CaretRightSolid,
  ChartLineData01Icon as ChartLineUpSolid,
  Chatting01Icon as ChatCircleDotsSolid,
  Message01Icon as ChatTextSolid,
  Tick02Icon as CheckSolid,
  CheckmarkCircle02Icon as CheckCircleSolid,
  ChurchIcon as ChurchSolid,
  Clock01Icon as ClockSolid,
  Timer02Icon as ClockCountdownSolid,
  Clock05Icon as ClockCounterClockwiseSolid,
  Coffee01Icon as CoffeeSolid,
  Compass01Icon as CompassSolid,
  PartyPopperIcon as ConfettiSolid,
  ChefHatIcon as CookingPotSolid,
  Copy01Icon as CopySolid,
  CreditCardIcon as CreditCardSolid,
  SmartPhone01Icon as DeviceMobileSolid,
  Door01Icon as DoorSolid,
  Mail01Icon as EnvelopeSimpleSolid,
  ViewIcon as EyeSolid,
  FilterHorizontalIcon as FadersHorizontalSolid,
  FirstAidKitIcon as FirstAidKitSolid,
  FlowerIcon as FlowerSolid,
  Restaurant01Icon as ForkKnifeSolid,
  Settings01Icon as GearSolid,
  GiftIcon as GiftSolid,
  Globe02Icon as GlobeSolid,
  HammerIcon as HammerSolid,
  HandHeartIcon as HandHeartSolid,
  Agreement02Icon as HandshakeSolid,
  FavouriteIcon as HeartSolid,
  HourglassIcon as HourglassHighSolid,
  Home01Icon as HouseSolid,
  IdentityCardIcon as IdentificationCardSolid,
  Image01Icon as ImageSolid,
  Image02Icon as ImagesSolid,
  IslandIcon as IslandSolid,
  FlashIcon as LightningSolid,
  LeftToRightListBulletIcon as ListBulletsSolid,
  SquareLock02Icon as LockSolid,
  LockKeyIcon as LockKeySolid,
  SquareLock01Icon as LockSimpleSolid,
  Search01Icon as MagnifyingGlassSolid,
  Location01Icon as MapPinSolid,
  MapsIcon as MapTrifoldSolid,
  DrinkIcon as MartiniSolid,
  Megaphone01Icon as MegaphoneSolid,
  Mic01Icon as MicrophoneSolid,
  MinusSignIcon as MinusSolid,
  Money03Icon as MoneySolid,
  Moon02Icon as MoonStarsSolid,
  Motorbike01Icon as MopedSolid,
  MountainIcon as MountainsSolid,
  Navigation03Icon as NavigationArrowSolid,
  Route01Icon as PathSolid,
  PencilEdit01Icon as PencilSimpleSolid,
  UserIcon as PersonSolid,
  WalkingIcon as PersonSimpleWalkSolid,
  CallIcon as PhoneSolid,
  PlusSignIcon as PlusSolid,
  QrCode01Icon as QrCodeSolid,
  Invoice01Icon as ReceiptSolid,
  RepeatIcon as RepeatSolid,
  RulerIcon as RulerSolid,
  Scissor01Icon as ScissorsSolid,
  CheckmarkBadge01Icon as SealCheckSolid,
  Share08Icon as ShareNetworkSolid,
  Shield02Icon as ShieldCheckSolid,
  ShoppingBag01Icon as ShoppingBagSolid,
  ShoppingCart01Icon as ShoppingCartSimpleSolid,
  Logout01Icon as SignOutSolid,
  Settings05Icon as SlidersHorizontalSolid,
  SparklesIcon as SparkleSolid,
  Menu01Icon as SquaresFourSolid,
  StarIcon as StarSolid,
  StopIcon as StopSolid,
  Store01Icon as StorefrontSolid,
  TravelBagIcon as SuitcaseRollingSolid,
  SunsetIcon as SunHorizonSolid,
  SwimmingIcon as SwimmingPoolSolid,
  Tag01Icon as TagSolid,
  Ticket01Icon as TicketSolid,
  Delete02Icon as TrashSimpleSolid,
  InboxIcon as TraySolid,
  Tree01Icon as TreeSolid,
  UmbrellaIcon as UmbrellaSolid,
  Upload01Icon as UploadSimpleSolid,
  UserIcon as UserSolid,
  UserCircleIcon as UserCircleSolid,
  UserMultipleIcon as UsersSolid,
  UserGroupIcon as UsersThreeSolid,
  Wallet01Icon as WalletSolid,
  Alert02Icon as WarningSolid,
  AlertCircleIcon as WarningCircleSolid,
  AudioWave01Icon as WaveformSolid,
  WaveTriangleIcon as WavesSolid,
  Wifi01Icon as WifiHighSolid,
  WifiDisconnected01Icon as WifiSlashSolid,
  Wrench01Icon as WrenchSolid,
  Cancel01Icon as XSolid,
} from '@hugeicons-pro/core-solid-rounded';

export type IconWeight = 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
export type IconProps = Omit<SVGProps<SVGSVGElement>, 'ref' | 'color' | 'strokeWidth'> & {
  size?: number | string;
  weight?: IconWeight;
  color?: string;
  /** Drawn mirrored, for right-to-left. */
  mirrored?: boolean;
};
export type Icon = ComponentType<IconProps>;

const STROKE: Record<IconWeight, number> = { thin: 1.25, light: 1.5, regular: 1.75, bold: 2.25, fill: 1.75, duotone: 1.75 };

function make(name: string, stroke: IconSvgElement, solid: IconSvgElement): Icon {
  function AppIcon({ size = '1em', weight = 'regular', color = 'currentColor', mirrored, style, ...rest }: IconProps) {
    const solidGlyph = weight === 'fill' || weight === 'duotone';
    const flipped: CSSProperties | undefined = mirrored ? { ...style, transform: 'scaleX(-1)' } : style;
    return <HugeiconsIcon focusable="false" {...rest} icon={solidGlyph ? solid : stroke} size={size} color={color} strokeWidth={STROKE[weight]} style={flipped} />;
  }
  AppIcon.displayName = name;
  return AppIcon;
}

export const AirplaneTilt = make('AirplaneTilt', AirplaneTiltStroke, AirplaneTiltSolid);
export const Anchor = make('Anchor', AnchorStroke, AnchorSolid);
export const ArrowLeft = make('ArrowLeft', ArrowLeftStroke, ArrowLeftSolid);
export const ArrowRight = make('ArrowRight', ArrowRightStroke, ArrowRightSolid);
export const ArrowUp = make('ArrowUp', ArrowUpStroke, ArrowUpSolid);
export const ArrowUpRight = make('ArrowUpRight', ArrowUpRightStroke, ArrowUpRightSolid);
export const Baby = make('Baby', BabyStroke, BabySolid);
export const Bank = make('Bank', BankStroke, BankSolid);
export const Barbell = make('Barbell', BarbellStroke, BarbellSolid);
export const Basket = make('Basket', BasketStroke, BasketSolid);
export const Bed = make('Bed', BedStroke, BedSolid);
export const Bell = make('Bell', BellStroke, BellSolid);
export const BellRinging = make('BellRinging', BellRingingStroke, BellRingingSolid);
export const Bicycle = make('Bicycle', BicycleStroke, BicycleSolid);
export const BookOpen = make('BookOpen', BookOpenStroke, BookOpenSolid);
export const BookmarkSimple = make('BookmarkSimple', BookmarkSimpleStroke, BookmarkSimpleSolid);
export const Briefcase = make('Briefcase', BriefcaseStroke, BriefcaseSolid);
export const Buildings = make('Buildings', BuildingsStroke, BuildingsSolid);
export const CalendarBlank = make('CalendarBlank', CalendarBlankStroke, CalendarBlankSolid);
export const CalendarCheck = make('CalendarCheck', CalendarCheckStroke, CalendarCheckSolid);
export const CalendarPlus = make('CalendarPlus', CalendarPlusStroke, CalendarPlusSolid);
export const CallBell = make('CallBell', CallBellStroke, CallBellSolid);
export const Camera = make('Camera', CameraStroke, CameraSolid);
export const Car = make('Car', CarStroke, CarSolid);
export const CaretDown = make('CaretDown', CaretDownStroke, CaretDownSolid);
export const CaretLeft = make('CaretLeft', CaretLeftStroke, CaretLeftSolid);
export const CaretRight = make('CaretRight', CaretRightStroke, CaretRightSolid);
export const ChartLineUp = make('ChartLineUp', ChartLineUpStroke, ChartLineUpSolid);
export const ChatCircleDots = make('ChatCircleDots', ChatCircleDotsStroke, ChatCircleDotsSolid);
export const ChatText = make('ChatText', ChatTextStroke, ChatTextSolid);
export const Check = make('Check', CheckStroke, CheckSolid);
export const CheckCircle = make('CheckCircle', CheckCircleStroke, CheckCircleSolid);
export const Church = make('Church', ChurchStroke, ChurchSolid);
export const Clock = make('Clock', ClockStroke, ClockSolid);
export const ClockCountdown = make('ClockCountdown', ClockCountdownStroke, ClockCountdownSolid);
export const ClockCounterClockwise = make('ClockCounterClockwise', ClockCounterClockwiseStroke, ClockCounterClockwiseSolid);
export const Coffee = make('Coffee', CoffeeStroke, CoffeeSolid);
export const Compass = make('Compass', CompassStroke, CompassSolid);
export const Confetti = make('Confetti', ConfettiStroke, ConfettiSolid);
export const CookingPot = make('CookingPot', CookingPotStroke, CookingPotSolid);
export const Copy = make('Copy', CopyStroke, CopySolid);
export const CreditCard = make('CreditCard', CreditCardStroke, CreditCardSolid);
export const DeviceMobile = make('DeviceMobile', DeviceMobileStroke, DeviceMobileSolid);
export const Door = make('Door', DoorStroke, DoorSolid);
export const EnvelopeSimple = make('EnvelopeSimple', EnvelopeSimpleStroke, EnvelopeSimpleSolid);
export const Eye = make('Eye', EyeStroke, EyeSolid);
export const FadersHorizontal = make('FadersHorizontal', FadersHorizontalStroke, FadersHorizontalSolid);
export const FirstAidKit = make('FirstAidKit', FirstAidKitStroke, FirstAidKitSolid);
export const Flower = make('Flower', FlowerStroke, FlowerSolid);
export const ForkKnife = make('ForkKnife', ForkKnifeStroke, ForkKnifeSolid);
export const Gear = make('Gear', GearStroke, GearSolid);
export const Gift = make('Gift', GiftStroke, GiftSolid);
export const Globe = make('Globe', GlobeStroke, GlobeSolid);
export const Hammer = make('Hammer', HammerStroke, HammerSolid);
export const HandHeart = make('HandHeart', HandHeartStroke, HandHeartSolid);
export const Handshake = make('Handshake', HandshakeStroke, HandshakeSolid);
export const Heart = make('Heart', HeartStroke, HeartSolid);
export const HourglassHigh = make('HourglassHigh', HourglassHighStroke, HourglassHighSolid);
export const House = make('House', HouseStroke, HouseSolid);
export const IdentificationCard = make('IdentificationCard', IdentificationCardStroke, IdentificationCardSolid);
export const Image = make('Image', ImageStroke, ImageSolid);
export const Images = make('Images', ImagesStroke, ImagesSolid);
export const Island = make('Island', IslandStroke, IslandSolid);
export const Lightning = make('Lightning', LightningStroke, LightningSolid);
export const ListBullets = make('ListBullets', ListBulletsStroke, ListBulletsSolid);
export const Lock = make('Lock', LockStroke, LockSolid);
export const LockKey = make('LockKey', LockKeyStroke, LockKeySolid);
export const LockSimple = make('LockSimple', LockSimpleStroke, LockSimpleSolid);
export const MagnifyingGlass = make('MagnifyingGlass', MagnifyingGlassStroke, MagnifyingGlassSolid);
export const MapPin = make('MapPin', MapPinStroke, MapPinSolid);
export const MapTrifold = make('MapTrifold', MapTrifoldStroke, MapTrifoldSolid);
export const Martini = make('Martini', MartiniStroke, MartiniSolid);
export const Megaphone = make('Megaphone', MegaphoneStroke, MegaphoneSolid);
export const Microphone = make('Microphone', MicrophoneStroke, MicrophoneSolid);
export const Minus = make('Minus', MinusStroke, MinusSolid);
export const Money = make('Money', MoneyStroke, MoneySolid);
export const MoonStars = make('MoonStars', MoonStarsStroke, MoonStarsSolid);
export const Moped = make('Moped', MopedStroke, MopedSolid);
export const Mountains = make('Mountains', MountainsStroke, MountainsSolid);
export const NavigationArrow = make('NavigationArrow', NavigationArrowStroke, NavigationArrowSolid);
export const Path = make('Path', PathStroke, PathSolid);
export const PencilSimple = make('PencilSimple', PencilSimpleStroke, PencilSimpleSolid);
export const Person = make('Person', PersonStroke, PersonSolid);
export const PersonSimpleWalk = make('PersonSimpleWalk', PersonSimpleWalkStroke, PersonSimpleWalkSolid);
export const Phone = make('Phone', PhoneStroke, PhoneSolid);
export const Plus = make('Plus', PlusStroke, PlusSolid);
export const QrCode = make('QrCode', QrCodeStroke, QrCodeSolid);
export const Receipt = make('Receipt', ReceiptStroke, ReceiptSolid);
export const Repeat = make('Repeat', RepeatStroke, RepeatSolid);
export const Ruler = make('Ruler', RulerStroke, RulerSolid);
export const Scissors = make('Scissors', ScissorsStroke, ScissorsSolid);
export const SealCheck = make('SealCheck', SealCheckStroke, SealCheckSolid);
export const ShareNetwork = make('ShareNetwork', ShareNetworkStroke, ShareNetworkSolid);
export const ShieldCheck = make('ShieldCheck', ShieldCheckStroke, ShieldCheckSolid);
export const ShoppingBag = make('ShoppingBag', ShoppingBagStroke, ShoppingBagSolid);
export const ShoppingCartSimple = make('ShoppingCartSimple', ShoppingCartSimpleStroke, ShoppingCartSimpleSolid);
export const SignOut = make('SignOut', SignOutStroke, SignOutSolid);
export const SlidersHorizontal = make('SlidersHorizontal', SlidersHorizontalStroke, SlidersHorizontalSolid);
export const Sparkle = make('Sparkle', SparkleStroke, SparkleSolid);
export const SquaresFour = make('SquaresFour', SquaresFourStroke, SquaresFourSolid);
export const Star = make('Star', StarStroke, StarSolid);
export const Stop = make('Stop', StopStroke, StopSolid);
export const Storefront = make('Storefront', StorefrontStroke, StorefrontSolid);
export const SuitcaseRolling = make('SuitcaseRolling', SuitcaseRollingStroke, SuitcaseRollingSolid);
export const SunHorizon = make('SunHorizon', SunHorizonStroke, SunHorizonSolid);
export const SwimmingPool = make('SwimmingPool', SwimmingPoolStroke, SwimmingPoolSolid);
export const Tag = make('Tag', TagStroke, TagSolid);
export const Ticket = make('Ticket', TicketStroke, TicketSolid);
export const TrashSimple = make('TrashSimple', TrashSimpleStroke, TrashSimpleSolid);
export const Tray = make('Tray', TrayStroke, TraySolid);
export const Tree = make('Tree', TreeStroke, TreeSolid);
export const Umbrella = make('Umbrella', UmbrellaStroke, UmbrellaSolid);
export const UploadSimple = make('UploadSimple', UploadSimpleStroke, UploadSimpleSolid);
export const User = make('User', UserStroke, UserSolid);
export const UserCircle = make('UserCircle', UserCircleStroke, UserCircleSolid);
export const Users = make('Users', UsersStroke, UsersSolid);
export const UsersThree = make('UsersThree', UsersThreeStroke, UsersThreeSolid);
export const Wallet = make('Wallet', WalletStroke, WalletSolid);
export const Warning = make('Warning', WarningStroke, WarningSolid);
export const WarningCircle = make('WarningCircle', WarningCircleStroke, WarningCircleSolid);
export const Waveform = make('Waveform', WaveformStroke, WaveformSolid);
export const Waves = make('Waves', WavesStroke, WavesSolid);
export const WifiHigh = make('WifiHigh', WifiHighStroke, WifiHighSolid);
export const WifiSlash = make('WifiSlash', WifiSlashStroke, WifiSlashSolid);
export const Wrench = make('Wrench', WrenchStroke, WrenchSolid);
export const X = make('X', XStroke, XSolid);
