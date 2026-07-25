import * as crypto from 'crypto';

// ── Ledger State Simulator ────────────────────────────────────
interface LedgerState {
  bids: Map<string, string>; // bidder pubkey -> commitment
  highest_bid: bigint;
  highest_bidder: string;
  phase: number; // 0: Bidding, 1: Reveal, 2: Closed
}

// ── Contract Simulator ────────────────────────────────────────
// Simulates the Compact circuit behavior and ledger state for testing.
// Mirrors the logic in contracts/auction.compact exactly.
class AuctionContractSimulator {
  private state: LedgerState = {
    bids: new Map(),
    highest_bid: 0n,
    highest_bidder: '',
    phase: 0,
  };

  /**
   * Helper to simulate Compact's persistentHash for commitments.
   */
  static generateCommitment(amount: bigint, salt: string): string {
    const hash = crypto.createHash('sha256');
    hash.update(amount.toString());
    hash.update(salt);
    return hash.digest('hex');
  }

  getState(): LedgerState {
    return { ...this.state };
  }

  /**
   * Circuit: bid
   * PUBLIC: bidder, commitment
   * PRIVATE: amount, salt (never leave the local machine, only hash is sent)
   */
  bid(bidder: string, commitment: string) {
    if (this.state.phase !== 0) {
      throw new Error("Auction is not in the bidding phase");
    }
    this.state.bids.set(bidder, commitment);
  }

  /**
   * Circuit: advance_phase
   */
  advance_phase() {
    if (this.state.phase >= 2) {
      throw new Error("Auction is already closed");
    }
    this.state.phase += 1;
  }

  /**
   * Circuit: reveal
   * PRIVATE: amount, salt
   * PUBLIC: bidder
   * ZK Constraint: amount > highest_bid (Fails locally if not true)
   */
  reveal(bidder: string, amount: bigint, salt: string) {
    if (this.state.phase !== 1) {
      throw new Error("Auction is not in the reveal phase");
    }
    if (!this.state.bids.has(bidder)) {
      throw new Error("No bid found for this participant");
    }

    const stored_commitment = this.state.bids.get(bidder);
    const calculated_commitment = AuctionContractSimulator.generateCommitment(amount, salt);
    if (stored_commitment !== calculated_commitment) {
      throw new Error("Invalid bid amount or salt");
    }

    // THE PRIVACY MAGIC TRICK:
    // This ZK assertion prevents losing bids from ever being revealed on-chain.
    const curr_highest = this.state.highest_bid;
    if (amount <= curr_highest) {
      throw new Error("Bid is not higher than the current highest bid");
    }

    // Update public ledger with the new highest bid
    this.state.highest_bid = amount;
    this.state.highest_bidder = bidder;
  }
}

// ══════════════════════════════════════════════════════════════
// TEST SUITE
// ══════════════════════════════════════════════════════════════

describe('Sealed-Bid Auction Contract', () => {
  let contract: AuctionContractSimulator;

  beforeEach(() => {
    contract = new AuctionContractSimulator();
  });

  // ── TEST 1: Happy Path ─────────────────────────────────────────
  test('Happy Path: User can place a bid and reveal it to become the highest bidder', () => {
    const bidderAlice = '0xAlicePubKey';
    const aliceAmount = 150n;
    const aliceSalt = 'random_salt_123';
    
    const aliceCommitment = AuctionContractSimulator.generateCommitment(aliceAmount, aliceSalt);

    // 1. Bidding Phase
    contract.bid(bidderAlice, aliceCommitment);
    expect(contract.getState().bids.has(bidderAlice)).toBe(true);

    // 2. Advance to Reveal Phase
    contract.advance_phase();
    expect(contract.getState().phase).toBe(1);

    // 3. Reveal Phase
    contract.reveal(bidderAlice, aliceAmount, aliceSalt);
    expect(contract.getState().highest_bid).toBe(aliceAmount);
    expect(contract.getState().highest_bidder).toBe(bidderAlice);
  });

  // ── TEST 2: Rejection Path (Privacy Guarantee) ────────────────
  test('Rejection Path: Losing bids are mathematically rejected by ZK circuit and stay secret', () => {
    const bidderAlice = '0xAlice';
    const bidderBob = '0xBob';

    // Alice bids 200
    const aliceCommitment = AuctionContractSimulator.generateCommitment(200n, 'saltA');
    contract.bid(bidderAlice, aliceCommitment);

    // Bob bids 100 (a losing bid)
    const bobCommitment = AuctionContractSimulator.generateCommitment(100n, 'saltB');
    contract.bid(bidderBob, bobCommitment);

    // Advance to Reveal Phase
    contract.advance_phase();

    // Alice reveals her winning bid
    contract.reveal(bidderAlice, 200n, 'saltA');
    expect(contract.getState().highest_bid).toBe(200n);

    // Bob attempts to reveal his lower bid.
    // In Midnight, this throws locally during proof generation, ensuring his 
    // losing bid value (100) never hits the public blockchain!
    expect(() => {
      contract.reveal(bidderBob, 100n, 'saltB');
    }).toThrow("Bid is not higher than the current highest bid");

    // Highest bid remains Alice's
    expect(contract.getState().highest_bid).toBe(200n);
    expect(contract.getState().highest_bidder).toBe(bidderAlice);
  });

  // ── TEST 3: Rejection Path (Integrity Guarantee) ──────────────
  test('Rejection Path: Cannot place bids after the bidding phase has ended', () => {
    const bidderCharlie = '0xCharlie';
    const charlieCommitment = AuctionContractSimulator.generateCommitment(50n, 'saltC');

    // Advance phase immediately to Reveal
    contract.advance_phase();
    expect(contract.getState().phase).toBe(1);

    // Charlie tries to sneak a bid in
    expect(() => {
      contract.bid(bidderCharlie, charlieCommitment);
    }).toThrow("Auction is not in the bidding phase");
  });

  // ── TEST 4: Invalid Commitment ────────────────────────────────
  test('Rejection Path: Reveal fails if amount or salt does not match commitment', () => {
    const bidderDave = '0xDave';
    const daveRealAmount = 300n;
    const daveCommitment = AuctionContractSimulator.generateCommitment(daveRealAmount, 'true_salt');

    contract.bid(bidderDave, daveCommitment);
    contract.advance_phase();

    // Dave tries to cheat by revealing a higher amount
    expect(() => {
      contract.reveal(bidderDave, 500n, 'true_salt');
    }).toThrow("Invalid bid amount or salt");

    // Dave tries with wrong salt
    expect(() => {
      contract.reveal(bidderDave, daveRealAmount, 'wrong_salt');
    }).toThrow("Invalid bid amount or salt");
  });
});
