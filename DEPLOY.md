# Deploy SOL Reclaim (Cloudflare Workers)

## 1. GitHub

Code lives at [github.com/sparky2ste/sol](https://github.com/sparky2ste/sol).

## 2. Cloudflare Workers (Pages)

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → connect **sparky2ste/sol**
2. Framework: **Next.js** (auto-detected)
3. **Build command:** `npm run build`
4. **Deploy command:** `npx wrangler deploy`
5. Add **Environment variables** (Production):

| Name | Value |
|------|--------|
| `HELIUS_API_KEY` | Your key from [helius.dev](https://helius.dev) |
| `NEXT_PUBLIC_FEE_WALLET` | Your Solana wallet address (receives 1% fees) |

6. Deploy

Your site will be live at `https://sol.<your-subdomain>.workers.dev` until you add a custom domain.

## 3. Custom domain (Cloudflare)

Workers & Pages → your project → **Custom domains** → add your domain. DNS stays in Cloudflare.

## 4. After deploy — checklist

- [ ] Connect wallet on the **live URL** (not localhost)
- [ ] Scan finds empty accounts
- [ ] Claim transaction succeeds and SOL arrives in wallet
- [ ] 1% fee lands in `NEXT_PUBLIC_FEE_WALLET`
- [ ] Test on mobile: **Open in Phantom** → connect → claim
- [ ] Enable **2FA** on GitHub and Cloudflare
- [ ] Rotate Helius key if it was ever shared publicly

## 5. Local development

```bash
cp .env.example .env.local
# Edit .env.local with your keys
npm install
npm run dev
```

If you see cache errors: `npm run dev:clean`

Preview in the Workers runtime locally: `npm run preview`

## Security notes

- Users never send seed phrases; all txs are signed in their wallet
- `HELIUS_API_KEY` stays server-side only
- API routes have basic rate limiting
- Never commit `.env.local`
