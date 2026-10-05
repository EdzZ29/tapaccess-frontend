"use client";

import { Check, Copy, Download, type LucideIcon } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/feedback";
import { cn, formatCount } from "@/lib/utils";

/** Stat tile: label · value · optional context line. */
export function StatTile({
  label,
  value,
  icon: Icon,
  hint,
  loading,
}: {
  label: string;
  value: number | undefined;
  icon?: LucideIcon;
  hint?: ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-xs sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-ink-2">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-ink-3" aria-hidden />}
      </div>
      {loading || value === undefined ? (
        <Skeleton className="mt-3 h-8 w-20" />
      ) : (
        <p className="mt-2 text-[1.75rem] leading-tight font-semibold tracking-tight text-ink">{formatCount(value)}</p>
      )}
      {hint && <p className="mt-1 text-xs text-ink-3">{hint}</p>}
    </div>
  );
}

export const RANGES = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
] as const;

/** Date-range presets. Sits in one row above everything it scopes. */
export function RangeFilter({ value, onChange }: { value: number; onChange: (days: number) => void }) {
  return (
    <div role="radiogroup" aria-label="Date range" className="inline-flex rounded-lg border border-line bg-surface p-0.5 shadow-xs">
      {RANGES.map((r) => (
        <button
          key={r.days}
          role="radio"
          aria-checked={value === r.days}
          onClick={() => onChange(r.days)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            value === r.days ? "bg-brand-soft text-brand-ink" : "text-ink-2 hover:text-ink",
          )}
        >
          Last {r.label}
        </button>
      ))}
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap rounded-lg border border-line bg-surface p-0.5 shadow-xs">
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            value === o.value ? "bg-brand-soft text-brand-ink" : "text-ink-2 hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export async function copyText(text: string, what = "Link") {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${what} copied`);
    return true;
  } catch {
    toast.error("Couldn't access the clipboard");
    return false;
  }
}

export function CopyButton({ text, label = "Copy", what, size = "sm" }: { text: string; label?: string; what?: string; size?: "sm" | "md" | "icon-sm" }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      size={size}
      aria-label={size === "icon-sm" ? `${label} ${what ?? "link"}` : undefined}
      icon={done ? <Check className="h-4 w-4 text-success-ink" /> : <Copy className="h-4 w-4" />}
      onClick={async () => {
        if (await copyText(text, what)) {
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        }
      }}
    >
      {size !== "icon-sm" && (done ? "Copied" : label)}
    </Button>
  );
}

/** QR code for the card URL — a fallback for phones without NFC. */
export function QrCode({ value, fileName }: { value: string; fileName: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    QRCode.toDataURL(value, { width: 512, margin: 2, errorCorrectionLevel: "M" }).then(setSrc, () => setSrc(null));
  }, [value]);

  return (
    <div className="flex flex-col items-center gap-3">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- generated data URL
        <img src={src} alt={`QR code for ${value}`} width={160} height={160} className="rounded-lg border border-line bg-white p-1" />
      ) : (
        <Skeleton className="h-40 w-40" />
      )}
      <Button
        size="sm"
        icon={<Download className="h-4 w-4" />}
        disabled={!src}
        onClick={() => {
          const a = document.createElement("a");
          a.href = src!;
          a.download = `${fileName}-qr.png`;
          a.click();
        }}
      >
        Download PNG
      </Button>
    </div>
  );
}
