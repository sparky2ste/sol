import { Connection, PublicKey } from "@solana/web3.js";
import { getServerEnv } from "./env";

export function getServerRpcUrl(): string {
  const heliusKey = getServerEnv("HELIUS_API_KEY");
  if (heliusKey) {
    return `https://mainnet.helius-rpc.com/?api-key=${heliusKey}`;
  }

  const url = getServerEnv("SOLANA_RPC_URL");
  if (!url) return "";

  const blocked =
    url.includes("publicnode.com") ||
    url.includes("api.mainnet-beta.solana.com");

  if (blocked) return "";

  return url;
}

export function isRpcConfigured(): boolean {
  return getServerRpcUrl().length > 0;
}

export function getServerConnection(): Connection {
  const url = getServerRpcUrl();
  if (!url) {
    throw new Error("RPC_NOT_CONFIGURED");
  }
  return new Connection(url, "confirmed");
}

export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}
