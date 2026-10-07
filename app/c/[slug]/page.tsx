import type { Metadata } from "next";
import { cookies } from "next/headers";
import { after } from "next/server";
import { notFound, permanentRedirect } from "next/navigation";
import { ProfileView } from "@/components/profile/profile-view";
import { CardUnavailable } from "@/components/profile/status-pages";
import { getCachedVCard, getPublicProfile } from "@/lib/server-api";
import { absoluteUrl, cardUrl } from "@/lib/utils";

// Room for a sleeping API server to wake up (Render free plan) before the page gives up.
export const maxDuration = 60;

const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME ?? "tapaccess_session";

export async function generateMetadata({ params }: PageProps<"/c/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublicProfile(slug);
  if (result.kind !== "ok") return { title: { absolute: "TapAccess" }, robots: { index: false, follow: false } };

  const p = result.profile;
  const description = p.tagline ?? p.description?.slice(0, 160) ?? `${p.businessName} on TapAccess`;
  const image = absoluteUrl(p.coverUrl ?? p.logoUrl);
  return {
    title: { absolute: p.businessName },
    description,
    alternates: { canonical: cardUrl(p.slug) },
    // Shared links still show a rich preview (Open Graph), but cards never
    // appear in search results.
    robots: { index: false, follow: false, nocache: true },
    openGraph: {
      type: "profile",
      title: p.businessName,
      description,
      url: cardUrl(p.slug),
      siteName: p.businessName,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: { card: image ? "summary_large_image" : "summary", title: p.businessName, description },
    icons: p.logoUrl ? { icon: p.logoUrl, apple: p.logoUrl } : undefined,
  };
}

export default async function PublicCardPage({ params }: PageProps<"/c/[slug]">) {
  const { slug } = await params;
  const result = await getPublicProfile(slug);

  if (result.kind === "not-found") notFound();
  // An old address (the card's slug changed): NFC tags and links keep working.
  if (result.kind === "moved") permanentRedirect(`/c/${result.slug}`);
  if (result.kind === "unavailable") return <CardUnavailable />;
  if (result.kind === "error") throw new Error(`Profile request failed with status ${result.status}`);

  // Have the vCard cached before the visitor taps Save contact (or the card
  // opens on it), so it never waits for a sleeping API. Started during the
  // render (not inside `after`, where the data cache isn't writable) without
  // being awaited; `after` keeps the request alive until it's stored.
  const warmVCard = getCachedVCard(slug);
  after(() => warmVCard);

  // Neither the admin's nor the owner's own checks of a card count as visits.
  const jar = await cookies();
  const isAdmin = jar.has(SESSION_COOKIE) || jar.has(`${SESSION_COOKIE}_owner`);
  return (
    <>
      {/* Browser bar colour. Rendered here (hoisted into <head>) instead of
          generateViewport, which would hold back the loading skeleton. */}
      <meta name="theme-color" content={result.profile.theme.backgroundColor} />
      <ProfileView profile={result.profile} trackVisits={!isAdmin} />
    </>
  );
}
