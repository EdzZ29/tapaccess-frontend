import type { MetadataRoute } from "next";

/**
 * Nothing on this site is meant to be found through search engines: cards are
 * opened by tapping them, and the dashboard is private. (Pages also send
 * `X-Robots-Tag: noindex` in case a crawler ignores this file.)
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: ["/$", "/privacy"], disallow: ["/admin", "/login", "/api", "/c/", "/review/", "/uploads"] },
  };
}
