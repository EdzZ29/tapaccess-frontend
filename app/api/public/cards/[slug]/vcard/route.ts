import { API_URL, SLUG_RE, upstreamHeaders } from "@/lib/upstream";

const IOS = /iPhone|iPad|iPod/;

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

  // iPhone/iPad Safari shows an *inline* vCard as the "Create New Contact"
  // card, one tap from saved; as an attachment it would only offer a
  // download into Files. Android and desktops get a normal download.
  // (iPadOS claims to be a Mac, so the page also asks with ?inline=1.)
  const disposition = upstream.headers.get("content-disposition") ?? 'attachment; filename="contact.vcf"';
  const inline = new URL(request.url).searchParams.get("inline") === "1" || IOS.test(request.headers.get("user-agent") ?? "");

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "text/vcard; charset=utf-8",
      "Content-Disposition": inline ? disposition.replace(/^\s*attachment/i, "inline") : disposition,
      Vary: "User-Agent",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export const maxDuration = 60;
