"use client";

import type { LucideIcon } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface MenuItem {
  label: string;
  icon?: LucideIcon;
  /** A custom icon element (e.g. a brand logo), shown instead of `icon`. */
  leading?: ReactNode;
  onSelect: () => void;
  tone?: "danger";
  hidden?: boolean;
  disabled?: boolean;
}

/** Small accessible dropdown: arrow keys move, Esc closes, focus returns to the trigger. */
export function Menu({
  trigger,
  items,
  label,
  align = "end",
}: {
  trigger: (props: { onClick: () => void; "aria-expanded": boolean; "aria-haspopup": "menu"; "aria-controls": string; "aria-label": string }) => ReactNode;
  items: (MenuItem | "separator")[];
  label: string;
  align?: "start" | "end";
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const visible = items.filter((i) => i === "separator" || !i.hidden);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    root.current?.querySelector<HTMLButtonElement>('[role="menuitem"]:not([disabled])')?.focus();
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const close = () => {
    setOpen(false);
    root.current?.querySelector<HTMLButtonElement>("[aria-haspopup]")?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const buttons = Array.from(root.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not([disabled])') ?? []);
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      buttons[(index + 1) % buttons.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      buttons[(index - 1 + buttons.length) % buttons.length]?.focus();
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div ref={root} className="relative inline-block" onKeyDown={open ? onKeyDown : undefined}>
      {trigger({
        onClick: () => setOpen((o) => !o),
        "aria-expanded": open,
        "aria-haspopup": "menu",
        "aria-controls": id,
        "aria-label": label,
      })}
      {open && (
        <div
          id={id}
          role="menu"
          aria-label={label}
          className={cn(
            "absolute z-30 mt-1 max-h-[min(24rem,70vh)] min-w-48 overflow-y-auto rounded-lg border border-line bg-surface py-1 shadow-lg",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          {visible.map((item, i) =>
            item === "separator" ? (
              <div key={`sep-${i}`} className="my-1 border-t border-line" role="separator" />
            ) : (
              <button
                key={item.label}
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm focus:outline-none disabled:opacity-40",
                  item.tone === "danger"
                    ? "text-danger hover:bg-danger-soft focus:bg-danger-soft"
                    : "text-ink hover:bg-surface-2 focus:bg-surface-2",
                )}
              >
                {item.leading ?? (item.icon && <item.icon className="h-4 w-4 shrink-0 opacity-70" aria-hidden />)}
                {item.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
