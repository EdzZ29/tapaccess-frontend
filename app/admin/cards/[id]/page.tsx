"use client";

import {
  ArrowLeft,
  Eye,
  MoreHorizontal,
  MousePointerClick,
  Pencil,
  Power,
  Table2,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { CardAvatar } from "@/components/admin/card-avatar";
import { NfcSetupPanel } from "@/components/admin/nfc-setup";
import { OwnerAccessPanel } from "@/components/admin/owner-access";
import { useCardActions } from "@/components/admin/card-actions";
import { BarList, SERIES_LABEL, TimeSeriesChart, type SeriesKey } from "@/components/admin/charts";
import { PlanBadge, PlanPicker } from "@/components/admin/plan";
import { SlugField, useSlugCheck } from "@/components/admin/slug-field";
import { RangeFilter, Segmented, StatTile } from "@/components/admin/widgets";
import { Button, LinkButton } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import { ErrorState, Skeleton } from "@/components/ui/feedback";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Menu } from "@/components/ui/menu";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { Switch } from "@/components/ui/switch";
import { api, ApiError, errorMessage } from "@/lib/api";
import { socialLabel } from "@/lib/constants";
import type { CardAnalytics, CardDetail, CardPlan, SocialPlatform } from "@/lib/types";
import { cardUrl, formatDate } from "@/lib/utils";

const tz = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export default function CardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: card, error, mutate } = useSWR<CardDetail>(`/admin/cards/${id}`);
  const actions = useCardActions((updated) => (updated ? void mutate(updated, { revalidate: false }) : router.push("/admin/cards")));

  if (error) {
    return (
      <Panel>
        <ErrorState
          message={error instanceof ApiError && error.status === 404 ? "This card doesn't exist or was deleted." : errorMessage(error)}
          onRetry={() => mutate()}
        />
      </Panel>
    );
  }
  if (!card) return <DetailSkeleton />;

  const url = cardUrl(card.slug);

  return (
    <>
      <Link href="/admin/cards" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-2 hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Cards
      </Link>

      {/* Phones: name on its own row, actions full width underneath. */}
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-4 sm:flex-1">
          <CardAvatar card={card} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="line-clamp-2 text-xl font-semibold tracking-tight break-words text-ink sm:line-clamp-1 sm:text-2xl">{card.businessName}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-2">
              <StatusBadge status={card.status} />
              <PlanBadge plan={card.plan} />
              <span className="font-mono text-xs">{card.cardCode}</span>
              {card.category && <span>· {card.category}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2 [&>*:not(:last-child)]:flex-1 sm:[&>*:not(:last-child)]:flex-none">
          {card.status === "inactive" && (
            <Button icon={<Power className="h-4 w-4" />} onClick={() => actions.setStatus(card, "active")}>
              Activate
            </Button>
          )}
          <LinkButton href={`/admin/cards/${card.id}/edit`} variant="primary" icon={<Pencil className="h-4 w-4" />}>
            Edit profile
          </LinkButton>
          <Menu
            label="More actions"
            items={actions.menuItems(card, { includeNavigation: false })}
            trigger={(p) => (
              <Button size="icon" {...p}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            )}
          />
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <NfcSetupPanel card={card} url={url} />

        <DetailsPanel card={card} onSaved={(c) => void mutate(c, { revalidate: false })} />
      </div>

      <OwnerAccessPanel card={card} onChange={(c) => void mutate(c, { revalidate: false })} />

      <AnalyticsSection card={card} />
      {actions.dialogs}
    </>
  );
}

