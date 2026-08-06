# zkPoR — Architecture Deep Dive

## Circuit Design

### solvency.circom

**Parameters:** `N=16` (fixed leaf count), `DEPTH=4`

The circuit proves in zero-knowledge that the sum of all user balances does not exceed
the exchange's attested reserves — without revealing any individual balance.

**Constraint system:**
1. For each leaf i: `leaf[i] = Poseidon(balances[i], salts[i])`
2. Build Poseidon Merkle tree from all 16 leaves
3. Assert `tree.root == liabilitiesRoot` (public input)
4. Compute `totalLiabilities = Σ balances[i]`
5. Assert `totalLiabilities ≤ reservesTotal` (LessEqThan(64) component)

Why Poseidon? ZK-native hash function — ~250 constraints vs ~20,000 for SHA256.
This makes the circuit practical to prove in a browser or light server.

### inclusion.circom

**Parameters:** `DEPTH=4`

Proves a user's specific (balance, salt) pair is committed in the Merkle tree,
and binds a nullifier to prevent replaying the same proof.

**Constraint system:**
1. `leaf = Poseidon(balance, salt)` — commitment
2. Verify Merkle path: recompute root from `leaf + pathElements` — assert `== liabilitiesRoot`
3. Assert `nullifier == Poseidon(secret, leafIndex)` — binds proof to user's secret

## Nullifier Scheme

```
nullifier = Poseidon(userSecret, leafIndex)
```

Properties:
- **Unlinkable**: nullifier is pseudorandom; on-chain observers cannot link it to a user identity
- **Non-replayable**: contract stores `usedNullifiers[nullifier] = true` after first use
- **Root-bound**: the proof also binds to a specific `liabilitiesRoot`; a fresh root from the next
  audit period allows a fresh proof (with the same secret)

## Trust Assumptions

| Component | Trust Level | MVP | Future |
|---|---|---|---|
| Reserves attestation | Admin-trusted | Admin writes `currentReserves` | Chainlink oracle / PoA |
| Leaf construction | Exchange-trusted | Exchange builds (balance, salt) pairs | User-controlled blind commitments |
| Trusted setup (phase 1) | Hermez ceremony (~1000 contributors) | Reuse existing ptau | N/A |
| Trusted setup (phase 2) | Single contributor | zkpor team | Multi-party ceremony |
| Admin key | Single EOA | Deployer EOA | Gnosis Safe + timelock |

## Security Properties

- **Soundness**: forging a Groth16 proof without a valid witness is computationally infeasible
  (reduces to discrete log in BN128 under Generic Group Model)
- **Zero-knowledge**: the Groth16 prover produces a proof that is perfectly simulatable — 
  a verifier learns nothing about private inputs beyond what the public signals reveal
- **Binding**: leaf commitments are Poseidon hashes — collision resistance means the exchange
  cannot claim a different balance for a user after committing the root

## Scalability

Current parameters (N=16) are designed for hackathon demonstration. Production scaling options:
- Increase N to 1024 — batch solvency proving in parallel (multiple circuits)
- Use recursive proofs (Groth16 → PLONK aggregation) to fold many circuits into one
- Use a verifiable delay function (VDF) for the Merkle tree construction to prevent last-second manipulation
