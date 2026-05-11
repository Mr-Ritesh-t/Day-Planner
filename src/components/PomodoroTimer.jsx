import { useState, useEffect, useRef } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';

const PHASES = ['work', 'shortBreak', 'longBreak'];
const PHASE_LABELS = { work: '🍅 Focus', shortBreak: '☕ Short Break', longBreak: '🌿 Long Break' };
const PHASE_COLORS = { work: 'var(--primary)', shortBreak: '#27ae60', longBreak: '#5da9e9' };

export default function PomodoroTimer({ state, setState, showToast, subjects }) {
  const settings = state.pomodoroSettings || { work: 25, shortBreak: 5, longBreak: 15 };
  const [enabled, setEnabled] = useState(false);
  const [phase, setPhase] = useState('work');
  const [secondsLeft, setSecondsLeft] = useState(settings.work * 60);
  const [running, setRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [linkedSubjIdx, setLinkedSubjIdx] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState(settings);
  const intervalRef = useRef(null);

  useEffect(() => {
    LocalNotifications.requestPermissions();
  }, []);

  const totalSecs = settings[phase] * 60;
  const progress = 1 - secondsLeft / totalSecs;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = circumference * (1 - progress);

  useEffect(() => {
    setSecondsLeft(settings[phase] * 60);
  }, [phase, settings.work, settings.shortBreak, settings.longBreak]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            handlePhaseEnd();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, phase]);

  const handlePhaseEnd = () => {
    setRunning(false);
    playChime();

    if (phase === 'work') {
      const loggedMins = settings.work;
      // Log to linked subject
      if (linkedSubjIdx !== null && subjects[linkedSubjIdx]) {
        const newSubjects = [...subjects];
        const secs = loggedMins * 60;
        newSubjects[linkedSubjIdx].done += secs;
        if (!newSubjects[linkedSubjIdx].logs) newSubjects[linkedSubjIdx].logs = [];
        newSubjects[linkedSubjIdx].logs.push({ secs, reason: '🍅 Pomodoro', date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
        setState(prev => ({
          ...prev,
          subjects: newSubjects,
          studyMins: prev.studyMins + loggedMins,
          pomodoroCount: (prev.pomodoroCount || 0) + 1,
          weekStudyMins: (prev.weekStudyMins || 0) + loggedMins,
          score: prev.score + 5,
          dailyScore: (prev.dailyScore || 0) + 5,
        }));
      } else {
        setState(prev => ({
          ...prev,
          studyMins: prev.studyMins + loggedMins,
          pomodoroCount: (prev.pomodoroCount || 0) + 1,
          weekStudyMins: (prev.weekStudyMins || 0) + loggedMins,
          score: prev.score + 5,
          dailyScore: (prev.dailyScore || 0) + 5,
        }));
      }
      const newCount = sessionCount + 1;
      setSessionCount(newCount);
      showToast('🍅 Pomodoro done! +5 ⭐');
      // After 4 sessions → long break, else short break
      setPhase(newCount % 4 === 0 ? 'longBreak' : 'shortBreak');
    } else {
      showToast('Break over! Back to focus 💪');
      setPhase('work');
    }
  };

  const playChime = () => {
    // Web Chime
    try {
      const c = new (window.AudioContext || window.webkitAudioContext)();
      [880, 660, 880].forEach((f, i) => {
        const o = c.createOscillator(), g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0, c.currentTime + i * 0.3);
        g.gain.linearRampToValueAtTime(0.12, c.currentTime + i * 0.3 + 0.05);
        g.gain.linearRampToValueAtTime(0, c.currentTime + i * 0.3 + 0.25);
        o.start(c.currentTime + i * 0.3);
        o.stop(c.currentTime + i * 0.3 + 0.3);
      });
    } catch (e) {}

    // Android Notification
    LocalNotifications.schedule({
      notifications: [
        {
          title: phase === 'work' ? 'Focus Session Done! 🍅' : 'Break Over! ☕',
          body: phase === 'work' ? 'Time for a well-deserved break.' : 'Back to deep focus!',
          id: 1,
          sound: 'default'
        }
      ]
    });
  };

  const reset = () => {
    setRunning(false);
    setSecondsLeft(settings[phase] * 60);
  };

  const saveSettings = () => {
    setState(prev => ({ ...prev, pomodoroSettings: tempSettings }));
    setSecondsLeft(tempSettings[phase] * 60);
    setShowSettings(false);
    showToast('Pomodoro settings saved ⏱️');
  };

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const color = PHASE_COLORS[phase];

  if (!enabled) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--surface-container-low)', borderRadius: '16px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>🍅</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: '13px' }}>Pomodoro Mode</div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>25 min focus sessions</div>
          </div>
        </div>
        <button
          onClick={() => setEnabled(true)}
          style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '12px', padding: '8px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
        >
          Enable
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: `linear-gradient(135deg, ${color}18, ${color}08)`, border: `1.5px solid ${color}40`, borderRadius: '20px', padding: '20px 16px', marginBottom: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ fontWeight: 800, fontSize: '14px' }}>🍅 Pomodoro</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowSettings(v => !v)} style={{ background: 'var(--surface-container-low)', border: 'none', borderRadius: '10px', padding: '6px 10px', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}>⚙️ Settings</button>
          <button onClick={() => { setEnabled(false); setRunning(false); }} style={{ background: 'transparent', border: 'none', fontSize: '16px', cursor: 'pointer', opacity: 0.5 }}>✕</button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div style={{ background: 'var(--surface-container-low)', borderRadius: '14px', padding: '14px', marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '10px', color: 'var(--text-dim)' }}>Session Length (minutes)</div>
          {[['work', '🍅 Focus'], ['shortBreak', '☕ Short Break'], ['longBreak', '🌿 Long Break']].map(([key, label]) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px' }}>{label}</span>
              <input
                type="number"
                min="1" max="60"
                value={tempSettings[key]}
                onChange={e => setTempSettings(p => ({ ...p, [key]: +e.target.value }))}
                style={{ width: '60px', padding: '6px', borderRadius: '8px', border: '1px solid var(--glass-border)', fontSize: '13px', fontWeight: 700, textAlign: 'center', background: 'var(--bg)' }}
              />
            </div>
          ))}
          <button onClick={saveSettings} className="fab-add ready" style={{ width: '100%', marginTop: '8px' }}>Save</button>
        </div>
      )}

      {/* Phase tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', justifyContent: 'center' }}>
        {PHASES.map(p => (
          <button
            key={p}
            onClick={() => { setPhase(p); setRunning(false); }}
            style={{
              background: phase === p ? color : 'var(--surface-container-low)',
              color: phase === p ? '#fff' : 'var(--text-dim)',
              border: 'none', borderRadius: '12px', padding: '6px 12px', fontSize: '11px',
              fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            {PHASE_LABELS[p]}
          </button>
        ))}
      </div>

      {/* SVG Ring Timer */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="70" cy="70" r={radius} fill="none" stroke="var(--surface-container-low)" strokeWidth="10" />
          <circle
            cx="70" cy="70" r={radius} fill="none"
            stroke={color} strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDash}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
          <text x="70" y="70" textAnchor="middle" dominantBaseline="middle"
            style={{ transform: 'rotate(90deg)', transformOrigin: '70px 70px', fill: 'var(--text)', fontSize: '26px', fontWeight: 800, fontFamily: 'inherit' }}>
            {fmt(secondsLeft)}
          </text>
          <text x="70" y="88" textAnchor="middle" dominantBaseline="middle"
            style={{ transform: 'rotate(90deg)', transformOrigin: '70px 70px', fill: 'var(--text-dim)', fontSize: '10px', fontFamily: 'inherit' }}>
            {sessionCount} sessions
          </text>
        </svg>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setRunning(v => !v)}
            style={{ background: color, color: '#fff', border: 'none', borderRadius: '16px', padding: '12px 28px', fontSize: '14px', fontWeight: 800, cursor: 'pointer', minWidth: '100px' }}
          >
            {running ? '⏸ Pause' : '▶ Start'}
          </button>
          <button
            onClick={reset}
            style={{ background: 'var(--surface-container-low)', border: 'none', borderRadius: '16px', padding: '12px 16px', fontSize: '14px', cursor: 'pointer' }}
          >
            ↺
          </button>
        </div>

        {/* Link to subject */}
        {subjects && subjects.length > 0 && (
          <div style={{ width: '100%' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '6px', textAlign: 'center' }}>Log time to:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
              <button
                onClick={() => setLinkedSubjIdx(null)}
                style={{ background: linkedSubjIdx === null ? color : 'var(--surface-container-low)', color: linkedSubjIdx === null ? '#fff' : 'var(--text-dim)', border: 'none', borderRadius: '10px', padding: '5px 12px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
              >
                None
              </button>
              {subjects.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setLinkedSubjIdx(i)}
                  style={{ background: linkedSubjIdx === i ? color : 'var(--surface-container-low)', color: linkedSubjIdx === i ? '#fff' : 'var(--text-dim)', border: 'none', borderRadius: '10px', padding: '5px 12px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
