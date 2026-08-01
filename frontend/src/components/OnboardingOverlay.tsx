import React, { useState } from 'react';

type Step = 1 | 2 | 3;

interface OnboardingOverlayProps {
  onDismiss: () => void;
}

const FAUCET_URL = 'https://midnight-tmnight-preprod.nethermind.dev';
const LACE_URL = 'https://www.lace.io/';

export const OnboardingOverlay: React.FC<OnboardingOverlayProps> = ({ onDismiss }) => {
  const [step, setStep] = useState<Step>(1);

  const steps: Record<Step, { emoji: string; title: string; content: React.ReactNode }> = {
    1: {
      emoji: '🌕',
      title: 'Welcome to FullMoon',
      content: (
        <>
          <p className="onboarding__text">
            FullMoon is a <strong>sealed-bid auction marketplace</strong> built on the Midnight Network.
            Unlike normal auctions, <strong>your bid amount is never visible to anyone</strong> — not even
            the auction creator — until the reveal phase.
          </p>
          <div className="onboarding__callout">
            <div className="onboarding__callout-row">
              <span>👁️ <strong>Public (everyone sees):</strong></span>
              <span>Who bid, total bid count, auction phase</span>
            </div>
            <div className="onboarding__callout-row">
              <span>🔒 <strong>Private (nobody sees):</strong></span>
              <span>Your bid amount, your losing bids — forever</span>
            </div>
          </div>
          <p className="onboarding__text">
            This is made possible by <strong>Zero-Knowledge proofs</strong> running locally in your browser.
            Your amount is hashed before it ever touches the network.
          </p>
        </>
      ),
    },
    2: {
      emoji: '💧',
      title: 'Get Testnet tNIGHT Tokens',
      content: (
        <>
          <p className="onboarding__text">
            FullMoon runs on the <strong>Midnight Preprod Testnet</strong>. You'll need
            free testnet <strong>tNIGHT</strong> tokens to place bids. They have no real value.
          </p>
          <ol className="onboarding__steps-list">
            <li>
              Install the{' '}
              <a href={LACE_URL} target="_blank" rel="noopener noreferrer">
                Lace browser extension
              </a>{' '}
              and create a wallet
            </li>
            <li>Switch Lace to the <strong>Preprod</strong> network</li>
            <li>
              Visit the{' '}
              <a href={FAUCET_URL} target="_blank" rel="noopener noreferrer" id="faucet-link">
                Midnight Preprod Faucet ↗
              </a>
            </li>
            <li>Paste your wallet address and request tNIGHT</li>
            <li>Wait ~30 seconds for the tokens to arrive</li>
          </ol>
          <div className="onboarding__tip">
            💡 Already have tNIGHT? Skip ahead →
          </div>
        </>
      ),
    },
    3: {
      emoji: '🚀',
      title: 'Your First Auction Action',
      content: (
        <>
          <p className="onboarding__text">
            Here's how a full FullMoon auction works in 3 phases:
          </p>
          <div className="onboarding__phase-list">
            <div className="onboarding__phase">
              <span className="onboarding__phase-badge">Phase 1</span>
              <div>
                <strong>🔒 Bidding</strong>
                <p>Enter your bid amount. A cryptographic commitment (hash) is submitted on-chain. Your actual amount stays on your device.</p>
              </div>
            </div>
            <div className="onboarding__phase">
              <span className="onboarding__phase-badge">Phase 2</span>
              <div>
                <strong>🔓 Reveal</strong>
                <p>Reveal your bid. A ZK proof is generated — if you're not the highest bidder, the proof fails locally and your amount is never sent.</p>
              </div>
            </div>
            <div className="onboarding__phase">
              <span className="onboarding__phase-badge">Phase 3</span>
              <div>
                <strong>🏆 Settlement</strong>
                <p>The highest revealed bid wins. All losing amounts remain mathematically secret, forever.</p>
              </div>
            </div>
          </div>
          <p className="onboarding__text">
            Connect your Lace wallet to get started!
          </p>
        </>
      ),
    },
  };

  const current = steps[step];
  const isLast = step === 3;

  return (
    <div className="onboarding-overlay" role="dialog" aria-modal="true" aria-label="FullMoon onboarding">
      <div className="onboarding-backdrop" onClick={onDismiss} />
      <div className="onboarding-card animate-in">
        <button
          id="onboarding-close-btn"
          className="onboarding__close"
          onClick={onDismiss}
          aria-label="Skip onboarding"
        >
          ✕
        </button>

        <div className="onboarding__emoji">{current.emoji}</div>
        <h2 className="onboarding__title">{current.title}</h2>

        <div className="onboarding__content">{current.content}</div>

        <div className="onboarding__footer">
          <div className="onboarding__dots">
            {([1, 2, 3] as Step[]).map(s => (
              <span
                key={s}
                className={`onboarding__dot ${s === step ? 'onboarding__dot--active' : ''}`}
              />
            ))}
          </div>
          <div className="onboarding__nav">
            {step > 1 && (
              <button
                id="onboarding-back-btn"
                className="btn btn-outline"
                onClick={() => setStep((s) => (s - 1) as Step)}
              >
                ← Back
              </button>
            )}
            <button
              id={isLast ? 'onboarding-finish-btn' : 'onboarding-next-btn'}
              className="btn btn-primary"
              onClick={isLast ? onDismiss : () => setStep((s) => (s + 1) as Step)}
            >
              {isLast ? "Let's Go 🌕" : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
