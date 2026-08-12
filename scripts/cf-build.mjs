import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const openNextOnly = process.argv.includes("--opennext-only");

const standaloneManifest = ".next/standalone/.next/server/pages-manifest.json";
const rootManifest = ".next/server/pages-manifest.json";

function runNextBuild() {
  console.log("Running next build (standalone)...");
  execSync("next build", { stdio: "inherit" });
}

function ensureStandaloneManifest() {
  if (!fs.existsSync(standaloneManifest)) {
    if (fs.existsSync(rootManifest)) {
      console.log("Copying pages-manifest.json into standalone output...");
      fs.mkdirSync(path.dirname(standaloneManifest), { recursive: true });
      fs.copyFileSync(rootManifest, standaloneManifest);
      return;
    }

    if (openNextOnly && fs.existsSync(".next")) {
      console.log("Stale build cache detected — rebuilding Next.js output...");
      fs.rmSync(".next", { recursive: true, force: true });
      runNextBuild();
    }

    if (fs.existsSync(rootManifest)) {
      fs.mkdirSync(path.dirname(standaloneManifest), { recursive: true });
      fs.copyFileSync(rootManifest, standaloneManifest);
      return;
    }

    throw new Error(
      `Missing ${standaloneManifest}. Disable Cloudflare build cache and redeploy.`
    );
  }
}

function runOpenNextBundle() {
  if (fs.existsSync(".open-next/worker.js")) {
    console.log("OpenNext bundle already present, skipping.");
    return;
  }

  fs.rmSync(".open-next", { recursive: true, force: true });
  console.log("Running OpenNext bundle...");
  execSync("opennextjs-cloudflare build --skipNextBuild", { stdio: "inherit" });
}

if (openNextOnly) {
  ensureStandaloneManifest();
  runOpenNextBundle();
} else {
  for (const dir of [".next", ".open-next"]) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  runNextBuild();
  ensureStandaloneManifest();
  runOpenNextBundle();
}
