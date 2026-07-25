import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { WalletProvider } from './context/WalletContext.tsx'
import './index.css'
import { Buffer } from 'buffer';

// Inject Node globals for Midnight.js SDK dependencies (which expect Node globals)
if (typeof window !== 'undefined') {
  window.Buffer = window.Buffer || Buffer;
  window.process = window.process || { env: {} } as any;
}
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WalletProvider>
      <App />
    </WalletProvider>
  </React.StrictMode>,
)
