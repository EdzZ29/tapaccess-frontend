"use client";

/* eslint-disable @next/next/no-img-element -- logos come from our own storage, already sized */

import { CheckCircle2, Star } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { api, ApiError, errorMessage } from "@/lib/api";
import type { ReviewLinkInfo } from "@/lib/types";
import { cn, initials, readableOn } from "@/lib/utils";
import { Stars } from "./stars";

const RATING_WORDS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];
const MAX_COMMENT = 500;

/**
 * The owner's review of TapAccess: stars, a few words, their name and role.
 * Coming back with the same link shows their review and lets them update it.
 */
export function ReviewForm({ token, info: initial }: { token: string; info: ReviewLinkInfo }) {
  const [info, setInfo] = useState(initial);
  const [editing, setEditing] = useState(!initial.review);
  const [rating, setRating] = useState(initial.review?.rating ?? 0);
  const [comment, setComment] = useState(initial.review?.comment ?? "");
  const [authorName, setAuthorName] = useState(initial.review?.authorName ?? "");
  const [authorRole, setAuthorRole] = useState(initial.review?.authorRole ?? "Owner");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<{ rating?: string; comment?: string; authorName?: string; form?: string }>({});

  async function submit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (rating < 1) next.rating = "Choose how many stars you'd give TapAccess.";
    if (comment.trim().length < 10) next.comment = "Write a few words about TapAccess (at least 10 characters).";
    if (authorName.trim().length < 2) next.authorName = "Enter your name.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      const updated = await api<ReviewLinkInfo>(`/public/reviews/${token}`, {
        method: "POST",
        body: { rating, comment, authorName, authorRole: authorRole.trim() || null },
      });
      setInfo(updated);
      setEditing(false);
    } catch (err) {
      setErrors({
        form:
          err instanceof ApiError && err.status === 429 && !err.code
            ? "Too many tries. Wait a minute, then send again."
            : errorMessage(err),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
      <div className="flex items-center gap-4">
        {info.logoUrl ? (
          <img src={info.logoUrl} alt="" width={56} height={56} className="h-14 w-14 shrink-0 rounded-full bg-white object-cover ring-1 ring-line" />
        ) : (
          <span
            aria-hidden
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold ring-1 ring-line"
            style={{ background: info.color, color: readableOn(info.color) }}
          >
            {initials(info.businessName)}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate font-semibold">{info.businessName}</p>
          {info.category && <p className="truncate text-sm text-ink-3">{info.category}</p>}
        </div>
      </div>

      {!editing && info.review ? (
        <div className="mt-8">
          <p className="flex items-center gap-2 text-sm font-medium text-success-ink">
            <CheckCircle2 className="h-5 w-5" aria-hidden /> Thank you! Your review is in.
          </p>
          <figure className="mt-5 rounded-xl bg-surface-2 p-5">
            <Stars rating={info.review.rating} size="h-5 w-5" />
            <blockquote className="mt-3 text-[0.95rem] leading-relaxed whitespace-pre-line text-ink">&ldquo;{info.review.comment}&rdquo;</blockquote>
            <figcaption className="mt-3 text-sm text-ink-2">
              {info.review.authorName}
              {info.review.authorRole && <span className="text-ink-3"> · {info.review.authorRole}</span>}
            </figcaption>
          </figure>
          <p className="mt-4 text-sm text-ink-2">It appears with your business on the TapAccess homepage.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={() => setEditing(true)}>Edit my review</Button>
            <Link
              href="/#businesses"
              className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-medium text-brand hover:bg-brand-soft"
            >
              See it on TapAccess
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">How is TapAccess working for you?</h1>
            <p className="mt-1 text-sm text-ink-2">Your review is shown with your business on the TapAccess homepage.</p>
          </div>

          <StarPicker value={rating} onChange={setRating} error={errors.rating} />

          <Field
            label="Your review"
            error={errors.comment}
            hint={`${comment.length}/${MAX_COMMENT}. For example: what changed since your clients started tapping your card?`}
          >
            {(props) => (
              <Textarea
                {...props}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                maxLength={MAX_COMMENT}
                placeholder="Clients tap the card and save our number right away…"
              />
            )}
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Your name" error={errors.authorName}>
              {(props) => (
                <Input {...props} value={authorName} onChange={(e) => setAuthorName(e.target.value)} maxLength={80} autoComplete="name" />
              )}
            </Field>
            <Field label="Your role" optional>
              {(props) => (
                <Input {...props} value={authorRole} onChange={(e) => setAuthorRole(e.target.value)} maxLength={80} placeholder="Owner" />
              )}
            </Field>
          </div>

          {errors.form && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{errors.form}</p>}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="primary" loading={busy}>
              {info.review ? "Update review" : "Send review"}
            </Button>
            {info.review && (
              <Button type="button" variant="ghost" disabled={busy} onClick={() => setEditing(false)}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

/** Five big tappable stars, a radio group for keyboards and screen readers. */
function StarPicker({ value, onChange, error }: { value: number; onChange: (n: number) => void; error?: string }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      onChange(Math.min(5, value + 1));
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      onChange(Math.max(1, value - 1));
    }
  };

  return (
    <div>
      <p id="rating-label" className="text-sm font-medium text-ink">
        Your rating
      </p>
      <div className="mt-2 flex items-center gap-3">
        <div role="radiogroup" aria-labelledby="rating-label" className="flex" onKeyDown={onKey} onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={value === n}
              aria-label={`${n} star${n > 1 ? "s" : ""}, ${RATING_WORDS[n]}`}
              tabIndex={value === n || (value === 0 && n === 1) ? 0 : -1}
              onClick={() => onChange(n)}
              onMouseEnter={() => setHover(n)}
              className="rounded-md p-1 transition-transform active:scale-90"
            >
              <Star
                className={cn("h-9 w-9", n <= shown ? "fill-[#f5a524] text-[#f5a524]" : "fill-transparent text-line-strong")}
                aria-hidden
              />
            </button>
          ))}
        </div>
        <span className="text-sm font-medium text-ink-2" aria-live="polite">
          {RATING_WORDS[shown]}
        </span>
      </div>
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
}
