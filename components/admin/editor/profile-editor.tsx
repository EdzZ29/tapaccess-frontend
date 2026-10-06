"use client";

import { ArrowLeft, ExternalLink, Eye, Pencil, RotateCcw, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PlanBadge, PlanPicker } from "@/components/admin/plan";
import { ProfileView } from "@/components/profile/profile-view";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import { Dialog } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { api, ApiError, errorMessage } from "@/lib/api";
import type { CardDetail, CardPlan, ProfileFields, Theme } from "@/lib/types";
import { cardUrl, cn } from "@/lib/utils";
import { docFromCard, humanizeApiError, toPayload, toPreview, type EditorDoc } from "./model";
import { ButtonsTab } from "./tabs-buttons";
import { ContactTab, ProfileTab } from "./tabs-profile";
import { SectionsTab } from "./tabs-sections";
import { ThemeTab } from "./tabs-theme";

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "contact", label: "Contact & hours" },
  { id: "buttons", label: "Buttons & links" },
  { id: "sections", label: "Sections" },
  { id: "theme", label: "Theme" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export function ProfileEditor({ card: initial, onCardChange }: { card: CardDetail; onCardChange: (c: CardDetail) => void }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [card, setCard] = useState(initial);
  const [doc, setDoc] = useState<EditorDoc>(() => docFromCard(initial));
  const [baseline, setBaseline] = useState(() => JSON.stringify(toPayload(docFromCard(initial))));
  const [tab, setTab] = useState<TabId>("profile");
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  const [saving, setSaving] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);

  const dirty = useMemo(() => JSON.stringify(toPayload(doc)) !== baseline, [doc, baseline]);
  const preview = useMemo(() => toPreview(doc, card.slug, card.plan), [doc, card.slug, card.plan]);

  const setProfile = (patch: Partial<ProfileFields>) => setDoc((d) => ({ ...d, profile: { ...d.profile, ...patch } }));
  const setTheme = (patch: Partial<Theme>) => setDoc((d) => ({ ...d, profile: { ...d.profile, theme: { ...d.profile.theme, ...patch } } }));

  const save = useCallback(async () => {
    if (!doc.profile.businessName.trim()) {
      setTab("profile");
      toast.error("Business name is required");
      return;
    }
    setSaving(true);
    try {
      // The owner edit this editor has seen: the API refuses the save if the
      // card's owner changed their links since, instead of overwriting them.
      const baseOwnerEditAt = card.ownerAccess ? card.ownerAccess.lastEditAt : undefined;
      const updated = await api<CardDetail>(`/admin/cards/${card.id}/profile`, { method: "PUT", body: { ...toPayload(doc), baseOwnerEditAt } });
      const next = docFromCard(updated);
      setCard(updated);
      setDoc(next);
      setBaseline(JSON.stringify(toPayload(next)));
      onCardChange(updated);
      toast.success(updated.status === "active" ? "Saved — the live card is updated" : "Saved");
    } catch (err) {
      if (err instanceof ApiError && err.code === "OWNER_EDITED") {
        toast.error("The owner changed their links", {
          description: err.message,
          duration: 15_000,
          action: { label: "Reload", onClick: () => window.location.reload() },
        });
      } else {
        toast.error(err instanceof ApiError ? humanizeApiError(err.message) : errorMessage(err));
      }
    } finally {
      setSaving(false);
    }
  }, [card.id, card.ownerAccess, doc, onCardChange]);

  // Ctrl/Cmd + S saves; leaving with unsaved changes asks first.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (dirty && !saving) void save();
      }
    };
    const onUnload = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [dirty, saving, save]);

  async function leave() {
    if (dirty) {
      const ok = await confirm({ title: "Discard unsaved changes?", description: "Your edits since the last save will be lost.", confirmLabel: "Discard", tone: "danger" });
      if (!ok) return;
    }
    router.push(`/admin/cards/${card.id}`);
  }

  async function discard() {
    const ok = await confirm({ title: "Discard unsaved changes?", confirmLabel: "Discard", tone: "danger" });
    if (ok) setDoc(docFromCard(card));
  }

  const tabProps = { cardId: card.id, plan: card.plan, onUpgrade: () => setPlanOpen(true) };

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-line bg-surface px-4 py-3">
        <Button size="icon-sm" variant="ghost" onClick={leave} aria-label="Back to card">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold text-ink">{card.businessName}</h1>
          <div className="flex items-center gap-2 text-xs text-ink-3">
            <StatusBadge status={card.status} />
            <button type="button" onClick={() => setPlanOpen(true)} title="Change package">
              <PlanBadge plan={card.plan} />
            </button>
            <span className="hidden font-mono sm:inline">/c/{card.slug}</span>
          </div>
        </div>
        <span aria-live="polite" className={cn("hidden text-xs sm:inline", dirty ? "text-warning-ink" : "text-ink-3")}>
          {dirty ? "Unsaved changes" : "All changes saved"}
        </span>
        <a
          href={cardUrl(card.slug)}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden h-8 items-center gap-2 rounded-lg px-3 text-sm font-medium text-ink-2 hover:bg-surface-2 hover:text-ink md:inline-flex"
        >
          <ExternalLink className="h-4 w-4" /> Open live page
        </a>
        {dirty && (
          <Button size="sm" variant="ghost" icon={<RotateCcw className="h-4 w-4" />} onClick={discard}>
            Discard
          </Button>
        )}
        <Button size="sm" variant="primary" icon={<Save className="h-4 w-4" />} loading={saving} disabled={!dirty} onClick={save} title="Save (Ctrl+S)">
          Save
        </Button>
      </header>

      {/* Mobile: switch between form and preview */}
      <div className="flex shrink-0 border-b border-line bg-surface lg:hidden">
        {(["edit", "preview"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setMobileView(v)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-medium",
              mobileView === v ? "border-b-2 border-brand text-brand-ink" : "text-ink-2",
            )}
          >
            {v === "edit" ? <Pencil className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {v === "edit" ? "Edit" : "Preview"}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1">
        <div className={cn("min-w-0 flex-1 flex-col lg:flex", mobileView === "edit" ? "flex" : "hidden")}>
          <nav aria-label="Editor sections" className="flex shrink-0 gap-1 overflow-x-auto overscroll-x-contain border-b border-line bg-surface px-3 [scrollbar-width:none]">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={(e) => {
                  setTab(t.id);
                  // On phones the tab row scrolls; bring a half-hidden tab fully into view.
                  e.currentTarget.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "smooth" });
                }}
                aria-current={tab === t.id ? "page" : undefined}
                className={cn(
                  "shrink-0 border-b-2 px-3 py-3 text-sm font-medium whitespace-nowrap transition-colors",
                  tab === t.id ? "border-brand text-ink" : "border-transparent text-ink-2 hover:text-ink",
                )}
              >
                {t.label}
              </button>
            ))}
          </nav>
          <div className="min-h-0 flex-1 overflow-y-auto bg-canvas">
            <div className="mx-auto max-w-3xl p-4 sm:p-6">
              {tab === "profile" && <ProfileTab value={doc.profile} onChange={setProfile} {...tabProps} />}
              {tab === "contact" && <ContactTab value={doc.profile} onChange={setProfile} {...tabProps} />}
              {tab === "buttons" && <ButtonsTab doc={doc} setDoc={(fn) => setDoc((d) => ({ ...d, ...fn(d) }))} plan={card.plan} onUpgrade={tabProps.onUpgrade} />}
              {tab === "sections" && <SectionsTab doc={doc} setDoc={setDoc} {...tabProps} />}
              {tab === "theme" && <ThemeTab theme={doc.profile.theme} onChange={setTheme} {...tabProps} />}
            </div>
          </div>
        </div>

        <aside
          aria-label="Live preview"
          className={cn("shrink-0 flex-col items-center overflow-y-auto border-l border-line bg-surface-2 lg:flex lg:w-[440px] xl:w-[480px]", mobileView === "preview" ? "flex w-full" : "hidden")}
        >
          <p className="mt-4 mb-3 text-xs font-medium tracking-wide text-ink-3 uppercase">Live preview · unsaved edits included</p>
          <div className="mb-6 w-[375px] max-w-[calc(100%-2rem)] shrink-0 overflow-hidden rounded-[2.25rem] border-[10px] border-slate-900 bg-slate-900 shadow-2xl">
            <div className="h-[720px] overflow-y-auto rounded-[1.6rem] bg-white">
              <ProfileView profile={preview} mode="preview" embedded />
            </div>
          </div>
        </aside>
      </div>

      {planOpen && (
        <PlanDialog
          card={card}
          onClose={() => setPlanOpen(false)}
          onSaved={(updated) => {
            setCard(updated);
            onCardChange(updated);
            setPlanOpen(false);
          }}
        />
      )}
    </div>
  );
}

function PlanDialog({ card, onClose, onSaved }: { card: CardDetail; onClose: () => void; onSaved: (c: CardDetail) => void }) {
  const [plan, setPlan] = useState<CardPlan>(card.plan);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      const updated = await api<CardDetail>(`/admin/cards/${card.id}`, { method: "PATCH", body: { plan } });
      toast.success(`Package changed to ${plan === "business" ? "Business" : "Starter"}`);
      onSaved(updated);
    } catch (err) {
      toast.error(errorMessage(err));
      setSaving(false);
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title="Package"
      description="Changing the package takes effect on the live card immediately. Content is never deleted — hidden features come back if you switch again."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={saving} disabled={plan === card.plan} onClick={submit}>
            Change package
          </Button>
        </>
      }
    >
      <div className="pb-2">
        <PlanPicker value={plan} onChange={setPlan} />
      </div>
    </Dialog>
  );
}
