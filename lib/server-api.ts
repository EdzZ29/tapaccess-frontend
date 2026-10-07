import "server-only";
import { cache } from "react";
import { envUrl } from "./env-url";
import { SITE_URL } from "./utils";
import type { PublicProfile } from "./types";

const API_URL = envUrl(process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL, "http://localhost:4000");
const SLUG = /^[a-z0-9-]{1,64}$/;

export type ProfileResult =
  | { kind: "ok"; profile: PublicProfile }
  /** An old address of a card that has since changed its slug. */
  | { kind: "moved"; slug: string }
  | { kind: "not-found" }
  | { kind: "unavailable" }
  | { kind: "error"; status: number };

/** Cache tag for one card's public data (profile + vCard). */
export const cardTag = (slug: string) => `card:${slug}`;

/**
 * How long a cached card counts as fresh. After that the next tap still gets
 * the cached copy instantly while a fresh one loads in the background
 * (stale-while-revalidate), so visitors never wait for the API. Admin edits
 * don't wait for this: the dashboard gateway clears the card's tag at once.
 *
 * Cached in Next's data cache by URL + headers (not by function source, so
 * the page, the vCard route and the dashboard gateway share entries). Only
 * 200 responses are stored: "not found", "inactive" and errors are always
 * asked fresh, so an outage is never remembered.
 */
const cached = (slug: string) => ({ revalidate: 300, tags: [cardTag(slug)] });

function apiHeaders(accept: string): Record<string, string> {
  const headers: Record<string, string> = { Accept: accept };
  if (process.env.INTERNAL_API_KEY) headers["x-tapaccess-internal-key"] = process.env.INTERNAL_API_KEY;
  return headers;
}

/**
 * A card's public profile for server rendering.
 * Wrapped in React `cache` so metadata and the page share one lookup.
 */
export const getPublicProfile = cache(async (slug: string): Promise<ProfileResult> => {
  if (!SLUG.test(slug)) return { kind: "not-found" };

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/public/cards/${slug}`, {
      headers: apiHeaders("application/json"),
      next: cached(slug),
      // Generous: a sleeping Render instance can take ~50 s to wake up;
      // meanwhile the visitor sees the loading skeleton.
      signal: AbortSignal.timeout(55_000),
    });
  } catch {
    return { kind: "error", status: 503 };
  }

  if (res.ok) {
    const body = (await res.json()) as PublicProfile | { movedTo: string };
    if ("movedTo" in body) return SLUG.test(body.movedTo) ? { kind: "moved", slug: body.movedTo } : { kind: "not-found" };
    return { kind: "ok", profile: body };
  }
  if (res.status === 404) return { kind: "not-found" };
  if (res.status === 403) return { kind: "unavailable" };
  return { kind: "error", status: res.status };
});

export interface CachedVCard {
  body: string;
  contentType: string;
  disposition: string;
}

/**
 * The card's vCard, cached like the profile so "Save contact" is instant
 * too. It links back to the profile on the site's main address (SITE_URL),
 * the same address written on the cards.
 */
export async function getCachedVCard(slug: string): Promise<CachedVCard | null> {
  if (!SLUG.test(slug)) return null;
  try {
    const res = await fetch(`${API_URL}/api/public/cards/${slug}/vcard`, {
      headers: { ...apiHeaders("text/vcard"), "x-tapaccess-site-url": SITE_URL },
      next: cached(slug),
      signal: AbortSignal.timeout(45_000),
    });
    if (!res.ok) return null;
    return {
      body: await res.text(),
      contentType: res.headers.get("content-type") ?? "text/vcard; charset=utf-8",
      disposition: res.headers.get("content-disposition") ?? 'attachment; filename="contact.vcf"',
    };
  } catch {
    return null;
  }
}
