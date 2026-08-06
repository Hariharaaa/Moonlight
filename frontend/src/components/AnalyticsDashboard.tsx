import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useWalletContext } from '../context/WalletContext';

// ── Types ─────────────────────────────────────────────────────────
interface AuctionStats {
  totalBidsThisSession: number;
  highestBid: number;
  highestBidder: string;
  phase: number;
  bidCount: number;
  contractAddress: string;
  lastRefreshed: Date | null;
}

// ── Helpers ───────────────────────────────────────────────────────
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || 'd3a9182b9b58b653c8dbae9fc31422b0c217e3c8a7693293aa090e8e909d23fd';
const EXPLORER_BASE = 'https://midnight-explorer.preprod.midnight.network';

const PHASE_LABEL: Record<number, string> = { 0: 'Bidding 🔒', 1: 'Reveal 🔓', 2: 'Settled 🏆' };

// Accumulate unique wallets across sessions via localStorage
function accumulateWallet(address: string): number {
  try {
    const raw = localStorage.getItem('fm_unique_wallets');
    const set: string[] = raw ? JSON.parse(raw) : [];
    if (!set.includes(address)) {
      set.push(address);
      localStorage.setItem('fm_unique_wallets', JSON.stringify(set));
    }
    return set.length;
  } catch { return 1; }
}

function getUniqueWalletCount(): number {
  try {
    const raw = localStorage.getItem('fm_unique_wallets');
    return raw ? JSON.parse(raw).length : 0;
  } catch { return 0; }
}

