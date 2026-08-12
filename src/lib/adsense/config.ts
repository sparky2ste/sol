/** Google AdSense publisher client id (public, safe in client bundle). */
export const ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "ca-pub-8801745926648448";

/** Create a display ad unit in AdSense and paste the slot id here. */
export const ADSENSE_SLOT =
  process.env.NEXT_PUBLIC_ADSENSE_SLOT?.trim() ?? "2576709759";

/** Google demo publisher + slot — visible test ads on any domain. */
export const ADSENSE_DEMO_CLIENT = "ca-pub-3940256099942544";
export const ADSENSE_DEMO_SLOT = "6300978111";

export function adsenseScriptUrl(client: string): string {
  return `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
}

export function isAdSenseTestMode(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".workers.dev")
  );
}

export function getAdSenseConfig(hostname: string): {
  client: string;
  slot: string;
  scriptUrl: string;
  demo: boolean;
} {
  if (isAdSenseTestMode(hostname)) {
    return {
      client: ADSENSE_DEMO_CLIENT,
      slot: ADSENSE_DEMO_SLOT,
      scriptUrl: adsenseScriptUrl(ADSENSE_DEMO_CLIENT),
      demo: true,
    };
  }

  return {
    client: ADSENSE_CLIENT,
    slot: ADSENSE_SLOT,
    scriptUrl: adsenseScriptUrl(ADSENSE_CLIENT),
    demo: false,
  };
}
