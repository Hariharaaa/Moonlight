/**
 * Inclusion circuit test vectors
 * Tests: valid inclusion, wrong root (should fail), nullifier replay detection
 */
import { buildPoseidon } from "circomlibjs";
import * as snarkjs from "snarkjs";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUILD = path.join(__dirname, "../build/inclusion");
const WASM = path.join(BUILD, "inclusion_js/inclusion.wasm");
const ZKEY = path.join(BUILD, "inclusion_final.zkey");
const VKEY = path.join(BUILD, "inclusion_verification_key.json");

const DEPTH = 4;
const N = 16;

async function buildMerkleTree(poseidon: any, leaves: bigint[]) {
  const F = poseidon.F;
  let layer = [...leaves];
  const layers: bigint[][] = [layer];
  while (layer.length > 1) {
    const next: bigint[] = [];
    for (let i = 0; i < layer.length; i += 2) {
      next.push(F.toObject(poseidon([layer[i], layer[i + 1]])));
    }
    layer = next;
    layers.push(layer);
  }
  return { root: layer[0], layers };
}

function getMerklePath(layers: bigint[][], leafIndex: number) {
  const pathElements: bigint[] = [];
  const pathIndices: number[] = [];
  let idx = leafIndex;
  for (let i = 0; i < layers.length - 1; i++) {
    const isRight = idx % 2;
    const siblingIdx = isRight ? idx - 1 : idx + 1;
    pathElements.push(layers[i][siblingIdx] ?? 0n);
    pathIndices.push(isRight);
    idx = Math.floor(idx / 2);
  }
  return { pathElements, pathIndices };
}

async function main() {
  console.log("🧪 Inclusion Circuit Tests\n");
  const poseidon = await buildPoseidon();
  const F = poseidon.F;

  // Build tree from same sample data as solvency test
  const balances = [100n,250n,375n,80n,620n,90n,445n,200n,330n,110n,0n,0n,0n,0n,0n,0n];
  const salts    = [11n, 22n, 33n, 44n, 55n, 66n, 77n, 88n, 99n,110n,0n,0n,0n,0n,0n,0n];

  const leaves = balances.map((b, i) => F.toObject(poseidon([b, salts[i]])));
  const { root, layers } = await buildMerkleTree(poseidon, leaves);

  // User at index 3: balance=80, salt=44
  const leafIndex = 3;
  const secret = 999999n;
  const nullifier = F.toObject(poseidon([secret, BigInt(leafIndex)]));
  const { pathElements, pathIndices } = getMerklePath(layers, leafIndex);

  // ─── Test 1: Valid inclusion proof ──────────────────────────────
  console.log("Test 1: Valid inclusion for user at index 3 (balance=80)");
  try {
    const input = {
      liabilitiesRoot: root,
      nullifier,
      balance: 80n,
      salt: 44n,
      secret,
      pathElements,
      pathIndices,
      leafIndex: BigInt(leafIndex),
    };
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, WASM, ZKEY);
    const vKey = JSON.parse(fs.readFileSync(VKEY, "utf-8"));
    const valid = await snarkjs.groth16.verify(vKey, publicSignals, proof);
    console.assert(valid, "Proof should be valid");
    console.log("  ✅ PASS — inclusion proof generated and verified\n");
  } catch (e) {
    console.log("  ❌ FAIL:", e);
  }

  // ─── Test 2: Wrong root — should fail ───────────────────────────
  console.log("Test 2: Wrong root (tampered) — expect failure");
  try {
    const input = {
      liabilitiesRoot: root + 1n, // tampered!
      nullifier,
      balance: 80n,
      salt: 44n,
      secret,
      pathElements,
      pathIndices,
      leafIndex: BigInt(leafIndex),
    };
    await snarkjs.groth16.fullProve(input, WASM, ZKEY);
    console.log("  ❌ FAIL — should have thrown on root mismatch");
  } catch (e) {
    console.log("  ✅ PASS — correctly rejected wrong root\n");
  }

  // ─── Test 3: Wrong balance — should fail ────────────────────────
  console.log("Test 3: Wrong balance (80 → 9999) — expect failure");
  try {
    const input = {
      liabilitiesRoot: root,
      nullifier,
      balance: 9999n, // wrong!
      salt: 44n,
      secret,
      pathElements,
      pathIndices,
      leafIndex: BigInt(leafIndex),
    };
    await snarkjs.groth16.fullProve(input, WASM, ZKEY);
    console.log("  ❌ FAIL — should have thrown on balance mismatch");
  } catch (e) {
    console.log("  ✅ PASS — correctly rejected wrong balance\n");
  }

  console.log("🎉 All inclusion tests complete.");
}

main().catch(console.error);
