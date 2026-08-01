import React, { useState } from 'react';

interface FeedbackPromptProps {
  show: boolean;
  onDismiss: () => void;
}

const FORM_URL = import.meta.env.VITE_FEEDBACK_FORM_URL || 'https://forms.gle/PLACEHOLDER';

export const FeedbackPrompt: React.FC<FeedbackPromptProps> = ({ show, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);

  if (!show) return null;

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(onDismiss, 300);
  };

  return (
    <div
      className={`feedback-prompt ${isExiting ? 'feedback-prompt--exit' : 'feedback-prompt--enter'}`}
      role="complementary"
      aria-label="User feedback request"
    >
      <div className="feedback-prompt__icon">🌕</div>
      <div className="feedback-prompt__body">
        <p className="feedback-prompt__title">You're one of our early testnet users!</p>
        <p className="feedback-prompt__sub">
          Help shape FullMoon — 2 minutes of feedback goes a long way.
        </p>
        <a
          id="feedback-form-link"
          href={FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary feedback-prompt__cta"
          onClick={handleDismiss}
        >
          Share Feedback →
        </a>
      </div>
      <button
        id="feedback-dismiss-btn"
        className="feedback-prompt__close"
        onClick={handleDismiss}
        aria-label="Dismiss feedback prompt"
      >
        ✕
      </button>
    </div>
  );
};
