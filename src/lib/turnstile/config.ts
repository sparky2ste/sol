/** Public Turnstile site key (safe in client bundle). */
export const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ??
  "0x4AAAAAAEN73ypJrJaLKLL2";

/** Cloudflare dummy keys: work on any hostname (for *.workers.dev staging). */
export const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA";
export const TURNSTILE_TEST_SECRET =
  "1x0000000000000000000000000000000AA";

export const TURNSTILE_ACTION_SCAN = "wallet_scan";

const DEFAULT_HOSTNAMES = [
  "solreclaim.app",
  "www.solreclaim.app",
  "sol.sparky2ste.workers.dev",
];

export function isWorkersDevHost(hostname: string): boolean {
  return hostname.toLowerCase().endsWith(".workers.dev");
}

/** Use Turnstile test keys on workers.dev when the widget domain is not registered. */
export function isTurnstileTestMode(hostname: string): boolean {
  return isWorkersDevHost(hostname);
}

export function getTurnstileSiteKey(hostname?: string): string {
  if (hostname && isTurnstileTestMode(hostname)) {
    return TURNSTILE_TEST_SITE_KEY;
  }
  return TURNSTILE_SITE_KEY;
}

export function getTurnstileSecretForRequest(
  requestHost: string
): string | undefined {
  if (isTurnstileTestMode(requestHost)) {
    return TURNSTILE_TEST_SECRET;
  }
  return process.env.TURNSTILE_SECRET?.trim() || undefined;
}

export function getTurnstileHostnames(requestHost?: string): Set<string> {
  const raw = process.env.TURNSTILE_HOSTNAMES?.trim();
  const list = raw
    ? raw.split(",").map((h) => h.trim()).filter(Boolean)
    : [...DEFAULT_HOSTNAMES];

  if (process.env.NODE_ENV !== "production") {
    list.push("localhost", "127.0.0.1");
  }

  if (requestHost) {
    const normalized = requestHost.toLowerCase().split(":")[0];
    list.push(normalized);
  }

  return new Set(list);
}
