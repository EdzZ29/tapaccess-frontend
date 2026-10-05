import { API_URL, upstreamHeaders } from "@/lib/upstream";

/**
 * Admin sign-in, forwarded to the API with the visitor's IP so the per-IP
 * login limit (5/min, 20/hour) applies to each person, not to everyone who
 * shares this server's address. The API's session cookie is passed through
 * unchanged (HttpOnly, Secure, SameSite=Lax), so it stays first-party.
 */
export async function POST(request: Request) {
  // Same-origin check (the API's own Origin check can't see the browser here).
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ statusCode: 403, message: "Origin not allowed" }, { status: 403 });
  }

  const body = await request.text();
  if (body.length > 2048) return Response.json({ statusCode: 413, message: "Request too large" }, { status: 413 });

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: upstreamHeaders(request, { "content-type": "application/json" }),
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return Response.json({ statusCode: 503, message: "The server is unreachable. Please try again in a moment." }, { status: 503 });
  }

  const headers = new Headers({ "content-type": "application/json", "cache-control": "no-store" });
  for (const cookie of upstream.headers.getSetCookie()) headers.append("set-cookie", cookie);
  return new Response(await upstream.text(), { status: upstream.status, headers });
}
