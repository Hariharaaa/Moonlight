import React, { useState, useEffect, useCallback } from 'react';
import { getContractInstance } from '../services/contract';
import { useWalletContext } from '../context/WalletContext';
import { usePrivateState } from '../hooks/usePrivateState';
import { PrivacyBadge } from './PrivacyBadge';
import { PrivacyExplainer } from './PrivacyExplainer';
import { CountdownTimer } from './CountdownTimer';
import { Buffer } from 'buffer';

type ProofState = 'none' | 'proving' | 'bid' | 'reveal' | 'advance' | 'error';

export const AuctionPanel: React.FC = () => {
  // ── BUG FIX: use shared context, not independent hook ──────────
  const { api: walletApi, isConnected } = useWalletContext();
  const { bidAmount, setBidAmount, bidSalt, setBidSalt } = usePrivateState();

  const [contract, setContract] = useState<any>(null);
  const [phase, setPhase] = useState<number>(0);
  const [highestBid, setHighestBid] = useState<number>(0);
  const [highestBidder, setHighestBidder] = useState<string>('');
  const [bidCount, setBidCount] = useState<number>(0);

  // Deadline: 10 minutes from now when component first loads with a contract
  const [deadlineMs, setDeadlineMs] = useState<number | null>(null);

  const [isBidding, setIsBidding] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);

  const [proofState, setProofState] = useState<ProofState>('none');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  // ── Connect to Contract ────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    if (walletApi && isConnected) {
      getContractInstance(walletApi)
        .then(({ deployed }) => {
          if (isMounted) {
            setContract(deployed);
            refreshState(deployed);
            // Set a 10-minute auction deadline from the moment contract is loaded
            if (!deadlineMs) setDeadlineMs(Date.now() + 10 * 60 * 1000);
          }
        })
        .catch(err => {
          console.error('Failed to bind contract:', err);
          if (isMounted) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            setError(`Failed to bind contract: ${errorMsg}. Check network config and console logs.`);
          }
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
      // state is the decoded ledger() object from the compiled contract.
      // phase, highest_bid, highest_bidder are BigInt-like values.
      setPhase(Number(state.phase));
      setHighestBid(Number(state.highest_bid));
      // highest_bidder is Bytes<32> — comes back as Uint8Array
      const bidderArray = state.highest_bidder;
      if (bidderArray) {
        setHighestBidder(Buffer.from(bidderArray).toString('hex'));
      }
      // bids is a Map-like object; .size() is a method in the ledger decoder
      try {
        const sz = typeof state.bids?.size === 'function'
          ? state.bids.size()
          : (typeof state.bids?.size === 'number' ? state.bids.size : 0);
        setBidCount(Number(sz));
      } catch { /* size not available */ }
    } catch (err) {
      console.error('Error refreshing state:', err);
    }
  }, [contract]);

  // Poll for state updates every 15s when connected
  useEffect(() => {
    if (!contract) return;
    const interval = setInterval(() => refreshState(), 15000);
    return () => clearInterval(interval);
  }, [contract, refreshState]);

  const getBidderBytes = useCallback(async (): Promise<Uint8Array> => {
    if (!walletApi) throw new Error('Wallet not connected');
    const addr = await walletApi.getUnshieldedAddress();
    const encoder = new TextEncoder();
    const data = encoder.encode(addr.unshieldedAddress);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(hashBuffer);
  }, [walletApi]);

  // ── Bid ───────────────────────────────────────────────────────
  const handleBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract) return;

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

      // 🔒 The amount and salt are private witnesses — never sent to network
      const tx = await contract.callTx.bid(bidderBytes, BigInt(bidAmount), saltBytes);
      setTxHash(typeof tx === 'string' ? tx : 'confirmed');
      await refreshState();

      setProofState('bid');
      setTimeout(() => setProofState('none'), 8000);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Transaction failed. See console for details.');
      setProofState('error');
      setTimeout(() => setProofState('none'), 5000);
    } finally {
      setIsBidding(false);
    }
  };

  // ── Reveal ────────────────────────────────────────────────────
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

      const tx = await contract.callTx.reveal(bidderBytes, BigInt(bidAmount), saltBytes);
      setTxHash(typeof tx === 'string' ? tx : 'confirmed');
      await refreshState();

      setProofState('reveal');
      setTimeout(() => setProofState('none'), 8000);
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || '';
      if (msg.includes('not higher')) {
        setError('🔒 ZK Proof rejected locally — your bid is not higher than the current highest. Your bid amount is mathematically protected and was never sent to the network.');
      } else if (msg.includes('Invalid bid')) {
        setError('Commitment mismatch. Did you place your bid in this session? Your saved amount and salt must match your original bid.');
      } else {
        setError(msg || 'Reveal failed. See console for details.');
      }
      setProofState('error');
      setTimeout(() => setProofState('none'), 5000);
    } finally {
      setIsRevealing(false);
    }
  };

  // ── Advance Phase ─────────────────────────────────────────────
  const handleAdvance = async () => {
    if (!contract) return;
    setIsAdvancing(true);
    setError(null);
    setProofState('proving');
    try {
      await contract.callTx.advance_phase();
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

  // ── Empty states ───────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="panel empty-state">
        <div className="moon-icon">🌕</div>
        <h2>Connect Wallet to Begin</h2>
        <p>Connect your Lace browser wallet to interact with the Sealed-Bid Auction on the Midnight Network.</p>
        <div className="privacy-explainer-hint">
          <PrivacyExplainer />
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="panel empty-state">
        <div className="spinner large"></div>
        <h2>Loading Contract...</h2>
        {error ? (
          <p className="error-text">{error}</p>
        ) : (
          <p>Binding to the Midnight Network. This may take a few moments…</p>
        )}
      </div>
    );
  }

  const phaseName = phase === 0 ? 'Bidding' : phase === 1 ? 'Reveal' : 'Closed';
  const phaseEmoji = phase === 0 ? '🔒' : phase === 1 ? '🔓' : '🏆';
  const isWinner = highestBidder && highestBidder !== '0'.repeat(64);

  return (
    <div className="panel counter-panel">
      {/* ── Error / Proof feedback ───────────────────────────── */}
      {proofState === 'proving' && (
        <div className="proving-banner">
          <span className="spinner"></span>
          <span>Generating Zero-Knowledge Proof locally… your private data never leaves your browser.</span>
        </div>
      )}
      {error && proofState !== 'proving' && (
        <div className="error-banner">
          <strong>⚠ </strong>{error}
        </div>
      )}

      {/* ── Auction status bar ───────────────────────────────── */}
      <div className="state-display">
        <div className="state-item">
          <label>Auction Phase</label>
          <div className="value glow phase-value">{phaseEmoji} {phaseName}</div>
        </div>
        <div className="state-item">
          <label>🔒 Bids Received (Public)</label>
          <div className="value bid-count">{bidCount}</div>
          <small className="hint">Count is public; amounts are private</small>
        </div>
        {phase >= 1 && (
          <div className="state-item">
            <label>Highest Revealed Bid</label>
            <div className="value">{highestBid > 0 ? `${highestBid} tNIGHT` : '—'}</div>
            {isWinner && (
              <div className="winner-id">
                🏆 Winner: {highestBidder.substring(0, 8)}…
              </div>
            )}
          </div>
        )}
        {deadlineMs && phase < 2 && (
          <div className="state-item">
            <label>⏱ Time Remaining</label>
            <CountdownTimer deadlineMs={deadlineMs} phase={phase} />
          </div>
        )}
      </div>

      {/* ── Advance phase button (demo helper) ──────────────── */}
      {phase < 2 && (
        <div className="advance-row">
          <button
            className="btn btn-outline"
            onClick={handleAdvance}
            disabled={isAdvancing}
          >
            {isAdvancing ? 'Advancing…' : `⏭ Advance to ${phase === 0 ? 'Reveal' : 'Closed'} Phase`}
          </button>
          <span className="advance-hint">Demo helper — simulates time passing</span>
        </div>
      )}

      {/* ── Privacy explainer toggle ─────────────────────────── */}
      <PrivacyExplainer />

      {/* ── Action cards ─────────────────────────────────────── */}
      <div className="actions-grid">
        {/* PHASE 0: BID */}
        <div className={`action-card ${phase !== 0 ? 'disabled' : 'active'}`}>
          <div className="card-phase-badge">{phase === 0 ? 'Active' : 'Locked'}</div>
          <h3>1. 🔒 Place Sealed Bid</h3>
          <p className="description">
            Submit a cryptographic commitment to your bid. Your actual amount and a random salt are hashed together — only the hash is stored on-chain. Your amount never leaves your device.
          </p>

          <form onSubmit={handleBid}>
            <div className="input-group">
              <label htmlFor="bid-amount">Bid Amount (tNIGHT)</label>
              <input
                id="bid-amount"
                type="number"
                min="1"
                value={bidAmount || ''}
                onChange={e => setBidAmount(Number(e.target.value))}
                disabled={isBidding || phase !== 0}
                placeholder="e.g. 150"
              />
              <small className="input-hint">🔒 This value stays on your device — never sent to the network</small>
            </div>

            <button
              type="submit"
              id="place-bid-btn"
              className="btn btn-primary full-width"
              disabled={isBidding || phase !== 0 || !bidAmount}
            >
              {isBidding ? (
                <><span className="spinner"></span> Generating ZK Commitment…</>
              ) : '🔒 Place Sealed Bid'}
            </button>
          </form>

          <PrivacyBadge
            show={proofState === 'bid'}
            type="proof"
            message="🔒 Proof Verified — Bid Commitment Stored!"
            details="Your bid amount and a cryptographically secure random salt were hashed together using SHA-256. Only the resulting hash was submitted to the Midnight blockchain. The actual amount and salt remain exclusively on your device."
            txHash={txHash}
          />
        </div>

        {/* PHASE 1: REVEAL */}
        <div className={`action-card ${phase !== 1 ? 'disabled' : 'active'}`}>
          <div className="card-phase-badge">{phase === 1 ? 'Active' : phase === 0 ? 'Waiting' : 'Done'}</div>
          <h3>2. 🔓 Reveal Bid</h3>
          <p className="description">
            After the bidding deadline, reveal your bid to compete for the win. A ZK proof is generated locally — <strong>if your bid is not the highest, the proof generation fails and your amount is never sent to the network.</strong>
          </p>

          <form onSubmit={handleReveal}>
            <div className="input-group">
              <label>Your Saved Bid Amount</label>
              <input
                type="number"
                value={bidAmount || ''}
                disabled={true}
                readOnly
              />
              <small className="input-hint">Retrieved from local storage — {bidSalt ? '🔐 Salt saved' : '⚠ No salt found'}</small>
            </div>

            <button
              type="submit"
              id="reveal-bid-btn"
              className="btn btn-outline full-width"
              disabled={isRevealing || phase !== 1 || !bidSalt}
            >
              {isRevealing ? (
                <><span className="spinner"></span> Generating Reveal Proof…</>
              ) : '🔓 Reveal My Bid'}
            </button>
          </form>

          <PrivacyBadge
            show={proofState === 'reveal'}
            type="authorization"
            message="🏆 Bid Revealed — You're the Highest Bidder!"
            details="Two things were proven simultaneously: (1) Your revealed amount matches your original commitment — proving you didn't change your bid. (2) Your amount is strictly higher than the previous highest bid — proving you deserve to win. All losing bids remain mathematically secret."
            txHash={txHash}
          />
        </div>
      </div>

      {/* ── Settlement result ─────────────────────────────────── */}
      {phase === 2 && (
        <div className="settlement-banner">
          <div className="settlement-winner">
            <div className="winner-crown">🏆</div>
            <h3>Auction Settled</h3>
            {isWinner ? (
              <>
                <div className="winner-amount">{highestBid} tNIGHT</div>
                <div className="winner-address">Winner ID: {highestBidder.substring(0, 16)}…</div>
              </>
            ) : (
              <p>No bids were revealed.</p>
            )}
          </div>
          <div className="privacy-guarantee">
            🔒 All losing bid amounts remain <strong>mathematically secret forever</strong>. They were never broadcast to the network.
          </div>
        </div>
      )}
    </div>
  );
};
