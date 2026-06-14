import React from 'react';

export default function MatrixRain({ className, fontSize, opacity, brightColor, dimColor }) {
  // Stub for Matrix Rain background
  return (
    <div className={className} style={{ 
        position: 'fixed', 
        top: 0, left: 0, right: 0, bottom: 0, 
        zIndex: -1, 
        background: 'var(--bg)', 
        opacity: opacity || 0.5 
    }}>
      {/* Matrix rain canvas would go here */}
    </div>
  );
}
