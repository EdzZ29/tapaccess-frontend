import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand";
import { ReviewForm } from "@/components/review/review-form";
import { getReviewLink } from "@/lib/server-api";

export const metadata: Metadata = {
  title: { absolute: "Review TapAccess" },
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Where a card's owner reviews TapAccess, through the private link the admin
 * sent them. The review shows with their business on the homepage.
 */
export default async function ReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await getReviewLink(token);

  if (result.kind !== "ok") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-6 text-center text-ink">
        <BrandLogo />
        <h1 className="mt-8 text-xl font-semibold tracking-tight">
          {result.kind === "invalid" ? "This review link isn't valid anymore" : "We couldn't open the review"}
        </h1>
        <p className="mt-2 max-w-sm text-sm text-ink-2">
          {result.kind === "invalid"
            ? "It may have been replaced with a new one. Ask TapAccess to send you a fresh review link."
            : "We couldn't reach the server. Please try again in a moment."}
        </p>
        <Link href="/" className="mt-6 text-sm font-medium text-brand hover:underline">
          Go to TapAccess
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-14 max-w-xl items-center px-4">
          <BrandLogo />
        </div>
      </header>
      <main className="mx-auto max-w-xl px-4 py-6 sm:py-10">
        <ReviewForm token={token} info={result.info} />
      </main>
    </div>
  );
}
