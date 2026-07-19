import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient, BASE_URL } from '../api/client';
import TerminalPanel from '../components/TerminalPanel';
import FlagSubmit from '../components/FlagSubmit';
import { useInstances } from '../context/InstancesContext';
import { useProgress } from '../context/ProgressContext';

export default function ChallengeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { instances, deploy: contextDeploy, stop: contextStop } = useInstances();
  const { challenges, solvedList, firstBloods, markSolved, loading } = useProgress();
  const instance = instances[id];
  const [deploying, setDeploying] = useState(false);

  const challenge = challenges.find(c => c.id === id);
  const solved = solvedList.includes(id);
  const isFirstBlood = firstBloods.includes(id);
  const challengeUrl = instance ? `${BASE_URL}/challenges/${id}/proxy/` : '#';

  useEffect(() => {
    if (challenge) {
      document.title = `Cyber Arena | ${challenge.name}`;
    } else {
      document.title = "Cyber Arena | Challenge";
    }
  }, [challenge]);

  useEffect(() => {
    if (!loading && !challenge) {
      navigate('/challenges');
    }
  }, [loading, challenge, navigate]);

  const deploy = async () => {
    setDeploying(true);
    try {
      await contextDeploy(id);
    } catch (err) {
      alert("Error deploying: " + err.message);
    }
    setDeploying(false);
  };

  const stop = async () => {
    await contextStop(id);
  };

  const restart = async () => {
    await stop();
    await deploy();
  };

  const submitFlag = async (flag) => {
    const res = await apiClient.post(`/challenges/${id}/submit`, { flag });
    if (res.correct) {
      markSolved(id);
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
      <TerminalPanel title={`MODULE_${id.toUpperCase()}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h2 style={{ color: 'var(--green)', marginTop: 0 }}>{challenge.name}</h2>
          {solved && <span className="mono" style={{ background: 'var(--green)', color: 'black', padding: '0.3rem 0.6rem', fontSize: '1rem', fontWeight: 'bold' }}>SOLVED</span>}
        </div>
        <div className="mono" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', color: 'var(--amber)', marginBottom: '1rem' }}>
          <span>CAT: {challenge.category}</span>
          <span>PTS: {challenge.points}</span>
          <span className={`diff-badge diff-${(challenge.difficulty || 'easy').toLowerCase()}`}>{challenge.difficulty}</span>
        </div>
        <p>{challenge.description}</p>

        {solved && (
          <div className="mono" style={{
            marginTop: '1rem',
            padding: '0.8rem 1rem',
            border: '1px solid var(--green)',
            background: 'rgba(57,255,136,0.08)',
            color: 'var(--green)',
            textShadow: '0 0 10px rgba(57,255,136,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}>
            <span>✓ ACCESS GRANTED — YOU HAVE ALREADY CAPTURED THIS FLAG</span>
            {isFirstBlood && (
              <span className="first-blood" style={{ padding: '0.15rem 0.5rem', fontSize: '0.75rem', fontWeight: 'bold' }}>
                🩸 FIRST BLOOD
              </span>
            )}
          </div>
        )}

        {!instance && !deploying && (
          <button onClick={deploy} className="mono" style={{ background: solved ? 'transparent' : 'var(--green)', color: solved ? 'var(--green)' : 'black', border: solved ? '1px solid var(--green)' : 'none', padding: '0.5rem 1rem', marginTop: '1rem', cursor: 'pointer', fontWeight: 'bold' }}>
            {solved ? '[ REDEPLOY TO PRACTICE ]' : '[ DEPLOY INSTANCE ]'}
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
                <p className="mono" style={{ margin: '0 0 1rem 0' }}>TARGET: <a href={challengeUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--green)' }}>{challengeUrl}</a></p>
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
