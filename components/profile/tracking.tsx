"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import type { ClickKind } from "@/lib/types";

/**
 * Visit and click tracking for public profiles.
 *
 * Runs in the browser on purpose: crawlers and link-preview bots that do not
 * execute JavaScript never send a visit, which removes most bot traffic
 * before the API's user-agent filter even sees it. Nothing is stored in the
 * browser (no cookies, no localStorage); de-duplication happens server-side
 * with a daily-rotating hash.
 */

/**
 * Beacons go to this site's own route handlers (app/api/public/cards/...),
 * which forward them to the API with the visitor's IP.
 */
function send(path: string, body: unknown) {
  const url = `/api/public/cards/${path}`;
  const json = JSON.stringify(body);
  try {
    // sendBeacon survives navigation away (tel:, external links).
    if (navigator.sendBeacon?.(url, new Blob([json], { type: "application/json" }))) return;
    void fetch(url, {
      method: "POST",
      keepalive: true,
      credentials: "omit",
      headers: { "Content-Type": "application/json" },
      body: json,
    }).catch(() => undefined);
  } catch {
    // Analytics must never break the page.
  }
}

const isAutomated = () => typeof navigator !== "undefined" && navigator.webdriver === true;

interface TrackingValue {
  /** Editor preview: no tracking, links open in a new tab. */
  preview: boolean;
  slug: string;
  track: (kind: ClickKind, idOrTarget: string) => void;
}

const TrackingContext = createContext<TrackingValue>({ preview: true, slug: "", track: () => undefined });

export const useTracking = () => useContext(TrackingContext);

const sentVisits = new Set<string>();

export function TrackingProvider({
  slug,
  preview,
  trackVisits,
  children,
}: {
  slug: string;
  preview: boolean;
  trackVisits: boolean;
  children: ReactNode;
}) {
  const enabled = !preview && trackVisits;

  useEffect(() => {
    // Guard against React Strict Mode's double effect in development.
    if (!enabled || isAutomated() || sentVisits.has(slug)) return;
    sentVisits.add(slug);
    send(`${slug}/visits`, { referrer: document.referrer || undefined });
  }, [enabled, slug]);

  const track = (kind: ClickKind, idOrTarget: string) => {
    if (!enabled || isAutomated()) return;
    const body = kind === "button" || kind === "item" ? { kind, id: idOrTarget } : { kind, target: idOrTarget };
    send(`${slug}/clicks`, body);
  };

  return <TrackingContext.Provider value={{ preview, slug, track }}>{children}</TrackingContext.Provider>;
}
