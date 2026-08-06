// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Mock Groth16 verifier for testing — returns configurable result
contract MockVerifier {
    bool private _shouldPass;

    constructor(bool shouldPass) {
        _shouldPass = shouldPass;
    }

    function setShouldPass(bool val) external {
        _shouldPass = val;
    }

    function verifyProof(
        uint[2] calldata,
        uint[2][2] calldata,
        uint[2] calldata,
        uint[] calldata
    ) external view returns (bool) {
        return _shouldPass;
    }
}
