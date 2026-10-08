"use client";

import { Eye, EyeOff, Link2, MessageSquareQuote, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { CopyButton, QrCode } from "@/components/admin/widgets";
import { Stars } from "@/components/review/stars";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { api, errorMessage } from "@/lib/api";
import type { AdminCardReview, CardDetail } from "@/lib/types";
import { formatDate, SITE_URL } from "@/lib/utils";

/**
 * The card owner's review of TapAccess. The admin makes a private link and
 * sends it to the owner; only that link can leave or change the card's
 * review, which then shows with the business on the homepage. The link is
 * shown once, right after it's made; the API keeps only a hash.
 */
export function ReviewLinkPanel({ card }: { card: CardDetail }) {
  const confirm = useConfirm();
  const path = `/admin/cards/${card.id}/review`;
  const { data, error, mutate } = useSWR<AdminCardReview>(path, (p: string) => api<AdminCardReview>(p), { revalidateOnFocus: false });
  const [busy, setBusy] = useState(false);
  const [issuedUrl, setIssuedUrl] = useState<string | null>(null);

  async function run(fn: () => Promise<AdminCardReview>, success: string) {
    setBusy(true);
    try {
      await mutate(await fn(), { revalidate: false });
      toast.success(success);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function makeLink() {
    if (data?.link.active) {
      const ok = await confirm({
        title: "Make a new review link?",
        description: "The current link stops working. Their review stays; send them the new link if they want to change it.",
        confirmLabel: "Make new link",
      });
      if (!ok) return;
    }
    await run(async () => {
      const { token, ...view } = await api<AdminCardReview & { token: string }>(`${path}/link`, { method: "POST" });
      setIssuedUrl(`${SITE_URL}/review/${token}`);
      return view;
    }, "Review link made");
  }

  async function turnOffLink() {
    const ok = await confirm({
      title: "Turn off the review link?",
      description: "The link stops working. A review already left stays on the homepage.",
      confirmLabel: "Turn off",
      tone: "danger",
    });
    if (!ok) return;
    setIssuedUrl(null);
    await run(() => api<AdminCardReview>(`${path}/link`, { method: "DELETE" }), "Review link turned off");
  }

  async function deleteReview() {
    const ok = await confirm({
      title: "Delete this review?",
      description: "It's removed from the homepage. If the link is still on, the owner can leave a new one.",
      confirmLabel: "Delete review",
      tone: "danger",
    });
    if (!ok) return;
    await run(() => api<AdminCardReview>(path, { method: "DELETE" }), "Review deleted");
  }

  const review = data?.review;
  const message = issuedUrl
    ? `Hi! How is your TapAccess card working for you? We'd love a short review. It will be shown with ${card.businessName} on our homepage:\n${issuedUrl}`
    : "";

  return (
    <Panel className="mt-4">
      <PanelHeader
        title="Owner review"
        description="Send the owner a private link to rate TapAccess. Their review shows with this business on the homepage."
      />
      <div className="space-y-4 p-5">
        {error ? (
          <p className="text-sm text-danger">{errorMessage(error)}</p>
        ) : !data ? (
          <p className="text-sm text-ink-3">Loading…</p>
        ) : (
          <>
            {review ? (
              <figure className="rounded-xl border border-line bg-surface-2 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Stars rating={review.rating} />
                  <span className="text-xs text-ink-3">
                    {review.hidden ? "Hidden from the homepage" : card.featured ? "Shown on the homepage" : "Shows once the card is on the homepage"}
                    {" · "}
                    {formatDate(review.updatedAt)}
                  </span>
                </div>
                <blockquote className="mt-2 text-sm leading-relaxed whitespace-pre-line text-ink">&ldquo;{review.comment}&rdquo;</blockquote>
                <figcaption className="mt-2 text-sm text-ink-2">
                  {review.authorName}
                  {review.authorRole && <span className="text-ink-3"> · {review.authorRole}</span>}
                </figcaption>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    icon={review.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    disabled={busy}
                    onClick={() =>
                      void run(
                        () => api<AdminCardReview>(path, { method: "PATCH", body: { hidden: !review.hidden } }),
                        review.hidden ? "Review shown on the homepage" : "Review hidden from the homepage",
                      )
                    }
                  >
                    {review.hidden ? "Show on homepage" : "Hide from homepage"}
                  </Button>
                  <Button size="sm" variant="danger-ghost" icon={<Trash2 className="h-4 w-4" />} disabled={busy} onClick={() => void deleteReview()}>
                    Delete
                  </Button>
                </div>
              </figure>
            ) : (
              <p className="flex items-center gap-2 text-sm text-ink-2">
                <MessageSquareQuote className="h-4 w-4 shrink-0 text-ink-3" aria-hidden />
                {data.link.active ? "Link sent, no review yet." : "No review yet."}
              </p>
            )}

            {!card.featured && (
              <p className="rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning-ink">
                This card isn&apos;t on the homepage. Turn on &quot;Show on the TapAccess homepage&quot; in Card details so its review appears there.
              </p>
            )}

            {issuedUrl && (
              <div className="flex flex-col gap-5 rounded-xl border border-brand/30 bg-brand-soft/40 p-4 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1 space-y-3">
                  <p className="text-sm font-medium text-ink">
                    Give the owner this link or the QR code: send the link in a chat, or show or print the QR for them to scan. Both are shown only
                    now, so copy or download them before leaving this page.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Link2 className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                    <span className="min-w-0 font-mono break-all text-ink">{issuedUrl}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <CopyButton text={issuedUrl} label="Copy link" what="Review link" />
                    <CopyButton text={message} label="Copy message for the owner" what="Message" />
                  </div>
                </div>
                {/* Same link as a QR code, to scan from this screen or a printout. */}
                <div className="shrink-0 self-center">
                  <QrCode value={issuedUrl} fileName={`${card.slug}-review`} />
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {data.link.active ? (
                <>
                  <Button icon={<RefreshCw className="h-4 w-4" />} loading={busy} onClick={() => void makeLink()}>
                    New review link
                  </Button>
                  <Button variant="danger-ghost" disabled={busy} onClick={() => void turnOffLink()}>
                    Turn off link
                  </Button>
                </>
              ) : (
                <Button variant="primary" icon={<Link2 className="h-4 w-4" />} loading={busy} onClick={() => void makeLink()} disabled={card.status === "archived"}>
                  Make review link
                </Button>
              )}
            </div>
            {data.link.active && !issuedUrl && (
              <p className="text-xs text-ink-3">
                Link made {data.link.createdAt ? formatDate(data.link.createdAt) : ""}. The link and its QR code are stored securely and can&apos;t be
                shown again. If the owner lost theirs, make a new one.
              </p>
            )}
          </>
        )}
      </div>
    </Panel>
  );
}
