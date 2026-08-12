import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const openNextOnly = process.argv.includes("--opennext-only");
const isCi =
  process.env.CI === "true" ||
  process.env.CF_PAGES === "1" ||
  process.env.WORKERS_CI === "1";

const standaloneDir = ".next/standalone";

function hasStandaloneOutput() {
  return (
    fs.existsSync(standaloneDir) &&
    fs.existsSync(".next/standalone/.next/server/pages-manifest.json")
  );
}

function runNextBuild() {
  console.log("Running next build (standalone)...");
  execSync("next build", { stdio: "inherit" });
}

function ensureStandaloneOutput() {
  if (hasStandaloneOutput()) {
    return;
  }

  if (fs.existsSync(".next")) {
    console.log(
      "Incomplete .next output (missing standalone) — clearing and rebuilding..."
    );
    fs.rmSync(".next", { recursive: true, force: true });
  }

  runNextBuild();

  if (!hasStandaloneOutput()) {
    throw new Error(
      "Next.js did not produce .next/standalone. Check next.config.ts has output: 'standalone' and disable Cloudflare build cache."
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
  execSync("opennextjs-cloudflare build --skipNextBuild", {
    stdio: "inherit",
  });
}

if (openNextOnly) {
  ensureStandaloneOutput();
  runOpenNextBundle();
} else {
  if (isCi || !hasStandaloneOutput()) {
    for (const dir of [".next", ".open-next"]) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
  runNextBuild();
  ensureStandaloneOutput();
  runOpenNextBundle();
}
