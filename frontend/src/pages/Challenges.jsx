import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import GlitchLogo from '../components/GlitchLogo';
import TerminalPanel from '../components/TerminalPanel';
import { useInstances } from '../context/InstancesContext';
import { useProgress } from '../context/ProgressContext';

export default function Challenges() {
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const navigate = useNavigate();
  const { instances, deploy, stop } = useInstances();
  const { challenges, solvedList, loading } = useProgress();

  useEffect(() => {
    document.title = "Cyber Arena | Challenges";
  }, []);


  const activeCount = Object.keys(instances).length;

  const handleBulkAction = async () => {
    if (bulkProcessing) return;
    setBulkProcessing(true);
    try {
      if (activeCount > 0) {
        // Terminate all
        await Promise.all(Object.keys(instances).map(id => stop(id)));
      } else {
        // Deploy all unsolved
        const toDeploy = challenges.filter(c => !solvedList.includes(c.id) && !instances[c.id]);
        for (const c of toDeploy) {
          await deploy(c.id);
        }
      }
    } catch (err) {
      console.error("Bulk action error:", err);
      alert("Error during bulk action. Check console.");
    } finally {
      setBulkProcessing(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '2rem' }}>
        <GlitchLogo text="ACTIVE" highlight="CHALLENGES" size="large" />
      </div>

      {loading ? (
        <div className="mono" style={{ textAlign: 'center', color: 'var(--green)', marginTop: '2rem' }}>Loading modules...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {challenges.map(c => {
            const isSolved = solvedList.includes(c.id);
            const isActive = !!instances[c.id];
            return (
              <div key={c.id} className="challenge-card" style={{ cursor: 'pointer', opacity: isSolved && !isActive ? 0.7 : 1 }} onClick={() => navigate(`/challenges/${c.id}`)}>
                <TerminalPanel title={`${c.id.toUpperCase()}_CHALLENGE`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <h3 className="mono" style={{ margin: 0, color: 'var(--green)' }}>{c.name}</h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {isActive && <span className="mono" style={{ background: 'var(--amber)', color: 'black', padding: '0.2rem 0.5rem', fontSize: '0.8rem', fontWeight: 'bold' }}>ACTIVE</span>}
                      {isSolved && <span className="mono" style={{ background: 'var(--green)', color: 'black', padding: '0.2rem 0.5rem', fontSize: '0.8rem', fontWeight: 'bold' }}>SOLVED</span>}
                    </div>
                  </div>
                  <div className="mono" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--amber)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    <span>CAT: {c.category}</span>
                    <span>PTS: {c.points}</span>
                  </div>
                  <p style={{ margin: 0, minHeight: '3rem' }}>{c.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1rem' }}>
                    {isActive ? (
                      <button onClick={(e) => { e.stopPropagation(); stop(c.id); }} className="mono" style={{ background: 'transparent', border: '1px solid var(--red)', color: 'var(--red)', padding: '0.2rem 0.5rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                        [ TERMINATE ]
                      </button>
                    ) : (
                      <div />
                    )}
                    <div className="mono" style={{ color: 'var(--green)', fontSize: '0.9rem' }}>
                      [ SELECT ] &gt;
                    </div>
                  </div>
                </TerminalPanel>
              </div>
            );
          })}
        </div>
      )}

      {!loading && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2.5rem' }}>
          <button 
            onClick={handleBulkAction}
            disabled={bulkProcessing}
            className="mono" 
            style={{ 
              background: activeCount > 0 ? 'transparent' : 'var(--green)', 
              color: activeCount > 0 ? 'var(--red)' : 'black', 
              border: activeCount > 0 ? '1px solid var(--red)' : 'none', 
              padding: '0.5rem 1.5rem', 
              cursor: bulkProcessing ? 'wait' : 'pointer', 
              fontWeight: 'bold',
              fontSize: '1rem',
              opacity: bulkProcessing ? 0.5 : 1
            }}
          >
            {bulkProcessing ? '[ PROCESSING... ]' : (activeCount > 0 ? '[ TERMINATE ALL ]' : '[ DEPLOY ALL ]')}
          </button>
        </div>
      )}
    </div>
  );
}
