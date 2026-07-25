import React, { useState, useEffect, useCallback } from 'react';
import { getContractInstance } from '../services/contract';
import { useWallet } from '../hooks/useWallet';
import { usePrivateState } from '../hooks/usePrivateState';
import { PrivacyBadge } from './PrivacyBadge';

export const AuctionPanel: React.FC = () => {
  const { api: walletApi, isConnected } = useWallet();
  const { bidAmount, setBidAmount, bidSalt, setBidSalt } = usePrivateState();
  
  const [contract, setContract] = useState<any>(null);
  
  const [phase, setPhase] = useState<number>(0);
  const [highestBid, setHighestBid] = useState<number>(0);
  const [highestBidder, setHighestBidder] = useState<string>('');
  
  const [isBidding, setIsBidding] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  
  const [proofState, setProofState] = useState<'none' | 'bid' | 'reveal' | 'advance'>('none');
  const [error, setError] = useState<string | null>(null);

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
    return () => { isMounted = false; };
  }, [walletApi, isConnected]);

  const refreshState = useCallback(async (contractInstance = contract) => {
    if (!contractInstance) return;
    try {
      const state = await contractInstance.queryState();
      setPhase(Number(state.phase));
      setHighestBid(Number(state.highest_bid));
      // Bytes<32> comes back as Uint8Array
      const bidderArray = state.highest_bidder;
      setHighestBidder(Buffer.from(bidderArray).toString('hex'));
    } catch (err) {
      console.error("Error refreshing state:", err);
    }
  }, [contract]);

  // Helper to get exactly 32 bytes for the user
  const getBidderBytes = useCallback(async (): Promise<Uint8Array> => {
    if (!walletApi) throw new Error("Wallet not connected");
    const addr = await walletApi.getUnshieldedAddress();
    const encoder = new TextEncoder();
    const data = encoder.encode(addr.unshieldedAddress);
    // Hash to exactly 32 bytes
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(hashBuffer);
  }, [walletApi]);

  const handleBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract) return;
    
    setIsBidding(true);
    setError(null);
    setProofState('none');
    
    try {
      const saltBytes = new Uint8Array(32);
      window.crypto.getRandomValues(saltBytes);
      const saltHex = Buffer.from(saltBytes).toString('hex');
      setBidSalt(saltHex);

      const bidderBytes = await getBidderBytes();

      // bid(bidder: Bytes<32>, amount: Uint<64>, salt: Bytes<32>)
      await contract.callTx.bid(bidderBytes, BigInt(bidAmount), saltBytes);
      await refreshState();
      
      setProofState('bid');
      setTimeout(() => setProofState('none'), 5000);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Transaction failed');
    } finally {
      setIsBidding(false);
    }
  };

  const handleReveal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract) return;
    
    setIsRevealing(true);
    setError(null);
    setProofState('none');
    
    try {
      const bidderBytes = await getBidderBytes();
      const saltBytes = new Uint8Array(Buffer.from(bidSalt, 'hex'));

      await contract.callTx.reveal(bidderBytes, BigInt(bidAmount), saltBytes);
      await refreshState();
      
      setProofState('reveal');
      setTimeout(() => setProofState('none'), 5000);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Reveal failed: Bid not high enough, or invalid local salt.');
    } finally {
      setIsRevealing(false);
    }
  };

  const handleAdvance = async () => {
    if (!contract) return;
    setIsAdvancing(true);
    setError(null);
    setProofState('none');
    try {
      await contract.callTx.advance_phase();
      await refreshState();
      setProofState('advance');
      setTimeout(() => setProofState('none'), 5000);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to advance phase');
    } finally {
      setIsAdvancing(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="panel empty-state">
        <div className="moon-icon">🌕</div>
        <h2>Connect Wallet to Begin</h2>
        <p>You need to connect Lace wallet to interact with the Sealed-Bid Auction.</p>
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

  const phaseName = phase === 0 ? "Bidding" : phase === 1 ? "Reveal" : "Closed";

  return (
    <div className="panel counter-panel">
      {error && <div className="error-banner">{error}</div>}
      
      <div className="state-display">
        <div className="state-item">
          <label>Auction Phase</label>
          <div className="value glow">{phaseName}</div>
        </div>
        <div className="state-item sub">
          <label>Highest Bid (Revealed)</label>
          <div className="value">{highestBid}</div>
          {highestBidder && highestBidder !== '0000000000000000000000000000000000000000000000000000000000000000' && (
            <div style={{fontSize: '0.8rem', opacity: 0.7}}>Winner ID: {highestBidder.substring(0, 10)}...</div>
          )}
        </div>
      </div>
      
      {phase < 2 && (
        <div style={{textAlign: 'center', marginBottom: '20px'}}>
          <button 
            className="btn btn-outline" 
            onClick={handleAdvance} 
            disabled={isAdvancing}
          >
            {isAdvancing ? 'Advancing...' : `Simulate Time: Advance to Next Phase`}
          </button>
        </div>
      )}

      <div className="actions-grid">
        {/* Phase 0: Bid */}
        <div className={`action-card ${phase !== 0 ? 'disabled' : ''}`}>
          <h3>1. Place Sealed Bid</h3>
          <p className="description">Submit a cryptographic commitment to your bid amount. The amount stays entirely on your local machine.</p>
          
          <form onSubmit={handleBid}>
            <div className="input-group">
              <label>Bid Amount</label>
              <input 
                type="number" 
                min="1" 
                value={bidAmount || ''} 
                onChange={e => setBidAmount(Number(e.target.value))}
                disabled={isBidding || phase !== 0}
                placeholder="Enter amount"
              />
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary full-width" 
              disabled={isBidding || phase !== 0 || !bidAmount}
            >
              {isBidding ? 'Generating ZK Commitment...' : 'Place Sealed Bid'}
            </button>
          </form>
          
          <PrivacyBadge 
            show={proofState === 'bid'} 
            type="proof" 
            message="Bid Commitment Stored!" 
            details="Your bid amount and a locally generated salt were hashed. Only the hash was stored on the blockchain." 
          />
        </div>

        {/* Phase 1: Reveal */}
        <div className={`action-card ${phase !== 1 ? 'disabled' : ''}`}>
          <h3>2. Reveal Bid</h3>
          <p className="description">Attempt to reveal your bid. If it's a losing bid, the zero-knowledge proof will fail locally to protect your secret.</p>
          
          <form onSubmit={handleReveal}>
            <div className="input-group">
              <label>Saved Amount</label>
              <input 
                type="number" 
                value={bidAmount || ''} 
                disabled={true}
              />
              <small>Retrieved from local storage</small>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-outline full-width" 
              disabled={isRevealing || phase !== 1}
            >
              {isRevealing ? 'Generating Reveal Proof...' : 'Reveal Bid'}
            </button>
          </form>

          <PrivacyBadge 
            show={proofState === 'reveal'} 
            type="authorization" 
            message="Bid Revealed Successfully!" 
            details="Your bid was verified against your earlier commitment AND proven to be higher than the current highest bid." 
          />
        </div>
      </div>
    </div>
  );
};
