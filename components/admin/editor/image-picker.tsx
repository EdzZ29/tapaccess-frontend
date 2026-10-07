"use client";

/* eslint-disable @next/next/no-img-element -- thumbnails of our own pre-sized uploads */

import { ImageOff, ImagePlus, Images, Loader2, Trash2, Upload, X } from "lucide-react";
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
 * every image to ≤1920 px WebP anyway, so nothing visible is lost, this only
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

const MAX_PICK_MB = 25;
const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/** What each kind of image should be, shown as the hint and used for the "may look blurry" check. */
const IMAGE_GUIDE: Record<MediaKind, { hint: string; minEdge: number; ideal: string }> = {
  logo: { hint: "Square image, at least 400 × 400 px.", minEdge: 200, ideal: "400 × 400 px" },
  cover: { hint: "Landscape photo, at least 1600 × 900 px.", minEdge: 1000, ideal: "1600 × 900 px" },
  background: { hint: "At least 1200 px wide.", minEdge: 800, ideal: "1600 px wide" },
  gallery: { hint: "At least 1200 px on the long side.", minEdge: 600, ideal: "1200 px" },
  item: { hint: "At least 800 px on the long side.", minEdge: 400, ideal: "800 px" },
  other: { hint: "At least 800 px on the long side.", minEdge: 400, ideal: "800 px" },
};

const FORMATS = "JPEG, PNG, WebP, GIF or AVIF";

/**
 * Checks the file, shrinks big photos and uploads it. Every failure throws
 * an Error whose message says what went wrong and what to do about it.
 */
export async function uploadImage(file: File, kind: MediaKind, cardId: string): Promise<MediaAsset> {
  const name = file.name.length > 40 ? `${file.name.slice(0, 37)}…` : file.name;
  if (/^image\/hei[cf]/.test(file.type) || /\.(heic|heif)$/i.test(file.name)) {
    throw new Error(
      `"${name}" is a HEIC photo (the iPhone camera default), which browsers can't use. Export it as JPEG, or on the iPhone set Settings → Camera → Formats → Most Compatible.`,
    );
  }
  if (/svg/.test(file.type) || /\.svg$/i.test(file.name)) {
    throw new Error(`"${name}" is an SVG. SVG files can carry scripts, so they aren't accepted. Export the logo as PNG instead.`);
  }
  if (!ACCEPT.split(",").includes(file.type)) {
    throw new Error(`"${name}" isn't a supported image${file.type ? ` (${file.type})` : ""}. Use ${FORMATS}.`);
  }
  if (file.size === 0) throw new Error(`"${name}" is empty (0 bytes). Choose another image.`);
  if (file.size > MAX_PICK_MB * 1024 * 1024) {
    throw new Error(`"${name}" is ${mb(file.size)}. The limit is ${MAX_PICK_MB} MB. Choose a smaller photo.`);
  }

  const upload = await shrinkIfLarge(file);
  const limit = Math.min(LIMITS.uploadMb * 1024 * 1024, 4.4 * 1024 * 1024);
  if (upload.size > limit) {
    throw new Error(
      upload === file && file.type === "image/gif"
        ? `This GIF is ${mb(file.size)}; animated GIFs can't be shrunk automatically and must be under ${mb(limit)}.`
        : `This image is still ${mb(upload.size)} after resizing (limit ${mb(limit)}). Choose a smaller photo or export it at a lower quality.`,
    );
  }

  const form = new FormData();
  form.append("file", upload, upload === file ? file.name : file.name.replace(/\.[^.]+$/, "") + (upload.type === "image/webp" ? ".webp" : ".jpg"));
  form.append("kind", kind);
  form.append("cardId", cardId);
  try {
    return await api<MediaAsset>("/admin/media", { method: "POST", body: form });
  } catch (err) {
    throw new Error(uploadErrorMessage(err));
  }
}

