/**
 * server.ts — Express API for generating inclusion proofs
 * POST /api/prove-inclusion  { userId, balance, salt, secret }
 * GET  /api/status           → mock solvency status (no contract needed for local dev)
 */
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

import { buildMerkleTree, getMerklePath, UserBalance } from "./merkle.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });

const PORT = Number(process.env.PORT ?? 3001);

// Load balances from disk
const dataPath = path.join(__dirname, "../data/sample-balances.json");
const raw = JSON.parse(fs.readFileSync(dataPath, "utf-8")) as Array<{
  userId: string; balance: string; salt: string; secret: string;
}>;
const allUsers: UserBalance[] = raw.map((u) => ({
  userId: u.userId,
  balance: BigInt(u.balance),
  salt: BigInt(u.salt),
  secret: BigInt(u.secret),
}));

const app = express();
app.use(cors());
app.use(express.json());

// ─── GET /api/status ─────────────────────────────────────────────────
// Returns mock status for local dev (no contract needed)
app.get("/api/status", async (_req, res) => {
  try {
    // Try fetching from contract if configured, otherwise return mock
    const contractAddr = process.env.POR_CONTRACT_ADDRESS;
    if (!contractAddr) {
      // Mock response for local dev without a deployed contract
      return res.json({
        solvent: true,
        reserves: "30000000",
        liabilitiesRoot: "0x" + "ab".repeat(32),
        lastChecked: Math.floor(Date.now() / 1000) - 3600,
        lastCheckedISO: new Date(Date.now() - 3600000).toISOString(),
        _note: "Mock data — set POR_CONTRACT_ADDRESS in .env for live on-chain status",
      });
    }

    // Real on-chain read (requires SEPOLIA_RPC_URL + POR_CONTRACT_ADDRESS in .env)
    const { createPublicClient, http, parseAbi } = await import("viem");
    const { sepolia } = await import("viem/chains");
    const client = createPublicClient({
      chain: sepolia,
      transport: http(process.env.SEPOLIA_RPC_URL),
    });
    const [solvent, reserves, liabilitiesRoot, lastChecked] = await client.readContract({
      address: contractAddr as `0x${string}`,
      abi: parseAbi(["function getStatus() external view returns (bool, uint256, bytes32, uint256)"]),
      functionName: "getStatus",
    });
    res.json({
      solvent,
      reserves: reserves.toString(),
      liabilitiesRoot,
      lastChecked: Number(lastChecked),
      lastCheckedISO: lastChecked > 0n ? new Date(Number(lastChecked) * 1000).toISOString() : null,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── POST /api/prove-inclusion ────────────────────────────────────────
// Generates a ZK inclusion proof using the Merkle tree + snarkjs
// NOTE: In local dev without compiled circuits, returns a mock proof for UI testing
app.post("/api/prove-inclusion", async (req, res) => {
  try {
    const { userId, balance, salt, secret } = req.body as {
      userId: string; balance: string; salt: string; secret: string;
    };

    if (!userId || !balance || !salt || !secret) {
      return res.status(400).json({ error: "Missing: userId, balance, salt, secret" });
    }

    const leafIndex = allUsers.findIndex((u) => u.userId === userId);
    if (leafIndex === -1) {
      return res.status(404).json({ error: `User '${userId}' not found. Valid IDs: ${allUsers.map(u=>u.userId).join(", ")}` });
    }

    const user = allUsers[leafIndex];
    if (user.balance !== BigInt(balance) || user.salt !== BigInt(salt)) {
      return res.status(400).json({ error: "Provided balance or salt does not match committed value" });
    }

    // Build the Merkle tree and compute the path
    const { buildPoseidon } = await import("circomlibjs");
    const poseidon = await buildPoseidon();
    const F = poseidon.F;

    const tree = await buildMerkleTree(allUsers);
    const { pathElements, pathIndices } = getMerklePath(tree, leafIndex);
    const nullifier = F.toObject(poseidon([BigInt(secret), BigInt(leafIndex)]));

    // Check if compiled circuit artifacts exist
    const wasmPath = path.join(__dirname, "../../circuits/build/inclusion/inclusion_js/inclusion.wasm");
    const zkeyPath = path.join(__dirname, "../../circuits/build/inclusion/inclusion_final.zkey");
    const circuitsAvailable = fs.existsSync(wasmPath) && fs.existsSync(zkeyPath);

    if (circuitsAvailable) {
      // Real ZK proof generation
      const snarkjs = await import("snarkjs");
      const { proof, publicSignals } = await snarkjs.groth16.fullProve({
        liabilitiesRoot: tree.root,
        nullifier,
        balance: BigInt(balance),
        salt: BigInt(salt),
        secret: BigInt(secret),
        pathElements,
        pathIndices,
        leafIndex: BigInt(leafIndex),
      }, wasmPath, zkeyPath);

      return res.json({
        success: true,
        proof: {
          a: proof.pi_a.slice(0, 2),
          b: [proof.pi_b[0].slice(0, 2), proof.pi_b[1].slice(0, 2)],
          c: proof.pi_c.slice(0, 2),
        },
        publicSignals,
        nullifier: "0x" + nullifier.toString(16).padStart(64, "0"),
        root: "0x" + tree.root.toString(16).padStart(64, "0"),
        _real: true,
      });
    }

    // ── Mock proof for local dev UI testing (circuits not compiled yet) ──
    console.log(`ℹ️  Circuits not compiled — returning mock proof for userId=${userId}`);
    console.log(`   Run 'bash circuits/scripts/compile.sh' for real ZK proofs`);

    return res.json({
      success: true,
      proof: { a: ["1", "2"], b: [["3", "4"], ["5", "6"]], c: ["7", "8"] },
      publicSignals: [tree.root.toString(), nullifier.toString()],
      nullifier: "0x" + nullifier.toString(16).padStart(64, "0"),
      root: "0x" + tree.root.toString(16).padStart(64, "0"),
      _mock: true,
      _note: "Mock proof — run 'bash circuits/scripts/compile.sh' for real ZK proofs",
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── GET /api/users ──────────────────────────────────────────────────
// List available user IDs (for testing the UI)
app.get("/api/users", (_req, res) => {
  res.json({
    users: allUsers.filter(u => u.userId !== "padding").map(u => ({
      userId: u.userId,
      balance: u.balance.toString(),
      salt: u.salt.toString(),
      // secret intentionally omitted — users provide this themselves
    })),
    _hint: "Use one of these userIds with the balance and salt shown. Provide your secret from sample-balances.json for local testing.",
  });
});

// Health check
app.get("/health", (_req, res) => res.json({ ok: true, users: allUsers.filter(u=>u.userId!=="padding").length }));

app.listen(PORT, () => {
  console.log(`\n🚀 zkPoR backend running on http://localhost:${PORT}`);
  console.log(`   Users loaded: ${allUsers.filter(u=>u.userId!=="padding").length}`);
  console.log(`   Contract: ${process.env.POR_CONTRACT_ADDRESS ?? "(not set — using mock status)"}`);
  console.log(`\n   Endpoints:`);
  console.log(`   GET  /api/status           → solvency status`);
  console.log(`   GET  /api/users            → list valid user IDs`);
  console.log(`   POST /api/prove-inclusion  → generate inclusion proof`);
  console.log(`   GET  /health               → health check\n`);
});
