import { NextRequest, NextResponse } from "next/server";
import { analyzeToken, validateMintAddress } from "@/lib/oracle/analyze";
import { getServerRpcUrl } from "@/lib/solana/rpc";
import {
  getClientIp,
  rateLimitAnalysis,
  rateLimitResponse,
} from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const cache = new Map<string, { data: unknown; expiresAt: number }>();

export async function GET(request: NextRequest) {
  const mint = request.nextUrl.searchParams.get("mint")?.trim();

  if (!mint) {
    return NextResponse.json(
      { error: "MISSING_MINT", message: "Token mint (CA) is required." },
      { status: 400 }
    );
  }

  if (!validateMintAddress(mint)) {
    return NextResponse.json(
      { error: "INVALID_MINT", message: "Invalid Solana mint address." },
      { status: 400 }
    );
  }

  const cacheKey = mint.toLowerCase();
  const now = Date.now();
  const hit = cache.get(cacheKey);
  if (hit && hit.expiresAt > now) {
    return NextResponse.json(hit.data, {
      headers: { "Cache-Control": "public, max-age=120" },
    });
  }

  if (!getServerRpcUrl()) {
    return NextResponse.json(
      {
        error: "RPC_NOT_CONFIGURED",
        message: "Oracle needs Helius RPC configured on the server.",
      },
      { status: 503 }
    );
  }

  const ip = getClientIp(request);
  const rateKey =
    ip === "unknown" ? `oracle:mint:${cacheKey}` : `oracle:${ip}`;
  const limit = ip === "unknown" ? 8 : 30;
  const limited = rateLimitAnalysis(rateKey, limit, 60_000);
  if (!limited.ok) {
    return rateLimitResponse(limited.retryAfterSec);
  }

  try {
    const report = await analyzeToken(mint);
    cache.set(cacheKey, { data: report, expiresAt: now + 120_000 });

    if (cache.size > 200) {
      const oldest = [...cache.entries()].sort(
        (a, b) => a[1].expiresAt - b[1].expiresAt
      )[0];
      if (oldest) cache.delete(oldest[0]);
    }

    return NextResponse.json(report, {
      headers: { "Cache-Control": "public, max-age=120" },
    });
  } catch (err) {
    const message =
      err instanceof Error && err.message
        ? err.message
        : typeof err === "string"
          ? err
          : "Failed to analyze token. Check the CA is a token mint.";
    const userError =
      message.includes("not found") ||
      message.includes("not a token mint") ||
      message.includes("No DexScreener");
    return NextResponse.json(
      { error: "ORACLE_FAILED", message },
      { status: userError ? 400 : 500 }
    );
  }
}
