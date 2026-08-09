import { readFileSync } from "fs";
import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, AccountLayout } from "@solana/spl-token";

const env = readFileSync(".env.local", "utf8");
const key = env.match(/HELIUS_API_KEY=(.+)/)?.[1]?.trim();
const owner = new PublicKey(process.argv[2]);
const rpcs = [
  key ? `https://mainnet.helius-rpc.com/?api-key=${key}` : null,
  "https://api.mainnet-beta.solana.com",
].filter(Boolean);

for (const url of rpcs) {
  console.log("\nRPC:", url.includes("helius") ? "helius" : url);
  const c = new Connection(url, "confirmed");

  for (const [pid, label] of [
    [TOKEN_PROGRAM_ID, "SPL"],
    [TOKEN_2022_PROGRAM_ID, "T22"],
  ]) {
    const parsed = await c.getParsedTokenAccountsByOwner(owner, { programId: pid });
    const raw = await c.getTokenAccountsByOwner(owner, { programId: pid });
    console.log(`${label} parsed=${parsed.value.length} raw=${raw.value.length}`);

    let empty = 0;
    for (const { account } of raw.value) {
      const data = AccountLayout.decode(account.data);
      if (data.amount === 0n) empty++;
    }
    console.log(`${label} raw empty=${empty}`);
  }

  const gp = await c.getProgramAccounts(TOKEN_PROGRAM_ID, {
    filters: [{ memcmp: { offset: 32, bytes: owner.toBase58() } }],
  });
  console.log("getProgramAccounts SPL:", gp.length);
}
