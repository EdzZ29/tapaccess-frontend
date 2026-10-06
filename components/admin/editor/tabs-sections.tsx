"use client";

import { ChevronDown, ChevronRight, ImagePlus, Lock, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PlanLock } from "@/components/admin/plan";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LIMITS, SECTION_META } from "@/lib/constants";
import { sectionAllowed, sectionAlwaysOn } from "@/lib/plans";
import type { CardPlan, SectionItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { RowControls, TextInput } from "./controls";
import { ImagePicker, uploadImage } from "./image-picker";
import { emptyItem, move, rowKey, type EditorDoc, type Keyed } from "./model";
import { UpgradeButton } from "./tabs-profile";

type SectionRow = EditorDoc["sections"][number];

const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);

export function SectionsTab({
  doc,
  setDoc,
  cardId,
  plan,
  onUpgrade,
}: {
  doc: EditorDoc;
  setDoc: (fn: (d: EditorDoc) => EditorDoc) => void;
  cardId: string;
  plan: CardPlan;
  onUpgrade: () => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const setSections = (fn: (s: SectionRow[]) => SectionRow[]) => setDoc((d) => ({ ...d, sections: fn(d.sections) }));
  const patch = (i: number, p: Partial<SectionRow>) => setSections((s) => s.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const locked = doc.sections.some((s) => !sectionAllowed(plan, s.type));

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-2">Turn sections on or off and set their order on the page. Empty sections are hidden automatically.</p>
      {locked && (
        <PlanLock action={<UpgradeButton onClick={onUpgrade} />}>
          Starter cards show <strong className="text-ink">Links</strong>, <strong className="text-ink">About</strong>,{" "}
          <strong className="text-ink">Quick Actions</strong> and <strong className="text-ink">Social Media</strong>. Other sections are kept but hidden
          until the card moves to Business.
        </PlanLock>
      )}
      <ul className="space-y-2">
        {doc.sections.map((s, i) => {
          const meta = SECTION_META[s.type];
          const allowed = sectionAllowed(plan, s.type);
          const auto = allowed && sectionAlwaysOn(plan, s.type);
          const expanded = open === s.type && allowed;
          return (
            <li key={s.type} className={cn("rounded-xl border border-line bg-surface", !allowed && "bg-surface-2")}>
              <div className="flex items-center gap-2 px-3 py-2.5">
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-2 text-left disabled:cursor-default"
                  onClick={() => setOpen(expanded ? null : s.type)}
                  aria-expanded={expanded}
                  disabled={!allowed}
                >
                  {allowed ? (
                    expanded ? <ChevronDown className="h-4 w-4 shrink-0 text-ink-3" /> : <ChevronRight className="h-4 w-4 shrink-0 text-ink-3" />
                  ) : (
                    <Lock className="h-4 w-4 shrink-0 text-ink-3" aria-label="Business package" />
                  )}
                  <span className="min-w-0">
                    <span className={cn("block truncate text-sm font-medium", allowed ? "text-ink" : "text-ink-3")}>
                      {s.title || meta.label}
                      {meta.hasItems && s.items.length > 0 && <span className="ml-1.5 text-xs font-normal text-ink-3">{s.items.length}</span>}
                    </span>
                    <span className="block truncate text-xs text-ink-3">{auto ? "Always shown on Starter when filled in" : meta.description}</span>
                  </span>
                </button>
                <Switch
                  size="sm"
                  srOnlyLabel
                  checked={auto || s.enabled}
                  onChange={(v) => patch(i, { enabled: v })}
                  label={`Show ${meta.label}`}
                  disabled={!allowed || auto}
                />
                <RowControls index={i} count={doc.sections.length} label={meta.label} onMove={(d) => setSections((l) => move(l, i, d))} />
              </div>
              {expanded && (
                <div className="space-y-4 border-t border-line px-4 py-4">
                  {meta.defaultTitle !== "" && (
                    <TextInput
                      label="Section heading"
                      value={s.title}
                      onChange={(v) => patch(i, { title: v })}
                      placeholder={meta.defaultTitle}
                      maxLength={120}
                    />
                  )}
                  {meta.hasItems ? (
                    <ItemsEditor section={s} cardId={cardId} onChange={(items) => patch(i, { items })} />
                  ) : (
                    <p className="text-sm text-ink-3">{meta.description}.</p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ItemsEditor({ section, cardId, onChange }: { section: SectionRow; cardId: string; onChange: (items: Keyed<SectionItem>[]) => void }) {
  const meta = SECTION_META[section.type];
  const fields = meta.itemFields ?? [];
  const items = section.items;
  const set = (i: number, p: Partial<SectionItem>) => onChange(items.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const isGallery = section.type === "gallery";
  const [uploading, setUploading] = useState(false);
  const full = items.length >= LIMITS.itemsPerSection;

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    const added: Keyed<SectionItem>[] = [];
    const room = LIMITS.itemsPerSection - items.length;
    if (files.length > room) {
      toast.warning(`Only ${room} more photo${room === 1 ? "" : "s"} fit`, {
        description: `A gallery holds up to ${LIMITS.itemsPerSection} photos, so ${files.length - room} of the ${files.length} selected were skipped.`,
      });
    }
    for (const file of Array.from(files).slice(0, room)) {
      try {
        const asset = await uploadImage(file, "gallery", cardId);
        added.push({ ...emptyItem(), title: file.name.replace(/\.[^.]+$/, "").slice(0, 160) || "Photo", imageUrl: asset.url });
      } catch (err) {
        toast.error(`Couldn't add "${file.name}"`, { description: (err as Error).message, duration: 10_000 });
      }
    }
    if (added.length) {
      onChange([...items, ...added]);
      toast.success(`${added.length} photo${added.length > 1 ? "s" : ""} added`);
    }
    setUploading(false);
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={rowKey(item)} className={cn("space-y-3 rounded-lg border border-line p-3", !item.enabled && "opacity-60")}>
          <div className="flex items-start gap-2">
            <TextInput
              className="flex-1"
              label={isGallery ? "Caption" : "Title"}
              value={item.title}
              onChange={(v) => set(i, { title: v ?? "" })}
              maxLength={160}
              placeholder={isGallery ? "Describes the photo for screen readers" : `Name of the ${meta.itemNoun}`}
            />
            {fields.includes("price") && (
              <TextInput className="w-32" label="Price" value={item.price} onChange={(v) => set(i, { price: v })} maxLength={40} placeholder="$25" />
            )}
          </div>
          {fields.includes("description") && (
            <TextInput label="Description" value={item.description} onChange={(v) => set(i, { description: v })} multiline rows={2} maxLength={2000} />
          )}
          {fields.includes("imageUrl") && (
            <ImagePicker
              label={isGallery ? "Photo" : "Image"}
              value={item.imageUrl}
              onChange={(v) => set(i, { imageUrl: v })}
              kind={isGallery ? "gallery" : "item"}
              cardId={cardId}
              aspect={section.type === "promotions" ? "wide" : "square"}
            />
          )}
          {(fields.includes("link") || fields.includes("badge")) && (
            <div className="grid gap-3 sm:grid-cols-3">
              {fields.includes("link") && (
                <>
                  <TextInput className="sm:col-span-2" label="Link" value={item.linkUrl} onChange={(v) => set(i, { linkUrl: v })} placeholder="https://…" maxLength={2048} mono />
                  <TextInput label="Link text" value={item.linkLabel} onChange={(v) => set(i, { linkLabel: v })} placeholder="Learn more" maxLength={40} />
                </>
              )}
              {fields.includes("badge") && (
                <TextInput label="Badge" value={item.badge} onChange={(v) => set(i, { badge: v })} placeholder="New" maxLength={40} />
              )}
            </div>
          )}
          {fields.includes("dates") && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-ink">Show from</span>
                <input
                  type="datetime-local"
                  value={toLocalInput(item.startsAt)}
                  onChange={(e) => set(i, { startsAt: fromLocalInput(e.target.value) })}
                  className="block h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-ink">Hide after</span>
                <input
                  type="datetime-local"
                  value={toLocalInput(item.endsAt)}
                  onChange={(e) => set(i, { endsAt: fromLocalInput(e.target.value) })}
                  className="block h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink"
                />
              </label>
            </div>
          )}
          <div className="flex items-center justify-between">
            <Switch size="sm" checked={item.enabled} onChange={(v) => set(i, { enabled: v })} label="Visible" />
            <RowControls
              index={i}
              count={items.length}
              label={item.title || `${meta.itemNoun} ${i + 1}`}
              onMove={(d) => onChange(move(items, i, d))}
              onRemove={() => onChange(items.filter((_, j) => j !== i))}
            />
          </div>
        </div>
      ))}

      <div className="flex flex-wrap gap-2">
        {isGallery ? (
          <label className={cn("inline-flex cursor-pointer", (full || uploading) && "pointer-events-none opacity-50")}>
            <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="sr-only" onChange={(e) => void addPhotos(e.target.files)} />
            <span className="inline-flex h-8 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink shadow-sm hover:bg-surface-2">
              <ImagePlus className="h-4 w-4" /> {uploading ? "Uploading…" : "Upload photos"}
            </span>
          </label>
        ) : (
          <Button size="sm" icon={<Plus className="h-4 w-4" />} disabled={full} onClick={() => onChange([...items, emptyItem()])}>
            Add {meta.itemNoun}
          </Button>
        )}
      </div>
    </div>
  );
}
