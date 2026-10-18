"use client";

/* eslint-disable @next/next/no-img-element -- thumbnails of our own pre-sized uploads */

import { ArrowLeft, ArrowRight, EyeOff, ImageOff, ImagePlus, Loader2, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import { Dialog } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { errorMessage } from "@/lib/api";
import { LIMITS } from "@/lib/constants";
import type { SectionItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TextInput } from "./controls";
import { ACCEPT, uploadImage, useMediaTarget } from "./image-picker";
import { emptyItem, move, newKey, PHOTO_FALLBACK_TITLE, rowKey, type Keyed } from "./model";

export type Photo = Keyed<SectionItem>;
/** Changes go through an updater, so uploads that finish later add to the newest list. */
export type PhotosUpdate = (fn: (items: Photo[]) => Photo[]) => void;

const shortName = (name: string) => (name.length > 32 ? `${name.slice(0, 29)}…` : name);
/** The photo's own description; the automatic fallback title counts as none. */
const description = (photo: Photo) => (photo.title.trim() === PHOTO_FALLBACK_TITLE ? "" : photo.title.trim());

/**
 * A photo gallery editor made for people, not admins: add many photos at
 * once (or drag them in), see them as a grid in card order, and move, hide,
 * describe, replace or remove each one. The controls sit under each photo,
 * never on top of it.
 */
export function GalleryManager({
  items,
  update,
  cardId,
  onAdded,
}: {
  items: Photo[];
  update: PhotosUpdate;
  cardId: string;
  /** Called after photos were added (e.g. to switch the gallery on). */
  onAdded?: (count: number) => void;
}) {
  const target = useMediaTarget();
  const confirm = useConfirm();
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ key: string; name: string }[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const uploading = pending.length > 0;
  const free = LIMITS.itemsPerSection - items.length;
  const editingIndex = editing ? items.findIndex((p) => rowKey(p) === editing) : -1;
  /** The photo the card shows first (and largest). */
  const firstShown = items.findIndex((p) => p.enabled && p.imageUrl);

  /** Applies a change to one photo, found by key (its position may have changed). */
  const patch = (key: string, change: Partial<SectionItem>) =>
    update((list) => list.map((p) => (rowKey(p) === key ? { ...p, ...change } : p)));
  const shift = (key: string, delta: -1 | 1) =>
    update((list) => {
      const i = list.findIndex((p) => rowKey(p) === key);
      return i === -1 ? list : move(list, i, delta);
    });

  async function remove(key: string) {
    const ok = await confirm({
      title: "Remove this photo?",
      description: "It comes off the gallery when you save. You can add it again later.",
      confirmLabel: "Remove photo",
      tone: "danger",
    });
    if (!ok) return;
    update((list) => list.filter((p) => rowKey(p) !== key));
    setEditing((e) => (e === key ? null : e));
  }

  async function addFiles(list: FileList | null) {
    const files = Array.from(list ?? []);
    if (input.current) input.current.value = "";
    if (files.length === 0 || uploading) return;
    if (free <= 0) {
      toast.error(`Your gallery is full (${LIMITS.itemsPerSection} photos)`, { description: "Remove a photo to make room for another." });
      return;
    }
    const batch = files.slice(0, free);
    if (files.length > free) {
      toast.warning(`Only ${free} more photo${free === 1 ? "" : "s"} fit`, {
        description: `A gallery holds up to ${LIMITS.itemsPerSection} photos, so ${files.length - free} of the ${files.length} you chose were skipped.`,
      });
    }
    const queue = batch.map((f) => ({ key: newKey(), name: f.name }));
    setPending(queue);
    let added = 0;
    for (const [i, file] of batch.entries()) {
      try {
        const asset = await uploadImage(file, "gallery", cardId, target);
        const photo: Photo = { ...emptyItem(), imageUrl: asset.url };
        update((current) => (current.length >= LIMITS.itemsPerSection ? current : [...current, photo]));
        added++;
      } catch (err) {
        toast.error(`Couldn't add "${shortName(file.name)}"`, { description: errorMessage(err), duration: 10_000 });
      } finally {
        setPending((p) => p.filter((x) => x.key !== queue[i].key));
      }
    }
    if (added > 0) {
      toast.success(`${added} photo${added > 1 ? "s" : ""} added`, { description: "Save your changes to put them on the card." });
      onAdded?.(added);
    }
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!uploading && free > 0) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center gap-3 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors",
          dragOver ? "border-brand bg-brand-soft" : "border-line-strong bg-surface-2/50",
        )}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand-ink">
          <ImagePlus className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink">{items.length === 0 ? "No photos yet" : "Add more photos"}</p>
          <p className="mt-0.5 text-xs text-ink-3">Choose several at once, or drag them here. JPEG, PNG, WebP, GIF or AVIF.</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          disabled={uploading || free <= 0}
          onClick={() => input.current?.click()}
        >
          {uploading ? `Uploading ${pending.length} photo${pending.length > 1 ? "s" : ""}…` : free <= 0 ? "Gallery is full" : "Choose photos"}
        </Button>
        <p className="text-xs text-ink-3 tabular-nums">
          {items.length} of {LIMITS.itemsPerSection} photos
        </p>
        <input ref={input} type="file" multiple accept={ACCEPT} className="sr-only" tabIndex={-1} onChange={(e) => void addFiles(e.target.files)} />
      </div>

      {(items.length > 0 || uploading) && (
        <>
          {items.length > 1 && <p className="text-xs text-ink-3">The first photo is shown largest. Use the arrows to change the order.</p>}
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {items.map((photo, i) => {
              const key = rowKey(photo);
              const n = i + 1;
              return (
                <li key={key} className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-surface">
                  <button
                    type="button"
                    onClick={() => setEditing(key)}
                    className="relative block aspect-square w-full overflow-hidden bg-surface-2 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none focus-visible:ring-inset"
                    aria-label={`Edit photo ${n}`}
                  >
                    {photo.imageUrl ? (
                      <img
                        src={photo.imageUrl}
                        alt={photo.title}
                        loading="lazy"
                        decoding="async"
                        className={cn("h-full w-full object-cover transition-opacity", !photo.enabled && "opacity-35 grayscale")}
                      />
                    ) : (
                      <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-xs text-ink-3">
                        <ImageOff className="h-5 w-5" aria-hidden /> No photo
                      </span>
                    )}
                  </button>
                  <div className="flex min-w-0 items-center gap-1.5 px-2.5 pt-2 text-xs">
                    <span className="font-semibold text-ink tabular-nums">{n}</span>
                    <span className={cn("truncate", photo.enabled ? "text-ink-3" : "font-medium text-warning-ink")}>
                      {!photo.enabled ? "Hidden" : i === firstShown ? "Shown first" : description(photo)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-y-1 px-1 pt-0.5 pb-1">
                    <div className="flex">
                      <Button size="icon-sm" variant="ghost" disabled={i === 0} onClick={() => shift(key, -1)} aria-label={`Move photo ${n} earlier`}>
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        disabled={i === items.length - 1}
                        onClick={() => shift(key, 1)}
                        aria-label={`Move photo ${n} later`}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex">
                      <Button size="icon-sm" variant="ghost" onClick={() => setEditing(key)} aria-label={`Edit photo ${n}`} title="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon-sm" variant="danger-ghost" onClick={() => void remove(key)} aria-label={`Remove photo ${n}`} title="Remove">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
            {pending.map((p) => (
              <li key={p.key} className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-dashed border-line-strong bg-surface" aria-live="polite">
                <span className="flex aspect-square w-full flex-col items-center justify-center gap-2 bg-surface-2 text-ink-3">
                  <Loader2 className="h-6 w-6 animate-spin text-brand" aria-hidden />
                  <span className="text-xs">Uploading…</span>
                </span>
                <span className="truncate px-2.5 py-2 text-xs text-ink-3">{p.name}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {editingIndex !== -1 && (
        <PhotoDialog
          photo={items[editingIndex]}
          index={editingIndex}
          count={items.length}
          cardId={cardId}
          onPatch={(change) => patch(editing!, change)}
          onRemove={() => void remove(editing!)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function PhotoDialog({
  photo,
  index,
  count,
  cardId,
  onPatch,
  onRemove,
  onClose,
}: {
  photo: Photo;
  index: number;
  count: number;
  cardId: string;
  onPatch: (change: Partial<SectionItem>) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const target = useMediaTarget();
  const input = useRef<HTMLInputElement>(null);
  const [replacing, setReplacing] = useState(false);

  async function replace(file: File | undefined) {
    if (input.current) input.current.value = "";
    if (!file) return;
    setReplacing(true);
    try {
      const asset = await uploadImage(file, "gallery", cardId, target);
      onPatch({ imageUrl: asset.url });
      toast.success("Photo replaced");
    } catch (err) {
      toast.error("Couldn't replace the photo", { description: errorMessage(err), duration: 10_000 });
    } finally {
      setReplacing(false);
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      size="md"
      title={`Photo ${index + 1} of ${count}`}
      footer={
        <Button variant="primary" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className="space-y-4 pb-2">
        <div className="relative flex h-56 items-center justify-center overflow-hidden rounded-xl bg-surface-2 sm:h-64">
          {photo.imageUrl ? (
            <img src={photo.imageUrl} alt={photo.title} className={cn("h-full w-full object-contain", !photo.enabled && "opacity-40 grayscale")} />
          ) : (
            <span className="flex flex-col items-center gap-1 text-sm text-ink-3">
              <ImageOff className="h-6 w-6" aria-hidden /> No photo yet
            </span>
          )}
          {replacing && (
            <span className="absolute inset-0 flex items-center justify-center bg-surface/70">
              <Loader2 className="h-6 w-6 animate-spin text-brand" aria-label="Uploading" />
            </span>
          )}
        </div>
        {!photo.enabled && (
          <p className="flex items-center gap-2 rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning-ink">
            <EyeOff className="h-4 w-4 shrink-0" aria-hidden /> Hidden: this photo is kept here but not shown on the card.
          </p>
        )}
        <TextInput
          label="Description (optional)"
          value={description(photo) || null}
          onChange={(v) => onPatch({ title: v ?? "" })}
          maxLength={160}
          placeholder="e.g. Our new dining area"
          hint="Read aloud to people who use screen readers."
        />
        <Switch checked={photo.enabled} onChange={(enabled) => onPatch({ enabled })} label="Show this photo on the card" />
        <div className="flex flex-wrap gap-2 border-t border-line pt-4">
          <Button size="sm" icon={<RefreshCw className="h-4 w-4" />} disabled={replacing} onClick={() => input.current?.click()}>
            {photo.imageUrl ? "Replace photo" : "Add photo"}
          </Button>
          <Button size="sm" variant="danger-ghost" icon={<Trash2 className="h-4 w-4" />} onClick={onRemove}>
            Remove photo
          </Button>
          <input ref={input} type="file" accept={ACCEPT} className="sr-only" tabIndex={-1} onChange={(e) => void replace(e.target.files?.[0])} />
        </div>
      </div>
    </Dialog>
  );
}
