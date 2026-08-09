/** Mobile wallet helpers for Phantom / Solflare in-app browsers. */

export function isMobileUserAgent(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

export function isPhantomInAppBrowser(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.phantom?.solana?.isPhantom);
}

export function isSolflareInAppBrowser(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    (window as Window & { solflare?: { isSolflare?: boolean } }).solflare
      ?.isSolflare
  );
}

export function getCurrentPageUrl(): string {
  if (typeof window === "undefined") return "";
  return window.location.href;
}

/** Opens this site inside Phantom's in-app browser (mobile Safari/Chrome). */
export function getPhantomBrowseUrl(pageUrl = getCurrentPageUrl()): string {
  return `https://phantom.app/ul/browse/${encodeURIComponent(pageUrl)}`;
}

/** Opens this site inside Solflare's in-app browser. */
export function getSolflareBrowseUrl(pageUrl = getCurrentPageUrl()): string {
  return `https://solflare.com/ul/v1/browse/${encodeURIComponent(pageUrl)}`;
}

export function getPhantomStoreUrl(): string {
  if (isIOS()) {
    return "https://apps.apple.com/app/phantom-solana-wallet/id1598432977";
  }
  if (isAndroid()) {
    return "https://play.google.com/store/apps/details?id=app.phantom";
  }
  return "https://phantom.app/download";
}

export function getSolflareStoreUrl(): string {
  return "https://solflare.com/download";
}

export type MobileWalletContext = {
  isMobile: boolean;
  inPhantomBrowser: boolean;
  inSolflareBrowser: boolean;
  inWalletBrowser: boolean;
};

export function getMobileWalletContext(): MobileWalletContext {
  const inPhantomBrowser = isPhantomInAppBrowser();
  const inSolflareBrowser = isSolflareInAppBrowser();
  return {
    isMobile: isMobileUserAgent(),
    inPhantomBrowser,
    inSolflareBrowser,
    inWalletBrowser: inPhantomBrowser || inSolflareBrowser,
  };
}
