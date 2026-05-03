import { useState, useEffect, useRef } from 'react';
import { db, hasFirebaseConfig } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

export default function SharedWhiteboard({ activeProfile }) {
  const [content, setContent] = useState('');
  const [meta, setMeta] = useState({ by: '', at: '' });
  const [syncing, setSyncing] = useState(false);
  const debounceRef = useRef(null);
  const localRef = useRef('');

  useEffect(() => {
    if (!hasFirebaseConfig || !db) {
      const saved = localStorage.getItem('hdp_whiteboard');
      if (saved) {
        const { text, by, at } = JSON.parse(saved);
        setContent(text || '');
        setMeta({ by, at });
      }
      return;
    }

    const wRef = doc(db, 'planner', 'whiteboard');
    const unsub = onSnapshot(wRef, snap => {
      if (snap.exists()) {
        const d = snap.data();
        // Only update if content differs from what we typed (avoid cursor jump)
        if (d.text !== localRef.current) {
          setContent(d.text || '');
        }
        setMeta({ by: d.by || '', at: d.at || '' });
      }
    });
    return () => unsub();
  }, []);

  const handleChange = (e) => {
    const text = e.target.value;
    setContent(text);
    localRef.current = text;

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveBoard(text);
    }, 800);
  };

  const saveBoard = async (text) => {
    setSyncing(true);
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const by = activeProfile?.name || 'Someone';
    const payload = { text, by, at: now };

    if (hasFirebaseConfig && db) {
      await setDoc(doc(db, 'planner', 'whiteboard'), payload, { merge: true });
    } else {
      localStorage.setItem('hdp_whiteboard', JSON.stringify(payload));
    }
    setMeta({ by, at: now });
    setSyncing(false);
  };

  const clearBoard = () => {
    setContent('');
    localRef.current = '';
    saveBoard('');
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <div className="sl" >
        <span className="sli">🖊️</span>
        <h3>Shared Whiteboard</h3>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {syncing && <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>⏳ Syncing...</span>}
          {meta.by && !syncing && (
            <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>✓ {meta.by} · {meta.at}</span>
          )}
          <button
            onClick={() => {
              const text = "Let's use our Shared Whiteboard! 📝✨\n" + window.location.origin;
              if (navigator.share) {
                navigator.share({
                  title: 'Shared Whiteboard',
                  text: text,
                }).catch(console.error);
              } else {
                navigator.clipboard.writeText(text);
                alert('Link copied to clipboard! 📋');
              }
            }}
            style={{ background: 'var(--primary-container)', color: 'var(--primary)', border: 'none', borderRadius: '10px', padding: '4px 10px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
          >
            Share Link
          </button>
          <button
            onClick={clearBoard}
            style={{ background: '#ff444422', color: '#ff4444', border: 'none', borderRadius: '10px', padding: '4px 10px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
          >
            Clear
          </button>
        </div>
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.6)',
        border: '1.5px solid var(--glass-border)',
        borderRadius: '16px',
        overflow: 'hidden',
        backdropFilter: 'blur(8px)',
        margin:'10px'
      }}>
        <div style={{ padding: '10px 14px 4px', borderBottom: '1px solid var(--glass-border)', fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600 }}>
          📡 Both of you edit this in real-time — formulas, reminders, anything!
        </div>
        <textarea
          value={content}
          onChange={handleChange}
          placeholder={`Write shared notes here... 📝\n\nFormulas, reminders, quick ideas — anything you both need!\n\nExample:\n• Physics: F = ma\n• Tomorrow: Submit assignment by 5pm\n• Study plan: Chapter 4 tonight`}
          style={{
            width: '100%',
            minHeight: '180px',
            border: 'none',
            background: 'transparent',
            resize: 'vertical',
            padding: '14px',
            fontFamily: 'inherit',
            fontSize: '13px',
            lineHeight: 1.6,
            color: 'var(--text)',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
        <div style={{ padding: '6px 14px', borderTop: '1px solid var(--glass-border)', fontSize: '10px', color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between' }}>
          <span>{content.length} characters</span>
          <span>{hasFirebaseConfig ? '🔴 Live sync on' : '💾 Local only'}</span>
        </div>
      </div>
    </div>
  );
}
