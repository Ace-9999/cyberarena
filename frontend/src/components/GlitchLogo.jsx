import React from 'react';

export default function GlitchLogo({ text, highlight, tagline, size }) {
  return (
    <div style={{ textAlign: 'center', margin: '2rem 0' }}>
      <h1 className="mono" style={{ 
          fontSize: size === 'large' ? '3rem' : '1.5rem',
          color: 'var(--text)', 
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: '0.1em'
      }}>
        {text} <span style={{ color: 'var(--green)' }}>{highlight}</span>
      </h1>
      {tagline && <p className="mono" style={{ color: 'var(--green)', marginTop: '0.5rem' }}>{tagline}</p>}
    </div>
  );
}
