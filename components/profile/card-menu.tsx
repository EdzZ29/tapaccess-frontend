"use client";

import { Menu, Pencil, Share2, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { toast } from "sonner";
import type { PublicProfile } from "@/lib/types";
import { useTracking } from "./tracking";

/**
 * The card's top-right menu: Share, and — when the owner may edit this
 * card — "Edit my links". Themed with the card's own colours.
 */
export function CardMenu({ profile, onPhoto }: { profile: PublicProfile; onPhoto: boolean }) {
  const { preview, track } = useTracking();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    list.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus();
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) trigger.current?.focus();
  };

  const onMenuKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const items = [...(list.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? [])];
    const at = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      items[(at + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  const share = async () => {
    close(false);
    track("contact", "share");
    if (preview) {
      toast.info("Sharing works on the live page");
      return;
    }
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: profile.businessName, text: profile.tagline ?? undefined, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch {
      // Share sheet dismissed.
    }
  };

  const item =
    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[0.95rem] font-medium outline-none transition-colors hover:bg-[var(--p-soft)] focus-visible:bg-[var(--p-soft)]";

  return (
    <div ref={root} className="relative shrink-0">
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Menu"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        className="flex h-10 w-10 items-center justify-center rounded-full border transition-transform active:scale-95"
        style={{ borderColor: onPhoto ? "rgba(255,255,255,0.35)" : "var(--p-border)" }}
      >
        {open ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
      </button>

      {open && (
        <div
          ref={list}
          id={menuId}
          role="menu"
          aria-label={`${profile.businessName} menu`}
          onKeyDown={onMenuKey}
          className="absolute top-12 right-0 z-30 w-56 rounded-2xl border p-1.5 shadow-[0_18px_40px_-12px_rgb(0_0_0/0.35)]"
          style={{ background: "var(--p-surface)", color: "var(--p-text)", borderColor: "var(--p-border)" }}
        >
          <button type="button" role="menuitem" className={item} onClick={() => void share()}>
            <Share2 className="h-[18px] w-[18px] shrink-0" aria-hidden />
            Share this card
          </button>
          {profile.ownerEditing && (
            <a role="menuitem" href={`/c/${profile.slug}/edit`} className={item} onClick={() => setOpen(false)}>
              <Pencil className="h-[18px] w-[18px] shrink-0" aria-hidden />
              Edit my links
            </a>
          )}
        </div>
      )}
    </div>
  );
}
