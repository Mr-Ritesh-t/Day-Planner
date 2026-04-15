import { useState, useRef, useEffect } from 'react';
import { ME } from '../constants';

export default function CalendarPage({ state, active, pos, fullState }) {
  const [selDate, setSelDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.getTime();
  });

  const scrollRef = useRef(null);

  // Generate timeline: -14 to +14 days
  const timeline = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = -14; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    timeline.push(d.getTime());
  }

  // Auto-scroll to today
  useEffect(() => {
    if (active && scrollRef.current) {
      const todayEl = scrollRef.current.querySelector('.cal-dy.today');
      if (todayEl) {
        todayEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [active]);

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const selDateObj = new Date(selDate);
  const isPast = selDate < today.getTime();
  const isToday = selDate === today.getTime();
  const isFuture = selDate > today.getTime();

  // Helper to format time nicely
  const formatTimeRange = (start, end) => {
    if (!start && !end) return '';
    if (!end) return `🕐 ${start}`;
    return `🕐 ${start} - ${end}`;
  };

  // Evaluate Future tasks
  const getFutureTasks = () => {
    const res = { morning: [], afternoon: [], evening: [] };
    const routine = state.monthlyRoutine || { morning: [], afternoon: [], evening: [] };
    const selDayOfWeek = selDateObj.getDay();
    const selIso = selDateObj.toISOString().split('T')[0];

    Object.keys(routine).forEach(period => {
      routine[period].forEach(t => {
        // Evaluate logic
        if (t.weekdays && t.weekdays.length > 0 && !t.weekdays.includes(selDayOfWeek)) return;
        if (t.startDate && selIso < t.startDate) return;
        if (t.endDate && selIso > t.endDate) return;
        res[period].push(t);
      });
    });
    return res;
  };

  // Content for today
  const todayTasks = [...(state.tasks?.morning||[]), ...(state.tasks?.afternoon||[]), ...(state.tasks?.evening||[])];
  
  // Content for past
  const pastData = state.weekData.find(w => w.date === selDateObj.toDateString());

  // Component render helpers
  const renderPast = () => {
    if (!pastData) return <div className="empty">Nothing recorded for this day...</div>;
    
    return (
      <div className="cal-content">
        <div className="srow" style={{ marginTop: 0 }}>
          <div className="sbox"><div className="sbv">{pastData.tasks}</div><div className="sbl">Tasks Done</div></div>
          {pastData.study > 0 && <div className="sbox"><div className="sbv">{Math.round(pastData.study/60)}h</div><div className="sbl">Studied</div></div>}
          {pastData.mood && <div className="sbox"><div className="sbv" style={{fontSize: '28px'}}>{ME[pastData.mood]}</div><div className="sbl">{pastData.mood}</div></div>}
        </div>

        {pastData.doneTasksList && pastData.doneTasksList.length > 0 ? (
          <>
            <div className="sl"><span className="sli">🌸</span><h3>Task History</h3></div>
            <div className="tcards">
              {pastData.doneTasksList.map((t, idx) => (
                <div key={idx} className="tc dk">
                  <div className="tb" style={{marginLeft: '12px'}}>
                    <div className="tt">{t.title}</div>
                    <div className="tm">
                      {t.note && <span className="tn">📝 {t.note}</span>}
                      {t.time && <span className="ttime">🕐 {t.time}</span>}
                      <span className="tpts">✓ Done</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="empty" style={{marginTop: '24px'}}>
            Complete tasks history was not saved for older dates.
          </div>
        )}
      </div>
    );
  };

  const renderToday = () => {
    if (todayTasks.length === 0) return <div className="empty">No tasks added to the planner today.</div>;
    return (
      <div className="cal-content">
        <div className="tcards">
          {todayTasks.map(t => (
            <div key={t.id} className={`tc ${t.done ? 'dk' : ''}`}>
              <div className="tb" style={{marginLeft: '8px'}}>
                <div className="tt">{t.title}</div>
                <div className="tm">
                  {t.note && <span className="tn">📝 {t.note}</span>}
                  {(t.startTime || t.time || t.endTime) && (
                    <span className="ttime">{formatTimeRange(t.startTime || t.time, t.endTime)}</span>
                  )}
                  {t.done ? <span className="tpts" style={{color: 'var(--primary)'}}>✓ Done</span> : <span className="tpts" style={{opacity: 0.5}}>Pending</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderFuture = () => {
    const fut = getFutureTasks();
    const allFut = [...fut.morning, ...fut.afternoon, ...fut.evening];
    if (allFut.length === 0) return <div className="empty">No routines scheduled for this upcoming day.</div>;
    
    return (
      <div className="cal-content">
        <div className="tcards">
          {allFut.map(t => (
            <div key={t.id + t.title} className="tc">
              <div className="tb" style={{marginLeft: '8px'}}>
                <div className="tt">{t.title}</div>
                <div className="tm">
                  {t.note && <span className="tn">📝 {t.note}</span>}
                  {(t.startTime || t.time || t.endTime) && (
                    <span className="ttime">{formatTimeRange(t.startTime || t.time, t.endTime)}</span>
                  )}
                  <span className="tpts">📅 Scheduled</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`page ${pos}`} id="p3">
      <div className="ph">
        <div className="ph-g">{months[selDateObj.getMonth()]} {selDateObj.getFullYear()}</div>
        <div className="ph-t">Time <em>Line</em></div>
      </div>

      {/* Calendar Strip */}
      <div className="cal-strip" ref={scrollRef}>
        {timeline.map(ts => {
          const d = new Date(ts);
          const isT = ts === today.getTime();
          const isS = ts === selDate;
          
          return (
            <div 
              key={ts} 
              className={`cal-dy ${isT ? 'today' : ''} ${isS ? 'sel' : ''}`}
              onClick={() => setSelDate(ts)}
            >
              <div className="cd-dow">{days[d.getDay()]}</div>
              <div className="cd-num">{d.getDate()}</div>
              {isT && <div className="cd-dot"></div>}
            </div>
          );
        })}
      </div>

      <div className="sl" style={{marginTop: '24px'}}>
        <span className="sli">{isPast ? '🕰️' : isToday ? '✨' : '🔮'}</span>
        <h3>
          {isPast ? `Recap: ${selDateObj.toDateString()}` : 
           isToday ? "Today's Overview" : 
           `Looking Ahead: ${selDateObj.toDateString()}`}
        </h3>
      </div>

      {isPast && renderPast()}
      {isToday && renderToday()}
      {isFuture && renderFuture()}
    </div>
  );
}
