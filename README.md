# FullMoon Midnight Counter

> A privacy-preserving counter smart contract built on the Midnight Network — proving state transitions without revealing private inputs.

## Contract Address

| Network | Address |
|---------|---------|
| Preview | [PASTE ADDRESS AFTER DEPLOY] |
| Preprod | [PASTE ADDRESS AFTER DEPLOY] |

> ⚠️ **Note**: This section will be updated after deployment. See Step 3 of Setup below.

---

## What This Does

**FullMoon Counter** is a zero-knowledge smart contract on the [Midnight Network](https://midnight.network) that lets users increment or reset a publicly visible counter — but keeps the *amount* of each increment completely private.

- Anyone can **see** the current counter value on-chain
- Only the user knows **by how much** they incremented it
- The Midnight ZK proof system verifies the transition is valid without revealing the private input

This demonstrates the core Midnight privacy primitive: **selective disclosure** via `disclose()`.

---

## Privacy Model

| Layer | What | Visibility |
|-------|------|------------|
| **PUBLIC** | `counter` — the current counter value | On-chain, visible to everyone |
| **PRIVATE** | `increment_amount` — how much to increment by | Stays on user's device, never on-chain |
| **PRIVATE** | `secret_reset_key` — key required to reset | Stays on user's device, never on-chain |
| **PROVED** | That `new_counter == old_counter + increment_amount` | Verified by ZK proof, amount stays secret |
| **DISCLOSED** | `disclose(counter)` anchors proof to current chain state | Prevents proof replay attacks |

### How `disclose()` is Used

In the `increment` circuit:
```compact
const current: Uint<64> = disclose(counter);
```
This deliberately exposes the *current* counter value as a public circuit input, anchoring the ZK proof to on-chain state. Without this, a proof generated against an old state could be replayed.

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| **Blockchain** | [Midnight Network](https://midnight.network) |
| **Smart Contract** | [Compact Language](https://docs.midnight.network) |
| **Proof System** | Midnight Proof Server (Docker) |
| **Runtime** | Node.js v22 |
| **Container** | Docker (proof server) |
| **Test Framework** | Jest + TypeScript |
| **Compiler** | `@midnight-ntwrk/compact-compiler` |

---

## Prerequisites

Before running this project, ensure you have:

- [ ] **Node.js v22+** — [Download](https://nodejs.org/) or install via `nvm install 22`
- [ ] **Docker** — [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [ ] **Compact Compiler** — `npm install -g @midnight-ntwrk/compact-compiler`
- [ ] **Midnight Proof Server** — pulled via Docker (see Setup below)
- [ ] **Git** — for cloning the repo

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/[YOUR_USERNAME]/fullmoon-midnight-counter.git
cd fullmoon-midnight-counter
```

### 2. Switch to Node.js v22

```bash
# If using nvm:
nvm install 22
nvm use 22
node --version  # Should show v22.x.x
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the Midnight Proof Server

```bash
# Pull the Docker image
docker pull midnightnetwork/proof-server

# Run the proof server on port 6300
docker run -p 6300:6300 midnightnetwork/proof-server
```

### 5. Compile the contract

```bash
compact compile contracts/counter.compact
# Output: managed/ directory with circuits and keys
```

### 6. Deploy to Preview Network

```bash
NODE_OPTIONS="--max-old-space-size=12288" npm run deploy:preview
```

> 💡 When the wallet address prints, fund it at the [Midnight Preview Faucet](https://faucet.midnight.network) before continuing.

---

## Run Tests

```bash
npm test
```

Expected output:
```
PASS tests/counter.test.ts
  CounterContract — Circuit Logic
    ✓ increment circuit correctly updates counter state
    ✓ multiple increments accumulate correctly
    ✓ increment circuit rejects zero increment (validates circuit constraint)
  CounterContract — State Transitions
    ✓ reset circuit transitions counter back to zero
    ✓ full counter lifecycle: init → increment → increment → reset
    ✓ get_counter circuit reads the correct public counter value
  CounterContract — Privacy Guarantees
    ✓ increment private input (incrementAmount) is never exposed in circuit outputs
    ✓ reset private input (secretResetKey) is never exposed in circuit outputs
    ✓ only explicitly disclosed values appear in public circuit outputs
    ✓ after increment, new counter value equals old + private amount

Test Suites: 1 passed, 1 total
Tests:       10 passed, 10 total
```

---

## Contract Architecture

```
contracts/
└── counter.compact       ← Compact ZK contract (source of truth)
    ├── ledger { counter }           ← PUBLIC on-chain state
    ├── circuit increment(private)   ← ZK increment proof
    ├── circuit reset(private)       ← ZK reset proof
    └── circuit get_counter()        ← Public read

managed/                  ← Auto-generated by compact compile
├── counter/
│   ├── circuit_bytecode/ ← Compiled ZK circuits
│   └── keys/            ← Proving & verifying keys
```

---

## File Structure

```
fullmoon-midnight-counter/
├── contracts/
│   └── counter.compact          ← Compact contract source
├── managed/                     ← Auto-generated by compact compile
├── src/                         ← Frontend (Level 2)
├── tests/
│   └── counter.test.ts          ← 10 passing tests
├── .github/
│   └── workflows/               ← CI/CD (Level 3)
├── README.md                    ← This file
└── package.json
```

---

## Initial Idea

[LEAVE PLACEHOLDER — I will fill this in manually]

---

## Screenshots

[LEAVE PLACEHOLDER — I will add compile output and contract address screenshots]

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

## Resources

- [Midnight Network Docs](https://docs.midnight.network)
- [Compact Language Reference](https://docs.midnight.network/develop/reference/compact)
- [Rise In — Midnight Builder Challenge](https://www.risein.com)
- [Midnight Preview Faucet](https://faucet.midnight.network)
