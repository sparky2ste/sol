/** RPC methods the wallet UI may call through /api/rpc. Block everything else. */
export const ALLOWED_RPC_METHODS = new Set([
  "getLatestBlockhash",
  "getRecentBlockhash",
  "getBalance",
  "getAccountInfo",
  "getParsedAccountInfo",
  "getMultipleAccounts",
  "getParsedTokenAccountsByOwner",
  "getTokenAccountsByOwner",
  "getTokenAccountBalance",
  "getTransaction",
  "sendTransaction",
  "sendRawTransaction",
  "simulateTransaction",
  "getSignatureStatuses",
  "getFeeForMessage",
  "getMinimumBalanceForRentExemption",
  "getVersion",
  "getHealth",
  "getSlot",
  "getBlockHeight",
  "getEpochInfo",
  "isBlockhashValid",
]);

const MAX_RPC_BODY_BYTES = 16_384;
const MAX_BATCH_SIZE = 5;

export type RpcValidationResult =
  | { ok: true; body: string }
  | { ok: false; status: number; message: string };

export function validateRpcProxyRequest(
  host: string | null,
  rawBody: string
): RpcValidationResult {
  if (!isAllowedHost(host)) {
    return { ok: false, status: 403, message: "Forbidden" };
  }

  if (rawBody.length > MAX_RPC_BODY_BYTES) {
    return { ok: false, status: 413, message: "Request body too large" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return { ok: false, status: 400, message: "Invalid JSON" };
  }

  const payloads = Array.isArray(parsed) ? parsed : [parsed];
  if (payloads.length === 0 || payloads.length > MAX_BATCH_SIZE) {
    return { ok: false, status: 400, message: "Invalid batch request" };
  }

  for (const item of payloads) {
    if (!item || typeof item !== "object") {
      return { ok: false, status: 400, message: "Invalid JSON-RPC payload" };
    }

    const method = (item as { method?: unknown }).method;
    if (typeof method !== "string" || !ALLOWED_RPC_METHODS.has(method)) {
      return {
        ok: false,
        status: 403,
        message: `RPC method not allowed: ${typeof method === "string" ? method : "unknown"}`,
      };
    }
  }

  return { ok: true, body: rawBody };
}

export function isAllowedHost(host: string | null): boolean {
  if (!host) return false;

  const normalized = host.toLowerCase().split(":")[0];
  return (
    normalized === "solreclaim.app" ||
    normalized === "www.solreclaim.app" ||
    normalized.endsWith(".workers.dev") ||
    normalized === "localhost" ||
    normalized === "127.0.0.1"
  );
}
