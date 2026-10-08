import React from 'react';
import './theme.css';

export default function TerminalPanel({ title, children }) {
  return (
    <div className="terminal-panel">
      <div className="terminal-header">
        <span className="mono" style={{ color: 'var(--green)', marginRight: '1rem', fontWeight: 'bold' }}>{title}</span>
        <div style={{ flex: 1 }}></div>
        <span className="dot red"></span>
        <span className="dot amber"></span>
        <span className="dot green"></span>
      </div>
      <div className="terminal-body mono">
        {children}
      </div>
    </div>
  );
}
