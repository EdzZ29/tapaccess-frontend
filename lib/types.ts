/** API response shapes. Mirrors the NestJS mappers in tapaccess-backend. */

export type CardStatus = "active" | "inactive" | "archived";
export type CardPlan = "starter" | "business";

export type SectionType =
  | "about"
  | "actions"
  | "contact"
  | "social"
  | "hours"
  | "services"
  | "products"
  | "promotions"
  | "gallery"
  | "announcements"
  | "location";

export type SocialPlatform =
  | "facebook"
  | "instagram"
  | "tiktok"
  | "youtube"
  | "x"
  | "linkedin"
  | "whatsapp"
  | "telegram"
  | "pinterest"
  | "threads"
  | "google_reviews"
  | "other";

export type ThemeFont =
  | "inter-tight"
  | "plus-jakarta"
  | "manrope"
  | "bricolage"
  | "instrument-serif"
  | "inter"
  | "poppins"
  | "montserrat"
  | "playfair"
  | "lora"
  | "space-grotesk";
export type MediaKind = "logo" | "cover" | "gallery" | "item" | "background" | "other";
export type ClickKind = "button" | "social" | "contact" | "item";

export interface Theme {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  mutedTextColor: string;
  backgroundStyle: "solid" | "gradient" | "image";
  gradientTo: string;
  backgroundImageUrl: string | null;
  fontHeading: ThemeFont;
  fontBody: ThemeFont;
  buttonStyle: "solid" | "soft" | "outline" | "glass";
  buttonShape: "rounded" | "pill" | "square";
  layout: "classic" | "centered" | "minimal";
}

export interface OpeningHoursDay {
  day: number;
  closed: boolean;
  open: string;
  close: string;
}

/** What happens the moment someone taps the card and the page opens. */
export type TapAction = "profile" | "save_contact" | "call";

/** A number besides the main phone, e.g. per mobile network ("Smart", "Globe"). */
export interface ExtraPhone {
  label: string;
  number: string;
}

export interface ProfileFields {
  businessName: string;
  tagline: string | null;
  description: string | null;
  category: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  phone: string | null;
  /** Optional name for the main phone, e.g. "Globe" (shown instead of "Phone"). */
  phoneLabel: string | null;
  extraPhones: ExtraPhone[];
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  mapsUrl: string | null;
  reviewsUrl: string | null;
  openingHours: OpeningHoursDay[];
  hoursNote: string | null;
  theme: Theme;
  tapAction: TapAction;
}

export interface SectionItem {
  id?: string;
  title: string;
  description: string | null;
  price: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  linkLabel: string | null;
  badge: string | null;
  startsAt: string | null;
  endsAt: string | null;
  enabled: boolean;
}

export interface Section {
  id?: string;
  type: SectionType;
  title: string | null;
  enabled: boolean;
  items: SectionItem[];
}

export interface CardButton {
  id?: string;
  label: string;
  url: string;
  icon: string;
  enabled: boolean;
  highlighted: boolean;
}

export interface SocialLink {
  id?: string;
  platform: SocialPlatform;
  url: string;
  label: string | null;
  enabled: boolean;
}

export interface CardSummary {
  id: string;
  cardCode: string;
  slug: string;
  status: CardStatus;
  plan: CardPlan;
  businessName: string;
  category: string | null;
  logoUrl: string | null;
  notes: string | null;
  /** Live card: changing the slug keeps the old address forwarding here. */
  slugForwards: boolean;
  firstActivatedAt: string | null;
  archivedAt: string | null;
  /** Business cards: the owner may edit their own buttons and social links. */
  ownerAccess: { enabled: boolean; active: boolean; codeSetAt: string | null; lastEditAt: string | null };
  createdAt: string;
  updatedAt: string;
  visitCount: number;
}

export interface CardDetail extends CardSummary {
  /** Previous addresses that forward to this card. */
  oldSlugs: string[];
  profile: ProfileFields;
  sections: Section[];
  buttons: CardButton[];
  socialLinks: SocialLink[];
}

/** What the editor saves with PUT /admin/cards/:id/profile. */
export interface ProfileDocument {
  profile: ProfileFields;
  sections: Section[];
  buttons: CardButton[];
  socialLinks: SocialLink[];
}

export interface PublicProfile {
  slug: string;
  businessName: string;
  tagline: string | null;
  description: string | null;
  category: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  contact: {
    phone: string | null;
    phoneLabel?: string | null;
    extraPhones?: ExtraPhone[];
    whatsapp: string | null;
    email: string | null;
    website: string | null;
    address: string | null;
    mapsUrl: string | null;
    reviewsUrl: string | null;
  };
  openingHours: OpeningHoursDay[];
  hoursNote: string | null;
  theme: Theme;
  /** Already falls back to "profile" (API side) when the card can't do it. */
  tapAction: TapAction;
  /** The card's owner can sign in to edit their links (shows the Edit button). */
  ownerEditing?: boolean;
  sections: {
    type: SectionType;
    title: string | null;
    items: {
      id: string;
      title: string;
      description: string | null;
      price: string | null;
      imageUrl: string | null;
      linkUrl: string | null;
      linkLabel: string | null;
      badge: string | null;
      endsAt: string | null;
    }[];
  }[];
  buttons: { id: string; label: string; url: string; icon: string; highlighted: boolean }[];
  socialLinks: { id: string; platform: SocialPlatform; url: string; label: string | null }[];
  updatedAt: string;
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface CardStats {
  totalCards: number;
  active: number;
  inactive: number;
  archived: number;
  totalVisits: number;
  byPlan: Record<CardPlan, number>;
}

export interface RangeTotals {
  allTimeVisits: number;
  visits: number;
  uniqueVisitors: number;
  clicks: number;
}

export interface DailyPoint {
  date: string;
  visits: number;
  uniqueVisitors: number;
  clicks: number;
}

export interface AnalyticsOverview {
  days: number;
  tz: string;
  totals: RangeTotals;
  series: DailyPoint[];
  topCards: { cardId: string; slug: string; businessName: string; status: CardStatus; visits: number }[];
}

export interface CardAnalytics {
  days: number;
  tz: string;
  totals: RangeTotals;
  series: DailyPoint[];
  clicksByButton: { key: string; kind: ClickKind; target: string; buttonId: string | null; label: string; clicks: number }[];
  devices: { deviceType: string; visits: number }[];
  referrers: { host: string; visits: number }[];
}

export interface MediaAsset {
  id: string;
  cardId: string | null;
  kind: MediaKind;
  url: string;
  width: number;
  height: number;
  sizeBytes: number;
  mimeType: string;
  originalName: string | null;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "super_admin";
  lastLoginAt: string | null;
}

/** What a card owner sees and edits in their self-service editor. */
export interface OwnerCard {
  slug: string;
  businessName: string;
  plan: CardPlan;
  lastEditAt: string | null;
  buttons: CardButton[];
  socialLinks: SocialLink[];
}
