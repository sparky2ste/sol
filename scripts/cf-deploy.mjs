import { execSync } from "node:child_process";

function putSecret(name, value) {
  if (!value) {
    console.warn(`${name} not in build env — skipping secret upload.`);
    return;
  }

  console.log(`Setting ${name} worker secret...`);
  execSync(`npx wrangler secret put ${name}`, {
    stdio: ["pipe", "inherit", "inherit"],
    input: value,
  });
}

putSecret("HELIUS_API_KEY", process.env.HELIUS_API_KEY?.trim());
putSecret("TURNSTILE_SECRET", process.env.TURNSTILE_SECRET?.trim());

console.log("Deploying worker...");
execSync("npx wrangler deploy --keep-vars", { stdio: "inherit" });
