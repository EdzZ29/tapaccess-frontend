/* eslint-disable @next/next/no-img-element -- small pre-sized logos */
import type { CardSummary } from "@/lib/types";
import { initials } from "@/lib/utils";

export function CardAvatar({ card, size = "md" }: { card: Pick<CardSummary, "logoUrl" | "businessName">; size?: "md" | "lg" }) {
  const cls = size === "lg" ? "h-14 w-14 rounded-2xl text-lg" : "h-9 w-9 rounded-lg text-xs";
  return card.logoUrl ? (
    <img src={card.logoUrl} alt="" className={`${cls} shrink-0 object-cover ring-1 ring-line`} />
  ) : (
    <span className={`${cls} flex shrink-0 items-center justify-center bg-brand-soft font-semibold text-brand-ink`}>
      {initials(card.businessName)}
    </span>
  );
}
