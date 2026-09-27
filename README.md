# FullMoon — Sealed-Bid ZK Auction Marketplace on Midnight

[![CI Pipeline](https://github.com/Hariharaaa/Moonlight/actions/workflows/ci.yml/badge.svg)](https://github.com/Hariharaaa/Moonlight/actions/workflows/ci.yml)
![Level](https://img.shields.io/badge/Midnight%20Builder%20Challenge-Level%204%20Waxing%20Gibbous-ffeb3b?style=flat-square)

> **"Bid without revealing. Lock funds without exposing. Win without exposing anyone else."**
> A privacy-preserving sealed-bid auction marketplace built on the [Midnight Network](https://midnight.network) using Zero-Knowledge proofs. Submitted for **Level 5 – Full Moon** of the Midnight Builder Challenge.

Follow our journey on X (Twitter): [**@rapid_snow**](https://x.com/rapid_snow)

---

## 🚀 Live MVP & Deployed Contract

| | |
|---|---|
| **Live Marketplace UI** | [https://moonlight-two-mu.vercel.app/](https://moonlight-two-mu.vercel.app/) |
| **Preprod Contract Address** | `68cfee8397ddbe8d376801af3bfd8c3787da1be37dd8747ea0d390bfde32eed7` |
| **Network** | Midnight Preprod Testnet |

---

## ✅ Level 5 Submission Checklist

- [x] **Working MVP live on Preprod** (Extended with Multi-Seller, Escrow, Dispute/Fallback).
- [x] **50 Verifiable Preprod Users** (Extracted directly from the indexer/contract state — see `USERS.md`).
- [x] **Documented Feedback Loop** (In-app prompt tracking user satisfaction and bug reports — see `FEEDBACK.md`).
- [x] **Documentation Synced** (README and video walkthrough updated).
- [x] **20+ meaningful commits** (Repo has 60+ meaningful commits).

---

## 👥 Users & Feedback (Level 5 Core)

To fulfill the Level 5 requirements, we built a privacy-preserving extraction script to verifiably prove testnet usage without leaking user privacy. 

- 🗣 **[View the Feedback Loop Log]**: Tracks features built in response to our Google Form prompts. ([View Raw Form Submissions](https://docs.google.com/spreadsheets/d/15FhkRDAK9Yvz2xwC-CkrPPjlFt34hNdZdsdMI1PKDLA/edit?resourcekey=&gid=2040930783#gid=2040930783))
- 💬 **Submit Feedback**: [https://github.com/Hariharaaa/Moonlight/issues](https://github.com/Hariharaaa/Moonlight/issues)

---

## 🌟 Marketplace Features (Level 4 MVP)

In Level 4, FullMoon evolved from a single-auction demo into a real **Marketplace**:

1. **Concurrent Auctions**: Multiple sellers can launch independent auctions on a single global contract state (via `auctions: Map<Bytes<32>, Auction>`).
2. **Escrow-Backed Bids (Privacy-Preserved)**: 
   - Users commit their *secret* bid, but lock a *public* escrow amount.
   - The ZK circuit proves `secret_bid <= public_escrow`.
   - Observers see a locked balance, but have no idea what the true bid is.
3. **Winner-Default Handling & Dispute Fallback**: 
   - If a bidder defaults, settlement logic automatically refunds them minus penalties, or sweeps the escrow back.
4. **Cancellation**: Sellers can cancel auctions if no bids are placed.
5. **Refund Sweeps**: Any bidder who loses, or any bidder in a cancelled auction, can securely claim their escrow back.

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
