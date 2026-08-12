import { NextRequest, NextResponse } from "next/server";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { getServerRpcUrl } from "@/lib/solana/rpc";
import { validateRpcProxyRequest } from "@/lib/solana/rpcProxy";

export const dynamic = "force-dynamic";

const FALLBACK_RPCS = [
  "https://solana.drpc.org",
  "https://solana-rpc.publicnode.com",
];

function rpcError(status: number, message: string) {
  return NextResponse.json(
    {
      jsonrpc: "2.0",
      error: { code: -32603, message },
      id: null,
    },
    { status }
  );
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limited = rateLimit(`rpc:${ip}`, 60, 60_000);
  if (!limited.ok) {
    return rateLimitResponse(limited.retryAfterSec);
  }

  const rawBody = await request.text();
  const validated = validateRpcProxyRequest(request.headers.get("host"), rawBody);
  if (!validated.ok) {
    return rpcError(validated.status, validated.message);
  }

  const urls = [getServerRpcUrl(), ...FALLBACK_RPCS].filter(Boolean);
  if (urls.length === 0) {
    return rpcError(503, "RPC not configured");
  }

  let lastResponse: Response | null = null;

  for (const rpcUrl of urls) {
    try {
      const upstream = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: validated.body,
      });

      const responseBody = await upstream.text();

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
          error: { code: 403, message: "Access forbidden" },
          id: null,
        }),
    {
      status: 403,
      headers: { "Content-Type": "application/json" },
    }
  );
}
