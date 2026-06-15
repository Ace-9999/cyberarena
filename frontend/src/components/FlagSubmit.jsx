import React, { useState } from 'react';
import TerminalPanel from './TerminalPanel';

export default function FlagSubmit({ onSubmit }) {
  const [flag, setFlag] = useState('');
  const [status, setStatus] = useState('idle'); // idle | verifying | correct | incorrect
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!flag.trim() || status === 'verifying') return;
    setStatus('verifying');
    try {
      const res = await onSubmit(flag);
      setResult(res);
      setStatus(res.correct ? 'correct' : 'incorrect');
      if (!res.correct) setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      setResult(null);
      setStatus('incorrect');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const locked = status === 'verifying' || status === 'correct';

  return (
    <TerminalPanel title="SUBMIT_FLAG">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: 'var(--green)' }}>$ submit flag&gt;</span>
          <input
            type="text"
            value={flag}
            onChange={(e) => setFlag(e.target.value)}
            disabled={locked}
            className="mono"
            style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: '1px solid var(--green)', color: 'var(--text)', outline: 'none', padding: '0.2rem' }}
            autoComplete="off"
            spellCheck="false"
            placeholder="HTB{...}"
          />
        </div>

        <div style={{ minHeight: '1.5rem', display: 'flex', alignItems: 'center' }}>
          {status === 'verifying' && <span style={{ color: 'var(--amber)' }}>Verifying...</span>}
          {status === 'correct' && result?.first_blood && (
            <span className="mono first-blood" style={{ padding: '0.3rem 0.8rem', fontWeight: 'bold' }}>
              🩸 FIRST BLOOD! +{result.points_awarded} PTS
            </span>
          )}
          {status === 'correct' && !result?.first_blood && (
            <span style={{ color: 'var(--green)', textShadow: '0 0 10px var(--green)' }}>
              ACCESS GRANTED{result?.points_awarded ? ` +${result.points_awarded} PTS` : ''}
            </span>
          )}
          {status === 'incorrect' && <span style={{ color: 'var(--red)' }}>INCORRECT - TRY AGAIN</span>}
        </div>

        <button type="submit" disabled={locked} className="mono" style={{ alignSelf: 'flex-start', background: 'transparent', border: '1px solid var(--green)', color: 'var(--green)', padding: '0.5rem 1rem', cursor: locked ? 'not-allowed' : 'pointer' }}>
          [ EXECUTE ]
        </button>
      </form>
    </TerminalPanel>
  );
}
