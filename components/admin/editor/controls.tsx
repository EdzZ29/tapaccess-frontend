"use client";

import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useId, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";
import { cn } from "@/lib/utils";

/** Text input bound to a nullable string: empty input stores `null`. */
export function TextInput({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  multiline,
  rows,
  hint,
  type = "text",
  inputMode,
  className,
  mono,
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
  placeholder?: string;
  maxLength?: number;
  multiline?: boolean;
  rows?: number;
  hint?: ReactNode;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  className?: string;
  mono?: boolean;
}) {
  const id = useId();
  const common = {
    id,
    value: value ?? "",
    placeholder,
    maxLength,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value === "" ? null : e.target.value),
  };
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="flex items-baseline justify-between text-sm font-medium text-ink">
        {label}
        {maxLength && multiline && (
          <span className="text-xs font-normal text-ink-3 tabular-nums">
            {(value ?? "").length}/{maxLength}
          </span>
        )}
      </label>
      {multiline ? (
        <Textarea {...common} rows={rows ?? 4} />
      ) : (
        <Input {...common} type={type} inputMode={inputMode} className={mono ? "font-mono text-xs" : undefined} />
      )}
      {hint && <p className="text-xs text-ink-3">{hint}</p>}
    </div>
  );
}

export function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <div className="flex h-10 items-center gap-2 rounded-lg border border-line bg-surface px-2 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} picker`}
          className="h-7 w-7 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
        />
        <input
          id={id}
          value={value}
          maxLength={7}
          spellCheck={false}
          onChange={(e) => {
            const v = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
            if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v.toLowerCase());
          }}
          onBlur={(e) => {
            if (!/^#[0-9a-f]{6}$/i.test(e.target.value)) onChange(value.length === 7 ? value : "#000000");
          }}
          className="w-full bg-transparent font-mono text-sm text-ink uppercase outline-none"
        />
      </div>
    </div>
  );
}

/** Up / down / delete controls for an ordered list row. */
export function RowControls({
  index,
  count,
  onMove,
  onRemove,
  label,
}: {
  index: number;
  count: number;
  onMove: (delta: -1 | 1) => void;
  onRemove?: () => void;
  label: string;
}) {
  return (
    <div className="flex shrink-0 items-center">
      <Button size="icon-sm" variant="ghost" disabled={index === 0} onClick={() => onMove(-1)} aria-label={`Move ${label} up`}>
        <ChevronUp className="h-4 w-4" />
      </Button>
      <Button size="icon-sm" variant="ghost" disabled={index === count - 1} onClick={() => onMove(1)} aria-label={`Move ${label} down`}>
        <ChevronDown className="h-4 w-4" />
      </Button>
      {onRemove && (
        <Button size="icon-sm" variant="danger-ghost" onClick={onRemove} aria-label={`Remove ${label}`}>
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export function EditorCard({ title, description, children, actions }: { title: string; description?: ReactNode; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-surface">
      <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-ink-3">{description}</p>}
        </div>
        {actions}
      </div>
      <div className="space-y-4 p-4">{children}</div>
    </section>
  );
}
