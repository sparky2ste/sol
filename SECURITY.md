# Security hardening: SOL Reclaim

## Turn on Bot Fight Mode (do this now)

Your site is live and working. Enable this next:

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → select **solreclaim.app** (your domain, not only the Worker)
2. **Security** → **Bots**
3. Turn on **Bot Fight Mode** (free)

This blocks obvious bad bots before they hit your API. Safe to enable anytime after deploy.

Optional later: **AI Labyrinth** (Security → Bots). Low priority.

---

## What the app protects

- **Non-custodial**: never asks for seed phrases or private keys
- **RPC proxy locked down**: only allowed JSON-RPC methods, size limits, host check
- **Rate limits** on `/api/scan`, `/api/rpc`, `/api/status`, `/api/claims/recent`
- **Security headers**: X-Frame-Options, nosniff, HSTS, etc.
- **security.txt**: `https://solreclaim.app/.well-known/security.txt`

---

## Rotate your Helius key (recommended)

The Helius API key was committed in `wrangler.jsonc` to fix deploy issues. Anyone with repo access could abuse your RPC quota.

1. Regenerate key at [helius.dev](https://helius.dev)
2. Update `HELIUS_API_KEY` in Cloudflare **Variables and Secrets** (or `wrangler.jsonc` vars)
3. Redeploy

### Turnstile (wallet scan)

Site key is in `wrangler.jsonc` as `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.

Add **`TURNSTILE_SECRET`** from Cloudflare → **Turnstile** → your widget → **Secret key** to Workers Builds secrets (same place as `HELIUS_API_KEY`).

---

## Report a vulnerability

Email: security@solreclaim.app

See `/.well-known/security.txt` for details.
