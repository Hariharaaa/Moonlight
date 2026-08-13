import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Auction = { seller: Uint8Array;
                        phase: bigint;
                        highest_bid: bigint;
                        highest_bidder: Uint8Array;
                        bid_count: bigint
                      };

export type Witnesses<PS> = {
}

export type ImpureCircuits<PS> = {
  create_auction(context: __compactRuntime.CircuitContext<PS>,
                 auction_id_0: Uint8Array,
                 seller_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  cancel_auction(context: __compactRuntime.CircuitContext<PS>,
                 auction_id_0: Uint8Array,
                 seller_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  bid(context: __compactRuntime.CircuitContext<PS>,
      auction_id_0: Uint8Array,
      bidder_0: Uint8Array,
      lock_amount_0: bigint,
      amount_0: bigint,
      salt_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  advance_phase(context: __compactRuntime.CircuitContext<PS>,
                auction_id_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  reveal(context: __compactRuntime.CircuitContext<PS>,
         auction_id_0: Uint8Array,
         bidder_0: Uint8Array,
         amount_0: bigint,
         salt_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  settle(context: __compactRuntime.CircuitContext<PS>, auction_id_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  refund(context: __compactRuntime.CircuitContext<PS>,
         auction_id_0: Uint8Array,
         user_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  create_auction(context: __compactRuntime.CircuitContext<PS>,
                 auction_id_0: Uint8Array,
                 seller_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  cancel_auction(context: __compactRuntime.CircuitContext<PS>,
                 auction_id_0: Uint8Array,
                 seller_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  bid(context: __compactRuntime.CircuitContext<PS>,
      auction_id_0: Uint8Array,
      bidder_0: Uint8Array,
      lock_amount_0: bigint,
      amount_0: bigint,
      salt_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  advance_phase(context: __compactRuntime.CircuitContext<PS>,
                auction_id_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  reveal(context: __compactRuntime.CircuitContext<PS>,
         auction_id_0: Uint8Array,
         bidder_0: Uint8Array,
         amount_0: bigint,
         salt_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  settle(context: __compactRuntime.CircuitContext<PS>, auction_id_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  refund(context: __compactRuntime.CircuitContext<PS>,
         auction_id_0: Uint8Array,
         user_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  create_auction(context: __compactRuntime.CircuitContext<PS>,
                 auction_id_0: Uint8Array,
                 seller_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  cancel_auction(context: __compactRuntime.CircuitContext<PS>,
                 auction_id_0: Uint8Array,
                 seller_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  bid(context: __compactRuntime.CircuitContext<PS>,
      auction_id_0: Uint8Array,
      bidder_0: Uint8Array,
      lock_amount_0: bigint,
      amount_0: bigint,
      salt_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  advance_phase(context: __compactRuntime.CircuitContext<PS>,
                auction_id_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  reveal(context: __compactRuntime.CircuitContext<PS>,
         auction_id_0: Uint8Array,
         bidder_0: Uint8Array,
         amount_0: bigint,
         salt_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  settle(context: __compactRuntime.CircuitContext<PS>, auction_id_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  refund(context: __compactRuntime.CircuitContext<PS>,
         auction_id_0: Uint8Array,
         user_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  auctions: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): Auction;
    [Symbol.iterator](): Iterator<[Uint8Array, Auction]>
  };
  bids: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): Uint8Array;
    [Symbol.iterator](): Iterator<[Uint8Array, Uint8Array]>
  };
  escrows: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): bigint;
    [Symbol.iterator](): Iterator<[Uint8Array, bigint]>
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
