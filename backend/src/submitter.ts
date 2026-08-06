/**
 * submitter.ts — Submit the aggregate solvency proof to the contract on Sepolia
 */
import { createWalletClient, createPublicClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { generateSolvencyProof } from "./prover.js";
import { UserBalance } from "./merkle.js";

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), "../../.env") });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const POR_ABI = parseAbi([
  "function submitSolvencyProof(uint256[2] a, uint256[2][2] b, uint256[2] c, uint256[3] publicSignals) external",
  "function updateLiabilitiesRoot(bytes32 newRoot) external",
  "function getStatus() external view returns (bool solvent, uint256 reserves, bytes32 liabilitiesRoot, uint256 lastChecked)",
  "event SolvencyChecked(bool indexed passed, uint256 reserves, bytes32 liabilitiesRoot, uint256 timestamp)",
]);

async function main() {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;
  const rpcUrl = process.env.SEPOLIA_RPC_URL!;
  const contractAddr = process.env.POR_CONTRACT_ADDRESS as `0x${string}`;

  if (!privateKey || !rpcUrl || !contractAddr) {
    throw new Error("Missing env vars: DEPLOYER_PRIVATE_KEY, SEPOLIA_RPC_URL, POR_CONTRACT_ADDRESS");
  }

  const account = privateKeyToAccount(privateKey);
  const publicClient = createPublicClient({ chain: sepolia, transport: http(rpcUrl) });
  const walletClient = createWalletClient({ account, chain: sepolia, transport: http(rpcUrl) });

  console.log("📡 Submitter connected to Sepolia");
  console.log(`   Account: ${account.address}`);
  console.log(`   Contract: ${contractAddr}`);

  // Load sample balances
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

  const reservesTotal = BigInt(process.env.CURRENT_RESERVES ?? "30000000");
  const timestamp = BigInt(Math.floor(Date.now() / 1000));

  console.log(`\n🔧 Generating solvency proof (${users.length} users, reserves=${reservesTotal})...`);
  const { proof, root } = await generateSolvencyProof({ users, reservesTotal, timestamp });

  // Update the on-chain liabilities root first
  const rootHex = ("0x" + root.toString(16).padStart(64, "0")) as `0x${string}`;
  console.log(`\n📝 Updating on-chain liabilities root: ${rootHex}`);
  const rootTxHash = await walletClient.writeContract({
    address: contractAddr,
    abi: POR_ABI,
    functionName: "updateLiabilitiesRoot",
    args: [rootHex],
  });
  await publicClient.waitForTransactionReceipt({ hash: rootTxHash });
  console.log(`   ✅ Root updated: ${rootTxHash}`);

  // Submit the solvency proof
  console.log(`\n📝 Submitting solvency proof...`);
  const txHash = await walletClient.writeContract({
    address: contractAddr,
    abi: POR_ABI,
    functionName: "submitSolvencyProof",
    args: [
      proof.a.map(BigInt) as [bigint, bigint],
      [proof.b[0].map(BigInt), proof.b[1].map(BigInt)] as [[bigint, bigint], [bigint, bigint]],
      proof.c.map(BigInt) as [bigint, bigint],
      [reservesTotal, root, timestamp],
    ],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  console.log(`   ✅ Solvency proof submitted: ${txHash}`);
  console.log(`   Block: ${receipt.blockNumber}`);

  // Verify on-chain status
  const status = await publicClient.readContract({
    address: contractAddr,
    abi: POR_ABI,
    functionName: "getStatus",
  });
  console.log(`\n📊 On-chain status:`);
  console.log(`   Solvent: ${status[0]}`);
  console.log(`   Reserves: ${status[1]}`);
  console.log(`   Root: ${status[2]}`);
  console.log(`   Last checked: ${new Date(Number(status[3]) * 1000).toISOString()}`);
}

main().catch(console.error);
