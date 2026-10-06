"use client";

import { Copy, MapPin } from "lucide-react";
import { PlanLock } from "@/components/admin/plan";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { WEEKDAYS } from "@/lib/constants";
import { PLAN_FEATURES } from "@/lib/plans";
import type { CardPlan, OpeningHoursDay, ProfileFields, TapAction } from "@/lib/types";
import { cn, mapsSearchUrl } from "@/lib/utils";
import { EditorCard, TextInput } from "./controls";
import { ImagePicker } from "./image-picker";
import { effectiveTapAction } from "./model";

export interface TabProps<T> {
  value: T;
  onChange: (patch: Partial<T>) => void;
  cardId: string;
  plan: CardPlan;
  onUpgrade: () => void;
}

export function ProfileTab({ value: p, onChange, cardId, plan, onUpgrade }: TabProps<ProfileFields>) {
  const images = PLAN_FEATURES[plan].images;
  return (
    <div className="space-y-4">
      <EditorCard title="Business">
        <TextInput label="Business name" value={p.businessName} onChange={(v) => onChange({ businessName: v ?? "" })} maxLength={120} />
        <TextInput
          label="Short description"
          value={p.tagline}
          onChange={(v) => onChange({ tagline: v })}
          maxLength={160}
          placeholder="e.g. Licensed plumber · same-day call-outs"
          hint="Shown under the business name at the top of the card."
        />
        <TextInput label="Category" value={p.category} onChange={(v) => onChange({ category: v })} maxLength={80} placeholder="e.g. Café, Dental clinic" />
        <TextInput
          label="About"
          value={p.description}
          onChange={(v) => onChange({ description: v })}
          multiline
          rows={6}
          maxLength={3000}
          placeholder="Tell visitors what makes this business special."
        />
      </EditorCard>

      <EditorCard title="Logo & cover" description="Shown at the top of the profile.">
        {images ? (
          <>
            <ImagePicker label="Logo" value={p.logoUrl} onChange={(v) => onChange({ logoUrl: v })} kind="logo" cardId={cardId} />
            <ImagePicker
              label="Cover image"
              value={p.coverUrl}
              onChange={(v) => onChange({ coverUrl: v })}
              kind="cover"
              cardId={cardId}
              aspect="wide"
              hint="Hidden with the Minimal layout."
            />
          </>
        ) : (
          <PlanLock action={<UpgradeButton onClick={onUpgrade} />}>
            Logos, cover images and photos are part of the <strong className="text-ink">Business</strong> package. Starter cards show the business initials instead.
          </PlanLock>
        )}
      </EditorCard>
    </div>
  );
}

export function UpgradeButton({ onClick }: { onClick: () => void }) {
  return (
    <Button size="sm" variant="secondary" onClick={onClick}>
      Change package
    </Button>
  );
}

const TAP_ACTIONS: { value: TapAction; label: string; description: string }[] = [
  { value: "profile", label: "Show the profile", description: "The page opens as usual." },
  { value: "save_contact", label: "Save contact", description: "Opens the phone's add-contact screen straight away." },
  { value: "call", label: "Call", description: "Shows a big Call button; some phones open the dialer by themselves." },
];

function TapActionCard({ value: p, onChange }: { value: ProfileFields; onChange: (patch: Partial<ProfileFields>) => void }) {
  const effective = effectiveTapAction(p);
  return (
    <EditorCard
      title="When the card is tapped"
      description="Phones never save a contact or dial without asking, so the visitor confirms with one tap. The profile is always one tap away."
    >
      <div role="radiogroup" aria-label="When the card is tapped" className="grid gap-2 sm:grid-cols-3">
        {TAP_ACTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={p.tapAction === o.value}
            onClick={() => onChange({ tapAction: o.value })}
            className={cn(
              "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
              p.tapAction === o.value ? "border-brand bg-brand-soft text-brand-ink" : "border-line text-ink hover:border-line-strong",
            )}
          >
            <span className="font-medium">{o.label}</span>
            <span className="block text-xs text-ink-3">{o.description}</span>
          </button>
        ))}
      </div>
      {effective !== p.tapAction && (
        <p role="status" className="rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning-ink">
          {p.tapAction === "call" ? "Add a phone number" : "Add a phone number or email"} above — until then a tap shows the profile.
        </p>
      )}
    </EditorCard>
  );
}

