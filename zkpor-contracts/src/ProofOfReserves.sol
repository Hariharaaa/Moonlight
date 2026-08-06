// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal Groth16 verifier interface (implemented by auto-generated verifier contracts)
interface IGroth16Verifier {
    function verifyProof(
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint[] calldata input
    ) external view returns (bool);
}

/**
 * @title ProofOfReserves
 * @notice On-chain registry for ZK-verified solvency proofs.
 *
 * The exchange operator:
 *   1. Builds a Poseidon Merkle tree of user balance commitments (off-chain)
 *   2. Calls submitSolvencyProof() with a Groth16 proof that sum(balances) <= reserves
 *
 * Any user can:
 *   3. Generate a Groth16 inclusion proof off-chain
 *   4. Call verifyInclusion() to prove their balance is in the committed tree
 *      (nullifier prevents replaying the same proof)
 */
contract ProofOfReserves {
    // ─── State ───────────────────────────────────────────────────────

    address public admin;

    IGroth16Verifier public immutable solvencyVerifier;
    IGroth16Verifier public immutable inclusionVerifier;

    /// @notice Current total reserves (admin-attested for MVP)
    uint256 public currentReserves;

    /// @notice Current Poseidon Merkle root of liabilities tree
    bytes32 public currentLiabilitiesRoot;

    /// @notice Unix timestamp of the last verified solvency proof
    uint256 public lastSolvencyTimestamp;

    /// @notice Whether the last submitted solvency proof passed
    bool public isSolvent;

    /// @notice Nullifiers used for inclusion proofs (prevents replay)
    mapping(bytes32 => bool) public usedNullifiers;

    // ─── Events ──────────────────────────────────────────────────────

    event SolvencyChecked(
        bool indexed passed,
        uint256 reserves,
        bytes32 liabilitiesRoot,
        uint256 timestamp
    );

    event InclusionVerified(
        bytes32 indexed nullifier,
        bytes32 liabilitiesRoot,
        uint256 timestamp
    );

    event ReservesUpdated(uint256 newReserves, uint256 timestamp);
    event LiabilitiesRootUpdated(bytes32 newRoot, uint256 timestamp);
    event AdminTransferred(address indexed oldAdmin, address indexed newAdmin);

    // ─── Errors ──────────────────────────────────────────────────────

    error Unauthorized();
    error InvalidProof();
    error NullifierAlreadyUsed(bytes32 nullifier);
    error RootMismatch();

    // ─── Modifiers ───────────────────────────────────────────────────

    modifier onlyAdmin() {
        if (msg.sender != admin) revert Unauthorized();
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────

    constructor(
        address _solvencyVerifier,
        address _inclusionVerifier
    ) {
        admin = msg.sender;
        solvencyVerifier = IGroth16Verifier(_solvencyVerifier);
        inclusionVerifier = IGroth16Verifier(_inclusionVerifier);
    }

    // ─── Admin functions ─────────────────────────────────────────────

    /// @notice Update the attested reserves amount (admin-only, MVP)
    function updateReserves(uint256 newReserves) external onlyAdmin {
        currentReserves = newReserves;
        emit ReservesUpdated(newReserves, block.timestamp);
    }

    /// @notice Update the liabilities Merkle root (admin-only, MVP)
    function updateLiabilitiesRoot(bytes32 newRoot) external onlyAdmin {
        currentLiabilitiesRoot = newRoot;
        emit LiabilitiesRootUpdated(newRoot, block.timestamp);
    }

    /// @notice Transfer admin rights
    function transferAdmin(address newAdmin) external onlyAdmin {
        emit AdminTransferred(admin, newAdmin);
        admin = newAdmin;
    }

    // ─── Solvency proof ──────────────────────────────────────────────

    /**
     * @notice Submit a ZK solvency proof.
     * @param a   Groth16 proof component A
     * @param b   Groth16 proof component B
     * @param c   Groth16 proof component C
     * @param publicSignals [reservesTotal, liabilitiesRoot, timestamp]
     *
     * The circuit proves: sum(privateBalances) <= reservesTotal
     * without revealing any individual balance.
     */
    function submitSolvencyProof(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[3] calldata publicSignals
    ) external onlyAdmin {
        uint256 proofReserves    = publicSignals[0];
        uint256 proofRoot        = publicSignals[1];
        uint256 proofTimestamp   = publicSignals[2];

        // Root in proof must match the on-chain committed root
        if (bytes32(proofRoot) != currentLiabilitiesRoot) revert RootMismatch();

        // Verify the Groth16 proof
        uint[] memory inputs = new uint[](3);
        inputs[0] = proofReserves;
        inputs[1] = proofRoot;
        inputs[2] = proofTimestamp;

        bool passed = solvencyVerifier.verifyProof(a, b, c, inputs);
        if (!passed) revert InvalidProof();

        // Update state
        isSolvent = true;
        currentReserves = proofReserves;
        lastSolvencyTimestamp = proofTimestamp;

        emit SolvencyChecked(true, proofReserves, bytes32(proofRoot), proofTimestamp);
    }

    // ─── Inclusion proof ─────────────────────────────────────────────

    /**
     * @notice Verify a user's ZK inclusion proof.
     * @param a   Groth16 proof component A
     * @param b   Groth16 proof component B
     * @param c   Groth16 proof component C
     * @param publicSignals [liabilitiesRoot, nullifier]
     * @return true if the proof is valid and the nullifier is fresh
     *
     * The circuit proves the user's (balance, salt) leaf is in the tree
     * without revealing balance, salt, or secret to anyone.
     */
    function verifyInclusion(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[2] calldata publicSignals
    ) external returns (bool) {
        uint256 proofRoot     = publicSignals[0];
        bytes32 nullifier     = bytes32(publicSignals[1]);

        // Root in proof must match on-chain root
        if (bytes32(proofRoot) != currentLiabilitiesRoot) revert RootMismatch();

        // Reject replayed nullifiers
        if (usedNullifiers[nullifier]) revert NullifierAlreadyUsed(nullifier);

        // Verify the Groth16 proof
        uint[] memory inputs = new uint[](2);
        inputs[0] = proofRoot;
        inputs[1] = uint256(nullifier);

        bool valid = inclusionVerifier.verifyProof(a, b, c, inputs);
        if (!valid) revert InvalidProof();

        // Mark nullifier as used
        usedNullifiers[nullifier] = true;

        emit InclusionVerified(nullifier, bytes32(proofRoot), block.timestamp);
        return true;
    }

    // ─── View helpers ────────────────────────────────────────────────

    /// @notice Returns a compact status summary for the frontend
    function getStatus() external view returns (
        bool solvent,
        uint256 reserves,
        bytes32 liabilitiesRoot,
        uint256 lastChecked
    ) {
        return (isSolvent, currentReserves, currentLiabilitiesRoot, lastSolvencyTimestamp);
    }
}
