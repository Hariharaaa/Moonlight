import React from 'react';

type EscrowPhase = 'none' | 'locked' | 'pending_reveal' | 'settled' | 'refunded';

interface EscrowStatusProps {
  phase: EscrowPhase;
  bidAmount?: number;
}

const PHASE_CONFIG: Record<EscrowPhase, { icon: string; label: string; description: string; colorClass: string }> = {
  none: {
    icon: '○',
    label: 'No Escrow',
    description: 'Place a bid to lock funds into escrow.',
    colorClass: 'escrow--none',
  },
  locked: {
    icon: '🔒',
    label: 'Funds Escrowed',
    description: 'Your bid commitment is on-chain. Funds are locked until reveal phase.',
    colorClass: 'escrow--locked',
  },
  pending_reveal: {
    icon: '⏳',
    label: 'Pending Reveal',
    description: 'Reveal phase is active. Submit your reveal to compete for the win.',
    colorClass: 'escrow--pending',
  },
  settled: {
    icon: '🏆',
    label: 'Settled',
    description: 'Auction closed. Winner confirmed on-chain.',
    colorClass: 'escrow--settled',
  },
  refunded: {
    icon: '↩️',
    label: 'Funds Released',
    description: 'Your escrow has been released — your bid was not the winning bid.',
    colorClass: 'escrow--refunded',
  },
};

export const EscrowStatus: React.FC<EscrowStatusProps> = ({ phase, bidAmount }) => {
  const config = PHASE_CONFIG[phase];

  return (
    <div
      className={`escrow-status ${config.colorClass}`}
      role="status"
      aria-label={`Escrow status: ${config.label}`}
    >
      <div className="escrow-status__header">
        <span className="escrow-status__icon">{config.icon}</span>
        <span className="escrow-status__label">Escrow Status: <strong>{config.label}</strong></span>
        {bidAmount && bidAmount > 0 && phase === 'locked' && (
          <span className="escrow-status__amount">{bidAmount} tNIGHT</span>
        )}
      </div>
      <p className="escrow-status__desc">{config.description}</p>
      {phase === 'locked' && (
        <div className="escrow-status__guarantee">
          🔒 Your funds are cryptographically committed. No one — including FullMoon — can access them without your ZK proof.
        </div>
      )}
    </div>
  );
};
