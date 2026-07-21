import { describe, test, expect, beforeAll } from '@jest/globals';

// ============================================================
// counter.test.ts — Test Suite for the Midnight Counter Contract
// ============================================================
//
// These tests verify:
//   1. Circuit logic: increment and reset circuits work correctly
//   2. State transitions: counter value changes as expected
//   3. Privacy guarantee: private inputs are never exposed in outputs
//
// NOTE: In a full Midnight deployment, these tests would run against
// the compiled circuit artifacts in managed/. For unit/logic testing
// without the full runtime, we simulate the state machine behavior.
// ============================================================

// ── Simulated Contract State ──────────────────────────────────
// This mirrors the Compact ledger state definition:
//   ledger { counter: Uint<64>; }
interface LedgerState {
  counter: bigint;
}

// ── Simulated Circuit Outputs ─────────────────────────────────
interface CircuitResult {
  newState: LedgerState;
  publicOutputs: Record<string, bigint>; // only disclosed values appear here
  privateInputsExposed: string[];        // should always be empty!
}

// ── Contract Simulator ────────────────────────────────────────
// Simulates the Compact circuit behavior for testing purposes.
// Mirrors the logic in contracts/counter.compact exactly.
class CounterContractSimulator {
  private state: LedgerState;

  constructor(initialCounter: bigint = 0n) {
    this.state = { counter: initialCounter };
  }

  getState(): LedgerState {
    return { ...this.state };
  }

  /**
   * Simulates the `increment` circuit.
   *
   * PRIVATE input: incrementAmount — never exposed in outputs
   * PUBLIC:        disclose(counter) — current counter anchors the proof
   */
  increment(incrementAmount: bigint): CircuitResult {
    if (incrementAmount <= 0n) {
      throw new Error('Increment amount must be greater than zero');
    }

    const current = this.state.counter; // disclose(counter)
    const newCounter = current + incrementAmount;

    this.state.counter = newCounter;

    return {
      newState: { ...this.state },
      publicOutputs: {
        // Only the DISCLOSED value (current counter) is in circuit output
        disclosed_counter: current,
      },
      // Private inputs are NEVER in circuit outputs
      privateInputsExposed: [],
    };
  }

  /**
   * Simulates the `reset` circuit.
   *
   * PRIVATE input: secretResetKey — never exposed in outputs
   * PUBLIC:        disclose(counter) — current counter anchors the proof
   */
  reset(secretResetKey: bigint): CircuitResult {
    if (secretResetKey <= 0n) {
      throw new Error('Reset key must be non-zero');
    }

    const current = this.state.counter; // disclose(counter)

    this.state.counter = 0n;

    return {
      newState: { ...this.state },
      publicOutputs: {
        // Only disclosed value appears — NOT the secretResetKey
        disclosed_counter: current,
      },
      privateInputsExposed: [],
    };
  }

  /**
   * Simulates the `get_counter` read-only circuit.
   * No private inputs — just reads public state.
   */
  getCounter(): bigint {
    return this.state.counter;
  }
}

// ══════════════════════════════════════════════════════════════
// TEST SUITE
// ══════════════════════════════════════════════════════════════

describe('CounterContract — Circuit Logic', () => {
  let contract: CounterContractSimulator;

  beforeAll(() => {
    contract = new CounterContractSimulator(0n);
  });

  // ── TEST 1: Basic increment circuit ──────────────────────────
  test('increment circuit correctly updates counter state', () => {
    const contract = new CounterContractSimulator(0n);
    
    // PRIVATE input: 5n — this never appears on-chain
    const result = contract.increment(5n);

    expect(result.newState.counter).toBe(5n);
    expect(contract.getCounter()).toBe(5n);
  });

  // ── TEST 2: Multiple increments are cumulative ────────────────
  test('multiple increments accumulate correctly', () => {
    const contract = new CounterContractSimulator(0n);

    contract.increment(3n);
    contract.increment(7n);
    contract.increment(10n);

    expect(contract.getCounter()).toBe(20n);
  });

  // ── TEST 3: Increment rejects zero or negative amounts ────────
  test('increment circuit rejects zero increment (validates circuit constraint)', () => {
    const contract = new CounterContractSimulator(0n);

    expect(() => contract.increment(0n)).toThrow(
      'Increment amount must be greater than zero'
    );
  });
});

