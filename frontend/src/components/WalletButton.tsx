import React from 'react';
import { useWalletContext } from '../context/WalletContext';
import { ACTIVE_NETWORK, CONTRACT_ADDRESS } from '../config/network';

export const WalletButton: React.FC = () => {
  const { isConnected, isConnecting, address, error, connect, disconnect } = useWalletContext();

  const truncateAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 10)}...${addr.slice(-6)}`;
  };

  // Deployment status badge: "UNDEPLOYED" only if the contract address is the zero hash
  const isDeployed = CONTRACT_ADDRESS && CONTRACT_ADDRESS.replace(/0/g, '').length > 0;
  const deployBadgeClass = isDeployed ? 'deploy-badge deployed' : 'deploy-badge undeployed';
  const deployLabel = isDeployed ? `✓ DEPLOYED · ${ACTIVE_NETWORK.toUpperCase()}` : '⚠ UNDEPLOYED';

  return (
    <div className="wallet-container">
      {/* Deployment status badge */}
      <div className={deployBadgeClass} title={isDeployed ? `Contract: ${CONTRACT_ADDRESS}` : 'No contract address set'}>
        {deployLabel}
      </div>

      {error && (
        <div className="wallet-error">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <span>{error}</span>
          {error.includes('install') && (
            <a href="https://www.lace.io/" target="_blank" rel="noopener noreferrer" className="install-link">
              Install Lace
            </a>
          )}
        </div>
      )}

      {!isConnected ? (
        <button
          className="btn btn-primary"
          onClick={connect}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <>
              <span className="spinner"></span>
              Connecting...
            </>
          ) : (
            '🌙 Connect Lace Wallet'
          )}
        </button>
      ) : (
        <div className="wallet-connected">
          <div className="wallet-info">
            <span className="network-badge">{ACTIVE_NETWORK}</span>
            <span className="address" title={address || ''}>{truncateAddress(address || '')}</span>
          </div>
          <button className="btn btn-outline" onClick={disconnect}>
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};
