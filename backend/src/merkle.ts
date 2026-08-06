/**
 * merkle.ts — Build a Poseidon Merkle tree from user balances
 *
 * The tree has N=16 leaves and DEPTH=4.
 * Each leaf = Poseidon(balance, salt)
 * The root is stored on-chain as the liabilities commitment.
 */
import { buildPoseidon } from "circomlibjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const TREE_DEPTH = 4;
export const N_LEAVES = 16; // 2^DEPTH

export interface UserBalance {
  userId: string;
  balance: bigint;
  salt: bigint;
  secret: bigint;   // kept private, only delivered to the user
}

export interface MerkleTree {
  root: bigint;
  leaves: bigint[];         // Poseidon(balance, salt) for each leaf
  layers: bigint[][];       // layers[0] = leaves, layers[DEPTH] = [root]
  userData: UserBalance[];  // private — never published
}

export async function buildMerkleTree(users: UserBalance[]): Promise<MerkleTree> {
  const poseidon = await buildPoseidon();
  const F = poseidon.F;

  if (users.length > N_LEAVES) {
    throw new Error(`Too many users: max ${N_LEAVES}, got ${users.length}`);
  }

  // Pad to N_LEAVES with zero entries
  const padded = [...users];
  while (padded.length < N_LEAVES) {
    padded.push({ userId: "padding", balance: 0n, salt: 0n, secret: 0n });
  }

  // Compute leaf commitments: Poseidon(balance, salt)
  const leafHashes: bigint[] = padded.map((u) =>
    F.toObject(poseidon([u.balance, u.salt]))
  );

  // Build tree bottom-up
  const layers: bigint[][] = [leafHashes];
  let current = leafHashes;
  while (current.length > 1) {
    const next: bigint[] = [];
    for (let i = 0; i < current.length; i += 2) {
      next.push(F.toObject(poseidon([current[i], current[i + 1]])));
    }
    layers.push(next);
    current = next;
  }

  return {
    root: current[0],
    leaves: leafHashes,
    layers,
    userData: padded,
  };
}

export function getMerklePath(tree: MerkleTree, leafIndex: number) {
  const pathElements: bigint[] = [];
  const pathIndices: number[] = [];
  let idx = leafIndex;

  for (let level = 0; level < TREE_DEPTH; level++) {
    const layer = tree.layers[level];
    const isRight = idx % 2;
    const siblingIdx = isRight ? idx - 1 : idx + 1;
    pathElements.push(layer[siblingIdx] ?? 0n);
    pathIndices.push(isRight);
    idx = Math.floor(idx / 2);
  }

  return { pathElements, pathIndices };
}

export function computeNullifier(poseidon: any, secret: bigint, leafIndex: number): bigint {
  return poseidon.F.toObject(poseidon([secret, BigInt(leafIndex)]));
}

// ─── CLI entry point ─────────────────────────────────────────────────
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dataPath = path.join(__dirname, "../data/sample-balances.json");
  const raw = JSON.parse(fs.readFileSync(dataPath, "utf-8")) as Array<{
    userId: string; balance: string; salt: string; secret: string;
  }>;

  const users: UserBalance[] = raw.map((u) => ({
    userId: u.userId,
    balance: BigInt(u.balance),
    salt: BigInt(u.salt),
    secret: BigInt(u.secret),
  }));

  buildMerkleTree(users).then((tree) => {
    const out = {
      root: "0x" + tree.root.toString(16).padStart(64, "0"),
      nLeaves: users.length,
      leaves: tree.leaves.map((l) => "0x" + l.toString(16).padStart(64, "0")),
    };
    const outPath = path.join(__dirname, "../data/tree-output.json");
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
    console.log(`✅ Merkle tree built. Root: ${out.root}`);
    console.log(`   Written to backend/data/tree-output.json`);
  });
}
