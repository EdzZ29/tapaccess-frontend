"use client";

import { AlertTriangle } from "lucide-react";
import { useSyncExternalStore } from "react";
import { SITE_URL } from "@/lib/utils";

const noop = () => () => undefined;

/** Origin the dashboard is actually being used on (null during server render). */
function useCurrentOrigin(): string | null {
  return useSyncExternalStore(
    noop,
    () => window.location.origin,
    () => null,
  );
}

/**
 * Card links (and the URL written to NFC tags) come from NEXT_PUBLIC_SITE_URL.
 * If that differs from the address the admin is using — e.g. the Vercel
 * project was renamed — every copied link would point at the wrong site, and
 * tags written with it can't be fixed later. Say so loudly.
 */
export function SiteUrlWarning({ compact = false }: { compact?: boolean }) {
  const origin = useCurrentOrigin();
  const configured = new URL(SITE_URL).host;
  const current = origin ? new URL(origin).host : null;
  if (!origin || current === configured) return null;

  return (
    <div role="alert" className={compact ? "rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger" : "border-b border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"}>
      <div className="mx-auto flex max-w-7xl items-start gap-2.5">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p>
          <strong>Card links point to {configured}</strong>, but this site is <strong>{current}</strong>. Don&apos;t write NFC tags yet:
          set <code className="font-mono">NEXT_PUBLIC_SITE_URL</code> to <code className="font-mono">{origin}</code> in Vercel →
          Settings → Environment Variables, then redeploy.
        </p>
      </div>
    </div>
  );
}
