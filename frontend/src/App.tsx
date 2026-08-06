import { useState } from 'react';
import { WalletButton } from './components/WalletButton';
import { AuctionPanel } from './components/AuctionPanel';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { ProofOfReservesPanel } from './components/ProofOfReservesPanel';
import { OnboardingOverlay } from './components/OnboardingOverlay';

type Tab = 'auction' | 'por' | 'analytics';

// Session-scoped: show onboarding once per browser session (not persisted to localStorage)
let hasSeenOnboarding = false;

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('auction');
  const [showOnboarding, setShowOnboarding] = useState(!hasSeenOnboarding);

  const handleDismissOnboarding = () => {
    hasSeenOnboarding = true;
    setShowOnboarding(false);
  };

  return (
    <div className="app-container">
      {/* ── Onboarding Overlay (first visit only, session-scoped) ── */}
      {showOnboarding && (
        <OnboardingOverlay onDismiss={handleDismissOnboarding} />
      )}

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="app-header">
        <div className="logo">
          <span className="moon">🌕</span>
          <h1>FullMoon</h1>
          <span className="logo-sub">Confidential DeFi & ZK Auctions</span>
        </div>
        <WalletButton />
      </header>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <div className="hero">
        <h2>Privacy-Preserving DeFi & Auctions</h2>
        <p>
          Execute sealed-bid ZK auctions with zero public bids and mathematically verify exchange
          solvency with Zero-Knowledge Proof of Reserves.
        </p>
        <button
          id="how-it-works-btn"
          className="btn btn-outline hero__onboarding-btn"
          onClick={() => setShowOnboarding(true)}
        >
          ❓ How does this work?
        </button>
      </div>

      {/* ── Tab Navigation ─────────────────────────────────────── */}
      <nav className="tab-nav" role="tablist" aria-label="Main navigation">
        <button
          id="tab-auction"
          role="tab"
          aria-selected={activeTab === 'auction'}
          className={`tab-nav__btn ${activeTab === 'auction' ? 'tab-nav__btn--active' : ''}`}
          onClick={() => setActiveTab('auction')}
        >
          🔒 Sealed-Bid Auction
        </button>
        <button
          id="tab-por"
          role="tab"
          aria-selected={activeTab === 'por'}
          className={`tab-nav__btn ${activeTab === 'por' ? 'tab-nav__btn--active' : ''}`}
          onClick={() => setActiveTab('por')}
        >
          🛡️ Proof of Reserves
        </button>
        <button
          id="tab-analytics"
          role="tab"
          aria-selected={activeTab === 'analytics'}
          className={`tab-nav__btn ${activeTab === 'analytics' ? 'tab-nav__btn--active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📊 Network Analytics
        </button>
      </nav>

      {/* ── Main Content ───────────────────────────────────────── */}
      <main className="app-main" role="tabpanel">
        {activeTab === 'auction' && <AuctionPanel />}
        {activeTab === 'por' && <ProofOfReservesPanel />}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="app-footer">
        <p>
          Built for the{' '}
          <strong>Midnight Builder Challenge — Level 5 (Blue Belt)</strong>
          {' · '}
          <a href="https://moonlight-two-mu.vercel.app" target="_blank" rel="noopener noreferrer">
            Live Demo
          </a>
          {' · '}
          <a href="https://github.com/Hariharaaa/Moonlight" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
