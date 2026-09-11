# Level 5 – Demo Video Script (FullMoon)

This 3-minute script is designed to concisely demonstrate the complete end-to-end functionality of your ZK Auction Marketplace, including the privacy features and dispute fallback, proving that the MVP is robust for Level 5.

## Preparation
- **Wallet 1 (Seller):** Connected to Lace, funded with tNIGHT.
- **Wallet 2 (Bidder):** Connected to Lace, funded with tNIGHT.
- **Environment:** Live Preprod build (`moonlight-two-mu.vercel.app` or your localhost).

---

## Shot List & Script

### 🎬 Shot 1: The Privacy Hook (0:00 - 0:20)
**Visual:** Screen recording starts on the FullMoon homepage. Show the new "New Here?" onboarding block.
**Voiceover:** "Welcome to FullMoon, a privacy-preserving sealed-bid auction marketplace built on Midnight. Traditional transparent blockchains leak your max bid to competitors. Today, I'll show you how we solve that using Midnight's zero-knowledge proofs."

### 🎬 Shot 2: Creating an Auction (0:20 - 0:50)
**Visual:** Switch to Wallet 1. Click 'Create Auction'. Enter an item name and click Submit. Approve the Lace transaction.
**Voiceover:** "First, let's create a live auction. As a seller, I authorize the transaction on the Preprod network. The contract initializes a new auction instance in the global state, mapping it uniquely to my wallet."

### 🎬 Shot 3: The Escrow-Backed ZK Bid (0:50 - 1:40)
**Visual:** Open a new browser window (or switch Lace accounts to Wallet 2). Scroll to the live auction.
**Voiceover:** "Now I'm a bidder. This is where the privacy magic happens. If I place a bid, the UI asks me to lock a public escrow amount."
**Visual:** Enter "100" in Escrow Lock, and "80" in the Secret Bid.
**Voiceover:** "I am locking 100 tNIGHT publicly, but my true bid is 80. The Midnight client-side prover generates a Zero-Knowledge proof confirming my bid is less than or equal to my lock. The network verifies this proof without ever seeing the number 80."
**Visual:** Approve the transaction. Hover over the Privacy Badge to show the public lock vs private bid logic.

### 🎬 Shot 4: Winner Default & Settlement (1:40 - 2:30)
**Visual:** Click 'Advance Phase' (switch to Reveal).
**Voiceover:** "Once bidding ends, we enter the Reveal phase. But what if the winner defaults and never reveals? On a transparent chain, the seller is out of luck. On FullMoon, the funds are already mathematically locked in escrow."
**Visual:** Do NOT reveal the bid. Instead, immediately click 'Settle Auction'.
**Voiceover:** "Anyone can trigger settlement. If the highest bidder defaults, the contract fallback logic triggers. Because they never revealed, the auction clears at zero, and everyone can safely refund their full escrow. The system never halts."

### 🎬 Shot 5: Proof of Reserves (2:30 - 3:00)
**Visual:** Click the "Proof of Reserves" tab.
**Voiceover:** "Finally, to guarantee platform solvency, we use Zero-Knowledge Proof of Reserves. Users can verify their locked escrow is accounted for without the platform revealing its total liabilities or the identities of other users. FullMoon isn't just an auction house; it's a confidential DeFi primitive."

---

*Note: Record using OBS or Loom. Keep the pace brisk. You do not need to wait out the full block times (you can speed up the "Waiting for Transaction" parts in post-production).*
