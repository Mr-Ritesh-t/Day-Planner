import { useState } from 'react';

export default function WeeklyGoal({ state, setState, showToast }) {
  const [editing, setEditing] = useState(false);
  const [tempGoal, setTempGoal] = useState('');

  const weeklyGoal = state.weeklyStudyGoal || 600; // minutes
  const weekStudyMins = state.weekStudyMins || 0;

  const pct = Math.min(100, Math.round((weekStudyMins / weeklyGoal) * 100));
  const hoursStudied = (weekStudyMins / 60).toFixed(1);
  const hoursGoal = (weeklyGoal / 60).toFixed(0);

  const saveGoal = () => {
    const mins = Math.round(parseFloat(tempGoal) * 60);
    if (!mins || mins <= 0) { showToast('Enter a valid hours goal 🎯'); return; }
    setState(prev => ({ ...prev, weeklyStudyGoal: mins }));
    setEditing(false);
    showToast(`Weekly goal set: ${tempGoal}h 🎯`);
  };

  const getMotivation = () => {
    if (pct >= 100) return '🏆 Goal crushed! You\'re unstoppable!';
    if (pct >= 75) return '💪 Almost there, keep pushing!';
    if (pct >= 50) return '🔥 Halfway done! Great momentum!';
    if (pct >= 25) return '📚 Good start! Keep going!';
    return '🌱 Let\'s get those study hours in!';
  };

  const getBarColor = () => {
    if (pct >= 100) return '#27ae60';
    if (pct >= 60) return '#e28743';
    return 'var(--primary)';
  };

  return (
    <div className="gc" style={{ padding: '20px', marginBottom: '16px',margin:'10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Weekly Study Goal</div>
          {editing ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
              <input
                className="inp"
                type="number"
                min="1" max="100"
                placeholder="hours"
                value={tempGoal}
                onChange={e => setTempGoal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveGoal()}
                style={{ width: '80px', fontSize: '16px', fontWeight: 800 }}
                autoFocus
              />
              <button onClick={saveGoal} style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '10px', padding: '8px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Save</button>
              <button onClick={() => setEditing(false)} style={{ background: 'transparent', border: 'none', fontSize: '16px', cursor: 'pointer', opacity: 0.5 }}>✕</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--primary)' }}>{hoursStudied}h</span>
              <span style={{ fontSize: '14px', color: 'var(--text-dim)', fontWeight: 600 }}>/ {hoursGoal}h</span>
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            width: '56px', height: '56px',
            borderRadius: '50%',
            background: `conic-gradient(${getBarColor()} ${pct * 3.6}deg, var(--surface-container-low) 0deg)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative'
          }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: getBarColor() }}>{pct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: '8px', background: 'var(--surface-container-low)', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: `linear-gradient(90deg, ${getBarColor()}, ${getBarColor()}cc)`,
          borderRadius: '8px', transition: 'width 0.6s ease',
          boxShadow: pct > 0 ? `0 0 8px ${getBarColor()}66` : 'none'
        }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-dim)', fontStyle: 'italic' }}>{getMotivation()}</div>
        {!editing && (
          <button
            onClick={() => { setEditing(true); setTempGoal(hoursGoal); }}
            style={{ background: 'var(--surface-container-low)', border: 'none', borderRadius: '10px', padding: '6px 12px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', color: 'var(--text-dim)' }}
          >
            ✏️ Goal
          </button>
        )}
      </div>
    </div>
  );
}
