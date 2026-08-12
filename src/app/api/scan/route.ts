import { PublicKey } from "@solana/web3.js";
import { NextRequest, NextResponse } from "next/server";
import { scanEmptyAccounts } from "@/lib/solana/scanEmptyAccounts";
import {
  getServerConnection,
  getServerRpcUrl,
  isValidSolanaAddress,
} from "@/lib/solana/rpc";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import {
  normalizeRequestHost,
  shouldSkipTurnstile,
  TURNSTILE_ACTION_SCAN,
} from "@/lib/turnstile/config";
import {
  createVerificationSessionToken,
  isVerificationSessionValid,
  verificationSessionCookieOptions,
  VERIFICATION_SESSION_COOKIE,
} from "@/lib/turnstile/session";
import { verifyTurnstileToken } from "@/lib/turnstile/verify";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getRequestHost(request: NextRequest): string {
  return normalizeRequestHost(
    request.headers.get("x-forwarded-host") ??
      request.headers.get("host") ??
      "localhost"
  );
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const requestHost = getRequestHost(request);
  const limited = rateLimit(`scan:${ip}`, 30, 60_000);
  if (!limited.ok) {
    return rateLimitResponse(limited.retryAfterSec);
  }

  const sessionToken = request.cookies.get(VERIFICATION_SESSION_COOKIE)?.value;
  const hasValidSession = isVerificationSessionValid(sessionToken, requestHost);
  const skipTurnstile = shouldSkipTurnstile(requestHost);
  let issueSession = false;

  if (!hasValidSession && skipTurnstile) {
    issueSession = true;
  } else if (!hasValidSession) {
    const turnstileToken = request.headers.get("cf-turnstile-response");
    const turnstile = await verifyTurnstileToken(
      turnstileToken,
      TURNSTILE_ACTION_SCAN,
      ip,
      requestHost
    );
    if (!turnstile.ok) {
      return NextResponse.json(
        { error: "TURNSTILE_FAILED", message: turnstile.message },
        { status: 403 }
      );
    }
    issueSession = true;
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

    const response = NextResponse.json({
      wallet: result.wallet.toBase58(),
      totalRentLamports: result.totalRentLamports,
      burnableRentLamports: result.burnableRentLamports,
      skippedRentLamports: result.skippedRentLamports,
      accounts: result.accounts.map((account) => ({
        pubkey: account.pubkey.toBase58(),
        mint: account.mint.toBase58(),
        programId: account.programId.toBase58(),
        rentLamports: account.rentLamports,
      })),
      burnableAccounts: result.burnableAccounts.map((account) => ({
        pubkey: account.pubkey.toBase58(),
        mint: account.mint.toBase58(),
        programId: account.programId.toBase58(),
        rentLamports: account.rentLamports,
        tokenAmount: account.tokenAmount,
        uiAmount: account.uiAmount,
        decimals: account.decimals,
        label: account.label,
      })),
      protectedAccounts: result.protectedAccounts.map((account) => ({
        pubkey: account.pubkey.toBase58(),
        mint: account.mint.toBase58(),
        programId: account.programId.toBase58(),
        rentLamports: account.rentLamports,
        tokenAmount: account.tokenAmount,
        uiAmount: account.uiAmount,
        label: account.label,
        reason: account.reason,
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

    if (issueSession) {
      const token = createVerificationSessionToken(requestHost);
      if (token) {
        response.cookies.set(verificationSessionCookieOptions(token));
      }
    }

    return response;
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
          ? "Wallet scan is temporarily unavailable. Please try again later."
          : "Failed to scan wallet. Please try again.",
      },
      { status: blocked ? 503 : 500 }
    );
  }
}
