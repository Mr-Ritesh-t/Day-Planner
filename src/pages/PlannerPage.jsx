import { useState, useEffect } from 'react';
import { MSGS, ME } from '../constants';
import MonthlyPlannerModal from '../components/MonthlyPlannerModal';
import ProfileSwitcher from '../components/ProfileSwitcher';
import SettingsModal from '../components/SettingsModal';

export default function PlannerPage({ state, setState, active, pos, activePeriod, setActivePeriod, showToast, onSwitch, activeId, fullState, appSettings, setAppSettings }) {
  const [tInp, setTInp] = useState('');
  const [tNote, setTNote] = useState('');
  const [tTime, setTTime] = useState('');
  const [tEndTime, setTEndTime] = useState('');
  const [showMonthly, setShowMonthly] = useState(false);
  const [msgIdx, setMsgIdx] = useState(() => Math.floor(Math.random() * MSGS.length));
  const [showMorePeriod, setShowMorePeriod] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setShowMorePeriod(false);
  }, [activePeriod]);

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning 🌸' : h < 17 ? 'Good afternoon ☀️' : 'Good evening 🌙';
  };

  const addTask = () => {
    if (!tInp.trim()) return;
    
    let targetPeriod = 'anytime';
    if (tTime) {
      const h = parseInt(tTime.split(':')[0], 10);
      targetPeriod = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
    }

    const newTask = {
      id: Date.now(),
      title: tInp.trim(),
      note: tNote.trim(),
      startTime: tTime,
      endTime: tEndTime,
      done: false
    };
    setState(prev => ({
      ...prev,
      tasks: { ...prev.tasks, [targetPeriod]: [...(prev.tasks[targetPeriod] || []), newTask] }
    }));
    setTInp(''); setTNote(''); setTTime(''); setTEndTime('');
    showToast('Task added 🌸');
  };

  const togTask = (id) => {
    let foundPeriod = null;
    let foundIdx = -1;
    ['anytime', 'morning', 'afternoon', 'evening'].forEach(p => {
      if (!state.tasks[p]) return;
      const idx = state.tasks[p].findIndex(t => t.id === id);
      if (idx !== -1) { foundPeriod = p; foundIdx = idx; }
    });

    if (!foundPeriod) return;
    
    const tasks = [...state.tasks[foundPeriod]];
    tasks[foundIdx].done = !tasks[foundIdx].done;
    const pts = tasks[foundIdx].done ? 3 : -3;
    
    setState(prev => ({
      ...prev,
      score: Math.max(0, prev.score + pts),
      dailyScore: Math.max(0, (prev.dailyScore || 0) + pts),
      tasks: { ...prev.tasks, [foundPeriod]: tasks }
    }));
    
    if (tasks[foundIdx].done) {
      showToast('+3 ⭐ Amazing!');
    }
  };

  const delTask = (id) => {
    let foundPeriod = null;
    ['anytime', 'morning', 'afternoon', 'evening'].forEach(p => {
      if (state.tasks[p] && state.tasks[p].some(t => t.id === id)) foundPeriod = p;
    });
    if (!foundPeriod) return;

    setState(prev => ({
      ...prev,
      tasks: { ...prev.tasks, [foundPeriod]: prev.tasks[foundPeriod].filter(t => t.id !== id) }
    }));
  };

  const formatTimeAMPM = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    if (!h || !m) return timeStr;
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  const formatTimeRange = (start, end) => {
    if (!start && !end) return '';
    const s = formatTimeAMPM(start);
    const e = formatTimeAMPM(end);
    if (!e) return `🕐 ${s}`;
    return `🕐 ${s} - ${e}`;
  };

  const togHabit = (id) => {
    const habits = state.habits.map(h => {
      if (h.id === id) {
        const newDone = !h.done;
        const pts = newDone ? 1 : -1;
        setState(prev => ({ 
          ...prev, 
          score: Math.max(0, prev.score + pts),
          dailyScore: Math.max(0, (prev.dailyScore || 0) + pts)
        }));
        if (newDone) showToast(h.n + ' done! +1 ⭐');
        return { ...h, done: newDone };
      }
      return h;
    });
    setState(prev => ({ ...prev, habits }));
  };

  const setMood = (m) => {
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

  const cntTasksDone = Object.values(state.tasks).flat().filter(t => t.done).length;
  const totalTasks = Object.values(state.tasks).flat().length;

  const allTasks = ['anytime', 'morning', 'afternoon', 'evening'].flatMap(p => state.tasks[p] || []);
  const displayedTasks = activePeriod === 'all' ? allTasks : [...(state.tasks['anytime'] || []), ...(state.tasks[activePeriod] || [])];

  const sortedDisplayedTasks = [...displayedTasks].sort((a, b) => {
    if (a.done && !b.done) return -1;
    if (!a.done && b.done) return 1;
    return 0;
  });
  
  const topDisplayedTasks = showMorePeriod ? sortedDisplayedTasks : sortedDisplayedTasks.slice(0, 3);
  const hasMorePeriod = sortedDisplayedTasks.length > 3;

  return (
    <div className={`page ${pos}`} id="p0">
      <div className="ph">
        <div className="ph-g">{greeting()}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="ph-t">Shared <em>Day</em><br />Planner</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="bico"
              onClick={() => setShowSettings(true)}
              title="Settings"
            >
              ⚙️
            </button>
            <button 
              className="bico"
              onClick={() => setShowMonthly(true)}
              title="Monthly Routine"
            >
              📅
            </button>
          </div>
        </div>
        <ProfileSwitcher activeId={activeId} onSwitch={onSwitch} profiles={fullState.profiles} />
      </div>

      <div className="hero-strip">
        <div className="hl2">
          <h2>{state.name} 😝</h2>
          <p>{totalTasks ? `Growing together: ${cntTasksDone}/${totalTasks} done` : "Let's capture the day"}</p>
        </div>
        <div className="hstats" style={{ display: 'flex', gap: '8px' }}>
          <div className="hst"><div className="hst-v">{state.dailyScore || 0}</div><div className="hst-l">Today Points</div></div>
        </div>
      </div>

      <div className="add-box" style={{borderRadius:10}}>
        <input 
          className="inp" 
          value={tInp} 
          onChange={e => setTInp(e.target.value)} 
          placeholder="Add Your Own task" 
          onKeyDown={e => e.key === 'Enter' && addTask()}
        />
        <div className="irow" style={{ marginTop: '12px' }}>
          <input className="inp" value={tNote} onChange={e => setTNote(e.target.value)} placeholder="About Your Task" />
          <span style={{ fontSize: '12px',marginLeft:'10px',marginTop:'20px' ,marginBottom:'10px'}}>Set Time</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
             <input placeholder='Starting' className="inp" type={tTime ? "time" : "text"} onFocus={(e) => e.target.type='time'} onBlur={(e) => {if(!e.target.value) e.target.type='text'}} value={tTime} onChange={e => setTTime(e.target.value)} style={{ width: '90px' }} />
             <span style={{ fontSize: '12px', opacity: 0.4 }}>to</span>
             <input placeholder='Ending' className="inp" type={tEndTime ? "time" : "text"} onFocus={(e) => e.target.type='time'} onBlur={(e) => {if(!e.target.value) e.target.type='text'}} value={tEndTime} onChange={e => setTEndTime(e.target.value)} style={{ width: '90px' }} />
          </div >
          <button className={`fab-add ${tInp.trim() ? 'ready' : ''}`} onClick={addTask}>Done</button>
        </div>
      </div>

      <div className="period-row" >
        {['all', 'morning', 'afternoon', 'evening'].map(p => (
          <button 
            key={p}
            className={`ptab ${activePeriod === p ? 'on' : ''}`} 
            onClick={() => setActivePeriod(p)}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      <div className="tcards" style={{ marginTop: '16px' }}>
        {!topDisplayedTasks.length ? (
          <div className="empty">
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>
              {activePeriod === 'morning' ? '🌅' : activePeriod === 'afternoon' ? '☀️' : activePeriod === 'evening' ? '🌙' : '🌈'}
            </div>
            No tasks found for {activePeriod === 'all' ? 'today' : `our ${activePeriod}`}...<br />Shall we add something sweet?
          </div>
        ) : (
          <>
            {topDisplayedTasks.map(t => (
              <div key={t.id} style={{ margin: 10, opacity: t.done ? 0.7 : 1, paddingLeft: '20px' }} className={`tc ${t.done ? 'dk' : ''}`}>
                <div className="tb">
                  <div className="tt" style={{ textDecoration: t.done ? 'line-through' : 'none' }}>{t.title}</div>
                  <div className="tm">
                    {t.note && <span className="tn">📝 {t.note}</span>}
                    {(t.startTime || t.time || t.endTime) && (
                      <span className="ttime">{formatTimeRange(t.startTime || t.time, t.endTime)}</span>
                    )}
                    {t.done && <span className="tpts" style={{ color: 'var(--success)' }}>Done ✓</span>}
                  </div>
                </div>
              </div>
            ))}
            {hasMorePeriod && (
              <button 
                style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: '600', padding: '10px' }} 
                onClick={() => setShowMorePeriod(!showMorePeriod)}
              >
                {showMorePeriod ? 'Show Less' : `See More (${sortedDisplayedTasks.length - 3})`}
              </button>
            )}
          </>
        )}
      </div>

      <div className="sl">
        <span className="sli">🌸</span>
        <h3>Our Today Tasks</h3>
        <span className="slc">{state.habits.filter(h => h.done).length}/{state.habits.length}</span>
      </div>
      <div className="hrow">
        {state.habits.map(h => (
          <div key={h.id} className={`hpill ${h.done ? 'on' : ''}`} onClick={() => togHabit(h.id)}>
            <span className="he">{h.e}</span>
            <span>{h.n}</span>
            <span className="hpck">{h.done ? '✓' : ''}</span>
          </div>
        ))}
      </div>
       <div className="tcards" style={{ marginTop: '16px' }}>
        {!allTasks.length ? (
          <div className="empty">
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🌈</div>
            No tasks found for today...<br />Shall we add something sweet?
          </div>
        ) : (
          allTasks.map(t => (
            <div key={t.id} style={{margin:10}} className={`tc ${t.done ? 'dk' : ''}`}>
              <button 
                className={`hck ${t.done ? 'on' : ''}`} 
                onClick={() => togTask(t.id)}
              >
                {t.done ? '✓' : ''}
              </button>
              <div className="tb">
                <div className="tt">{t.title}</div>
                <div className="tm">
                  {t.note && <span className="tn">📝 {t.note}</span>}
                  {(t.startTime || t.time || t.endTime) && (
                    <span className="ttime">{formatTimeRange(t.startTime || t.time, t.endTime)}</span>
                  )}
                  <span className="tpts">+3 pts</span>
                </div>
              </div>
              <button className="tdel" onClick={() => delTask(t.id)}>✕</button>
            </div>
          ))
        )}
      </div>

      <div className="sl"><span className="sli">💝</span><h3>How are you feeling?</h3></div>
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

      <div className="mot">
        <div className="mi">{MSGS[msgIdx].i}</div>
        <div className="mt">{MSGS[msgIdx].t}</div>
        <div className="mr" onClick={() => setMsgIdx(Math.floor(Math.random() * MSGS.length))}>📖 New Insight</div>
      </div>

      <MonthlyPlannerModal 
        isOpen={showMonthly} 
        onClose={() => setShowMonthly(false)} 
        state={state} 
        setState={setState} 
      />
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        appSettings={appSettings} 
        setAppSettings={setAppSettings} 
      />
    </div>
  );
}
