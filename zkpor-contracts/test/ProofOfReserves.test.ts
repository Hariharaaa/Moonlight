import { expect } from "chai";
import { ethers } from "hardhat";
import { ProofOfReserves, MockVerifier } from "../typechain-types";

// Dummy proof components (mock verifier ignores them)
const PROOF_A: [bigint, bigint] = [1n, 2n];
const PROOF_B: [[bigint, bigint], [bigint, bigint]] = [[1n, 2n], [3n, 4n]];
const PROOF_C: [bigint, bigint] = [1n, 2n];

// Fake Merkle root
const FAKE_ROOT = ethers.zeroPadValue(ethers.toBeHex(0xdeadbeefn), 32);
const FAKE_RESERVES = 3000n;
const FAKE_TIMESTAMP = BigInt(Math.floor(Date.now() / 1000));

describe("ProofOfReserves", () => {
  let por: ProofOfReserves;
  let solvencyVerifier: MockVerifier;
  let inclusionVerifier: MockVerifier;
  let admin: any;
  let other: any;

  beforeEach(async () => {
    [admin, other] = await ethers.getSigners();

    const MockV = await ethers.getContractFactory("MockVerifier");
    solvencyVerifier = (await MockV.deploy(true)) as MockVerifier;
    inclusionVerifier = (await MockV.deploy(true)) as MockVerifier;

    const POR = await ethers.getContractFactory("ProofOfReserves");
    por = (await POR.deploy(
      await solvencyVerifier.getAddress(),
      await inclusionVerifier.getAddress()
    )) as ProofOfReserves;

    // Set up initial root and reserves
    await por.updateLiabilitiesRoot(FAKE_ROOT);
    await por.updateReserves(FAKE_RESERVES);
  });

  // ─── Deployment tests ──────────────────────────────────────────────
  describe("Deployment", () => {
    it("should set the deployer as admin", async () => {
      expect(await por.admin()).to.equal(admin.address);
    });

    it("should initialize as not solvent", async () => {
      const { solvent } = await por.getStatus();
      expect(solvent).to.equal(false);
    });
  });

  // ─── Admin access control ──────────────────────────────────────────
  describe("Access control", () => {
    it("non-admin cannot updateReserves", async () => {
      await expect(
        por.connect(other).updateReserves(9999n)
      ).to.be.revertedWithCustomError(por, "Unauthorized");
    });

    it("non-admin cannot updateLiabilitiesRoot", async () => {
      await expect(
        por.connect(other).updateLiabilitiesRoot(FAKE_ROOT)
      ).to.be.revertedWithCustomError(por, "Unauthorized");
    });

    it("non-admin cannot submitSolvencyProof", async () => {
      await expect(
        por.connect(other).submitSolvencyProof(PROOF_A, PROOF_B, PROOF_C, [
          FAKE_RESERVES, BigInt(FAKE_ROOT), FAKE_TIMESTAMP,
        ])
      ).to.be.revertedWithCustomError(por, "Unauthorized");
    });

    it("admin can transfer admin rights", async () => {
      await por.transferAdmin(other.address);
      expect(await por.admin()).to.equal(other.address);
    });
  });

  // ─── Solvency proof — happy path ───────────────────────────────────
  describe("submitSolvencyProof — happy path", () => {
    it("should verify and emit SolvencyChecked event", async () => {
      const rootBigInt = BigInt(FAKE_ROOT);
      await expect(
        por.submitSolvencyProof(PROOF_A, PROOF_B, PROOF_C, [
          FAKE_RESERVES, rootBigInt, FAKE_TIMESTAMP,
        ])
      )
        .to.emit(por, "SolvencyChecked")
        .withArgs(true, FAKE_RESERVES, FAKE_ROOT, FAKE_TIMESTAMP);
    });

    it("should set isSolvent = true after valid proof", async () => {
      const rootBigInt = BigInt(FAKE_ROOT);
      await por.submitSolvencyProof(PROOF_A, PROOF_B, PROOF_C, [
        FAKE_RESERVES, rootBigInt, FAKE_TIMESTAMP,
      ]);
      const { solvent } = await por.getStatus();
      expect(solvent).to.equal(true);
    });
  });

  // ─── Solvency proof — failure cases ───────────────────────────────
  describe("submitSolvencyProof — failure cases", () => {
    it("should revert when proof root != on-chain root", async () => {
      const wrongRoot = BigInt(ethers.zeroPadValue(ethers.toBeHex(0xbadn), 32));
      await expect(
        por.submitSolvencyProof(PROOF_A, PROOF_B, PROOF_C, [
          FAKE_RESERVES, wrongRoot, FAKE_TIMESTAMP,
        ])
      ).to.be.revertedWithCustomError(por, "RootMismatch");
    });

    it("should revert when verifier returns false (bad proof)", async () => {
      await solvencyVerifier.setShouldPass(false);
      const rootBigInt = BigInt(FAKE_ROOT);
      await expect(
        por.submitSolvencyProof(PROOF_A, PROOF_B, PROOF_C, [
          FAKE_RESERVES, rootBigInt, FAKE_TIMESTAMP,
        ])
      ).to.be.revertedWithCustomError(por, "InvalidProof");
    });
  });

  // ─── Inclusion proof — happy path ─────────────────────────────────
  describe("verifyInclusion — happy path", () => {
    it("should emit InclusionVerified and return true", async () => {
      const rootBigInt = BigInt(FAKE_ROOT);
      const nullifier = ethers.keccak256(ethers.toUtf8Bytes("test-nullifier-1"));
      const nullifierBigInt = BigInt(nullifier);

      await expect(
        por.verifyInclusion(PROOF_A, PROOF_B, PROOF_C, [rootBigInt, nullifierBigInt])
      ).to.emit(por, "InclusionVerified");
    });

    it("should mark nullifier as used after verification", async () => {
      const rootBigInt = BigInt(FAKE_ROOT);
      const nullifier = ethers.keccak256(ethers.toUtf8Bytes("test-nullifier-2"));
      const nullifierBigInt = BigInt(nullifier);

      await por.verifyInclusion(PROOF_A, PROOF_B, PROOF_C, [rootBigInt, nullifierBigInt]);
      expect(await por.usedNullifiers(nullifier)).to.equal(true);
    });
  });

  // ─── Inclusion proof — failure cases ──────────────────────────────
  describe("verifyInclusion — failure cases", () => {
    it("should revert on root mismatch", async () => {
      const wrongRoot = BigInt(ethers.zeroPadValue(ethers.toBeHex(0xbadn), 32));
      const nullifier = BigInt(ethers.keccak256(ethers.toUtf8Bytes("nullifier-x")));
      await expect(
        por.verifyInclusion(PROOF_A, PROOF_B, PROOF_C, [wrongRoot, nullifier])
      ).to.be.revertedWithCustomError(por, "RootMismatch");
    });

    it("should revert on invalid proof (verifier returns false)", async () => {
      await inclusionVerifier.setShouldPass(false);
      const rootBigInt = BigInt(FAKE_ROOT);
      const nullifier = BigInt(ethers.keccak256(ethers.toUtf8Bytes("nullifier-y")));
      await expect(
        por.verifyInclusion(PROOF_A, PROOF_B, PROOF_C, [rootBigInt, nullifier])
      ).to.be.revertedWithCustomError(por, "InvalidProof");
    });

    it("should revert on replayed nullifier", async () => {
      const rootBigInt = BigInt(FAKE_ROOT);
      const nullifier = BigInt(ethers.keccak256(ethers.toUtf8Bytes("nullifier-replay")));

      // First call succeeds
      await por.verifyInclusion(PROOF_A, PROOF_B, PROOF_C, [rootBigInt, nullifier]);
      // Second call with same nullifier should revert
      await expect(
        por.verifyInclusion(PROOF_A, PROOF_B, PROOF_C, [rootBigInt, nullifier])
      ).to.be.revertedWithCustomError(por, "NullifierAlreadyUsed");
    });
  });
});
