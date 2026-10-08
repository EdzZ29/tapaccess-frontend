"use client";

/* eslint-disable @next/next/no-img-element -- images are pre-sized WebP from our upload pipeline; next/image would need per-host config for every storage provider */

import { UserPlus } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import type { PublicProfile, SocialPlatform } from "@/lib/types";
import { cn, initials, mapsSearchUrl, telHref } from "@/lib/utils";
import { ActionLink } from "./action-link";
import { CardMenu } from "./card-menu";
import { GOOGLE_REVIEW_STYLE, GoogleLogo, isGoogleReviewLink } from "./google";
import { openStatus, useHydrated } from "./hours";
import { socialButtonStyle } from "./brand-colors";
import { ButtonIcon } from "./icons";
import { HERO_BUTTON_COUNT, heroText, isCallLink, ProfileSection, resolveButtonHref, vcardHref } from "./profile-sections";
import { TapSheet } from "./tap-sheet";
import { backgroundStyle, buttonStyle, headingStyle, HIGHLIGHT, shapeClass, themeVars } from "./theme";
import { TrackingProvider, useTracking } from "./tracking";

interface ProfileViewProps {
  profile: PublicProfile;
  /** `preview` disables tracking and the vCard download (editor live preview). */
  mode?: "live" | "preview";
  trackVisits?: boolean;
  /** Fill the parent instead of the viewport (editor phone frame). */
  embedded?: boolean;
}

const hasSection = (p: PublicProfile, type: PublicProfile["sections"][number]["type"]) => p.sections.some((s) => s.type === type);

export function ProfileView({ profile, mode = "live", trackVisits = true, embedded = false }: ProfileViewProps) {
  const t = profile.theme;
  return (
    <TrackingProvider slug={profile.slug} preview={mode === "preview"} trackVisits={trackVisits}>
      <div style={{ ...themeVars(t), ...backgroundStyle(t) }} className={cn(
          // overflow-wrap:anywhere lets an unbroken word (a long name, URL or
          // typo-run) wrap instead of running off the screen.
          "@container relative w-full antialiased [overflow-wrap:anywhere]",
          embedded ? "min-h-full" : "min-h-dvh",
        )}
      >
        <div className="relative mx-auto flex w-full max-w-[520px] flex-col @[620px]:pt-6">
          <Hero profile={profile} />
          <div className="space-y-12 px-6 pt-12 pb-6">
            {profile.sections.map((section) => (
              <ProfileSection key={section.type} section={section} profile={profile} />
            ))}
          </div>
          <footer className="px-6 pt-6 pb-8 text-center text-xs" style={{ color: "var(--p-muted)" }}>
            <span className="mx-auto mb-5 block h-px w-16" style={{ background: "linear-gradient(90deg, transparent, var(--p-border), transparent)" }} aria-hidden />
            Powered by <span className="font-semibold tracking-wide">TapAccess</span>
            {" · "}
            <a href="/privacy" className="underline-offset-2 hover:underline">
              Privacy
            </a>
          </footer>
          <ActionBar profile={profile} />
        </div>
        <TapSheet profile={profile} embedded={embedded} />
      </div>
    </TrackingProvider>
  );
}

// ─── Hero ───────────────────────────────────────────────────────────────────

