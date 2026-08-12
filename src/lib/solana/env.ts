import { getCloudflareContext } from "@opennextjs/cloudflare";

function readFromProcessEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function readFromCloudflareEnv(name: string): string | undefined {
  try {
    const value = (
      getCloudflareContext().env as unknown as Record<string, string | undefined>
    )[name]?.trim();
    return value || undefined;
  } catch {
    return undefined;
  }
}

/** Read a server secret from process.env or the Cloudflare Worker env binding. */
export function getServerEnv(name: string): string | undefined {
  return readFromProcessEnv(name) ?? readFromCloudflareEnv(name);
}
