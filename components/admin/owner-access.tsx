"use client";

import { KeyRound, Lock, RefreshCw, UserCog } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CopyButton } from "@/components/admin/widgets";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { api, errorMessage } from "@/lib/api";
import type { CardDetail } from "@/lib/types";
import { cardUrl, formatDate } from "@/lib/utils";

/**
 * Business cards: lets the card's owner edit their own CTA buttons and
 * social links with an access code. The code is shown once, right after
 * it's issued; the API keeps only a hash.
 */
export function OwnerAccessPanel({ card, onChange }: { card: CardDetail; onChange: (card: CardDetail) => void }) {
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState<string | null>(null);
  const access = card.ownerAccess;
  const editUrl = `${cardUrl(card.slug)}/edit`;

  async function issue(again: boolean) {
    if (again) {
      const ok = await confirm({
        title: "Make a new access code?",
        description: "The current code stops working and the owner is signed out. Give them the new code.",
        confirmLabel: "Make new code",
      });
      if (!ok) return;
    }
    setBusy(true);
    try {
      const { ownerCode, ...updated } = await api<CardDetail & { ownerCode: string }>(`/admin/cards/${card.id}/owner-access`, { method: "POST" });
      setIssued(ownerCode);
      onChange(updated);
      toast.success(again ? "New access code made" : "Owner access is on");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function revoke() {
    const ok = await confirm({
      title: "Turn off owner access?",
      description: "The owner is signed out and the code stops working. Their buttons and links stay as they are.",
      confirmLabel: "Turn off",
      tone: "danger",
    });
    if (!ok) return;
    setBusy(true);
    try {
      onChange(await api<CardDetail>(`/admin/cards/${card.id}/owner-access`, { method: "DELETE" }));
      setIssued(null);
      toast.success("Owner access is off");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const message = issued
    ? `Edit your TapAccess card's buttons and social links:\n${editUrl}\nAccess code: ${issued}\n(Or tap "Edit my links" at the bottom of your card.)`
    : "";

  return (
    <Panel className="mt-4">
      <PanelHeader
        title="Owner access"
        description="Let the card's owner change their own buttons and social links. Everything else stays with you."
      />
      <div className="space-y-4 p-5">
        {card.plan !== "business" ? (
          <p className="flex items-start gap-2 rounded-lg bg-surface-2 px-3 py-2.5 text-sm text-ink-2">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {access?.enabled
              ? "Paused: owner access is part of the Business package. Switch this card back to Business to let the owner edit again."
              : "Owner access is part of the Business package. Switch this card to Business to offer it."}
          </p>
        ) : !access?.enabled ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-2">Off. Only you can edit this card.</p>
            <Button variant="primary" icon={<UserCog className="h-4 w-4" />} loading={busy} onClick={() => void issue(false)}>
              Turn on owner access
            </Button>
          </div>
        ) : (
          <>
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-ink-3">Status</dt>
                <dd className="font-medium text-ink">{access.active ? "On" : card.status === "archived" ? "Paused (archived)" : "Paused"}</dd>
              </div>
              <div>
                <dt className="text-ink-3">Code made</dt>
                <dd className="font-medium text-ink">{access.codeSetAt ? formatDate(access.codeSetAt) : "-"}</dd>
              </div>
              <div>
                <dt className="text-ink-3">Owner&apos;s last edit</dt>
                <dd className="font-medium text-ink">{access.lastEditAt ? formatDate(access.lastEditAt) : "Not yet"}</dd>
              </div>
            </dl>

            {issued && (
              <div className="space-y-3 rounded-xl border border-brand/30 bg-brand-soft/40 p-4">
                <p className="text-sm font-medium text-ink">Give these to the owner. The code is shown only now. Copy it before leaving this page.</p>
                <div className="flex flex-wrap items-center gap-3">
                  <KeyRound className="h-5 w-5 text-brand" aria-hidden />
                  <span className="font-mono text-2xl font-semibold tracking-widest text-ink">{issued}</span>
                  <CopyButton text={issued} label="Copy code" what="Access code" />
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="break-all font-mono text-ink-2">{editUrl}</span>
                  <CopyButton text={editUrl} label="Copy link" what="Edit link" />
                </div>
                <CopyButton text={message} label="Copy message for the owner" what="Message" />
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button icon={<RefreshCw className="h-4 w-4" />} loading={busy} onClick={() => void issue(true)}>
                {issued ? "Make another code" : "New access code"}
              </Button>
              <Button variant="danger-ghost" disabled={busy} onClick={() => void revoke()}>
                Turn off
              </Button>
            </div>
            {!issued && (
              <p className="text-xs text-ink-3">
                Codes are stored securely and can&apos;t be shown again. If the owner lost theirs, make a new one. They sign in at{" "}
                <span className="font-mono">{editUrl}</span> or with &quot;Edit my links&quot; on their card.
              </p>
            )}
          </>
        )}
      </div>
    </Panel>
  );
}
