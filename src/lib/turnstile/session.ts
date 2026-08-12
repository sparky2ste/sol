import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { getTurnstileSecretForRequest } from "./config";

export const VERIFICATION_SESSION_COOKIE = "sr_bot_ok";

/** How long a browser can skip Turnstile after one successful check. */
export const VERIFICATION_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getSessionSecret(requestHost: string): string | undefined {
  return getTurnstileSecretForRequest(requestHost);
}

export function createVerificationSessionToken(
  requestHost: string
): string | null {
  const secret = getSessionSecret(requestHost);
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
  token: string | null | undefined,
  requestHost: string
): boolean {
  if (!token) return false;

  const secret = getSessionSecret(requestHost);
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
