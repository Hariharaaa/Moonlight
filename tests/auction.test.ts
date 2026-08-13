import * as crypto from 'crypto';

// ── Ledger State Simulator ────────────────────────────────────
interface Auction {
  seller: string;
  phase: number; // 0: Bidding, 1: Reveal, 2: Settled, 3: Cancelled
  highest_bid: bigint;
  highest_bidder: string;
  bid_count: bigint;
}

interface LedgerState {
  auctions: Map<string, Auction>;
  bids: Map<string, string>; // hash([auction_id, bidder]) -> commitment
  escrows: Map<string, bigint>; // hash([auction_id, user]) -> balance
}

// ── Contract Simulator ────────────────────────────────────────
class AuctionContractSimulator {
  private state: LedgerState = {
    auctions: new Map(),
    bids: new Map(),
    escrows: new Map(),
  };

  static generateCommitment(amount: bigint, salt: string): string {
    const hash = crypto.createHash('sha256');
    hash.update(amount.toString());
    hash.update(salt);
    return hash.digest('hex');
  }

  static getMapKey(auctionId: string, user: string): string {
    const hash = crypto.createHash('sha256');
    hash.update(auctionId);
    hash.update(user);
    return hash.digest('hex');
  }

  getState(): LedgerState {
    // Deep copy for assertions
    return {
      auctions: new Map(Array.from(this.state.auctions.entries()).map(([k, v]) => [k, { ...v }])),
      bids: new Map(this.state.bids),
      escrows: new Map(this.state.escrows)
    };
  }
  
  getEscrow(auctionId: string, user: string): bigint {
    const key = AuctionContractSimulator.getMapKey(auctionId, user);
    return this.state.escrows.get(key) || 0n;
  }

  create_auction(auction_id: string, seller: string) {
    if (this.state.auctions.has(auction_id)) throw new Error("Auction ID already exists");
    this.state.auctions.set(auction_id, {
      seller,
      phase: 0,
      highest_bid: 0n,
      highest_bidder: seller,
      bid_count: 0n
    });
  }

  cancel_auction(auction_id: string, seller: string) {
    const auction = this.state.auctions.get(auction_id);
    if (!auction) throw new Error("Auction not found");
    if (auction.seller !== seller) throw new Error("Only the seller can cancel");
    if (auction.phase !== 0) throw new Error("Auction is not in Bidding phase");
    if (auction.bid_count > 0n) throw new Error("Cannot cancel an auction that has bids");

    auction.phase = 3; // Cancelled
  }

  bid(auction_id: string, bidder: string, lock_amount: bigint, amount: bigint, salt: string) {
    const auction = this.state.auctions.get(auction_id);
    if (!auction) throw new Error("Auction not found");
    if (auction.phase !== 0) throw new Error("Auction is not in the bidding phase");

    // ZK Escrow Check
    if (amount > lock_amount) throw new Error("Bid amount exceeds locked escrow");

    const map_key = AuctionContractSimulator.getMapKey(auction_id, bidder);
    const commitment = AuctionContractSimulator.generateCommitment(amount, salt);
    
    this.state.bids.set(map_key, commitment);
    
    const current_escrow = this.state.escrows.get(map_key) || 0n;
    this.state.escrows.set(map_key, current_escrow + lock_amount);

    auction.bid_count += 1n;
  }

  advance_phase(auction_id: string) {
    const auction = this.state.auctions.get(auction_id);
    if (!auction) throw new Error("Auction not found");
    if (auction.phase >= 2) throw new Error("Auction is already closed or cancelled");
    auction.phase += 1;
  }

  reveal(auction_id: string, bidder: string, amount: bigint, salt: string) {
    const auction = this.state.auctions.get(auction_id);
    if (!auction) throw new Error("Auction not found");
    if (auction.phase !== 1) throw new Error("Auction is not in the reveal phase");

    const map_key = AuctionContractSimulator.getMapKey(auction_id, bidder);
    if (!this.state.bids.has(map_key)) throw new Error("No bid found for this participant");

    const stored_commitment = this.state.bids.get(map_key);
    const calculated_commitment = AuctionContractSimulator.generateCommitment(amount, salt);
    if (stored_commitment !== calculated_commitment) throw new Error("Invalid bid amount or salt");

    // Privacy Constraint
    if (amount <= auction.highest_bid) throw new Error("Bid is not higher than the current highest bid");

    auction.highest_bid = amount;
    auction.highest_bidder = bidder;
  }

  settle(auction_id: string) {
    const auction = this.state.auctions.get(auction_id);
    if (!auction) throw new Error("Auction not found");
    if (auction.phase !== 1) throw new Error("Auction must be in Reveal phase to settle");

    auction.phase = 2; // Settled

    if (auction.highest_bid > 0n) {
      const winner_key = AuctionContractSimulator.getMapKey(auction_id, auction.highest_bidder);
      const winner_escrow = this.state.escrows.get(winner_key) || 0n;
      this.state.escrows.set(winner_key, winner_escrow - auction.highest_bid);
      
      const seller_key = AuctionContractSimulator.getMapKey(auction_id, auction.seller);
      const seller_escrow = this.state.escrows.get(seller_key) || 0n;
      this.state.escrows.set(seller_key, seller_escrow + auction.highest_bid);
    }
  }

