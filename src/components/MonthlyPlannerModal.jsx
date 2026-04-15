import { useState } from 'react';

export default function MonthlyPlannerModal({ isOpen, onClose, state, setState }) {
  const [activePeriod, setActivePeriod] = useState('morning');
  const [tInp, setTInp] = useState('');
  const [tTime, setTTime] = useState('');
  const [tEndTime, setTEndTime] = useState('');
  const [tNote, setTNote] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [weekdays, setWeekdays] = useState([]); // 0-6 for Sun-Sat

  // Removed early return to allow for smooth CSS exit animations

  const routine = state.monthlyRoutine || { morning: [], afternoon: [], evening: [] };

  const addTask = () => {
    if (!tInp.trim()) return;
    const newTask = {
      id: Date.now(),
      title: tInp.trim(),
      note: tNote.trim(),
      startTime: tTime,
      endTime: tEndTime,
      startDate: startDate || null,
      endDate: endDate || null,
      weekdays: weekdays
    };
    
    setState(prev => {
      const newRoutine = { ...prev.monthlyRoutine };
      newRoutine[activePeriod] = [...newRoutine[activePeriod], newTask];
      
      const newTasks = { ...prev.tasks };
      newTasks[activePeriod] = [...newTasks[activePeriod], {
        ...newTask,
        id: Date.now() + 1, // Unique ID for the daily instance
        done: false,
        af: false
      }];
      
      return { ...prev, monthlyRoutine: newRoutine, tasks: newTasks };
    });

    setTInp(''); setTNote(''); setTTime(''); setTEndTime('');
    setStartDate(''); setEndDate(''); setWeekdays([]);
  };

  const toggleDay = (day) => {
    setWeekdays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort());
  };

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const fullDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getScheduleText = (t) => {
    let parts = [];
    if (t.weekdays && t.weekdays.length > 0) {
      if (t.weekdays.length === 7) parts.push('Every day');
      else parts.push(t.weekdays.map(d => fullDays[d]).join(', '));
    } else {
      parts.push('Every day');
    }

    if (t.startDate || t.endDate) {
      const s = t.startDate ? new Date(t.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Start';
      const e = t.endDate ? new Date(t.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'End';
      parts.push(`(${s} - ${e})`);
    }

    return parts.join(' ');
  };

  const delTask = (id) => {
    const newRoutine = { ...routine };
    newRoutine[activePeriod] = newRoutine[activePeriod].filter(t => t.id !== id);
    setState(prev => ({ ...prev, monthlyRoutine: newRoutine }));
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

  return (
    <div className={`alovo ${isOpen ? 'open' : ''}`}>
      <div className="albx" style={{ maxHeight: '85vh', overflowY: 'auto', textAlign: 'left', padding: '32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div className="ph-t" style={{ fontSize: '24px' }}>{state.name}'s <em>Routine</em></div>
          <button className="bico" onClick={onClose} style={{ width: '32px', height: '32px', fontSize: '14px' }}>✕</button>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '24px', lineHeight: '1.6' }}>
          These recurring rituals will be added to your daily plan every single morning. ✨
        </p>

        <div className="period-row" style={{ margin: '0 0 20px 0', padding: 0 }}>
          {['morning', 'afternoon', 'evening'].map(p => (
            <button 
              key={p}
              className={`ptab ${activePeriod === p ? 'on' : ''}`} 
              onClick={() => setActivePeriod(p)}
              style={{ padding: '8px 16px', fontSize: '12px' }}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        <div className="add-box" style={{ margin: '0 0 24px 0', padding: '20px', background: 'rgba(255,255,255,0.4)', borderRadius: '24px', border: '1px solid var(--glass-border)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '8px', fontWeight: 800, textTransform: 'uppercase', opacity: 0.6 }}>What & When</div>
          <input 
            className="inp" 
            value={tInp} 
            onChange={e => setTInp(e.target.value)} 
            placeholder="Add Your Task (e.g., Morning Coffee ☕)" 
            style={{ marginBottom: '12px' }}
          />
          <input 
            className="inp" 
            value={tNote} 
            onChange={e => setTNote(e.target.value)} 
            placeholder="About Task 📝" 
            style={{ marginBottom: '12px', fontSize: '12px' }}
          />
          
          <div className="irow" style={{ marginTop: 0 }}>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '8px', fontWeight: 800, textTransform: 'uppercase', opacity: 0.6 }}>Set Time</div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
               <input placeholder="Starting" className="inp" type={tTime ? "time" : "text"} onFocus={(e) => e.target.type='time'} onBlur={(e) => {if(!e.target.value) e.target.type='text'}} value={tTime} onChange={e => setTTime(e.target.value)} style={{ width: '85px', fontSize: '12px' }} />
               <span style={{ fontSize: '11px', opacity: 0.4 }}>to</span>
               <input placeholder="Ending" className="inp" type={tEndTime ? "time" : "text"} onFocus={(e) => e.target.type='time'} onBlur={(e) => {if(!e.target.value) e.target.type='text'}} value={tEndTime} onChange={e => setTEndTime(e.target.value)} style={{ width: '85px', fontSize: '12px' }} />
            </div>
            <button className={`fab-add ${tInp.trim() ? 'ready' : ''}`} style={{marginTop:15}} onClick={addTask}>Done</button>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '16px -20px' }} />

          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '10px', fontWeight: 800, textTransform: 'uppercase', opacity: 0.6 }}>Smart Schedule</div>
          
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
            {dayNames.map((n, i) => (
              <button 
                key={i} 
                className={`day-btn ${weekdays.includes(i) ? 'on' : ''}`}
                onClick={() => toggleDay(i)}
              >
                {n}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginBottom: '4px', fontWeight: 700 }}>Starting</div>
              <input className="inp" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ fontSize: '11px', padding: '6px 10px' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginBottom: '4px', fontWeight: 700 }}>Until</div>
              <input className="inp" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ fontSize: '11px', padding: '6px 10px' }} />
            </div>
          </div>
        </div>

        <div className="tcards" style={{ padding: 0 }}>
          {!routine[activePeriod].length ? (
            <div className="empty" style={{ padding: '24px 0' }}>No rituals set for this time.</div>
          ) : (
            routine[activePeriod].map(t => (
              <div key={t.id} className="tc">
                <div className="tb">
                  <div className="tt" style={{ fontSize: '14px' }}>{t.title}</div>
                  <div className="tm" style={{ flexDirection: 'column', gap: '2px' }}>
                    {t.startTime && <span className="ttime" style={{ fontSize: '11px', width: 'fit-content' }}>🕐 {formatTimeAMPM(t.startTime)}{t.endTime ? ` - ${formatTimeAMPM(t.endTime)}` : ''}</span>}
                    {t.note && <div style={{ fontSize: '11px', color: 'var(--text-dim)', margin: '2px 0' }}>📝 {t.note}</div>}
                    <div style={{ fontSize: '10px', marginTop: '2px', color: 'var(--primary)', fontWeight: 600 }}>📅 {getScheduleText(t)}</div>
                  </div>
                </div>
                <button className="tdel" onClick={() => delTask(t.id)}>✕</button>
              </div>
            ))
          )}
        </div>

        <button className="albtn" onClick={onClose} style={{ marginTop: '24px', width: '100%' }}>Save & Done ✨</button>
      </div>
    </div>
  );
}
