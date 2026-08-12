# Deploy SOL Reclaim (Cloudflare Workers)

## GitHub

[github.com/sparky2ste/sol](https://github.com/sparky2ste/sol)

## Cloudflare build settings

| Setting | Value |
|---|---|
| **Build command** | `npm run build` |
| **Deploy command** | `node scripts/cf-deploy.mjs` |

`npm run build` runs a full Next.js + OpenNext bundle. In CI it clears stale `.next` / `.open-next` cache automatically.

**If deploy still fails:** turn off **build cache** in Cloudflare Workers settings, then redeploy.

**Environment variables:**

| Name | Where | Value |
|---|---|---|
| `HELIUS_API_KEY` | **Build** → Variables and secrets (encrypted) | Your Helius key |
| `HELIUS_API_KEY` | Also set under **Settings** → **Variables and Secrets** if not using the deploy script | Same key |

The deploy script uploads `HELIUS_API_KEY` from build secrets to the live worker on every deploy.

The fee wallet (`8SHY8J3gy6L9aaZzmQdR4JJTgZXBH3ArkJVWKw1ES9eH`) is baked into the codebase and `wrangler.jsonc`. Do not remove it.

## Custom domain flagged as phishing?

New crypto domains are often false positives. Request review:

- [Google Safe Browsing report](https://safebrowsing.google.com/safebrowsing/report_error/)
- [VirusTotal contact](https://www.virustotal.com/gui/contact-us)

Use your `.workers.dev` URL while waiting (2–7 days).

## Local dev

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

If cache errors: `npm run dev:clean`
