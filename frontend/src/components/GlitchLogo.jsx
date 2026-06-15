import React from 'react';

export default function GlitchLogo({ text, highlight, tagline, size }) {
  return (
    <div style={{ textAlign: 'center', margin: '2rem 0' }} className="fade-in">
      <h1 className="mono" style={{
        fontSize: size === 'large' ? '3rem' : '1.5rem',
        color: 'var(--text)',
        margin: 0,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
      }}>
        {text}{' '}
        <span className="glitch" data-text={highlight} style={{ color: 'var(--green)', textShadow: '0 0 12px rgba(57,255,136,0.5)' }}>
          {highlight}
        </span>
      </h1>
      {tagline && (
        <p className="mono" style={{ color: 'var(--green)', marginTop: '0.6rem', letterSpacing: '0.25em', fontSize: '0.8rem', opacity: 0.85 }}>
          {tagline}<span className="caret">_</span>
        </p>
      )}
    </div>
  );
}
