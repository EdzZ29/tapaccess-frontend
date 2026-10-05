"use client";

import { Check } from "lucide-react";
import { PlanLock } from "@/components/admin/plan";
import { Select } from "@/components/ui/field";
import { BACKGROUND_STYLES, BUTTON_SHAPES, BUTTON_STYLES, LAYOUTS, THEME_FONTS, THEME_PRESETS } from "@/lib/constants";
import { FONT_STACKS } from "@/lib/fonts";
import { PLAN_FEATURES } from "@/lib/plans";
import type { CardPlan, Theme, ThemeFont } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ColorInput, EditorCard } from "./controls";
import { ImagePicker } from "./image-picker";
import { UpgradeButton } from "./tabs-profile";

function Choice<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; description?: string }[];
  label: string;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-ink">{label}</p>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
              value === o.value ? "border-brand bg-brand-soft text-brand-ink" : "border-line text-ink hover:border-line-strong",
            )}
          >
            <span className="font-medium">{o.label}</span>
            {o.description && <span className="block text-xs text-ink-3">{o.description}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ThemeTab({
  theme,
  onChange,
  cardId,
  plan,
  onUpgrade,
}: {
  theme: Theme;
  onChange: (patch: Partial<Theme>) => void;
  cardId: string;
  plan: CardPlan;
  onUpgrade: () => void;
}) {
  const presets = (
    <EditorCard title="Presets" description="A starting point — every colour stays editable below.">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {THEME_PRESETS.map((p) => {
          const active = p.theme.primaryColor === theme.primaryColor && p.theme.backgroundColor === theme.backgroundColor;
          return (
            <button
              key={p.name}
              type="button"
              onClick={() => onChange(p.theme)}
              className={cn("rounded-lg border p-2 text-left text-xs font-medium text-ink", active ? "border-brand ring-2 ring-brand/20" : "border-line hover:border-line-strong")}
              aria-pressed={active}
            >
              <span className="relative flex h-10 overflow-hidden rounded-md" style={{ background: p.theme.backgroundColor }}>
                <span className="m-auto h-4 w-10 rounded-full" style={{ background: p.theme.primaryColor }} />
                <span className="absolute right-1 bottom-1 h-2.5 w-2.5 rounded-full" style={{ background: p.theme.accentColor }} />
                {active && <Check className="absolute top-1 left-1 h-3.5 w-3.5 text-brand" />}
              </span>
              <span className="mt-1.5 block">{p.name}</span>
            </button>
          );
        })}
      </div>
    </EditorCard>
  );

  const images = PLAN_FEATURES[plan].images;

  const font = (key: "fontHeading" | "fontBody", label: string) => (
    <label className="space-y-1.5">
      <span className="text-sm font-medium text-ink">{label}</span>
      <Select value={theme[key]} onChange={(e) => onChange({ [key]: e.target.value as ThemeFont })} style={{ fontFamily: FONT_STACKS[theme[key]] }}>
        {THEME_FONTS.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </Select>
    </label>
  );

  return (
    <div className="space-y-4">
      {presets}

      <EditorCard title="Colours">
        <div className="grid gap-4 sm:grid-cols-2">
          <ColorInput label="Primary (buttons, icons)" value={theme.primaryColor} onChange={(v) => onChange({ primaryColor: v })} />
          <ColorInput label="Accent (highlights, badges)" value={theme.accentColor} onChange={(v) => onChange({ accentColor: v })} />
          <ColorInput label="Background" value={theme.backgroundColor} onChange={(v) => onChange({ backgroundColor: v })} />
          <ColorInput label="Cards & panels" value={theme.surfaceColor} onChange={(v) => onChange({ surfaceColor: v })} />
          <ColorInput label="Text" value={theme.textColor} onChange={(v) => onChange({ textColor: v })} />
          <ColorInput label="Secondary text" value={theme.mutedTextColor} onChange={(v) => onChange({ mutedTextColor: v })} />
        </div>
      </EditorCard>

      <EditorCard title="Background">
        <Choice label="Style" value={theme.backgroundStyle} onChange={(v) => onChange({ backgroundStyle: v })} options={BACKGROUND_STYLES} />
        {theme.backgroundStyle === "gradient" && <ColorInput label="Gradient to" value={theme.gradientTo} onChange={(v) => onChange({ gradientTo: v })} />}
        {theme.backgroundStyle === "image" && !images && (
          <PlanLock action={<UpgradeButton onClick={onUpgrade} />}>
            Background photos are part of the <strong className="text-ink">Business</strong> package. This card shows the plain background colour.
          </PlanLock>
        )}
        {theme.backgroundStyle === "image" && images && (
          <ImagePicker
            label="Background image"
            value={theme.backgroundImageUrl}
            onChange={(v) => onChange({ backgroundImageUrl: v })}
            kind="background"
            cardId={cardId}
            aspect="wide"
            hint="Softened with the background colour so text stays readable."
          />
        )}
      </EditorCard>

      <EditorCard title="Typography">
        <div className="grid gap-4 sm:grid-cols-2">
          {font("fontHeading", "Headings")}
          {font("fontBody", "Body text")}
        </div>
      </EditorCard>

      <EditorCard title="Buttons & layout">
        <Choice label="Button style" value={theme.buttonStyle} onChange={(v) => onChange({ buttonStyle: v })} options={BUTTON_STYLES} />
        <Choice label="Button shape" value={theme.buttonShape} onChange={(v) => onChange({ buttonShape: v })} options={BUTTON_SHAPES} />
        <Choice label="Header layout" value={theme.layout} onChange={(v) => onChange({ layout: v })} options={LAYOUTS} />
      </EditorCard>
    </div>
  );
}
