import React, { useState, useEffect } from 'react';
import { fetchStatus, proveInclusion, fetchSampleUsers, type SolvencyStatus, type UserSample } from '../services/porContract';

export const ProofOfReservesPanel: React.FC = () => {
  const [status, setStatus] = useState<SolvencyStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Inclusion proof state
  const [sampleUsers, setSampleUsers] = useState<UserSample[]>([]);
  const [userId, setUserId] = useState('');
  const [balance, setBalance] = useState('');
  const [salt, setSalt] = useState('');
  const [secret, setSecret] = useState('');
  const [isProving, setIsProving] = useState(false);
  const [proofResult, setProofResult] = useState<{ nullifier: string; root: string } | null>(null);
  const [proofError, setProofError] = useState<string | null>(null);

  const loadStatus = async () => {
    setLoadingStatus(true);
    setStatusError(null);
    try {
      const s = await fetchStatus();
      setStatus(s);
    } catch (err: any) {
      setStatusError(err.message || 'Failed to fetch solvency status');
    } finally {
      setLoadingStatus(false);
    }
  };

  const loadSampleUsers = async () => {
    try {
      const users = await fetchSampleUsers();
      setSampleUsers(users);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    loadStatus();
    loadSampleUsers();
  }, []);

  const handleSelectSampleUser = (user: UserSample) => {
    setUserId(user.userId);
    setBalance(user.balance);
    setSalt(user.salt);
    // Fill dummy secret
    setSecret('82736455019283746501');
    setProofResult(null);
    setProofError(null);
  };

  const handleProveInclusion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProving(true);
    setProofError(null);
    setProofResult(null);

    try {
      const res = await proveInclusion({ userId, balance, salt, secret });
      setProofResult({ nullifier: res.nullifier, root: res.root });
    } catch (err: any) {
      setProofError(err.message || 'Proof generation failed');
    } finally {
      setIsProving(false);
    }
  };

  return (
    <div className="por-panel">
      {/* ── Section Header ─────────────────────────────────────────── */}
      <div className="por-header panel">
        <div className="por-header__content">
          <div className="por-tag">
            <span className="badge-zk">🛡️ Zero-Knowledge Proof of Reserves</span>
          </div>
          <h2 className="por-title">Verifiable Solvency, Zero Balances Revealed</h2>
          <p className="por-subtitle">
            The exchange proves on-chain that <strong>Reserves ≥ Total Liabilities</strong> using
            Groth16 Zero-Knowledge proofs. Every user can independently verify their balance was
            included in the liabilities tree without anyone learning their private balance.
          </p>
        </div>
      </div>

      <div className="por-grid">
        {/* ── Solvency Status Card ──────────────────────────────────── */}
        <div className="panel por-card">
          <div className="por-card__header">
            <div className="por-card__title-group">
              <span className="por-card__icon">🏛️</span>
              <h3>Exchange Solvency Status</h3>
            </div>
            <button
              id="por-refresh-btn"
              className="btn btn-outline btn-sm"
              onClick={loadStatus}
              disabled={loadingStatus}
            >
              {loadingStatus ? <span className="spinner" /> : '↻'} Refresh
            </button>
          </div>

          {loadingStatus && (
            <div className="por-loading">
              <span className="spinner" /> Sourcing cryptographic attestations…
            </div>
          )}

          {statusError && (
            <div className="error-banner">
              ⚠️ {statusError}
            </div>
          )}

          {status && !loadingStatus && !statusError && (
            <div className="por-status-body">
              <div className={`por-status-badge ${status.solvent ? 'por-status-badge--solvent' : 'por-status-badge--insolvent'}`}>
                <span className="por-status-badge__icon">{status.solvent ? '✅' : '❌'}</span>
                <div>
                  <div className="por-status-badge__title">
                    {status.solvent ? 'CRYPTOGRAPHICALLY SOLVENT' : 'UNVERIFIED / INSOLVENT'}
                  </div>
                  <div className="por-status-badge__time">
                    Last Verified: {status.lastCheckedISO ? new Date(status.lastCheckedISO).toLocaleString() : 'Just now'}
                  </div>
                </div>
              </div>

              <div className="por-stat-row">
                <span className="por-stat-label">Attested On-Chain Reserves</span>
                <span className="por-stat-val mono">
                  {BigInt(status.reserves || 0).toLocaleString()} tNIGHT / Units
                </span>
              </div>

              <div className="por-stat-row">
                <span className="por-stat-label">Liabilities Merkle Root (Poseidon)</span>
                <span className="por-stat-val mono por-mono-truncate" title={status.liabilitiesRoot}>
                  {status.liabilitiesRoot}
                </span>
              </div>

              <div className="por-callout">
                🔒 <strong>Mathematical Guarantee:</strong> Total user liabilities sum is proven to be less than or equal to reserves without revealing any individual account.
              </div>
            </div>
          )}
        </div>

        {/* ── Inclusion Verification Form ──────────────────────────── */}
        <div className="panel por-card">
          <div className="por-card__header">
            <div className="por-card__title-group">
              <span className="por-card__icon">🔍</span>
              <h3>Verify Your Balance Inclusion</h3>
            </div>
            <span className="badge badge--private">Confidential</span>
          </div>

          <p className="por-desc">
            Generate a local Zero-Knowledge Merkle inclusion proof. Your secret key and balance never leave your browser.
          </p>

          {/* Quick autofill sample accounts */}
          {sampleUsers.length > 0 && (
            <div className="por-sample-users">
              <span className="por-sample-label">Quick autofill sample user:</span>
              <div className="por-sample-chips">
                {sampleUsers.slice(0, 4).map((u) => (
                  <button
                    key={u.userId}
                    type="button"
                    className="btn btn-outline btn-xs"
                    onClick={() => handleSelectSampleUser(u)}
                  >
                    👤 {u.userId} ({parseInt(u.balance, 10).toLocaleString()} units)
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleProveInclusion} className="por-form">
            <div className="por-input-group">
              <label htmlFor="por-user-id">User ID / Account</label>
              <input
                id="por-user-id"
                className="input"
                type="text"
                placeholder="e.g. user-003"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
              />
            </div>

            <div className="por-input-group">
              <label htmlFor="por-balance">Account Balance (Units)</label>
              <input
                id="por-balance"
                className="input"
                type="text"
                placeholder="e.g. 375000"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                required
              />
            </div>

            <div className="por-input-group">
              <label htmlFor="por-salt">Account Salt (from exchange statement)</label>
              <input
                id="por-salt"
                className="input"
                type="text"
                placeholder="e.g. 33333333333333333333"
                value={salt}
                onChange={(e) => setSalt(e.target.value)}
                required
              />
            </div>

            <div className="por-input-group">
              <label htmlFor="por-secret">Your Private Secret Key</label>
              <input
                id="por-secret"
                className="input"
                type="password"
                placeholder="Private secret (computed locally)"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                required
              />
            </div>

            <button
              id="por-submit-proof-btn"
              type="submit"
              className="btn btn-primary por-submit-btn"
              disabled={isProving}
            >
              {isProving ? (
                <>
                  <span className="spinner" /> Generating ZK Proof…
                </>
              ) : (
                '🛡️ Generate & Verify Inclusion Proof'
              )}
            </button>
          </form>

          {proofResult && (
            <div className="por-proof-result success">
              <div className="por-proof-result__header">
                <span className="por-proof-result__icon">✅</span>
                <div>
                  <strong>Proof Verified! Your balance is included.</strong>
                  <p>Your leaf was matched inside the attested liabilities Merkle tree.</p>
                </div>
              </div>
              <div className="por-proof-meta">
                <div className="por-proof-meta__row">
                  <span>Unique Nullifier:</span>
                  <code className="mono">{proofResult.nullifier}</code>
                </div>
                <div className="por-proof-meta__row">
                  <span>Matched Merkle Root:</span>
                  <code className="mono">{proofResult.root}</code>
                </div>
              </div>
            </div>
          )}

          {proofError && (
            <div className="por-proof-result error">
              <div className="por-proof-result__header">
                <span className="por-proof-result__icon">❌</span>
                <div>
                  <strong>Proof Failed</strong>
                  <p>{proofError}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
