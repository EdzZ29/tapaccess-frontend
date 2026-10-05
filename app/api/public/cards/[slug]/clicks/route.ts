import { forwardTracking } from "@/lib/forward-tracking";

/** Tracking beacon, forwarded to the API with the visitor's IP (see lib/forward-tracking.ts). */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  return forwardTracking(request, (await params).slug, "clicks");
}
