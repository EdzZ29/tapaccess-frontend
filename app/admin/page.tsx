"use client";

import { CircleCheck, CirclePause, CreditCard, Eye, Plus, Table2, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { CardAvatar } from "@/components/admin/card-avatar";
import { SERIES_LABEL, TimeSeriesChart, type SeriesKey } from "@/components/admin/charts";
import { useAdmin } from "@/components/admin/shell";
import { RangeFilter, Segmented, StatTile } from "@/components/admin/widgets";
import { Button, LinkButton } from "@/components/ui/button";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/feedback";
import { PageHeader, Panel, PanelHeader } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { errorMessage } from "@/lib/api";
import type { AnalyticsOverview, CardStats, CardSummary, Paginated } from "@/lib/types";
import { formatCount, formatRelative } from "@/lib/utils";

const tz = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export default function OverviewPage() {
  const admin = useAdmin();
  const [days, setDays] = useState(30);
  const [metric, setMetric] = useState<SeriesKey>("visits");
  const [table, setTable] = useState(false);

  const stats = useSWR<CardStats>("/admin/cards/stats");
  const overview = useSWR<AnalyticsOverview>(["/admin/analytics/overview", { days, tz: tz() }]);
  const recent = useSWR<Paginated<CardSummary>>(["/admin/cards", { sort: "updatedAt", order: "desc", pageSize: 5 }]);

  const noCards = stats.data && stats.data.totalCards + stats.data.archived === 0;

  return (
    <>
      <PageHeader
        title={admin ? `Welcome back, ${admin.name.split(" ")[0]}` : "Overview"}
        description="How your cards are performing."
        actions={
          <LinkButton href="/admin/cards/new" variant="primary" icon={<Plus className="h-4 w-4" />}>
            New card
          </LinkButton>
        }
      />

      {stats.error ? (
        <Panel>
          <ErrorState message={errorMessage(stats.error)} onRetry={() => stats.mutate()} />
        </Panel>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <StatTile label="Total cards" value={stats.data?.totalCards} icon={CreditCard} hint={stats.data ? `${stats.data.byPlan.business} Business · ${stats.data.byPlan.starter} Starter` : undefined} />
          <StatTile label="Active cards" value={stats.data?.active} icon={CircleCheck} hint="Live public profiles" />
          <StatTile label="Inactive cards" value={stats.data?.inactive} icon={CirclePause} hint="Showing “unavailable”" />
          <StatTile label="Total profile visits" value={stats.data?.totalVisits} icon={Eye} hint="All time, bots excluded" />
        </div>
      )}

      {noCards ? (
        <Panel className="mt-6">
          <EmptyState
            icon={CreditCard}
            title="Create your first card"
            description="Set up a business profile, then write its permanent URL to an NFC tag with NFC Tools."
            action={
              <LinkButton href="/admin/cards/new" variant="primary" icon={<Plus className="h-4 w-4" />}>
                New card
              </LinkButton>
            }
          />
        </Panel>
      ) : (
        <>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <RangeFilter value={days} onChange={setDays} />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Panel className="lg:col-span-2">
              <PanelHeader
                title={`${SERIES_LABEL[metric]} over time`}
                description={
                  overview.data
                    ? `${formatCount(overview.data.totals.visits)} visits · ${formatCount(overview.data.totals.uniqueVisitors)} unique · ${formatCount(overview.data.totals.clicks)} clicks`
                    : "Loading…"
                }
                actions={
                  <Button size="sm" variant="ghost" icon={table ? <TrendingUp className="h-4 w-4" /> : <Table2 className="h-4 w-4" />} onClick={() => setTable((t) => !t)}>
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
                {overview.error ? (
                  <ErrorState message={errorMessage(overview.error)} onRetry={() => overview.mutate()} />
                ) : overview.data ? (
                  <TimeSeriesChart data={overview.data.series} metric={metric} showTable={table} dimmed={overview.isValidating} />
                ) : (
                  <Skeleton className="h-[220px] w-full" />
                )}
              </div>
            </Panel>

            <Panel>
              <PanelHeader title="Top cards" description={`Most visited, last ${days} days`} />
              <ul className="divide-y divide-line">
                {overview.data?.topCards.length === 0 && <li className="px-5 py-8 text-center text-sm text-ink-3">No visits in this period yet.</li>}
                {overview.data?.topCards.map((c, i) => (
                  <li key={c.cardId}>
                    <Link href={`/admin/cards/${c.cardId}`} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-2">
                      <span className="w-4 text-sm text-ink-3 tabular-nums">{i + 1}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink">{c.businessName}</span>
                        <span className="block truncate font-mono text-xs text-ink-3">/c/{c.slug}</span>
                      </span>
                      <span className="text-sm font-semibold text-ink tabular-nums">{formatCount(c.visits)}</span>
                    </Link>
                  </li>
                ))}
                {!overview.data &&
                  [0, 1, 2].map((i) => (
                    <li key={i} className="px-5 py-3">
                      <Skeleton className="h-9 w-full" />
                    </li>
                  ))}
              </ul>
            </Panel>
          </div>

          <Panel className="mt-4">
            <PanelHeader
              title="Recently updated"
              actions={
                <Link href="/admin/cards" className="text-sm font-medium text-brand hover:underline">
                  View all cards
                </Link>
              }
            />
            <ul className="divide-y divide-line">
              {recent.data?.data.map((c) => (
                <li key={c.id}>
                  <Link href={`/admin/cards/${c.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-2">
                    <CardAvatar card={c} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">{c.businessName}</span>
                      <span className="block truncate text-xs text-ink-3">
                        {c.cardCode} · updated {formatRelative(c.updatedAt)}
                      </span>
                    </span>
                    <StatusBadge status={c.status} />
                  </Link>
                </li>
              ))}
              {!recent.data &&
                [0, 1, 2].map((i) => (
                  <li key={i} className="px-5 py-3">
                    <Skeleton className="h-9 w-full" />
                  </li>
                ))}
            </ul>
          </Panel>
        </>
      )}
    </>
  );
}
