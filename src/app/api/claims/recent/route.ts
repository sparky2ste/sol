import { PublicKey } from "@solana/web3.js";
import { NextRequest, NextResponse } from "next/server";
import { fetchRecentClaims } from "@/lib/solana/fetchRecentClaims";
import {
  getServerConnection,
  getServerRpcUrl,
  isValidSolanaAddress,
} from "@/lib/solana/rpc";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const cache = { data: null as unknown, expiresAt: 0 };

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const limited = rateLimit(`claims:${ip}`, 30, 60_000);
  if (!limited.ok) {
    return rateLimitResponse(limited.retryAfterSec);
  }

  const limit = Math.min(
    Math.max(Number(request.nextUrl.searchParams.get("limit") ?? 10), 1),
    25
  );

  const feeWallet = process.env.NEXT_PUBLIC_FEE_WALLET?.trim();
  if (!feeWallet || !isValidSolanaAddress(feeWallet)) {
    return NextResponse.json({ claims: [] });
  }

  if (!getServerRpcUrl()) {
    return NextResponse.json({ claims: [] });
  }

  const now = Date.now();
  if (cache.data && cache.expiresAt > now) {
    return NextResponse.json(cache.data, {
      headers: { "Cache-Control": "public, max-age=30" },
    });
  }

  try {
    const connection = getServerConnection();
    const claims = await fetchRecentClaims(
      connection,
      new PublicKey(feeWallet),
      limit
    );

    const payload = { claims };
    cache.data = payload;
    cache.expiresAt = now + 30_000;

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "public, max-age=30" },
    });
  } catch {
    return NextResponse.json({ claims: [] });
  }
}
