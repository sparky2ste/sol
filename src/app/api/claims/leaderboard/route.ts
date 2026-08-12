import { NextRequest, NextResponse } from "next/server";
import {
  fetchLeaderboard,
  type LeaderboardPeriod,
} from "@/lib/solana/fetchRecentClaims";
import { getFeeWallet } from "@/lib/solana/constants";
import {
  getServerConnection,
  getServerRpcUrl,
} from "@/lib/solana/rpc";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const cache = new Map<string, { data: unknown; expiresAt: number }>();

function parsePeriod(value: string | null): LeaderboardPeriod {
  if (value === "7d" || value === "30d" || value === "all") return value;
  return "all";
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const limited = rateLimit(`leaderboard:${ip}`, 30, 60_000);
  if (!limited.ok) {
    return rateLimitResponse(limited.retryAfterSec);
  }

  const limit = Math.min(
    Math.max(Number(request.nextUrl.searchParams.get("limit") ?? 25), 1),
    50
  );
  const period = parsePeriod(request.nextUrl.searchParams.get("period"));

  const feeWallet = getFeeWallet();

  if (!getServerRpcUrl() || !feeWallet) {
    return NextResponse.json({ leaderboard: [], period });
  }

  const cacheKey = `${period}:${limit}`;
  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return NextResponse.json(cached.data, {
      headers: { "Cache-Control": "public, max-age=60" },
    });
  }

  try {
    const connection = getServerConnection();
    const leaderboard = await fetchLeaderboard(
      connection,
      feeWallet,
      limit,
      period
    );

    const payload = { leaderboard, period };
    cache.set(cacheKey, { data: payload, expiresAt: now + 60_000 });

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "public, max-age=60" },
    });
  } catch {
    return NextResponse.json({ leaderboard: [], period });
  }
}
