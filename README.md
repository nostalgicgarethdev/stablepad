<p align="center">
  <img src="assets/logo.jpg" alt="Stablepad" width="120" style="border-radius: 50%">
</p>

<h1 align="center">Stablepad</h1>

<p align="center">
  <strong>Meme-stable launchpad on Solana</strong><br>
  Launch stablecoins backed 1:1 by USDC or USD1 · curve → DLMM · $STABLEPAD flywheel
</p>

<p align="center">
  <a href="https://stablepad.vercel.app"><img src="https://img.shields.io/badge/website-live-22c55e?style=for-the-badge" alt="Live website"></a>
  <a href="https://nostalgicgarethdev.github.io/stablepad/"><img src="https://img.shields.io/badge/github-pages-222?style=for-the-badge&logo=github" alt="GitHub Pages"></a>
  <a href="https://github.com/nostalgicgarethdev/stablepad"><img src="https://img.shields.io/badge/github-repo-181717?style=for-the-badge&logo=github" alt="GitHub"></a>
  <a href="https://vercel.com"><img src="https://img.shields.io/badge/deployed-vercel-000?style=for-the-badge&logo=vercel" alt="Vercel"></a>
</p>

<p align="center">
  <a href="https://stablepad.vercel.app"><strong>stablepad.vercel.app</strong></a>
  &nbsp;·&nbsp;
  <a href="https://nostalgicgarethdev.github.io/stablepad/">GitHub Pages</a>
</p>

---

## Overview

Stablepad lets anyone launch a **meme-stable** on Solana — fully backed 1:1 by proven collateral (USDC or USD1). Tokens start on a bonding curve, graduate to **Meteora DLMM** pools, and protocol fees feed the **$STABLEPAD** flywheel.

| | |
|---|---|
| **Backing** | 1:1 USDC or USD1 |
| **Launch** | Bonding curve (pump program) |
| **Graduation** | Meteora DLMM concentrated liquidity |
| **Flywheel** | $STABLEPAD |
| **Live data** | pump.fun API via Vercel proxy |

---

## Features

- **1:1 collateral** — meme-stables backed by USDC or USD1, not synthetic pegs
- **Live explore feed** — real market cap, curve progress, and graduation status
- **Wallet connect** — Phantom integration for launch & trade flows
- **API proxy** — serverless routes bypass pump.fun CORS restrictions
- **Promo video** — built-in Playwright recorder for social clips

---

## Quick start

```bash
git clone https://github.com/nostalgicgarethdev/stablepad.git
cd stablepad
npm install
npm run dev
```

Open **http://localhost:5180** (requires [Vercel CLI](https://vercel.com/docs/cli) for API routes).

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Local dev server with API proxy |
| `npm run deploy` | Deploy to Vercel production |
| `npm run record` | Record promo video → `output/stablepad-demo.mp4` |

---

## Architecture

```mermaid
flowchart LR
  A[Browser] --> B[Stablepad UI]
  B --> C[/api/coins]
  B --> D[/api/sol-price]
  C --> E[pump.fun v3 API]
  D --> E
  B --> F[Phantom Wallet]
  B --> G[pump.fun trades]
```

**Flow**

1. **Launch** — pick USDC or USD1 backing, deploy via pump program
2. **Curve** — crowdsourced liquidity on bonding curve (~85 SOL graduation)
3. **DLMM** — liquidity migrates to Meteora concentrated pools
4. **Flywheel** — fees accumulate into $STABLEPAD

---

## Project structure

```
stablepad/
├── api/              # Vercel serverless proxy (coins, sol-price)
├── assets/           # Logo & favicon
├── css/              # Styles
├── js/               # Frontend app
├── lib/              # Config, pump API client, wallet helpers
├── idl/              # Pump program IDL (reference)
├── demo.html         # Animated promo for video recording
├── record-demo.mjs    # Playwright → MP4 pipeline
├── index.html        # Landing page
└── vercel.json       # Deploy config
```

---

## Deploy

```bash
npm i -g vercel
vercel link
vercel --prod
```

No environment variables are required for the current build. Live market data is fetched through the included API proxy.

---

## Security

This repo runs **without API keys or wallet secrets**. Audited clean — nothing sensitive is committed or linked.

| Status | Item |
|--------|------|
| ✅ | No API keys, private keys, or seed phrases in source |
| ✅ | No `.env` files on GitHub (gitignored) |
| ✅ | No `.vercel/` link metadata on GitHub (gitignored) |
| ✅ | No GitHub Actions secrets configured |
| ✅ | Wallet connect uses Phantom only — keys never touch the app |

**Public by design** (not secrets): Solana program IDs, USDC/USD1 mint addresses, and the public mainnet RPC in `lib/config.js`.

**Before you push**, run the secret scanner:

```bash
npm run check:secrets
```

If you add env-based config later, copy `.env.example` → `.env` locally and never commit the real file.

---

## Reference

Built on patterns from [pumprecovery](https://github.com/staccDOTsol/pumprecovery). See [REFERENCE.md](./REFERENCE.md) for integration notes.

---

## License

Private / all rights reserved unless otherwise specified by the project owner.