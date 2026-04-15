import { ACH, ME, cntDone } from '../constants';

export default function ProgressPage({ state, setState, active, pos, showToast, fullState, onGo, deviceUserId }) {
  const getLevel = () => {
    const LVL = [
      [0, 'Seedlings 🌱'], 
      [50, 'Budding 🌸'], 
      [150, 'Blooming ✨'], 
      [300, 'Growing Strong 🌟'], 
      [500, 'Deep Connection 💖'], 
      [1000, 'Infinity & Beyond 🔗'],
      [1500, 'Unstoppable Force 👑'],
      [3000, 'Living Legend 🌌'],
      [5000, 'Eternal Spark 🎆']
    ];
    let lv = LVL[0][1];
    for (const [p, n] of LVL) {
      if (state.score >= p) lv = n;
    }
    return lv;
  };

  const renderWeekly = () => {
    const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const today = new Date();
    const rows = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = d.toDateString();
      const hist = state.weekData.find(w => w.date === ds);
      const isToday = i === 0;
      const tasks = isToday ? cntDone(state) : (hist?.tasks || 0);
      const mood = isToday ? state.mood : (hist?.mood || null);
      const bh = Math.max(4, Math.min(80, tasks * 16));
      rows.push(
        <div key={i} className="wday">
          <div className="wdl">{days[d.getDay()]}</div>
          <div className="wdbw">
            <div className={`wdb ${isToday ? 'td' : ''}`} style={{ height: `${bh}px`, opacity: isToday ? 1 : 0.55 }}></div>
          </div>
          <div className="wdv">{tasks}</div>
          <div className="wdmo">{mood ? ME[mood] : '·'}</div>
        </div>
      );
    }
    return rows;
  };

  return (
    <div className={`page ${pos}`} id="p2">
      <div className="ph">
        <div className="ph-g">{state.name}'s Growth 🏆</div>
        <div className="ph-t">Personal <em>Journey</em></div>
      </div>

      <div className="shero">
        <div className="shl">My Total Points</div>
        <div className="shv">{state.score}</div>
        <div className="shs">{getLevel()} — keep blooming</div>
      </div>

      <div className="srow">
        <div className="sbox"><div className="sbv">{state.streak}d</div><div className="sbl">Streak</div></div>
        <div className="sbox"><div className="sbv">{cntDone(state)}</div><div className="sbl">Tasks</div></div>
        <div className="sbox"><div className="sbv">{Math.round(state.studyMins / 60)}h</div><div className="sbl">Study</div></div>
      </div>

      {/* Partner Comparison */}
      {fullState && (
        <>
          <div className="sl"><span className="sli">💞</span><h3>Partner's Pulse</h3></div>
          <div className="scards" style={{ marginBottom: '16px' }}>
            {Object.entries(fullState.profiles).filter(([id]) => id !== deviceUserId).map(([id, p]) => (
              <div key={id} className="gc" style={{ padding: '16px', background: 'rgba(137, 68, 104, 0.03)', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div>
                     <div style={{ fontSize: '14px', fontWeight: 800 }}>{p.name}</div>
                     <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Current Mood: {p.mood ? ME[p.mood] : '·'}</div>
                   </div>
                   <div style={{ textAlign: 'right' }}>
                     <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary)' }}>{p.score} pts</div>
                     <div style={{ fontSize: '10px', fontWeight: 700 }}>{p.streak} day streak</div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="sl"><span className="sli">📈</span><h3>Weekly Activity</h3></div>
      <div className="wvis" style={{ marginTop: '16px' }}>
        <div className="wdays" style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
          {renderWeekly()}
        </div>
      </div>

      <div className="sl"><span className="sli">🏆</span><h3>Achievements</h3></div>
      <div className="acgrid" style={{ marginBottom: '16px' }}>
        {ACH.map(a => {
          const isUnlocked = state.unlockedAchievements.includes(a.id);
          return (
            <div key={a.id} className={`aci ${isUnlocked ? 'ul' : ''}`}>
              <div className="aciw">{a.icon}</div>
              <div className="acib">
                <div className="acin">{a.name}</div>
                <div className="acid">{a.desc}</div>
              </div>
              <div className="acip" style={{ fontSize: '12px' }}>{isUnlocked ? (a.pts > 0 ? `+${a.pts} pts` : '✓') : (a.pts > 0 ? `+${a.pts}` : '🔒')}</div>
            </div>
          );
        })}
      </div>
      
      <button 
        className="gc"
        style={{ 
          width: '100%', 
          marginBottom: '32px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '14px',
          padding: '16px',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.5))',
          border: '1px solid rgba(255,255,255,0.8)',
          borderRadius: '24px',
          color: 'var(--text)',
          fontSize: '14px',
          fontWeight: 800,
          cursor: 'pointer'
        }} 
        onClick={() => onGo(4)}
      >
        <div style={{ background: 'var(--surface-container-low)', width: '40px', height: '40px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
          📅
        </div>
        <span style={{ textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--primary)' }}>View Full Calendar</span>
      </button>
    </div>
  );
}
