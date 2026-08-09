import { NextRequest, NextResponse } from "next/server";
import { getServerRpcUrl } from "@/lib/solana/rpc";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const FALLBACK_RPCS = [  "https://solana.drpc.org",
  "https://solana-rpc.publicnode.com",
];

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limited = rateLimit(`rpc:${ip}`, 120, 60_000);
  if (!limited.ok) {
    return rateLimitResponse(limited.retryAfterSec);
  }

  const body = await request.text();  const urls = [getServerRpcUrl(), ...FALLBACK_RPCS].filter(Boolean);

  if (urls.length === 0) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message:
            "No RPC configured. Add HELIUS_API_KEY to .env.local (free at helius.dev).",
        },
        id: null,
      },
      { status: 503 }
    );
  }

  let lastResponse: Response | null = null;

  for (const rpcUrl of urls) {
    try {
      const upstream = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      const responseBody = await upstream.text();

      // Skip blocked upstream responses and try next RPC
      if (
        upstream.status === 403 ||
        responseBody.includes("Access forbidden") ||
        responseBody.includes("Request blocked")
      ) {
        lastResponse = new Response(responseBody, { status: upstream.status });
        continue;
      }

      return new NextResponse(responseBody, {
        status: upstream.status,
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      continue;
    }
  }

  return new NextResponse(
    lastResponse
      ? await lastResponse.text()
      : JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: 403,
            message: "Access forbidden",
          },
          id: null,
        }),
    {
      status: 403,
      headers: { "Content-Type": "application/json" },
    }
  );
}