  refund(auction_id: string, user: string) {
    const auction = this.state.auctions.get(auction_id);
    if (!auction) throw new Error("Auction not found");
    if (auction.phase < 2) throw new Error("Auction must be Settled or Cancelled to claim refunds");

    const map_key = AuctionContractSimulator.getMapKey(auction_id, user);
    if (!this.state.escrows.has(map_key)) throw new Error("No escrow balance found");
    
    const balance = this.state.escrows.get(map_key)!;
    if (balance === 0n) throw new Error("Escrow balance is zero");

    this.state.escrows.set(map_key, 0n);
  }
}

// ══════════════════════════════════════════════════════════════
// TEST SUITE: FullMoon Escrow & Default Handling
// ══════════════════════════════════════════════════════════════

describe('FullMoon Auction Marketplace Contract', () => {
  let contract: AuctionContractSimulator;

  beforeEach(() => {
    contract = new AuctionContractSimulator();
  });

  test('Happy Path: User bids, locks escrow, reveals, and settles cleanly', () => {
    const aId = 'auction_01';
    const seller = 'seller_xyz';
    const bidder = 'bidder_abc';

    contract.create_auction(aId, seller);
    
    // Bid 100, lock 150
    contract.bid(aId, bidder, 150n, 100n, 'salt1');
    expect(contract.getEscrow(aId, bidder)).toBe(150n);

    contract.advance_phase(aId);
    
    // Reveal
    contract.reveal(aId, bidder, 100n, 'salt1');
    
    // Settle
    contract.settle(aId);
    
    // After settle, seller has the 100n
    expect(contract.getEscrow(aId, seller)).toBe(100n);
    // Bidder's remaining escrow is 50n
    expect(contract.getEscrow(aId, bidder)).toBe(50n);
  });

  test('Rejection Path: Cannot bid more than locked escrow (ZK Failure)', () => {
    const aId = 'auction_02';
    contract.create_auction(aId, 'seller_xyz');

    expect(() => {
      // Trying to bid 200 while only locking 100
      contract.bid(aId, 'bidder_abc', 100n, 200n, 'saltX');
    }).toThrow("Bid amount exceeds locked escrow");
  });

  test('Cancellation: Allowed at 0 bids, blocked if bids exist', () => {
    const aId = 'auction_cancel';
    const seller = 'seller_00';

    contract.create_auction(aId, seller);
    
    // Seller can cancel right away
    contract.cancel_auction(aId, seller);
    expect(contract.getState().auctions.get(aId)!.phase).toBe(3);

    // Try again on a new auction with bids
    const aId2 = 'auction_no_cancel';
    contract.create_auction(aId2, seller);
    contract.bid(aId2, 'bidder', 50n, 50n, 'salt');

    expect(() => {
      contract.cancel_auction(aId2, seller);
    }).toThrow("Cannot cancel an auction that has bids");
  });

  test('Dispute/Fallback (Winner Default): If highest bidder defaults (does not reveal), next highest wins, and escrow refunds properly', () => {
    const aId = 'auction_default';
    const seller = 'seller_def';
    
    const trueHighestBidder = 'bidder_lazy';
    const defaultWinner = 'bidder_active';

    contract.create_auction(aId, seller);

    // trueHighest bids 500, locks 500
    contract.bid(aId, trueHighestBidder, 500n, 500n, 'salt1');
    // active bids 300, locks 300
    contract.bid(aId, defaultWinner, 300n, 300n, 'salt2');

    contract.advance_phase(aId);

    // `trueHighestBidder` fails to complete the reveal/settlement step (defaults)
    // `defaultWinner` reveals their 300n bid
    contract.reveal(aId, defaultWinner, 300n, 'salt2');

    // Settle is called. Because the 500n was never revealed, it wasn't recorded as highest.
    contract.settle(aId);

    const state = contract.getState().auctions.get(aId)!;
    expect(state.highest_bid).toBe(300n);
    expect(state.highest_bidder).toBe(defaultWinner);

    // Seller gets the 300n
    expect(contract.getEscrow(aId, seller)).toBe(300n);

    // Defaulted bidder gets FULL refund safely because they never became the highest_bidder
    expect(contract.getEscrow(aId, trueHighestBidder)).toBe(500n);
    contract.refund(aId, trueHighestBidder);
    expect(contract.getEscrow(aId, trueHighestBidder)).toBe(0n); // Successfully fully refunded!
  });

  test('Dispute/Fallback (Total Default): If NO ONE reveals, settlement safely returns escrow to all', () => {
    const aId = 'auction_no_reveal';
    const seller = 'seller_def';
    const bidder = 'bidder_shy';

    contract.create_auction(aId, seller);
    contract.bid(aId, bidder, 1000n, 1000n, 'salt_shy');

    contract.advance_phase(aId);
    
    // No one reveals. Seller or anyone calls settle.
    contract.settle(aId);

    const state = contract.getState().auctions.get(aId)!;
    expect(state.highest_bid).toBe(0n);
    expect(state.highest_bidder).toBe(seller);

    // Seller escrow hasn't increased
    expect(contract.getEscrow(aId, seller)).toBe(0n);

    // Bidder's full escrow is preserved and refundable
    expect(contract.getEscrow(aId, bidder)).toBe(1000n);
    contract.refund(aId, bidder);
    expect(contract.getEscrow(aId, bidder)).toBe(0n);
  });
});
