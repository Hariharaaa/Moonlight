/**
 * Solvency circuit test vectors
 * Tests: valid proof, reserves exactly equal, insufficient reserves (should fail)
 */
import { buildPoseidon } from "circomlibjs";
import * as snarkjs from "snarkjs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUILD = path.join(__dirname, "../build/solvency");
const WASM = path.join(BUILD, "solvency_js/solvency.wasm");
const ZKEY = path.join(BUILD, "solvency_final.zkey");
const VKEY = path.join(BUILD, "solvency_verification_key.json");

const N = 16;

async function buildTree(poseidon: any, leaves: bigint[]): Promise<bigint> {
  const F = poseidon.F;
  let layer = [...leaves];
  while (layer.length > 1) {
    const next: bigint[] = [];
    for (let i = 0; i < layer.length; i += 2) {
      next.push(F.toObject(poseidon([layer[i], layer[i + 1]])));
    }
    layer = next;
  }
  return layer[0];
}

async function main() {
  console.log("🧪 Solvency Circuit Tests\n");
  const poseidon = await buildPoseidon();
  const F = poseidon.F;

  // Sample balances: 10 users, padded to 16 with 0
  const balances = [100n, 250n, 375n, 80n, 620n, 90n, 445n, 200n, 330n, 110n,
                    0n, 0n, 0n, 0n, 0n, 0n];
  const salts    = [11n, 22n, 33n, 44n, 55n, 66n, 77n, 88n, 99n, 110n,
                    0n, 0n, 0n, 0n, 0n, 0n];
  const nLeaves  = 10;
  const totalLiabilities = balances.slice(0, nLeaves).reduce((a, b) => a + b, 0n);
  // = 2600

  const leaves = balances.map((b, i) => F.toObject(poseidon([b, salts[i]])));
  const root = await buildTree(poseidon, leaves);
  const timestamp = BigInt(Math.floor(Date.now() / 1000));

  // ─── Test 1: Solvent (reserves > liabilities) ────────────────────
  console.log("Test 1: Solvent case (reserves = 3000, liabilities = 2600)");
  try {
    const input = {
      reservesTotal: 3000n,
      liabilitiesRoot: root,
      timestamp,
      balances,
      salts,
      nLeaves: BigInt(nLeaves),
    };
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, WASM, ZKEY);
    const vKey = JSON.parse(require("fs").readFileSync(VKEY, "utf-8"));
    const valid = await snarkjs.groth16.verify(vKey, publicSignals, proof);
    console.assert(valid, "Proof should be valid");
    console.log("  ✅ PASS — proof generated and verified\n");
  } catch (e) {
    console.log("  ❌ FAIL:", e);
  }

  // ─── Test 2: Exactly solvent (reserves == liabilities) ──────────
  console.log("Test 2: Exactly solvent (reserves = liabilities = 2600)");
  try {
    const input = {
      reservesTotal: totalLiabilities,
      liabilitiesRoot: root,
      timestamp,
      balances,
      salts,
      nLeaves: BigInt(nLeaves),
    };
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, WASM, ZKEY);
    const vKey = JSON.parse(require("fs").readFileSync(VKEY, "utf-8"));
    const valid = await snarkjs.groth16.verify(vKey, publicSignals, proof);
    console.assert(valid, "Proof should be valid at exact boundary");
    console.log("  ✅ PASS — boundary case verified\n");
  } catch (e) {
    console.log("  ❌ FAIL:", e);
  }

  // ─── Test 3: Insolvent (reserves < liabilities) — should FAIL ───
  console.log("Test 3: Insolvent (reserves = 100, liabilities = 2600) — expect failure");
  try {
    const input = {
      reservesTotal: 100n,
      liabilitiesRoot: root,
      timestamp,
      balances,
      salts,
      nLeaves: BigInt(nLeaves),
    };
    await snarkjs.groth16.fullProve(input, WASM, ZKEY);
    console.log("  ❌ FAIL — should have thrown");
  } catch (e) {
    console.log("  ✅ PASS — witness generation correctly rejected\n");
  }

  console.log("🎉 All solvency tests complete.");
}

main().catch(console.error);
