import { execSync } from "node:child_process";

const key = process.env.HELIUS_API_KEY?.trim();

if (key) {
  console.log("Setting HELIUS_API_KEY worker secret...");
  execSync("npx wrangler secret put HELIUS_API_KEY", {
    stdio: ["pipe", "inherit", "inherit"],
    input: key,
  });
} else {
  console.warn(
    "HELIUS_API_KEY not in build env — skipping secret upload. Add it to Workers Builds secrets."
  );
}

console.log("Deploying worker...");
execSync("npx wrangler deploy --keep-vars", { stdio: "inherit" });
