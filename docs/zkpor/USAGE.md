# zkPoR — User Guide: "Are My Funds Safu?"

## TL;DR

1. Open the app
2. Check the **Protocol Status** card — if it says ✅ SOLVENT, the exchange has proven reserves ≥ liabilities on-chain
3. Use the **Verify My Inclusion** form with your secret data to prove your specific balance is included

---

## Step 1 — Check Public Solvency Status

On the main page, the **Protocol Status** card shows:
- ✅ **SOLVENT** — the exchange submitted a valid ZK proof that `sum(all balances) ≤ reserves`
- ❌ **PROOF NOT YET SUBMITTED** — either the exchange hasn't run an audit yet, or there is a problem

You can also verify directly on Etherscan by reading the `getStatus()` function on the contract.

---

## Step 2 — Verify Your Own Balance Is Included

The exchange must have given you:
- Your **User ID** (e.g. `user-003`)
- Your **Balance** value (the exact amount committed — in token units)
- Your **Salt** (a random number generated per-user — different from your balance)
- Your **Secret Key** (a private random number — this never leaves your browser)

Enter these into the **Verify My Inclusion** form and click **Prove My Balance Is Included**.

### What happens behind the scenes
1. Your browser sends `{userId, balance, salt, secret}` to the backend
2. The backend builds the Merkle tree from all committed user balances
3. A Groth16 ZK proof is generated: `leaf = Poseidon(balance, salt)` is in the tree
4. The proof is verified — the result is returned to your browser

### What the proof reveals
- ✅ That **a** leaf with **your** commitment is in the tree
- ❌ Nothing about your actual balance (the verifier only sees the hash)
- ❌ Nothing about other users' balances
- ❌ Nothing about your identity (nullifier is pseudorandom)

---

## Step 3 — Optional: Submit Proof On-Chain

If you want permanent on-chain proof that you self-verified, the backend can call
`verifyInclusion()` on the contract with your proof. The **nullifier** is stored on-chain
(the unique, unlinkable token that proves you verified).

---

## FAQ

**Q: Can the exchange fake a solvency proof?**  
A: No. The Groth16 verifier contract only accepts cryptographically valid proofs. 
The exchange cannot generate a valid proof unless the actual sum of committed balances ≤ reserves.

**Q: What if the exchange just makes up smaller balances?**  
A: That's why user verification exists. If your committed balance is wrong, your inclusion proof will fail — 
you can publicly prove the exchange under-reported your balance.

**Q: Is my secret key safe?**  
A: Your secret key is transmitted to the backend only to generate the proof — it is **never stored**. 
In a fully trustless version, proof generation would happen entirely in-browser using WASM.

**Q: How often is the solvency proof updated?**  
A: In this MVP, it is triggered manually. Production: automated on a cron schedule (e.g. daily).
