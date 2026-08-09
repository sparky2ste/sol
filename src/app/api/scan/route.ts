import { PublicKey } from "@solana/web3.js";
import { NextRequest, NextResponse } from "next/server";
import { scanEmptyAccounts } from "@/lib/solana/scanEmptyAccounts";
import {
  getServerConnection,
  getServerRpcUrl,
  isValidSolanaAddress,
} from "@/lib/solana/rpc";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const limited = rateLimit(`scan:${ip}`, 30, 60_000);
  if (!limited.ok) {
    return rateLimitResponse(limited.retryAfterSec);
  }

  const wallet = request.nextUrl.searchParams.get("wallet");

  if (!wallet) {
    return NextResponse.json(
      { error: "MISSING_WALLET", message: "Wallet address is required." },
      { status: 400 }
    );
  }

  if (!isValidSolanaAddress(wallet)) {
    return NextResponse.json(
      { error: "INVALID_WALLET", message: "Invalid Solana wallet address." },
      { status: 400 }
    );
  }

  if (!getServerRpcUrl()) {
    return NextResponse.json(
      {
        error: "RPC_NOT_CONFIGURED",
        message:
          "Wallet scanning needs a Helius RPC key. Add HELIUS_API_KEY=your_key to .env.local (free at helius.dev), then restart the dev server.",
      },
      { status: 503 }
    );
  }

  try {
    const connection = getServerConnection();
    const pubkey = new PublicKey(wallet);
    const result = await scanEmptyAccounts(connection, pubkey);

    return NextResponse.json({
      wallet: result.wallet.toBase58(),
      totalRentLamports: result.totalRentLamports,
      skippedRentLamports: result.skippedRentLamports,
      accounts: result.accounts.map((account) => ({
        pubkey: account.pubkey.toBase58(),
        mint: account.mint.toBase58(),
        programId: account.programId.toBase58(),
        rentLamports: account.rentLamports,
        tokenAmount: account.tokenAmount,
        requiresBurn: account.requiresBurn,
        decimals: account.decimals,
      })),
      skippedAccounts: result.skippedAccounts.map((account) => ({
        pubkey: account.pubkey.toBase58(),
        mint: account.mint.toBase58(),
        programId: account.programId.toBase58(),
        rentLamports: account.rentLamports,
        tokenAmount: account.tokenAmount,
        uiAmount: account.uiAmount,
        label: account.label,
        reason: account.reason,
      })),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to scan wallet";

    const blocked =
      message.includes("403") ||
      message.includes("Access forbidden") ||
      message.includes("Request blocked");

    return NextResponse.json(
      {
        error: blocked ? "RPC_BLOCKED" : "SCAN_FAILED",
        message: blocked
          ? "RPC blocked this request. Use a Helius API key in .env.local (helius.dev) and restart the dev server."
          : message,
      },
      { status: blocked ? 503 : 500 }
    );
  }
}
