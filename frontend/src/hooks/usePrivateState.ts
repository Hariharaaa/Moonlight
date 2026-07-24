import { useState } from 'react';

// The private state identifier used to securely isolate private values in local IndexedDB.
export const PRIVATE_STATE_ID = 'counterPrivateState';

/**
 * Custom hook to manage private inputs. 
 *
 * Midnight Privacy Model Note:
 * This data is ONLY stored locally on the user's device. When a circuit is 
 * executed, these private values are supplied to the prover running locally 
 * in the browser. The ZK proof is generated, and ONLY the proof (along with 
 * any explicitly disclosed public outputs) is sent to the network. 
 * 
 * The private inputs themselves never leave the user's machine.
 */
export function usePrivateState() {
  const [secretIncrement, setSecretIncrement] = useState<number>(1);
  const [secretResetKey, setSecretResetKey] = useState<number>(0);

  return {
    secretIncrement,
    setSecretIncrement,
    secretResetKey,
    setSecretResetKey
  };
}
