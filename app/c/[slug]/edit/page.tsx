import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { BrandLogo } from "@/components/brand";
import { OwnerEditor } from "@/components/owner/owner-editor";
import { getPublicProfile } from "@/lib/server-api";

export const metadata: Metadata = {
  title: { absolute: "Edit your card · TapAccess" },
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Where a card's owner edits their own buttons and social links (Business
 * package, when the admin has switched owner access on). Linked from the
 * "Edit my links" button at the bottom of the card.
 */
export default async function OwnerEditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getPublicProfile(slug);
  if (result.kind === "not-found") notFound();
  if (result.kind === "moved") permanentRedirect(`/c/${result.slug}/edit`);

  if (result.kind !== "ok" || !result.profile.ownerEditing) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-6 text-center text-ink">
        <BrandLogo />
        <h1 className="mt-8 text-xl font-semibold tracking-tight">Editing isn&apos;t available for this card</h1>
        <p className="mt-2 max-w-sm text-sm text-ink-2">
          {result.kind === "error"
            ? "We couldn't reach the server. Please try again in a moment."
            : "Owner editing is switched off or not part of this card's package. Contact TapAccess to change your links."}
        </p>
        <a href={`/c/${slug}`} className="mt-6 text-sm font-medium text-brand hover:underline">
          Back to the card
        </a>
      </div>
    );
  }

  return <OwnerEditor slug={slug} businessName={result.profile.businessName} />;
}
