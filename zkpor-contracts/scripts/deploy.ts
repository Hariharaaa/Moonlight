import { ethers, network, run } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log(`\n🚀 Deploying ProofOfReserves to ${network.name}...\n`);

  const [deployer] = await ethers.getSigners();
  console.log(`  Deployer: ${deployer.address}`);
  console.log(`  Balance:  ${ethers.formatEther(await deployer.provider.getBalance(deployer.address))} ETH\n`);

  // ─── Deploy verifier contracts ─────────────────────────────────
  // NOTE: In production, these are the snarkjs-generated Groth16 verifiers.
  // For testnet MVP without a compiled circuit, we use a mock that always passes.
  // Replace with real verifiers after running: bash circuits/scripts/compile.sh
  const isMock = process.env.USE_MOCK_VERIFIERS === "true";
  let solvencyVerifierAddr: string;
  let inclusionVerifierAddr: string;

  if (isMock) {
    console.log("⚠️  Using MockVerifier (USE_MOCK_VERIFIERS=true). Replace for mainnet.");
    const Mock = await ethers.getContractFactory("MockVerifier");
    const sv = await Mock.deploy(true);
    await sv.waitForDeployment();
    solvencyVerifierAddr = await sv.getAddress();

    const iv = await Mock.deploy(true);
    await iv.waitForDeployment();
    inclusionVerifierAddr = await iv.getAddress();
  } else {
    // Load real auto-generated verifiers from circuit build output
    const solvencyVerifierPath = path.join(
      __dirname, "../../circuits/build/solvency/solvencyVerifier.sol"
    );
    const inclusionVerifierPath = path.join(
      __dirname, "../../circuits/build/inclusion/inclusionVerifier.sol"
    );
    if (!fs.existsSync(solvencyVerifierPath)) {
      throw new Error("Solvency verifier not found. Run: bash circuits/scripts/compile.sh");
    }

    const SV = await ethers.getContractFactory("SolvencyVerifier");
    const sv = await SV.deploy();
    await sv.waitForDeployment();
    solvencyVerifierAddr = await sv.getAddress();

    const IV = await ethers.getContractFactory("InclusionVerifier");
    const iv = await IV.deploy();
    await iv.waitForDeployment();
    inclusionVerifierAddr = await iv.getAddress();
  }

  console.log(`  SolvencyVerifier deployed:  ${solvencyVerifierAddr}`);
  console.log(`  InclusionVerifier deployed: ${inclusionVerifierAddr}`);

  // ─── Deploy ProofOfReserves ────────────────────────────────────
  const POR = await ethers.getContractFactory("ProofOfReserves");
  const por = await POR.deploy(solvencyVerifierAddr, inclusionVerifierAddr);
  await por.waitForDeployment();
  const porAddr = await por.getAddress();
  console.log(`\n  ✅ ProofOfReserves deployed: ${porAddr}`);

  // ─── Set initial reserves attestation ─────────────────────────
  const initialReserves = process.env.INITIAL_RESERVES
    ? BigInt(process.env.INITIAL_RESERVES)
    : ethers.parseUnits("1000000", 6); // 1M USDC units as default

  await por.updateReserves(initialReserves);
  console.log(`  ✅ Initial reserves set: ${initialReserves.toString()}`);

  // ─── Save deployment info ──────────────────────────────────────
  const deployInfo = {
    network: network.name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    contracts: {
      ProofOfReserves: porAddr,
      SolvencyVerifier: solvencyVerifierAddr,
      InclusionVerifier: inclusionVerifierAddr,
    },
    deployedAt: new Date().toISOString(),
  };

  const outPath = path.join(__dirname, "../deployment.json");
  fs.writeFileSync(outPath, JSON.stringify(deployInfo, null, 2));
  console.log(`\n  📄 Deployment info saved to contracts/deployment.json`);
  console.log(JSON.stringify(deployInfo, null, 2));

  // ─── Verify on Etherscan (Sepolia) ────────────────────────────
  if (network.name === "sepolia" && process.env.ETHERSCAN_API_KEY) {
    console.log("\n🔍 Verifying on Etherscan...");
    await new Promise(r => setTimeout(r, 30000)); // wait for indexing
    try {
      await run("verify:verify", {
        address: porAddr,
        constructorArguments: [solvencyVerifierAddr, inclusionVerifierAddr],
      });
      console.log("  ✅ Verified on Etherscan");
    } catch (e: any) {
      console.log("  ⚠️  Etherscan verification failed:", e.message);
    }
  }

  console.log("\n🎉 Deployment complete!\n");
  return porAddr;
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
