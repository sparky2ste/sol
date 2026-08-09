# Deploy SOL Reclaim (Vercel)

## 1. Push to GitHub

Git is already set up in this project with an initial commit on branch `main`.

### Create the repo on GitHub

1. Open [github.com/new](https://github.com/new)
2. Repository name: `sol-reclaim` (or your choice)
3. **Private** or **Public** — either works
4. Do **not** add README, .gitignore, or license (this project already has them)
5. Click **Create repository**

### Push your code

Replace `YOUR_USERNAME` with your GitHub username, then run in PowerShell:

```powershell
cd "c:\Users\hulsh\Downloads\memecoin project"
$env:Path = "C:\Program Files\Git\bin;" + $env:Path
git remote add origin https://github.com/YOUR_USERNAME/sol-reclaim.git
git push -u origin main
```

Sign in when GitHub asks (browser or token).

**Optional — GitHub CLI (after `gh auth login`):**

```powershell
gh repo create sol-reclaim --private --source=. --remote=origin --push
```

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
