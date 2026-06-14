import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import TerminalPanel from '../components/TerminalPanel';
import FlagSubmit from '../components/FlagSubmit';

export default function ChallengeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(null);
  const [instance, setInstance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [solved, setSolved] = useState(() => {
    const saved = localStorage.getItem('solved_challenges');
    return saved ? JSON.parse(saved).includes(id) : false;
  });

  const markSolved = () => {
    const saved = localStorage.getItem('solved_challenges');
    const solvedList = saved ? JSON.parse(saved) : [];
    if (!solvedList.includes(id)) {
      solvedList.push(id);
      localStorage.setItem('solved_challenges', JSON.stringify(solvedList));
    }
    setSolved(true);
  };

  useEffect(() => {
    apiClient.get('/challenges')
      .then(data => {
        const found = data.find(c => c.id === id);
        if (found) setChallenge(found);
        else navigate('/challenges');
        setLoading(false);
      })
      .catch(console.error);
  }, [id, navigate]);

  useEffect(() => {
    let interval = null;
    if (instance) {
      interval = setInterval(() => {
        apiClient.post(`/challenges/${id}/heartbeat`, { container_id: instance.container_id })
          .catch(console.error);
      }, 30000); // 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [instance, id]);

  const handleReturn = async () => {
    if (instance) {
      await stop();
    }
    navigate('/challenges');
  };

  const deploy = async () => {
    setDeploying(true);
    try {
      const res = await apiClient.post(`/challenges/${id}/deploy`);
      setInstance(res);
    } catch (err) {
      alert("Error deploying: " + err.message);
    }
    setDeploying(false);
  };

  const stop = async () => {
    if (!instance) return;
    try {
      await apiClient.post(`/challenges/${id}/stop`, { container_id: instance.container_id });
      setInstance(null);
    } catch (err) {
      console.error(err);
    }
  };

  const restart = async () => {
    await stop();
    await deploy();
  };

  const submitFlag = async (flag) => {
    const res = await apiClient.post(`/challenges/${id}/submit`, { flag });
    if (res.correct) {
      markSolved();
      setTimeout(() => {
        stop();
      }, 3000);
    }
    return res;
  };

  if (loading) return <div className="mono" style={{ padding: '2rem', color: 'var(--green)' }}>Loading module data...</div>;
  if (!challenge) return null;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <button onClick={handleReturn} className="mono" style={{ background: 'transparent', border: 'none', color: 'var(--green)', cursor: 'pointer', marginBottom: '1rem' }}>
        &lt; RETURN TO DIRECTORY
      </button>

      <TerminalPanel title={`MODULE_${id.toUpperCase()}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h2 style={{ color: 'var(--green)', marginTop: 0 }}>{challenge.name}</h2>
          {solved && <span className="mono" style={{ background: 'var(--green)', color: 'black', padding: '0.3rem 0.6rem', fontSize: '1rem', fontWeight: 'bold' }}>SOLVED</span>}
        </div>
        <div className="mono" style={{ display: 'flex', gap: '2rem', color: 'var(--amber)', marginBottom: '1rem' }}>
          <span>CAT: {challenge.category}</span>
          <span>PTS: {challenge.points}</span>
        </div>
        <p>{challenge.description}</p>
        
        {!instance && !deploying && (
          <button onClick={deploy} className="mono" style={{ background: 'var(--green)', color: 'black', border: 'none', padding: '0.5rem 1rem', marginTop: '1rem', cursor: 'pointer', fontWeight: 'bold' }}>
            [ DEPLOY INSTANCE ]
          </button>
        )}
        
        {deploying && (
          <div className="mono" style={{ color: 'var(--amber)', marginTop: '1rem' }}>
            Building image and deploying container... please wait.
          </div>
        )}
      </TerminalPanel>

      {instance && (
        <div style={{ marginTop: '2rem' }}>
          <TerminalPanel title="CONNECTION_ESTABLISHED">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p className="mono" style={{ margin: '0 0 1rem 0' }}>TARGET: <a href={`http://localhost:${instance.port}`} target="_blank" rel="noreferrer" style={{ color: 'var(--green)' }}>http://localhost:{instance.port}</a></p>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button onClick={restart} className="mono" style={{ background: 'transparent', border: '1px solid var(--amber)', color: 'var(--amber)', padding: '0.2rem 0.5rem', cursor: 'pointer' }}>[ RESTART ]</button>
                  <button onClick={stop} className="mono" style={{ background: 'transparent', border: '1px solid var(--red)', color: 'var(--red)', padding: '0.2rem 0.5rem', cursor: 'pointer' }}>[ TERMINATE ]</button>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="mono" style={{ color: 'var(--text)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>STATUS</div>
                <div className="mono" style={{ color: 'var(--green)', fontWeight: 'bold' }}>ACTIVE</div>
              </div>
            </div>
          </TerminalPanel>

          {solved ? (
            <TerminalPanel title="SUBMIT_FLAG">
              <div className="mono" style={{ color: 'var(--green)', textShadow: '0 0 10px var(--green)', textAlign: 'center', padding: '2rem' }}>
                [ CHALLENGE ALREADY SOLVED ]
              </div>
            </TerminalPanel>
          ) : (
            <FlagSubmit onSubmit={submitFlag} />
          )}
        </div>
      )}
    </div>
  );
}
