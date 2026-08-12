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
| `TURNSTILE_SECRET` | **Build** → Variables and secrets (encrypted) | Turnstile widget secret (Cloudflare → Turnstile → your widget) |

The deploy script uploads `HELIUS_API_KEY` and `TURNSTILE_SECRET` from build secrets to the live worker on every deploy.

The fee wallet (`8SHY8J3gy6L9aaZzmQdR4JJTgZXBH3ArkJVWKw1ES9eH`) is baked into the codebase and `wrangler.jsonc`. Do not remove it.

## Custom domain flagged as phishing?

`solreclaim.app` returning **403 Suspected Phishing** is Cloudflare Trust & Safety, not a bug in your app. The worker on `sol.sparky2ste.workers.dev` is fine.

### Fix it (you must do this)

1. Check email (including spam) for **abusereply@cloudflare.com** and reply to it.
2. If no email, send an appeal to **abusereply@cloudflare.com** with:
   - Domain: `solreclaim.app`
   - Working staging URL: `https://sol.sparky2ste.workers.dev`
   - GitHub: `https://github.com/sparky2ste/sol`
   - Explain: non-custodial Solana rent reclaim tool, never asks for seed phrase, users sign in Phantom/Solflare only
   - Link: `https://solreclaim.app/.well-known/security.txt`
3. Also report false positive to [Google Safe Browsing](https://safebrowsing.google.com/safebrowsing/report_error/) (Chrome uses this too).

**Timeline:** usually **2 to 7 days**, sometimes **1 to 3 weeks**. Only Cloudflare Trust & Safety can remove their block.

### Cloudflare settings to verify while waiting

In [Cloudflare Dashboard](https://dash.cloudflare.com) → **solreclaim.app**:

| Setting | Where | Use |
|---|---|---|
| SSL/TLS mode | SSL/TLS → Overview | **Full** or **Full (strict)** (not Flexible) |
| Custom domain | Workers & Pages → **sol** → Settings → Domains | `solreclaim.app` attached |
| www DNS | DNS → Records | CNAME `www` → `solreclaim.app` (optional) |

Use your `.workers.dev` URL for sharing until the flag is cleared.

## Local dev

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

If cache errors: `npm run dev:clean`