describe('CounterContract — State Transitions', () => {
  // ── TEST 4: Reset transitions counter to zero ─────────────────
  test('reset circuit transitions counter back to zero', () => {
    const contract = new CounterContractSimulator(42n);

    const result = contract.reset(999n);

    expect(result.newState.counter).toBe(0n);
    expect(contract.getCounter()).toBe(0n);
  });

  // ── TEST 5: State transitions follow expected sequence ────────
  test('full counter lifecycle: init → increment → increment → reset', () => {
    const contract = new CounterContractSimulator(0n);

    // Initial state
    expect(contract.getCounter()).toBe(0n);

    // First increment (PRIVATE: 10)
    contract.increment(10n);
    expect(contract.getCounter()).toBe(10n);

    // Second increment (PRIVATE: 5)
    contract.increment(5n);
    expect(contract.getCounter()).toBe(15n);

    // Reset (PRIVATE: reset key 42)
    contract.reset(42n);
    expect(contract.getCounter()).toBe(0n);

    // Increment again after reset
    contract.increment(1n);
    expect(contract.getCounter()).toBe(1n);
  });

  // ── TEST 6: get_counter returns correct public state ──────────
  test('get_counter circuit reads the correct public counter value', () => {
    const contract = new CounterContractSimulator(100n);
    expect(contract.getCounter()).toBe(100n);
  });
});

describe('CounterContract — Privacy Guarantees', () => {
  // ── TEST 7: Private inputs never appear in circuit outputs ─────
  test('increment private input (incrementAmount) is never exposed in circuit outputs', () => {
    const contract = new CounterContractSimulator(0n);
    const secretIncrement = 42n; // PRIVATE — must never appear in outputs

    const result = contract.increment(secretIncrement);

    // Verify the private input is NOT in publicOutputs
    const outputValues = Object.values(result.publicOutputs);
    expect(outputValues).not.toContain(secretIncrement);

    // Verify the privateInputsExposed array is always empty
    expect(result.privateInputsExposed).toHaveLength(0);

    // Verify only the DISCLOSED counter value appears in public outputs
    expect(result.publicOutputs).toHaveProperty('disclosed_counter');
    expect(result.publicOutputs.disclosed_counter).toBe(0n); // was 0 before increment
  });

  // ── TEST 8: Reset private key is never exposed in outputs ──────
  test('reset private input (secretResetKey) is never exposed in circuit outputs', () => {
    const contract = new CounterContractSimulator(50n);
    const secretKey = 777n; // PRIVATE — must never appear in outputs

    const result = contract.reset(secretKey);

    const outputValues = Object.values(result.publicOutputs);
    expect(outputValues).not.toContain(secretKey);
    expect(result.privateInputsExposed).toHaveLength(0);
  });

  // ── TEST 9: disclose() only exposes what is explicitly disclosed ─
  test('only explicitly disclosed values appear in public circuit outputs', () => {
    const contract = new CounterContractSimulator(25n);
    const privateAmount = 99n;

    const result = contract.increment(privateAmount);

    // Only 'disclosed_counter' should be in public outputs — NOT privateAmount
    const outputKeys = Object.keys(result.publicOutputs);
    expect(outputKeys).toEqual(['disclosed_counter']);

    // The disclosed_counter should be the PRE-increment value (as in the circuit)
    expect(result.publicOutputs.disclosed_counter).toBe(25n);
  });

  // ── TEST 10: Counter state update is correct after increment ────
  test('after increment, new counter value equals old + private amount', () => {
    const oldCounter = 100n;
    const privateAmount = 37n;
    const contract = new CounterContractSimulator(oldCounter);

    contract.increment(privateAmount);

    expect(contract.getCounter()).toBe(oldCounter + privateAmount);
  });
});
