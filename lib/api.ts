/**
 * Browser-side client for the admin API. Requests go to `/api/*` on this
 * origin (proxied to NestJS), so the HTTP-only session cookie rides along
 * automatically and is never readable from JavaScript.
 */

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code?: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Query = Record<string, string | number | boolean | undefined | null>;

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Query;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: Query): string {
  const url = `/api${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function parseError(res: Response): Promise<ApiError> {
  let body: { message?: string; code?: string; details?: unknown } = {};
  try {
    body = await res.json();
  } catch {
    // Non-JSON error (proxy down, HTML error page).
  }
  const fallback =
    res.status === 0 || res.status >= 502
      ? "The server is unreachable. Please try again in a moment."
      : `Request failed (${res.status})`;
  return new ApiError(res.status, body.message ?? fallback, body.code, body.details);
}

export async function api<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const isForm = typeof FormData !== "undefined" && opts.body instanceof FormData;
  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), {
      method: opts.method ?? "GET",
      credentials: "same-origin",
      headers: opts.body && !isForm ? { "Content-Type": "application/json" } : undefined,
      body: opts.body === undefined ? undefined : isForm ? (opts.body as FormData) : JSON.stringify(opts.body),
      signal: opts.signal,
      cache: "no-store",
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new ApiError(0, "Network error. Check your connection and try again.");
  }

  if (res.status === 401 && typeof window !== "undefined" && !path.startsWith("/auth/login")) {
    // Session expired or revoked: clear the stale cookie and go to sign-in.
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    // A full page load (not router.push) also drops every cached admin response.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(`/login?next=${next}&expired=1`);
    throw new ApiError(401, "Your session has expired");
  }

  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/** SWR fetcher: the key is the API path (or [path, query]). */
export const fetcher = <T>(key: string | [string, Query]) =>
  Array.isArray(key) ? api<T>(key[0], { query: key[1] }) : api<T>(key);

export const errorMessage = (err: unknown) =>
  err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Something went wrong";
