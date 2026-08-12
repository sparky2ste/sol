/** Public Turnstile site key (safe in client bundle). */
export const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ??
  "0x4AAAAAAEN73ypJrJaLKLL2";

export const TURNSTILE_ACTION_SCAN = "wallet_scan";

const DEFAULT_HOSTNAMES = [
  "solreclaim.app",
  "www.solreclaim.app",
  "sol.sparky2ste.workers.dev",
];

export function getTurnstileHostnames(): Set<string> {
  const raw = process.env.TURNSTILE_HOSTNAMES?.trim();
  const list = raw
    ? raw.split(",").map((h) => h.trim()).filter(Boolean)
    : DEFAULT_HOSTNAMES;

  if (process.env.NODE_ENV !== "production") {
    list.push("localhost", "127.0.0.1");
  }

  return new Set(list);
}
