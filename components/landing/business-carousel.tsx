"use client";

/* eslint-disable @next/next/no-img-element -- logos come from our own storage, already sized */

import { BadgeCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FeaturedCard } from "@/lib/types";
import { Stars } from "@/components/review/stars";
import { cn, initials, readableOn } from "@/lib/utils";

/**
 * "Businesses on TapAccess": a swipeable row of business cards, each with
 * its logo (or initials in its brand colour), name, category and a link to
 * its live card. Arrow buttons appear when there is more to scroll.
 */
export function BusinessCarousel({ items }: { items: FeaturedCard[] }) {
  const track = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  // Wider cards once there are reviews to read; all the same width either way.
  const reviewed = items.some((b) => b.review);

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [update]);

  const scroll = (direction: 1 | -1) => {
    const el = track.current;
    if (el) el.scrollBy({ left: direction * Math.max(el.clientWidth * 0.8, 200), behavior: "smooth" });
  };

  return (
    <div className="relative">
      <ul
        ref={track}
        onScroll={update}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Businesses on TapAccess"
      >
        {items.map((b) => (
          <li key={b.slug} className={cn("shrink-0 snap-start", reviewed ? "w-60" : "w-44")}>
            <div className="flex h-full flex-col items-center rounded-2xl border border-line bg-surface p-4 text-center">
              {b.logoUrl ? (
                <img
                  src={b.logoUrl}
                  alt=""
                  width={96}
                  height={96}
                  loading="lazy"
                  className="h-24 w-24 rounded-full bg-white object-cover ring-1 ring-line"
                />
              ) : (
                <span
                  aria-hidden
                  className="flex h-24 w-24 items-center justify-center rounded-full font-display text-2xl font-bold ring-1 ring-line"
                  style={{ background: b.color, color: readableOn(b.color) }}
                >
                  {initials(b.businessName)}
                </span>
              )}
              <p className="mt-3 flex w-full min-w-0 items-center justify-center gap-1 font-semibold">
                <span className="truncate">{b.businessName}</span>
                <BadgeCheck className="h-4 w-4 shrink-0 text-brand" aria-label="Active TapAccess card" />
              </p>
              <p className="mt-0.5 w-full truncate text-sm text-ink-3">{b.category ?? " "}</p>
              {b.review && (
                <figure className="mt-4 flex w-full flex-col items-center border-t border-line pt-4">
                  <Stars rating={b.review.rating} />
                  <blockquote className="mt-2.5 line-clamp-4 text-sm leading-relaxed text-ink-2">&ldquo;{b.review.comment}&rdquo;</blockquote>
                  <figcaption className="mt-2 w-full truncate text-xs text-ink-3">
                    <span className="font-medium text-ink">{b.review.authorName}</span>
                    {b.review.authorRole && ` · ${b.review.authorRole}`}
                  </figcaption>
                </figure>
              )}
              {/* Pinned to the bottom so the buttons line up, review or not. */}
              <div className="mt-auto w-full pt-4">
                <a
                  href={`/c/${b.slug}`}
                  className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
                >
                  View card
                </a>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {!edges.start && (
        <button
          type="button"
          onClick={() => scroll(-1)}
          aria-label="Scroll back"
          className="absolute top-1/2 -left-3 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-ink shadow-md sm:flex"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {!edges.end && (
        <button
          type="button"
          onClick={() => scroll(1)}
          aria-label="See more businesses"
          className="absolute top-1/2 -right-3 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-ink shadow-md sm:flex"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
