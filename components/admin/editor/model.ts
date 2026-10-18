import { LIMITS } from "@/lib/constants";
import { applyPlan, sectionAlwaysOn } from "@/lib/plans";
import type {
  CardButton,
  CardDetail,
  CardPlan,
  ProfileDocument,
  ProfileFields,
  PublicProfile,
  Section,
  SectionItem,
  SocialLink,
  TapAction,
} from "@/lib/types";
import { normalizeLink } from "@/lib/utils";

/**
 * Editor state is the saved document plus a client-only `_key` on rows that
 * have no database id yet, so React can track them before the first save.
 */
export type Keyed<T> = T & { _key?: string };

export interface EditorDoc {
  profile: ProfileDocument["profile"];
  sections: (Omit<Section, "items"> & { items: Keyed<SectionItem>[] })[];
  buttons: Keyed<CardButton>[];
  socialLinks: Keyed<SocialLink>[];
}

/** The part of the document the Buttons & links tab edits (also used by the owner editor). */
export type LinksDoc = Pick<EditorDoc, "buttons" | "socialLinks">;

let counter = 0;
export const newKey = () => `new-${Date.now().toString(36)}-${(counter++).toString(36)}`;
export const rowKey = (row: { id?: string; _key?: string }) => row.id ?? row._key ?? "";

export function docFromCard(card: CardDetail): EditorDoc {
  return {
    profile: { ...structuredClone(card.profile), tapAction: card.profile.tapAction ?? "profile", extraPhones: card.profile.extraPhones ?? [], phoneLabel: card.profile.phoneLabel ?? null, alwaysOpen: card.profile.alwaysOpen ?? false },
    sections: structuredClone(card.sections),
    buttons: structuredClone(card.buttons),
    socialLinks: structuredClone(card.socialLinks),
  };
}

function strip<T extends { _key?: string }>(row: T): Omit<T, "_key"> {
  const copy = { ...row };
  delete copy._key;
  return copy;
}

/** Request body for PUT /admin/cards/:id/profile, only fields the API accepts. */
export function toPayload(doc: EditorDoc): ProfileDocument {
  return {
    profile: doc.profile,
    sections: doc.sections.map((s) => ({
      type: s.type,
      title: s.title?.trim() ? s.title : null,
      enabled: s.enabled,
      items: s.type === "gallery" ? s.items.map((i) => strip(withPhotoTitle(i))) : s.items.map(strip),
    })),
    buttons: doc.buttons.map(strip),
    socialLinks: doc.socialLinks.map(strip),
  };
}

/** The API needs a title on every item; a gallery photo's is only its (optional) description. */
export const PHOTO_FALLBACK_TITLE = "Photo";
export const withPhotoTitle = <T extends { title: string }>(item: T): T =>
  item.title.trim() ? item : { ...item, title: PHOTO_FALLBACK_TITLE };

/** Like the API: the gallery shows its first photos only, up to LIMITS.galleryPhotos. */
export const capGallery = <T extends { imageUrl: string | null }>(type: string, items: T[]): T[] =>
  type === "gallery" ? items.filter((i) => i.imageUrl).slice(0, LIMITS.galleryPhotos) : items;

/** A save the API would refuse because the gallery holds too many photos (message for the editor). */
export function galleryOverLimit(count: number): string | null {
  const over = count - LIMITS.galleryPhotos;
  return over > 0 ? `A gallery holds up to ${LIMITS.galleryPhotos} photos. Remove ${over}, then save.` : null;
}

