"use client";

import { useSyncExternalStore } from "react";
import type { OpeningHoursDay } from "@/lib/types";

/** false during SSR and hydration, true afterwards (for clock-dependent UI). */
const noop = () => () => undefined;
export const useHydrated = () => useSyncExternalStore(noop, () => true, () => false);

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export const formatTime = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: m ? "2-digit" : undefined }).format(new Date(2000, 0, 1, h, m));
};

/** 0 = Monday … 6 = Sunday, matching the stored opening hours. */
export const weekdayIndex = (d: Date) => (d.getDay() + 6) % 7;

/**
 * Open/closed right now, in the visitor's local time. NFC cards are tapped in
 * person, so the visitor's clock is the business's clock in practice.
 */
export function openStatus(hours: OpeningHoursDay[], now: Date, alwaysOpen = false): { open: boolean; text: string } | null {
  if (alwaysOpen) return { open: true, text: "Open 24 hours" };
  const today = hours.find((h) => h.day === weekdayIndex(now));
  if (!today) return null;
  const mins = now.getHours() * 60 + now.getMinutes();
  if (!today.closed && mins >= toMinutes(today.open) && mins < toMinutes(today.close)) {
    return { open: true, text: `Open · until ${formatTime(today.close)}` };
  }
  if (!today.closed && mins < toMinutes(today.open)) return { open: false, text: `Opens ${formatTime(today.open)}` };
  return { open: false, text: "Closed now" };
}
