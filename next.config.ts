import type { NextConfig } from "next";

/**
 * The browser only ever talks to this origin. `/api/*` and `/uploads/*` are
 * proxied to the NestJS backend, so the admin session cookie is first-party
 * (no third-party-cookie problems in Safari) and the backend URL never has
 * to be exposed for admin traffic.
 */
const API_URL = (process.env.API_URL ?? "http://localhost:4000").replace(/\/$/, "");

/** Sent on every response. The Content-Security-Policy is added per request in proxy.ts. */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Never tell other sites which card a visitor came from.
  { key: "Referrer-Policy", value: "same-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=(), interest-cohort=()",
  },
];

// Fail the production deploy loudly instead of shipping a site whose visitors
// all share one rate limit (see lib/upstream.ts).
if (process.env.VERCEL_ENV === "production" && !process.env.INTERNAL_API_KEY) {
  throw new Error("INTERNAL_API_KEY must be set for production builds (same value as on the API).");
}

const SITE_HOST = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001").hostname;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // Lets a phone on the same Wi-Fi use the dev server when NEXT_PUBLIC_SITE_URL
  // is set to this machine's LAN address (e.g. http://192.168.1.4:3001) for
  // testing real NFC taps. Only affects `next dev`.
  allowedDevOrigins: [SITE_HOST],
  async rewrites() {
    // `fallback`: only applies when no page or route handler matches, so the
    // route handlers in app/api/public/** (vCard, visits, clicks) take
    // precedence and everything else under /api goes to the backend.
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [
        { source: "/api/:path*", destination: `${API_URL}/api/:path*` },
        { source: "/uploads/:path*", destination: `${API_URL}/uploads/:path*` },
      ],
    };
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Cards are opened by tapping, not searched for: keep them (and the
        // dashboard) out of search engines so nobody can list businesses or
        // scrape their details from Google.
        source: "/(admin|login|c)(.*)",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      },
    ];
  },
};

export default nextConfig;
