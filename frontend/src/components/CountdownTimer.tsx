import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  deadlineMs: number;
  phase: number;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ deadlineMs, phase }) => {
  const [remaining, setRemaining] = useState(deadlineMs - Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(deadlineMs - Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [deadlineMs]);

  if (remaining <= 0) {
    return <div className="countdown expired">Deadline passed</div>;
  }

  const totalSecs = Math.floor(remaining / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  const isUrgent = remaining < 60000; // < 1 minute

  return (
    <div className={`countdown ${isUrgent ? 'urgent' : ''}`}>
      <span className="time-block">{String(mins).padStart(2, '0')}</span>
      <span className="time-sep">:</span>
      <span className="time-block">{String(secs).padStart(2, '0')}</span>
      <span className="time-unit">{phase === 0 ? 'until reveal' : 'until close'}</span>
    </div>
  );
};
