import { PublicKey } from "@solana/web3.js";

/** ~0.00203928 SOL rent per empty SPL token account (approximate) */
export const RENT_PER_EMPTY_ACCOUNT_LAMPORTS = 2_039_280;

/** Platform fee taken from reclaimed SOL */
export const PLATFORM_FEE_BPS = 100; // 1% = 100 basis points

export const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

export const TOKEN_2022_PROGRAM_ID = new PublicKey(
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
);

/** Well-known mint labels for skipped accounts in the UI */
export const KNOWN_MINT_LABELS: Record<string, string> = {
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: "USDC",
  Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: "USDT",
  So11111111111111111111111111111111111111112: "Wrapped SOL",
};

export function getKnownMintLabel(mint: string): string | undefined {
  return KNOWN_MINT_LABELS[mint];
}

export function isProtectedMint(mint: string): boolean {
  return mint in KNOWN_MINT_LABELS;
}

/** Public WebSocket RPC. Our /api/rpc proxy is HTTP-only */
export const PUBLIC_WS_RPC_URL = "wss://solana-rpc.publicnode.com";

export function getRpcUrl(): string {
  // Browser calls go through our Next.js proxy to avoid public RPC 403/CORS blocks.
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/rpc`;
  }

  return (
    process.env.SOLANA_RPC_URL ??
    process.env.NEXT_PUBLIC_RPC_URL ??
    "https://solana-rpc.publicnode.com"
  );
}

/** Stable HTTP RPC for SSR / first paint (switched to proxy after mount in browser) */
export function getInitialRpcUrl(): string {
  return (
    process.env.NEXT_PUBLIC_RPC_URL ?? "https://solana-rpc.publicnode.com"
  );
}

/** Platform fee recipient. Permanent; do not remove or change without owner approval */
export const FEE_WALLET_ADDRESS =
  "8SHY8J3gy6L9aaZzmQdR4JJTgZXBH3ArkJVWKw1ES9eH";

export function getFeeWalletAddress(): string {
  const fromEnv = process.env.NEXT_PUBLIC_FEE_WALLET?.trim();
  if (fromEnv && fromEnv !== "YOUR_SOLANA_WALLET_ADDRESS_HERE") {
    return fromEnv;
  }
  return FEE_WALLET_ADDRESS;
}

export function getFeeWallet(): PublicKey {
  return new PublicKey(getFeeWalletAddress());
}

export function lamportsToSol(lamports: number): number {
  return lamports / 1_000_000_000;
}

export function solToLamports(sol: number): number {
  return Math.floor(sol * 1_000_000_000);
}

export function formatSol(lamports: number, decimals = 4): string {
  return lamportsToSol(lamports).toFixed(decimals);
}

export function calculatePlatformFee(reclaimedLamports: number): number {
  return Math.floor((reclaimedLamports * PLATFORM_FEE_BPS) / 10_000);
}

/** Net payout for one account after the 1% platform fee */
export function calculateAccountNetPayout(rentLamports: number): number {
  return rentLamports - calculatePlatformFee(rentLamports);
}

export function truncateAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
