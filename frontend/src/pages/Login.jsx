import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TerminalPanel from '../components/TerminalPanel';
import GlitchLogo from '../components/GlitchLogo';

const EyeIcon = ({ open }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {open ? (
      <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
    ) : (
      <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></>
    )}
  </svg>
);

export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Cyber Arena | Authentication';
  }, []);

  const isRegister = mode === 'register';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      if (isRegister) {
        await register(username.trim(), password);
      } else {
        await login(username.trim(), password);
      }
      navigate('/challenges');
    } catch (err) {
      setError((isRegister ? 'REGISTRATION FAILED: ' : 'ACCESS DENIED: ') + err.message);
    } finally {
      setBusy(false);
    }
  };

  const switchMode = () => {
    setMode(isRegister ? 'login' : 'register');
    setError('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem' }}>
      <GlitchLogo text="CYBER" highlight="ARENA" tagline={isRegister ? 'CREATE OPERATOR PROFILE' : 'AUTHENTICATE TO ACCESS'} size="large" />

      <div style={{ width: '100%', maxWidth: '420px' }} className="fade-in">
        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
          {['login', 'register'].map(m => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError(''); }}
              className="mono"
              style={{
                flex: 1,
                background: mode === m ? 'var(--green)' : 'transparent',
                color: mode === m ? '#000' : 'var(--green)',
                border: '1px solid var(--green)',
                padding: '0.5rem',
                cursor: 'pointer',
                fontWeight: 'bold',
                letterSpacing: '0.05em',
              }}
            >
              {m === 'login' ? '[ LOGIN ]' : '[ REGISTER ]'}
            </button>
          ))}
        </div>

        <TerminalPanel title={isRegister ? 'REGISTER_SEQ' : 'LOGIN_SEQ'}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {error && <div className="mono" style={{ color: 'var(--red)', fontSize: '0.85rem' }}>&gt; {error}</div>}

            <div>
              <label className="mono" style={{ display: 'block', color: 'var(--green)', marginBottom: '0.4rem', fontSize: '0.85rem' }}>USERNAME:</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="field mono"
                autoComplete="username"
                autoFocus
              />
            </div>

            <div>
              <label className="mono" style={{ display: 'block', color: 'var(--green)', marginBottom: '0.4rem', fontSize: '0.85rem' }}>PASSWORD:</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="field mono"
                  style={{ paddingRight: '2.5rem' }}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '0.5rem', cursor: 'pointer', display: 'flex' }}
                  title={showPassword ? 'Hide' : 'Show'}
                >
                  <EyeIcon open={showPassword} />
                </span>
              </div>
              {isRegister && (
                <span className="mono" style={{ color: 'var(--muted)', fontSize: '0.72rem', marginTop: '0.3rem', display: 'block' }}>
                  min 3 char username, 6 char password
                </span>
              )}
            </div>

            <button type="submit" disabled={busy} className="btn mono" style={{ marginTop: '0.5rem' }}>
              {busy ? '[ PROCESSING... ]' : (isRegister ? '[ CREATE ACCOUNT ]' : '[ INITIALIZE SESSION ]')}
            </button>
          </form>
        </TerminalPanel>

        <p className="mono" style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.8rem', marginTop: '1rem' }}>
          {isRegister ? 'Already enrolled?' : 'New operator?'}{' '}
          <span onClick={switchMode} style={{ color: 'var(--green)', cursor: 'pointer', textDecoration: 'underline' }}>
            {isRegister ? 'Log in' : 'Register here'}
          </span>
        </p>
      </div>
    </div>
  );
}
