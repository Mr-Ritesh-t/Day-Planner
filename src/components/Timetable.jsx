import { useState } from 'react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const COLORS = ['#894468', '#5da9e9', '#27ae60', '#e28743', '#9b59b6', '#e74c3c', '#16a085'];

export default function Timetable({ state, setState, showToast }) {
  const [showForm, setShowForm] = useState(false);
  const [day, setDay] = useState('0');
  const [subject, setSubject] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [viewDay, setViewDay] = useState(() => (new Date().getDay() + 6) % 7); // Mon=0

  const timetable = state.timetable || [];

  const addClass = () => {
    if (!subject.trim() || !startTime) { showToast('Fill in subject & time 📅'); return; }
    const newClass = { id: Date.now(), day: parseInt(day), subject: subject.trim(), startTime, endTime };
    setState(prev => ({ ...prev, timetable: [...(prev.timetable || []), newClass] }));
    setSubject(''); setStartTime(''); setEndTime(''); setShowForm(false);
    showToast('Class added 📚');
  };

  const deleteClass = (id) => {
    setState(prev => ({ ...prev, timetable: (prev.timetable || []).filter(c => c.id !== id) }));
  };

  const formatTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  // Get next class based on current time
  const getNextClass = () => {
    const now = new Date();
    const todayIdx = (now.getDay() + 6) % 7;
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const todayClasses = timetable
      .filter(c => c.day === todayIdx)
      .map(c => {
        const [h, m] = c.startTime.split(':');
        return { ...c, startMins: parseInt(h) * 60 + parseInt(m) };
      })
      .filter(c => c.startMins > nowMins)
      .sort((a, b) => a.startMins - b.startMins);
    return todayClasses[0] || null;
  };

  const nextClass = getNextClass();
  const dayClasses = timetable.filter(c => c.day === viewDay).sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div>
      <div className="sl">
        <span className="sli">🗓️</span>
        <h3>Class Timetable</h3>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{ marginLeft: 'auto', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '12px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
        >
          + Add
        </button>
      </div>

      {/* Next class card */}
      {nextClass && (
        <div style={{
          background: 'linear-gradient(135deg, var(--primary)22, var(--primary)08)',
          border: '1.5px solid var(--primary)44',
          borderRadius: '16px', padding: '14px 16px', marginBottom: '16px',
          display: 'flex', alignItems: 'center', gap: '14px'
        }}>
          <div style={{ fontSize: '28px' }}>📖</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Next Class Today</div>
            <div style={{ fontWeight: 800, fontSize: '15px' }}>{nextClass.subject}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{formatTime(nextClass.startTime)}{nextClass.endTime ? ` → ${formatTime(nextClass.endTime)}` : ''}</div>
          </div>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="add-box" style={{ marginBottom: '12px' }}>
          <div className="irow" style={{ marginTop: 0 }}>
            <select
              className="inp"
              value={day} onChange={e => setDay(e.target.value)}
              style={{ flex: 1 }}
            >
              {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
            <input className="inp" placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)} style={{ flex: 2 }} />
          </div>
          <div className="irow" style={{ marginTop: '8px' }}>
            <input className="inp" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={{ flex: 1 }} />
            <span style={{ fontSize: '12px', opacity: 0.5, alignSelf: 'center' }}>to</span>
            <input className="inp" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={{ flex: 1 }} />
            <button className={`fab-add ${subject.trim() && startTime ? 'ready' : ''}`} onClick={addClass}>Add</button>
          </div>
        </div>
      )}

      {/* Day selector */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '4px 0', marginBottom: '12px' }}>
        {DAY_SHORT.map((d, i) => {
          const count = timetable.filter(c => c.day === i).length;
          const isToday = i === (new Date().getDay() + 6) % 7;
          return (
            <button
              key={i}
              onClick={() => setViewDay(i)}
              style={{
                background: viewDay === i ? 'var(--primary)' : 'var(--surface-container-low)',
                color: viewDay === i ? '#fff' : 'var(--text-dim)',
                border: isToday ? '2px solid var(--primary)' : '2px solid transparent',
                borderRadius: '12px', padding: '6px 12px', fontSize: '11px',
                fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                position: 'relative'
              }}
            >
              {d}
              {count > 0 && (
                <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#ff8c00', color: '#fff', borderRadius: '6px', fontSize: '9px', fontWeight: 800, padding: '1px 4px' }}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Classes for selected day */}
      {!dayClasses.length ? (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-dim)', fontSize: '12px' }}>
          No classes on {DAYS[viewDay]} 😴 Free day!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          {dayClasses.map((c, i) => (
            <div key={c.id} className="nli" style={{ padding: '12px 16px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
              <div className="nlib" style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '13px' }}>{c.subject}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                  {formatTime(c.startTime)}{c.endTime ? ` → ${formatTime(c.endTime)}` : ''}
                </div>
              </div>
              <button className="nlidel" onClick={() => deleteClass(c.id)}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
