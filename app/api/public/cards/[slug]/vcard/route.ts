import { getCachedVCard } from "@/lib/server-api";
import { SLUG_RE } from "@/lib/upstream";

const IOS = /iPhone|iPad|iPod/;

/**
 * "Save contact": the card's vCard, served from the data cache so it opens
 * instantly even when the API is asleep (see getCachedVCard).
 */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Anything unusual sends the visitor to the profile page, which explains
  // "not found" / "unavailable" in plain words instead of showing raw JSON.
  const profilePage = new URL(`/c/${SLUG_RE.test(slug) ? slug : ""}`, request.url);
  if (!SLUG_RE.test(slug)) return Response.redirect(profilePage, 303);

  const vcard = await getCachedVCard(slug);
  if (!vcard) return Response.redirect(profilePage, 303);

  // iPhone/iPad Safari shows an *inline* vCard as the "Create New Contact"
  // card, one tap from saved; as an attachment it would only offer a
  // download into Files. Android and desktops get a normal download.
  // (iPadOS claims to be a Mac, so the page also asks with ?inline=1.)
  const inline = new URL(request.url).searchParams.get("inline") === "1" || IOS.test(request.headers.get("user-agent") ?? "");

  return new Response(vcard.body, {
    status: 200,
    headers: {
      "Content-Type": vcard.contentType,
      "Content-Disposition": inline ? vcard.disposition.replace(/^\s*attachment/i, "inline") : vcard.disposition,
      Vary: "User-Agent",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export const maxDuration = 60;