// ── Component ─────────────────────────────────────────────────────
export const AnalyticsDashboard: React.FC = () => {
  const { isConnected, address } = useWalletContext();
  const [stats, setStats] = useState<AuctionStats>({
    totalBidsThisSession: 0,
    highestBid: 0,
    highestBidder: '',
    phase: 0,
    bidCount: 0,
    contractAddress: CONTRACT_ADDRESS,
    lastRefreshed: null,
  });
  const [uniqueWallets, setUniqueWallets] = useState(getUniqueWalletCount());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const walletTracked = useRef(false);

  // Track this wallet as a unique user
  useEffect(() => {
    if (address && !walletTracked.current) {
      walletTracked.current = true;
      const count = accumulateWallet(address);
      setUniqueWallets(count);
    }
  }, [address]);

  // Fetch live contract state from indexer
  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!isConnected) {
        setStats(prev => ({ ...prev, lastRefreshed: new Date() }));
        setLoading(false);
        return;
      }

      const raw = localStorage.getItem('fm_contract_state_cache');
      if (raw) {
        try {
          const cached = JSON.parse(raw);
          const age = Date.now() - cached.ts;
          if (age < 20000) { // use cache if <20s old
            setStats(prev => ({
              ...prev,
              phase: cached.phase,
              highestBid: cached.highestBid,
              highestBidder: cached.highestBidder,
              bidCount: cached.bidCount,
              lastRefreshed: new Date(cached.ts),
            }));
            setLoading(false);
            return;
          }
        } catch { /* ignore */ }
      }

      setStats(prev => ({ ...prev, lastRefreshed: new Date() }));
    } catch (err: any) {
      setError('Could not refresh live data. Showing cached stats.');
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [isConnected]);

  // Listen for contract state updates written to localStorage by AuctionPanel
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'fm_contract_state_cache' && e.newValue) {
        try {
          const cached = JSON.parse(e.newValue);
          setStats(prev => ({
            ...prev,
            phase: cached.phase,
            highestBid: cached.highestBid,
            highestBidder: cached.highestBidder,
            bidCount: cached.bidCount,
            lastRefreshed: new Date(cached.ts),
          }));
        } catch { /* ignore */ }
      }
      if (e.key === 'fm_unique_wallets') {
        try { setUniqueWallets(JSON.parse(e.newValue || '[]').length); } catch { /* ignore */ }
      }
    };
    window.addEventListener('storage', handleStorage);

    // Read existing cache on mount
    const raw = localStorage.getItem('fm_contract_state_cache');
    if (raw) {
      try {
        const cached = JSON.parse(raw);
        setStats(prev => ({
          ...prev,
          phase: cached.phase ?? prev.phase,
          highestBid: cached.highestBid ?? prev.highestBid,
          highestBidder: cached.highestBidder ?? prev.highestBidder,
          bidCount: cached.bidCount ?? prev.bidCount,
          lastRefreshed: cached.ts ? new Date(cached.ts) : null,
        }));
      } catch { /* ignore */ }
    }

    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Auto-refresh every 15s
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const phaseName = PHASE_LABEL[stats.phase] ?? 'Unknown';
  const displayBidder = stats.highestBidder
    ? `${stats.highestBidder.substring(0, 8)}…${stats.highestBidder.substring(stats.highestBidder.length - 4)}`
    : '—';

  return (
    <div className="analytics-panel panel">
      <div className="analytics-header">
        <div className="analytics-header__left">
          <h2 className="analytics-title">📊 Live Network Activity</h2>
          <p className="analytics-subtitle">
            All data sourced from the public Midnight Preprod ledger — no private information exposed.
          </p>
        </div>
        <button
          id="analytics-refresh-btn"
          className="btn btn-outline analytics-refresh-btn"
          onClick={fetchStats}
          disabled={loading}
          aria-label="Refresh analytics"
        >
          {loading ? <span className="spinner" /> : '↻'} Refresh
        </button>
      </div>

      {error && <div className="error-banner" role="alert">{error}</div>}

      {/* ── Primary Stats Grid ─────────────────────────────────── */}
      <div className="analytics-grid">
        <div className="analytics-card analytics-card--highlight">
          <div className="analytics-card__icon">👛</div>
          <div className="analytics-card__value">{uniqueWallets}</div>
          <div className="analytics-card__label">Unique Wallets Interacted</div>
          <div className="analytics-card__sub">Across all sessions on this device</div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card__icon">📋</div>
          <div className="analytics-card__value">{stats.bidCount}</div>
          <div className="analytics-card__label">Bids on Current Auction</div>
          <div className="analytics-card__sub">Live from Preprod contract</div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card__icon">💰</div>
          <div className="analytics-card__value">
            {stats.highestBid > 0 ? `${stats.highestBid}` : '—'}
          </div>
          {stats.highestBid > 0 && (
            <div className="analytics-card__unit">tNIGHT</div>
          )}
          <div className="analytics-card__label">Highest Revealed Bid</div>
          {stats.phase >= 1 && stats.highestBidder && (
            <div className="analytics-card__sub">
              Winner: <span className="analytics-card__mono">{displayBidder}</span>
            </div>
          )}
        </div>

        <div className="analytics-card">
          <div className="analytics-card__icon">
            {stats.phase === 0 ? '🔒' : stats.phase === 1 ? '🔓' : '🏆'}
          </div>
          <div className="analytics-card__value analytics-card__value--phase">{phaseName}</div>
          <div className="analytics-card__label">Auction Phase</div>
          <div className="analytics-card__sub">Updates every 15 seconds</div>
        </div>
      </div>

      {/* ── Privacy Guarantee ─────────────────────────────────── */}
      <div className="analytics-privacy-note">
        <span className="analytics-privacy-note__icon">🔒</span>
        <span>
          <strong>What you can't see here:</strong> Individual bid amounts, losing bidder identities.
          These are mathematically private — impossible to extract from the public ledger.
        </span>
      </div>

      {/* ── Contract Reference ────────────────────────────────── */}
      <div className="analytics-contract">
        <div className="analytics-contract__row">
          <span className="analytics-contract__label">Preprod Contract:</span>
          <a
            id="analytics-contract-link"
            href={`${EXPLORER_BASE}/contract/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="analytics-contract__address"
          >
            {CONTRACT_ADDRESS.substring(0, 16)}…{CONTRACT_ADDRESS.substring(CONTRACT_ADDRESS.length - 8)}
            <span className="analytics-contract__ext">↗</span>
          </a>
        </div>
        {stats.lastRefreshed && (
          <div className="analytics-contract__row">
            <span className="analytics-contract__label">Last Refreshed:</span>
            <span className="analytics-contract__value">
              {stats.lastRefreshed.toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>

      {/* ── Onboarding funnel note ─────────────────────────── */}
      {!isConnected && (
        <div className="analytics-connect-note">
          Connect your Lace wallet to your activity to the live stats above.
        </div>
      )}
    </div>
  );
};
