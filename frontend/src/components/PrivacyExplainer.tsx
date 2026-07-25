import React, { useState } from 'react';

export const PrivacyExplainer: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="privacy-explainer">
      <button
        className="explainer-toggle"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span>🔍 What's private vs public?</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}><polyline points="6 9 12 15 18 9"></polyline></svg>
      </button>

      {open && (
        <div className="explainer-content animate-in">
          <div className="privacy-row public">
            <div className="privacy-eye">👁</div>
            <div>
              <strong>Anyone can see (on-chain)</strong>
              <ul>
                <li>Which addresses placed a bid (not the amounts)</li>
                <li>How many bids were received</li>
                <li>Auction phase (Bidding / Reveal / Closed)</li>
                <li>The winning bid amount &amp; winner (after settlement only)</li>
              </ul>
            </div>
          </div>
          <div className="privacy-row private">
            <div className="privacy-eye">🔒</div>
            <div>
              <strong>Nobody can ever see (private forever)</strong>
              <ul>
                <li>The actual bid amounts of losing bidders</li>
                <li>The salt used to generate your commitment</li>
                <li>Any bid amount before the reveal phase</li>
              </ul>
            </div>
          </div>
          <div className="privacy-mechanism">
            <strong>How?</strong> Losing bids are rejected by a Zero-Knowledge circuit <em>locally in your browser</em>. If your bid isn't the highest, you mathematically cannot generate a valid proof, so the transaction is never broadcast.
          </div>
        </div>
      )}
    </div>
  );
};
