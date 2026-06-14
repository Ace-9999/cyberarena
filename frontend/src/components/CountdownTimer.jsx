import React, { useState, useEffect } from 'react';

export default function CountdownTimer({ expiresAt, onExpire }) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!expiresAt) return;
    
    const target = new Date(expiresAt).getTime();
    
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const diff = Math.max(0, target - now);
      return Math.floor(diff / 1000);
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const left = calculateTimeLeft();
      setTimeLeft(left);
      
      if (left <= 0) {
        clearInterval(timer);
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  let colorClass = 'green';
  if (timeLeft < 30 && timeLeft > 0) {
    colorClass = 'red';
  } else if (timeLeft < 120 && timeLeft > 0) {
    colorClass = 'amber';
  }

  return (
    <div className="mono" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: `var(--${colorClass})` }}>
      {display}
    </div>
  );
}
