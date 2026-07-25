import { WalletButton } from './components/WalletButton';
import { AuctionPanel } from './components/AuctionPanel';

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">
          <span className="moon">🌕</span>
          <h1>FullMoon</h1>
          <span className="logo-sub">Sealed-Bid ZK Auction</span>
        </div>
        <WalletButton />
      </header>

      <main className="app-main">
        <div className="hero">
          <h2>Privacy-Preserving Auctions on Midnight</h2>
          <p>
            Bid without revealing your amount. Only the winning bid is ever disclosed on-chain.
            Losing bids are rejected locally by a Zero-Knowledge circuit — they are mathematically
            secret forever.
          </p>
        </div>

        <AuctionPanel />
      </main>

      <footer className="app-footer">
        <p>Built for the <strong>Midnight Builder Challenge — Level 3 (Waxing Gibbous)</strong> ·{' '}
          <a href="https://moonlight-two-mu.vercel.app" target="_blank" rel="noopener noreferrer">Live Demo</a>
          {' · '}
          <a href="https://github.com/Hariharaaa/Moonlight" target="_blank" rel="noopener noreferrer">GitHub</a>
        </p>
      </footer>
    </div>
  );
}

export default App;
