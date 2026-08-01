# FullMoon — Demo Video Script & Shot List
## Target Duration: 2–4 minutes | Format: Screen recording with voiceover

---

## Pre-recording Setup Checklist

- [ ] Open Chrome with Lace wallet **already set to Preprod** (saves time)
- [ ] Have **two Lace wallets ready** (Wallet A = bidder 1, Wallet B = bidder 2) — you'll switch between them
- [ ] Both wallets funded with testnet tNIGHT (use the [faucet](https://midnight-tmnight-preprod.nethermind.dev))
- [ ] Open [moonlight-two-mu.vercel.app](https://moonlight-two-mu.vercel.app/) in a maximized window
- [ ] Have OBS or Loom ready to record
- [ ] Clear the app's localStorage before recording for a clean first-time experience: `localStorage.clear()` in DevTools

---

## Shot List

### **[0:00 – 0:15] Hook — Open the App**

**Screen:** Live app landing page, wallet not connected. Onboarding overlay appears automatically.

**Voiceover:**
> "This is FullMoon — a sealed-bid auction marketplace built on Midnight. What makes it different? Your bid amount is mathematically secret. Not hidden. Not encrypted-then-decrypted. Mathematically impossible to learn — even after the auction ends."

**What to show:**
- The 3-step onboarding overlay appearing automatically
- Quickly scroll through Step 1 (privacy model), Step 2 (faucet), Step 3 (phases)
- Close the overlay

---

### **[0:15 – 0:35] Connect Wallet**

**Screen:** Click "Connect Lace Wallet" button in the header.

**Voiceover:**
> "Connect your Lace wallet — Midnight's native browser extension. This is Wallet A, which will be our first bidder."

**What to show:**
- Click "Connect Lace Wallet"
- Lace prompt appears → approve
- Address appears in the header: `preprod1…`
- The empty-state disappears and the Auction Panel loads
- **Zoom in briefly on the PREPROD badge** — confirms we're on testnet

---

### **[0:35 – 1:10] Place a Sealed Bid**

**Screen:** Auction Panel, Phase 0 (Bidding)

**Voiceover:**
> "We're in the Bidding phase. I'll enter 500 tNIGHT as my bid. Watch the input — this value never leaves this browser tab."

**What to show:**
1. Type `500` into the bid amount field
2. Show the hint text: *"🔒 This value stays on your device — never sent to the network"*
3. Click "🔒 Place Sealed Bid"
4. **ZK proving banner appears**: *"Generating Zero-Knowledge Proof locally…"* — let it spin for a moment
5. **Proof Verified badge** appears (green): *"🔒 Proof Verified — Bid Commitment Stored!"*
6. **Escrow Status** changes to 🔒 Locked: *"Your funds are cryptographically committed"*
7. Bid count increments from 0 → 1
8. **FeedbackPrompt toast** slides in from bottom-right — briefly show it, then dismiss

**Voiceover (during proving):**
> "The ZK proof is being generated locally. The circuit hashes my bid amount with a random salt — only the hash goes to the Midnight blockchain. My actual amount is never sent."

---

### **[1:10 – 1:25] Second Bid (Switch Wallets)**

**Screen:** Switch Lace to Wallet B, refresh/reconnect

**Voiceover:**
> "Now I'll switch to Wallet B and place a competing bid — higher, at 750 tNIGHT."

**What to show:**
- Switch wallets in Lace
- Reconnect in the app
- Type `750` and click Place Sealed Bid
- Bid count increments to 2
- **Make sure NOT to show the bid amount on-screen for Wallet A** — that's the point

---

### **[1:25 – 1:50] Reveal Phase — ZK Proof Fails for Losing Bid**

**Screen:** Switch back to Wallet A, advance to Reveal Phase

**Voiceover:**
> "Now we advance to the Reveal phase. Both wallets will try to reveal their bids. For Wallet A — the lower bid — watch what happens."

**What to show:**
1. Click "⏭ Advance to Reveal Phase" (demo helper)
2. Phase changes to 🔓 Reveal
3. **With Wallet A connected**: Click "🔓 Reveal My Bid"
4. ZK proving starts → **Error appears**: *"🔒 ZK Proof rejected locally — your bid is not higher than the current highest. Your bid amount is mathematically protected and was never sent to the network."*
5. **Pause here for 3–5 seconds** — this is the key moment

**Voiceover (at error):**
> "Wallet A's bid of 500 tNIGHT is not higher — the ZK proof failed locally. No transaction was ever created. The network never saw 500. This isn't an error message from a server — it's the math refusing to produce a valid proof."

---

### **[1:50 – 2:20] Winning Reveal + Settlement**

**Screen:** Switch to Wallet B (750 tNIGHT), reveal succeeds

**Voiceover:**
> "Wallet B — with the higher bid — can successfully reveal. The ZK proof proves: 750 > 500, and the amount matches the original commitment."

**What to show:**
1. Switch to Wallet B, reconnect
2. Click "🔓 Reveal My Bid"
3. ZK proof succeeds → *"🏆 Bid Revealed — You're the Highest Bidder!"*
4. Highest Bid counter updates to 750 tNIGHT
5. Click "⏭ Advance to Closed Phase"
6. **Settlement banner** animates in: 🏆 Auction Settled, 750 tNIGHT winner address shown
7. **Privacy guarantee** at the bottom: *"All losing bid amounts remain mathematically secret forever."*

**Voiceover:**
> "Auction settled. The winner — 750 tNIGHT — is confirmed on-chain. And the losing bid? 500 tNIGHT exists only in this browser, in the wallet that placed it. It is literally impossible to learn from the blockchain."

---

### **[2:20 – 2:50] Analytics Dashboard**

**Screen:** Click "📊 Analytics" tab

**Voiceover:**
> "And here's the public activity view — all of this is sourced from real on-chain data."

**What to show:**
1. Click the Analytics tab
2. Show the 4 stat cards:
   - Unique Wallets Interacted: [real number]
   - Bids on Current Auction: 2
   - Highest Revealed Bid: 750 tNIGHT
   - Auction Phase: Settled 🏆
3. Show the contract address link
4. Click the "↻ Refresh" button to show it's live data
5. Show the privacy note: *"What you can't see here: Individual bid amounts, losing bidder identities."*

**Voiceover:**
> "Real numbers from the Preprod testnet. Notice what's missing from the analytics: the losing bid amount. It's not redacted — it simply doesn't exist here."

---

### **[2:50 – 3:10] Close — The Privacy Guarantee**

**Screen:** Return to the live app, show the settlement banner full-screen

**Voiceover:**
> "FullMoon is built on Midnight — the first L1 where privacy is a native protocol property, enforced by mathematics, not promises. Every losing bid in every auction we've run has stayed secret. Not because we say so. Because the Zero-Knowledge circuit makes it physically impossible otherwise."

**Final frame to hold:**
- The `🔒 All losing bid amounts remain mathematically secret forever.` banner
- URL bar showing the live demo link

**Closing line:**
> "FullMoon. Bid without revealing. Win without exposing anyone else. Try it live at [moonlight-two-mu.vercel.app](https://moonlight-two-mu.vercel.app/)."

---

## Optional Extended Scenes (if you want 4 minutes)

### Scene A: Onboarding Flow (add after Connect Wallet)
Show clicking "❓ How does this work?" button in the hero → walk through all 3 overlay steps slowly with voiceover.

### Scene B: Faucet Flow (for educational demos)
Show visiting the Preprod faucet, pasting an address, receiving tNIGHT — helps non-technical audiences understand testnet context.

### Scene C: Console Proof (for technical audiences)
Open DevTools → Network tab → show that during the failed ZK proof reveal, **no transaction request is made to any network endpoint**. Only local WASM computation.

---

## Post-production Tips

- **Zoom in** on: ZK proving spinner, Error message text, the Settlement banner
- **Pause** at: the ZK failure message (3–5s), the settlement reveal animation
- **Text overlay** at: "750 tNIGHT — Winner" and "500 tNIGHT — Private Forever"
- **Background music**: Subtle, slow electronic — matches the dark/private aesthetic
- Recommended recording resolution: 1920×1080 minimum
