import type { OracleSocialMention } from "./types";

export function buildSocialMentions(
  symbol: string,
  socials: { platform: string; handle: string; url: string }[],
  websites: string[]
): OracleSocialMention[] {
  const mentions: OracleSocialMention[] = socials.map((s) => ({
    platform: s.platform,
    handle: s.handle,
    url: s.url,
    source: "dexscreener" as const,
  }));

  if (symbol && symbol !== "???") {
    mentions.push({
      platform: "twitter",
      handle: `$${symbol}`,
      url: `https://x.com/search?q=%24${encodeURIComponent(symbol)}&f=live`,
      source: "search",
    });
    mentions.push({
      platform: "twitter",
      handle: symbol,
      url: `https://x.com/search?q=${encodeURIComponent(symbol)}&f=live`,
      source: "search",
    });
  }

  for (const site of websites.slice(0, 3)) {
    try {
      mentions.push({
        platform: "website",
        handle: new URL(site).hostname,
        url: site,
        source: "profile",
      });
    } catch {
      mentions.push({
        platform: "website",
        handle: site.slice(0, 24),
        url: site,
        source: "profile",
      });
    }
  }

  const seen = new Set<string>();
  return mentions.filter((m) => {
    if (!m.url || m.url.includes("undefined")) return false;
    const key = `${m.platform}:${m.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
