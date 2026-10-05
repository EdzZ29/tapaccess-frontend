import { API_URL, SLUG_RE, upstreamHeaders } from "@/lib/upstream";

/**
 * "Save contact": streams the card's vCard from the API. Handled here rather
 * than by the /api rewrite so the API sees the visitor's IP (per-visitor
 * rate limit) instead of all visitors sharing this server's address.
 */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Anything unusual sends the visitor to the profile page, which explains
  // "not found" / "unavailable" in plain words instead of showing raw JSON.
  const profilePage = new URL(`/c/${SLUG_RE.test(slug) ? slug : ""}`, request.url);
  if (!SLUG_RE.test(slug)) return Response.redirect(profilePage, 303);

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/api/public/cards/${slug}/vcard`, {
      headers: upstreamHeaders(request),
      cache: "no-store",
      signal: AbortSignal.timeout(45_000),
    });
  } catch {
    return Response.redirect(profilePage, 303);
  }
  if (!upstream.ok) return Response.redirect(profilePage, 303);

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "text/vcard; charset=utf-8",
      "Content-Disposition": upstream.headers.get("content-disposition") ?? 'attachment; filename="contact.vcf"',
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export const maxDuration = 60;
