import { getCloudflareContext } from "@opennextjs/cloudflare";

export const ORACLE_AI_MODEL =
  "@cf/meta/llama-3.1-8b-instruct-fp8" as const;

export const ORACLE_AI_FALLBACK_MODEL =
  "@cf/meta/llama-3.3-70b-instruct-fp8-fast" as const;

export async function getWorkersAi(): Promise<Ai> {
  const { env } = await getCloudflareContext({ async: true });
  return env.AI;
}
