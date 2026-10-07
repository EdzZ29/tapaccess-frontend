"use client";

import { ExternalLink, KeyRound, Loader2, LogOut, Save } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { BrandLogo } from "@/components/brand";
import { humanizeApiError, type LinksDoc } from "@/components/admin/editor/model";
import { ButtonsTab } from "@/components/admin/editor/tabs-buttons";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { api, ApiError, errorMessage } from "@/lib/api";
import type { OwnerCard } from "@/lib/types";

type Phase = { kind: "loading" } | { kind: "signin"; notice?: string } | { kind: "edit"; card: OwnerCard } | { kind: "error"; message: string };

const toDoc = (card: OwnerCard): LinksDoc => ({ buttons: structuredClone(card.buttons), socialLinks: structuredClone(card.socialLinks) });

/** Drops the editor-only `_key` from new rows. */
function strip<T extends { _key?: string }>(row: T): Omit<T, "_key"> {
  const copy = { ...row };
  delete copy._key;
  return copy;
}

const toPayload = (doc: LinksDoc) => ({ buttons: doc.buttons.map(strip), socialLinks: doc.socialLinks.map(strip) });

/**
 * Self-service editor for a card's owner (Business package): sign in with
 * the access code from TapAccess, then edit the card's CTA buttons and
 * social links. Everything else on the card stays with the admin.
 */
export function OwnerEditor({ slug, businessName }: { slug: string; businessName: string }) {
  const { data, error, isLoading, mutate } = useSWR<OwnerCard, unknown>("/owner/card", (path: string) => api<OwnerCard>(path), {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  });
  /** Set after signing out or when the session ends while editing. */
  const [signedOut, setSignedOut] = useState<{ notice?: string } | null>(null);

  const unauthorized = error instanceof ApiError && error.status === 401;
  const phase: Phase = isLoading
    ? { kind: "loading" }
    : signedOut
      ? { kind: "signin", notice: signedOut.notice }
      : unauthorized
        ? { kind: "signin", notice: error.code === "OWNER_SESSION_ENDED" ? error.message : undefined }
        : error
          ? { kind: "error", message: errorMessage(error) }
          : // A session for another of the owner's cards doesn't apply here.
            data && data.slug === slug
            ? { kind: "edit", card: data }
            : { kind: "signin" };

  const show = (card: OwnerCard) => {
    setSignedOut(null);
    void mutate(card, { revalidate: false });
  };
  const load = () => void mutate();

  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
          <BrandLogo />
          <a
            href={`/c/${slug}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm font-medium text-ink-2 hover:text-ink"
          >
            <ExternalLink className="h-4 w-4" aria-hidden /> View card
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
        {phase.kind === "loading" && (
          <div className="flex justify-center py-24 text-ink-3" role="status" aria-label="Loading">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
        {phase.kind === "error" && (
          <div className="rounded-xl border border-line bg-surface p-6 text-center">
            <p className="text-sm text-danger">{phase.message}</p>
            <Button className="mt-4" onClick={load}>
              Try again
            </Button>
          </div>
        )}
        {phase.kind === "signin" && (
          <SignIn slug={slug} businessName={businessName} notice={phase.notice} onSignedIn={show} />
        )}
        {phase.kind === "edit" && (
          <LinksEditor
            card={phase.card}
            onSignedOut={(notice) => setSignedOut({ notice })}
            onSaved={show}
          />
        )}
      </main>
    </div>
  );
}

function SignIn({
  slug,
  businessName,
  notice,
  onSignedIn,
}: {
  slug: string;
  businessName: string;
  notice?: string;
  onSignedIn: (card: OwnerCard) => void;
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!code.trim()) {
      setError("Enter the access code you received from TapAccess.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      onSignedIn(await api<OwnerCard>("/owner/login", { method: "POST", body: { slug, code } }));
      toast.success("Signed in");
    } catch (err) {
      setError(err instanceof ApiError && err.status === 429 && !err.code ? "Too many attempts. Wait a minute, then try again." : errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm rounded-2xl border border-line bg-surface p-6 sm:p-8">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand-ink">
        <KeyRound className="h-5 w-5" aria-hidden />
      </span>
      <h1 className="mt-5 text-xl font-semibold tracking-tight">Edit {businessName}</h1>
      <p className="mt-1 text-sm text-ink-2">Enter the access code from TapAccess to change your card&apos;s buttons and social links.</p>
      {notice && <p className="mt-4 rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning-ink">{notice}</p>}
      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        <Field label="Access code" error={error ?? undefined}>
          {(props) => (
            <Input
              {...props}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="K7QP3-MX9RW"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={40}
              className="font-mono tracking-widest"
              autoFocus
            />
          )}
        </Field>
        <Button type="submit" variant="primary" className="w-full" loading={busy}>
          Sign in
        </Button>
      </form>
      <p className="mt-5 text-xs text-ink-3">Lost your code? Ask TapAccess for a new one. The old one stops working.</p>
    </div>
  );
}

function LinksEditor({
  card,
  onSaved,
  onSignedOut,
}: {
  card: OwnerCard;
  onSaved: (card: OwnerCard) => void;
  onSignedOut: (notice?: string) => void;
}) {
  const [doc, setDoc] = useState<LinksDoc>(() => toDoc(card));
  const [baseline, setBaseline] = useState(() => JSON.stringify(toPayload(toDoc(card))));
  const [saving, setSaving] = useState(false);
  const dirty = useMemo(() => JSON.stringify(toPayload(doc)) !== baseline, [doc, baseline]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function save() {
    const unnamed = doc.buttons.findIndex((b) => !b.label.trim() || !b.url.trim());
    if (unnamed !== -1) {
      toast.error(`Button ${unnamed + 1} needs a label and a link`);
      return;
    }
    setSaving(true);
    try {
      const saved = await api<OwnerCard>("/owner/card", { method: "PUT", body: toPayload(doc) });
      setDoc(toDoc(saved));
      setBaseline(JSON.stringify(toPayload(toDoc(saved))));
      onSaved(saved);
      toast.success("Saved. Your card is updated");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onSignedOut(err.message);
        return;
      }
      toast.error("Couldn't save", { description: err instanceof ApiError ? humanizeApiError(err.message) : errorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    await api("/owner/logout", { method: "POST" }).catch(() => undefined);
    onSignedOut();
  }

  return (
    <div className="space-y-5 pb-28">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{card.businessName}</h1>
          <p className="mt-1 text-sm text-ink-2">
            Change your buttons and social links. For photos, hours or your description, contact TapAccess.
          </p>
        </div>
        <Button size="sm" variant="ghost" icon={<LogOut className="h-4 w-4" />} onClick={() => void signOut()}>
          Sign out
        </Button>
      </div>

      <ButtonsTab doc={doc} setDoc={setDoc} plan={card.plan} onUpgrade={() => undefined} />

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
          <span className="text-sm text-ink-3" aria-live="polite">
            {dirty ? "Unsaved changes" : card.lastEditAt ? `Saved ${new Date(card.lastEditAt).toLocaleString()}` : "No changes yet"}
          </span>
          <Button variant="primary" icon={<Save className="h-4 w-4" />} loading={saving} disabled={!dirty} onClick={() => void save()}>
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}
