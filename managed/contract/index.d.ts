import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
}

export type ImpureCircuits<PS> = {
  bid(context: __compactRuntime.CircuitContext<PS>,
      bidder_0: Uint8Array,
      amount_0: bigint,
      salt_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  advance_phase(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  reveal(context: __compactRuntime.CircuitContext<PS>,
         bidder_0: Uint8Array,
         amount_0: bigint,
         salt_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  bid(context: __compactRuntime.CircuitContext<PS>,
      bidder_0: Uint8Array,
      amount_0: bigint,
      salt_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  advance_phase(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  reveal(context: __compactRuntime.CircuitContext<PS>,
         bidder_0: Uint8Array,
         amount_0: bigint,
         salt_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  bid(context: __compactRuntime.CircuitContext<PS>,
      bidder_0: Uint8Array,
      amount_0: bigint,
      salt_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  advance_phase(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  reveal(context: __compactRuntime.CircuitContext<PS>,
         bidder_0: Uint8Array,
         amount_0: bigint,
         salt_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  bids: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): Uint8Array;
    [Symbol.iterator](): Iterator<[Uint8Array, Uint8Array]>
  };
  readonly highest_bid: bigint;
  readonly highest_bidder: Uint8Array;
  readonly phase: bigint;
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
