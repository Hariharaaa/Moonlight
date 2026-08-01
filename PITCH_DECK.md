# FullMoon — Pitch Deck Content
## Midnight Builder Challenge · Level 5 Blue Belt

> **Instructions:** Use this as your slide content source. Each slide has a title and 3–5 punchy bullets. Keep visuals minimal — let the bullets carry the message. Suggested tool: Canva, Pitch.com, or Google Slides with a dark theme.

---

## Slide 1 — Title / Hook

**Headline:** `FullMoon — Private Auctions. Verifiable Results.`

**Sub:** *Built on Midnight Network · Sealed-Bid ZK Auctions*

**Bullets:**
- 🌕 Sealed-bid auctions where **bid amounts are mathematically secret** — not just encrypted
- Your losing bid is never broadcast to the network. Ever.
- Built on Midnight's Zero-Knowledge infrastructure — not "privacy-as-a-feature", but **privacy as the protocol**
- Live on Preprod Testnet · 50+ users · Real transactions

**Speaker note:** Open with the hook — "What if you could run an auction where losing bidders' amounts were literally impossible to learn, not just hidden?"

---

## Slide 2 — Problem

**Headline:** `Traditional Auctions Are Broken for Serious Bidders`

**Bullets:**
- 🚨 **Front-running**: In on-chain auctions, your bid is visible in the mempool before it's finalized — bots outbid you in the same block
- 🔍 **Exposed amounts**: Open auctions reveal every bid — competitors learn your valuation immediately
- 🤔 **No verifiable fairness**: "Sealed" auctions on Web2 are just promises — the auctioneer can change the rules
- ⚖️ **No settlement guarantees**: Winners can back out; losers have no cryptographic proof they lost fairly
- Real-world auctions (procurement, art, land, DeFi) need **privacy + verifiability simultaneously** — and currently can't have both

---

## Slide 3 — Solution

**Headline:** `FullMoon: The Only Auction Where Losing is Mathematically Private`

**Bullets:**
- 🔒 **Sealed bid = cryptographic commitment**: Your amount is hashed with a random salt — only the hash goes on-chain
- 🤫 **Losing bids never exist on the network**: If your bid isn't highest, the ZK proof fails *locally in your browser* — no transaction is ever created
- ✅ **Winner is verifiable**: The winning bid + amount is proven on-chain — no auctioneer manipulation possible
- 🔐 **Escrow-backed**: Funds are locked at bid time, released at settlement — no winner default risk
- Built with Midnight's **Compact ZK language** — privacy is enforced by math, not promises

---

## Slide 4 — Market Opportunity

**Headline:** `Every High-Stakes Auction Needs This`

**Bullets:**
- 🎨 **NFT & Digital Collectibles**: $2.8B+ market with rampant sniping and front-running — private sealed bids fix this
- 🏢 **Enterprise Procurement**: Governments and corporations run sealed-bid tenders worth trillions annually — currently on Excel spreadsheets or opaque Web2 platforms
- 🏦 **DeFi Token Launches**: Fair launch mechanisms need privacy — current batch auctions leak price signals in real time
- 🏠 **Real-World Assets (RWA)**: Tokenized real estate, carbon credits, commodities — markets that need verifiable fairness to attract institutional capital
- 🎯 **Competitive Intelligence**: Any market where revealing your valuation gives competitors an edge — FullMoon makes bidding safe

---

## Slide 5 — Architecture

**Headline:** `How It Works: ZK Proof Chain`

**Bullets:**
- **Compact Contract** (`auction.compact`): Runs on Midnight — stores bid commitments (hashes), not amounts. Enforces phase transitions.
- **Frontend (React + Vite)**: Runs ZK proof generation locally in browser via WASM — your private data never leaves your device
- **Lace Wallet**: Midnight-native browser extension handles key management + transaction signing
- **Prover / Verifier Keys**: Pre-generated for each circuit (`bid`, `reveal`, `advance_phase`) — served from Vercel, executed locally
- **Settlement flow**: Highest revealed bid wins → amount + winner address written to public ledger → all other amounts remain private forever

