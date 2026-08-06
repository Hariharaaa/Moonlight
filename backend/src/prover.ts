/**
 * prover.ts — Generate Groth16 proofs for solvency and inclusion
 */
import { buildPoseidon } from "circomlibjs";
import * as snarkjs from "snarkjs";
import path from "path";
import { fileURLToPath } from "url";
import {
  buildMerkleTree,
  getMerklePath,
  computeNullifier,
  UserBalance,
  TREE_DEPTH,
  N_LEAVES,
} from "./merkle.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUILD = path.join(__dirname, "../../circuits/build");

export interface SolvencyProofInput {
  users: UserBalance[];
  reservesTotal: bigint;
  timestamp: bigint;
}

export interface InclusionProofInput {
  user: UserBalance;
  leafIndex: number;
  allUsers: UserBalance[];
}

export interface Groth16Proof {
  proof: {
    a: [string, string];
    b: [[string, string], [string, string]];
    c: [string, string];
  };
  publicSignals: string[];
  root: bigint;
  nullifier?: bigint;
}

export async function generateSolvencyProof(
  input: SolvencyProofInput
): Promise<Groth16Proof> {
  const { users, reservesTotal, timestamp } = input;

  const tree = await buildMerkleTree(users);

  // Pad to N_LEAVES
  const padded = [...users];
  while (padded.length < N_LEAVES) {
    padded.push({ userId: "pad", balance: 0n, salt: 0n, secret: 0n });
  }

  const circuitInput = {
    reservesTotal,
    liabilitiesRoot: tree.root,
    timestamp,
    balances: padded.map((u) => u.balance),
    salts: padded.map((u) => u.salt),
    nLeaves: BigInt(users.length),
  };

  const wasmPath = path.join(BUILD, "solvency/solvency_js/solvency.wasm");
  const zkeyPath = path.join(BUILD, "solvency/solvency_final.zkey");

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    circuitInput,
    wasmPath,
    zkeyPath
  );

  return {
    proof: {
      a: proof.pi_a.slice(0, 2) as [string, string],
      b: [proof.pi_b[0].slice(0, 2), proof.pi_b[1].slice(0, 2)] as [[string, string], [string, string]],
      c: proof.pi_c.slice(0, 2) as [string, string],
    },
    publicSignals,
    root: tree.root,
  };
}

export async function generateInclusionProof(
  input: InclusionProofInput
): Promise<Groth16Proof> {
  const { user, leafIndex, allUsers } = input;

  const poseidon = await buildPoseidon();
  const tree = await buildMerkleTree(allUsers);
  const { pathElements, pathIndices } = getMerklePath(tree, leafIndex);
  const nullifier = computeNullifier(poseidon, user.secret, leafIndex);

  const circuitInput = {
    liabilitiesRoot: tree.root,
    nullifier,
    balance: user.balance,
    salt: user.salt,
    secret: user.secret,
    pathElements,
    pathIndices,
    leafIndex: BigInt(leafIndex),
  };

  const wasmPath = path.join(BUILD, "inclusion/inclusion_js/inclusion.wasm");
  const zkeyPath = path.join(BUILD, "inclusion/inclusion_final.zkey");

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    circuitInput,
    wasmPath,
    zkeyPath
  );

  return {
    proof: {
      a: proof.pi_a.slice(0, 2) as [string, string],
      b: [proof.pi_b[0].slice(0, 2), proof.pi_b[1].slice(0, 2)] as [[string, string], [string, string]],
      c: proof.pi_c.slice(0, 2) as [string, string],
    },
    publicSignals,
    root: tree.root,
    nullifier,
  };
}
