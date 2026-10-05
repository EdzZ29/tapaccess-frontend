import "server-only";
import { cache } from "react";
import { envUrl } from "./env-url";
import type { PublicProfile } from "./types";

const API_URL = envUrl(process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL, "http://localhost:4000");

export type ProfileResult =
  | { kind: "ok"; profile: PublicProfile }
  | { kind: "not-found" }
  | { kind: "unavailable" }
  | { kind: "error"; status: number };

/**
 * Fetches a published profile for server rendering. Always fresh
 * (`no-store`) so edits and deactivations take effect on the next tap.
 * Wrapped in `cache` so generateMetadata and the page share one request.
 */
export const getPublicProfile = cache(async (slug: string): Promise<ProfileResult> => {
  if (!/^[a-z0-9-]{1,64}$/.test(slug)) return { kind: "not-found" };

  const headers: Record<string, string> = { Accept: "application/json" };
  if (process.env.INTERNAL_API_KEY) headers["x-tapaccess-internal-key"] = process.env.INTERNAL_API_KEY;

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/public/cards/${slug}`, {
      headers,
      cache: "no-store",
      // Generous: a sleeping Render free instance can take ~50 s to wake up;
      // meanwhile the visitor sees the loading skeleton.
      signal: AbortSignal.timeout(55_000),
    });
  } catch {
    return { kind: "error", status: 503 };
  }

  if (res.ok) return { kind: "ok", profile: (await res.json()) as PublicProfile };
  if (res.status === 404) return { kind: "not-found" };
  if (res.status === 403) return { kind: "unavailable" };
  return { kind: "error", status: res.status };
});
