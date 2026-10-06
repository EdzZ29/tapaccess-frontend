import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME ?? "tapaccess_session";
const isDev = process.env.NODE_ENV === "development";

/**
 * Where uploaded images live besides this site. STORAGE_ORIGIN pins it to one
 * project (e.g. https://<project>.supabase.co); without it any Supabase
 * project host is allowed, so uploads still show if the variable is missing.
 * Images can't run code, so this only widens where pictures may load from.
 */
const STORAGE_ORIGIN = (() => {
  try {
    return process.env.STORAGE_ORIGIN ? new URL(process.env.STORAGE_ORIGIN).origin : "https://*.supabase.co";
  } catch {
    return "https://*.supabase.co";
  }
})();

/**
 * Content-Security-Policy with a fresh nonce per request:
 * - scripts run only if Next.js stamped them with this request's nonce, so
 *   injected markup can't execute anything;
 * - images, fonts, styles and network calls stay on this site (plus the image
 *   bucket), so no visitor data is ever sent to a third party;
 * - the site can't be framed (clickjacking) or have forms posted elsewhere.
 * Inline style attributes are allowed: profiles are themed with them, and
 * styles can't run code.
 */
function contentSecurityPolicy(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${STORAGE_ORIGIN}`,
    "font-src 'self'",
    `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

export function proxy(request: NextRequest) {
  // Dashboard gate: without a session cookie, go straight to sign-in. Only a
  // UX shortcut — the API verifies the session on every request.
  const { pathname, search } = request.nextUrl;
  if (pathname.startsWith("/admin") && !request.cookies.has(SESSION_COOKIE)) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname + search);
    return NextResponse.redirect(login);
  }

  const nonce = btoa(crypto.randomUUID());
  const csp = contentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      // Pages only: API routes, static assets and uploads don't need a CSP.
      source: "/((?!api|uploads|_vercel|_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|brand/|images/|robots.txt).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
