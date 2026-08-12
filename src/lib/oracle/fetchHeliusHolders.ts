import { getServerEnv } from "@/lib/solana/env";

const HELIUS_RPC = "https://mainnet.helius-rpc.com";

export interface RawTokenHolder {
  owner: string;
  amount: number;
  uiAmount: number;
}

interface HeliusTokenAccount {
  owner?: string;
  amount?: number;
}

interface HeliusTokenAccountsResult {
  token_accounts?: HeliusTokenAccount[];
  cursor?: string;
  total?: number;
}

async function heliusRpc<T>(method: string, params: unknown): Promise<T> {
  const apiKey = getServerEnv("HELIUS_API_KEY");
  if (!apiKey) {
    throw new Error("Helius API key required for holder scan.");
  }

  const res = await fetch(`${HELIUS_RPC}/?api-key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "oracle-holders",
      method,
      params,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Helius holder scan failed (${res.status}).`);
  }

  const json = (await res.json()) as {
    result?: T;
    error?: { message?: string };
  };

  if (json.error) {
    throw new Error(json.error.message ?? "Helius holder scan failed.");
  }

  if (!json.result) {
    throw new Error("Helius holder scan returned no data.");
  }

  return json.result;
}

/** Paginate Helius DAS getTokenAccounts and aggregate balances by wallet owner. */
export async function fetchHeliusHoldersByMint(
  mint: string,
  decimals: number,
  maxPages = 4,
  pageLimit = 1000
): Promise<{ holders: RawTokenHolder[]; totalAccounts: number }> {
  const byOwner = new Map<string, number>();
  let cursor: string | undefined;
  let pages = 0;
  let totalAccounts = 0;

  while (pages < maxPages) {
    const params: Record<string, unknown> = {
      mint,
      limit: pageLimit,
      options: { showZeroBalance: false },
    };
    if (cursor) params.cursor = cursor;

    const result = await heliusRpc<HeliusTokenAccountsResult>(
      "getTokenAccounts",
      params
    );

    const accounts = result.token_accounts ?? [];
    totalAccounts += accounts.length;

    for (const account of accounts) {
      if (!account.owner || account.amount == null) continue;
      const amount = Number(account.amount);
      if (amount <= 0) continue;
      byOwner.set(account.owner, (byOwner.get(account.owner) ?? 0) + amount);
    }

    pages += 1;
    cursor = result.cursor;
    if (!cursor || accounts.length < pageLimit) break;
  }

  const divisor = 10 ** decimals;
  const holders = [...byOwner.entries()]
    .map(([owner, amount]) => ({
      owner,
      amount,
      uiAmount: amount / divisor,
    }))
    .sort((a, b) => b.amount - a.amount);

  return { holders, totalAccounts };
}
