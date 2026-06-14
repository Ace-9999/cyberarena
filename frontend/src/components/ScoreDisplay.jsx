import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProgress } from '../context/ProgressContext';
import { useAuth } from '../context/AuthContext';

export default function ScoreDisplay() {
  const { token } = useAuth();
  const { points, loading } = useProgress();

  const navigate = useNavigate();
  const location = useLocation();

  if (!token || loading) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      display: 'flex',
      gap: '1rem',
      alignItems: 'center',
      zIndex: 1000,
    }}>
      {location.pathname !== '/leaderboard' && (
        <button 
          onClick={() => navigate('/leaderboard')}
          className="mono" 
          style={{ 
            background: 'rgba(0, 0, 0, 0.8)', 
            color: 'var(--amber)', 
            border: '1px solid var(--amber)', 
            padding: '0.5rem 1rem', 
            cursor: 'pointer', 
            fontWeight: 'bold',
            boxShadow: '0 0 10px rgba(255, 191, 0, 0.2)'
          }}
        >
          [ LEADERBOARD ]
        </button>
      )}

      <div className="mono" style={{
        background: 'rgba(0, 0, 0, 0.8)',
        border: '1px solid var(--green)',
        padding: '0.5rem 1rem',
        color: 'var(--green)',
        fontWeight: 'bold',
        boxShadow: '0 0 10px rgba(0, 255, 0, 0.2)'
      }}>
        [ POINTS: {points} ]
      </div>
    </div>
  );
}
