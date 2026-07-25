# Product Proposal: Sealed-Bid Auction

## What it does
The Midnight Sealed-Bid Auction is a privacy-preserving smart contract that allows participants to place bids on an asset without revealing their bid amount to the public or to other bidders. Using a commit-reveal or ZK-evaluation mechanism, the contract securely determines the highest bidder without exposing the losing bids.

## Who it's for
This dApp is designed for decentralized marketplaces, procurement platforms, and high-value asset auctions (like rare NFTs or real estate) where bid privacy is critical to prevent front-running, price manipulation, and bidding wars.

## What stays private vs. public
- **Private (Local Witness / Shielded):** The exact bid amounts placed by the users.
- **Public (On-Chain Ledger):** The list of participants who have successfully placed a bid, and (upon auction resolution) the identity of the winning bidder. 

## Why Midnight is the right fit
Midnight’s Zero-Knowledge (ZK) architecture allows the smart contract to mathematically verify the integrity of the auction (e.g., proving a bid is higher than a minimum reserve, or verifying the winning bid against all commitments) without ever exposing the raw bid values on the public blockchain. This guarantees fair participation while protecting user data.
