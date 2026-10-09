"use client";

/* eslint-disable @next/next/no-img-element -- see profile-view.tsx */

import { Phone, UserPlus } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { PublicProfile, TapAction } from "@/lib/types";
import { cn, initials, telHref } from "@/lib/utils";
import { ActionLink, saveContact } from "./action-link";
import { detectDevice } from "./device";
import { useHydrated } from "./hours";
import { vcardHref } from "./profile-sections";
import { backgroundStyle, buttonStyle, headingStyle, shapeClass } from "./theme";
import { useTracking } from "./tracking";

const noop = () => () => undefined;

/**
 * True when this page load is a fresh visit (a card tap, a link) rather than
 * a reload or Back. Only fresh visits get the tap screen and the automatic
 * action, so returning from the dialer or Contacts lands on the profile.
 */
function isFreshVisit() {
  try {
    const [nav] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    return !nav || nav.type === "navigate";
  } catch {
    return true;
  }
}

/** Automatic actions already started in this document (survives Strict Mode re-runs). */
const started = new Set<string>();

/**
 * The screen a card tap opens on when the card is set to "Save contact" or
 * "Call". On phones it starts the action by itself: iPhone shows the
 * add-contact card, Android downloads the contact, and the dialer opens where
 * the browser allows it. Browsers never complete either step without the
 * visitor's confirmation, and some (Chrome) block opening the dialer without
 * a tap, so the big button is always there as the one-tap fallback.
 */
export function TapSheet({ profile, embedded }: { profile: PublicProfile; embedded: boolean }) {
  const { preview, slug } = useTracking();
  const hydrated = useHydrated();
  const fresh = useSyncExternalStore(noop, isFreshVisit, () => true);
  const [closedFor, setClosedFor] = useState<TapAction | null>(null);
  const primaryRef = useRef<HTMLAnchorElement>(null);

  const action = profile.tapAction ?? "profile";
  const phone = profile.contact.phone;
  const open = action !== "profile" && closedFor !== action && (preview || fresh) && (action !== "call" || Boolean(phone));

  useEffect(() => {
    if (!open || preview || navigator.webdriver) return;
    const key = `${slug}:${action}`;
    if (started.has(key)) return;
    // A short pause lets the screen paint first, so the visitor sees what's happening.
    const timer = window.setTimeout(() => {
      if (started.has(key)) return;
      started.add(key);
      const device = detectDevice();
      if (device.inApp) return; // The sheet explains how to open the browser instead.
      if (action === "save_contact" && device.mobile) saveContact(vcardHref(slug));
      if (action === "call" && phone && device.phone) window.location.assign(telHref(phone));
    }, 400);
    return () => window.clearTimeout(timer);
  }, [open, preview, slug, action, phone]);

  useEffect(() => {
    if (!open) return;
    if (!preview) primaryRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setClosedFor(action);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, preview, action]);

  if (!open) return null;

  const t = profile.theme;
  const call = action === "call";
  const device = hydrated ? detectDevice() : null;
  const hint = call
    ? "Your phone asks you to confirm before it calls."
    : device?.inApp
      ? "In the Facebook, Instagram or Messenger app? Tap ⋯ and choose “Open in browser” first."
      : device?.ios
        ? "Then tap “Create New Contact” to save."
        : device?.android
          ? "Then tap “Open” on the download to add it to your contacts."
          : "Adds our details to your contacts.";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tap-sheet-title"
      className={cn(
        "inset-0 z-50 flex flex-col items-center overflow-y-auto overscroll-contain px-6 text-center",
        embedded ? "absolute justify-start pt-24 pb-10" : "fixed justify-center py-[max(env(safe-area-inset-top),2.5rem)]",
      )}
      style={{ ...backgroundStyle(t), color: "var(--p-text)" }}
    >
      <div className="flex w-full max-w-sm flex-col items-center">
        {profile.logoUrl ? (
          <img src={profile.logoUrl} alt="" width={80} height={80} className="h-20 w-20 rounded-3xl object-cover" />
        ) : (
          <span
            aria-hidden
            className="flex h-20 w-20 items-center justify-center rounded-3xl text-2xl font-bold"
            style={{ background: "var(--p-primary)", color: "var(--p-on-primary)" }}
          >
            {initials(profile.businessName)}
          </span>
        )}

        <h2 id="tap-sheet-title" className="mt-6 text-[2rem] leading-tight text-balance" style={headingStyle}>
          {profile.businessName}
        </h2>
        <p className="mt-2 text-[1.05rem]" style={{ color: "var(--p-muted)" }}>
          {call ? phone : "Save our contact details to your phone"}
        </p>

        <ActionLink
          ref={primaryRef}
          href={call && phone ? telHref(phone) : vcardHref(slug)}
          kind="contact"
          trackId={call ? "phone" : "vcard"}
          className={cn(
            "p-btn mt-10 flex h-16 w-full items-center border justify-center gap-3 text-lg font-semibold transition-transform outline-offset-4 active:scale-[0.98]",
            shapeClass(t),
          )}
          style={buttonStyle(t, true)}
        >
          {call ? <Phone className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
          {call ? "Call now" : "Save contact"}
        </ActionLink>
        <p className="mt-3 text-sm text-pretty" style={{ color: "var(--p-muted)" }}>
          {hint}
        </p>

        <button
          type="button"
          onClick={() => setClosedFor(action)}
          className={cn("mt-8 h-12 w-full border text-[0.95rem] font-semibold transition-transform active:scale-[0.98]", shapeClass(t))}
          style={{ borderColor: "var(--p-border)", background: "var(--p-surface)", color: "var(--p-text)" }}
        >
          View profile
        </button>
      </div>
    </div>
  );
}