function DetailsPanel({ card, onSaved }: { card: CardDetail; onSaved: (c: CardDetail) => void }) {
  const confirm = useConfirm();
  const [editing, setEditing] = useState(false);
  const [cardCode, setCardCode] = useState(card.cardCode);
  const [slug, setSlug] = useState(card.slug);
  const [plan, setPlan] = useState<CardPlan>(card.plan);
  const [notes, setNotes] = useState(card.notes ?? "");
  const [featured, setFeatured] = useState(card.featured);
  const [saving, setSaving] = useState(false);
  const slugChanged = slug !== card.slug;
  const check = useSlugCheck(slugChanged ? slug : "", card.id);

  function startEditing() {
    setCardCode(card.cardCode);
    setSlug(card.slug);
    setPlan(card.plan);
    setNotes(card.notes ?? "");
    setFeatured(card.featured);
    setEditing(true);
  }

  async function save() {
    if (plan === "starter" && card.plan === "business") {
      const ok = await confirm({
        title: "Switch to the Starter package?",
        description:
          "The logo, photos, extra sections and social links other than Facebook will be hidden on the public page. The theme stays. Nothing is deleted, and switching back restores them.",
        confirmLabel: "Switch to Starter",
      });
      if (!ok) return;
    }
    if (slugChanged && card.slugForwards) {
      const ok = await confirm({
        title: "Change this card's address?",
        description: (
          <>
            The card moves to <span className="font-mono text-ink">/c/{slug}</span>. The old address{" "}
            <span className="font-mono text-ink">/c/{card.slug}</span> keeps working and forwards there, so NFC tags, QR codes and shared
            links don&apos;t need changing.
          </>
        ),
        confirmLabel: "Change address",
      });
      if (!ok) return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = { cardCode, notes: notes || null, plan, featured };
      if (slugChanged) body.slug = slug;
      const updated = await api<CardDetail>(`/admin/cards/${card.id}`, { method: "PATCH", body });
      toast.success("Card details saved");
      onSaved(updated);
      setEditing(false);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const rows: [string, React.ReactNode][] = [
    ["Card ID", <span key="code" className="font-mono">{card.cardCode}</span>],
    [
      "Slug",
      <span key="slug" className="inline-flex items-center gap-1.5 font-mono">
        {card.slug}
      </span>,
    ],
    ...(card.oldSlugs?.length
      ? ([
          [
            "Old addresses",
            <span key="old" className="font-mono text-xs text-ink-2" title="These forward to the current address">
              {card.oldSlugs.join(", ")} → forward here
            </span>,
          ],
        ] as [string, React.ReactNode][])
      : []),
    ["Package", <PlanBadge key="plan" plan={card.plan} />],
    ["Homepage", card.featured ? "Shown" : "Hidden"],
    ["Status", <StatusBadge key="status" status={card.status} />],
    ["Created", formatDate(card.createdAt, { dateStyle: "medium", timeStyle: "short" })],
    ["First activated", formatDate(card.firstActivatedAt, { dateStyle: "medium", timeStyle: "short" })],
    ["Last updated", formatDate(card.updatedAt, { dateStyle: "medium", timeStyle: "short" })],
  ];

  return (
    <Panel>
      <PanelHeader
        title="Card details"
        actions={
          !editing && (
            <Button size="sm" variant="ghost" icon={<Pencil className="h-3.5 w-3.5" />} onClick={startEditing}>
              Edit
            </Button>
          )
        }
      />
      {editing ? (
        <div className="space-y-4 p-5">
          <Field label="Card ID">
            {(p) => (
              <Input
                {...p}
                className="font-mono"
                value={cardCode}
                maxLength={32}
                onChange={(e) => setCardCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))}
              />
            )}
          </Field>
          <SlugField value={slug} onChange={setSlug} check={slugChanged ? check : { state: "idle", reason: null, ok: true }} />
          {slugChanged && card.slugForwards && (
            <p className="rounded-lg bg-brand-soft px-3 py-2 text-xs text-brand-ink">
              This card is live. The old address <span className="font-mono">/c/{card.slug}</span> will keep working and forward to the
              new one, so NFC tags and QR codes don&apos;t need rewriting.
            </p>
          )}
          <div className="space-y-2">
            <p className="text-sm font-medium text-ink">Package</p>
            <PlanPicker value={plan} onChange={setPlan} />
          </div>
          <div className="space-y-1">
            <Switch checked={featured} onChange={setFeatured} label="Show on the TapAccess homepage" />
            <p className="text-xs text-ink-3">
              Lists this business (name, category and logo) under &quot;Businesses on TapAccess&quot;. Only shown while the card is active.
            </p>
          </div>
          <Field label="Internal notes" optional>
            {(p) => <Textarea {...p} rows={4} value={notes} maxLength={5000} onChange={(e) => setNotes(e.target.value)} />}
          </Field>
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" loading={saving} disabled={(slugChanged && !check.ok) || cardCode.length < 2} onClick={save}>
              Save
            </Button>
          </div>
        </div>
      ) : (
        <dl className="divide-y divide-line text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-4 px-5 py-2.5">
              <dt className="text-ink-2">{k}</dt>
              <dd className="text-right text-ink">{v}</dd>
            </div>
          ))}
          <div className="px-5 py-3">
            <dt className="text-ink-2">Notes</dt>
            <dd className="mt-1 whitespace-pre-line text-ink">{card.notes || <span className="text-ink-3">No notes</span>}</dd>
          </div>
        </dl>
      )}
    </Panel>
  );
}

