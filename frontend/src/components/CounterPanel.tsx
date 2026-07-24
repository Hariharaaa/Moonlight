import React, { useState, useEffect, useCallback } from 'react';
import { getContractInstance } from '../services/contract';
import { useWallet } from '../hooks/useWallet';
import { usePrivateState } from '../hooks/usePrivateState';
import { PrivacyBadge } from './PrivacyBadge';

export const CounterPanel: React.FC = () => {
  const { api: walletApi, isConnected } = useWallet();
  const { secretIncrement, setSecretIncrement, secretResetKey, setSecretResetKey } = usePrivateState();
  
  const [contract, setContract] = useState<any>(null);
  
  const [counterValue, setCounterValue] = useState<number>(0);
  const [numIncrements, setNumIncrements] = useState<number>(0);
  
  const [isIncrementing, setIsIncrementing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  
  const [proofState, setProofState] = useState<'none' | 'increment' | 'reset'>('none');
  const [error, setError] = useState<string | null>(null);

  // Initialize contract when wallet connects
  useEffect(() => {
    let isMounted = true;
    
    if (walletApi && isConnected) {
      getContractInstance(walletApi)
        .then(({ deployed }) => {
          if (isMounted) {
            setContract(deployed);
            refreshState(deployed);
          }
        })
        .catch(err => {
          console.error("Failed to bind contract:", err);
          if (isMounted) setError("Failed to bind contract. Please check network and address.");
        });
    } else {
      setContract(null);
    }
    
    return () => {
      isMounted = false;
    };
  }, [walletApi, isConnected]);

  const refreshState = useCallback(async (contractInstance = contract) => {
    if (!contractInstance) return;
    try {
      const state = await contractInstance.queryState();
      setCounterValue(Number(state.counter));
      setNumIncrements(Number(state.num_increments));
    } catch (err) {
      console.error("Error refreshing state:", err);
    }
  }, [contract]);

  const handlePrivateIncrement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract) return;
    
    setIsIncrementing(true);
    setError(null);
    setProofState('none');
    
    try {
      // callTx.increment_by takes the private amount as the first argument.
      // This amount NEVER leaves the browser. The ZK proof is generated locally.
      await contract.callTx.increment_by(BigInt(secretIncrement));
      await refreshState();
      
      setProofState('increment');
      setSecretIncrement(1); // Reset the field so the value isn't hovering there
      
      // Clear proof badge after 5s
      setTimeout(() => setProofState('none'), 5000);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Transaction failed');
    } finally {
      setIsIncrementing(false);
    }
  };

  const handleSecretReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract) return;
    
    setIsResetting(true);
    setError(null);
    setProofState('none');
    
    try {
      // callTx.reset takes the private key as argument.
      await contract.callTx.reset(BigInt(secretResetKey));
      await refreshState();
      
      setProofState('reset');
      setSecretResetKey(0); // Clear the secret key
      
      setTimeout(() => setProofState('none'), 5000);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Reset failed (check your key)');
    } finally {
      setIsResetting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="panel empty-state">
        <div className="moon-icon">🌕</div>
        <h2>Connect Wallet to Begin</h2>
        <p>You need to connect Lace wallet to interact with the FullMoon counter.</p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="panel empty-state">
        <div className="spinner large"></div>
        <h2>Loading Contract...</h2>
        <p>Binding to the Midnight Network.</p>
      </div>
    );
  }

  return (
    <div className="panel counter-panel">
      {error && <div className="error-banner">{error}</div>}
      
      <div className="state-display">
        <div className="state-item">
          <label>Public Counter Value</label>
          <div className="value glow">{counterValue}</div>
        </div>
        <div className="state-item sub">
          <label>Total Operations</label>
          <div className="value">{numIncrements}</div>
        </div>
      </div>

      <div className="actions-grid">
        {/* Private Increment Demo */}
        <div className="action-card">
          <h3>Private Increment</h3>
          <p className="description">Increment the counter without revealing the amount on-chain.</p>
          
          <form onSubmit={handlePrivateIncrement}>
            <div className="input-group">
              <label>Amount (Secret Witness)</label>
              <input 
                type="number" 
                min="1" 
                value={secretIncrement} 
                onChange={e => setSecretIncrement(Number(e.target.value))}
                disabled={isIncrementing}
              />
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary full-width" 
              disabled={isIncrementing}
            >
              {isIncrementing ? 'Generating ZK Proof...' : 'Submit Secret Increment'}
            </button>
          </form>
          
          <PrivacyBadge 
            show={proofState === 'increment'} 
            type="proof" 
            message="Private Proof Verified!" 
            details="A Zero-Knowledge proof was generated locally and verified on-chain. It proves that the counter advanced by a valid amount (≥ 1). The actual amount you entered remains hidden and was never sent to the network." 
          />
        </div>

        {/* Secret Reset Demo */}
        <div className="action-card">
          <h3>Authorized Reset</h3>
          <p className="description">Reset the counter to zero using a secret key.</p>
          
          <form onSubmit={handleSecretReset}>
            <div className="input-group">
              <label>Authorization Key (Secret)</label>
              <input 
                type="password" 
                value={secretResetKey || ''} 
                onChange={e => setSecretResetKey(Number(e.target.value))}
                placeholder="Enter non-zero key"
                disabled={isResetting}
              />
            </div>
            
            <button 
              type="submit" 
              className="btn btn-outline full-width" 
              disabled={isResetting}
            >
              {isResetting ? 'Verifying Authorization...' : 'Reset Counter'}
            </button>
          </form>

          <PrivacyBadge 
            show={proofState === 'reset'} 
            type="authorization" 
            message="Authorization Validated!" 
            details="You proved knowledge of a valid, non-zero reset key. The key was verified via a ZK proof without being revealed or stored on the blockchain." 
          />
        </div>
      </div>
    </div>
  );
};
