import type { NextConfig } from "next";

/** "cards.example.com/" → "https://cards.example.com"; null if it still isn't a valid URL. */
function normalizeUrl(value: string | undefined): string | null {
  const v = value?.trim().replace(/\/+$/, "");
  if (!v) return null;
  const withScheme = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    return new URL(withScheme).origin;
  } catch {
    return null;
  }
}

// ─── Environment check ──────────────────────────────────────────────────────
// On Vercel production builds every required variable must be present and
// valid; all problems are reported together in one readable message instead
// of a cryptic "Failed to load next.config.ts".
const onVercelProduction = process.env.VERCEL_ENV === "production";
// API_URL is preferred; NEXT_PUBLIC_API_URL is accepted too (the API address isn't secret).
const apiUrl = normalizeUrl(process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL);
const siteUrl = normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL);
if (onVercelProduction) {
  const problems: string[] = [];
  if (!apiUrl) problems.push("API_URL (or NEXT_PUBLIC_API_URL) — your Render API address, e.g. https://tapaccess-backend.onrender.com");
  if (!siteUrl) problems.push("NEXT_PUBLIC_SITE_URL — this site's address, e.g. https://tapaccess-frontend.vercel.app");
  if (!process.env.INTERNAL_API_KEY) problems.push("INTERNAL_API_KEY — the same secret value you set on Render");
  if (problems.length) {
    throw new Error(
      [
        "",
        "TapAccess: missing or invalid environment variables for this production deployment:",
        ...problems.map((p) => `  • ${p}`),
        "Add them in Vercel → Project → Settings → Environment Variables (tick “Production”), then Redeploy.",
        "",
      ].join("\n"),
    );
  }
}

/**
 * The browser only ever talks to this origin. `/api/*` and `/uploads/*` are
 * proxied to the NestJS backend, so the admin session cookie is first-party
 * (no third-party-cookie problems in Safari) and the backend URL never has
 * to be exposed for admin traffic.
 */
const API_URL = apiUrl ?? "http://localhost:4000";

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

const SITE_HOST = new URL(siteUrl ?? "http://localhost:3001").hostname;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // Lets a phone on the same Wi-Fi use the dev server when NEXT_PUBLIC_SITE_URL
  // is set to this machine's LAN address (e.g. http://192.168.1.4:3001) for
  // testing real NFC taps. Only affects `next dev`.
  allowedDevOrigins: [SITE_HOST],
  async rewrites() {
    // /api/* is served by route handlers (app/api/**), which check the request
    // came from this site and forward it to the backend. Only uploaded files
    // (local storage driver) are proxied directly.
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [
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
