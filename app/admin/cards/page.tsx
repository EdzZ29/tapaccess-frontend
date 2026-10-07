"use client";

import { ArrowDown, ArrowUp, CreditCard, MoreHorizontal, Plus, Search, SearchX } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { CardAvatar } from "@/components/admin/card-avatar";
import { useCardActions } from "@/components/admin/card-actions";
import { PlanBadge } from "@/components/admin/plan";
import { CopyButton, Segmented } from "@/components/admin/widgets";
import { Button, LinkButton } from "@/components/ui/button";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/field";
import { Menu } from "@/components/ui/menu";
import { PageHeader, Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { errorMessage } from "@/lib/api";
import type { CardPlan, CardStatus, CardSummary, Paginated } from "@/lib/types";
import { cardUrl, cn, formatCount, formatDate } from "@/lib/utils";

type StatusFilter = "all" | CardStatus;
type Sort = "createdAt" | "updatedAt" | "businessName" | "cardCode" | "status";

const SORTS: { value: Sort; label: string }[] = [
  { value: "createdAt", label: "Date created" },
  { value: "updatedAt", label: "Last updated" },
  { value: "businessName", label: "Business name" },
  { value: "cardCode", label: "Card ID" },
  { value: "status", label: "Status" },
];

function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function CardsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [plan, setPlan] = useState<"" | CardPlan>("");
  const [sort, setSort] = useState<Sort>("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const q = useDebounced(search.trim());
  // The page number belongs to one combination of filters; changing any
  // filter starts again at page 1.
  const filterKey = JSON.stringify([q, status, plan, sort, order]);
  const [paging, setPaging] = useState({ key: filterKey, page: 1 });
  const page = paging.key === filterKey ? paging.page : 1;
  const setPage = (fn: (p: number) => number) => setPaging({ key: filterKey, page: fn(page) });

  const { data, error, isLoading, isValidating, mutate } = useSWR<Paginated<CardSummary>>([
    "/admin/cards",
    { search: q, status, plan, sort, order, page, pageSize: 20 },
  ]);
  const actions = useCardActions(() => void mutate());

  const filtered = Boolean(q || status !== "all" || plan);
  const rows = data?.data ?? [];

  return (
    <>
      <PageHeader
        title="Cards"
        description="Every NFC card you've issued. Changing a live card's slug keeps its old address forwarding."
        actions={
          <LinkButton href="/admin/cards/new" variant="primary" icon={<Plus className="h-4 w-4" />}>
            New card
          </LinkButton>
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative lg:w-80">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-3" aria-hidden />
          <Input
            type="search"
            placeholder="Search name, slug, card ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            aria-label="Search cards"
          />
        </div>
        <Segmented
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "All" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
            { value: "archived", label: "Archived" },
          ]}
        />
        <div className="flex gap-2 lg:ml-auto">
          <Select value={plan} onChange={(e) => setPlan(e.target.value as "" | CardPlan)} aria-label="Package" className="min-w-0 flex-1 lg:w-40 lg:flex-none">
            <option value="">All packages</option>
            <option value="business">Business</option>
            <option value="starter">Starter</option>
          </Select>
          <Select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort by" className="min-w-0 flex-1 lg:w-44 lg:flex-none">
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
          <Button
            size="icon"
            className="shrink-0"
            onClick={() => setOrder((o) => (o === "asc" ? "desc" : "asc"))}
            aria-label={order === "asc" ? "Ascending — switch to descending" : "Descending — switch to ascending"}
            title={order === "asc" ? "Ascending" : "Descending"}
          >
            {order === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <Panel className={cn("overflow-hidden transition-opacity", isValidating && !isLoading && "opacity-70")}>
        {error ? (
          <ErrorState message={errorMessage(error)} onRetry={() => mutate()} />
        ) : isLoading ? (
          <div className="divide-y divide-line">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          filtered ? (
            <EmptyState
              icon={SearchX}
              title="No cards match"
              description="Try a different search or clear the filters."
              action={
                <Button
                  onClick={() => {
                    setSearch("");
                    setStatus("all");
                    setPlan("");
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={CreditCard}
              title="No cards yet"
              description="Create a card, design its profile, then write the URL to an NFC tag."
              action={
                <LinkButton href="/admin/cards/new" variant="primary" icon={<Plus className="h-4 w-4" />}>
                  New card
                </LinkButton>
              }
            />
          )
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden w-full text-sm md:table">
              <thead className="border-b border-line bg-surface-2/60 text-left text-xs font-medium text-ink-2">
                <tr>
                  <th className="px-5 py-3 font-medium">Business</th>
                  <th className="px-3 py-3 font-medium">Card ID</th>
                  <th className="px-3 py-3 font-medium">Public URL</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 text-right font-medium">Visits</th>
                  <th className="px-3 py-3 font-medium">Created</th>
                  <th className="w-12 px-3 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((c) => (
                  <tr key={c.id} className="group hover:bg-surface-2/50">
                    <td className="px-5 py-3">
                      <Link href={`/admin/cards/${c.id}`} className="flex items-center gap-3">
                        <CardAvatar card={c} />
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-ink group-hover:text-brand">{c.businessName}</span>
                          <span className="mt-0.5 flex items-center gap-1.5">
                            <PlanBadge plan={c.plan} />
                            {c.category && <span className="truncate text-xs text-ink-3">{c.category}</span>}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-ink-2">{c.cardCode}</td>
                    <td className="px-3 py-3">
                      <span className="flex items-center gap-1">
                        <span className="max-w-[14rem] truncate font-mono text-xs text-ink-2">/c/{c.slug}</span>
                        <CopyButton text={cardUrl(c.slug)} size="icon-sm" what="Public URL" />
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-3 py-3 text-right text-ink tabular-nums">{formatCount(c.visitCount)}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-ink-2">{formatDate(c.createdAt)}</td>
                    <td className="px-3 py-3 text-right">
                      <RowMenu card={c} items={actions.menuItems(c)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile list */}
            <ul className="divide-y divide-line md:hidden">
              {rows.map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                  <Link href={`/admin/cards/${c.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <CardAvatar card={c} />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-ink">{c.businessName}</span>
                      <span className="block truncate font-mono text-xs text-ink-3">
                        {c.cardCode} · /c/{c.slug}
                      </span>
                      <span className="mt-1 flex gap-1.5">
                        <StatusBadge status={c.status} />
                        <PlanBadge plan={c.plan} />
                      </span>
                    </span>
                  </Link>
                  <RowMenu card={c} items={actions.menuItems(c)} />
                </li>
              ))}
            </ul>

            {data && data.meta.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-line px-5 py-3 text-sm text-ink-2">
                <span>
                  {(data.meta.page - 1) * data.meta.pageSize + 1}–{Math.min(data.meta.page * data.meta.pageSize, data.meta.total)} of{" "}
                  {data.meta.total}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </Button>
                  <Button size="sm" disabled={page >= data.meta.totalPages} onClick={() => setPage((p) => p + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Panel>
      {actions.dialogs}
    </>
  );
}

function RowMenu({ card, items }: { card: CardSummary; items: ReturnType<ReturnType<typeof useCardActions>["menuItems"]> }) {
  return (
    <Menu
      label={`Actions for ${card.businessName}`}
      items={items}
      trigger={(p) => (
        <Button size="icon-sm" variant="ghost" {...p}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      )}
    />
  );
}
