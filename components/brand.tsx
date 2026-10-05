import { Nfc } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandLogo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight text-ink", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white shadow-sm">
        <Nfc className="h-[18px] w-[18px]" aria-hidden />
      </span>
      {!compact && <span className="text-[1.05rem]">TapAccess</span>}
    </span>
  );
}
