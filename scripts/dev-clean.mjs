import { rmSync } from "node:fs";
import { spawn } from "node:child_process";

try {
  rmSync(".next", { recursive: true, force: true });
  console.log("Removed .next cache");
} catch {
  console.log("No .next cache to remove");
}

const child = spawn("npx", ["next", "dev"], {
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));
