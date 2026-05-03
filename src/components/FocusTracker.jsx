import { useState, useEffect } from 'react';
import PomodoroTimer from './PomodoroTimer';

export default function FocusTracker({ state, setState, showToast }) {
  const [sInp, setSInp] = useState('');
  const [sGoal, setSGoal] = useState('');
  const [activeTimerIdx, setActiveTimerIdx] = useState(null);
  const [timerStart, setTimerStart] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let interval;
    if (activeTimerIdx !== null) {
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - timerStart) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTimerIdx, timerStart]);

  const startTimer = (idx) => {
    if (activeTimerIdx !== null) stopTimer();
    setActiveTimerIdx(idx);
    setTimerStart(Date.now());
    setElapsed(0);
  };

  const stopTimer = () => {
    if (activeTimerIdx === null) return;
    const secs = elapsed;
    const idx = activeTimerIdx;

    setActiveTimerIdx(null);
    setTimerStart(null);
    setElapsed(0);

    let reason = prompt('Reason for stopping (e.g., Finished, Break)?', 'Break');
    if (reason === null) reason = 'Stopped';

    const newSubjects = [...state.subjects];
    newSubjects[idx].done += secs;
    if (!newSubjects[idx].logs) newSubjects[idx].logs = [];
    newSubjects[idx].logs.push({ secs, reason, date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });

    let bonus = 0;
    const goalSecs = newSubjects[idx].goal * 60;
    if (newSubjects[idx].done >= goalSecs && (newSubjects[idx].done - secs) < goalSecs) {
      bonus = 5;
      showToast(newSubjects[idx].name + ' goal! +5 ⭐');
    } else {
      showToast(`Logged ${secs}s for ${newSubjects[idx].name} ✨`);
    }

    const addedMins = Math.max(1, Math.round(secs / 60));
    setState(prev => ({
      ...prev,
      subjects: newSubjects,
      studyMins: prev.studyMins + addedMins,
      weekStudyMins: (prev.weekStudyMins || 0) + addedMins,
      score: prev.score + bonus,
      dailyScore: (prev.dailyScore || 0) + bonus
    }));
  };

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const addSubject = (overrideName, overrideGoal) => {
    const name = typeof overrideName === 'string' ? overrideName : sInp.trim();
    if (!name) return;
    const goal = typeof overrideGoal === 'number' ? overrideGoal : parseInt(sGoal) || 60;
    const newSubj = { id: Date.now(), name, goal, done: 0 };

    setState(prev => {
      const prevRecents = prev.recentSubjects || [];
      const filteredRecents = prevRecents.filter(r => r.name.toLowerCase() !== name.toLowerCase());
      const newRecents = [{ name, goal }, ...filteredRecents].slice(0, 3);
      return {
        ...prev,
        subjects: [...prev.subjects, newSubj],
        recentSubjects: newRecents
      };
    });

    if (typeof overrideName !== 'string') {
      setSInp(''); setSGoal('');
    }
    showToast(newSubj.name + ' added 📚');
  };

  const logStudy = (idx) => {
    const m = prompt('Minutes studied?', '30');
    if (!m || isNaN(+m) || +m <= 0) return;

    let reason = prompt('What did you work on?', 'Manual log');
    if (reason === null) reason = 'Manual log';

    const secs = m * 60;
    const newSubjects = [...state.subjects];
    newSubjects[idx].done += secs;
    if (!newSubjects[idx].logs) newSubjects[idx].logs = [];
    newSubjects[idx].logs.push({ mins: +m, reason, date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });

    let bonus = 0;
    const goalSecs = newSubjects[idx].goal * 60;
    if (newSubjects[idx].done >= goalSecs && (newSubjects[idx].done - secs) < goalSecs) {
      bonus = 5;
      showToast(newSubjects[idx].name + ' goal! +5 ⭐');
    }

    setState(prev => ({
      ...prev,
      subjects: newSubjects,
      studyMins: prev.studyMins + (+m),
      weekStudyMins: (prev.weekStudyMins || 0) + (+m),
      score: prev.score + bonus,
      dailyScore: (prev.dailyScore || 0) + bonus
    }));
  };

  const delSubj = (idx) => {
    setState(prev => ({ ...prev, subjects: prev.subjects.filter((_, i) => i !== idx) }));
  };

  return (
    <>
      <div className="sl">
        <span className="sli">🎯</span>
        <h3>Focus Tracker</h3>
        <span className="slc">{state.subjects.length} Task</span>
      </div>
      <div className="scards">
        {/* Pomodoro Timer */}
        <PomodoroTimer
          state={state}
          setState={setState}
          showToast={showToast}
          subjects={state.subjects}
        />

        <div className="add-box" style={{ margin: 0, padding: '16px' }}>
          <div className="irow" style={{ marginTop: 0 }}>
            <input className="inp" value={sInp} onChange={e => setSInp(e.target.value)} placeholder="What are we focusing on? 📚" />
            <input className="inp" value={sGoal} onChange={e => setSGoal(e.target.value)} type="number" placeholder="min" style={{ width: '70px' }} />
            <button className={`fab-add ${sInp.trim() ? 'ready' : ''}`} onClick={addSubject}>Add Task</button>
          </div>
          {(state.recentSubjects && state.recentSubjects.length > 0) && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-dim)', alignSelf: 'center' }}>Recent:</span>
              {state.recentSubjects.map((r, i) => (
                <button
                  key={i}
                  className="slogbtn"
                  style={{ background: 'var(--surface-container-low)', color: 'var(--text-dim)', padding: '4px 10px', fontSize: '11px', border: '1px solid var(--glass-border)', cursor: 'pointer' }}
                  onClick={() => addSubject(r.name, r.goal)}
                >
                  {r.name} ({r.goal}m)
                </button>
              ))}
            </div>
          )}
        </div>
        {state.subjects.map((s, i) => {
          const goalSecs = s.goal * 60;
          const pct = Math.min(100, Math.round((s.done / goalSecs) * 100));
          return (
            <div key={s.id} className="sci" style={{ marginTop: 10 }}>
              <div className="scit">
                <span className="scin">{s.name} : </span>
                <span className="scip">{pct}% · {Math.floor(s.done / 60)}m {s.done % 60}s / {s.goal}m</span>
              </div>
              <div className="scib">
                <div className="scif" style={{ width: `${pct}%` }}></div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                {activeTimerIdx === i ? (
                  <button className="slogbtn sact" onClick={() => stopTimer()}>⏹ Stop ({formatTime(elapsed)})</button>
                ) : (
                  <button className="slogbtn" onClick={() => startTimer(i)}>▶ Start</button>
                )}
                <button className="slogbtn" onClick={() => logStudy(i)} style={{ background: 'var(--surface-container-low)', color: 'var(--text-dim)' }}>+ Manual</button>
                <button className="sdelbtn" style={{ marginLeft: 'auto' }} onClick={() => delSubj(i)}>✕</button>
              </div>
              {s.logs && s.logs.length > 0 && (
                <div style={{ marginTop: '12px', padding: '8px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', fontSize: '11px' }}>
                  <div style={{ fontWeight: 700, marginBottom: '4px', color: 'var(--text-dim)' }}>Session History:</div>
                  {s.logs.map((log, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                      <span style={{ color: 'var(--text-dim)', opacity: 0.8 }}>{log.date}</span>
                      <span style={{ flex: 1, margin: '0 8px' }}>{log.reason}</span>
                      <span style={{ fontWeight: 600, color: 'var(--primary)' }}>+{log.secs !== undefined ? log.secs + 's' : log.mins + 'm'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
