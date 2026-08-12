import { PublicKey } from "@solana/web3.js";

const BASE58_RE = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;

const URL_PATTERNS = [
  /dexscreener\.com\/solana\/([1-9A-HJ-NP-Za-km-z]{32,44})/i,
  /solscan\.io\/token\/([1-9A-HJ-NP-Za-km-z]{32,44})/i,
  /pump\.fun\/(?:coin\/)?([1-9A-HJ-NP-Za-km-z]{32,44})/i,
  /birdeye\.so\/token\/([1-9A-HJ-NP-Za-km-z]{32,44})/i,
  /gmgn\.ai\/sol\/token\/([1-9A-HJ-NP-Za-km-z]{32,44})/i,
  /padre\.gg\/trade\/solana\/([1-9A-HJ-NP-Za-km-z]{32,44})/i,
  /axiom\.trade\/meme\/([1-9A-HJ-NP-Za-km-z]{32,44})/i,
];

function tryPubkey(value: string): string | null {
  try {
    return new PublicKey(value).toBase58();
  } catch {
    return null;
  }
}

/** Extract a Solana address from pasted text, URLs, or raw mint strings. */
export function parseMintInput(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  const direct = tryPubkey(trimmed);
  if (direct) return direct;

  for (const pattern of URL_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match?.[1]) {
      const parsed = tryPubkey(match[1]);
      if (parsed) return parsed;
    }
  }

  const candidates = trimmed.match(BASE58_RE) ?? [];
  for (const candidate of candidates) {
    const parsed = tryPubkey(candidate);
    if (parsed) return parsed;
  }

  return trimmed;
}

export async function resolveMintViaDexScreener(
  address: string
): Promise<string | null> {
  const candidates = [address, address.toLowerCase()].filter(
    (v, i, a) => a.indexOf(v) === i
  );

  for (const candidate of candidates) {
    try {
      const pairRes = await fetch(
        `https://api.dexscreener.com/latest/dex/pairs/solana/${candidate}`,
        { next: { revalidate: 0 } }
      );
      if (pairRes.ok) {
        const data = (await pairRes.json()) as {
          pair?: { baseToken?: { address?: string } };
          pairs?: { baseToken?: { address?: string } }[];
        };
        const mint =
          data.pair?.baseToken?.address ?? data.pairs?.[0]?.baseToken?.address;
        if (mint && tryPubkey(mint)) return mint;
      }

      const tokenRes = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${candidate}`,
        { next: { revalidate: 0 } }
      );
      if (tokenRes.ok) {
        const data = (await tokenRes.json()) as {
          pairs?: { chainId?: string; baseToken?: { address?: string } }[];
        };
        const solana = (data.pairs ?? []).filter((p) => p.chainId === "solana");
        const mint = solana[0]?.baseToken?.address;
        if (mint && tryPubkey(mint)) return mint;
      }
    } catch {
      // DexScreener lookup is best-effort
    }
  }

  return null;
}
