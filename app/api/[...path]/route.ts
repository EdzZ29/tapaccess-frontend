import { revalidateTag } from "next/cache";
import { after } from "next/server";
import { cardTag, FEATURED_TAG, getCachedVCard, getPublicProfile } from "@/lib/server-api";
import { API_URL, crossSiteReason, SLUG_RE, upstreamHeaders } from "@/lib/upstream";

/**
 * Same-origin gateway for every /api call from the dashboard (cards, media,
 * analytics, session). More specific route handlers (login, vCard, tracking)
 * take precedence over this catch-all.
 *
 * Why not a plain rewrite: the API used to check the browser's Origin against
 * one configured address, so the dashboard broke (403) whenever the site was
 * opened on another domain, tapaccess.vercel.app vs tapaccess-frontend…,
 * preview links, a new custom domain. Here the same-site check happens
 * against whatever host the request actually arrived on, and the request is
 * then forwarded with the internal key and the visitor's IP (so admin rate
 * limits are per person, not per Vercel server).
 */

const FORWARD_REQUEST_HEADERS = ["accept", "content-type", "cookie"];
const FORWARD_RESPONSE_HEADERS = ["content-type", "content-disposition", "cache-control", "location", "retry-after"];
const MAX_BODY = 9 * 1024 * 1024; // uploads are capped at 8 MB by the API

function json(status: number, message: string) {
  return Response.json({ statusCode: status, message }, { status, headers: { "cache-control": "no-store" } });
}

async function forward(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const reason = crossSiteReason(request);
  if (reason) return json(403, reason);

  const { path } = await params;
  // Only plain path segments: no "..", no encoded slashes, nothing odd.
  if (!path.every((p) => /^[\w.-]+$/.test(p) && p !== "." && p !== "..")) return json(404, "Not found");
  const target = `${API_URL}/api/${path.join("/")}${new URL(request.url).search}`;

  const headers = upstreamHeaders(request);
  for (const name of FORWARD_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  let body: ArrayBuffer | undefined;
  if (!["GET", "HEAD"].includes(request.method)) {
    const declared = Number(request.headers.get("content-length") ?? 0);
    if (declared > MAX_BODY) return json(413, "This file is too large. Images must be 8 MB or smaller.");
    body = await request.arrayBuffer();
    if (body.byteLength > MAX_BODY) return json(413, "This file is too large. Images must be 8 MB or smaller.");
  }

  // Card edits must show on the very next tap, so note which public pages
  // they touch (the slug before a rename or delete, and after).
  const cardMutation =
    (!["GET", "HEAD"].includes(request.method) && path[0] === "admin" && path[1] === "cards") ||
    // A card owner saving their own buttons and social links.
    (request.method === "PUT" && path[0] === "owner" && path[1] === "card");
  const cardId = cardMutation && /^[0-9a-f-]{36}$/i.test(path[2] ?? "") ? path[2] : null;
  const slugBefore = cardId && ["PATCH", "DELETE"].includes(request.method) ? await currentSlug(cardId, headers) : null;

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      redirect: "manual",
      // Generous: a sleeping Render free instance can take ~50 s to wake up.
      signal: AbortSignal.timeout(60_000),
    });
  } catch {
    return json(503, "The server is unreachable or still waking up. Please try again in a moment.");
  }

  const out = new Headers();
  for (const name of FORWARD_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) out.set(name, value);
  }
  for (const cookie of upstream.headers.getSetCookie()) out.append("set-cookie", cookie);
  if (!out.has("cache-control")) out.set("cache-control", "no-store");

  // An owner leaving or updating their review: the homepage shows it at once.
  if (request.method === "POST" && path[0] === "public" && path[1] === "reviews" && upstream.ok) {
    revalidateTag(FEATURED_TAG, { expire: 0 });
  }

  if (cardMutation && upstream.ok) {
    // Buffer the (small) JSON reply to learn the card's slug after the change.
    const text = await upstream.text();
    let slugAfter: string | null = null;
    try {
      slugAfter = (JSON.parse(text) as { slug?: unknown }).slug as string | null;
    } catch {
      // 204 / non-JSON reply (delete): only the old slug is affected.
    }
    refreshPublicCards([slugBefore, typeof slugAfter === "string" ? slugAfter : null]);
    return new Response(text || null, { status: upstream.status, headers: out });
  }

  return new Response(request.method === "HEAD" ? null : upstream.body, { status: upstream.status, headers: out });
}

/** The card's current slug, read just before a rename or delete. */
async function currentSlug(id: string, headers: Headers): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/api/admin/cards/${id}`, { headers, cache: "no-store", signal: AbortSignal.timeout(15_000) });
    return res.ok ? (((await res.json()) as { slug?: string }).slug ?? null) : null;
  } catch {
    return null;
  }
}

/**
 * Drops the cached public page and vCard of each affected card, then loads
 * them again in the background (the API is awake right now), so the next
 * tap is instant and already shows the change.
 */
function refreshPublicCards(slugs: (string | null)[]) {
  const unique = [...new Set(slugs.filter((s): s is string => !!s && SLUG_RE.test(s)))];
  // Names, logos, status and the homepage switch all feed the homepage list.
  revalidateTag(FEATURED_TAG, { expire: 0 });
  for (const slug of unique) revalidateTag(cardTag(slug), { expire: 0 });
  if (unique.length === 0) return;
  // Started now (inside the request, where the data cache is writable),
  // finished after the response is sent.
  const refills = unique.flatMap((slug) => [getPublicProfile(slug), getCachedVCard(slug)]);
  after(() => Promise.allSettled(refills));
}

export const GET = forward;
export const HEAD = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;

// Large bodies (image uploads) and slow cold starts need room.
export const maxDuration = 60;