function Hero({ profile }: { profile: PublicProfile }) {
  const t = profile.theme;
  const photo = t.layout !== "minimal" && profile.coverUrl ? profile.coverUrl : null;
  const centered = t.layout === "centered";
  const { lead } = heroText(profile);
  const heroButtons = heroActions(profile);

  // Over a photo everything is white on a flat dark tint; otherwise the theme colours.
  const ink: CSSProperties = photo ? { color: "#ffffff" } : { color: "var(--p-text)" };
  const muted = photo ? "rgba(255,255,255,0.74)" : "var(--p-muted)";

  return (
    <header
      className={cn("relative isolate flex flex-col overflow-hidden", photo && "@[620px]:rounded-[28px]")}
      style={ink}
    >
      {photo && (
        <>
          <img src={photo} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" fetchPriority="high" decoding="async" />
          {/* Darker at the top bar and behind the text, then melting into the page so there is no seam. */}
          <div
            className="absolute inset-0 -z-10"
            style={{
              background:
                "linear-gradient(180deg, rgb(0 0 0 / 0.62) 0%, rgb(0 0 0 / 0.5) 38%, rgb(0 0 0 / 0.66) 72%, color-mix(in srgb, var(--p-bg) 92%, transparent) 94%, var(--p-bg) 100%)",
            }}
            aria-hidden
          />
          <div
            className="absolute inset-0 -z-10"
            style={{ background: "radial-gradient(120% 70% at 50% 0%, transparent 40%, rgb(0 0 0 / 0.35) 100%)" }}
            aria-hidden
          />
        </>
      )}

      <TopBar profile={profile} onPhoto={Boolean(photo)} />

      <div className={cn("flex flex-1 flex-col px-6 pt-14 pb-10", centered && "items-center text-center")}>
        {profile.category && (
          <p
            className={cn("p-rise mb-5 flex items-center gap-3 text-[0.72rem] font-semibold tracking-[0.28em] uppercase", centered && "justify-center")}
            style={{ color: muted }}
          >
            <span className="h-px w-8" style={{ background: "linear-gradient(90deg, transparent, var(--p-accent))" }} aria-hidden />
            {profile.category}
            {centered && <span className="h-px w-8" style={{ background: "linear-gradient(90deg, var(--p-accent), transparent)" }} aria-hidden />}
          </p>
        )}

        <h1
          className="p-rise leading-[0.98] text-balance"
          style={{
            ...headingStyle,
            // Scales with the card width; long names step down so the hero stays a few bold lines.
            fontSize: profile.businessName.length > 30 ? "min(10cqw, 2.9rem)" : "min(13cqw, 3.6rem)",
            textShadow: photo ? "0 2px 24px rgb(0 0 0 / 0.45)" : undefined,
            animationDelay: "80ms",
          }}
        >
          {profile.businessName}
        </h1>

        {lead && (
          <p className="p-rise mt-5 w-full max-w-[34ch] text-[1.05rem] leading-relaxed text-pretty" style={{ color: muted, animationDelay: "160ms" }}>
            {lead}
          </p>
        )}

        {heroButtons.length > 0 && (
          <div className={cn("p-rise mt-8 grid w-full gap-3", heroButtons.length > 1 ? "grid-cols-2" : "grid-cols-1")} style={{ animationDelay: "240ms" }}>
            {heroButtons.map((b, i) => {
              const google = isGoogleReviewLink(b.href, b.label);
              return (
              <ActionLink
                key={b.key}
                href={b.href}
                kind={b.kind}
                trackId={b.trackId}
                className={cn(
                  "flex min-h-14 items-center justify-center gap-2.5 border px-4 py-3 text-center text-[0.95rem] leading-tight font-semibold transition-transform active:scale-[0.98]",
                  shapeClass(t),
                )}
                style={
                  google
                    ? GOOGLE_REVIEW_STYLE
                    : b.kind === "social"
                      ? socialButtonStyle(b.trackId as SocialPlatform)
                      : heroButtonStyle(i === 0, Boolean(photo), t, b.highlighted)
                }
              >
                {google ? <GoogleLogo className="h-[18px] w-[18px] shrink-0" /> : <ButtonIcon name={b.icon} className="h-[18px] w-[18px] shrink-0" />}
                <span className="line-clamp-2 text-balance">{b.label}</span>
              </ActionLink>
              );
            })}
          </div>
        )}

        <Facts profile={profile} muted={muted} onPhoto={Boolean(photo)} centered={centered} />
      </div>
    </header>
  );
}

interface HeroAction {
  key: string;
  href: string;
  label: string;
  icon: string;
  kind: "button" | "contact" | "social";
  trackId: string;
  highlighted: boolean;
}

/**
 * The two big header buttons: the card's first custom buttons, topped up
 * with Call and Facebook when there are fewer than two, so every card leads
 * with clear actions like "Call to Book / Visit Facebook". A call button is
 * always highlighted and placed first, it's the action that books clients.
 */
function heroActions(profile: PublicProfile): HeroAction[] {
  const actions: HeroAction[] = hasSection(profile, "actions")
    ? profile.buttons.slice(0, HERO_BUTTON_COUNT).map((b) => ({
        key: b.id,
        href: resolveButtonHref(b.url, profile.slug),
        label: b.label,
        icon: b.icon,
        kind: "button",
        trackId: b.id,
        highlighted: b.highlighted || isCallLink(b.url),
      }))
    : [];
  const phone = profile.contact.phone;
  if (actions.length < HERO_BUTTON_COUNT && phone && !actions.some((a) => isCallLink(a.href))) {
    actions.push({ key: "call", href: telHref(phone), label: "Call to Book", icon: "phone", kind: "contact", trackId: "phone", highlighted: true });
  }
  const facebook = profile.socialLinks.find((l) => l.platform === "facebook");
  if (actions.length < HERO_BUTTON_COUNT && facebook && !actions.some((a) => a.href === facebook.url)) {
    actions.push({ key: "facebook", href: facebook.url, label: "Visit Facebook", icon: "facebook", kind: "social", trackId: "facebook", highlighted: false });
  }
  // Stable sort: call first, everything else keeps the admin's order.
  return actions.sort((a, b) => Number(isCallLink(b.href)) - Number(isCallLink(a.href)));
}

function heroButtonStyle(primary: boolean, onPhoto: boolean, t: PublicProfile["theme"], highlighted: boolean): CSSProperties {
  if (highlighted) return HIGHLIGHT;
  if (onPhoto) {
    return primary
      ? { background: "#ffffff", color: "#111111", borderColor: "transparent" }
      : { background: "rgba(255,255,255,0.08)", color: "#ffffff", borderColor: "rgba(255,255,255,0.45)", backdropFilter: "blur(10px)" };
  }
  if (primary) return buttonStyle({ ...t, buttonStyle: "solid" }, highlighted);
  return { background: "transparent", color: "var(--p-text)", borderColor: "var(--p-text)" };
}

