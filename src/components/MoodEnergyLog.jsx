import { useState } from 'react';
import { ME } from '../constants';

const ENERGY_LABELS = ['😴 Drained', '😕 Low', '😐 Okay', '😊 Good', '⚡ Energized'];

export default function MoodEnergyLog({ state, setState, showToast }) {
  const [energyNote, setEnergyNote] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const energyLog = state.energyLog || [];
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const todayEntry = energyLog.find(e => e.date === today);

  const setMood = (m) => {
    const newHist = [...state.moodHist];
    const exIdx = newHist.findIndex(x => x.date === today);
    if (exIdx !== -1) newHist[exIdx].mood = m;
    else {
      newHist.push({ date: today, mood: m });
      if (newHist.length > 7) newHist.shift();
    }
    setState(prev => ({ ...prev, mood: m, moodHist: newHist }));
    showToast('Mood saved 💖');
  };

  const setEnergy = (level) => {
    const newLog = [...energyLog];
    const exIdx = newLog.findIndex(e => e.date === today);
    if (exIdx !== -1) {
      newLog[exIdx] = { ...newLog[exIdx], energy: level, note: energyNote };
    } else {
      newLog.push({ date: today, energy: level, note: energyNote });
      if (newLog.length > 14) newLog.shift();
    }
    setState(prev => ({ ...prev, energyLog: newLog }));
    showToast(`Energy: ${ENERGY_LABELS[level - 1]} ✨`);
  };

  const recentMood = state.moodHist?.slice(-7) || [];

  return (
    <div style={{ marginBottom: '16px' ,margin:'10px'}}>
      <div className="sl">
        <span className="sli">💝</span>
        <h3>Daily Check-In</h3>
        <button
          onClick={() => setShowHistory(v => !v)}
          style={{ marginLeft: 'auto', background: 'var(--surface-container-low)', border: 'none', borderRadius: '10px', padding: '4px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', color: 'var(--text-dim)' }}
        >
          {showHistory ? 'Hide' : 'History'}
        </button>
      </div>

      <div className="gc" style={{ padding: '16px' }}>
        {/* Mood row */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '10px' }}>How are you feeling? 💭</div>
          <div className="mstrip">
            {Object.entries(ME).map(([key, emoji]) => (
              <button
                key={key}
                className={`mbtn ${state.mood === key ? 'on' : ''}`}
                onClick={() => setMood(key)}
              >
                <div className="mmi">{emoji}</div>
                <div className="mml">{key}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Energy row */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '10px' }}>Energy level today ⚡</div>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
            {[1, 2, 3, 4, 5].map(level => (
              <button
                key={level}
                onClick={() => setEnergy(level)}
                title={ENERGY_LABELS[level - 1]}
                style={{
                  flex: 1,
                  height: '32px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: todayEntry?.energy >= level
                    ? `hsl(${45 + level * 25}, 80%, ${60 - level * 4}%)`
                    : 'var(--surface-container-low)',
                  transition: 'all 0.2s',
                  transform: todayEntry?.energy === level ? 'scale(1.08)' : 'scale(1)'
                }}
              />
            ))}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', textAlign: 'center', minHeight: '16px' }}>
            {todayEntry?.energy ? ENERGY_LABELS[todayEntry.energy - 1] : 'Tap to set your energy level'}
          </div>

          {/* Note */}
          <input
            className="inp"
            placeholder="Optional note... (e.g. 'felt tired after lunch')"
            value={energyNote}
            onChange={e => setEnergyNote(e.target.value)}
            style={{ marginTop: '10px', fontSize: '12px' }}
          />
        </div>
      </div>

      {/* 7-day mood history */}
      {showHistory && recentMood.length > 0 && (
        <div className="gc" style={{ padding: '14px', marginTop: '8px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '10px' }}>Last 7 Days</div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
            {recentMood.map((entry, i) => (
              <div key={i} style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '18px' }}>{ME[entry.mood] || '·'}</div>
                <div style={{ fontSize: '9px', color: 'var(--text-dim)', marginTop: '4px' }}>{entry.date?.split(' ')[1] || ''}</div>
                {/* Energy bar */}
                {energyLog.find(e => e.date === entry.date) && (
                  <div style={{
                    width: '100%', height: `${(energyLog.find(e => e.date === entry.date)?.energy || 0) * 4}px`,
                    background: 'var(--primary)', borderRadius: '4px', marginTop: '4px',
                    maxHeight: '20px', minHeight: '2px'
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
