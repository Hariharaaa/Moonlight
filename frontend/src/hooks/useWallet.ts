import { useState, useCallback } from 'react';
import type { InitialAPI, ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { ACTIVE_NETWORK } from '../config/network';

export interface WalletState {
  api: ConnectedAPI | null;
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    api: null,
    address: null,
    isConnected: false,
    isConnecting: false,
    error: null,
  });

  const getLaceWallet = (): InitialAPI | null => {
    // Check if the global midnight object exists
    const midnight = (window as any).midnight;
    if (!midnight) return null;

    // Use mnLace if available, or try to find any lace wallet injected
    if (midnight.mnLace) return midnight.mnLace;
    if (midnight.lace) return midnight.lace;
    
    // Fallback: enumerate available wallets and return the first one
    const keys = Object.keys(midnight);
    if (keys.length > 0) return midnight[keys[0]];

    return null;
  };

  const connect = useCallback(async () => {
    setWalletState((prev) => ({ ...prev, isConnecting: true, error: null }));
    
    try {
      const wallet = getLaceWallet();
      
      if (!wallet) {
        throw new Error('Lace wallet not found. Please install the Lace browser extension and ensure it supports Midnight.');
      }

      let api: ConnectedAPI | null = null;
      let lastError: any = null;

      // The Lace UI might map "Undeployed" to 'devnet' or 'undeployed'.
      // We will try the expected network first, then fall back to others if there's a mismatch.
      const networksToTry = [ACTIVE_NETWORK, 'devnet', 'undeployed', 'preview', 'preprod'];
      
      for (const net of networksToTry) {
        try {
          console.log(`Attempting to connect with network ID: ${net}`);
          api = await wallet.connect(net);
          console.log(`Successfully connected to ${net}!`);
          break; // Connection succeeded!
        } catch (err: any) {
          console.warn(`Failed to connect to ${net}:`, err?.message);
          lastError = err;
          // If the error is not a mismatch, we probably shouldn't keep trying,
          // but we'll keep trying just in case to be robust.
        }
      }

      if (!api) {
        throw lastError || new Error('Failed to connect to any valid network.');
      }
      
      // Get state
      const unshieldedAddress = await api.getUnshieldedAddress();
      
      setWalletState({
        api,
        address: unshieldedAddress.unshieldedAddress,
        isConnected: true,
        isConnecting: false,
        error: null,
      });

    } catch (err: any) {
      console.error("Wallet connection failed:", err);
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

  return {
    ...walletState,
    connect,
    disconnect,
  };
}
