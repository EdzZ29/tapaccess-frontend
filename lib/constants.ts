import type { CardStatus, SectionType, SocialPlatform, Theme, ThemeFont } from "./types";

/**
 * Allow-lists mirrored from `tapaccess-backend/src/common/constants.ts`.
 * The API rejects anything not listed there, so keep both files in sync.
 */

export const THEME_FONTS: { value: ThemeFont; label: string }[] = [
  { value: "inter-tight", label: "Inter Tight" },
  { value: "plus-jakarta", label: "Plus Jakarta Sans" },
  { value: "manrope", label: "Manrope" },
  { value: "bricolage", label: "Bricolage Grotesque" },
  { value: "instrument-serif", label: "Instrument Serif" },
  { value: "inter", label: "Inter" },
  { value: "poppins", label: "Poppins" },
  { value: "montserrat", label: "Montserrat" },
  { value: "space-grotesk", label: "Space Grotesk" },
  { value: "playfair", label: "Playfair Display" },
  { value: "lora", label: "Lora" },
];

export const BUTTON_STYLES: { value: Theme["buttonStyle"]; label: string }[] = [
  { value: "solid", label: "Solid" },
  { value: "soft", label: "Soft" },
  { value: "outline", label: "Outline" },
  { value: "glass", label: "Glass" },
];

export const BUTTON_SHAPES: { value: Theme["buttonShape"]; label: string }[] = [
  { value: "rounded", label: "Rounded" },
  { value: "pill", label: "Pill" },
  { value: "square", label: "Square" },
];

export const LAYOUTS: { value: Theme["layout"]; label: string; description: string }[] = [
  { value: "classic", label: "Classic", description: "Cover banner, logo on the left" },
  { value: "centered", label: "Centered", description: "Cover banner, everything centered" },
  { value: "minimal", label: "Minimal", description: "No cover, logo first" },
];

export const BACKGROUND_STYLES: { value: Theme["backgroundStyle"]; label: string }[] = [
  { value: "solid", label: "Solid" },
  { value: "gradient", label: "Gradient" },
  { value: "image", label: "Image" },
];

export const BUTTON_ICONS = [
  "link",
  "globe",
  "phone",
  "mail",
  "message-circle",
  "whatsapp",
  "map-pin",
  "navigation",
  "star",
  "calendar",
  "clock",
  "shopping-bag",
  "shopping-cart",
  "utensils",
  "coffee",
  "gift",
  "ticket",
  "tag",
  "credit-card",
  "download",
  "file-text",
  "menu",
  "heart",
  "camera",
  "music",
  "video",
  "car",
  "home",
  "briefcase",
  "dumbbell",
  "scissors",
  "stethoscope",
  "graduation-cap",
  "info",
  "user-plus",
  "instagram",
  "facebook",
  "tiktok",
  "youtube",
] as const;

/**
 * Ready-made call-to-action labels for the button editor. Picking one also
 * suggests an icon and the kind of link it needs. Labels are plain text on
 * the API side, so this list can grow freely (max 60 characters each).
 */
/** Built-in button actions resolved by the public page (mirrors BUTTON_ACTIONS in the API). */
export const VCARD_ACTION = "action:vcard";

