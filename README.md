# FullMoon - Sealed-Bid ZK Auction

[![CI Pipeline](https://github.com/Hariharaaa/Moonlight/actions/workflows/ci.yml/badge.svg)](https://github.com/Hariharaaa/Moonlight/actions/workflows/ci.yml)

Welcome to the **FullMoon** Level 3 (Waxing Gibbous) submission! This project implements a **Sealed-Bid Auction** decentralized application (dApp) on the Midnight Network (Preprod), demonstrating true selective disclosure using Zero-Knowledge proofs directly in the browser.

## Features

- **Connect Lace Wallet**: Seamless integration with the Lace browser extension via the Midnight DApp Connector API.
- **Selective Disclosure (Sealed-Bid Auction)**:
  - **Private Bidding**: Users submit a cryptographic commitment to their bid. The actual bid amount and salt are never sent to the network.
  - **Private Reveal**: During the reveal phase, losing bids are mathematically rejected by the ZK circuit *locally*, ensuring losing bid amounts remain secret forever.
- **Continuous Integration**: Automated tests and compilation checks via GitHub Actions.
- **Glassmorphism UI**: A beautiful, modern interface reflecting the FullMoon aesthetic.

---

## 📸 Application Screenshots

### Before Wallet Connection
![Before Connection](./before-connection.png)

### After Wallet Connection
![After Connection](./after-connection.png)

---

## 🚀 Live Demo & Contract Address

- **Live Demo (Vercel)**: [https://moonlight-two-mu.vercel.app/](https://moonlight-two-mu.vercel.app/)
- **Preprod Contract Address**: `a243dd4e83157f79eb8c1f700f9a774693a1ba0556b13da07bcfa2cc35baccd6`
- **Network**: `preprod` (Midnight Testnet)
- **Demo Video**: [Google Drive Link](https://drive.google.com/file/d/1GKO3IBZi3JS7Gq21kjO6Akdlev1J52Qr/view?usp=drive_link)

---

## ✅ Waxing Gibbous (Level 3) Submission Checklist
- [x] **Public GitHub repository with README**
- [x] **Live demo link (Vercel)**
- [x] **Deployed Preprod contract address (verifiable on-chain)**
- [x] **Demo video: wallet connect + a successful circuit call**
- [x] **README documenting the privacy claim**
- [x] **Minimum 8 meaningful commits**
- [x] **Chosen Idea Implemented: Sealed-Bid Auction**
- [x] **Test suite with 3+ passing tests**
- [x] **GitHub Actions CI/CD Pipeline**

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

This application strictly adheres to the "Proven without Shown" philosophy for a Sealed-Bid Auction:

1. **Local Witnesses**: The `bidAmount` and `bidSalt` are treated as local witnesses. They are managed by the `levelPrivateStateProvider` using IndexedDB and `localStorage` entirely in the browser.
2. **Client-Side Proving**: When interacting with the contract, the DApp Connector generates the ZK Proof using the WebAssembly runtime within the user's browser. 
3. **Data Protection (Bidding)**: The actual values of the bid amount and salt **never** leave the user's device during the Bidding phase. Only the hashed commitment is submitted to the Midnight ledger.
4. **Data Protection (Revealing)**: During the Reveal phase, the ZK circuit asserts `amount > highest_bid`. If the user's bid is lower, the ZK proof generation fails *locally*. The losing bid amount is never broadcasted to the network, meaning participants do not learn each other's losing bids.
