"use client";

import { KeyRound, Lock, Power, UserCog } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { CopyButton } from "@/components/admin/widgets";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { api, errorMessage } from "@/lib/api";
import type { CardDetail } from "@/lib/types";
import { cardUrl, formatDate } from "@/lib/utils";

/**
 * Business cards: lets the card's owner edit their own CTA buttons and
 * social links with an access code. Each card gets one code, made the first
 * time access is turned on; turning access off and on keeps it, and the
 * admin can always see it here to give it to the owner again.
 */
export function OwnerAccessPanel({ card, onChange }: { card: CardDetail; onChange: (card: CardDetail) => void }) {
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const access = card.ownerAccess;
  const editUrl = `${cardUrl(card.slug)}/edit`;
  const codePath = `/admin/cards/${card.id}/owner-access`;
  const {
    data: stored,
    error: codeError,
    mutate: setStored,
  } = useSWR<{ code: string | null }>(
    card.plan === "business" && access?.enabled ? codePath : null,
    (p: string) => api<{ code: string | null }>(p),
    { revalidateOnFocus: false },
  );
  const code = stored?.code ?? null;

  /** Turns access on; also makes the card's code when it has none to show. */
  async function turnOn() {
    setBusy(true);
    try {
      const { ownerCode, ...updated } = await api<CardDetail & { ownerCode: string }>(codePath, { method: "POST" });
      onChange(updated);
      void setStored({ code: ownerCode }, { revalidate: false });
      toast.success("Owner access is on");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    const ok = await confirm({
      title: "Turn off owner access?",
      description: "The owner is signed out and can't edit until you turn it on again. Their code stays the same.",
      confirmLabel: "Turn off",
      tone: "danger",
    });
    if (!ok) return;
    setBusy(true);
    try {
      onChange(await api<CardDetail>(codePath, { method: "DELETE" }));
      toast.success("Owner access is off");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const message = code
    ? `Edit your TapAccess card's buttons and social links:\n${editUrl}\nAccess code: ${code}\n(Or tap "Edit my links" at the bottom of your card.)`
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
            <p className="text-sm text-ink-2">
              {access?.codeSetAt ? "Off. Turn it on to let the owner edit again with the same code." : "Off. Only you can edit this card."}
            </p>
            <Button variant="primary" icon={<UserCog className="h-4 w-4" />} loading={busy} onClick={() => void turnOn()}>
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

            {codeError && !stored ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface-2 p-4">
                <p className="text-sm text-danger">Couldn&apos;t load the access code. {errorMessage(codeError)}</p>
                <Button size="sm" onClick={() => void setStored()}>
                  Try again
                </Button>
              </div>
            ) : !stored ? (
              <p className="text-sm text-ink-3">Loading the access code…</p>
            ) : code ? (
              <div className="space-y-3 rounded-xl border border-line bg-surface-2 p-4">
                <p className="text-sm font-medium text-ink">Give these to the owner. The code stays the same for this card.</p>
                <div className="flex flex-wrap items-center gap-3">
                  <KeyRound className="h-5 w-5 text-brand" aria-hidden />
                  <span className="font-mono text-2xl font-semibold tracking-widest text-ink">{code}</span>
                  <CopyButton text={code} label="Copy code" what="Access code" />
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-mono break-all text-ink-2">{editUrl}</span>
                  <CopyButton text={editUrl} label="Copy link" what="Edit link" />
                </div>
                <CopyButton text={message} label="Copy message for the owner" what="Message" />
              </div>
            ) : (
              // Codes made before codes were kept viewable were stored only as a hash.
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning/40 bg-warning-soft p-4">
                <p className="text-sm text-warning-ink">
                  This card&apos;s code was made before codes could be shown again. Make a viewable code once; the owner signs in with it from then on.
                </p>
                <Button icon={<KeyRound className="h-4 w-4" />} loading={busy} onClick={() => void turnOn()}>
                  Make a viewable code
                </Button>
              </div>
            )}

            <Button variant="danger-ghost" icon={<Power className="h-4 w-4" />} disabled={busy} onClick={() => void turnOff()}>
              Turn off
            </Button>
          </>
        )}
      </div>
    </Panel>
  );
}
