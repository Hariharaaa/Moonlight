pragma circom 2.1.6;

include "node_modules/circomlib/circuits/poseidon.circom";
include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/bitify.circom";
include "lib/merkle.circom";

/*
 * solvency.circom
 *
 * Proves: sum(balances[i] for i in 0..N-1) <= reservesTotal
 * without revealing any individual balance.
 *
 * Public inputs:
 *   - reservesTotal  : total reserves claimed by the exchange
 *   - liabilitiesRoot: Poseidon Merkle root of the commitments
 *   - timestamp      : Unix timestamp for freshness
 *
 * Private inputs:
 *   - balances[N]    : individual user balances (padded with 0)
 *   - salts[N]       : per-user salts for commitment
 *   - nLeaves        : actual number of real leaves (<=N)
 */

template Solvency(N, DEPTH) {
    // ─── Public signals ────────────────────────────────────────────
    signal input reservesTotal;
    signal input liabilitiesRoot;
    signal input timestamp;

    // ─── Private signals ───────────────────────────────────────────
    signal input balances[N];
    signal input salts[N];
    signal input nLeaves;

    // ─── Compute leaf commitments ──────────────────────────────────
    component leafHash[N];
    signal leaves[N];

    for (var i = 0; i < N; i++) {
        leafHash[i] = Poseidon(2);
        leafHash[i].inputs[0] <== balances[i];
        leafHash[i].inputs[1] <== salts[i];
        leaves[i] <== leafHash[i].out;
    }

    // ─── Verify Merkle root ────────────────────────────────────────
    component tree = MerkleTreeFromLeaves(N, DEPTH);
    for (var i = 0; i < N; i++) {
        tree.leaves[i] <== leaves[i];
    }
    tree.root === liabilitiesRoot;

    // ─── Sum all balances ──────────────────────────────────────────
    signal runningSum[N+1];
    runningSum[0] <== 0;
    for (var i = 0; i < N; i++) {
        runningSum[i+1] <== runningSum[i] + balances[i];
    }
    signal totalLiabilities <== runningSum[N];

    // ─── Assert sum <= reservesTotal ───────────────────────────────
    // LessEqThan(n) checks a <= b for n-bit values. 64 bits covers ~1.8e19 units.
    component leq = LessEqThan(64);
    leq.in[0] <== totalLiabilities;
    leq.in[1] <== reservesTotal;
    leq.out === 1;

    // ─── Timestamp is just a public witness anchor ─────────────────
    signal tsAnchor <== timestamp;
    _ <== tsAnchor;
}

component main {public [reservesTotal, liabilitiesRoot, timestamp]} = Solvency(16, 4);