const DEVICE_LABEL: Record<string, string> = { mobile: "Mobile", tablet: "Tablet", desktop: "Desktop", unknown: "Unknown" };
const KIND_LABEL: Record<string, string> = { button: "Button", social: "Social", contact: "Contact", item: "Item" };

function AnalyticsSection({ card }: { card: CardDetail }) {
  const [days, setDays] = useState(30);
  const [metric, setMetric] = useState<SeriesKey>("visits");
  const [table, setTable] = useState(false);
  const { data, error, isValidating, mutate } = useSWR<CardAnalytics>([`/admin/analytics/cards/${card.id}`, { days, tz: tz() }]);

  return (
    <section className="mt-8" aria-labelledby="analytics-heading">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="analytics-heading" className="text-lg font-semibold text-ink">
          Analytics
        </h2>
        <RangeFilter value={days} onChange={setDays} />
      </div>

      {error ? (
        <Panel>
          <ErrorState message={errorMessage(error)} onRetry={() => mutate()} />
        </Panel>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <StatTile label="Visits" value={data?.totals.visits} icon={Eye} hint={`Last ${days} days`} />
            <StatTile label="Unique visitors" value={data?.totals.uniqueVisitors} icon={Users} hint="Counted per day" />
            <StatTile label="Clicks" value={data?.totals.clicks} icon={MousePointerClick} hint="Buttons, links & contact" />
            <StatTile label="All-time visits" value={data?.totals.allTimeVisits} icon={TrendingUp} hint={`Since ${formatDate(card.createdAt)}`} />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Panel className="lg:col-span-2">
              <PanelHeader
                title={`${SERIES_LABEL[metric]} over time`}
                actions={
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={table ? <TrendingUp className="h-4 w-4" /> : <Table2 className="h-4 w-4" />}
                    onClick={() => setTable((t) => !t)}
                  >
                    {table ? "Chart" : "Table"}
                  </Button>
                }
              />
              <div className="p-5">
                <div className="mb-4">
                  <Segmented
                    label="Metric"
                    value={metric}
                    onChange={setMetric}
                    options={(Object.keys(SERIES_LABEL) as SeriesKey[]).map((k) => ({ value: k, label: SERIES_LABEL[k] }))}
                  />
                </div>
                {data ? (
                  <TimeSeriesChart data={data.series} metric={metric} showTable={table} dimmed={isValidating} />
                ) : (
                  <Skeleton className="h-[220px] w-full" />
                )}
              </div>
            </Panel>

            <Panel>
              <PanelHeader title="Clicks by button" description={`Last ${days} days`} />
              <div className="p-5">
                {data ? (
                  <BarList
                    valueLabel="clicks"
                    empty="No clicks in this period."
                    rows={data.clicksByButton.map((c) => ({
                      key: c.key,
                      label: c.kind === "social" ? socialLabel(c.target as SocialPlatform) : c.label,
                      value: c.clicks,
                      meta: KIND_LABEL[c.kind] + (c.kind === "button" && !c.buttonId ? " · deleted" : ""),
                    }))}
                  />
                ) : (
                  <Skeleton className="h-40 w-full" />
                )}
              </div>
            </Panel>

            <Panel>
              <PanelHeader title="Devices" />
              <div className="p-5">
                {data ? (
                  <BarList
                    valueLabel="visits"
                    empty="No visits yet."
                    rows={data.devices.map((d) => ({ key: d.deviceType, label: DEVICE_LABEL[d.deviceType] ?? d.deviceType, value: d.visits }))}
                  />
                ) : (
                  <Skeleton className="h-24 w-full" />
                )}
              </div>
            </Panel>

            <Panel>
              <PanelHeader title="Referrers" description="Where link visits came from. NFC taps have none." />
              <div className="p-5">
                {data ? (
                  <BarList
                    valueLabel="visits"
                    empty="No referred visits. Most taps open the page directly."
                    rows={data.referrers.map((r) => ({ key: r.host, label: r.host, value: r.visits }))}
                  />
                ) : (
                  <Skeleton className="h-24 w-full" />
                )}
              </div>
            </Panel>

            <Panel className="p-5 text-sm text-ink-2">
              <h3 className="font-semibold text-ink">About these numbers</h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-4">
                <li>A visit counts when the page loads in a real browser. Crawlers and link previews are filtered out.</li>
                <li>Repeat views by the same visitor within 30 minutes count once.</li>
                <li>Unique visitors reset daily. No IPs or cookies are stored, so one person on two days counts twice.</li>
                <li>Ad blockers can hide some visits. Your own views while signed in are not counted.</li>
              </ul>
            </Panel>
          </div>
        </>
      )}
    </section>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-64 lg:col-span-2" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
