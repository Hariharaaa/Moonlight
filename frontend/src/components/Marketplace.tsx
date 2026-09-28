import React, { useState, useEffect } from 'react';
import { AuctionView } from './AuctionView';
import { useWalletContext } from '../context/WalletContext';
import { getContractInstance } from '../services/contract';
import { Buffer } from 'buffer';
import { toPureBytes } from '../utils/bytes';

export interface AuctionData {
  id: string;
  seller: string;
  phase: number;
  highestBid: number;
  bidCount: number;
}

export const Marketplace: React.FC = () => {
  const { api: walletApi, isConnected } = useWalletContext();
  const [contract, setContract] = useState<any>(null);
  const [auctions, setAuctions] = useState<AuctionData[]>([]);
  const [selectedAuctionId, setSelectedAuctionId] = useState<string | null>(null);
  
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Poll for state
  useEffect(() => {
    let isMounted = true;
    if (walletApi && isConnected) {
      getContractInstance(walletApi)
        .then(({ deployed }) => {
          if (!isMounted) return;
          setContract(deployed);
          refreshAuctions(deployed);
        })
        .catch(err => {
          if (!isMounted) return;
          console.error(err);
        });
    }
    return () => { isMounted = false; };
  }, [walletApi, isConnected]);

  const refreshAuctions = async (instance: any) => {
    try {
      const state = await instance.queryState();
      
      const parsedAuctions: AuctionData[] = [];
      
      if (state.auctions && typeof state.auctions.entries === 'function') {
        for (const [key, value] of state.auctions.entries()) {
          parsedAuctions.push({
            id: Buffer.from(key).toString('hex'),
            seller: Buffer.from(value.seller).toString('hex'),
            phase: Number(value.phase),
            highestBid: Number(value.highest_bid),
            bidCount: Number(value.bid_count),
          });
        }
      }
      
      // For the hackathon MVP demo when running locally without real network state
      if (parsedAuctions.length === 0) {
        parsedAuctions.push({
          id: 'mock_auction_001',
          seller: '0x123...abc',
          phase: 0,
          highestBid: 0,
          bidCount: 5
        });
        parsedAuctions.push({
          id: 'mock_auction_002',
          seller: '0x456...def',
          phase: 1,
          highestBid: 250,
          bidCount: 12
        });
      }

      setAuctions(parsedAuctions);
    } catch (err) {
      console.error("Error refreshing marketplace", err);
    }
  };

  const handleCreateAuction = async () => {
    if (!contract || !walletApi) return;
    setIsCreating(true);
    setError(null);
    try {
      // Generate random 32-byte ID
      const idBytes = new Uint8Array(32);
      window.crypto.getRandomValues(idBytes);
      
      const addr = await walletApi.getUnshieldedAddress();
      const encoder = new TextEncoder();
      const data = encoder.encode(addr.unshieldedAddress);
      const sellerBytesBuffer = await crypto.subtle.digest('SHA-256', data);
      const sellerBytes = toPureBytes(sellerBytesBuffer);

      await contract.callTx.create_auction(toPureBytes(idBytes), sellerBytes);
      await refreshAuctions(contract);
    } catch (err: any) {
      setError(err?.message || 'Failed to create auction');
    } finally {
      setIsCreating(false);
    }
  };

  if (selectedAuctionId) {
    return (
      <div>
        <button className="btn btn-outline" style={{ marginBottom: '1rem' }} onClick={() => setSelectedAuctionId(null)}>
          ← Back to Marketplace
        </button>
        <AuctionView auctionId={selectedAuctionId} />
      </div>
    );
  }

  return (
    <div className="marketplace-container panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Live Auctions Marketplace</h2>
        <button className="btn btn-primary" onClick={handleCreateAuction} disabled={isCreating || !isConnected}>
          {isCreating ? 'Creating...' : '+ Create New Auction'}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="auctions-grid" style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {auctions.map(a => (
          <div key={a.id} className="action-card active" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }} onClick={() => setSelectedAuctionId(a.id)}>
            <div className="card-phase-badge">{a.phase === 0 ? 'Bidding' : a.phase === 1 ? 'Reveal' : a.phase === 2 ? 'Settled' : 'Cancelled'}</div>
            <h3>Item #{a.id.substring(0, 8)}</h3>
            <div style={{ margin: '1rem 0', flex: 1 }}>
              <div style={{color: 'var(--text-muted)'}}><strong>Seller:</strong> {a.seller.substring(0, 10)}...</div>
              <div style={{marginTop: '0.5rem', fontSize: '1.1rem'}}><strong>Bids:</strong> {a.bidCount} 🔒</div>
              {a.phase >= 1 && <div style={{marginTop: '0.5rem'}}><strong>Highest Bid:</strong> {a.highestBid} tNIGHT</div>}
            </div>
            <button className="btn btn-outline full-width">Enter Auction</button>
          </div>
        ))}
        {auctions.length === 0 && (
          <p>No active auctions found. Create one to get started!</p>
        )}
      </div>
    </div>
  );
};
