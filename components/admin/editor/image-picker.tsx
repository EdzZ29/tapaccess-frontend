"use client";

/* eslint-disable @next/next/no-img-element -- thumbnails of our own pre-sized uploads */

import { ImagePlus, Images, Loader2, Trash2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { api, ApiError, errorMessage } from "@/lib/api";
import { LIMITS } from "@/lib/constants";
import type { MediaAsset, MediaKind, Paginated } from "@/lib/types";
import { cn } from "@/lib/utils";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/avif";

/** Uploads above this are shrunk in the browser first (hosting caps requests at ~4.5 MB). */
const SHRINK_ABOVE_BYTES = 3.5 * 1024 * 1024;
const MAX_EDGE = 2560;

/**
 * Resizes a large photo in the browser before upload. The API re-encodes
 * every image to ≤1920 px WebP anyway, so nothing visible is lost — this only
 * keeps the request small enough for the hosting platform. Returns the
 * original file when it's already small or can't be decoded here.
 */
async function shrinkIfLarge(file: File): Promise<Blob> {
  if (file.size <= SHRINK_ABOVE_BYTES || file.type === "image/gif" || typeof createImageBitmap !== "function") return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const encode = (type: string, quality: number) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
    // WebP keeps transparency (logos); Safari can't encode it, so fall back to JPEG.
    let blob = await encode("image/webp", 0.9);
    if (!blob || blob.type !== "image/webp") blob = await encode("image/jpeg", 0.9);
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

export async function uploadImage(file: File, kind: MediaKind, cardId: string): Promise<MediaAsset> {
  if (!ACCEPT.split(",").includes(file.type)) throw new Error("Use a JPEG, PNG, WebP, GIF or AVIF image.");
  if (file.size > 25 * 1024 * 1024) throw new Error("This image is too large (over 25 MB).");
  const upload = await shrinkIfLarge(file);
  if (upload.size > LIMITS.uploadMb * 1024 * 1024 || upload.size > 4.4 * 1024 * 1024) {
    throw new Error("This image is still too large after resizing. Please choose a smaller photo.");
  }
  const form = new FormData();
  form.append("file", upload, upload === file ? file.name : file.name.replace(/\.[^.]+$/, "") + (upload.type === "image/webp" ? ".webp" : ".jpg"));
  form.append("kind", kind);
  form.append("cardId", cardId);
  return api<MediaAsset>("/admin/media", { method: "POST", body: form });
}

export function ImagePicker({
  label,
  value,
  onChange,
  kind,
  cardId,
  aspect = "square",
  hint,
}: {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  kind: MediaKind;
  cardId: string;
  aspect?: "square" | "wide";
  hint?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [library, setLibrary] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const asset = await uploadImage(file, kind, cardId);
      onChange(asset.url);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-ink">{label}</p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void onFile(e.dataTransfer.files[0]);
          }}
          className={cn(
            "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-line-strong bg-surface-2 text-ink-3 hover:border-brand hover:text-brand",
            aspect === "wide" ? "h-20 w-36" : "h-20 w-20",
          )}
          aria-label={value ? `Replace ${label.toLowerCase()}` : `Upload ${label.toLowerCase()}`}
        >
          {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="h-6 w-6" aria-hidden />}
          {busy && (
            <span className="absolute inset-0 flex items-center justify-center bg-surface/70">
              <Loader2 className="h-5 w-5 animate-spin text-brand" />
            </span>
          )}
        </button>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" icon={<Upload className="h-4 w-4" />} onClick={() => input.current?.click()} disabled={busy}>
            Upload
          </Button>
          <Button size="sm" variant="ghost" icon={<Images className="h-4 w-4" />} onClick={() => setLibrary(true)}>
            Library
          </Button>
          {value && (
            <Button size="sm" variant="danger-ghost" icon={<X className="h-4 w-4" />} onClick={() => onChange(null)}>
              Remove
            </Button>
          )}
        </div>
      </div>
      <p className="text-xs text-ink-3">{hint ?? `JPEG, PNG, WebP or GIF. Large photos are resized automatically.`}</p>
      <input ref={input} type="file" accept={ACCEPT} className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
      {library && (
        <MediaLibrary
          cardId={cardId}
          onClose={() => setLibrary(false)}
          onSelect={(url) => {
            onChange(url);
            setLibrary(false);
          }}
        />
      )}
    </div>
  );
}

export function MediaLibrary({ cardId, onClose, onSelect }: { cardId: string; onClose: () => void; onSelect: (url: string) => void }) {
  const confirm = useConfirm();
  const [scope, setScope] = useState<"card" | "all">("card");
  const { data, mutate } = useSWR<Paginated<MediaAsset>>(["/admin/media", { cardId: scope === "card" ? cardId : undefined, pageSize: 60 }]);

  async function remove(asset: MediaAsset) {
    const ok = await confirm({ title: "Delete this image?", description: "It is removed from storage permanently.", confirmLabel: "Delete", tone: "danger" });
    if (!ok) return;
    try {
      await api(`/admin/media/${asset.id}`, { method: "DELETE" });
      toast.success("Image deleted");
      void mutate();
    } catch (err) {
      if (err instanceof ApiError && err.code === "MEDIA_IN_USE") {
        const force = await confirm({
          title: "This image is in use",
          description: `${err.message} Deleting it will leave a blank space where it appears.`,
          confirmLabel: "Delete anyway",
          tone: "danger",
        });
        if (force) {
          await api(`/admin/media/${asset.id}`, { method: "DELETE", query: { force: true } })
            .then(() => {
              toast.success("Image deleted");
              void mutate();
            })
            .catch((e) => toast.error(errorMessage(e)));
        }
      } else toast.error(errorMessage(err));
    }
  }

  return (
    <Dialog open onClose={onClose} title="Image library" description="Pick an uploaded image." size="lg">
      <div className="mb-4 flex gap-2">
        {(["card", "all"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setScope(s)}
            className={cn("rounded-md px-3 py-1.5 text-sm font-medium", scope === s ? "bg-brand-soft text-brand-ink" : "text-ink-2 hover:bg-surface-2")}
          >
            {s === "card" ? "This card" : "All cards"}
          </button>
        ))}
      </div>
      {!data ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      ) : data.data.length === 0 ? (
        <EmptyState icon={Images} title="No images yet" description="Uploaded images appear here." />
      ) : (
        <ul className="grid grid-cols-3 gap-3 pb-2 sm:grid-cols-4">
          {data.data.map((a) => (
            <li key={a.id} className="group relative">
              <button
                onClick={() => onSelect(a.url)}
                className="block aspect-square w-full overflow-hidden rounded-lg border border-line bg-surface-2 hover:ring-2 hover:ring-brand"
                title={`${a.originalName ?? a.kind} · ${a.width}×${a.height}`}
              >
                <img src={a.url} alt={a.originalName ?? ""} loading="lazy" className="h-full w-full object-cover" />
              </button>
              <button
                onClick={() => remove(a)}
                className="absolute top-1.5 right-1.5 rounded-md bg-surface/90 p-1 text-danger opacity-0 shadow group-hover:opacity-100 focus:opacity-100"
                aria-label="Delete image"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <p className="mt-1 truncate text-xs text-ink-3">
                {a.kind} · {a.width}×{a.height}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}
