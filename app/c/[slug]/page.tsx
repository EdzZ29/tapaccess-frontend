import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ProfileView } from "@/components/profile/profile-view";
import { CardUnavailable } from "@/components/profile/status-pages";
import { getPublicProfile } from "@/lib/server-api";
import { absoluteUrl, cardUrl } from "@/lib/utils";

const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME ?? "tapaccess_session";

export async function generateMetadata({ params }: PageProps<"/c/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublicProfile(slug);
  if (result.kind !== "ok") return { title: "TapAccess", robots: { index: false, follow: false } };

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

export async function generateViewport({ params }: PageProps<"/c/[slug]">): Promise<Viewport> {
  const { slug } = await params;
  const result = await getPublicProfile(slug);
  return { themeColor: result.kind === "ok" ? result.profile.theme.backgroundColor : "#f8fafc" };
}

export default async function PublicCardPage({ params }: PageProps<"/c/[slug]">) {
  const { slug } = await params;
  const result = await getPublicProfile(slug);

  if (result.kind === "not-found") notFound();
  if (result.kind === "unavailable") return <CardUnavailable />;
  if (result.kind === "error") throw new Error(`Profile request failed with status ${result.status}`);

  // Don't count the admin's own checks of a card as visits.
  const isAdmin = (await cookies()).has(SESSION_COOKIE);
  return <ProfileView profile={result.profile} trackVisits={!isAdmin} />;
}
