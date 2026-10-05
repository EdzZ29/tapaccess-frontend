"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PlanPicker } from "@/components/admin/plan";
import { SlugField, useSlugCheck } from "@/components/admin/slug-field";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { PageHeader, Panel } from "@/components/ui/panel";
import { api, ApiError, errorMessage } from "@/lib/api";
import type { CardDetail, CardPlan } from "@/lib/types";
import { slugify } from "@/lib/utils";

export default function NewCardPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [plan, setPlan] = useState<CardPlan>("business");
  const [category, setCategory] = useState("");
  const [cardCode, setCardCode] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const check = useSlugCheck(slug);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setCodeError(null);
    try {
      const card = await api<CardDetail>("/admin/cards", {
        method: "POST",
        body: { businessName, slug, plan, category: category || null, cardCode: cardCode || undefined, notes: notes || null },
      });
      toast.success(`Card ${card.cardCode} created. Now design its profile.`);
      router.push(`/admin/cards/${card.id}/edit`);
    } catch (err) {
      if (err instanceof ApiError && /card id/i.test(err.message)) setCodeError(err.message);
      else toast.error(errorMessage(err));
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="New card" description="Create the record first. You'll design the public profile next.">
        <Link href="/admin/cards" className="mb-3 inline-flex items-center gap-1 text-sm text-ink-2 hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Cards
        </Link>
      </PageHeader>

      <form onSubmit={submit}>
        <Panel className="space-y-5 p-5 sm:p-6">
          <Field label="Business name">
            {(p) => (
              <Input
                {...p}
                autoFocus
                required
                maxLength={120}
                placeholder="ActiveZone Fitness"
                value={businessName}
                onChange={(e) => {
                  setBusinessName(e.target.value);
                  if (!slugTouched) setSlug(slugify(e.target.value));
                }}
              />
            )}
          </Field>

          <SlugField
            value={slug}
            onChange={(v) => {
              setSlugTouched(true);
              setSlug(v);
            }}
            check={check}
          />
          <p className="-mt-3 text-xs text-ink-3">
            This becomes the card&apos;s permanent address. You can change it until the card is first activated.
          </p>

          <div className="space-y-2">
            <p className="text-sm font-medium text-ink">Package</p>
            <PlanPicker value={plan} onChange={setPlan} />
            <p className="text-xs text-ink-3">You can change the package later; switching never deletes content.</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Category" optional>
              {(p) => <Input {...p} maxLength={80} placeholder="Gym & Fitness" value={category} onChange={(e) => setCategory(e.target.value)} />}
            </Field>
            <Field label="Card ID" optional hint="Leave empty to auto-number (TA-000001…)" error={codeError}>
              {(p) => (
                <Input
                  {...p}
                  maxLength={32}
                  placeholder="Auto"
                  className="font-mono uppercase"
                  value={cardCode}
                  onChange={(e) => setCardCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))}
                />
              )}
            </Field>
          </div>

          <Field label="Internal notes" optional hint="Only visible to admins — never shown on the public page.">
            {(p) => <Textarea {...p} rows={3} maxLength={5000} value={notes} onChange={(e) => setNotes(e.target.value)} />}
          </Field>
        </Panel>

        <div className="mt-4 flex justify-end gap-2">
          <Button onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" variant="primary" loading={saving} disabled={!businessName.trim() || !check.ok}>
            Create card
          </Button>
        </div>
      </form>
    </div>
  );
}
