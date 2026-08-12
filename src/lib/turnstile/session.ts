import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { getServerEnv } from "@/lib/solana/env";

export const VERIFICATION_SESSION_COOKIE = "sr_bot_ok";

/** How long a browser can skip Turnstile after one successful check. */
export const VERIFICATION_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getSessionSecret(): string | undefined {
  return getServerEnv("TURNSTILE_SECRET");
}

export function createVerificationSessionToken(): string | null {
  const secret = getSessionSecret();
  if (!secret) return null;

  const exp = Date.now() + VERIFICATION_SESSION_TTL_MS;
  const nonce = randomBytes(16).toString("hex");
  const payload = `${exp}.${nonce}`;
  const signature = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");

  return `${payload}.${signature}`;
}

export function isVerificationSessionValid(
  token: string | null | undefined
): boolean {
  if (!token) return false;

  const secret = getSessionSecret();
  if (!secret) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [expRaw, nonce, signature] = parts;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  if (!nonce || !signature) return false;

  const payload = `${expRaw}.${nonce}`;
  const expected = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");

  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function verificationSessionCookieOptions(token: string) {
  return {
    name: VERIFICATION_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: Math.floor(VERIFICATION_SESSION_TTL_MS / 1000),
    path: "/",
  };
}
