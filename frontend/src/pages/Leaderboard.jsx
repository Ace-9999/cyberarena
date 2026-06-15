import React, { useEffect, useState, useCallback } from 'react';
import GlitchLogo from '../components/GlitchLogo';
import TerminalPanel from '../components/TerminalPanel';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { supabase, hasRealtime } from '../api/supabase';

const fmtTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function Leaderboard() {
  const { user } = useAuth();
  const [data, setData] = useState({ teams: [], users: [], recent: [] });
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);

  useEffect(() => { document.title = 'Cyber Arena | Leaderboard'; }, []);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get('/leaderboard');
      setData(res);
    } catch (err) {
      console.error('Leaderboard load failed', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Live updates: refetch whenever a new solve lands.
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel('solves-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'solves' }, () => load())
      .subscribe((status) => setLive(status === 'SUBSCRIBED'));
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  if (loading) return <div className="mono" style={{ padding: '5rem 2rem', color: 'var(--green)', textAlign: 'center' }}>Loading analytics...</div>;

  const teamChart = data.teams.slice(0, 6).map(t => ({ name: t.name, points: t.points }));
  const hasData = data.teams.length > 0 || data.users.length > 0;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <GlitchLogo text="GLOBAL" highlight="LEADERBOARD" size="large" />
      </div>
      <div style={{ textAlign: 'center', marginTop: '-1rem', marginBottom: '1rem' }}>
        <span className="mono" style={{ fontSize: '0.75rem', color: live ? 'var(--green)' : 'var(--muted)', border: `1px solid ${live ? 'var(--green)' : 'var(--muted)'}`, padding: '0.2rem 0.6rem' }}>
          {live ? '● LIVE' : (hasRealtime ? '○ CONNECTING...' : '○ STATIC (set VITE_SUPABASE_ANON_KEY for live)')}
        </span>
      </div>

      {!hasData ? (
        <TerminalPanel title="STANDINGS">
          <div className="mono" style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>
            No scores yet. Be the first to capture a flag. 🩸
          </div>
        </TerminalPanel>
      ) : (
        <>
          {teamChart.length > 0 && (
            <TerminalPanel title="TEAM_STANDINGS">
              <div style={{ height: '260px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="var(--green)" tick={{ fill: 'var(--green)', fontSize: 12 }} />
                    <YAxis stroke="var(--green)" tick={{ fill: 'var(--green)' }} />
                    <Tooltip cursor={{ fill: 'rgba(57,255,136,0.1)' }} contentStyle={{ backgroundColor: '#000', border: '1px solid var(--green)', color: 'var(--green)' }} />
                    <Bar dataKey="points">
                      {teamChart.map((entry, i) => (
                        <Cell key={i} fill={entry.name === data.teams[0]?.name ? 'var(--amber)' : 'var(--green)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TerminalPanel>
          )}

          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {/* Team rankings */}
            <div style={{ flex: '1 1 320px' }}>
              <TerminalPanel title="TEAM_RANKINGS">
                {data.teams.length === 0 ? (
                  <div className="mono" style={{ color: 'var(--muted)', textAlign: 'center', padding: '1rem' }}>No teams yet.</div>
                ) : (
                  <table className="lb mono">
                    <thead><tr><th>#</th><th>SQUAD</th><th style={{ textAlign: 'right' }}>PTS</th></tr></thead>
                    <tbody>
                      {data.teams.map((t, i) => {
                        const mine = user?.team_id && t.team_id === user.team_id;
                        return (
                          <tr key={t.team_id} style={{ background: mine ? 'rgba(0,229,255,0.1)' : 'transparent', color: mine ? 'var(--cyan)' : 'inherit' }}>
                            <td>{i + 1}</td>
                            <td>{t.name} <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>({t.members})</span></td>
                            <td style={{ textAlign: 'right', color: 'var(--amber)' }}>{t.points}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </TerminalPanel>
            </div>

            {/* Individual rankings */}
            <div style={{ flex: '1 1 320px' }}>
              <TerminalPanel title="OPERATIVE_RANKINGS">
                <table className="lb mono">
                  <thead><tr><th>#</th><th>HACKER</th><th style={{ textAlign: 'right' }}>PTS</th></tr></thead>
                  <tbody>
                    {data.users.map((u, i) => {
                      const mine = u.user_id === user?.id;
                      return (
                        <tr key={u.user_id} style={{ background: mine ? 'rgba(57,255,136,0.12)' : 'transparent', fontWeight: mine ? 'bold' : 'normal', color: mine ? 'var(--green)' : 'inherit' }}>
                          <td>{i + 1}</td>
                          <td>{u.username}{mine ? ' (YOU)' : ''}{u.team_name ? <span style={{ color: 'var(--muted)', fontSize: '0.72rem' }}> · {u.team_name}</span> : ''}</td>
                          <td style={{ textAlign: 'right', color: 'var(--amber)' }}>{u.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </TerminalPanel>
            </div>
          </div>

          {/* Recent activity feed */}
          <TerminalPanel title="LIVE_FEED">
            {data.recent.length === 0 ? (
              <div className="mono" style={{ color: 'var(--muted)', textAlign: 'center', padding: '1rem' }}>No activity yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {data.recent.map((r, i) => (
                  <div key={i} className="mono" style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                    <span>
                      {r.first_blood && <span title="First blood">🩸 </span>}
                      <span style={{ color: 'var(--cyan)' }}>{r.username}</span>
                      <span style={{ color: 'var(--muted)' }}> solved </span>
                      <span style={{ color: 'var(--green)' }}>{r.challenge}</span>
                      {r.first_blood && <span className="first-blood" style={{ marginLeft: '0.5rem', padding: '0 0.4rem', fontSize: '0.7rem' }}>FIRST BLOOD</span>}
                    </span>
                    <span style={{ color: 'var(--amber)', whiteSpace: 'nowrap' }}>+{r.points} · {fmtTime(r.solved_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </TerminalPanel>
        </>
      )}
    </div>
  );
}
