"use client";

import { Plus } from "lucide-react";
import { useId, useState } from "react";
import { PlanLock } from "@/components/admin/plan";
import { ButtonIcon, SocialIcon } from "@/components/profile/icons";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input, Select } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { BUTTON_ICONS, BUTTON_LABEL_PRESETS, LIMITS, SOCIAL_PLATFORMS, VCARD_ACTION } from "@/lib/constants";
import { PLAN_FEATURES, socialAllowed } from "@/lib/plans";
import type { CardPlan, SocialPlatform } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EditorCard, RowControls, TextInput } from "./controls";
import { move, newKey, rowKey, type LinksDoc } from "./model";
import { UpgradeButton } from "./tabs-profile";

export function ButtonsTab({
  doc,
  setDoc,
  plan,
  onUpgrade,
}: {
  doc: LinksDoc;
  setDoc: (fn: (d: LinksDoc) => LinksDoc) => void;
  plan: CardPlan;
  onUpgrade: () => void;
}) {
  const [iconFor, setIconFor] = useState<number | null>(null);
  const setButtons = (fn: (b: LinksDoc["buttons"]) => LinksDoc["buttons"]) => setDoc((d) => ({ ...d, buttons: fn(d.buttons) }));
  const setSocial = (fn: (b: LinksDoc["socialLinks"]) => LinksDoc["socialLinks"]) => setDoc((d) => ({ ...d, socialLinks: fn(d.socialLinks) }));
  const allowedPlatforms = SOCIAL_PLATFORMS.filter((p) => socialAllowed(plan, p.value));
  const usedPlatforms = new Set(doc.socialLinks.map((s) => s.platform));

  return (
    <div className="space-y-4">
      <EditorCard
        title="Call-to-action buttons"
        description="The first two appear as large buttons in the header; the rest are listed further down. Links, phone numbers (tel:), email (mailto:) and SMS are supported."
        actions={
          <Button
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            disabled={doc.buttons.length >= LIMITS.buttons}
            onClick={() => setButtons((b) => [...b, { _key: newKey(), label: "", url: "", icon: "link", enabled: true, highlighted: false }])}
          >
            Add button
          </Button>
        }
      >
        {doc.buttons.length === 0 && <p className="py-4 text-center text-sm text-ink-3">No buttons yet. Add one for bookings, menus, orders…</p>}
        {doc.buttons.map((b, i) => (
          <div key={rowKey(b)} className={cn("rounded-lg border border-line p-3", !b.enabled && "opacity-60")}>
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => setIconFor(i)}
                className="mt-6 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-2 text-ink hover:border-brand"
                aria-label={`Choose icon for button ${i + 1} (current: ${b.icon})`}
              >
                <ButtonIcon name={b.icon} className="h-5 w-5" />
              </button>
              <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
                <LabelField
                  label={b.label}
                  url={b.url}
                  onChange={(patch) => setButtons((list) => list.map((x, j) => (j === i ? { ...x, ...patch } : x)))}
                />
                {b.url === VCARD_ACTION ? (
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-ink">Link</p>
                    <p className="flex min-h-10 items-center rounded-lg border border-dashed border-line-strong bg-surface-2 px-3 text-sm text-ink-2">
                      Saves this card&apos;s contact details to the visitor&apos;s phone. Set automatically.
                    </p>
                  </div>
                ) : (
                  <TextInput
                    label="Link"
                    value={b.url}
                    onChange={(v) => setButtons((list) => list.map((x, j) => (j === i ? { ...x, url: v ?? "" } : x)))}
                    maxLength={2048}
                    placeholder={presetFor(b.label)?.linkHint ?? "https://… or tel:+1…"}
                    mono
                  />
                )}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pl-[52px]">
              <div className="flex flex-wrap gap-4">
                <Switch size="sm" checked={b.enabled} onChange={(v) => setButtons((l) => l.map((x, j) => (j === i ? { ...x, enabled: v } : x)))} label="Visible" />
                <Switch
                  size="sm"
                  checked={b.highlighted}
                  onChange={(v) => setButtons((l) => l.map((x, j) => (j === i ? { ...x, highlighted: v } : x)))}
                  label="Highlight"
                />
              </div>
              <RowControls
                index={i}
                count={doc.buttons.length}
                label={b.label || `button ${i + 1}`}
                onMove={(d) => setButtons((l) => move(l, i, d))}
                onRemove={() => setButtons((l) => l.filter((_, j) => j !== i))}
              />
            </div>
          </div>
        ))}
      </EditorCard>

      <EditorCard
        title="Social links"
        description="Shown in the Social Media section."
        actions={
          <Button
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            disabled={doc.socialLinks.length >= LIMITS.socialLinks || (plan === "starter" && allowedPlatforms.every((p) => usedPlatforms.has(p.value)))}
            onClick={() => {
              const platform = allowedPlatforms.find((p) => !usedPlatforms.has(p.value))?.value ?? "other";
              setSocial((s) => [...s, { _key: newKey(), platform, url: "", label: null, enabled: true }]);
            }}
          >
            Add link
          </Button>
        }
      >
        {PLAN_FEATURES[plan].socialPlatforms !== "all" && (
          <PlanLock action={<UpgradeButton onClick={onUpgrade} />}>
            Starter cards can show <strong className="text-ink">Facebook, Instagram, TikTok and X</strong>. Other networks are part of the Business
            package; any you add are kept but hidden until the card is upgraded.
          </PlanLock>
        )}
        <>
            {doc.socialLinks.length === 0 && <p className="py-4 text-center text-sm text-ink-3">No social links yet.</p>}
            {doc.socialLinks.map((s, i) => (
              <div key={rowKey(s)} className={cn("flex flex-wrap items-end gap-3 rounded-lg border border-line p-3", !s.enabled && "opacity-60")}>
                <span className="mb-2 flex h-6 w-6 items-center justify-center text-ink-2">
                  <SocialIcon platform={s.platform} className="h-5 w-5" />
                </span>
                <label className="w-36 space-y-1.5">
                  <span className="text-sm font-medium text-ink">Platform</span>
                  <Select
                    value={s.platform}
                    onChange={(e) => setSocial((l) => l.map((x, j) => (j === i ? { ...x, platform: e.target.value as SocialPlatform } : x)))}
                  >
                    {SOCIAL_PLATFORMS.filter((p) => socialAllowed(plan, p.value) || p.value === s.platform).map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                        {socialAllowed(plan, p.value) ? "" : " (Business)"}
                      </option>
                    ))}
                  </Select>
                </label>
                <TextInput
                  className="min-w-48 flex-1"
                  label="URL"
                  value={s.url}
                  onChange={(v) => setSocial((l) => l.map((x, j) => (j === i ? { ...x, url: v ?? "" } : x)))}
                  placeholder={SOCIAL_PLATFORMS.find((p) => p.value === s.platform)?.placeholder}
                  maxLength={2048}
                  mono
                />
                {s.platform === "other" && (
                  <TextInput
                    className="w-36"
                    label="Label"
                    value={s.label}
                    onChange={(v) => setSocial((l) => l.map((x, j) => (j === i ? { ...x, label: v } : x)))}
                    maxLength={40}
                  />
                )}
                {!socialAllowed(plan, s.platform) && <span className="pb-2.5 text-xs font-medium text-warning-ink">Hidden on Starter</span>}
                <div className="flex items-center gap-2 pb-1">
                  <Switch
                    size="sm"
                    srOnlyLabel
                    checked={s.enabled}
                    onChange={(v) => setSocial((l) => l.map((x, j) => (j === i ? { ...x, enabled: v } : x)))}
                    label="Visible"
                  />
                  <RowControls
                    index={i}
                    count={doc.socialLinks.length}
                    label={`${s.platform} link`}
                    onMove={(d) => setSocial((l) => move(l, i, d))}
                    onRemove={() => setSocial((l) => l.filter((_, j) => j !== i))}
                  />
                </div>
              </div>
            ))}
        </>
      </EditorCard>

      <Dialog open={iconFor !== null} onClose={() => setIconFor(null)} title="Choose an icon" size="md">
        <div className="grid grid-cols-6 gap-2 pb-3 sm:grid-cols-8">
          {BUTTON_ICONS.map((name) => {
            const selected = iconFor !== null && doc.buttons[iconFor]?.icon === name;
            return (
              <button
                key={name}
                type="button"
                title={name}
                aria-label={name}
                aria-pressed={selected}
                onClick={() => {
                  setButtons((l) => l.map((x, j) => (j === iconFor ? { ...x, icon: name } : x)));
                  setIconFor(null);
                }}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-lg border text-ink hover:border-brand hover:text-brand",
                  selected ? "border-brand bg-brand-soft text-brand-ink" : "border-line",
                )}
              >
                <ButtonIcon name={name} className="h-5 w-5" />
              </button>
            );
          })}
        </div>
      </Dialog>
    </div>
  );
}

