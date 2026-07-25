import React, { useState } from 'react';

interface PrivacyBadgeProps {
  type: 'proof' | 'authorization';
  message: string;
  details: string;
  show: boolean;
  txHash?: string | null;
}

export const PrivacyBadge: React.FC<PrivacyBadgeProps> = ({ type, message, details, show, txHash }) => {
  const [expanded, setExpanded] = useState(false);

  if (!show) return null;

  return (
    <div className={`privacy-badge animate-in ${type}`} role="status" aria-live="polite">
      <div className="badge-header" onClick={() => setExpanded(!expanded)}>
        <div className="badge-glow-ring"></div>
        <div className="icon-container">
          {type === 'proof' ? (
            // Shield with checkmark
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="success-icon">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <polyline points="9 12 11 14 15 10"></polyline>
            </svg>
          ) : (
            // Trophy-style check
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shield-icon">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          )}
        </div>
        <div className="badge-text">
          <span className="message">{message}</span>
          <span className="zk-label">Zero-Knowledge Proof Verified</span>
        </div>
        <button className="expand-btn" aria-label={expanded ? 'Collapse' : 'Expand'}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
      </div>

      {expanded && (
        <div className="badge-details">
          <strong>What was cryptographically proven?</strong>
          <p>{details}</p>
          {txHash && (
            <div className="tx-ref">
              <span className="tx-label">Transaction ref:</span>
              <code className="tx-hash">{txHash.substring(0, 20)}…</code>
            </div>
          )}
          <div className="zk-guarantee">
            🔒 Your private inputs (amount, salt) were used <em>only locally</em> to generate this proof. They were mathematically processed inside your browser and discarded — they never touched the network.
          </div>
        </div>
      )}
    </div>
  );
};
