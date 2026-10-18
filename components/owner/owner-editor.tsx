"use client";

import { ExternalLink, Eye, Images, KeyRound, Link2, Loader2, LogOut, Palette, Pencil, RotateCcw, Save, UserRound } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { BrandLogo } from "@/components/brand";
import { EditorCard, TextInput } from "@/components/admin/editor/controls";
import { GalleryManager, type Photo } from "@/components/admin/editor/gallery-manager";
import { MediaTargetProvider, OWNER_MEDIA } from "@/components/admin/editor/image-picker";
import { galleryOverLimit, humanizeApiError, toPreview, withPhotoTitle, type EditorDoc, type Keyed, type LinksDoc } from "@/components/admin/editor/model";
import { ButtonsTab } from "@/components/admin/editor/tabs-buttons";
import { ProfileTab } from "@/components/admin/editor/tabs-profile";
import { ThemeTab } from "@/components/admin/editor/tabs-theme";
import { ProfileView } from "@/components/profile/profile-view";
import { Button } from "@/components/ui/button";
import { ConfirmProvider, useConfirm } from "@/components/ui/confirm";
import { Field, Input } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { api, ApiError, errorMessage } from "@/lib/api";
import type { CardButton, OwnerCard, ProfileFields, SocialLink, Theme } from "@/lib/types";
import { cn } from "@/lib/utils";

type Phase = { kind: "loading" } | { kind: "signin"; notice?: string } | { kind: "edit"; card: OwnerCard } | { kind: "error"; message: string };

interface OwnerDoc {
  profile: ProfileFields;
  gallery: { title: string | null; enabled: boolean; items: Photo[] };
  buttons: Keyed<CardButton>[];
  socialLinks: Keyed<SocialLink>[];
}

function toDoc(card: OwnerCard): OwnerDoc {
  const gallery = card.sections.find((s) => s.type === "gallery");
  return {
    profile: {
      ...structuredClone(card.profile),
      tapAction: card.profile.tapAction ?? "profile",
      extraPhones: card.profile.extraPhones ?? [],
      phoneLabel: card.profile.phoneLabel ?? null,
      alwaysOpen: card.profile.alwaysOpen ?? false,
    },
    gallery: {
      title: gallery?.title ?? null,
      enabled: gallery?.enabled ?? false,
      // A row without a photo shows nothing on the card; there is nothing to edit.
      items: structuredClone((gallery?.items ?? []).filter((i) => i.imageUrl)),
    },
    buttons: structuredClone(card.buttons),
    socialLinks: structuredClone(card.socialLinks),
  };
}

/** Drops the editor-only `_key` from new rows. */
function strip<T extends { _key?: string }>(row: T): Omit<T, "_key"> {
  const copy = { ...row };
  delete copy._key;
  return copy;
}

/** The theme without button style, button shape and layout, which stay with TapAccess. */
const ownerTheme = (t: Theme) => ({
  primaryColor: t.primaryColor,
  accentColor: t.accentColor,
  backgroundColor: t.backgroundColor,
  surfaceColor: t.surfaceColor,
  textColor: t.textColor,
  mutedTextColor: t.mutedTextColor,
  gradientTo: t.gradientTo,
  backgroundStyle: t.backgroundStyle,
  backgroundImageUrl: t.backgroundImageUrl,
  fontHeading: t.fontHeading,
  fontBody: t.fontBody,
});

/** Request body for PUT /owner/card: only what an owner may change. */
function toPayload(doc: OwnerDoc) {
  const p = doc.profile;
  return {
    profile: {
      businessName: p.businessName,
      tagline: p.tagline,
      description: p.description,
      category: p.category,
      logoUrl: p.logoUrl,
      coverUrl: p.coverUrl,
    },
    theme: ownerTheme(p.theme),
    gallery: {
      title: doc.gallery.title?.trim() ? doc.gallery.title : null,
      enabled: doc.gallery.enabled,
      items: doc.gallery.items
        .filter((i) => i.imageUrl)
        .map((i) => ({ ...(i.id ? { id: i.id } : {}), title: withPhotoTitle(i).title, imageUrl: i.imageUrl!, enabled: i.enabled })),
    },
    buttons: doc.buttons.map(strip),
    socialLinks: doc.socialLinks.map(strip),
  };
}