export const BUTTON_LABEL_PRESETS: { group: string; label: string; icon: string; linkHint: string; fixedUrl?: string }[] = [
  { group: "Bookings", label: "Book now", icon: "calendar", linkHint: "https://… booking page" },
  { group: "Bookings", label: "Book an appointment", icon: "calendar", linkHint: "https://… booking page" },
  { group: "Bookings", label: "Reserve a table", icon: "utensils", linkHint: "https://… reservations" },
  { group: "Bookings", label: "Get a free quote", icon: "file-text", linkHint: "https://… quote form" },
  { group: "Contact", label: "Call us", icon: "phone", linkHint: "tel:+15551234567" },
  { group: "Contact", label: "Message us on WhatsApp", icon: "whatsapp", linkHint: "https://wa.me/15551234567" },
  { group: "Contact", label: "Send us an email", icon: "mail", linkHint: "mailto:hello@business.com" },
  { group: "Contact", label: "Send a text", icon: "message-circle", linkHint: "sms:+15551234567" },
  { group: "Contact", label: "Save contact", icon: "user-plus", linkHint: "", fixedUrl: VCARD_ACTION },
  { group: "Contact", label: "Get directions", icon: "navigation", linkHint: "https://maps.app.goo.gl/…" },
  { group: "Shop & order", label: "Order online", icon: "shopping-bag", linkHint: "https://… order page" },
  { group: "Shop & order", label: "Shop now", icon: "shopping-cart", linkHint: "https://… shop" },
  { group: "Shop & order", label: "View our menu", icon: "menu", linkHint: "https://… menu or PDF" },
  { group: "Shop & order", label: "See our prices", icon: "tag", linkHint: "https://… price list" },
  { group: "Shop & order", label: "Buy a gift card", icon: "gift", linkHint: "https://… gift cards" },
  { group: "Shop & order", label: "Pay online", icon: "credit-card", linkHint: "https://… payment link" },
  { group: "Learn more", label: "Visit our website", icon: "globe", linkHint: "https://business.com" },
  { group: "Learn more", label: "View our portfolio", icon: "camera", linkHint: "https://… portfolio" },
  { group: "Learn more", label: "Download brochure", icon: "download", linkHint: "https://… file.pdf" },
  { group: "Learn more", label: "Watch our video", icon: "video", linkHint: "https://youtube.com/…" },
  { group: "Learn more", label: "Upcoming events", icon: "ticket", linkHint: "https://… events" },
  { group: "Engage", label: "Review us on Google", icon: "star", linkHint: "https://g.page/r/…/review" },
  { group: "Engage", label: "Leave us a review", icon: "star", linkHint: "https://g.page/r/…/review" },
  { group: "Engage", label: "Join our mailing list", icon: "heart", linkHint: "https://… sign-up form" },
  { group: "Engage", label: "We're hiring", icon: "briefcase", linkHint: "https://… careers" },
];

