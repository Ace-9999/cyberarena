import React from 'react';

export default function Ticker({ items = [] }) {
  return (
    <div className="mono" style={{ 
        overflow: 'hidden', 
        whiteSpace: 'nowrap', 
        color: 'var(--green)', 
        borderTop: '1px solid var(--green)', 
        borderBottom: '1px solid var(--green)', 
        padding: '0.5rem 1rem',
        fontSize: '0.8rem',
        backgroundColor: 'rgba(57, 255, 136, 0.05)'
    }}>
      <span>{items.join('  //  ')}</span>
    </div>
  );
}
