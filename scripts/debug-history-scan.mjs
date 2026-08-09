import { readFileSync } from "fs";
import { Connection, PublicKey } from "@solana/web3.js";
import { getAccount, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

const key = readFileSync(".env.local", "utf8").match(/HELIUS_API_KEY=(.+)/)[1].trim();
const owner = new PublicKey(process.argv[2]);
const c = new Connection(`https://mainnet.helius-rpc.com/?api-key=${key}`, "confirmed");

const sigs = await c.getSignaturesForAddress(owner, { limit: 200 });
const tokenAccounts = new Set();

for (const { signature } of sigs) {
  const tx = await c.getParsedTransaction(signature, {
    maxSupportedTransactionVersion: 0,
  });
  if (!tx?.meta) continue;

  for (const bal of [
    ...(tx.meta.preTokenBalances ?? []),
    ...(tx.meta.postTokenBalances ?? []),
  ]) {
    if (bal.owner === owner.toBase58() && bal.accountIndex !== undefined) {
      const key = tx.transaction.message.accountKeys[bal.accountIndex]?.pubkey;
      if (key) tokenAccounts.add(key.toBase58());
    }
  }
}

console.log("token accounts from tx history:", tokenAccounts.size);

let empty = 0;
let emptyRent = 0;
let skipped = 0;

for (const addr of tokenAccounts) {
  try {
    const info = await c.getAccountInfo(new PublicKey(addr));
    if (!info) continue;
    const program = info.owner.equals(TOKEN_PROGRAM_ID)
      ? TOKEN_PROGRAM_ID
      : info.owner.equals(TOKEN_2022_PROGRAM_ID)
        ? TOKEN_2022_PROGRAM_ID
        : null;
    if (!program) continue;

    const acct = await getAccount(c, new PublicKey(addr), "confirmed", program);
    if (acct.amount === 0n) {
      empty++;
      emptyRent += info.lamports;
    } else {
      skipped++;
    }
  } catch {
    // closed
  }
}

console.log({ empty, skipped, emptyRentSol: emptyRent / 1e9 });
