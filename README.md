# SOL Reclaim

Non-custodial Solana wallet cleaner. Reclaim SOL locked in empty SPL token accounts.

**1% platform fee** · **optional tips** · connect wallet on-site

## Setup

1. Install [Node.js](https://nodejs.org/) (v18+)

2. Install dependencies:

```bash
npm install
```

3. Copy env file and set your fee wallet:

```bash
copy .env.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
NEXT_PUBLIC_FEE_WALLET=YourSolanaWalletAddressHere
```

Use a dedicated wallet for fees/tips. Get a free RPC from [Helius](https://helius.dev) or [QuickNode](https://quicknode.com). Public RPC is slow and rate-limited.

4. Run dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## How fees work

- User reclaims rent from empty token accounts (~0.002 SOL each)
- Platform takes **1%** of gross reclaimed amount (transfer in same tx)
- User can add an **optional tip** (preset or custom amount)
- Fee + tip go to `NEXT_PUBLIC_FEE_WALLET`

## Deploy

Deploy to [Vercel](https://vercel.com):

```bash
npm run build
```

Set the same env vars in Vercel dashboard.

## Safety

- **Fun Mode only**: closes empty accounts, never burns tokens
- Non-custodial: wallet adapter, user signs everything
- Batch transactions (20 closes per tx) for large wallets

## Next steps (optional)

- [ ] Pro Mode: burn spam tokens (with safety checks)
- [ ] Pre-trade safety checker
- [ ] Telegram alerts when reclaimable SOL > threshold
