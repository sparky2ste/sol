import { Connection, PublicKey } from "@solana/web3.js";

export function getServerRpcUrl(): string {
  if (process.env.HELIUS_API_KEY) {
    return `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`;
  }

  const url = process.env.SOLANA_RPC_URL?.trim();
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
