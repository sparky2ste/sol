import { readFileSync } from "fs";
import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

const env = readFileSync(".env.local", "utf8");
const key = env.match(/HELIUS_API_KEY=(.+)/)?.[1]?.trim();
if (!key) {
  console.error("No HELIUS_API_KEY");
  process.exit(1);
}

const walletArg = process.argv[2];
if (!walletArg) {
  console.error("Usage: node scripts/debug-scan.mjs <wallet>");
  process.exit(1);
}

const connection = new Connection(
  `https://mainnet.helius-rpc.com/?api-key=${key}`,
  "confirmed"
);
const owner = new PublicKey(walletArg);

function getAmount(parsed) {
  const raw = parsed?.tokenAmount?.amount;
  if (raw === undefined || raw === "") return 0n;
  try {
    return BigInt(raw);
  } catch {
    return 0n;
  }
}

async function scanProgram(programId, label) {
  const res = await connection.getParsedTokenAccountsByOwner(owner, {
    programId,
  });
  let empty = 0;
  let skipped = 0;
  let unparsed = 0;
  let emptyRent = 0;
  let skippedRent = 0;
  const skippedSamples = [];

  for (const { account } of res.value) {
    const parsed = account.data.parsed?.info;
    if (!parsed) {
      unparsed++;
      continue;
    }
    const amt = getAmount(parsed);
    const rent = account.lamports;
    if (amt === 0n) {
      empty++;
      emptyRent += rent;
    } else {
      skipped++;
      skippedRent += rent;
      if (skippedSamples.length < 5) {
        skippedSamples.push({
          mint: parsed.mint,
          amount: amt.toString(),
          ui: parsed.tokenAmount?.uiAmount,
          rent,
        });
      }
    }
  }

  console.log(`\n${label}: total=${res.value.length} empty=${empty} skipped=${skipped} unparsed=${unparsed}`);
  console.log(`  empty rent: ${(emptyRent / 1e9).toFixed(6)} SOL`);
  console.log(`  skipped rent: ${(skippedRent / 1e9).toFixed(6)} SOL`);
  if (skippedSamples.length) console.log("  skipped samples:", skippedSamples);
}

await scanProgram(TOKEN_PROGRAM_ID, "SPL Token");
await scanProgram(TOKEN_2022_PROGRAM_ID, "Token-2022");
