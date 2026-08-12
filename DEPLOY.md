# Deploy SOL Reclaim (Cloudflare Workers)

## GitHub

[github.com/sparky2ste/sol](https://github.com/sparky2ste/sol)

## Cloudflare build settings

| Setting | Value |
|---|---|
| **Build command** | `npm run build` |
| **Deploy command** | `npx wrangler deploy` |

`npm run build` runs a full Next.js + OpenNext bundle. In CI it clears stale `.next` / `.open-next` cache automatically.

**If deploy still fails:** turn off **build cache** in Cloudflare Workers settings, then redeploy.

**Environment variables:**

| Name | Value |
|---|---|
| `HELIUS_API_KEY` | Your Helius key |
| `NEXT_PUBLIC_FEE_WALLET` | Solana wallet for 1% fees |

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