**Diagram description:**
```
User Browser
├── Enter bid amount + salt (PRIVATE)
├── Hash(amount, salt) → commitment (PUBLIC → Midnight ledger)
├── Reveal phase: ZK proof of (amount > highest_bid)
│   ├── IF PROOF SUCCEEDS → transaction broadcast (you win)
│   └── IF PROOF FAILS → nothing sent (you lose, privately)
└── Settlement: winner revealed, escrow released
```

---

## Slide 6 — Growth Strategy

**Headline:** `From 0 to 50+ Testnet Users: What We Learned`

**Bullets:**
- 🚀 **Phase 1 (Done)**: Developer communities — Midnight Discord, Cardano builder forums, crypto Twitter — technical users who appreciate ZK privacy
- 📝 **Onboarding pipeline**: Google Form + in-app feedback prompt → exported responses → shipped 4 product improvements in direct response
- 📊 **Conversion driver**: The "faucet → connect → bid" funnel was the biggest drop-off — fixed with 3-step onboarding overlay and direct faucet link
- 🔄 **Phase 2 (Next)**: NFT communities, DeFi protocol DAOs, and procurement professionals who have felt the pain of unfair auctions
- 📈 **Phase 3 (Mainnet)**: Enterprise pilot with a real auction house or DAO treasury — proof-of-concept for a high-value use case

---

## Slide 7 — Traction

**Headline:** `Real Users, Real Transactions, Real Feedback`

**Bullets:**
- 👛 **50+ unique wallet addresses** interacted with the live Preprod contract
- 📋 **[N] bids placed** across [N] auction sessions (see Analytics tab on live demo)
- ⭐ **Top feedback theme**: "I had no idea if my money was actually locked" → shipped Escrow Status indicator → [link to commit 168a1cf]
- 📊 **Google Form responses**: [N] responses collected, exported to Excel (linked in README)
- 🔒 **Zero privacy breaches**: Not a single losing bid amount has ever appeared on the public ledger — the math holds

**Note:** Replace `[N]` with actual numbers from your analytics dashboard screenshot.

---

## Slide 8 — Roadmap

**Headline:** `What Comes After Blue Belt`

**Bullets:**
- 🟠 **Level 6 (Next)**: Time-locked auction phases — replace demo `advance_phase()` with real on-chain time enforcement; multi-seller marketplace with listing fees
- ⛓️ **Mainnet Launch**: Deploy when Midnight Mainnet opens; migrate tNIGHT escrow to real NIGHT tokens
- 💰 **Fee model**: 0.5–2% platform fee on winning bids; seller-set reserve prices; buy-now option
- 🤝 **Ecosystem integrations**: Cardano NFT marketplaces (JPG.store, CNFT), DeFi protocols needing fair token distribution
- 🌍 **Enterprise path**: Pilot with government procurement or real estate tokenization platform — 6–12 month horizon

---

## Slide 9 — Ask / Close

**Headline:** `FullMoon is Proving That Privacy + Verifiability Aren't a Trade-Off`

**Bullets:**
- ✅ **Live today**: [moonlight-two-mu.vercel.app](https://moonlight-two-mu.vercel.app/) — try it right now
- 🔒 **The proof is the product**: Every "losing" bid in our testnet has been mathematically secret — that's not a claim, it's a cryptographic guarantee
- 🤝 **Looking for**: Feedback from auction platforms, DeFi protocols, and NFT projects who want to be beta partners for mainnet launch
- 🏗️ **Built on Midnight**: The only L1 where privacy is a native protocol property, not an add-on
- 📬 **Contact**: [your email/Twitter/Discord handle]

**Close line:** *"In a world where every on-chain action is permanently public, FullMoon gives participants the right to bid without being watched."*
