import { WalletButton } from './components/WalletButton';
import { CounterPanel } from './components/CounterPanel';

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
          <h2>Privacy-Preserving ZK Counter</h2>
          <p>
            Experience selective disclosure on the Midnight Network. Increment the counter or authorize a reset without ever revealing your inputs to the blockchain.
          </p>
        </div>

        <CounterPanel />
      </main>

      <footer className="app-footer">
        <p>Built with ❤️ for the Midnight Builder Challenge - Level 2</p>
      </footer>
    </div>
  );
}

export default App;
