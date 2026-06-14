import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import GlitchLogo from '../components/GlitchLogo';
import TerminalPanel from '../components/TerminalPanel';

export default function Challenges() {
  const [challenges, setChallenges] = useState([]);
  const [solvedList, setSolvedList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('solved_challenges');
    if (saved) setSolvedList(JSON.parse(saved));

    apiClient.get('/challenges')
      .then(data => {
        setChallenges(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <GlitchLogo text="ACTIVE" highlight="CHALLENGES" size="large" />
      
      {loading ? (
        <div className="mono" style={{ textAlign: 'center', color: 'var(--green)', marginTop: '2rem' }}>Loading modules...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {challenges.map(c => {
            const isSolved = solvedList.includes(c.id);
            return (
            <div key={c.id} className="challenge-card" style={{ cursor: 'pointer', opacity: isSolved ? 0.7 : 1 }} onClick={() => navigate(`/challenges/${c.id}`)}>
              <TerminalPanel title={`${c.id.toUpperCase()}_CHALLENGE`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <h3 className="mono" style={{ margin: 0, color: 'var(--green)' }}>{c.name}</h3>
                  {isSolved && <span className="mono" style={{ background: 'var(--green)', color: 'black', padding: '0.2rem 0.5rem', fontSize: '0.8rem', fontWeight: 'bold' }}>SOLVED</span>}
                </div>
                <div className="mono" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--amber)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                  <span>CAT: {c.category}</span>
                  <span>PTS: {c.points}</span>
                </div>
                <p style={{ margin: 0, minHeight: '3rem' }}>{c.description}</p>
                <div className="mono" style={{ marginTop: 'auto', color: 'var(--green)', textAlign: 'right', fontSize: '0.9rem', paddingTop: '1rem' }}>
                  [ SELECT ] &gt;
                </div>
              </TerminalPanel>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