const CUSTOM = "__custom";
const presetFor = (label: string) => BUTTON_LABEL_PRESETS.find((p) => p.label === label);
const PRESET_GROUPS = [...new Set(BUTTON_LABEL_PRESETS.map((p) => p.group))];

/**
 * Label picker: common call-to-action labels in a dropdown (choosing one also
 * sets a matching icon), with a "Custom label" escape hatch for anything else.
 */
function LabelField({
  label,
  url,
  onChange,
}: {
  label: string;
  url: string;
  onChange: (patch: { label?: string; icon?: string; url?: string }) => void;
}) {
  const id = useId();
  const [custom, setCustom] = useState(() => label !== "" && !presetFor(label));

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        Label
      </label>
      <Select
        id={id}
        value={custom ? CUSTOM : label}
        onChange={(e) => {
          if (e.target.value === CUSTOM) {
            setCustom(true);
            return;
          }
          setCustom(false);
          const preset = presetFor(e.target.value);
          if (!preset) return;
          // Presets like "Save contact" bring their own link; leaving one clears it.
          if (preset.fixedUrl) onChange({ label: preset.label, icon: preset.icon, url: preset.fixedUrl });
          else if (url === VCARD_ACTION) onChange({ label: preset.label, icon: preset.icon, url: "" });
          else onChange({ label: preset.label, icon: preset.icon });
        }}
      >
        <option value="" disabled>
          Choose a label…
        </option>
        {PRESET_GROUPS.map((group) => (
          <optgroup key={group} label={group}>
            {BUTTON_LABEL_PRESETS.filter((p) => p.group === group).map((p) => (
              <option key={p.label} value={p.label}>
                {p.label}
              </option>
            ))}
          </optgroup>
        ))}
        <option value={CUSTOM}>Custom label…</option>
      </Select>
      {custom && (
        <Input
          aria-label="Custom label"
          value={label}
          maxLength={60}
          autoFocus={label === ""}
          placeholder="Type your own label"
          onChange={(e) => onChange({ label: e.target.value })}
        />
      )}
    </div>
  );
}
