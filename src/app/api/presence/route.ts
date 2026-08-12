import { NextRequest, NextResponse } from "next/server";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { getOnlineCount, recordVisitor } from "@/lib/presence/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const VISITOR_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const limited = rateLimit(`presence:get:${ip}`, 120, 60_000);
  if (!limited.ok) {
    return rateLimitResponse(limited.retryAfterSec);
  }

  return NextResponse.json({ online: getOnlineCount() });
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limited = rateLimit(`presence:post:${ip}`, 120, 60_000);
  if (!limited.ok) {
    return rateLimitResponse(limited.retryAfterSec);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "INVALID_BODY", message: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const id =
    body && typeof body === "object" && "id" in body
      ? (body as { id?: unknown }).id
      : undefined;

  if (typeof id !== "string" || !VISITOR_ID_RE.test(id)) {
    return NextResponse.json(
      { error: "INVALID_ID", message: "Invalid visitor id." },
      { status: 400 }
    );
  }

  return NextResponse.json({ online: recordVisitor(id) });
}
