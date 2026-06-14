import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import TerminalPanel from '../components/TerminalPanel';
import GlitchLogo from '../components/GlitchLogo';

export default function Login() {
  useEffect(() => {
    document.title = "Cyber Arena | Authentication";
  }, []);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/login', { username, password });
      if (res.success) {
        login(res.token);
        navigate('/challenges');
      }
    } catch (err) {
      setError('ACCESS DENIED: ' + err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem' }}>
      <GlitchLogo text="CYBER" highlight="ARENA" tagline="AUTHENTICATE TO ACCESS" size="large" />
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <TerminalPanel title="LOGIN_SEQ">
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {error && <div className="mono" style={{ color: 'var(--red)' }}>{error}</div>}
            <div>
              <label className="mono" style={{ display: 'block', color: 'var(--green)', marginBottom: '0.5rem' }}>USERNAME:</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="mono" style={{ width: '100%', background: 'transparent', border: '1px solid var(--green)', color: 'var(--text)', padding: '0.5rem', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <div>
              <label className="mono" style={{ display: 'block', color: 'var(--green)', marginBottom: '0.5rem' }}>PASSWORD:</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="mono" style={{ width: '100%', background: 'transparent', border: '1px solid var(--green)', color: 'var(--text)', padding: '0.5rem', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <button type="submit" className="mono" style={{ background: 'var(--green)', color: 'black', border: 'none', padding: '0.5rem', marginTop: '1rem', cursor: 'pointer', fontWeight: 'bold' }}>[ INITIALIZE SESSION ]</button>
          </form>
        </TerminalPanel>
      </div>
    </div>
  );
}
