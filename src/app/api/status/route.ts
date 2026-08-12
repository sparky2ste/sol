import { NextRequest, NextResponse } from "next/server";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { isRpcConfigured } from "@/lib/solana/rpc";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const limited = rateLimit(`status:${ip}`, 60, 60_000);
  if (!limited.ok) {
    return rateLimitResponse(limited.retryAfterSec);
  }

  return NextResponse.json({ rpcConfigured: isRpcConfigured() });
}
