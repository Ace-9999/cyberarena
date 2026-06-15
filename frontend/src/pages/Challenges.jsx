import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import GlitchLogo from '../components/GlitchLogo';
import TerminalPanel from '../components/TerminalPanel';
import { useInstances } from '../context/InstancesContext';
import { useProgress } from '../context/ProgressContext';

const diffClass = (d) => `diff-badge diff-${(d || 'easy').toLowerCase()}`;

export default function Challenges() {
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const navigate = useNavigate();
  const { instances, deploy, stop } = useInstances();
  const { challenges, solvedList, firstBloods, points, loading } = useProgress();

  useEffect(() => { document.title = 'Cyber Arena | Challenges'; }, []);

  const activeCount = Object.keys(instances).length;
  const categories = useMemo(() => ['ALL', ...new Set(challenges.map(c => c.category))], [challenges]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return challenges.filter(c => {
      const matchCat = category === 'ALL' || c.category === category;
      const matchSearch = !q || c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [challenges, search, category]);

  const totalPoints = useMemo(() => challenges.reduce((s, c) => s + c.points, 0), [challenges]);
  const solvedCount = solvedList.length;
  const pct = challenges.length ? Math.round((solvedCount / challenges.length) * 100) : 0;

  const handleBulkAction = async () => {
    if (bulkProcessing) return;
    setBulkProcessing(true);
    try {
      if (activeCount > 0) {
        await Promise.all(Object.keys(instances).map(id => stop(id)));
      } else {
        const toDeploy = challenges.filter(c => !solvedList.includes(c.id) && !instances[c.id]);
        for (const c of toDeploy) await deploy(c.id);
      }
    } catch (err) {
      console.error('Bulk action error:', err);
      alert('Error during bulk action. Check console.');
    } finally {
      setBulkProcessing(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
      <GlitchLogo text="ACTIVE" highlight="CHALLENGES" size="large" />

      {/* Stats / progress header */}
      <TerminalPanel title="MISSION_STATUS">
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <div className="mono" style={{ display: 'flex', gap: '2rem' }}>
            <div><span style={{ color: 'var(--green)', fontSize: '1.5rem', fontWeight: 'bold' }}>{solvedCount}</span><span style={{ color: 'var(--muted)' }}>/{challenges.length} SOLVED</span></div>
            <div><span style={{ color: 'var(--amber)', fontSize: '1.5rem', fontWeight: 'bold' }}>{points}</span><span style={{ color: 'var(--muted)' }}>/{totalPoints} PTS</span></div>
            <div><span style={{ color: 'var(--red)', fontSize: '1.5rem', fontWeight: 'bold' }}>{firstBloods.length}</span><span style={{ color: 'var(--muted)' }}> FIRST BLOODS</span></div>
          </div>
          <div style={{ flex: '1 1 200px', minWidth: '180px' }}>
            <div style={{ height: '10px', background: 'rgba(57,255,136,0.12)', border: '1px solid var(--green)', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: 'var(--green)', boxShadow: '0 0 10px var(--green)', transition: 'width 0.4s ease' }} />
            </div>
            <div className="mono" style={{ textAlign: 'right', color: 'var(--green)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{pct}% COMPLETE</div>
          </div>
        </div>
      </TerminalPanel>

      {/* Search + category filter */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', margin: '1.5rem 0' }}>
        <input
          className="field mono"
          placeholder="> search challenges..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: '1 1 240px' }}
        />
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="mono"
              style={{
                background: category === cat ? 'var(--green)' : 'transparent',
                color: category === cat ? '#000' : 'var(--green)',
                border: '1px solid var(--green)',
                padding: '0.4rem 0.8rem',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 'bold',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="mono" style={{ textAlign: 'center', color: 'var(--green)', marginTop: '2rem' }}>Loading modules...</div>
      ) : filtered.length === 0 ? (
        <div className="mono" style={{ textAlign: 'center', color: 'var(--muted)', marginTop: '2rem' }}>No challenges match your filter.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {filtered.map(c => {
            const isSolved = solvedList.includes(c.id);
            const isActive = !!instances[c.id];
            const isFirstBlood = firstBloods.includes(c.id);
            return (
              <div key={c.id} className="challenge-card fade-in" style={{ cursor: 'pointer', opacity: isSolved && !isActive ? 0.75 : 1 }} onClick={() => navigate(`/challenges/${c.id}`)}>
                <TerminalPanel title={`${c.id.toUpperCase()}_CHALLENGE`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '0.5rem' }}>
                    <h3 className="mono" style={{ margin: 0, color: 'var(--green)', fontSize: '1.05rem' }}>{c.name}</h3>
                    <span className={diffClass(c.difficulty)}>{c.difficulty}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                    {isActive && <span className="mono" style={{ background: 'var(--amber)', color: '#000', padding: '0.15rem 0.45rem', fontSize: '0.7rem', fontWeight: 'bold' }}>● ACTIVE</span>}
                    {isSolved && <span className="mono" style={{ background: 'var(--green)', color: '#000', padding: '0.15rem 0.45rem', fontSize: '0.7rem', fontWeight: 'bold' }}>✓ SOLVED</span>}
                    {isFirstBlood && <span className="mono first-blood" style={{ padding: '0.15rem 0.45rem', fontSize: '0.7rem', fontWeight: 'bold' }}>🩸 FIRST BLOOD</span>}
                  </div>

                  <div className="mono" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--amber)', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                    <span>CAT: {c.category}</span>
                    <span>PTS: {c.points}</span>
                  </div>
                  <p style={{ margin: 0, minHeight: '3rem', fontSize: '0.9rem', color: 'var(--text)' }}>{c.description}</p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1rem' }}>
                    {isActive ? (
                      <button onClick={(e) => { e.stopPropagation(); stop(c.id); }} className="mono" style={{ background: 'transparent', border: '1px solid var(--red)', color: 'var(--red)', padding: '0.2rem 0.5rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                        [ TERMINATE ]
                      </button>
                    ) : <div />}
                    <div className="mono" style={{ color: 'var(--green)', fontSize: '0.9rem' }}>[ SELECT ] &gt;</div>
                  </div>
                </TerminalPanel>
              </div>
            );
          })}
        </div>
      )}

      {!loading && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2.5rem' }}>
          <button onClick={handleBulkAction} disabled={bulkProcessing} className="mono" style={{
            background: activeCount > 0 ? 'transparent' : 'var(--green)',
            color: activeCount > 0 ? 'var(--red)' : '#000',
            border: activeCount > 0 ? '1px solid var(--red)' : 'none',
            padding: '0.5rem 1.5rem', cursor: bulkProcessing ? 'wait' : 'pointer',
            fontWeight: 'bold', fontSize: '1rem', opacity: bulkProcessing ? 0.5 : 1,
          }}>
            {bulkProcessing ? '[ PROCESSING... ]' : (activeCount > 0 ? '[ TERMINATE ALL ]' : '[ DEPLOY ALL ]')}
          </button>
        </div>
      )}
    </div>
  );
}