export function move<T>(list: T[], index: number, delta: -1 | 1): T[] {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/**
 * Mirrors the API: an automatic call needs a phone number, saving a contact
 * needs something to save. Otherwise the tap simply shows the profile.
 */
export function effectiveTapAction(p: Pick<ProfileFields, "tapAction" | "phone" | "email" | "whatsapp" | "extraPhones">): TapAction {
  if (p.tapAction === "call" && !p.phone) return "profile";
  if (p.tapAction === "save_contact" && !p.phone && !p.email && !p.whatsapp && !p.extraPhones?.length) return "profile";
  return p.tapAction ?? "profile";
}

const isLive = (i: SectionItem, now: number) =>
  i.enabled && (!i.startsAt || new Date(i.startsAt).getTime() <= now) && (!i.endsAt || new Date(i.endsAt).getTime() >= now);

/**
 * Mirrors the API's public mapper so the live preview shows exactly what a
 * visitor would see after saving (disabled rows, expired promotions and the
 * card's package all applied).
 */
export function toPreview(doc: EditorDoc, slug: string, plan: CardPlan): PublicProfile {
  const now = Date.now();
  const p = doc.profile;
  const profile: PublicProfile = {
    slug,
    businessName: p.businessName || "Business name",
    tagline: p.tagline,
    description: p.description,
    category: p.category,
    logoUrl: p.logoUrl,
    coverUrl: p.coverUrl,
    contact: {
      phone: p.phone,
      phoneLabel: p.phoneLabel?.trim() || null,
      extraPhones: p.extraPhones.filter((x) => x.label.trim() && x.number.trim()),
      whatsapp: p.whatsapp,
      email: p.email,
      website: p.website ? normalizeLink(p.website) : null,
      address: p.address,
      mapsUrl: p.mapsUrl ? normalizeLink(p.mapsUrl) : null,
      reviewsUrl: p.reviewsUrl ? normalizeLink(p.reviewsUrl) : null,
    },
    openingHours: p.openingHours,
    alwaysOpen: p.alwaysOpen,
    hoursNote: p.hoursNote,
    theme: p.theme,
    tapAction: effectiveTapAction(p),
    sections: doc.sections
      .filter((s) => s.enabled || sectionAlwaysOn(plan, s.type))
      .map((s) => ({
        type: s.type,
        title: s.title,
        items: capGallery(
          s.type,
          (s.type === "gallery" ? s.items.map(withPhotoTitle) : s.items).filter((i) => isLive(i, now) && i.title.trim()),
        )
          .map((i) => ({
            id: rowKey(i),
            title: i.title,
            description: i.description,
            price: i.price,
            imageUrl: i.imageUrl,
            linkUrl: i.linkUrl ? normalizeLink(i.linkUrl) : null,
            linkLabel: i.linkLabel,
            badge: i.badge,
            endsAt: i.endsAt,
          })),
      })),
    buttons: doc.buttons
      .filter((b) => b.enabled && b.label.trim())
      .map((b) => ({ id: rowKey(b), label: b.label, url: normalizeLink(b.url) || "#", icon: b.icon, highlighted: b.highlighted })),
    socialLinks: doc.socialLinks
      .filter((l) => l.enabled && l.url.trim())
      .map((l) => ({ id: rowKey(l), platform: l.platform, url: normalizeLink(l.url), label: l.label })),
    updatedAt: new Date().toISOString(),
  };
  return applyPlan(profile, plan);
}

/** "buttons.0.url must be…" → "Button 1: url must be…" */
export function humanizeApiError(message: string): string {
  // A full sentence from the API behind a field path ("gallery.A gallery holds…"): show just the sentence.
  const sentence = /^[\w.]+\.([A-Z].*)$/.exec(message);
  if (sentence) return sentence[1];
  const m =/^(profile\.theme|profile|theme|gallery|buttons|socialLinks|sections)\.?(\d+)?\.?(?:items\.(\d+)\.)?(\w+)?\s+(.*)$/.exec(message);
  if (!m) return message;
  const [, area, index, itemIndex, field, rest] = m;
  const label =
    area === "buttons"
      ? `Button ${Number(index) + 1}`
      : area === "socialLinks"
        ? `Social link ${Number(index) + 1}`
        : area === "sections"
          ? `Section ${Number(index) + 1}${itemIndex ? `, item ${Number(itemIndex) + 1}` : ""}`
          : area === "gallery"
            ? itemIndex
              ? `Photo ${Number(itemIndex) + 1}`
              : "Gallery"
            : area === "profile.theme" || area === "theme"
              ? "Theme"
              : "Profile";
  return `${label}: ${field ?? ""} ${rest}`.replace(/\s+/g, " ").trim();
}

export const emptyItem = (): Keyed<SectionItem> => ({
  _key: newKey(),
  title: "",
  description: null,
  price: null,
  imageUrl: null,
  linkUrl: null,
  linkLabel: null,
  badge: null,
  startsAt: null,
  endsAt: null,
  enabled: true,
});
