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
  }
  return headers;
}
