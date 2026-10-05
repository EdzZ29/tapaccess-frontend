import { Archive, CircleCheck, CirclePause } from "lucide-react";
import { STATUS_META } from "@/lib/constants";
import type { CardStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const styles: Record<CardStatus, { cls: string; Icon: typeof CircleCheck }> = {
  active: { cls: "bg-success-soft text-success-ink ring-success/25", Icon: CircleCheck },
  inactive: { cls: "bg-warning-soft text-warning-ink ring-warning/30", Icon: CirclePause },
  archived: { cls: "bg-surface-2 text-ink-2 ring-line-strong", Icon: Archive },
};

/** Status always shows icon + label, never colour alone. */
export function StatusBadge({ status, className }: { status: CardStatus; className?: string }) {
  const { cls, Icon } = styles[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        cls,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {STATUS_META[status].label}
    </span>
  );
}

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-md bg-surface-2 px-1.5 py-0.5 text-xs font-medium text-ink-2", className)}>
      {children}
    </span>
  );
}
