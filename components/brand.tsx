import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The TapAccess logo (public/brand, derived from public/images). Each logo
 * comes in a dark-ink version and a light-ink version for dark mode; CSS
 * shows the right one, so it never flashes on load.
 */
export function BrandLogo({ className, compact, priority }: { className?: string; compact?: boolean; priority?: boolean }) {
  if (compact) {
    return (
      <span className={cn("inline-flex", className)}>
        <Image src="/brand/mark.png" alt="TapAccess" width={143} height={192} priority={priority} className="h-8 w-auto dark:hidden" />
        <Image src="/brand/mark-dark.png" alt="TapAccess" width={143} height={192} priority={priority} className="hidden h-8 w-auto dark:block" />
      </span>
    );
  }
  return (
    <span className={cn("inline-flex", className)}>
      <Image src="/brand/wordmark.png" alt="TapAccess" width={670} height={120} priority={priority} className="h-7 w-auto dark:hidden" />
      <Image src="/brand/wordmark-dark.png" alt="TapAccess" width={670} height={120} priority={priority} className="hidden h-7 w-auto dark:block" />
    </span>
  );
}
