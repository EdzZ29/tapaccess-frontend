import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Read-only star rating, e.g. on the homepage and in the dashboard. */
export function Stars({ rating, className, size = "h-4 w-4" }: { rating: number; className?: string; size?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(size, n <= Math.round(rating) ? "fill-[#f5a524] text-[#f5a524]" : "fill-transparent text-line-strong")}
          aria-hidden
        />
      ))}
    </span>
  );
}
