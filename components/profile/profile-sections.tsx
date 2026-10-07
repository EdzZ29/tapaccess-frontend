"use client";

/* eslint-disable @next/next/no-img-element -- see profile-view.tsx */

import { ArrowUpRight, ChevronLeft, ChevronRight, Globe, Mail, MapPin, Navigation, Phone, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { SECTION_META, socialLabel, VCARD_ACTION, WEEKDAYS } from "@/lib/constants";
import type { PublicProfile } from "@/lib/types";
import { cn, formatDate, mapsSearchUrl, telHref, whatsappHref } from "@/lib/utils";
import { ActionLink } from "./action-link";
import { formatTime, openStatus, useHydrated, weekdayIndex } from "./hours";
import { socialButtonStyle } from "./brand-colors";
import { GOOGLE_REVIEW_STYLE, GoogleLogo, GoogleStars, isGoogleReviewLink } from "./google";
import { BrandMark, ButtonIcon, SocialIcon } from "./icons";
import { buttonStyle, headingStyle, shapeClass } from "./theme";

type Section = PublicProfile["sections"][number];
type Item = Section["items"][number];

/** The first custom buttons are promoted into the hero; the rest stay in the Links section. */
export const HERO_BUTTON_COUNT = 2;

/** A button URL as a real href: built-in actions resolve to this card's endpoints. */
export const resolveButtonHref = (url: string, slug: string) => (url === VCARD_ACTION ? vcardHref(slug) : url);

export const vcardHref = (slug: string) => `/api/public/cards/${slug}/vcard`;

/** Phone-call links are highlighted everywhere on the card. */
export const isCallLink = (href: string) => /^tel:/i.test(href);

/**
 * The line under the business name in the header: the short description
 * (tagline), or else the first paragraph of About. `about` is what is left
 * for the About section, so nothing is shown twice.
 */
export function heroText(profile: PublicProfile): { lead: string | null; about: string | null } {
  const showsAbout = profile.sections.some((s) => s.type === "about");
  const description = showsAbout ? profile.description?.trim() || null : null;
  if (profile.tagline) return { lead: profile.tagline, about: description };
  if (!description) return { lead: null, about: null };
  const [first, ...rest] = description.split(/\n\s*\n/);
  return { lead: first.trim() || null, about: rest.join("\n\n").trim() || null };
}

/** Renders one section, or nothing when it has no content to show. */
export function ProfileSection({ section, profile }: { section: Section; profile: PublicProfile }) {
  const title = section.title || SECTION_META[section.type].defaultTitle;
  switch (section.type) {
    case "actions":
      return profile.buttons.length > HERO_BUTTON_COUNT ? <Actions profile={profile} title={title} /> : null;
    case "about": {
      const { about } = heroText(profile);
      return about ? (
        <Block title={title}>
          <p className="text-[1.05rem] leading-relaxed whitespace-pre-line" style={{ color: "var(--p-text)" }}>
            {about}
          </p>
        </Block>
      ) : null;
    }
    case "contact":
      return <Contact profile={profile} title={title} />;
    case "social":
      return profile.socialLinks.length ? <Social profile={profile} title={title} /> : null;
    case "hours":
      return profile.openingHours?.length ? <Hours profile={profile} title={title} /> : null;
    case "location":
      return profile.contact.address ? <Location profile={profile} title={title} /> : null;
    case "services":
      return section.items.length ? <Services items={section.items} title={title} /> : null;
    case "products":
      return section.items.length ? <Products items={section.items} title={title} /> : null;
    case "promotions":
      return section.items.length ? <Promotions items={section.items} title={title} /> : null;
    case "gallery":
      return section.items.some((i) => i.imageUrl) ? <Gallery items={section.items} title={title} /> : null;
    case "announcements":
      return section.items.length ? <Announcements items={section.items} title={title} /> : null;
  }
}

// ─── Building blocks ────────────────────────────────────────────────────────

function Block({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section>
      {title && (
        <h2 className="mb-5 text-[1.65rem] leading-tight" style={headingStyle}>
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

const surface = { background: "var(--p-surface)", border: "1px solid var(--p-hairline)" } as const;

function Row({
  icon,
  label,
  value,
  href,
  trackId,
  accent,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  href: string;
  trackId: string;
  accent?: boolean;
}) {
  return (
    <ActionLink href={href} kind="contact" trackId={trackId} className="flex items-center gap-4 py-4">
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
        style={accent ? { background: "var(--p-accent)", color: "var(--p-on-accent)" } : { background: "var(--p-soft)", color: "var(--p-text)" }}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.78rem]" style={{ color: "var(--p-muted)" }}>
          {label}
        </span>
        <span className="block truncate text-[1rem] font-semibold">{value}</span>
      </span>
      <ArrowUpRight className="h-5 w-5 shrink-0" style={{ color: "var(--p-muted)" }} aria-hidden />
    </ActionLink>
  );
}

function ItemLink({ item }: { item: Item }) {
  if (!item.linkUrl) return null;
  return (
    <ActionLink
      href={item.linkUrl}
      kind="item"
      trackId={item.id}
      className="mt-3 inline-flex items-center gap-1 text-[0.9rem] font-semibold underline-offset-4 hover:underline"
      style={{ color: "var(--p-text)" }}
    >
      {item.linkLabel || "Learn more"}
      <ArrowUpRight className="h-4 w-4" aria-hidden />
    </ActionLink>
  );
}

// ─── Sections ───────────────────────────────────────────────────────────────

/** Buttons after the ones promoted into the hero. */
function Actions({ profile, title }: { profile: PublicProfile; title: string }) {
  const t = profile.theme;
  return (
    <Block title={title}>
      <nav aria-label={title} className="space-y-3">
        {profile.buttons.slice(HERO_BUTTON_COUNT).map((b) => {
          const google = isGoogleReviewLink(b.url, b.label);
          return (
            <ActionLink
              key={b.id}
              href={resolveButtonHref(b.url, profile.slug)}
              kind="button"
              trackId={b.id}
              className={cn("flex min-h-16 w-full items-center gap-4 border px-5 py-3 text-left text-[1rem] font-semibold transition-transform active:scale-[0.99]", shapeClass(t))}
              style={
                google
                  ? GOOGLE_REVIEW_STYLE
                  : b.highlighted || isCallLink(b.url) || t.buttonStyle === "solid"
                    ? buttonStyle(t, b.highlighted || isCallLink(b.url))
                    : buttonStyle({ ...t, buttonStyle: "soft" })
              }
            >
              {google ? <GoogleLogo className="h-5 w-5 shrink-0" /> : <ButtonIcon name={b.icon} className="h-5 w-5 shrink-0" />}
              <span className="flex-1 text-balance">{b.label}</span>
              {google ? <GoogleStars className="shrink-0 text-sm" /> : <ArrowUpRight className="h-5 w-5 shrink-0 opacity-60" aria-hidden />}
            </ActionLink>
          );
        })}
      </nav>
    </Block>
  );
}

function Contact({ profile, title }: { profile: PublicProfile; title: string }) {
  const c = profile.contact;
  const rows = [
    c.phone && <Row key="p" icon={<Phone className="h-[18px] w-[18px]" />} label="Phone" value={c.phone} href={telHref(c.phone)} trackId="phone" accent />,
    // More numbers (Smart, Globe, landline…): each one callable, and all saved with Save contact.
    ...(c.extraPhones ?? []).map((x, i) => (
      <Row key={`x${i}`} icon={<Phone className="h-[18px] w-[18px]" />} label={x.label} value={x.number} href={telHref(x.number)} trackId="phone" />
    )),
    c.whatsapp && (
      <Row key="w" icon={<BrandMark name="whatsapp" className="h-[18px] w-[18px]" />} label="WhatsApp" value={c.whatsapp} href={whatsappHref(c.whatsapp)} trackId="whatsapp" />
    ),
    c.email && <Row key="e" icon={<Mail className="h-[18px] w-[18px]" />} label="Email" value={c.email} href={`mailto:${c.email}`} trackId="email" />,
    c.website && (
      <Row
        key="s"
        icon={<Globe className="h-[18px] w-[18px]" />}
        label="Website"
        value={c.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
        href={c.website}
        trackId="website"
      />
    ),
  ].filter(Boolean);
  if (!rows.length) return null;
  return (
    <Block title={title}>
      <div className="divide-y divide-[color:var(--p-hairline)] rounded-3xl px-5" style={surface}>
        {rows}
      </div>
    </Block>
  );
}

function Social({ profile, title }: { profile: PublicProfile; title: string }) {
  return (
    <Block title={title}>
      {/* One per row, full width, in each network's own colours. */}
      <div className="grid grid-cols-1 gap-3">
        {profile.socialLinks.map((s) => (
          <ActionLink
            key={s.id}
            href={s.url}
            kind="social"
            trackId={s.platform}
            aria-label={socialLabel(s.platform, s.label)}
            className="flex h-14 w-full min-w-0 items-center justify-center gap-3 rounded-full px-5 text-[0.95rem] font-semibold shadow-sm transition-transform active:scale-[0.98]"
            style={socialButtonStyle(s.platform)}
          >
            <SocialIcon platform={s.platform} className="h-5 w-5 shrink-0" />
            <span className="truncate">{socialLabel(s.platform, s.label)}</span>
          </ActionLink>
        ))}
      </div>
    </Block>
  );
}

function Hours({ profile, title }: { profile: PublicProfile; title: string }) {
  // "Today" and "open now" depend on the visitor's clock, so they appear
  // after hydration to keep server and client markup identical.
  const hydrated = useHydrated();
  const now = hydrated ? new Date() : null;
  const today = now ? weekdayIndex(now) : -1;
  const status = now ? openStatus(profile.openingHours, now) : null;

  return (
    <Block title={title}>
      <div className="rounded-3xl p-5" style={surface}>
        {status && (
          <p className="mb-4 flex items-center gap-2 text-[0.95rem] font-semibold">
            <span className={cn("h-2 w-2 rounded-full", status.open ? "bg-[#22c55e]" : "bg-[#ef4444]")} aria-hidden />
            {status.text}
          </p>
        )}
        <dl className="space-y-2.5 text-[0.98rem]">
          {[...profile.openingHours]
            .sort((a, b) => a.day - b.day)
            .map((h) => (
              <div key={h.day} className={cn("flex justify-between gap-4", h.day === today && "font-semibold")}>
                <dt>{WEEKDAYS[h.day]}</dt>
                <dd className="tabular-nums" style={{ color: h.day === today ? "var(--p-text)" : "var(--p-muted)" }}>
                  {h.closed ? "Closed" : `${formatTime(h.open)} – ${formatTime(h.close)}`}
                </dd>
              </div>
            ))}
        </dl>
        {profile.hoursNote && (
          <p className="mt-4 border-t pt-4 text-[0.9rem]" style={{ color: "var(--p-muted)", borderColor: "var(--p-hairline)" }}>
            {profile.hoursNote}
          </p>
        )}
      </div>
    </Block>
  );
}

function Location({ profile, title }: { profile: PublicProfile; title: string }) {
  const c = profile.contact;
  const t = profile.theme;
  return (
    <Block title={title}>
      <div className="rounded-3xl p-5" style={surface}>
        <p className="flex items-start gap-3 text-[1.05rem] leading-relaxed font-medium whitespace-pre-line">
          <MapPin className="mt-1 h-5 w-5 shrink-0" aria-hidden />
          {c.address}
        </p>
        <div className="mt-5 grid grid-cols-1 gap-3">
          <ActionLink
            href={c.mapsUrl ?? mapsSearchUrl(c.address!)}
            kind="contact"
            trackId="directions"
            className={cn("flex h-12 items-center justify-center gap-2 text-[0.92rem] font-semibold", shapeClass(t))}
            style={{ background: "var(--p-primary)", color: "var(--p-on-primary)" }}
          >
            <Navigation className="h-4 w-4" aria-hidden />
            Directions
          </ActionLink>
          {c.reviewsUrl && (
            // The field is "Google Reviews link", so it always gets the Google look.
            <ActionLink
              href={c.reviewsUrl}
              kind="contact"
              trackId="reviews"
              className={cn("flex h-12 items-center justify-center gap-2.5 border text-[0.92rem] font-semibold", shapeClass(t))}
              style={GOOGLE_REVIEW_STYLE}
            >
              <GoogleLogo className="h-[18px] w-[18px] shrink-0" />
              Review us on Google
              <GoogleStars className="text-[0.8rem]" />
            </ActionLink>
          )}
        </div>
      </div>
    </Block>
  );
}

function Services({ items, title }: { items: Item[]; title: string }) {
  return (
    <Block title={title}>
      <ul className="divide-y divide-[color:var(--p-hairline)] border-y" style={{ borderColor: "var(--p-hairline)" }}>
        {items.map((i) => (
          <li key={i.id} className="flex gap-4 py-5">
            {i.imageUrl && <img src={i.imageUrl} alt="" loading="lazy" decoding="async" className="h-16 w-16 shrink-0 rounded-2xl object-cover" />}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-[1.1rem] leading-snug font-semibold">{i.title}</h3>
                {i.price && <span className="shrink-0 text-[0.95rem] font-semibold tabular-nums">{i.price}</span>}
              </div>
              {i.description && (
                <p className="mt-1.5 text-[0.95rem] leading-relaxed whitespace-pre-line" style={{ color: "var(--p-muted)" }}>
                  {i.description}
                </p>
              )}
              <ItemLink item={i} />
            </div>
          </li>
        ))}
      </ul>
    </Block>
  );
}

function Products({ items, title }: { items: Item[]; title: string }) {
  // Without photos a product list reads best as a menu: name and price on one line.
  if (!items.some((i) => i.imageUrl)) {
    return (
      <Block title={title}>
        <ul className="divide-y divide-[color:var(--p-hairline)] rounded-3xl px-5" style={surface}>
          {items.map((i) => (
            <li key={i.id} className="py-4">
              <div className="flex items-baseline gap-3">
                <h3 className="text-[1.02rem] font-semibold">{i.title}</h3>
                {i.badge && (
                  <span className="rounded-full px-2 py-0.5 text-[0.7rem] font-semibold" style={{ background: "var(--p-accent-soft)" }}>
                    {i.badge}
                  </span>
                )}
                <span className="min-w-4 flex-1" aria-hidden />
                {i.price && <span className="shrink-0 text-[1rem] font-semibold tabular-nums">{i.price}</span>}
              </div>
              {i.description && (
                <p className="mt-1 text-[0.9rem] leading-relaxed" style={{ color: "var(--p-muted)" }}>
                  {i.description}
                </p>
              )}
              <ItemLink item={i} />
            </li>
          ))}
        </ul>
      </Block>
    );
  }

  return (
    <Block title={title}>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-6">
        {items.map((i) => (
          <li key={i.id} className="flex flex-col">
            {i.imageUrl ? (
              <img src={i.imageUrl} alt="" loading="lazy" decoding="async" className="aspect-[4/5] w-full rounded-2xl object-cover" />
            ) : (
              <div className="flex aspect-[4/5] w-full items-center justify-center rounded-2xl text-[2.5rem]" style={{ ...surface, ...headingStyle, color: "var(--p-muted)" }} aria-hidden>
                {i.title.charAt(0)}
              </div>
            )}
            <div className="mt-3 flex items-start justify-between gap-2">
              <h3 className="text-[0.98rem] leading-snug font-semibold">{i.title}</h3>
              {i.badge && (
                <span className="shrink-0 rounded-full px-2 py-0.5 text-[0.7rem] font-semibold" style={{ background: "var(--p-accent-soft)" }}>
                  {i.badge}
                </span>
              )}
            </div>
            {i.description && (
              <p className="mt-1 line-clamp-2 text-[0.85rem] leading-relaxed" style={{ color: "var(--p-muted)" }}>
                {i.description}
              </p>
            )}
            {i.price && <p className="mt-1.5 text-[0.95rem] font-semibold tabular-nums">{i.price}</p>}
            <ItemLink item={i} />
          </li>
        ))}
      </ul>
    </Block>
  );
}

function Promotions({ items, title }: { items: Item[]; title: string }) {
  return (
    <Block title={title}>
      <div className="space-y-4">
        {items.map((i) => (
          <article key={i.id} className="overflow-hidden rounded-3xl" style={{ background: "var(--p-accent-soft)", border: "1px solid var(--p-hairline)" }}>
            {i.imageUrl && <img src={i.imageUrl} alt="" loading="lazy" decoding="async" className="aspect-[16/9] w-full object-cover" />}
            <div className="p-6">
              {i.badge && (
                <span className="mb-3 inline-block rounded-full px-3 py-1 text-[0.72rem] font-bold tracking-wide uppercase" style={{ background: "var(--p-accent)", color: "var(--p-on-accent)" }}>
                  {i.badge}
                </span>
              )}
              <h3 className="text-[1.6rem] leading-tight" style={headingStyle}>
                {i.title}
              </h3>
              {i.description && <p className="mt-2 text-[0.98rem] leading-relaxed whitespace-pre-line">{i.description}</p>}
              {i.endsAt && (
                <p className="mt-3 text-[0.8rem] font-medium" style={{ color: "var(--p-muted)" }}>
                  Ends {formatDate(i.endsAt)}
                </p>
              )}
              <ItemLink item={i} />
            </div>
          </article>
        ))}
      </div>
    </Block>
  );
}

function Announcements({ items, title }: { items: Item[]; title: string }) {
  return (
    <Block title={title}>
      <ul className="space-y-3">
        {items.map((i) => (
          <li key={i.id} className="rounded-3xl p-5" style={surface}>
            <h3 className="text-[1.1rem] font-semibold">{i.title}</h3>
            {i.description && (
              <p className="mt-1.5 text-[0.95rem] leading-relaxed whitespace-pre-line" style={{ color: "var(--p-muted)" }}>
                {i.description}
              </p>
            )}
            <ItemLink item={i} />
          </li>
        ))}
      </ul>
    </Block>
  );
}

function Gallery({ items, title }: { items: Item[]; title: string }) {
  const photos = items.filter((i) => i.imageUrl);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((o) => (o === null ? o : (o + 1) % photos.length));
      if (e.key === "ArrowLeft") setOpen((o) => (o === null ? o : (o - 1 + photos.length) % photos.length));
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, photos.length]);

  return (
    <Block title={title}>
      {/* Editorial grid: the first photo runs full width. */}
      <ul className="grid grid-cols-2 gap-2">
        {photos.map((p, index) => (
          <li key={p.id} className={cn(index === 0 && photos.length !== 2 && "col-span-2")}>
            <button
              type="button"
              onClick={() => setOpen(index)}
              className={cn("block w-full overflow-hidden rounded-2xl", index === 0 && photos.length !== 2 ? "aspect-[16/10]" : "aspect-square")}
              aria-label={`Open photo ${index + 1}${p.title ? `: ${p.title}` : ""}`}
            >
              <img src={p.imageUrl!} alt={p.title} loading="lazy" decoding="async" className="h-full w-full object-cover" />
            </button>
          </li>
        ))}
      </ul>

      {open !== null && (
        <div role="dialog" aria-modal="true" aria-label="Photo viewer" className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4" onClick={() => setOpen(null)}>
          <img src={photos[open].imageUrl!} alt={photos[open].title} className="max-h-[85dvh] max-w-full rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
          <button className="absolute top-4 right-4 rounded-full bg-white/10 p-2.5 text-white" aria-label="Close" onClick={() => setOpen(null)}>
            <X className="h-6 w-6" />
          </button>
          {photos.length > 1 && (
            <>
              <button
                className="absolute left-3 rounded-full bg-white/10 p-2.5 text-white"
                aria-label="Previous photo"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen((open - 1 + photos.length) % photos.length);
                }}
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                className="absolute right-3 rounded-full bg-white/10 p-2.5 text-white"
                aria-label="Next photo"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen((open + 1) % photos.length);
                }}
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
        </div>
      )}
    </Block>
  );
}
