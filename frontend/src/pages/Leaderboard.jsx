import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GlitchLogo from '../components/GlitchLogo';
import TerminalPanel from '../components/TerminalPanel';
import { BarChart, Bar, LineChart, Line, CartesianGrid, Legend, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useProgress } from '../context/ProgressContext';

export default function Leaderboard() {
  const navigate = useNavigate();
  const { challenges, solvedList, points: myPoints, loading } = useProgress();

  useEffect(() => {
    document.title = "Cyber Arena | Leaderboard";
  }, []);

  if (loading) return <div className="mono" style={{ padding: '2rem', color: 'var(--green)' }}>Loading analytics...</div>;

  // Simulated leaderboard data
  const botsData = {
    n30: 450,
    trin1ty: 300,
    zer0_c00l: 250,
    acid_burn: 150,
    crash_override: 50,
  };

  const bots = [
    { name: 'n30', points: botsData.n30 },
    { name: 'trin1ty', points: botsData.trin1ty },
    { name: 'zer0_c00l', points: botsData.zer0_c00l },
    { name: 'acid_burn', points: botsData.acid_burn },
    { name: 'crash_override', points: botsData.crash_override },
  ];

  const leaderboardData = [
    { name: 'admin (YOU)', points: myPoints, isUser: true },
    ...bots
  ].sort((a, b) => b.points - a.points);

  const colors = {
    'admin (YOU)': 'var(--amber)',
    'n30': '#ff00ff',
    'trin1ty': '#00ffff',
    'zer0_c00l': '#00ff00',
    'acid_burn': '#ffcc00',
    'crash_override': '#ff3333'
  };

  // Generate 5 previous points interpolating from 0 to final
  const timeData = [0, 1, 2, 3, 4, 5].map(step => {
    const fraction = step / 5;
    return {
      name: `T-${5 - step}`,
      'admin (YOU)': Math.round(myPoints * fraction),
      'n30': Math.max(0, Math.round(botsData.n30 * fraction * (0.8 + Math.random() * 0.4))),
      'trin1ty': Math.max(0, Math.round(botsData.trin1ty * fraction * (0.8 + Math.random() * 0.4))),
      'zer0_c00l': Math.max(0, Math.round(botsData.zer0_c00l * fraction * (0.8 + Math.random() * 0.4))),
      'acid_burn': Math.max(0, Math.round(botsData.acid_burn * fraction * (0.8 + Math.random() * 0.4))),
      'crash_override': Math.max(0, Math.round(botsData.crash_override * fraction * (0.8 + Math.random() * 0.4))),
    };
  });
  
  // Fix the final point to exactly the current points
  timeData[5] = {
    name: 'NOW',
    'admin (YOU)': myPoints,
    'n30': botsData.n30,
    'trin1ty': botsData.trin1ty,
    'zer0_c00l': botsData.zer0_c00l,
    'acid_burn': botsData.acid_burn,
    'crash_override': botsData.crash_override,
  };

  // Chart data: Points by Category for the user
  const categories = [...new Set(challenges.map(c => c.category))];
  const chartData = categories.map(cat => {
    const earned = challenges
      .filter(c => c.category === cat && solvedList.includes(c.id))
      .reduce((sum, c) => sum + c.points, 0);
    const total = challenges
      .filter(c => c.category === cat)
      .reduce((sum, c) => sum + c.points, 0);
    return { category: cat, earned, total };
  });

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <button onClick={() => navigate('/challenges')} className="mono" style={{ background: 'transparent', border: 'none', color: 'var(--green)', cursor: 'pointer', marginBottom: '1rem' }}>
        &lt; RETURN TO DIRECTORY
      </button>

      <GlitchLogo text="GLOBAL" highlight="LEADERBOARD" size="large" />

      {/* Arena Overview Graph (Top) */}
      <div style={{ marginTop: '2rem' }}>
        <TerminalPanel title="ARENA_OVERVIEW">
          <h3 className="mono" style={{ color: 'var(--amber)', marginTop: 0, textAlign: 'center', marginBottom: '1.5rem' }}>Global Standings</h3>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="name" stroke="var(--green)" tick={{ fill: 'var(--green)' }} />
                <YAxis stroke="var(--green)" tick={{ fill: 'var(--green)' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'black', border: '1px solid var(--green)', color: 'var(--green)' }} 
                />
                <Legend wrapperStyle={{ color: 'var(--text)' }} />
                <Line type="monotone" dataKey="admin (YOU)" stroke={colors['admin (YOU)']} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="n30" stroke={colors['n30']} strokeWidth={2} />
                <Line type="monotone" dataKey="trin1ty" stroke={colors['trin1ty']} strokeWidth={2} />
                <Line type="monotone" dataKey="zer0_c00l" stroke={colors['zer0_c00l']} strokeWidth={2} />
                <Line type="monotone" dataKey="acid_burn" stroke={colors['acid_burn']} strokeWidth={2} />
                <Line type="monotone" dataKey="crash_override" stroke={colors['crash_override']} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </TerminalPanel>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '2rem' }}>
        {/* Leaderboard Table (Middle/Left) */}
        <div style={{ flex: '1 1 300px' }}>
          <TerminalPanel title="RANKINGS">
            <table className="mono" style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--green)', color: 'var(--green)' }}>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>RANK</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>HACKER</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem' }}>SCORE</th>
                </tr>
              </thead>
              <tbody>
                {leaderboardData.map((row, idx) => (
                  <tr key={row.name} style={{ background: row.isUser ? 'rgba(0, 255, 0, 0.1)' : 'transparent', fontWeight: row.isUser ? 'bold' : 'normal', color: row.isUser ? 'var(--green)' : 'inherit' }}>
                    <td style={{ padding: '0.5rem' }}>{idx + 1}</td>
                    <td style={{ padding: '0.5rem' }}>{row.name}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>{row.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TerminalPanel>
        </div>

        {/* Analytics Graph (Middle/Right) */}
        <div style={{ flex: '1 1 300px' }}>
          <TerminalPanel title="YOUR_ANALYTICS">
            <h3 className="mono" style={{ color: 'var(--amber)', marginTop: 0, textAlign: 'center', marginBottom: '1.5rem' }}>Points by Category</h3>
            <div style={{ height: '250px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="category" stroke="var(--green)" tick={{ fill: 'var(--green)' }} />
                  <YAxis stroke="var(--green)" tick={{ fill: 'var(--green)' }} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(0, 255, 0, 0.1)' }} 
                    contentStyle={{ backgroundColor: 'black', border: '1px solid var(--green)', color: 'var(--green)' }} 
                    itemStyle={{ color: 'var(--green)' }}
                  />
                  <Bar dataKey="earned" name="Points Earned">
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="var(--green)" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mono" style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text)', fontSize: '1rem' }}>
              Total Points: <span style={{ color: 'var(--green)', fontWeight: 'bold', fontSize: '1.2rem' }}>{myPoints}</span>
            </div>
          </TerminalPanel>
        </div>
      </div>
    </div>
  );
}
