import "server-only";
import { API_URL, SLUG_RE, upstreamHeaders } from "./upstream";

const MAX_BODY = 4096;

/**
 * Forwards a visit/click beacon to the API with the visitor's IP. Analytics
 * must never surface errors to visitors, so failures answer 202 quietly.
 */
export async function forwardTracking(request: Request, slug: string, kind: "visits" | "clicks"): Promise<Response> {
  if (!SLUG_RE.test(slug)) return new Response(null, { status: 404 });
  const body = await request.text();
  if (body.length > MAX_BODY) return new Response(null, { status: 413 });

  try {
    const upstream = await fetch(`${API_URL}/api/public/cards/${slug}/${kind}`, {
      method: "POST",
      headers: upstreamHeaders(request, { "content-type": "application/json" }),
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  } catch {
    return new Response(null, { status: 202 });
  }
}
