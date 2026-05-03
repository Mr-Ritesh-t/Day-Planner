import { useState } from 'react';
import AssignmentTracker from '../components/AssignmentTracker';
import Timetable from '../components/Timetable';
import ExamCountdown from '../components/ExamCountdown';
import { CapgoAlarm } from '@capgo/capacitor-alarm';

export default function AlarmsPage({ state, setState, active, pos, showToast, fullState }) {
  const [aTime, setATime] = useState('');
  const [aTitle, setATitle] = useState('');
  const [activeTab, setActiveTab] = useState('alarms'); // 'alarms' | 'assignments' | 'exams' | 'timetable'

  const addAlarm = async () => {
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
    
    // Sync to Native Clock App
    try {
      const [h, m] = aTime.split(':');
      await CapgoAlarm.createAlarm({
        hour: parseInt(h, 10),
        minute: parseInt(m, 10),
        label: newAlarm.title,
        skipUi: true,
        vibrate: true
      });
      showToast('Alarm synced to phone clock ⏰✨');
    } catch (e) {
      console.error(e);
      showToast('Added inside app (Native sync failed)');
    }

    setState(prev => ({
      ...prev,
      customAlarms: [...(prev.customAlarms || []), newAlarm]
    }));
    setATime('');
    setATitle('');
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

  const formatTime = (time24) => {
    const [h, m] = time24.split(':');
    let h12 = parseInt(h, 10);
    const ampm = h12 >= 12 ? 'PM' : 'AM';
    h12 = h12 % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  };

  const alarms = state.customAlarms || [];
  const pendingAssignments = (state.assignments || []).filter(a => a.status === 'pending').length;
  const examCount = (state.exams || []).length;

  const TABS = [
    { key: 'alarms', label: '⏰ Alarms', badge: 0 },
    { key: 'assignments', label: '📋 Assignments', badge: pendingAssignments },
    { key: 'exams', label: '📝 Exams', badge: examCount },
    { key: 'timetable', label: '🗓️ Timetable', badge: 0 },
  ];

  return (
    <div className={`page ${pos}`} id="p3">
      <div className="ntopbar">
        <div><div className="ntl">Manage</div><h2>Study <em>Schedule</em> ⏰</h2></div>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', padding: '0 4px' }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1,
              background: activeTab === tab.key ? 'var(--primary)' : 'var(--surface-container-low)',
              color: activeTab === tab.key ? '#fff' : 'var(--text-dim)',
              border: 'none', borderRadius: '14px', padding: '10px 4px',
              fontSize: '11px', fontWeight: 700, cursor: 'pointer',
              position: 'relative', transition: 'all 0.2s'
            }}
          >
            {tab.label}
            {tab.badge > 0 && (
              <span style={{ position: 'absolute', top: '4px', right: '4px', background: '#ff4444', color: '#fff', borderRadius: '8px', fontSize: '9px', fontWeight: 800, padding: '1px 5px' }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Alarms tab */}
      {activeTab === 'alarms' && (
        <>
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
            <button className={`fab-add ready`} style={{ width: '100%', border: 'none' }} onClick={addAlarm}>
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
        </>
      )}

      {/* Assignments tab */}
      {activeTab === 'assignments' && (
        <div style={{ paddingBottom: '100px' }}>
          <AssignmentTracker state={state} setState={setState} showToast={showToast} />
        </div>
      )}

      {/* Exams tab */}
      {activeTab === 'exams' && (
        <div style={{ paddingBottom: '100px' }}>
          <ExamCountdown state={state} setState={setState} showToast={showToast} />
        </div>
      )}

      {/* Timetable tab */}
      {activeTab === 'timetable' && (
        <div style={{ paddingBottom: '100px' }}>
          <Timetable state={state} setState={setState} showToast={showToast} />
        </div>
      )}
    </div>
  );
}
