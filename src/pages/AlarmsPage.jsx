import { useState } from 'react';

export default function AlarmsPage({ state, setState, active, pos, showToast }) {
  const [aTime, setATime] = useState('');
  const [aTitle, setATitle] = useState('');

  const addAlarm = () => {
    if (!aTime) {
      showToast('Please select a time ⏰');
      return;
    }
    const newAlarm = {
      id: Date.now(),
      time: aTime,
      title: aTitle.trim() || 'Custom Alarm',
      enabled: true
    };
    setState(prev => ({
      ...prev,
      customAlarms: [...(prev.customAlarms || []), newAlarm]
    }));
    setATime('');
    setATitle('');
    showToast('Alarm added ✨');
  };

  const toggleAlarm = (id) => {
    setState(prev => ({
      ...prev,
      customAlarms: (prev.customAlarms || []).map(a => 
        a.id === id ? { ...a, enabled: !a.enabled } : a
      )
    }));
  };

  const deleteAlarm = (id) => {
    setState(prev => ({
      ...prev,
      customAlarms: (prev.customAlarms || []).filter(a => a.id !== id)
    }));
  };

  // Convert "HH:MM" to "HH:MM AM/PM" for display
  const formatTime = (time24) => {
    const [h, m] = time24.split(':');
    let h12 = parseInt(h, 10);
    const ampm = h12 >= 12 ? 'PM' : 'AM';
    h12 = h12 % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  };

  const alarms = state.customAlarms || [];

  return (
    <div className={`page ${pos}`} id="p3">
      <div className="ntopbar">
        <div><div className="ntl">Manage</div><h2>My <em>Alarms</em> ⏰</h2></div>
      </div>

      <div className="ncompose" style={{ marginBottom: '24px' }}>
        <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '12px', fontWeight: 600 }}>Create New Alarm</p>
        <p style={{ fontSize: '10px', color: 'var(--text-dim)', marginBottom: '12px', fontWeight: 600 }}>Set time</p>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <input 
            type="time" 
            className="inp" 
            style={{ width: 'auto' }}
            value={aTime}
            onChange={e => setATime(e.target.value)}
          />
          <input 
            type="text" 
            className="inp" 
            placeholder="What's this for?" 
            value={aTitle}
            onChange={e => setATitle(e.target.value)}
          />
        </div>
        <button className={`fab-add ${aTime ? 'ready' : ''}`} style={{ width: '100%' }} onClick={addAlarm}>
          Add Alarm
        </button>
      </div>

      <div className="sl">
        <span className="sli">🔔</span>
        <h3>Active System Features</h3>
      </div>
      <div className="pgrid" style={{ marginBottom: '24px' }}>
         <div className="pc c0">
            <div className="pct">✨ Routines</div>
            <div className="pcc" style={{ fontSize: '11px', marginTop: '4px' }}>Your daily routines added in the Daily planner will trigger alarms automatically at their specific times.</div>
         </div>
      </div>

      <div className="sl">
        <span className="sli">⏰</span>
        <h3>Custom Alarms</h3>
        <span className="slc">{alarms.length}</span>
      </div>
      
      <div id="nList" style={{ padding: '0 20px', paddingBottom: '100px' }}>
        {!alarms.length ? (
          <div className="empty">
            No custom alarms set...<br />Time to add some! 🌅
          </div>
        ) : (
          alarms.map(a => (
            <div key={a.id} className={`nli ${!a.enabled ? 'disabled' : ''}`} style={{ opacity: a.enabled ? 1 : 0.6, display: 'flex', alignItems: 'center' }}>
              <div className="nlib" style={{ flex: 1 }}>
                <div className="nliTag" style={{ fontSize: '18px', color: 'var(--primary)', marginBottom: '4px' }}>
                  {formatTime(a.time)}
                </div>
                <div className="nlitxt" style={{ fontSize: '13px', fontWeight: 600 }}>{a.title}</div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button 
                  className="slogbtn" 
                  style={{ background: a.enabled ? 'var(--primary)' : 'var(--surface-container-low)', color: a.enabled ? 'var(--bg)' : 'var(--text-dim)', padding: '6px 12px', fontSize: '12px' }}
                  onClick={() => toggleAlarm(a.id)}
                >
                  {a.enabled ? 'ON' : 'OFF'}
                </button>
                <button className="nlidel" onClick={() => deleteAlarm(a.id)} style={{ padding: '8px' }}>✕</button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
