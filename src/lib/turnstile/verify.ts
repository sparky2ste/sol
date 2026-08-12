import {
  getTurnstileHostnames,
  getTurnstileSecretForRequest,
  isTurnstileTestMode,
} from "./config";

interface SiteverifyResult {
  success?: boolean;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
}

export async function verifyTurnstileToken(
  token: string | null | undefined,
  expectedAction: string,
  clientIp: string,
  requestHost: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const secret = getTurnstileSecretForRequest(requestHost);
  if (!secret) {
    return { ok: false, message: "Bot verification is not configured." };
  }

  const expectedHostnames = getTurnstileHostnames(requestHost);
  if (expectedHostnames.size === 0) {
    return { ok: false, message: "Bot verification is not configured." };
  }

  if (typeof token !== "string" || token.length === 0 || token.length > 2048) {
    return { ok: false, message: "Complete the security check and try again." };
  }

  let result: SiteverifyResult;
  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        signal: AbortSignal.timeout(10_000),
        body: new URLSearchParams({
          secret,
          response: token,
          remoteip: clientIp,
        }),
      }
    );

    if (!response.ok) {
      return { ok: false, message: "Security check failed. Try again." };
    }

    result = (await response.json()) as SiteverifyResult;
  } catch {
    return { ok: false, message: "Security check failed. Try again." };
  }

  const actionOk =
    isTurnstileTestMode(requestHost) ||
    result.action === expectedAction;

  const hostnameOk =
    isTurnstileTestMode(requestHost) ||
    (!!result.hostname && expectedHostnames.has(result.hostname));

  if (!result.success || !actionOk || !hostnameOk) {
    return { ok: false, message: "Security check failed. Try again." };
  }

  return { ok: true };
}
