"use client";

import { CircleCheck, CircleX, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Field, Input } from "@/components/ui/field";
import { api } from "@/lib/api";
import { SITE_URL } from "@/lib/utils";

export interface SlugCheck {
  state: "idle" | "checking" | "available" | "unavailable";
  reason: string | null;
  ok: boolean;
}

const IDLE: SlugCheck = { state: "idle", reason: null, ok: false };
const CHECKING: SlugCheck = { state: "checking", reason: null, ok: false };

/** Debounced availability check against the API (format, reserved words, uniqueness). */
export function useSlugCheck(slug: string, excludeId?: string): SlugCheck {
  // Results are stored with the slug they belong to; anything else is
  // "checking" until its own answer arrives.
  const [result, setResult] = useState<{ slug: string; check: SlugCheck } | null>(null);

  useEffect(() => {
    if (!slug) return;
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      api<{ available: boolean; reason: string | null }>("/admin/cards/slug-availability", {
        query: { slug, excludeId },
        signal: ctrl.signal,
      })
        .then((r) => setResult({ slug, check: { state: r.available ? "available" : "unavailable", reason: r.reason, ok: r.available } }))
        .catch((err: Error) => {
          if (err.name !== "AbortError") setResult({ slug, check: IDLE });
        });
    }, 350);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [slug, excludeId]);

  if (!slug) return IDLE;
  return result?.slug === slug ? result.check : CHECKING;
}

export function SlugField({
  value,
  onChange,
  check,
  disabled,
  hint,
}: {
  value: string;
  onChange: (v: string) => void;
  check: SlugCheck;
  disabled?: boolean;
  hint?: string;
}) {
  const status =
    check.state === "checking" ? (
      <Loader2 className="h-4 w-4 animate-spin text-ink-3" aria-label="Checking availability" />
    ) : check.state === "available" ? (
      <CircleCheck className="h-4 w-4 text-success-ink" aria-label="Available" />
    ) : check.state === "unavailable" ? (
      <CircleX className="h-4 w-4 text-danger" aria-label="Not available" />
    ) : null;

  return (
    <Field
      label="Public slug"
      error={check.state === "unavailable" ? check.reason : null}
      hint={hint ?? `${SITE_URL.replace(/^https?:\/\//, "")}/c/${value || "your-slug"}`}
    >
      {(p) => (
        <div className="relative">
          <Input
            {...p}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-{2,}/g, "-").slice(0, 64))}
            className="pr-9 font-mono"
            spellCheck={false}
            autoComplete="off"
          />
          <span className="absolute inset-y-0 right-3 flex items-center">{status}</span>
        </div>
      )}
    </Field>
  );
}