function TopBar({ profile, onPhoto }: { profile: PublicProfile; onPhoto: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 pt-[max(env(safe-area-inset-top),1.5rem)]">
      <div className="flex min-w-0 items-center gap-3">
        {profile.logoUrl ? (
          <img
            src={profile.logoUrl}
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-xl object-cover"
            style={{ boxShadow: "0 6px 20px -6px rgb(0 0 0 / 0.5)" }}
          />
        ) : (
          <span
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
            style={onPhoto ? { background: "#ffffff", color: "#111111" } : { background: "var(--p-primary)", color: "var(--p-on-primary)" }}
          >
            {initials(profile.businessName)}
          </span>
        )}
        <span className="truncate text-[0.8rem] font-semibold tracking-[0.24em] uppercase">{profile.businessName}</span>
      </div>
      <CardMenu profile={profile} onPhoto={onPhoto} />
    </div>
  );
}

/** Short facts under the CTAs, like the "Established / Clinic / Contact" row. */
function Facts({ profile, muted, onPhoto, centered }: { profile: PublicProfile; muted: string; onPhoto: boolean; centered: boolean }) {
  const hydrated = useHydrated();
  const c = profile.contact;
  const facts: { key: string; label: string; value: ReactNode; href?: string; trackId?: string }[] = [];

  if (hasSection(profile, "hours") && profile.openingHours?.length) {
    const status = hydrated ? openStatus(profile.openingHours, new Date()) : null;
    facts.push({
      key: "hours",
      label: "Today",
      value: status ? (
        <span className="inline-flex items-center gap-2">
          <span className={cn("h-1.5 w-1.5 rounded-full", status.open ? "bg-[#22c55e]" : "bg-[#ef4444]")} aria-hidden />
          {status.text}
        </span>
      ) : (
        "See opening hours"
      ),
    });
  }
  if ((hasSection(profile, "location") || hasSection(profile, "contact")) && c.address) {
    facts.push({
      key: "location",
      label: "Location",
      value: c.address.split(/\n|,/).slice(0, 2).join(",").trim(),
      href: c.mapsUrl ?? mapsSearchUrl(c.address),
      trackId: "directions",
    });
  }
  // Phone, WhatsApp and email are not repeated here: Quick Actions lists them.

  const shown = facts.slice(0, 4);
  if (shown.length === 0) return null;

  return (
    <dl
      className={cn("p-rise mt-8 grid w-full grid-cols-2 gap-x-6 gap-y-5 rounded-2xl border px-5 py-4", centered ? "text-center" : "text-left")}
      style={
        onPhoto
          ? {
              animationDelay: "320ms",
              background: "rgb(255 255 255 / 0.07)",
              borderColor: "rgb(255 255 255 / 0.14)",
              boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.1)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
            }
          : { animationDelay: "320ms", background: "var(--p-soft)", borderColor: "var(--p-hairline)" }
      }
    >
      {shown.map((f) => (
        <div key={f.key} className="min-w-0">
          <dt className="text-[0.7rem] font-semibold tracking-[0.16em] uppercase" style={{ color: muted }}>
            {f.label}
          </dt>
          <dd className="mt-1 truncate text-[0.95rem] font-semibold">
            {f.href ? (
              <ActionLink href={f.href} kind="contact" trackId={f.trackId!} className="underline-offset-4 hover:underline">
                {f.value}
              </ActionLink>
            ) : (
              f.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// ─── Sticky action bar ──────────────────────────────────────────────────────

/** The bar pinned to the bottom of the card: one full-width Save contact button. */
function ActionBar({ profile }: { profile: PublicProfile }) {
  const { slug } = useTracking();
  const c = profile.contact;
  const canSave = Boolean(c.phone || c.email || c.whatsapp || c.extraPhones?.length);
  if (!canSave) return null;

  return (
    <div
      className="sticky bottom-0 z-20 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.875rem)]"
      style={{
        background: "color-mix(in srgb, var(--p-bg) 82%, transparent)",
        boxShadow: "0 -1px 0 var(--p-hairline)",
        backdropFilter: "blur(18px) saturate(140%)",
        WebkitBackdropFilter: "blur(18px) saturate(140%)",
      }}
    >
      <ActionLink
        href={vcardHref(slug)}
        kind="contact"
        trackId="vcard"
        className={cn(
          "flex h-[52px] w-full items-center justify-center gap-2 text-[0.95rem] font-semibold tracking-[0.01em] transition-transform active:scale-[0.98]",
          shapeClass(profile.theme),
        )}
        style={HIGHLIGHT}
      >
        <UserPlus className="h-[18px] w-[18px]" />
        Save contact
      </ActionLink>
    </div>
  );
}
