import "server-only";
import { envUrl } from "./env-url";

export const API_URL = envUrl(process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL, "http://localhost:4000");

export const SLUG_RE = /^[a-z0-9-]{1,64}$/;

/**
 * The visitor's IP as seen by this server. On Vercel, `x-forwarded-for` and
 * `x-real-ip` are set by the platform (client-supplied values are
 * overwritten), so they can be trusted there.
 */
function visitorIp(request: Request): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || undefined;
}

/** Origin of this site as the visitor reached it (any domain the deployment is served on). */
export function siteOrigin(request: Request): string {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? new URL(request.url).host;
  const proto = request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.replace(":", "");
  return `${proto}://${host}`;
}

/**
 * CSRF check for state-changing requests arriving at this site: the browser
 * must say the request came from a page on this same site. Works on any
 * domain (vercel.app, previews, custom) because it compares against the host
 * the request was sent to, not a configured list. Returns a reason when the
 * request must be refused.
 */
export function crossSiteReason(request: Request): string | null {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return null;
  // Modern browsers label every request; anything not from our own pages is refused.
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") return "Request did not come from this website";
  const origin = request.headers.get("origin");
  if (origin) {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? new URL(request.url).host;
    try {
      if (new URL(origin).host !== host) return "Request did not come from this website";
    } catch {
      return "Invalid Origin header";
    }
  }
  return null;
}

/**
 * Headers for calls to the API on a visitor's behalf. The internal key lets
 * the API trust the forwarded IP, so rate limits and visit de-duplication
 * work per visitor instead of treating everyone as this server.
 */
export function upstreamHeaders(request: Request, extra: Record<string, string> = {}): Headers {
  const headers = new Headers(extra);
  const ua = request.headers.get("user-agent");
  if (ua) headers.set("user-agent", ua);
  if (process.env.INTERNAL_API_KEY) {
    headers.set("x-tapaccess-internal-key", process.env.INTERNAL_API_KEY);
    const ip = visitorIp(request);
    if (ip) headers.set("x-tapaccess-client-ip", ip);
    // The address the visitor actually used, for links in vCards etc.
    headers.set("x-tapaccess-site-url", siteOrigin(request));
  }
  return headers;
}
