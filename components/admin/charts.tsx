"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DailyPoint } from "@/lib/types";
import { cn, formatCount } from "@/lib/utils";

/**
 * Chart conventions (dataviz reference): one series per chart in slot-1
 * blue, 2px line, ~10% area wash, hairline solid gridlines, crosshair +
 * tooltip on hover/keyboard, value labels in text tokens, and a table view.
 */

const H = 220;
const M = { top: 16, right: 16, bottom: 26, left: 40 };

function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0, 1];
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const ticks: number[] = [];
  for (let v = 0; v <= max + step * 0.001; v += step) ticks.push(Math.round(v * 100) / 100);
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
}

const shortDate = (iso: string) =>
  new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
const longDate = (iso: string) =>
  new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`),
  );

export type SeriesKey = "visits" | "uniqueVisitors" | "clicks";
export const SERIES_LABEL: Record<SeriesKey, string> = { visits: "Visits", uniqueVisitors: "Unique visitors", clicks: "Clicks" };

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

export function TimeSeriesChart({
  data,
  metric,
  showTable,
  dimmed,
}: {
  data: DailyPoint[];
  metric: SeriesKey;
  showTable: boolean;
  dimmed?: boolean;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const label = SERIES_LABEL[metric];

  const geo = useMemo(() => {
    const values = data.map((d) => d[metric]);
    const ticks = niceTicks(Math.max(...values, 0));
    const yMax = ticks[ticks.length - 1] || 1;
    const innerW = Math.max(width - M.left - M.right, 10);
    const innerH = H - M.top - M.bottom;
    const x = (i: number) => M.left + (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
    const y = (v: number) => M.top + innerH - (v / yMax) * innerH;
    const line = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
    const area = `${line}L${x(values.length - 1).toFixed(1)},${y(0)}L${x(0).toFixed(1)},${y(0)}Z`;
    const labelEvery = Math.max(1, Math.ceil(data.length / Math.max(2, Math.floor(innerW / 70))));
    return { values, ticks, x, y, line, area, labelEvery, innerW };
  }, [data, metric, width]);

  if (showTable) {
    return (
      <div className="max-h-[260px] overflow-auto rounded-lg border border-line">
        <table className="w-full text-sm">
          <caption className="sr-only">Daily {label.toLowerCase()}</caption>
          <thead className="sticky top-0 bg-surface-2 text-left text-xs text-ink-2">
            <tr>
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 text-right font-medium">Visits</th>
              <th className="px-3 py-2 text-right font-medium">Unique</th>
              <th className="px-3 py-2 text-right font-medium">Clicks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line tabular-nums">
            {[...data].reverse().map((d) => (
              <tr key={d.date}>
                <td className="px-3 py-1.5 text-ink-2">{longDate(d.date)}</td>
                <td className="px-3 py-1.5 text-right">{d.visits}</td>
                <td className="px-3 py-1.5 text-right">{d.uniqueVisitors}</td>
                <td className="px-3 py-1.5 text-right">{d.clicks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const last = data.length - 1;
  const pick = (clientX: number, rect: DOMRect) => {
    const px = clientX - rect.left - M.left;
    const i = Math.round((px / geo.innerW) * (data.length - 1));
    setActive(Math.min(Math.max(i, 0), last));
  };

  const a = active !== null ? data[active] : null;
  const ax = active !== null ? geo.x(active) : 0;

  return (
    <div ref={ref} className={cn("relative transition-opacity", dimmed && "opacity-60")}>
      {width > 0 && data.length > 0 && (
        <svg
          width={width}
          height={H}
          role="img"
          aria-label={`${label} per day, ${shortDate(data[0].date)} to ${shortDate(data[last].date)}. Use arrow keys to read values, or switch to the table view.`}
          tabIndex={0}
          className="block touch-pan-y outline-none focus-visible:ring-2 focus-visible:ring-brand/40 rounded-md"
          onPointerMove={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
          onPointerDown={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
          onPointerLeave={() => setActive(null)}
          onBlur={() => setActive(null)}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
              e.preventDefault();
              setActive((i) => Math.min(Math.max((i ?? last) + (e.key === "ArrowRight" ? 1 : -1), 0), last));
            }
          }}
        >
          {geo.ticks.map((t) => (
            <g key={t}>
              <line x1={M.left} x2={width - M.right} y1={geo.y(t)} y2={geo.y(t)} stroke="var(--chart-grid)" strokeWidth={1} />
              <text x={M.left - 8} y={geo.y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--chart-axis)" className="tabular-nums">
                {formatCount(t)}
              </text>
            </g>
          ))}
          {data.map((d, i) =>
            // Regular ticks, plus the latest day; drop a tick that would collide with it.
            (i % geo.labelEvery === 0 && last - i >= geo.labelEvery * 0.6) || i === last ? (
              <text
                key={d.date}
                x={geo.x(i)}
                y={H - 6}
                textAnchor={i === 0 ? "start" : i === last ? "end" : "middle"}
                fontSize={11}
                fill="var(--chart-axis)"
              >
                {shortDate(d.date)}
              </text>
            ) : null,
          )}
          <path d={geo.area} fill="var(--chart-1)" fillOpacity={0.1} />
          <path d={geo.line} fill="none" stroke="var(--chart-1)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {/* Direct label on the latest value only. */}
          {active === null && (
            <>
              <circle cx={geo.x(last)} cy={geo.y(geo.values[last])} r={4} fill="var(--chart-1)" stroke="var(--surface)" strokeWidth={2} />
              <text
                x={geo.x(last) - 8}
                y={geo.y(geo.values[last]) - 10}
                textAnchor="end"
                fontSize={12}
                fontWeight={600}
                fill="var(--ink)"
              >
                {formatCount(geo.values[last])}
              </text>
            </>
          )}
          {a && (
            <>
              <line x1={ax} x2={ax} y1={M.top} y2={H - M.bottom} stroke="var(--chart-axis)" strokeWidth={1} />
              <circle cx={ax} cy={geo.y(a[metric])} r={4} fill="var(--chart-1)" stroke="var(--surface)" strokeWidth={2} />
            </>
          )}
        </svg>
      )}
      {a && (
        <div
          role="status"
          className="pointer-events-none absolute top-0 z-10 rounded-lg border border-line bg-surface px-3 py-2 text-sm shadow-lg"
          style={{ left: Math.min(Math.max(ax - 70, 0), Math.max(width - 150, 0)), width: 150 }}
        >
          <div className="flex items-center gap-2">
            <span className="h-0.5 w-3 rounded-full bg-chart-1" aria-hidden />
            <span className="font-semibold text-ink">{formatCount(a[metric])}</span>
            <span className="text-ink-2">{label.toLowerCase()}</span>
          </div>
          <p className="mt-0.5 text-xs text-ink-3">{longDate(a.date)}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Horizontal bars for a ranked breakdown (one hue — it is magnitude, not
 * identity). Values sit at the bar tip; hovering a row shows its share.
 */
export function BarList({
  rows,
  valueLabel,
  empty,
}: {
  rows: { key: string; label: string; value: number; meta?: string }[];
  valueLabel: string;
  empty: string;
}) {
  const [hover, setHover] = useState<string | null>(null);
  if (rows.length === 0) return <p className="py-6 text-center text-sm text-ink-3">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  const total = rows.reduce((s, r) => s + r.value, 0);
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => {
        const pct = Math.round((r.value / total) * 100);
        return (
          <li
            key={r.key}
            tabIndex={0}
            onPointerEnter={() => setHover(r.key)}
            onPointerLeave={() => setHover(null)}
            onFocus={() => setHover(r.key)}
            onBlur={() => setHover(null)}
            className="group rounded-md outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            aria-label={`${r.label}: ${r.value} ${valueLabel} (${pct}%)`}
          >
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-ink">
                {r.label}
                {r.meta && <span className="ml-1.5 text-xs text-ink-3">{r.meta}</span>}
              </span>
              <span className="shrink-0 text-ink-2 tabular-nums">
                {hover === r.key ? <span className="mr-2 text-xs text-ink-3">{pct}%</span> : null}
                <span className="font-semibold text-ink">{formatCount(r.value)}</span>
              </span>
            </div>
            <div className="h-2.5 w-full">
              <div
                className={cn("h-full rounded-r bg-chart-1 transition-opacity", hover && hover !== r.key && "opacity-50")}
                style={{ width: `${Math.max((r.value / max) * 100, 1.5)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
