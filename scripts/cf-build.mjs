import { execSync } from "node:child_process";
import fs from "node:fs";

// Cloudflare build cache can restore .next without standalone output.
for (const dir of [".next", ".open-next"]) {
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log("Running next build (standalone)...");
execSync("next build", { stdio: "inherit" });

const manifest = ".next/standalone/.next/server/pages-manifest.json";
if (!fs.existsSync(manifest)) {
  throw new Error(
    `Missing ${manifest} after next build. Turn off Cloudflare build cache and redeploy.`
  );
}

console.log("Running OpenNext bundle...");
execSync("opennextjs-cloudflare build --skipNextBuild", { stdio: "inherit" });
