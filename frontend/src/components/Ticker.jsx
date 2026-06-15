import React from 'react';

export default function Ticker({ items = [] }) {
  const content = items.join('   //   ');
  return (
    <div className="mono ticker-wrap" style={{
      color: 'var(--green)',
      borderTop: '1px solid var(--green)',
      borderBottom: '1px solid var(--green)',
      padding: '0.5rem 0',
      fontSize: '0.8rem',
      backgroundColor: 'rgba(57, 255, 136, 0.05)',
    }}>
      <div className="ticker-track">
        <span style={{ paddingRight: '2rem' }}>{content}</span>
        <span style={{ paddingRight: '2rem' }}>{content}</span>
      </div>
    </div>
  );
}
