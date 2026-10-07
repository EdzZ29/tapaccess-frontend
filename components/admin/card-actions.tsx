"use client";

import {
  Archive,
  ArchiveRestore,
  BarChart3,
  Copy,
  CopyPlus,
  ExternalLink,
  Pencil,
  Power,
  PowerOff,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import { Dialog } from "@/components/ui/dialog";
import type { MenuItem } from "@/components/ui/menu";
import { api, errorMessage } from "@/lib/api";
import type { CardDetail, CardStatus, CardSummary } from "@/lib/types";
import { cardUrl } from "@/lib/utils";
import { SlugField, useSlugCheck } from "./slug-field";
import { copyText } from "./widgets";

/**
 * Every card-level action in one place, so the table, the details page and
 * the editor behave identically (same confirmations, same toasts).
 */
export function useCardActions(onChanged: (card?: CardDetail) => void) {
  const router = useRouter();
  const confirm = useConfirm();
  const [duplicating, setDuplicating] = useState<CardSummary | null>(null);

  async function setStatus(card: CardSummary, status: CardStatus) {
    if (status === "inactive" && card.status === "active") {
      const ok = await confirm({
        title: `Deactivate ${card.businessName}?`,
        description: "Anyone who taps this card will see an “unavailable” page until you activate it again.",
        confirmLabel: "Deactivate",
        tone: "danger",
      });
      if (!ok) return;
    }
    if (status === "archived") {
      const ok = await confirm({
        title: `Archive ${card.businessName}?`,
        description: "The card goes offline and is hidden from the main list. You can restore it at any time.",
        confirmLabel: "Archive",
        tone: "danger",
      });
      if (!ok) return;
    }
    if (status === "active" && !card.firstActivatedAt) {
      const ok = await confirm({
        title: `Activate ${card.businessName}?`,
        description: (
          <>
            The profile goes live at <span className="font-mono text-ink">/c/{card.slug}</span>. You can still change the address
            later, and the old one keeps forwarding, so NFC tags and QR codes never need rewriting.
          </>
        ),
        confirmLabel: "Activate",
      });
      if (!ok) return;
    }
    try {
      const updated = await api<CardDetail>(`/admin/cards/${card.id}/status`, { method: "PATCH", body: { status } });
      toast.success(
        status === "active"
          ? "Card activated. The profile is live"
          : status === "inactive"
            ? card.status === "archived"
              ? "Card restored as inactive"
              : "Card deactivated"
            : "Card archived",
      );
      onChanged(updated);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function remove(card: CardSummary) {
    const ok = await confirm({
      title: "Delete this card permanently?",
      description: "Its profile, images and all analytics are erased. This cannot be undone.",
      confirmLabel: "Delete forever",
      tone: "danger",
      requireText: card.slug,
    });
    if (!ok) return;
    try {
      await api(`/admin/cards/${card.id}`, { method: "DELETE" });
      toast.success("Card deleted");
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  function menuItems(card: CardSummary, opts: { includeNavigation?: boolean } = {}): (MenuItem | "separator")[] {
    const nav = opts.includeNavigation ?? true;
    return [
      { label: "Edit profile", icon: Pencil, onSelect: () => router.push(`/admin/cards/${card.id}/edit`), hidden: !nav },
      { label: "Details & analytics", icon: BarChart3, onSelect: () => router.push(`/admin/cards/${card.id}`), hidden: !nav },
      { label: "Copy public URL", icon: Copy, onSelect: () => void copyText(cardUrl(card.slug), "Public URL") },
      { label: "Open public page", icon: ExternalLink, onSelect: () => window.open(cardUrl(card.slug), "_blank", "noopener") },
      "separator",
      { label: "Duplicate", icon: CopyPlus, onSelect: () => setDuplicating(card) },
      { label: "Activate", icon: Power, onSelect: () => void setStatus(card, "active"), hidden: card.status === "active" || card.status === "archived" },
      { label: "Deactivate", icon: PowerOff, onSelect: () => void setStatus(card, "inactive"), hidden: card.status !== "active" },
      { label: "Restore", icon: ArchiveRestore, onSelect: () => void setStatus(card, "inactive"), hidden: card.status !== "archived" },
      { label: "Archive", icon: Archive, onSelect: () => void setStatus(card, "archived"), hidden: card.status === "archived", tone: "danger" },
      { label: "Delete permanently", icon: Trash2, onSelect: () => void remove(card), hidden: card.status !== "archived", tone: "danger" },
    ];
  }

  const dialogs = duplicating && (
    <DuplicateDialog
      source={duplicating}
      onClose={() => setDuplicating(null)}
      onDone={(created) => {
        setDuplicating(null);
        onChanged();
        router.push(`/admin/cards/${created.id}/edit`);
      }}
    />
  );

  return { setStatus, remove, menuItems, dialogs, duplicate: setDuplicating };
}

function DuplicateDialog({ source, onClose, onDone }: { source: CardSummary; onClose: () => void; onDone: (c: CardDetail) => void }) {
  const [businessName, setBusinessName] = useState(`${source.businessName} (copy)`);
  const [slug, setSlug] = useState(`${source.slug}-copy`.slice(0, 64));
  const check = useSlugCheck(slug);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await api<CardDetail>(`/admin/cards/${source.id}/duplicate`, {
        method: "POST",
        body: { slug, businessName },
      });
      toast.success(`Created ${created.cardCode} from ${source.cardCode}`);
      onDone(created);
    } catch (err) {
      toast.error(errorMessage(err));
      setSaving(false);
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Duplicate card"
      description="Copies the profile, theme, sections and buttons. Analytics and notes are not copied. The new card starts inactive."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="duplicate-form" loading={saving} disabled={!check.ok || !businessName.trim()}>
            Duplicate
          </Button>
        </>
      }
    >
      <form id="duplicate-form" onSubmit={submit} className="space-y-4 pb-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-ink">Business name</span>
          <input
            className="block h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            maxLength={120}
          />
        </label>
        <SlugField value={slug} onChange={setSlug} check={check} />
      </form>
    </Dialog>
  );
}
