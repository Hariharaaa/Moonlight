import React, { useState } from 'react';

interface PrivacyBadgeProps {
  type: 'proof' | 'authorization';
  message: string;
  details: string;
  show: boolean;
}

export const PrivacyBadge: React.FC<PrivacyBadgeProps> = ({ type, message, details, show }) => {
  const [expanded, setExpanded] = useState(false);

  if (!show) return null;

  return (
    <div className={`privacy-badge animate-in ${type}`}>
      <div className="badge-header" onClick={() => setExpanded(!expanded)}>
        <div className="icon-container">
          {type === 'proof' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="success-icon"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shield-icon"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          )}
        </div>
        <span className="message">{message}</span>
        <button className="expand-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
      </div>
      
      {expanded && (
        <div className="badge-details">
          <strong>What was proven?</strong>
          <p>{details}</p>
        </div>
      )}
    </div>
  );
};
