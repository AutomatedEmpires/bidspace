import type { SVGProps } from "react";
import {
  ArrowRight,
  ArrowSquareOut,
  ArrowsClockwise,
  Bank,
  Bell,
  BookmarkSimple,
  Buildings,
  CalendarBlank,
  CalendarDots,
  CaretDown,
  CaretLeft,
  CaretRight,
  ChartBar,
  ChatCircleText,
  Check,
  CheckCircle,
  Clock,
  Compass,
  CurrencyDollar,
  Drop,
  Envelope,
  FileText,
  Flag,
  Funnel,
  Gavel,
  GearSix,
  GridFour,
  HandCoins,
  Handshake,
  HourglassMedium,
  Image,
  Lightning,
  List,
  MagnifyingGlass,
  MapPin,
  MapTrifold,
  PaperPlaneTilt,
  PencilSimple,
  Plus,
  Ruler,
  SealCheck,
  ShieldCheck,
  SignOut,
  Sparkle,
  SquaresFour,
  Stack,
  Star,
  Storefront,
  TrendUp,
  Truck,
  UserCircle,
  UsersThree,
  Warning,
  WarningCircle,
  WifiHigh,
  X,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon as PhosphorIcon, IconWeight } from "@phosphor-icons/react";

// Semantic icon registry — the single icon system for BidSpace, backed by
// Phosphor (AutomatedEmpires standard). Call sites use semantic names, never
// glyph names, so the visual language can evolve in one place. Add a name here
// rather than importing a Phosphor icon directly in a component.
const REGISTRY = {
  // Marketplace objects
  venue: Buildings,
  unit: GridFour,
  opportunity: Sparkle,
  bid: Gavel,
  booking: CalendarBlank,
  calendar: CalendarDots,
  inventory: Stack,
  vendor: Storefront,
  audience: UsersThree,
  money: CurrencyDollar,
  payout: Bank,
  fee: HandCoins,
  network: Handshake,
  event: Flag,

  // Space attributes
  pin: MapPin,
  map: MapTrifold,
  dimensions: Ruler,
  power: Lightning,
  water: Drop,
  wifi: WifiHigh,
  vehicle: Truck,

  // Actions
  search: MagnifyingGlass,
  filter: Funnel,
  save: BookmarkSimple,
  send: PaperPlaneTilt,
  add: Plus,
  edit: PencilSimple,
  repeat: ArrowsClockwise,
  explore: Compass,
  message: ChatCircleText,
  email: Envelope,
  signOut: SignOut,
  external: ArrowSquareOut,
  menu: List,

  // Trust & state
  verified: SealCheck,
  shield: ShieldCheck,
  document: FileText,
  review: Star,
  check: Check,
  success: CheckCircle,
  close: X,
  warning: WarningCircle,
  alert: Warning,
  pending: HourglassMedium,
  clock: Clock,
  photo: Image,
  profile: UserCircle,
  alerts: Bell,

  // Navigation & metrics
  command: SquaresFour,
  metrics: ChartBar,
  trend: TrendUp,
  arrowRight: ArrowRight,
  caretRight: CaretRight,
  caretLeft: CaretLeft,
  caretDown: CaretDown,
} satisfies Record<string, PhosphorIcon>;

export type IconName = keyof typeof REGISTRY;

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "ref"> {
  name: IconName;
  size?: number | string;
  weight?: IconWeight;
}

export function Icon({ name, size = 20, weight = "regular", ...rest }: IconProps) {
  const Glyph = REGISTRY[name];
  return <Glyph size={size} weight={weight} aria-hidden={rest["aria-label"] ? undefined : true} {...rest} />;
}
