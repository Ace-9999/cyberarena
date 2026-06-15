import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import GlitchLogo from '../components/GlitchLogo';
import TerminalPanel from '../components/TerminalPanel';

export default function Teams() {
  const { user, refreshUser } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [teamName, setTeamName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { document.title = 'Cyber Arena | Team'; }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/teams/me');
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const run = async (fn) => {
    setError('');
    setBusy(true);
    try {
      await fn();
      await refreshUser();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const createTeam = () => run(() => apiClient.post('/teams', { name: teamName.trim() }));
  const joinTeam = () => run(() => apiClient.post('/teams/join', { invite_code: joinCode.trim() }));
  const leaveTeam = () => { if (confirm('Leave this team?')) run(() => apiClient.post('/teams/leave', {})); };

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '2rem' }}>
      <GlitchLogo text="SQUAD" highlight="OPS" size="large" />

      {error && <div className="mono" style={{ color: 'var(--red)', marginBottom: '1rem' }}>&gt; {error}</div>}

      {loading ? (
        <div className="mono" style={{ color: 'var(--green)', textAlign: 'center', padding: '2rem' }}>Loading team data...</div>
      ) : data?.team ? (
        <>
          <TerminalPanel title="TEAM_OVERVIEW">
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
              <div>
                <div className="mono" style={{ color: 'var(--green)', fontSize: '1.6rem', fontWeight: 'bold' }}>{data.team.name}</div>
                <div className="mono" style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
                  INVITE CODE:&nbsp;
                  <span style={{ color: 'var(--cyan)', letterSpacing: '0.15em', cursor: 'pointer' }} title="Click to copy"
                    onClick={() => navigator.clipboard?.writeText(data.team.invite_code)}>
                    {data.team.invite_code}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="mono" style={{ color: 'var(--amber)', fontSize: '2rem', fontWeight: 'bold', lineHeight: 1 }}>{data.total_points}</div>
                <div className="mono" style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>TEAM POINTS</div>
              </div>
            </div>
          </TerminalPanel>

          <TerminalPanel title="MEMBER_CONTRIBUTIONS">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {data.members.map(m => (
                <div key={m.id}>
                  <div className="mono" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                    <span style={{ color: m.id === user?.id ? 'var(--cyan)' : 'var(--text)' }}>
                      {m.username}{m.id === user?.id ? ' (YOU)' : ''}
                    </span>
                    <span style={{ color: 'var(--amber)' }}>{m.points} pts · {m.solves} solves · {m.contribution}%</span>
                  </div>
                  <div style={{ height: '8px', background: 'rgba(57,255,136,0.1)', border: '1px solid rgba(57,255,136,0.3)' }}>
                    <div style={{ width: `${m.contribution}%`, height: '100%', background: m.id === user?.id ? 'var(--cyan)' : 'var(--green)', transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              ))}
            </div>
            <button onClick={leaveTeam} disabled={busy} className="mono" style={{ marginTop: '1.5rem', background: 'transparent', border: '1px solid var(--red)', color: 'var(--red)', padding: '0.4rem 1rem', cursor: 'pointer' }}>
              [ LEAVE TEAM ]
            </button>
          </TerminalPanel>
        </>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <TerminalPanel title="CREATE_TEAM">
            <p className="mono" style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: 0 }}>Form a new squad and get an invite code to share.</p>
            <input className="field mono" placeholder="> team name" value={teamName} onChange={e => setTeamName(e.target.value)} style={{ marginBottom: '1rem' }} />
            <button onClick={createTeam} disabled={busy || teamName.trim().length < 3} className="btn mono" style={{ width: '100%' }}>
              [ CREATE SQUAD ]
            </button>
          </TerminalPanel>

          <TerminalPanel title="JOIN_TEAM">
            <p className="mono" style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: 0 }}>Enter a squad's invite code to join forces.</p>
            <input className="field mono" placeholder="> invite code" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} style={{ marginBottom: '1rem', letterSpacing: '0.15em' }} />
            <button onClick={joinTeam} disabled={busy || !joinCode.trim()} className="btn btn-ghost mono" style={{ width: '100%' }}>
              [ JOIN SQUAD ]
            </button>
          </TerminalPanel>
        </div>
      )}
    </div>
  );
}
