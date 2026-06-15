import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../context/ProgressContext';
import TerminalPanel from '../components/TerminalPanel';
import GlitchLogo from '../components/GlitchLogo';

const RANK_THRESHOLDS = [
  { min: 8, label: 'ELITE' },
  { min: 5, label: 'ADVANCED' },
  { min: 2, label: 'OPERATOR' },
  { min: 0, label: 'RECRUIT' },
];

export default function Profile() {
  useEffect(() => { document.title = 'Cyber Arena | User Profile'; }, []);

  const { user, updateProfile } = useAuth();
  const { points, solvedList, firstBloods } = useProgress();

  const [formData, setFormData] = useState({ username: '', dp: '', bio: '' });
  const [dpMode, setDpMode] = useState('file');
  const [dpUrl, setDpUrl] = useState('');
  const [message, setMessage] = useState({ text: '', ok: true });
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef(null);

  // Hydrate the form once the user loads.
  useEffect(() => {
    if (user) {
      setFormData({ username: user.username || '', dp: user.dp || '', bio: user.bio || '' });
      if (user.dp && !user.dp.startsWith('data:')) { setDpMode('url'); setDpUrl(user.dp); }
    }
  }, [user]);

  const rank = RANK_THRESHOLDS.find(r => solvedList.length >= r.min)?.label || 'RECRUIT';

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setFormData(prev => ({ ...prev, dp: reader.result }));
    reader.readAsDataURL(file);
  };

  const applyUrl = () => { const u = dpUrl.trim(); if (u) setFormData(prev => ({ ...prev, dp: u })); };
  const clearDp = () => { setFormData(prev => ({ ...prev, dp: '' })); setDpUrl(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await updateProfile(formData);
      setMessage({ text: 'PROFILE COMMITTED SUCCESSFULLY', ok: true });
    } catch (err) {
      setMessage({ text: err.message, ok: false });
    } finally {
      setBusy(false);
      setTimeout(() => setMessage({ text: '', ok: true }), 3000);
    }
  };

  if (!user) return <div className="mono" style={{ padding: '5rem', textAlign: 'center', color: 'var(--green)' }}>Loading profile...</div>;

  const dpIsBase64 = formData.dp?.startsWith('data:');

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <GlitchLogo text="USER" highlight="PROFILE" size="large" />

      {/* Dossier */}
      <TerminalPanel title="OPERATOR_DOSSIER">
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: '100px', height: '100px', border: '2px solid var(--green)', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(57,255,136,0.05)', boxShadow: '0 0 20px rgba(57,255,136,0.25)' }}>
            {user.dp ? <img src={user.dp} alt="DP" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
              : <span className="mono" style={{ color: 'var(--green)', fontSize: '0.65rem' }}>NO DP</span>}
          </div>
          <div className="mono" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1, minWidth: '200px' }}>
            <div style={{ color: 'var(--green)', fontSize: '1.3rem', fontWeight: 'bold', letterSpacing: '0.05em' }}>{user.username}</div>
            <div style={{ color: 'var(--text)', fontSize: '0.82rem' }}><span style={{ color: 'var(--amber)' }}>REG#</span>&nbsp;&nbsp;{user.reg_no}</div>
            <div style={{ color: 'var(--text)', fontSize: '0.82rem' }}><span style={{ color: 'var(--amber)' }}>RANK</span>&nbsp;&nbsp;{rank}</div>
            {user.bio && <div style={{ color: '#888', fontSize: '0.78rem', marginTop: '0.2rem', fontStyle: 'italic', whiteSpace: 'pre-line' }}>{user.bio}</div>}
            <div style={{ display: 'flex', gap: '2.5rem', marginTop: '0.6rem' }}>
              <div><div style={{ color: 'var(--green)', fontSize: '1.6rem', fontWeight: 'bold', lineHeight: 1 }}>{points}</div><div style={{ color: '#666', fontSize: '0.72rem', marginTop: '0.2rem' }}>POINTS</div></div>
              <div><div style={{ color: 'var(--green)', fontSize: '1.6rem', fontWeight: 'bold', lineHeight: 1 }}>{solvedList.length}</div><div style={{ color: '#666', fontSize: '0.72rem', marginTop: '0.2rem' }}>SOLVED</div></div>
              <div><div style={{ color: 'var(--red)', fontSize: '1.6rem', fontWeight: 'bold', lineHeight: 1 }}>{firstBloods.length}</div><div style={{ color: '#666', fontSize: '0.72rem', marginTop: '0.2rem' }}>1ST BLOOD</div></div>
            </div>
          </div>
        </div>
      </TerminalPanel>

      {/* Edit form */}
      <TerminalPanel title="PROFILE_EDIT">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {message.text && (
            <div className="mono" style={{ color: message.ok ? 'var(--green)' : 'var(--red)', padding: '0.5rem 0.8rem', border: `1px solid ${message.ok ? 'var(--green)' : 'var(--red)'}`, background: message.ok ? 'rgba(57,255,136,0.05)' : 'rgba(255,51,51,0.05)' }}>
              &gt;&nbsp;{message.text}
            </div>
          )}

          <div>
            <label className="mono" style={{ display: 'block', color: 'var(--amber)', marginBottom: '0.4rem', fontSize: '0.82rem' }}>REG# (IMMUTABLE):</label>
            <input type="text" value={user.reg_no || ''} readOnly className="mono" style={{ width: '100%', background: 'rgba(255,176,0,0.04)', border: '1px solid var(--amber)', color: 'var(--amber)', padding: '0.5rem', boxSizing: 'border-box', outline: 'none', cursor: 'not-allowed', opacity: 0.75 }} />
          </div>

          <div>
            <label className="mono" style={{ display: 'block', color: 'var(--green)', marginBottom: '0.4rem', fontSize: '0.82rem' }}>CALLSIGN (USERNAME):</label>
            <input type="text" name="username" value={formData.username} onChange={handleChange} maxLength={32} className="field mono" />
          </div>

          <div>
            <label className="mono" style={{ display: 'block', color: 'var(--green)', marginBottom: '0.6rem', fontSize: '0.82rem' }}>DISPLAY PICTURE:</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.8rem' }}>
              {['file', 'url'].map(m => (
                <button key={m} type="button" onClick={() => setDpMode(m)} className="mono" style={{ background: dpMode === m ? 'var(--green)' : 'transparent', color: dpMode === m ? '#000' : 'var(--green)', border: '1px solid var(--green)', padding: '0.3rem 0.9rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: dpMode === m ? 'bold' : 'normal' }}>
                  [ {m.toUpperCase()} ]
                </button>
              ))}
            </div>
            {dpMode === 'file' ? (
              <>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="mono" style={{ background: 'transparent', border: '1px dashed var(--green)', color: 'var(--green)', padding: '0.8rem', cursor: 'pointer', width: '100%' }}>
                  [ CLICK TO SELECT IMAGE FILE ]
                </button>
                {dpIsBase64 && <span className="mono" style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.4rem', display: 'block' }}>Image loaded &mdash; {Math.round(formData.dp.length / 1024)} KB</span>}
              </>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="text" placeholder="https://example.com/avatar.png" value={dpUrl} onChange={e => setDpUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), applyUrl())} className="field mono" style={{ flex: 1 }} />
                <button type="button" onClick={applyUrl} className="btn mono" style={{ whiteSpace: 'nowrap' }}>[ APPLY ]</button>
              </div>
            )}
            {formData.dp && (
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.75rem' }}>
                <img src={formData.dp} alt="Preview" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '50%', border: '1px solid var(--green)' }} onError={e => { e.target.style.opacity = '0.2'; }} />
                <span className="mono" style={{ color: '#888', fontSize: '0.78rem' }}>Preview</span>
                <button type="button" onClick={clearDp} className="mono" style={{ background: 'transparent', border: '1px solid var(--red)', color: 'var(--red)', padding: '0.25rem 0.7rem', cursor: 'pointer', fontSize: '0.78rem' }}>[ CLEAR ]</button>
              </div>
            )}
          </div>

          <div>
            <label className="mono" style={{ display: 'block', color: 'var(--green)', marginBottom: '0.4rem', fontSize: '0.82rem' }}>BIO / PERSONAL DETAILS:</label>
            <textarea name="bio" value={formData.bio} onChange={handleChange} className="field mono" rows={4} placeholder="Bio, skills, social links..." style={{ resize: 'vertical' }} />
          </div>

          <button type="submit" disabled={busy} className="btn mono" style={{ fontSize: '1rem' }}>
            {busy ? '[ COMMITTING... ]' : '[ COMMIT CHANGES ]'}
          </button>
        </form>
      </TerminalPanel>
    </div>
  );
}
