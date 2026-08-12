export function formatOracleError(err: unknown): string {
  if (typeof err === "string" && err.trim()) return err;

  if (err instanceof Error) {
    if (err.message.trim()) return err.message;

    const name = err.name ?? "";
    if (name.includes("TokenAccountNotFound") || name.includes("TokenInvalidAccountOwner")) {
      return "Token mint not found or uses an unsupported token program.";
    }
    if (name.includes("TokenInvalidMint")) {
      return "That address is not a valid token mint.";
    }
  }

  return "Failed to analyze token. Try the token mint (CA) from DexScreener, not the pool address.";
}