export function ContactTab({ value: p, onChange, plan, onUpgrade }: TabProps<ProfileFields>) {
  const full = PLAN_FEATURES[plan].sections === "all";
  const setDay = (day: number, patch: Partial<OpeningHoursDay>) =>
    onChange({ openingHours: p.openingHours.map((h) => (h.day === day ? { ...h, ...patch } : h)) });

  return (
    <div className="space-y-4">
      <EditorCard title="Contact details" description="Phone, WhatsApp, email and website also power the quick-action buttons and Save contact.">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Phone" value={p.phone} onChange={(v) => onChange({ phone: v })} type="tel" inputMode="tel" placeholder="+1 555 123 4567" maxLength={32} />
          <TextInput
            label="WhatsApp"
            value={p.whatsapp}
            onChange={(v) => onChange({ whatsapp: v })}
            type="tel"
            inputMode="tel"
            placeholder="With country code"
            maxLength={32}
          />
          <TextInput label="Email" value={p.email} onChange={(v) => onChange({ email: v })} type="email" placeholder="hello@business.com" maxLength={254} />
          <TextInput label="Website" value={p.website} onChange={(v) => onChange({ website: v })} placeholder="business.com" maxLength={2048} />
        </div>
        <TextInput label="Address" value={p.address} onChange={(v) => onChange({ address: v })} multiline rows={2} maxLength={500} />
        <div className="space-y-1.5">
          <TextInput
            label="Google Maps directions link"
            value={p.mapsUrl}
            onChange={(v) => onChange({ mapsUrl: v })}
            placeholder="https://maps.app.goo.gl/…"
            maxLength={2048}
            hint="Leave empty to search Google Maps for the address."
          />
          {p.address && !p.mapsUrl && (
            <Button size="sm" variant="ghost" icon={<MapPin className="h-4 w-4" />} onClick={() => onChange({ mapsUrl: mapsSearchUrl(p.address!) })}>
              Generate from address
            </Button>
          )}
        </div>
        <TextInput
          label="Google Reviews link"
          value={p.reviewsUrl}
          onChange={(v) => onChange({ reviewsUrl: v })}
          placeholder="https://g.page/r/…/review"
          maxLength={2048}
        />
      </EditorCard>

      <TapActionCard value={p} onChange={onChange} />

      <EditorCard
        title="Opening hours"
        description="Visitors see today highlighted and whether the business is open now."
        actions={
          full && (
            <Button
              size="sm"
              variant="ghost"
              icon={<Copy className="h-3.5 w-3.5" />}
              onClick={() => {
                const monday = p.openingHours.find((h) => h.day === 0)!;
                onChange({ openingHours: p.openingHours.map((h) => (h.day <= 4 ? { ...monday, day: h.day } : h)) });
              }}
            >
              Copy Monday to weekdays
            </Button>
          )
        }
      >
        {full ? (
          <>
            <div className="space-y-2">
              {[...p.openingHours]
                .sort((a, b) => a.day - b.day)
                .map((h) => (
                  <div key={h.day} className="flex flex-wrap items-center gap-3">
                    <span className="w-24 text-sm font-medium text-ink">{WEEKDAYS[h.day]}</span>
                    <Switch size="sm" checked={!h.closed} onChange={(open) => setDay(h.day, { closed: !open })} label={h.closed ? "Closed" : "Open"} />
                    {!h.closed && (
                      <span className="flex items-center gap-2">
                        <input
                          type="time"
                          value={h.open}
                          onChange={(e) => setDay(h.day, { open: e.target.value })}
                          className="h-9 rounded-lg border border-line bg-surface px-2 text-sm text-ink"
                          aria-label={`${WEEKDAYS[h.day]} opening time`}
                        />
                        <span className="text-ink-3">–</span>
                        <input
                          type="time"
                          value={h.close}
                          onChange={(e) => setDay(h.day, { close: e.target.value })}
                          className="h-9 rounded-lg border border-line bg-surface px-2 text-sm text-ink"
                          aria-label={`${WEEKDAYS[h.day]} closing time`}
                        />
                      </span>
                    )}
                  </div>
                ))}
            </div>
            <TextInput label="Note" value={p.hoursNote} onChange={(v) => onChange({ hoursNote: v })} maxLength={200} placeholder="e.g. Closed on public holidays" />
          </>
        ) : (
          <PlanLock action={<UpgradeButton onClick={onUpgrade} />}>
            Opening hours, location and reviews sections are part of the <strong className="text-ink">Business</strong> package.
          </PlanLock>
        )}
      </EditorCard>
    </div>
  );
}
