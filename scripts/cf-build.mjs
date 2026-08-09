import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// Cloudflare build cache can restore .next without standalone output.
for (const dir of [".next", ".open-next"]) {
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log("Running next build (standalone)...");
execSync("next build", { stdio: "inherit" });

const standaloneManifest = ".next/standalone/.next/server/pages-manifest.json";
const rootManifest = ".next/server/pages-manifest.json";

if (!fs.existsSync(standaloneManifest)) {
  if (fs.existsSync(rootManifest)) {
    console.log("Copying pages-manifest.json into standalone output...");
    fs.mkdirSync(path.dirname(standaloneManifest), { recursive: true });
    fs.copyFileSync(rootManifest, standaloneManifest);
  } else {
    throw new Error(
      `Missing ${standaloneManifest} after next build. Turn off Cloudflare build cache and redeploy.`
    );
  }
}

console.log("Running OpenNext bundle...");
execSync("opennextjs-cloudflare build --skipNextBuild", { stdio: "inherit" });
