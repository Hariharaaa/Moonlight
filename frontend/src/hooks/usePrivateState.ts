import { useState, useEffect } from 'react';

export const PRIVATE_STATE_ID = 'auctionPrivateState';

export function usePrivateState() {
  const [bidAmount, setBidAmount] = useState<number>(() => {
    const saved = localStorage.getItem('bidAmount');
    return saved ? Number(saved) : 0;
  });

  const [bidSalt, setBidSalt] = useState<string>(() => {
    const saved = localStorage.getItem('bidSalt');
    return saved || '';
  });

  useEffect(() => {
    localStorage.setItem('bidAmount', bidAmount.toString());
  }, [bidAmount]);

  useEffect(() => {
    localStorage.setItem('bidSalt', bidSalt);
  }, [bidSalt]);

  return {
    bidAmount,
    setBidAmount,
    bidSalt,
    setBidSalt
  };
}
