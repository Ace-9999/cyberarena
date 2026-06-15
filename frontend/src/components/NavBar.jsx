import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../context/ProgressContext';

const LINKS = [
  { to: '/challenges', label: 'CHALLENGES' },
  { to: '/leaderboard', label: 'LEADERBOARD' },
  { to: '/teams', label: 'TEAM' },
  { to: '/profile', label: 'PROFILE' },
];

export default function NavBar() {
  const { token, user, logout } = useAuth();
  const { points } = useProgress();
  const navigate = useNavigate();
  const location = useLocation();

  // Hidden on the landing + auth pages.
  if (!token || location.pathname === '/' || location.pathname === '/login') return null;

  const isActive = (to) => location.pathname === to || location.pathname.startsWith(to + '/');

  const linkStyle = (active) => ({
    background: active ? 'var(--green)' : 'transparent',
    color: active ? '#000' : 'var(--green)',
    border: '1px solid var(--green)',
    padding: '0.35rem 0.75rem',
    cursor: 'pointer',
    fontSize: '0.78rem',
    fontWeight: 'bold',
    letterSpacing: '0.03em',
  });

  return (
    <nav
      className="mono"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap',
        padding: '0.6rem 1.2rem',
        background: 'rgba(5, 8, 10, 0.97)',
        borderBottom: '1px solid var(--green)',
        boxShadow: '0 2px 14px rgba(0, 0, 0, 0.6)',
      }}
    >
      <div
        onClick={() => navigate('/challenges')}
        style={{ cursor: 'pointer', fontWeight: 'bold', letterSpacing: '0.12em', fontSize: '1.05rem', color: 'var(--text)', whiteSpace: 'nowrap' }}
      >
        CYBER<span style={{ color: 'var(--green)', textShadow: '0 0 10px rgba(57,255,136,0.5)' }}>ARENA</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {LINKS.map((l) => (
          <button key={l.to} onClick={() => navigate(l.to)} style={linkStyle(isActive(l.to))}>
            {l.label === 'PROFILE' ? (user?.username?.toUpperCase() || 'PROFILE') : l.label}
          </button>
        ))}

        <span style={{ border: '1px solid var(--amber)', color: 'var(--amber)', padding: '0.35rem 0.75rem', fontWeight: 'bold', fontSize: '0.78rem' }}>
          {points} PTS
        </span>

        <button
          onClick={() => { logout(); navigate('/login'); }}
          title="Log out"
          style={{ background: 'transparent', border: '1px solid var(--red)', color: 'var(--red)', padding: '0.35rem 0.75rem', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 'bold' }}
        >
          EXIT
        </button>
      </div>
    </nav>
  );
}
