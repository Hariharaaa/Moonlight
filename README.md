# FullMoon — Sealed-Bid ZK Auction Marketplace on Midnight

[![CI Pipeline](https://github.com/Hariharaaa/Moonlight/actions/workflows/ci.yml/badge.svg)](https://github.com/Hariharaaa/Moonlight/actions/workflows/ci.yml)
![Level](https://img.shields.io/badge/Midnight%20Builder%20Challenge-Level%206%20Supermoon%20%E2%9C%85%20Approved-00e676?style=flat-square)

> **"Bid without revealing. Lock funds without exposing. Win without exposing anyone else."**
> A privacy-preserving sealed-bid auction marketplace built on the [Midnight Network](https://midnight.network) using Zero-Knowledge proofs. Submitted for **Level 6 – Supermoon** of the Midnight Builder Challenge.

Follow our journey on X (Twitter): [**@rapid_snow**](https://x.com/rapid_snow)

---

## 🚀 Live MVP & Deployed Contract

| | |
|---|---|
| **Live Marketplace UI** | [https://moonlight-nine-theta.vercel.app/](https://moonlight-nine-theta.vercel.app/) |
| **Demo Video** | [Watch on Google Drive](https://drive.google.com/file/d/1qg4hJTYhqA-fe_SDqAnSkwsuwfaTuROQ/view?usp=sharing) |
| **Preprod Contract Address** | `68cfee8397ddbe8d376801af3bfd8c3787da1be37dd8747ea0d390bfde32eed7` |
| **Network** | Midnight Preprod Testnet |

---

## ✅ Level 6 Submission Checklist

- [x] **Working MVP live on Preprod** (Extended with Multi-Seller, Escrow, Dispute/Fallback).
- [x] **70 Verifiable Preprod Users** (Extracted directly from the indexer/contract state — see `USERS.md`).
- [x] **Continuous Documented Feedback Loop** (In-app prompt tracking user satisfaction and bug reports across Round 1 & Round 2 — see `FEEDBACK.md`).
- [x] **Documentation Synced** (README updated with recent feature additions).
- [x] **30+ meaningful commits** (Repo has 60+ meaningful commits).

---

## 👥 Users & Feedback (Level 6 Core)

To fulfill the Level 6 requirements, we extended our privacy-preserving extraction script to verifiably prove testnet usage without leaking user privacy, and continued our continuous feedback loop.

- 📜 **[View the 70 Verifiable Users List](USERS.md)**: Generated via `npm run extract-users`.
- 🗣 **[View the Feedback Loop Log](FEEDBACK.md)**: Tracks features built in response to our Google Form prompts.
  - **Level 5 to Level 6 Evolution**: Based on Round 2 feedback, we improved discoverability by adding a **Search/Filter bar**, added an **Auction Sharing** link generator to support organic growth, and reduced onboarding drop-off by explicitly linking to the Lace extension setup.
- 💬 **Submit Feedback**: [https://github.com/Hariharaaa/Moonlight/issues](https://github.com/Hariharaaa/Moonlight/issues)

---

## 🌟 Marketplace Features (Level 6 MVP)

In Level 6, FullMoon evolved from a single-auction demo into a real **Marketplace**:

1. **Concurrent Auctions**: Multiple sellers can launch independent auctions on a single global contract state (via `auctions: Map<Bytes<32>, Auction>`).
2. **Escrow-Backed Bids (Privacy-Preserved)**: 
   - Users commit their *secret* bid, but lock a *public* escrow amount.
   - The ZK circuit proves `secret_bid <= public_escrow`.
   - Observers see a locked balance, but have no idea what the true bid is.
3. **Winner-Default Handling & Dispute Fallback**: 
   - If a bidder defaults, settlement logic automatically refunds them minus penalties, or sweeps the escrow back.
4. **Cancellation**: Sellers can cancel auctions if no bids are placed.
5. **Refund Sweeps**: Any bidder who loses, or any bidder in a cancelled auction, can securely claim their escrow back.

## 🏗 Tech Stack & Architecture

FullMoon leverages a modern decentralized stack combining cutting-edge zero-knowledge infrastructure with a robust frontend:
- **Smart Contracts (Compact)**: Written in Midnight's native Compact language, ensuring mathematically proven execution of the sealed-bid logic.
- **Frontend (React + Vite)**: A lightning-fast Single Page Application (SPA) providing a seamless, Web2-like user experience.
- **Client-Side Prover (Midnight JS SDK)**: Generates ZK proofs directly in the user's browser (via WebAssembly), ensuring that secrets (like bid amounts and salts) never leave the user's device.
- **On-chain Data (Indexer)**: Real-time global state synchronization via the Midnight GraphQL Indexer.

---

## 🏦 Zero-Knowledge Proof of Reserves (zkPoR)

Beyond the core auction marketplace, FullMoon implements a first-of-its-kind **Confidential Proof of Reserves**.
When users lock escrow to bid, they trust the contract. To prove solvency without leaking total liabilities or individual balances, we use a separate ZK-SNARK (Groth16) workflow:
- **Verifiable Solvency**: The platform periodically publishes a Merkle Root of all user balances (liabilities).
- **Zero Balances Revealed**: Users can independently generate a local inclusion proof (using `snarkjs`) to verify their specific locked escrow is included in the published Merkle Root.
- **Confidentiality**: Observers can verify the cryptographic proof of solvency without learning the total liquidity of the platform or the exact balances of participating users.

---

## 🔒 Privacy Model

This is the core of the FullMoon design. The Midnight Network's Zero-Knowledge architecture is what makes sealed-bid auctions genuinely private — not just obscured.

### What an observer CAN see (public ledger)

| Observable | Why it's public |
|---|---|
| Which addresses placed an escrow lock | Users must mathematically commit funds to bid |
| Escrow lock amount | Funds must be verifiably bound |
| Total number of bids received | Live bid counter, updates in real time |
| The **winning bid amount** | Winner must be verifiable |

### What NOBODY can ever see (private forever)

| Hidden Data | Why it stays secret |
|---|---|
| **The True Bid Amounts** | Hidden securely within the public escrow bounds. Only the hash/commitment is on-chain. |
| **Losing bid amounts** | Never broadcast to the network — ever |
| **The random salt** used for each commitment | Kept in your local browser storage |

---

## 🧪 Test Suite (100% Passing)

We built an extensive local test simulator for the marketplace logic (including cancellation and dispute fallbacks).

```
PASS tests/auction.test.ts
  FullMoon Auction Marketplace Contract
    ✓ Happy Path: User bids, locks escrow, reveals, and settles cleanly
    ✓ Rejection Path: Cannot bid more than locked escrow (ZK Failure)
    ✓ Cancellation: Allowed at 0 bids, blocked if bids exist
    ✓ Dispute/Fallback (Winner Default): If highest bidder defaults (does not reveal), escrow refunds properly
    ✓ Dispute/Fallback (Total Default): If NO ONE reveals, settlement safely returns escrow to all

Tests:       5 passed, 5 total
```

Run them yourself:
```bash
npm test
```

---

## 🛠 Running Locally

### Prerequisites
- Node.js ≥ 22
- Lace browser extension (Midnight-enabled)
- Docker Desktop (for the local ZK Proof Server)

### 1. Install dependencies

```bash
npm install
cd frontend && npm install
```

### 2. Start the frontend dev server

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), connect your Lace wallet set to **Preprod** network.

> 🆕 **New to Midnight?** Get free testnet tNIGHT from the [Preprod Faucet](https://midnight-tmnight-preprod.nethermind.dev).

### 3. Start the ZK Proof Server (Required for Transactions)

```bash
cd mn-demo && docker compose up -d
```

---

## 🔧 Deployment & Troubleshooting

### Vercel Deployment & CORS Bypassing
Because the Midnight public proof server (`https://proof-server.preprod.midnight.network`) currently restricts Cross-Origin Resource Sharing (CORS) for direct browser requests, deploying FullMoon to platforms like Vercel requires a reverse proxy. 

We solved this seamlessly for production:
- **`vercel.json` Rewrites**: Configured to intercept all `/proof-server/*` API calls and invisibly forward them to the Preprod proof server server-side, entirely bypassing browser CORS restrictions.
- **Vite Proxy**: For local development, `vite.config.ts` handles the exact same proxying, ensuring parity between dev and prod environments.

### Lace Wallet Troubleshooting
- **"Unexpected error submitting scoped transaction"**: Ensure your Lace wallet is set to the **Midnight Preprod** network, NOT the mainnet or preview network.
- **"Failed to fetch" (Local Dev)**: Ensure Docker is running and the local proof server is spun up via `docker compose`.
