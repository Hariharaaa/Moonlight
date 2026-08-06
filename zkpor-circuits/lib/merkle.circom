pragma circom 2.1.6;

include "node_modules/circomlib/circuits/poseidon.circom";
include "node_modules/circomlib/circuits/mux1.circom";

/*
 * MerkleTreeFromLeaves(N, DEPTH)
 * Builds a complete Poseidon Merkle tree from N=2^DEPTH leaves.
 * Outputs the root.
 */
template MerkleTreeFromLeaves(N, DEPTH) {
    signal input leaves[N];
    signal output root;

    // Total internal nodes: N-1
    var layerSize = N;
    signal nodes[2*N];

    // Copy leaves into first layer of nodes array
    for (var i = 0; i < N; i++) {
        nodes[N + i] <== leaves[i];
    }

    // Build up the tree bottom-up
    component hashes[N-1];
    var hIdx = 0;
    for (var i = N-1; i >= 1; i--) {
        hashes[hIdx] = Poseidon(2);
        hashes[hIdx].inputs[0] <== nodes[2*i];
        hashes[hIdx].inputs[1] <== nodes[2*i+1];
        nodes[i] <== hashes[hIdx].out;
        hIdx++;
    }

    root <== nodes[1];
}

/*
 * MerkleInclusion(DEPTH)
 * Verifies a single leaf is in the Merkle tree identified by `root`.
 */
template MerkleInclusion(DEPTH) {
    signal input leaf;
    signal input pathElements[DEPTH];
    signal input pathIndices[DEPTH];   // 0 = leaf is left child, 1 = leaf is right child
    signal output root;

    component hashers[DEPTH];
    component muxL[DEPTH];
    component muxR[DEPTH];

    signal runningHash[DEPTH+1];
    runningHash[0] <== leaf;

    for (var i = 0; i < DEPTH; i++) {
        // Mux to decide left/right ordering
        muxL[i] = Mux1();
        muxL[i].c[0] <== runningHash[i];
        muxL[i].c[1] <== pathElements[i];
        muxL[i].s <== pathIndices[i];

        muxR[i] = Mux1();
        muxR[i].c[0] <== pathElements[i];
        muxR[i].c[1] <== runningHash[i];
        muxR[i].s <== pathIndices[i];

        hashers[i] = Poseidon(2);
        hashers[i].inputs[0] <== muxL[i].out;
        hashers[i].inputs[1] <== muxR[i].out;
        runningHash[i+1] <== hashers[i].out;
    }

    root <== runningHash[DEPTH];
}
