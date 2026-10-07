import { envUrl } from "./env-url";

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export const SITE_URL = envUrl(process.env.NEXT_PUBLIC_SITE_URL, "http://localhost:3001");

/** The permanent URL written to a card's NFC tag. */
export const cardUrl = (slug: string) => `${SITE_URL}/c/${slug}`;

/** `/uploads/...` paths become absolute for Open Graph and vCards. */
export const absoluteUrl = (url: string | null) => (url && url.startsWith("/") ? `${SITE_URL}${url}` : url);

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
const full = new Intl.NumberFormat("en");

/** 1,284 → "1,284"; 12,900 → "12.9K". */
export const formatCount = (n: number) => (Math.abs(n) >= 10_000 ? compact.format(n) : full.format(n));

export function formatDate(iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = { dateStyle: "medium" }) {
  if (!iso) return "-";
  return new Intl.DateTimeFormat(undefined, opts).format(new Date(iso));
}

export function formatRelative(iso: string): string {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  for (const [unit, seconds] of units) {
    if (Math.abs(diff) >= seconds) return rtf.format(Math.round(diff / seconds), unit);
  }
  return "just now";
}

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
    .replace(/-+$/g, "");
}

export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w));
  return (words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? "?").slice(0, 2)).toUpperCase();
}

/** Mirrors the API's NormalizeLink so the editor preview matches what will be saved. */
export function normalizeLink(value: string): string {
  const v = value.trim();
  if (!v || /^[a-z][a-z0-9+.-]*:/i.test(v)) return v;
  if (/^[\w-]+(\.[\w-]+)+([/?#].*)?$/.test(v)) return `https://${v}`;
  return v;
}

/** WCAG relative luminance of a `#rrggbb` colour. */
function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Black or white text, whichever has the higher WCAG contrast on `hex`. */
export function readableOn(hex: string): "#ffffff" | "#0b0b0b" {
  const lum = luminance(hex);
  const onWhite = 1.05 / (lum + 0.05);
  const onInk = (lum + 0.05) / (luminance("#0b0b0b") + 0.05);
  return onInk > onWhite ? "#0b0b0b" : "#ffffff";
}

/** `#rrggbb` + alpha → `rgba()`. */
export function withAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;
export const whatsappHref = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "")}`;
export const mapsSearchUrl = (address: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.replace(/\n/g, ", "))}`;
