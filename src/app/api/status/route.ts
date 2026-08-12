import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/solana/env";
import { isRpcConfigured } from "@/lib/solana/rpc";

export async function GET() {
  let cloudflareEnv = false;
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    cloudflareEnv = Boolean(
      (getCloudflareContext().env as Record<string, string | undefined>)
        .HELIUS_API_KEY
    );
  } catch {
    cloudflareEnv = false;
  }

  const processEnv = Boolean(process.env.HELIUS_API_KEY?.trim());
  const resolved = Boolean(getServerEnv("HELIUS_API_KEY"));

  return NextResponse.json({
    rpcConfigured: isRpcConfigured(),
    helius: {
      processEnv,
      cloudflareEnv,
      resolved,
    },
  });
}
