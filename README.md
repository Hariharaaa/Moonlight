# FullMoon Midnight Counter

> A privacy-preserving counter smart contract built on the Midnight Network — proving state transitions without revealing private inputs.

## Contract Address

| Network | Address |
|---------|---------|
| **Local Devnet** ✅ | `0b49fa994b3d5c009b7a202d4e30d66c58f7c0f562c78532b40fa28fa3f78025` |
| Preview | *Pending faucet refill — [faucet](https://midnight-tmnight-preview.nethermind.dev)* |
| Preprod | *Pending faucet refill — [faucet](https://midnight-tmnight-preprod.nethermind.dev)* |

> ⚠️ **Public Faucet Note**: The Midnight Preview and Preprod faucets can be unavailable or empty. If the faucet page shows `Services are currently unavailable`, that is a public faucet outage, not a problem with this repository, your wallet address, or the contract. Use the local devnet workflow below while waiting for the public faucet to recover.


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

### 4. Use the Local Midnight Devnet

The reliable path for development is the bundled local devnet in `mn-demo`.
It uses a pre-funded genesis wallet, so you do not need the public faucet.

```bash
cd mn-demo
npm install
npm run setup -- --network undeployed
npm run test:e2e
```

Switch back to local devnet any time:

```bash
cd mn-demo
npm run network undeployed
npm run setup -- --network undeployed
```

### 5. Start the Midnight Proof Server Manually

```bash
# Pull the Docker image
docker pull midnightnetwork/proof-server

# Run the proof server on port 6300
docker run -p 6300:6300 midnightnetwork/proof-server
```

### 6. Compile the contract

```bash
compact compile contracts/counter.compact managed/
# Compiling 3 circuits:
# Output: managed/zkir/, managed/keys/, managed/contract/
```

Expected output:
```
Compiling 3 circuits:
```

Generated artifacts:
```
managed/
├── compiler/contract-info.json   ← compiler metadata
├── contract/index.js             ← compiled contract JS
├── keys/
│   ├── increment.prover          ← proving key
│   ├── increment.verifier        ← verifying key
│   ├── increment_by.prover
│   ├── increment_by.verifier
│   ├── reset.prover
│   └── reset.verifier
└── zkir/
    ├── increment.zkir            ← ZK IR (human-readable)
    ├── increment_by.zkir
    └── reset.zkir
```

### 7. Deploy to Local Devnet

```bash
# Start the devnet and proof server
cd mn-demo
docker compose up -d
# Wait for proof-server to download SRS parameters (~60s first run)

# Deploy counter contract
npx tsx src/deploy-counter.ts --network undeployed
```

Expected output:
```
╔══════════════════════════════════════════════════════════════╗
║  Deploy mn-demo to undeployed
╚══════════════════════════════════════════════════════════════╝

  Wallet Address: mn_addr_undeployed1h3ssm5ru2t6eqy4g3she78zlxn96e36ms6pq996aduvmateh9p9sk96u7s
  Balance: 250,000,000,000,000 tNight

  ✅ Contract deployed successfully!

  Contract Address: 0b49fa994b3d5c009b7a202d4e30d66c58f7c0f562c78532b40fa28fa3f78025
```

### 8. Deploy to Preview Network (requires faucet)

```bash
cd mn-demo
npx tsx src/deploy-counter.ts --network preview
```

> Public Preview requires faucet tNIGHT. If the faucet shows `Services are currently unavailable`,
> use local devnet (step 7) or set a funded `MIDNIGHT_WALLET_SEED` env var.

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

**FullMoon** is designed to serve as a privacy-preserving polling and counting mechanism where users can submit votes or increment a tally without revealing the exact weight of their contribution to the public. By utilizing Midnight's ZK circuits and the `disclose()` function, the contract publicly tracks the total aggregate score and the number of participants on-chain, while keeping individual increment amounts completely confidential. This serves as a foundational primitive for private DAOs, confidential voting systems, and hidden-score games.

---

## Screenshots

### Screenshot 1 — Compile Output

Run the compile command and capture the terminal output:

```bash
compact compile contracts/counter.compact managed/
```

Expected terminal output to screenshot:
```
Compiling 3 circuits:
```

Followed by `find managed/ -type f | sort` showing all 16 generated artifacts:
```
managed/compiler/contract-info.json
managed/contract/index.d.ts
managed/contract/index.js
managed/contract/index.js.map
managed/keys/increment.prover
managed/keys/increment.verifier
managed/keys/increment_by.prover
managed/keys/increment_by.verifier
managed/keys/reset.prover
managed/keys/reset.verifier
managed/zkir/increment.bzkir
managed/zkir/increment.zkir
managed/zkir/increment_by.bzkir
managed/zkir/increment_by.zkir
managed/zkir/reset.bzkir
managed/zkir/reset.zkir
```

> 📸 **Take screenshot here** — capture both the `Compiling 3 circuits:` line and the `find managed/ -type f` tree.

### Screenshot 2 — Deployed Contract Address

Run the local devnet deployment and capture the terminal output:

```bash
cd mn-demo && npx tsx src/deploy-counter.ts --network undeployed
```

Verified contract address (local devnet):
```
Contract Address: 0b49fa994b3d5c009b7a202d4e30d66c58f7c0f562c78532b40fa28fa3f78025
```

> 📸 **Take screenshot here** — capture the `✅ Contract deployed successfully!` line and the contract address.

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

## Resources

- [Midnight Network Docs](https://docs.midnight.network)
- [Compact Language Reference](https://docs.midnight.network/develop/reference/compact)
- [Rise In — Midnight Builder Challenge](https://www.risein.com)
- [Midnight Preview Faucet](https://faucet.midnight.network)
