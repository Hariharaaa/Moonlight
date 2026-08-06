pragma circom 2.1.6;

include "node_modules/circomlib/circuits/poseidon.circom";
include "lib/merkle.circom";

/*
 * inclusion.circom
 *
 * Proves: a specific (balance, salt) leaf is included in the Merkle tree,
 * and produces a nullifier to prevent replay.
 *
 * Public inputs:
 *   - liabilitiesRoot : the on-chain committed root
 *   - nullifier       : Poseidon(secret, leafIndex) — stored on-chain to prevent replay
 *
 * Private inputs:
 *   - balance         : the user's balance
 *   - salt            : the user's per-leaf salt
 *   - secret          : the user's private secret (never leaves their browser)
 *   - pathElements[D] : Merkle sibling hashes along the path
 *   - pathIndices[D]  : 0=left, 1=right direction at each level
 *   - leafIndex       : the user's position in the tree
 */

template Inclusion(DEPTH) {
    // ─── Public signals ────────────────────────────────────────────
    signal input liabilitiesRoot;
    signal input nullifier;

    // ─── Private signals ───────────────────────────────────────────
    signal input balance;
    signal input salt;
    signal input secret;
    signal input pathElements[DEPTH];
    signal input pathIndices[DEPTH];
    signal input leafIndex;

    // ─── 1. Compute leaf commitment ────────────────────────────────
    component leafHasher = Poseidon(2);
    leafHasher.inputs[0] <== balance;
    leafHasher.inputs[1] <== salt;
    signal leaf <== leafHasher.out;

    // ─── 2. Verify Merkle inclusion ───────────────────────────────
    component merkle = MerkleInclusion(DEPTH);
    merkle.leaf <== leaf;
    for (var i = 0; i < DEPTH; i++) {
        merkle.pathElements[i] <== pathElements[i];
        merkle.pathIndices[i] <== pathIndices[i];
    }
    merkle.root === liabilitiesRoot;

    // ─── 3. Compute and verify nullifier ──────────────────────────
    component nullifierHasher = Poseidon(2);
    nullifierHasher.inputs[0] <== secret;
    nullifierHasher.inputs[1] <== leafIndex;
    nullifierHasher.out === nullifier;
}

component main {public [liabilitiesRoot, nullifier]} = Inclusion(4);
