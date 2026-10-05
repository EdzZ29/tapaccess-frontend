"use client";

import { Check, Gem, Lock, Rocket } from "lucide-react";
import type { ReactNode } from "react";
import { PLAN_META } from "@/lib/plans";
import type { CardPlan } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS = { starter: Rocket, business: Gem } as const;

export function PlanBadge({ plan, className }: { plan: CardPlan; className?: string }) {
  const Icon = ICONS[plan];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        plan === "business" ? "bg-brand-soft text-brand-ink ring-brand/25" : "bg-surface-2 text-ink-2 ring-line-strong",
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {PLAN_META[plan].label}
    </span>
  );
}

/** Radio cards for choosing a package. */
export function PlanPicker({ value, onChange }: { value: CardPlan; onChange: (p: CardPlan) => void }) {
  return (
    <div role="radiogroup" aria-label="Package" className="grid gap-3 sm:grid-cols-2">
      {(Object.keys(PLAN_META) as CardPlan[]).map((plan) => {
        const meta = PLAN_META[plan];
        const Icon = ICONS[plan];
        const selected = value === plan;
        return (
          <button
            key={plan}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(plan)}
            className={cn(
              "rounded-xl border p-4 text-left transition-colors",
              selected ? "border-brand bg-brand-soft/60 ring-2 ring-brand/20" : "border-line bg-surface hover:border-line-strong",
            )}
          >
            <span className="flex items-center gap-2">
              <Icon className={cn("h-4 w-4", selected ? "text-brand" : "text-ink-3")} aria-hidden />
              <span className="font-semibold text-ink">{meta.label}</span>
            </span>
            <span className="mt-1 block text-xs text-ink-2">{meta.tagline}</span>
            <ul className="mt-3 space-y-1">
              {meta.features.map((f) => (
                <li key={f} className="flex items-start gap-1.5 text-xs text-ink-2">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success-ink" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
          </button>
        );
      })}
    </div>
  );
}

/** Shown in place of a control the card's package does not include. */
export function PlanLock({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-dashed border-line-strong bg-surface-2 px-4 py-3">
      <Lock className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" aria-hidden />
      <div className="min-w-0 flex-1 text-sm text-ink-2">{children}</div>
      {action}
    </div>
  );
}