/**
 * The whole card with the owner's unsaved edits, for the live preview. Like
 * the API on save, it shows Quick Actions and Social Media when they have
 * something enabled.
 */
function previewDoc(doc: OwnerDoc, card: OwnerCard): EditorDoc {
  const gallery = { type: "gallery" as const, title: doc.gallery.title, enabled: doc.gallery.enabled, items: doc.gallery.items };
  const sections = card.sections.some((s) => s.type === "gallery") ? card.sections : [...card.sections, gallery];
  return {
    profile: doc.profile,
    sections: sections.map((s) => {
      if (s.type === "gallery") return { ...s, ...gallery };
      if (s.type === "actions" && doc.buttons.some((b) => b.enabled)) return { ...s, enabled: true };
      if (s.type === "social" && doc.socialLinks.some((l) => l.enabled)) return { ...s, enabled: true };
      return s;
    }),
    buttons: doc.buttons,
    socialLinks: doc.socialLinks,
  };
}

const TABS = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "gallery", label: "Gallery", icon: Images },
  { id: "links", label: "Buttons & links", icon: Link2 },
  { id: "theme", label: "Theme", icon: Palette },
] as const;
type TabId = (typeof TABS)[number]["id"];

const noop = () => undefined;

/**
 * Self-service editor for a card's owner (Business package): sign in with
 * the access code from TapAccess, then edit the profile, photo gallery,
 * buttons and links, and the theme's colours, background and fonts. Contact
 * details, hours, sections and the button style and layout stay with the admin.
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
    <MediaTargetProvider value={OWNER_MEDIA}>
      <ConfirmProvider>
        <div className="min-h-dvh bg-canvas text-ink">
          <header className="border-b border-line bg-surface">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
              <BrandLogo />
              <a
                href={`/c/${slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm font-medium text-ink-2 hover:text-ink"
              >
                <ExternalLink className="h-4 w-4" aria-hidden /> View card
              </a>
            </div>
          </header>

          <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
            {phase.kind === "loading" && (
              <div className="flex justify-center py-24 text-ink-3" role="status" aria-label="Loading">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
            {phase.kind === "error" && (
              <div className="mx-auto max-w-md rounded-xl border border-line bg-surface p-6 text-center">
                <p className="text-sm text-danger">{phase.message}</p>
                <Button className="mt-4" onClick={load}>
                  Try again
                </Button>
              </div>
            )}
            {phase.kind === "signin" && <SignIn slug={slug} businessName={businessName} notice={phase.notice} onSignedIn={show} />}
            {phase.kind === "edit" && <CardEditor card={phase.card} onSignedOut={(notice) => setSignedOut({ notice })} onSaved={show} />}
          </main>
        </div>
      </ConfirmProvider>
    </MediaTargetProvider>
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
      <p className="mt-1 text-sm text-ink-2">
        Enter the access code from TapAccess to change your profile, photos, buttons, links and colours.
      </p>
      {notice && <p className="mt-4 rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning-ink">{notice}</p>}
      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        <Field label="Access code" error={error ?? undefined}>
          {(props) => (
            <Input
              {...props}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
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
      <p className="mt-5 text-xs text-ink-3">Lost your code? Ask TapAccess to send it to you again.</p>
    </div>
  );
}

function CardEditor({
  card,
  onSaved,
  onSignedOut,
}: {
  card: OwnerCard;
  onSaved: (card: OwnerCard) => void;
  onSignedOut: (notice?: string) => void;
}) {
  const confirm = useConfirm();
  const [doc, setDoc] = useState<OwnerDoc>(() => toDoc(card));
  const [baseline, setBaseline] = useState(() => JSON.stringify(toPayload(toDoc(card))));
  const [tab, setTab] = useState<TabId>("profile");
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  const [saving, setSaving] = useState(false);
  const dirty = useMemo(() => JSON.stringify(toPayload(doc)) !== baseline, [doc, baseline]);
  const preview = useMemo(() => toPreview(previewDoc(doc, card), card.slug, card.plan), [doc, card]);

  const setProfile = (patch: Partial<ProfileFields>) => setDoc((d) => ({ ...d, profile: { ...d.profile, ...patch } }));
  const setTheme = (patch: Partial<Theme>) => setDoc((d) => ({ ...d, profile: { ...d.profile, theme: { ...d.profile.theme, ...patch } } }));
  const setLinks = (fn: (d: LinksDoc) => LinksDoc) => setDoc((d) => ({ ...d, ...fn({ buttons: d.buttons, socialLinks: d.socialLinks }) }));
  const setGallery = (patch: Partial<OwnerDoc["gallery"]>) => setDoc((d) => ({ ...d, gallery: { ...d.gallery, ...patch } }));
  const updatePhotos = (fn: (items: Photo[]) => Photo[]) =>
    setDoc((d) => {
      const items = fn(d.gallery.items);
      // New photos on a hidden gallery: show it, or they would never appear.
      const enabled = d.gallery.enabled || items.length > d.gallery.items.length;
      return { ...d, gallery: { ...d.gallery, items, enabled } };
    });

  const save = useCallback(async () => {
    if (!doc.profile.businessName.trim()) {
      setTab("profile");
      setMobileView("edit");
      toast.error(doc.profile.theme.layout === "personal" ? "Your name can't be empty" : "Your business name can't be empty");
      return;
    }
    const tooMany = galleryOverLimit(doc.gallery.items.length);
    if (tooMany) {
      setTab("gallery");
      setMobileView("edit");
      toast.error(tooMany);
      return;
    }
    const unnamed = doc.buttons.findIndex((b) => !b.label.trim() || !b.url.trim());
    if (unnamed !== -1) {
      setTab("links");
      setMobileView("edit");
      toast.error(`Button ${unnamed + 1} needs a label and a link`);
      return;
    }
    setSaving(true);
    try {
      const saved = await api<OwnerCard>("/owner/card", { method: "PUT", body: { ...toPayload(doc), baseUpdatedAt: card.updatedAt } });
      const next = toDoc(saved);
      setDoc(next);
      setBaseline(JSON.stringify(toPayload(next)));
      onSaved(saved);
      toast.success("Saved. Your card is updated");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onSignedOut(err.message);
        return;
      }
      if (err instanceof ApiError && err.code === "CARD_CHANGED") {
        toast.error("Your card was updated by TapAccess", {
          description: err.message,
          duration: 20_000,
          action: { label: "Reload", onClick: () => window.location.reload() },
        });
        return;
      }
      toast.error("Couldn't save", { description: err instanceof ApiError ? humanizeApiError(err.message) : errorMessage(err) });
    } finally {
      setSaving(false);
    }
  }, [doc, card.updatedAt, onSaved, onSignedOut]);

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

  async function discard() {
    const ok = await confirm({
      title: "Undo your unsaved changes?",
      description: "Everything goes back to how your card is now.",
      confirmLabel: "Undo changes",
      tone: "danger",
    });
    if (ok) setDoc(toDoc(card));
  }

  async function signOut() {
    if (dirty) {
      const ok = await confirm({ title: "Sign out without saving?", description: "Your unsaved changes will be lost.", confirmLabel: "Sign out", tone: "danger" });
      if (!ok) return;
    }
    await api("/owner/logout", { method: "POST" }).catch(() => undefined);
    onSignedOut();
  }

  const photoCount = doc.gallery.items.length;

  return (
    <div className="pb-28">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{doc.profile.businessName.trim() || card.businessName}</h1>
          <p className="mt-1 text-sm text-ink-2">
            Edit your card, check the preview, then save. For contact details or opening hours, contact TapAccess.
          </p>
        </div>
        <Button size="sm" variant="ghost" icon={<LogOut className="h-4 w-4" />} onClick={() => void signOut()}>
          Sign out
        </Button>
      </div>

      {/* Phones: switch between the form and the preview. */}
      <div className="mt-5 grid grid-cols-2 rounded-xl border border-line bg-surface p-1 lg:hidden" role="tablist" aria-label="View">
        {(["edit", "preview"] as const).map((v) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={mobileView === v}
            onClick={() => setMobileView(v)}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors",
              mobileView === v ? "bg-brand-soft text-brand-ink" : "text-ink-2",
            )}
          >
            {v === "edit" ? <Pencil className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
            {v === "edit" ? "Edit" : "Preview"}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <div className={cn("min-w-0", mobileView === "preview" && "hidden lg:block")}>
          <nav aria-label="What to edit" className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={(e) => {
                  setTab(t.id);
                  e.currentTarget.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "smooth" });
                }}
                aria-current={tab === t.id ? "page" : undefined}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                  tab === t.id ? "border-brand bg-brand-soft text-brand-ink" : "border-line bg-surface text-ink-2 hover:text-ink",
                )}
              >
                <t.icon className="h-4 w-4" aria-hidden />
                {t.label}
                {t.id === "gallery" && photoCount > 0 && <span className="text-xs font-normal opacity-70 tabular-nums">{photoCount}</span>}
              </button>
            ))}
          </nav>

          {/* Every panel stays mounted, so an upload in progress survives switching tabs. */}
          <div hidden={tab !== "profile"}>
            <ProfileTab value={doc.profile} onChange={setProfile} cardId="" plan={card.plan} onUpgrade={noop} />
          </div>
          <div hidden={tab !== "gallery"} className="space-y-4">
            <EditorCard title="Photo gallery" description="Photos of your place, products or work, shown as a grid on your card.">
              <Switch checked={doc.gallery.enabled} onChange={(enabled) => setGallery({ enabled })} label="Show the gallery on my card" />
              {!doc.gallery.enabled && photoCount > 0 && (
                <p role="status" className="rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning-ink">
                  The gallery is switched off, so these photos aren&apos;t on your card. Switch it on to show them.
                </p>
              )}
              <TextInput
                label="Heading"
                value={doc.gallery.title}
                onChange={(title) => setGallery({ title })}
                placeholder="Gallery"
                maxLength={120}
                hint="Shown above the photos. Leave empty for “Gallery”."
              />
            </EditorCard>
            <EditorCard title="Photos" description="Tap a photo to describe, hide, replace or remove it.">
              <GalleryManager items={doc.gallery.items} update={updatePhotos} cardId="" />
            </EditorCard>
          </div>
          <div hidden={tab !== "links"}>
            <ButtonsTab doc={{ buttons: doc.buttons, socialLinks: doc.socialLinks }} setDoc={setLinks} plan={card.plan} onUpgrade={noop} />
          </div>
          <div hidden={tab !== "theme"}>
            <ThemeTab theme={doc.profile.theme} onChange={setTheme} cardId="" plan={card.plan} onUpgrade={noop} allowLayout={false} />
          </div>
        </div>

        <aside aria-label="Live preview" className={cn("flex-col items-center lg:sticky lg:top-6 lg:flex", mobileView === "edit" ? "hidden" : "flex")}>
          <p className="mb-3 text-xs font-medium tracking-wide text-ink-3 uppercase">Preview · unsaved changes included</p>
          <div className="w-[360px] max-w-full overflow-hidden rounded-[2.25rem] border-[10px] border-slate-900 bg-slate-900 shadow-2xl">
            <div className="h-[min(720px,72dvh)] overflow-y-auto rounded-[1.6rem] bg-white">
              <ProfileView profile={preview} mode="preview" embedded />
            </div>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
          <span className={cn("min-w-0 truncate text-sm", dirty ? "font-medium text-warning-ink" : "text-ink-3")} aria-live="polite">
            {dirty ? "Unsaved changes" : card.lastEditAt ? `Saved ${new Date(card.lastEditAt).toLocaleString()}` : "No changes yet"}
          </span>
          <div className="flex shrink-0 items-center gap-2">
            {dirty && (
              <Button variant="ghost" icon={<RotateCcw className="h-4 w-4" />} onClick={() => void discard()} disabled={saving}>
                <span className="hidden sm:inline">Undo changes</span>
                <span className="sm:hidden">Undo</span>
              </Button>
            )}
            <Button variant="primary" icon={<Save className="h-4 w-4" />} loading={saving} disabled={!dirty} onClick={() => void save()}>
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
