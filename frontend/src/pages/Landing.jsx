import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GlitchLogo from '../components/GlitchLogo';
import Ticker from '../components/Ticker';

export default function Landing() {
  useEffect(() => {
    document.title = "Cyber Arena | Welcome";
  }, []);
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <GlitchLogo text="CYBER" highlight="ARENA" tagline="CAPTURE THE FLAG PLATFORM" size="large" />
        
        <p className="mono" style={{ maxWidth: '600px', textAlign: 'center', margin: '2rem 0', lineHeight: 1.6 }}>
          Welcome to the Arena. An isolated, on-demand Dockerized environment for testing your penetration testing skills. Deploy instances, find the flags, and dominate the leaderboard.
        </p>

        <button 
          onClick={() => navigate('/login')} 
          className="mono" 
          style={{ background: 'var(--green)', color: 'black', border: 'none', padding: '1rem 2rem', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 'bold' }}
        >
          [ ENTER THE ARENA ]
        </button>
      </div>

      <Ticker items={['SQL INJECTION MODULE ONLINE', 'COOKIE TAMPERING DETECTED', 'IDOR VULNERABILITIES ACTIVE', 'CRYPTOGRAPHY CHALLENGES AWAIT']} />
    </div>
  );
}
