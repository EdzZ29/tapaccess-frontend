"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

/** Private pages never reported: the dashboard, sign-in and owners' edit pages. */
const PRIVATE = /^\/(admin|login)(\/|$)|^\/c\/[^/]+\/edit(\/|$)/;

/**
 * Vercel Web Analytics: anonymous page views for the public site and card
 * pages (no cookies, served from this domain). Disclosed on /privacy.
 */
export function VercelAnalytics() {
  return (
    <Analytics
      beforeSend={(event: BeforeSendEvent) => {
        const url = new URL(event.url);
        if (PRIVATE.test(url.pathname)) return null;
        // Query strings can carry one-off values (e.g. ?next=…); keep just the page.
        url.search = "";
        return { ...event, url: url.toString() };
      }}
    />
  );
}
