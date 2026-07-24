# FullMoon – Level 2: Waxing Crescent Submission

Welcome to the **FullMoon** Level 2 submission! This project implements a fully functioning decentralized application (dApp) on the Midnight Network (Preprod), demonstrating selective disclosure using Zero-Knowledge proofs directly in the browser.

## Features

- **Connect Lace Wallet**: Seamless integration with the Lace browser extension via the Midnight DApp Connector API.
- **Selective Disclosure**:
  - **Private Increment**: Users increment the counter by a hidden amount. A ZK proof is generated in the browser to prove the amount is valid (≥ 1) without revealing the actual number.
  - **Authorized Reset**: Users can reset the counter to zero by providing a secret authorization key. The key is never sent to the network.
- **Glassmorphism UI**: A beautiful, modern interface reflecting the FullMoon aesthetic.

---

## 🚀 Live Demo & Contract Address

- **Local Devnet Contract Address**: `94a3573f488c43f20ab3e73ab56ed63f4ecbac495092e9a7ba9e57cad344826a`
- **Network**: `undeployed` (Local Devnet)

---

## How to Deploy and Run

### 1. Deploying the Contract to Preprod

Because deploying to the public Preprod network requires funding a wallet with `tNIGHT` tokens via the Discord Faucet, you must deploy the contract manually:

1. Open your terminal and navigate to the project directory:
   ```bash
   cd mn-demo
   npm run deploy -- --network preprod
   ```
2. The script will generate a new wallet and print an address. It will then hang, waiting for funds.
3. Copy the address and request funds from the **Midnight Discord Faucet**.
4. Once the transaction clears, the script will automatically continue, deploy the contract, and print the **Contract Address**.
5. Copy the Contract Address.

### 2. Running the Frontend Locally

1. Update the contract address in the frontend:
   Open `frontend/src/config/network.ts` and replace the placeholder `CONTRACT_ADDRESS` with your deployed Preprod address.
2. Ensure you have the `managed` folder compiled. If not, run `compact compile` from the project root.
3. Start the dev server:
   ```bash
   cd frontend
   npm run dev
   ```
4. Ensure your Lace wallet is set to **Preprod** network and is funded!

### 3. Deploying to Vercel

The frontend is pre-configured with a `vercel.json` file to inject the required WebAssembly Cross-Origin Isolation headers (`Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy`).

1. Commit your changes and push them to a GitHub repository.
2. Log into Vercel and import the repository.
3. In the Build settings, make sure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
4. Set the Environment Variable `VITE_NETWORK_ID` to `preprod` and `VITE_CONTRACT_ADDRESS` to your contract address in Vercel settings.
5. Deploy!

---

## 🔒 Privacy Model Claims (Proven without Shown)

This application strictly adheres to the "Proven without Shown" philosophy:

1. **Local Witnesses**: The `secretIncrement` amount and `secretResetKey` are treated as local witnesses. They are managed by the `levelPrivateStateProvider` using IndexedDB entirely in the browser.
2. **Client-Side Proving**: When interacting with the contract, the DApp Connector and the `FetchZkConfigProvider` generate the ZK Proof using the WebAssembly runtime within the user's browser. 
3. **Data Protection**: The actual values of the increment amount and the reset key **never** leave the user's device. Only the ZK Proof is submitted to the Midnight ledger, proving that the user holds a valid secret key or increment amount.
