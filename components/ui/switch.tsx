import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  /** Hide the label visually but keep it for screen readers. */
  srOnlyLabel?: boolean;
  disabled?: boolean;
  size?: "sm" | "md";
}

export function Switch({ checked, onChange, label, srOnlyLabel, disabled, size = "md" }: SwitchProps) {
  const track = size === "sm" ? "h-5 w-9" : "h-6 w-11";
  const thumb = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const shift = size === "sm" ? "translate-x-4" : "translate-x-5";
  return (
    <label className={cn("inline-flex items-center gap-2.5", disabled ? "opacity-50" : "cursor-pointer")}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={srOnlyLabel ? label : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex shrink-0 items-center rounded-full p-0.5 transition-colors",
          track,
          checked ? "bg-brand" : "bg-line-strong",
        )}
      >
        <span
          className={cn("rounded-full bg-white shadow transition-transform", thumb, checked ? shift : "translate-x-0")}
        />
      </button>
      {!srOnlyLabel && <span className="text-sm text-ink">{label}</span>}
    </label>
  );
}