/** Server and network failures in plain words. The API's own messages are already specific. */
function uploadErrorMessage(err: unknown): string {
  if (!(err instanceof ApiError)) return errorMessage(err);
  if (err.code) return err.message; // A specific API error (invalid image, storage problem…).
  switch (err.status) {
    case 0:
      return "No connection. Check your internet and try again.";
    case 413:
      return "This image is too large to upload. Choose a smaller photo.";
    case 429:
      return "Too many uploads in a short time. Wait a minute, then try again.";
    case 502:
    case 503:
    case 504:
      return "The server is waking up or briefly unavailable. Wait a few seconds and try again.";
    default:
      return err.message;
  }
}

/** A gentle warning for images that will look soft on modern phones. */
function qualityNote(asset: MediaAsset, kind: MediaKind): string | null {
  const guide = IMAGE_GUIDE[kind];
  const long = Math.max(asset.width, asset.height);
  const short = Math.min(asset.width, asset.height);
  if ((kind === "logo" ? short : long) < guide.minEdge) {
    return `It's only ${asset.width} × ${asset.height} px, so it may look blurry. ${guide.ideal} or larger works best.`;
  }
  if (kind === "logo" && long / short > 1.5) {
    return `Logos are shown in a square, so this ${asset.width} × ${asset.height} px image will be cropped. A square version looks best.`;
  }
  return null;
}

interface StorageStatus {
  provider: string;
  problem: string | null;
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
  /** Kept on screen (not only a toast) so the reason can be read and acted on. */
  const [feedback, setFeedback] = useState<{ tone: "error" | "warning"; text: string } | null>(null);
  const [brokenUrl, setBrokenUrl] = useState<string | null>(null);
  // Shared by every picker on the page (SWR de-duplicates the request).
  const { data: storage } = useSWR<StorageStatus>("/admin/media/status", { revalidateOnFocus: false });
  const what = label.toLowerCase();

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setFeedback(null);
    try {
      const asset = await uploadImage(file, kind, cardId);
      onChange(asset.url);
      setBrokenUrl(null);
      const note = qualityNote(asset, kind);
      if (note) {
        setFeedback({ tone: "warning", text: `Uploaded. ${note}` });
        toast.warning(`${label} uploaded`, { description: note });
      } else {
        toast.success(`${label} uploaded`);
      }
    } catch (err) {
      const text = errorMessage(err);
      setFeedback({ tone: "error", text });
      toast.error(`Couldn't upload the ${what}`, { description: text, duration: 10_000 });
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
          {value && brokenUrl !== value ? (
            <img src={value} alt="" className="h-full w-full object-cover" onError={() => setBrokenUrl(value)} />
          ) : value ? (
            <ImageOff className="h-6 w-6 text-danger" aria-hidden />
          ) : (
            <ImagePlus className="h-6 w-6" aria-hidden />
          )}
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
      <p className="text-xs text-ink-3">
        {IMAGE_GUIDE[kind].hint} {FORMATS}, up to {MAX_PICK_MB} MB. Large photos are resized automatically.
        {hint && <> {hint}</>}
      </p>
      {storage?.problem && (
        <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">
          <strong className="font-semibold">Uploads won&apos;t work until image storage is fixed:</strong> {storage.problem}
        </p>
      )}
      {value && brokenUrl === value && (
        <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">
          This {what} can&apos;t be loaded. If it was just uploaded, the storage bucket may be private (Supabase → Storage → Edit bucket → Public
          bucket). Otherwise upload it again.
        </p>
      )}
      {feedback && (
        <p
          role={feedback.tone === "error" ? "alert" : "status"}
          className={cn(
            "flex items-start gap-2 rounded-lg px-3 py-2 text-xs",
            feedback.tone === "error" ? "bg-danger-soft text-danger" : "bg-warning-soft text-warning-ink",
          )}
        >
          <span className="flex-1">{feedback.text}</span>
          <button type="button" onClick={() => setFeedback(null)} className="shrink-0 opacity-70 hover:opacity-100" aria-label="Dismiss">
            <X className="h-3.5 w-3.5" />
          </button>
        </p>
      )}
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
