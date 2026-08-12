import { NextRequest, NextResponse } from "next/server";
import { buildGoalProgress } from "@/lib/communityGoals";
import { fetchCommunityActivityStats } from "@/lib/solana/fetchRecentClaims";
import { getFeeWallet } from "@/lib/solana/constants";
import {
  getServerConnection,
  getServerRpcUrl,
} from "@/lib/solana/rpc";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

let cache: { data: unknown; expiresAt: number } | null = null;

function emptyGoals() {
  const burn = buildGoalProgress("burn", 0, 0);
  const reclaim = buildGoalProgress("reclaim", 0, 0);
  return { burn, reclaim };
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const limited = rateLimit(`community-goals:${ip}`, 30, 60_000);
  if (!limited.ok) {
    return rateLimitResponse(limited.retryAfterSec);
  }

  const feeWallet = getFeeWallet();

  if (!getServerRpcUrl() || !feeWallet) {
    return NextResponse.json(emptyGoals());
  }

  const now = Date.now();
  if (cache && cache.expiresAt > now) {
    return NextResponse.json(cache.data, {
      headers: { "Cache-Control": "public, max-age=60" },
    });
  }

  try {
    const connection = getServerConnection();
    const stats = await fetchCommunityActivityStats(connection, feeWallet);

    const payload = {
      burn: buildGoalProgress(
        "burn",
        stats.totalBurnLamports,
        stats.burnCount
      ),
      reclaim: buildGoalProgress(
        "reclaim",
        stats.totalReclaimLamports,
        stats.reclaimCount
      ),
    };

    cache = { data: payload, expiresAt: now + 60_000 };

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "public, max-age=60" },
    });
  } catch {
    return NextResponse.json(emptyGoals());
  }
}