export const SOCIAL_PLATFORMS:{ value: SocialPlatform; label: string; placeholder: string }[] = [
  { value: "instagram", label: "Instagram", placeholder: "https://instagram.com/yourbusiness" },
  { value: "facebook", label: "Facebook", placeholder: "https://facebook.com/yourbusiness" },
  { value: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@yourbusiness" },
  { value: "youtube", label: "YouTube", placeholder: "https://youtube.com/@yourbusiness" },
  { value: "x", label: "X (Twitter)", placeholder: "https://x.com/yourbusiness" },
  { value: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/yourbusiness" },
  { value: "whatsapp", label: "WhatsApp", placeholder: "https://wa.me/15551234567" },
  { value: "telegram", label: "Telegram", placeholder: "https://t.me/yourbusiness" },
  { value: "pinterest", label: "Pinterest", placeholder: "https://pinterest.com/yourbusiness" },
  { value: "threads", label: "Threads", placeholder: "https://threads.net/@yourbusiness" },
  { value: "other", label: "Other", placeholder: "https://…" },
];

export const socialLabel = (p: SocialPlatform, label?: string | null) =>
  p === "other" ? label || "Link" : (SOCIAL_PLATFORMS.find((s) => s.value === p)?.label ?? p);

export interface SectionMeta {
  label: string;
  defaultTitle: string;
  description: string;
  /** Whether the section's content is a list of items edited in the Sections tab. */
  hasItems: boolean;
  /** Which item fields the editor shows. */
  itemFields?: ("description" | "price" | "imageUrl" | "link" | "badge" | "dates")[];
  itemNoun?: string;
}

export const SECTION_META: Record<SectionType, SectionMeta> = {
  actions: { label: "Links", defaultTitle: "Links", description: "Custom buttons after the two in the header (Buttons tab)", hasItems: false },
  about: { label: "About", defaultTitle: "About", description: "Description from the Profile tab", hasItems: false },
  contact: { label: "Quick actions", defaultTitle: "Quick Actions", description: "Phone, WhatsApp, email and website", hasItems: false },
  social: { label: "Social media", defaultTitle: "Social Media", description: "Social profiles (Buttons tab)", hasItems: false },
  hours: { label: "Opening hours", defaultTitle: "Opening hours", description: "Weekly schedule (Contact tab)", hasItems: false },
  location: { label: "Location", defaultTitle: "Find us", description: "Address with a directions button", hasItems: false },
  services: {
    label: "Services",
    defaultTitle: "Services",
    description: "What you offer, with optional prices",
    hasItems: true,
    itemFields: ["description", "price", "imageUrl", "link"],
    itemNoun: "service",
  },
  products: {
    label: "Products",
    defaultTitle: "Products",
    description: "Product cards with image and price",
    hasItems: true,
    itemFields: ["description", "price", "imageUrl", "link", "badge"],
    itemNoun: "product",
  },
  promotions: {
    label: "Promotions",
    defaultTitle: "Promotions",
    description: "Offers, optionally limited to a date range",
    hasItems: true,
    itemFields: ["description", "imageUrl", "link", "badge", "dates"],
    itemNoun: "promotion",
  },
  gallery: {
    label: "Photo gallery",
    defaultTitle: "Gallery",
    description: "A grid of photos",
    hasItems: true,
    itemFields: ["imageUrl"],
    itemNoun: "photo",
  },
  announcements: {
    label: "Announcements",
    defaultTitle: "Announcements",
    description: "News and notices, optionally scheduled",
    hasItems: true,
    itemFields: ["description", "link", "dates"],
    itemNoun: "announcement",
  },
};

export const STATUS_META: Record<CardStatus, { label: string; description: string }> = {
  active: { label: "Active", description: "Public profile is live" },
  inactive: { label: "Inactive", description: "Visitors see an unavailable page" },
  archived: { label: "Archived", description: "Hidden from the main list and offline" },
};

export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const LIMITS = { buttons: 20, socialLinks: 15, itemsPerSection: 40, uploadMb: 8 } as const;

/** One-click starting points in the theme editor: flat, restrained palettes. */
export const THEME_PRESETS: { name: string; theme: Partial<Theme> }[] = [
  {
    name: "Mono",
    theme: { primaryColor: "#111111", accentColor: "#2563eb", backgroundColor: "#f7f7f5", surfaceColor: "#ffffff", textColor: "#111111", mutedTextColor: "#6b6b6b", backgroundStyle: "solid" },
  },
  {
    name: "Night",
    theme: { primaryColor: "#ffffff", accentColor: "#facc15", backgroundColor: "#0b0b0c", surfaceColor: "#161618", textColor: "#f5f5f4", mutedTextColor: "#a1a1aa", backgroundStyle: "solid" },
  },
  {
    name: "Forest",
    theme: { primaryColor: "#14532d", accentColor: "#ca8a04", backgroundColor: "#f4f3ee", surfaceColor: "#ffffff", textColor: "#1c1917", mutedTextColor: "#6b6a63", backgroundStyle: "solid" },
  },
  {
    name: "Clay",
    theme: { primaryColor: "#9a3412", accentColor: "#1e3a8a", backgroundColor: "#faf6f1", surfaceColor: "#ffffff", textColor: "#292524", mutedTextColor: "#78716c", backgroundStyle: "solid" },
  },
  {
    name: "Navy",
    theme: { primaryColor: "#1e3a8a", accentColor: "#0ea5e9", backgroundColor: "#f5f7fa", surfaceColor: "#ffffff", textColor: "#0f172a", mutedTextColor: "#64748b", backgroundStyle: "solid" },
  },
  {
    name: "Volt",
    theme: { primaryColor: "#d9f99d", accentColor: "#a3e635", backgroundColor: "#09090b", surfaceColor: "#18181b", textColor: "#fafafa", mutedTextColor: "#a1a1aa", backgroundStyle: "solid" },
  },
];
