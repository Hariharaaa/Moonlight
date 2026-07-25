import { WalletButton } from './components/WalletButton';
import { AuctionPanel } from './components/AuctionPanel';

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">
          <span className="moon">🌕</span>
          <h1>FullMoon</h1>
        </div>
        <WalletButton />
      </header>

      <main className="app-main">
        <div className="hero">
          <h2>Sealed-Bid ZK Auction</h2>
          <p>
            Experience true privacy on the Midnight Network. Place a bid without revealing the amount, and only the winning bid gets revealed on-chain. Losing bids remain mathematically secret forever!
          </p>
        </div>

        <AuctionPanel />
      </main>

      <footer className="app-footer">
        <p>Built with ❤️ for the Midnight Builder Challenge - Level 3 (Waxing Gibbous)</p>
      </footer>
    </div>
  );
}

export default App;
