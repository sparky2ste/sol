import { execSync } from "node:child_process";

const env = { ...process.env };

// OpenNext calls `npm run build` internally. Run Next.js only on that inner call.
if (env.OPENNEXT_BUILD === "1") {
  execSync("next build", { stdio: "inherit", env });
} else {
  env.OPENNEXT_BUILD = "1";
  execSync("opennextjs-cloudflare build", { stdio: "inherit", env });
}
