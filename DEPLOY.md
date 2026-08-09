# Deploy SOL Reclaim (Vercel)

## 1. Push to GitHub

1. Create a repo at [github.com/new](https://github.com/new)
2. Push this project (do **not** commit `.env.local`)

## 2. Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Framework: **Next.js** (auto-detected)
4. Add **Environment Variables** (Production + Preview):

| Name | Value |
|------|--------|
| `HELIUS_API_KEY` | Your key from [helius.dev](https://helius.dev) |
| `NEXT_PUBLIC_FEE_WALLET` | Your Solana wallet address (receives 1% fees) |

5. Click **Deploy**

Your site will be live at `https://your-project.vercel.app`.

## 3. Custom domain (optional)

Vercel → Project → **Settings → Domains** → add your domain and update DNS.

## 4. After deploy — checklist

- [ ] Connect wallet on the **live URL** (not localhost)
- [ ] Scan finds empty accounts
- [ ] Claim transaction succeeds and SOL arrives in wallet
- [ ] 1% fee lands in `NEXT_PUBLIC_FEE_WALLET`
- [ ] Test on mobile: **Open in Phantom** → connect → claim
- [ ] Enable **2FA** on GitHub and Vercel
- [ ] Rotate Helius key if it was ever shared publicly

## 5. Local development

```bash
cp .env.example .env.local
# Edit .env.local with your keys
npm install
npm run dev
```

If you see cache errors: `npm run dev:clean`

## Security notes

- Users never send seed phrases; all txs are signed in their wallet
- `HELIUS_API_KEY` stays server-side only
- API routes have basic rate limiting
- Never commit `.env.local`
