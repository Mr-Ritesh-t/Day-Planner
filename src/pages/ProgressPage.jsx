import { useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { ACH, ME, cntDone } from '../constants';
import WeeklyGoal from '../components/WeeklyGoal';
import StudyLeaderboard from '../components/StudyLeaderboard';
import StudyAnalytics from '../components/StudyAnalytics';
import AiStudyTip from '../components/AiStudyTip';
import SyllabusTracker from '../components/SyllabusTracker';

export default function ProgressPage({ state, setState, active, pos, showToast, fullState, onGo, deviceUserId, setShowReport, onLogOut }) {
  const [partnerCode, setPartnerCode] = useState('');
  const [linking, setLinking] = useState(false);

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

  const streakIntensity = Math.min(state.streak, 30);
  const streakColor = streakIntensity >= 14 ? '#ff4500' : streakIntensity >= 7 ? '#ff8c00' : streakIntensity >= 3 ? '#e28743' : 'var(--primary)';

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

      {/* Stats Row */}
      <div className="srow">
        <div className="sbox">
          <div className="sbv" style={{ color: streakColor, fontSize: state.streak >= 7 ? '20px' : '18px' }}>
            {state.streak >= 3 ? '🔥' : ''}{state.streak}d
          </div>
          <div className="sbl">Streak</div>
        </div>
        <div className="sbox"><div className="sbv">{cntDone(state)}</div><div className="sbl">Tasks</div></div>
        <div className="sbox"><div className="sbv">{Math.round(state.studyMins / 60)}h</div><div className="sbl">Study</div></div>
        <div className="sbox"><div className="sbv">{state.pomodoroCount || 0}</div><div className="sbl">Pomodoros</div></div>
      </div>

      {/* Weekly Study Goal */}
      <WeeklyGoal state={state} setState={setState} showToast={showToast} />

      {/* AI Study Tip */}
      <AiStudyTip subjects={state.subjects} />

      {/* Study Leaderboard */}
      {fullState && <StudyLeaderboard fullState={fullState} deviceUserId={deviceUserId} />}

      {/* Weekly Activity */}
      <div className="sl"><span className="sli">📈</span><h3>Weekly Activity</h3></div>
      <div className="wvis" style={{ marginTop: '16px' }}>
        <div className="wdays" style={{ display: 'flex', gap: '8px', justifyContent: 'space-between'  }}>
          {renderWeekly()}
        </div>
      </div>

      {/* Study Analytics Charts */}
      <StudyAnalytics state={state} fullState={fullState} />

      {/* Syllabus Tracker */}
      <SyllabusTracker state={state} setState={setState} showToast={showToast} />

      {/* Achievements */}
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

      {/* Weekly Report button */}
      <button
        className="gc"
        style={{
          width: '96%',
          marginBottom: '12px',
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
          cursor: 'pointer',
          margin:'10px'
        }}
        onClick={() => setShowReport(true)}
      >
        <div style={{ background: 'var(--surface-container-low)', width: '40px', height: '40px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
          📊
        </div>
        <span style={{ textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--primary)' }}>Weekly Report</span>
      </button>

      <button
        className="gc"
        style={{
          width: '96%',
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
          cursor: 'pointer',
          margin:'10px'
        }}
        onClick={() => onGo(4)}
      >
        <div style={{ background: 'var(--surface-container-low)', width: '40px', height: '40px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
          📅
        </div>
        <span style={{ textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--primary)' }}>View Full Calendar</span>
      </button>

      <button
        className="gc"
        style={{
          width: '96%',
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
          cursor: 'pointer',
          margin:'10px'
        }}
        onClick={() => onGo(5)}
      >
        <div style={{ background: 'var(--surface-container-low)', width: '40px', height: '40px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
          ⌛
        </div>
        <span style={{ textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--primary)' }}>Screen Time & Usage</span>
      </button>

      {/* Partner & Connection Section */}
      <div className="sl"><span className="sli">💞</span><h3>Connection</h3></div>
      <div className="albx" style={{ width: '96%', margin: '10px', transform: 'none', position: 'relative', padding: '24px' }}>
        {!state.partnerId ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <p style={{ fontSize: '14px', opacity: 0.7 }}>Share your code with a partner to link your progress!</p>
              <div style={{ background: 'var(--primary-container)', color: 'var(--primary)', padding: '12px', borderRadius: '12px', fontSize: '24px', fontWeight: 800, marginTop: '12px', letterSpacing: '2px' }}>
                {state.inviteCode || '------'}
              </div>
              <p style={{ fontSize: '11px', marginTop: '6px', opacity: 0.5 }}>Your Unique Invite Code</p>
            </div>
            
            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '20px', width: '100%' }}>
              <p style={{ fontSize: '13px', marginBottom: '10px' }}>Or enter partner's code:</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  className="inp" 
                  placeholder="Paste Code Here" 
                  value={partnerCode}
                  onChange={e => setPartnerCode(e.target.value.toUpperCase())}
                  style={{ flex: 1 }}
                />
                <button 
                  className={`fab-add ${partnerCode.length === 6 ? 'ready' : ''}`}
                  style={{ width: '80px', height: '44px', margin: 0 }}
                  onClick={async () => {
                    if (partnerCode.length !== 6) return;
                    setLinking(true);
                    try {
                      const q = query(collection(db, 'users'), where('inviteCode', '==', partnerCode));
                      const snap = await getDocs(q);
                      if (snap.empty) {
                        showToast('Invalid code! 🌸');
                      } else {
                        const partnerDoc = snap.docs[0];
                        const partnerId = partnerDoc.id;
                        if (partnerId === deviceUserId) {
                          showToast("You can't link with yourself! 😂");
                        } else {
                          // Link both users
                          await setDoc(doc(db, 'users', deviceUserId), { partnerId, partnerName: partnerDoc.data().name }, { merge: true });
                          await setDoc(doc(db, 'users', partnerId), { partnerId: deviceUserId, partnerName: state.name }, { merge: true });
                          showToast('Linked successfully! 💞');
                        }
                      }
                    } catch (e) { showToast('Error linking partner'); }
                    setLinking(false);
                  }}
                  disabled={linking}
                >
                  {linking ? '...' : 'Link'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px' }}>🔗</div>
            <p style={{ marginTop: '8px', fontWeight: 600 }}>Connected with {state.partnerName} ✨</p>
            <button 
              onClick={async () => {
                if(confirm("Unlink from partner?")) {
                  await setDoc(doc(db, 'users', deviceUserId), { partnerId: null, partnerName: null }, { merge: true });
                  if (state.partnerId) {
                    await setDoc(doc(db, 'users', state.partnerId), { partnerId: null, partnerName: null }, { merge: true });
                  }
                  showToast('Unlinked 🌸');
                }
              }}
              style={{ background: 'none', border: 'none', color: '#ff4444', fontSize: '12px', marginTop: '12px', cursor: 'pointer' }}
            >
              Sever Connection
            </button>
          </div>
        )}
      </div>

      <button 
        onClick={onLogOut}
        style={{ width: '96%', margin: '40px 10px 20px', padding: '16px', borderRadius: '16px', background: 'var(--surface-container-high)', border: '1px solid var(--glass-border)', color: '#ff4444', fontWeight: 'bold', cursor: 'pointer' }}
      >
        Sign Out 🚪
      </button>
    </div>
  );
}
