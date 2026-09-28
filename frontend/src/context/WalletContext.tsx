import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ConnectedAPI, InitialAPI } from '@midnight-ntwrk/dapp-connector-api';
import { ACTIVE_NETWORK } from '../config/network';

// ── Types ─────────────────────────────────────────────────────
export interface WalletState {
  api: ConnectedAPI | null;
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export interface WalletContextValue extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
}

// ── Context ───────────────────────────────────────────────────
const WalletContext = createContext<WalletContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────
export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [walletState, setWalletState] = useState<WalletState>({
    api: null,
    address: null,
    isConnected: false,
    isConnecting: false,
    error: null,
  });

  const getLaceWallet = (): InitialAPI | null => {
    const midnight = (window as any).midnight;
    if (!midnight) return null;
    if (midnight.mnLace) return midnight.mnLace;
    if (midnight.lace) return midnight.lace;
    const keys = Object.keys(midnight);
    if (keys.length > 0) return midnight[keys[0]];
    return null;
  };

  const connect = useCallback(async () => {
    setWalletState(prev => ({ ...prev, isConnecting: true, error: null }));
    try {
      const wallet = getLaceWallet();
      if (!wallet) {
        throw new Error('Lace wallet not found. Please install the Lace browser extension and ensure it supports Midnight.');
      }

      let api: ConnectedAPI | null = null;
      try {
        console.log(`Attempting to connect with network ID: ${ACTIVE_NETWORK}`);
        api = await wallet.connect(ACTIVE_NETWORK);
        console.log(`Successfully connected to ${ACTIVE_NETWORK}!`);
      } catch (err: any) {
        throw new Error(err?.message || `Failed to connect to ${ACTIVE_NETWORK}. Please make sure your Lace wallet is set to ${ACTIVE_NETWORK}.`);
      }

      const unshieldedAddress = await api.getUnshieldedAddress();

      setWalletState({
        api,
        address: unshieldedAddress.unshieldedAddress,
        isConnected: true,
        isConnecting: false,
        error: null,
      });
    } catch (err: any) {
      console.error('Wallet connection failed:', err);
      setWalletState({
        api: null,
        address: null,
        isConnected: false,
        isConnecting: false,
        error: err?.message || 'Failed to connect to wallet',
      });
    }
  }, []);

  const disconnect = useCallback(() => {
    setWalletState({
      api: null,
      address: null,
      isConnected: false,
      isConnecting: false,
      error: null,
    });
  }, []);

  return (
    <WalletContext.Provider value={{ ...walletState, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────
export function useWalletContext(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWalletContext must be used inside WalletProvider');
  return ctx;
}
