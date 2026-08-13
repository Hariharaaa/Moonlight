import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getContractInstance } from '../services/contract';
import { useWalletContext } from '../context/WalletContext';
import { usePrivateState } from '../hooks/usePrivateState';
import { PrivacyBadge } from './PrivacyBadge';
import { PrivacyExplainer } from './PrivacyExplainer';
import { CountdownTimer } from './CountdownTimer';
import { EscrowStatus } from './EscrowStatus';
import { FeedbackPrompt } from './FeedbackPrompt';
import { Buffer } from 'buffer';

type ProofState = 'none' | 'proving' | 'bid' | 'reveal' | 'advance' | 'error';
type EscrowPhase = 'none' | 'locked' | 'pending_reveal' | 'settled' | 'refunded';

export const AuctionView: React.FC<{ auctionId: string }> = ({ auctionId }) => {
  const { api: walletApi, isConnected } = useWalletContext();
  const { bidAmount, setBidAmount, bidSalt, setBidSalt } = usePrivateState();

  const [contract, setContract] = useState<any>(null);
  
  // Auction State
  const [seller, setSeller] = useState<string>('');
  const [phase, setPhase] = useState<number>(0); // 0: Bid, 1: Reveal, 2: Settled, 3: Cancelled
  const [highestBid, setHighestBid] = useState<number>(0);
  const [highestBidder, setHighestBidder] = useState<string>('');
  const [bidCount, setBidCount] = useState<number>(0);
  
  // Escrow State
  const [escrowPhase, setEscrowPhase] = useState<EscrowPhase>('none');
  const [escrowBalance, setEscrowBalance] = useState<number>(0);
  const [lockAmount, setLockAmount] = useState<number | ''>('');
  
  const [hasBidThisSession, setHasBidThisSession] = useState(false);
  const [showFeedbackPrompt, setShowFeedbackPrompt] = useState(false);

  const deadlineMsRef = useRef<number | null>(null);
  const [deadlineMs, setDeadlineMs] = useState<number | null>(null);

  const [isBidding, setIsBidding] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);

  const [proofState, setProofState] = useState<ProofState>('none');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const getAuctionIdBytes = useCallback(() => {
    return new Uint8Array(Buffer.from(auctionId, 'hex'));
  }, [auctionId]);

  useEffect(() => {
    let isMounted = true;
    if (walletApi && isConnected) {
      getContractInstance(walletApi)
        .then(({ deployed }) => {
          if (!isMounted) return;
          setContract(deployed);
          refreshState(deployed);
          if (!deadlineMsRef.current) {
            const d = Date.now() + 10 * 60 * 1000;
            deadlineMsRef.current = d;
            setDeadlineMs(d);
          }
        })
        .catch(err => {
          if (!isMounted) return;
          console.error(err);
          setError(`Failed to bind contract: ${err}`);
        });
    }
    return () => { isMounted = false; };
  }, [walletApi, isConnected, auctionId]);

  const refreshState = useCallback(async (contractInstance?: any) => {
    const instance = contractInstance ?? contract;
    if (!instance) return;
    try {
      const state = await instance.queryState();
      
      const idBytes = getAuctionIdBytes();
      
      let auctionData: any = null;
      if (state.auctions && typeof state.auctions.entries === 'function') {
        for (const [key, value] of state.auctions.entries()) {
          if (Buffer.from(key).toString('hex') === auctionId) {
            auctionData = value;
            break;
          }
        }
      }

      if (auctionData) {
        setSeller(Buffer.from(auctionData.seller).toString('hex'));
        setPhase(Number(auctionData.phase));
        setHighestBid(Number(auctionData.highest_bid));
        setHighestBidder(Buffer.from(auctionData.highest_bidder).toString('hex'));
        setBidCount(Number(auctionData.bid_count));
      } else {
        // Mock fallback if query fails / missing
        setPhase(0);
      }

    } catch (err) {
      console.error('Error refreshing state:', err);
    }
  }, [contract, auctionId, getAuctionIdBytes]);

  const getBidderBytes = useCallback(async (): Promise<Uint8Array> => {
    if (!walletApi) throw new Error('Wallet not connected');
    const addr = await walletApi.getUnshieldedAddress();
    const encoder = new TextEncoder();
    const data = encoder.encode(addr.unshieldedAddress);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(hashBuffer);
  }, [walletApi]);

  const handleBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !lockAmount) return;

    setIsBidding(true);
    setError(null);
    setTxHash(null);
    setProofState('proving');

    try {
      const saltBytes = new Uint8Array(32);
      window.crypto.getRandomValues(saltBytes);
      const saltHex = Buffer.from(saltBytes).toString('hex');
      setBidSalt(saltHex);

      const bidderBytes = await getBidderBytes();
      const idBytes = getAuctionIdBytes();

      // ZK Prover asserts: amount <= lock_amount
      const tx = await contract.callTx.bid(
        idBytes, 
        bidderBytes, 
        BigInt(lockAmount), 
        BigInt(bidAmount), 
        saltBytes
      );
      
      setTxHash(typeof tx === 'string' ? tx : 'confirmed');
      await refreshState();

      setProofState('bid');
      setEscrowPhase('locked');
      setEscrowBalance(Number(lockAmount));
      setHasBidThisSession(true);
      setShowFeedbackPrompt(true);

      setTimeout(() => setProofState('none'), 8000);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Transaction failed.');
      setProofState('error');
      setTimeout(() => setProofState('none'), 5000);
    } finally {
      setIsBidding(false);
    }
  };

  const handleReveal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract) return;

    setIsRevealing(true);
    setError(null);
    setTxHash(null);
    setProofState('proving');

    try {
      const bidderBytes = await getBidderBytes();
      const saltBytes = new Uint8Array(Buffer.from(bidSalt, 'hex'));
      const idBytes = getAuctionIdBytes();

      const tx = await contract.callTx.reveal(idBytes, bidderBytes, BigInt(bidAmount), saltBytes);
      
      setTxHash(typeof tx === 'string' ? tx : 'confirmed');
      await refreshState();

      setProofState('reveal');
      setShowFeedbackPrompt(true);
      setTimeout(() => setProofState('none'), 8000);
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || '';
      if (msg.includes('not higher')) {
        setError('🔒 ZK Proof rejected locally — your bid is not higher than the current highest.');
      } else {
        setError(msg || 'Reveal failed.');
      }
      setProofState('error');
      setTimeout(() => setProofState('none'), 5000);
    } finally {
      setIsRevealing(false);
    }
  };

  const handleAdvance = async () => {
    if (!contract) return;
    setIsAdvancing(true);
    setError(null);
    setProofState('proving');
    try {
      await contract.callTx.advance_phase(getAuctionIdBytes());
      await refreshState();
      setProofState('advance');
      setTimeout(() => setProofState('none'), 5000);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to advance phase');
      setProofState('error');
      setTimeout(() => setProofState('none'), 5000);
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleCancel = async () => {
    if (!contract) return;
    setIsCancelling(true);
    try {
      const bidderBytes = await getBidderBytes();
      await contract.callTx.cancel_auction(getAuctionIdBytes(), bidderBytes);
      await refreshState();
    } catch (err: any) {
      setError(err?.message || 'Failed to cancel');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSettle = async () => {
    if (!contract) return;
    setIsSettling(true);
    try {
      await contract.callTx.settle(getAuctionIdBytes());
      await refreshState();
    } catch (err: any) {
      setError(err?.message || 'Failed to settle');
    } finally {
      setIsSettling(false);
    }
  };

  const handleRefund = async () => {
    if (!contract) return;
    setIsRefunding(true);
    try {
      const bidderBytes = await getBidderBytes();
      await contract.callTx.refund(getAuctionIdBytes(), bidderBytes);
      setEscrowBalance(0);
      setEscrowPhase('refunded');
      await refreshState();
    } catch (err: any) {
      setError(err?.message || 'Failed to refund');
    } finally {
      setIsRefunding(false);
    }
  };

  if (!contract) return <div className="spinner large" />;

  const phaseName = phase === 0 ? 'Bidding' : phase === 1 ? 'Reveal' : phase === 2 ? 'Settled' : 'Cancelled';
  const phaseEmoji = phase === 0 ? '🔒' : phase === 1 ? '🔓' : phase === 2 ? '🏆' : '❌';
  const isWinner = highestBidder && highestBidder !== '0'.repeat(64);

  return (
    <div className="panel counter-panel">
      <FeedbackPrompt show={showFeedbackPrompt} onDismiss={() => setShowFeedbackPrompt(false)} />

      {proofState === 'proving' && (
        <div className="proving-banner">
          <span className="spinner" />
          <span>Generating ZK Proof locally…</span>
        </div>
      )}
      {error && proofState !== 'proving' && (
        <div className="error-banner" role="alert"><strong>⚠ </strong>{error}</div>
      )}

      {(hasBidThisSession || escrowPhase !== 'none') && (
        <EscrowStatus phase={escrowPhase} bidAmount={escrowBalance} />
      )}

      <div className="state-display">
        <div className="state-item">
          <label>Auction ID</label>
          <div className="value" style={{fontSize:'1rem'}}>{auctionId.substring(0,16)}...</div>
        </div>
        <div className="state-item">
          <label>Auction Phase</label>
          <div className="value glow phase-value">{phaseEmoji} {phaseName}</div>
        </div>
        <div className="state-item">
          <label>🔒 Bids Received</label>
          <div className="value bid-count">{bidCount}</div>
        </div>
        {phase >= 1 && (
          <div className="state-item">
            <label>Highest Revealed Bid</label>
            <div className="value">{highestBid > 0 ? `${highestBid} tNIGHT` : '—'}</div>
          </div>
        )}
      </div>

      {phase < 2 && (
        <div className="advance-row">
          <button className="btn btn-outline" onClick={handleAdvance} disabled={isAdvancing}>
            {isAdvancing ? 'Advancing…' : `⏭ Advance to ${phase === 0 ? 'Reveal' : 'Closed'} Phase`}
          </button>
          {phase === 0 && bidCount === 0 && (
            <button className="btn btn-outline" style={{borderColor: 'var(--accent-red)', color: 'var(--accent-red)'}} onClick={handleCancel} disabled={isCancelling}>
              ❌ Cancel Auction
            </button>
          )}
          {phase === 1 && (
            <button className="btn btn-outline" onClick={handleSettle} disabled={isSettling}>
              🤝 Settle Auction
            </button>
          )}
        </div>
      )}

      {phase >= 2 && escrowBalance > 0 && (
        <div className="advance-row" style={{ marginTop: '1rem', padding: '1rem', border: '1px solid var(--accent-blue)', borderRadius: '12px' }}>
          <div>
            <strong>You have {escrowBalance} tNIGHT in escrow!</strong>
            <p style={{ margin: '0.5rem 0', color: 'var(--text-muted)' }}>The auction is over. Claim your unused escrow funds.</p>
          </div>
          <button className="btn btn-primary" onClick={handleRefund} disabled={isRefunding}>
            {isRefunding ? 'Refunding...' : '💰 Claim Refund'}
          </button>
        </div>
      )}

      <div className="actions-grid">
        {/* PHASE 0: BID */}
        <div className={`action-card ${phase !== 0 ? 'disabled' : 'active'}`}>
          <div className="card-phase-badge">{phase === 0 ? 'Active' : 'Locked'}</div>
          <h3>1. 🔒 Place Escrow-Backed Bid</h3>
          <p className="description">
            Your true bid is secret. You lock a public escrow amount (must be &ge; your bid) to mathematically guarantee settlement.
          </p>

          <form onSubmit={handleBid}>
            <div className="input-group">
              <label>True Bid Amount (Secret)</label>
              <input type="number" min="1" value={bidAmount || ''} onChange={e => setBidAmount(Number(e.target.value))} disabled={isBidding || phase !== 0} placeholder="e.g. 150" />
            </div>
            
            <div className="input-group">
              <label>Lock Escrow Amount (Public)</label>
              <input type="number" min="1" value={lockAmount} onChange={e => setLockAmount(Number(e.target.value))} disabled={isBidding || phase !== 0} placeholder="e.g. 200 (Round up for privacy)" />
            </div>

            <button type="submit" className="btn btn-primary full-width" disabled={isBidding || phase !== 0 || !bidAmount || !lockAmount}>
              {isBidding ? <><span className="spinner" /> Generating ZK Commitment…</> : '🔒 Place Sealed Bid'}
            </button>
          </form>
        </div>

        {/* PHASE 1: REVEAL */}
        <div className={`action-card ${phase !== 1 ? 'disabled' : 'active'}`}>
          <div className="card-phase-badge">{phase === 1 ? 'Active' : phase === 0 ? 'Waiting' : 'Done'}</div>
          <h3>2. 🔓 Reveal Bid</h3>
          <p className="description">
            Prove your secret bid is higher than the current highest bid. Losing bids are rejected locally and stay perfectly secret.
          </p>

          <form onSubmit={handleReveal}>
            <div className="input-group">
              <label>Your Saved Secret Bid</label>
              <input type="number" value={bidAmount || ''} disabled readOnly />
            </div>

            <button type="submit" className="btn btn-outline full-width" disabled={isRevealing || phase !== 1 || !bidSalt}>
              {isRevealing ? <><span className="spinner" /> Generating Reveal Proof…</> : '🔓 Reveal My Bid'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
