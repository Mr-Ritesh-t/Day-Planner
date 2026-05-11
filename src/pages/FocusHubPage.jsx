import React, { useState, useEffect, useRef } from 'react';
import { CapacitorUsageStatsManager } from '@capgo/capacitor-android-usagestatsmanager';
import { LocalNotifications } from '@capacitor/local-notifications';

export default function FocusHubPage({ state, setState, active, pos, showToast }) {
  const session = state.focusSession || { isActive: false, settings: {}, stats: { elapsedSecs: 0, distractions: [] } };
  const [tempSettings, setTempSettings] = useState(session.settings || {});
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'session', 'summary'
  const [lastSessionData, setLastSessionData] = useState(null);
  const [newAllowedApp, setNewAllowedApp] = useState('');
  const [violationTime, setViolationTime] = useState(0);
  const [stoppingReason, setStoppingReason] = useState('');
  const [showReasonModal, setShowReasonModal] = useState(false);
  
  const timerRef = useRef(null);
  const musicRef = useRef(null);
  const violationRef = useRef(null);
  const wakeLockRef = useRef(null);
  
  const musicTracks = [
    { id: 'lofi', name: 'Lofi Beats', icon: '☕', url: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808f3030e.mp3' },
    { id: 'white', name: 'White Noise', icon: '💨', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
    { id: 'nature', name: 'Nature', icon: '🌲', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: 'binaural', name: 'Focus Alpha', icon: '🧠', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  ];

  // ── CORE ENGINE: Timer & Logic ──
  useEffect(() => {
    if (session.isActive) {
      timerRef.current = setInterval(handleTick, 1000);
      handleMusic(session.settings.musicType, true);
      
      // Hardware Lock: Back Button & Fullscreen
      if (session.settings.isStrict) {
        lockHardware();
      }
    } else {
      clearInterval(timerRef.current);
      handleMusic(null, false);
      unlockHardware();
    }
    return () => {
      clearInterval(timerRef.current);
      unlockHardware();
    };
  }, [session.isActive, session.phase]);

  const lockHardware = () => {
    // 1. Fullscreen / Immersive Mode
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
    }
    
    // 2. Intercept Back Button
    window.history.pushState(null, null, window.location.pathname);
    window.addEventListener('popstate', handleBackButton);
    
    // 3. Background Detection
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // 4. Wake Lock (Keep Screen On)
    requestWakeLock();
  };

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      }
    } catch (err) {
      console.warn("WakeLock failed:", err);
    }
  };

  const unlockHardware = () => {
    if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
    }
    window.removeEventListener('popstate', handleBackButton);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
    
    clearInterval(violationRef.current);
    setViolationTime(0);
  };

  const handleVisibilityChange = () => {
    if (document.hidden && session.isActive && session.settings?.isStrict) {
      // User left the app! Start punishment timer
      showToast('GET BACK TO WORK! 🚨');
      vibrate([500, 200, 500]);
      
      let count = 0;
      violationRef.current = setInterval(() => {
        count++;
        setViolationTime(count);
        
        LocalNotifications.schedule({
          notifications: [{
            title: '⚠️ FOCUS VIOLATION!',
            body: `Return immediately! Session fails in ${10 - count}s`,
            id: 2,
            priority: 2,
            sound: 'default'
          }]
        });

        if (count >= 10) {
          clearInterval(violationRef.current);
          failSession();
        }
      }, 1000);
    } else {
      // User returned
      clearInterval(violationRef.current);
      setViolationTime(0);
    }
  };

  const failSession = () => {
    setLastSessionData({
      duration: Math.floor(session.stats.elapsedSecs / 60),
      distractions: session.stats.distractions.length + 1,
      phase: 'FAILED',
      subject: state.subjects?.find(s => s.id === session.subjectId)?.name || 'General'
    });
    setState(prev => ({
      ...prev,
      focusSession: { ...prev.focusSession, isActive: false }
    }));
    setActiveTab('summary');
    showToast('Session Failed. You lost your focus streak. 🥀');
  };

  const handleBackButton = () => {
    window.history.pushState(null, null, window.location.pathname);
    showToast('Focus is locked! Use the End Session button below. 🔒');
    if (navigator.vibrate) navigator.vibrate(200);
  };

  const handleTick = () => {
    setState(prev => {
      const fs = prev.focusSession;
      if (!fs.isActive) return prev;

      const newElapsed = fs.stats.elapsedSecs + 1;
      const targetSecs = (fs.phase === 'WORK' ? fs.settings.workMins : fs.settings.breakMins) * 60;

      if (newElapsed >= targetSecs) {
        // Phase End
        const newPhase = fs.phase === 'WORK' ? 'BREAK' : 'WORK';
        handlePhaseEnd(fs.phase, newPhase);
        return {
          ...prev,
          focusSession: {
            ...fs,
            phase: newPhase,
            stats: { ...fs.stats, elapsedSecs: 0 }
          }
        };
      }

      return {
        ...prev,
        focusSession: {
          ...fs,
          stats: { ...fs.stats, elapsedSecs: newElapsed }
        }
      };
    });
    
    // Android Distraction Check (if strict)
    if (session.settings.isStrict) checkAndroidDistractions();
  };

  const handlePhaseEnd = (oldPhase, newPhase) => {
    const title = oldPhase === 'WORK' ? 'Focus Done! 🍅' : 'Break Over! ☕';
    const body = oldPhase === 'WORK' ? 'Time for a break.' : 'Back to work!';
    
    LocalNotifications.schedule({
      notifications: [{ title, body, id: 1, sound: 'default' }]
    });
    
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    showToast(title);
  };

  const handleMusic = (type, play) => {
    if (musicRef.current) {
      musicRef.current.pause();
      musicRef.current = null;
    }
    if (play && type !== 'none') {
      const track = musicTracks.find(t => t.id === type);
      if (track) {
        const audio = new Audio(track.url);
        audio.loop = true;
        audio.play().catch(e => console.warn("Music fail:", e));
        musicRef.current = audio;
      }
    }
  };

  const checkAndroidDistractions = async () => {
    try {
      const { granted } = await CapacitorUsageStatsManager.isUsageStatsPermissionGranted();
      if (!granted) return;

      const now = Date.now();
      const stats = await CapacitorUsageStatsManager.queryAndAggregateUsageStats({
        beginTime: session.startTime,
        endTime: now
      });

      Object.entries(stats).forEach(([pkg, data]) => {
        const appName = data.appName || pkg.split('.').pop();
        const isBlocked = (state.blockedApps || []).some(b => 
          appName.toLowerCase().includes(b.toLowerCase()) || pkg.toLowerCase().includes(b.toLowerCase())
        );
        const isAllowed = (state.allowedApps || []).some(a => 
          appName.toLowerCase().includes(a.toLowerCase()) || pkg.toLowerCase().includes(a.toLowerCase())
        );

        if (isBlocked && !isAllowed && data.lastTimeUsed > session.startTime) {
          const alreadyNotified = (session.stats?.distractions || []).some(d => 
            d.name === appName && Math.abs(d.time - data.lastTimeUsed) < 10000
          );
          if (!alreadyNotified) {
            logDistraction(appName, data.lastTimeUsed);
          }
        }
      });
    } catch (e) {}
  };

  const logDistraction = (name, time) => {
    setState(prev => ({
      ...prev,
      focusSession: {
        ...prev.focusSession,
        stats: {
          ...prev.focusSession.stats,
          distractions: [...prev.focusSession.stats.distractions, { name, time }]
        }
      }
    }));
    showToast(`Distraction detected: ${name}! 🚫`);
    if (navigator.vibrate) navigator.vibrate(500);
  };

  const startSession = () => {
    setState(prev => ({
      ...prev,
      focusSession: {
        isActive: true,
        phase: 'WORK',
        startTime: Date.now(),
        subjectId: prev.subjects?.[0]?.id || null,
        settings: tempSettings,
        stats: { elapsedSecs: 0, distractions: [] }
      }
    }));
    
    // Persistent Notification
    LocalNotifications.schedule({
      notifications: [{
        title: '🔒 DEEP FOCUS ACTIVE',
        body: 'Your phone is now a study tool. Navigation is locked.',
        id: 10,
        ongoing: true, // This makes it un-swipeable on many Android versions
        priority: 2
      }]
    });
    
    showToast('Focus Session Started! 🚀');
  };

  const addAllowedApp = () => {
    if (!newAllowedApp.trim()) return;
    setState(prev => ({
      ...prev,
      allowedApps: [...(prev.allowedApps || []), newAllowedApp.trim()]
    }));
    setNewAllowedApp('');
    showToast(`${newAllowedApp} is now an allowed tool! ✅`);
  };

  const removeAllowedApp = (app) => {
    setState(prev => ({
      ...prev,
      allowedApps: prev.allowedApps.filter(a => a !== app)
    }));
  };

  const handleStopRequest = () => {
    setShowReasonModal(true);
    // Pause everything but keep session active for now
    clearInterval(timerRef.current);
  };

  const confirmStop = () => {
    const data = {
      duration: Math.floor(session.stats.elapsedSecs / 60),
      distractions: session.stats.distractions.length,
      phase: session.phase,
      subject: state.subjects?.find(s => s.id === session.subjectId)?.name || 'General',
      stopReason: stoppingReason || 'No reason provided'
    };
    
    setLastSessionData(data);
    setState(prev => ({
      ...prev,
      focusSession: { ...prev.focusSession, isActive: false }
    }));
    setShowReasonModal(false);
    setActiveTab('summary');
  };

  const cancelStop = () => {
    setShowReasonModal(false);
    // Resume timer
    timerRef.current = setInterval(handleTick, 1000);
  };

  const stopSession = () => {
    handleStopRequest();
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // ── RENDERERS ──
  
  if (session.isActive) {
    const target = ((session.settings?.workMins || 25) * 60);
    const progress = (session.stats?.elapsedSecs / target) * 100;
    const color = session.phase === 'WORK' ? 'var(--primary)' : '#4caf50';

    return (
      <div className={`page ${pos}`} style={{ background: '#000', color: '#fff', padding: 0 }}>
        {/* Full Screen Locked View */}
        <div style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '4px', opacity: 0.5, marginBottom: '20px' }}>
            {session.phase} PHASE
          </div>

          <div style={{ position: 'relative', width: '240px', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="240" height="240" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
              <circle cx="120" cy="120" r="110" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
              <circle cx="120" cy="120" r="110" fill="none" stroke={color} strokeWidth="8" strokeDasharray="691" strokeDashoffset={691 - (691 * progress / 100)} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear' }} />
            </svg>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', fontWeight: 950 }}>{formatTime(target - (session.stats?.elapsedSecs || 0))}</div>
              <div style={{ fontSize: '13px', opacity: 0.6, marginTop: '4px' }}>remaining</div>
            </div>
          </div>

          <div style={{ marginTop: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--primary)' }}>SYSTEM LOCKED</div>
            <div style={{ fontSize: '12px', opacity: 0.4, marginTop: '8px', letterSpacing: '2px' }}>
              REMAINING FOCUS TIME
            </div>
          </div>

          {violationTime > 0 && (
            <div style={{ 
              marginTop: '20px',
              background: '#ff4444', 
              color: '#fff', 
              padding: '20px', 
              borderRadius: '24px', 
              width: '100%', 
              textAlign: 'center',
              animation: 'pulse-red 1s infinite'
            }}>
              <div style={{ fontWeight: 900, fontSize: '18px' }}>VIOLATION DETECTED!</div>
              <div style={{ fontSize: '12px' }}>SESSION FAILS IN {10 - violationTime}s</div>
            </div>
          )}

          {/* Supporting Systems Status */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '40px' }}>
             {session.settings?.musicType && session.settings.musicType !== 'none' && <div className="status-pill">🎵 Music</div>}
             {session.settings?.youtubeMode && <button className="status-pill active" onClick={() => setActiveTab('youtube')}>📺 Open YouTube</button>}
             {session.settings?.browserMode && <button className="status-pill active" onClick={() => setActiveTab('browser')}>🌐 Open Browser</button>}
          </div>

          {/* Study Overlays */}
          {activeTab === 'youtube' && (
              <div className="study-overlay">
                  <div className="study-header">
                      <span>YouTube Study Mode</span>
                      <button onClick={() => setActiveTab('session')}>Done</button>
                  </div>
                  <iframe 
                      src="https://www.youtube.com/embed?listType=search&list=study+with+me+tutorial"
                      title="YouTube Study"
                      style={{ width: '100%', flex: 1, border: 'none' }}
                  />
              </div>
          )}

          {activeTab === 'browser' && (
              <div className="study-overlay">
                  <div className="study-header">
                      <span>Study Browser</span>
                      <button onClick={() => setActiveTab('session')}>Done</button>
                  </div>
                  <div style={{ background: '#222', padding: '12px', fontSize: '12px' }}>
                      🛡️ Safe Search Active | Blocked: Social Media, Entertainment
                  </div>
                  <iframe 
                      src="https://www.google.com/search?q=study+resources&igu=1"
                      title="Study Browser"
                      style={{ width: '100%', flex: 1, border: 'none', background: '#fff' }}
                  />
              </div>
          )}

          {showReasonModal && (
            <div className="reason-modal">
              <div className="reason-card">
                <div style={{ fontSize: '24px', fontWeight: 900, marginBottom: '8px' }}>🚧 Stop Session?</div>
                <p style={{ opacity: 0.6, fontSize: '13px', marginBottom: '24px' }}>Era wants to know why you're stopping early.</p>
                
                <textarea 
                  value={stoppingReason}
                  onChange={e => setStoppingReason(e.target.value)}
                  placeholder="Enter your reason here..."
                  className="reason-input"
                />

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
                  {['Emergency', 'Finished Task', 'Bored/Tired', 'External Call'].map(r => (
                    <button key={r} onClick={() => { setStoppingReason(r); }} className="reason-chip">{r}</button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={cancelStop} style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid #333', color: '#fff', fontWeight: 800 }}>Cancel</button>
                  <button onClick={confirmStop} style={{ flex: 1, padding: '16px', borderRadius: '16px', background: '#ff4444', border: 'none', color: '#fff', fontWeight: 800 }}>Stop Now</button>
                </div>
              </div>
            </div>
          )}

          {/* Software Lock Status */}
          <div style={{ marginTop: '40px', opacity: 0.3, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px' }}>
            🔒 Screen Wake Lock Active
          </div>

          {/* Distraction Alert */}
          {session.stats?.distractions?.length > 0 && (
            <div style={{ marginTop: '20px', color: '#ff4444', fontSize: '12px', fontWeight: 800 }}>
              ⚠️ {session.stats.distractions.length} Distractions Detected
            </div>
          )}

          {/* Exit Mechanism */}
          <div style={{ position: 'absolute', bottom: '60px', width: '100%', padding: '0 40px' }}>
            <button 
               onMouseDown={() => { window._exitT = setTimeout(stopSession, 3000); }}
               onMouseUp={() => clearTimeout(window._exitT)}
               onTouchStart={() => { window._exitT = setTimeout(stopSession, 3000); }}
               onTouchEnd={() => clearTimeout(window._exitT)}
               className="exit-btn"
            >
              Hold 3s to End Session
            </button>
          </div>
        </div>
        
        <style>{`
          .status-pill { background: rgba(255,255,255,0.08); padding: 8px 16px; border-radius: 20px; font-size: 11px; font-weight: 700; border: none; color: #fff; cursor: pointer; }
          .status-pill.active { background: var(--primary); }
          .exit-btn { width: 100%; padding: 20px; border-radius: 20px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; font-weight: 800; cursor: pointer; }
          
          .study-overlay { position: fixed; inset: 0; background: #000; z-index: 1001; display: flex; flex-direction: column; }
          .study-header { padding: 20px; display: flex; justify-content: space-between; align-items: center; background: #111; border-bottom: 1px solid #222; }
          .study-header span { font-weight: 800; font-size: 14px; }
          .study-header button { background: var(--primary); border: none; color: #fff; padding: 6px 16px; border-radius: 12px; font-weight: 800; }
        `}</style>
      </div>
    );
  }

  if (activeTab === 'summary') {
      return (
          <div className={`page ${pos}`} style={{ background: '#121011', color: '#fff', padding: '40px 20px' }}>
              <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                  <div style={{ fontSize: '48px' }}>✨</div>
                  <h2 style={{ fontSize: '28px', fontWeight: 900, marginTop: '16px' }}>Session Summary</h2>
              </div>
              
              <div className="summary-card">
                  <div className="sum-item">
                      <label>STUDY TIME</label>
                      <value>{lastSessionData?.duration} min</value>
                  </div>
                  <div className="sum-item">
                      <label>DISTRACTIONS</label>
                      <value style={{ color: lastSessionData?.distractions > 0 ? '#ff4444' : '#4caf50' }}>{lastSessionData?.distractions}</value>
                  </div>
                  <div className="sum-item">
                      <label>SUBJECT</label>
                      <value>{lastSessionData?.subject}</value>
                  </div>
                  {lastSessionData?.stopReason && (
                    <div className="sum-item">
                        <label>STOP REASON</label>
                        <value style={{ fontStyle: 'italic', opacity: 0.8 }}>"{lastSessionData.stopReason}"</value>
                    </div>
                  )}
              </div>

              <button className="albtn" onClick={() => setActiveTab('dashboard')} style={{ marginTop: '40px', width: '100%', background: '#fff', color: '#000' }}>
                  Done
              </button>
              
              <style>{`
                .summary-card { background: #1d1a1c; border-radius: 28px; padding: 24px; display: flex; flex-direction: column; gap: 20px; }
                .sum-item label { font-size: 10px; font-weight: 900; opacity: 0.5; letter-spacing: 1px; }
                .sum-item value { font-size: 20px; font-weight: 800; display: block; margin-top: 4px; }
              `}</style>
          </div>
      );
  }

  return (
    <div className={`page ${pos}`} style={{ background: '#121011', color: '#fff' }}>
      {/* Dashboard (IDLE) View */}
      <div style={{ padding: '24px 20px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 950, marginBottom: '4px' }}>Control Center</h1>
        <p style={{ opacity: 0.5, fontSize: '13px', marginBottom: '32px' }}>Configure your focus session</p>

        {/* Timer Config */}
        <div className="config-group">
            <label className="group-label">⏱️ Timer Engine</label>
            <div className="config-card">
                <div className="config-row">
                    <span>Work Duration</span>
                    <input type="number" value={tempSettings?.workMins || 25} onChange={e => setTempSettings({...tempSettings, workMins: +e.target.value})} className="num-inp" />
                </div>
                <div className="config-row">
                    <span>Break Duration</span>
                    <input type="number" value={tempSettings?.breakMins || 5} onChange={e => setTempSettings({...tempSettings, breakMins: +e.target.value})} className="num-inp" />
                </div>
            </div>
        </div>

        {/* Supporting Systems */}
        <div className="config-group" style={{ marginTop: '30px' }}>
            <label className="group-label">⚙️ Supporting Systems</label>
            <div className="config-card">
                <div className="config-row" onClick={() => setTempSettings({...tempSettings, isStrict: !tempSettings?.isStrict})}>
                    <div className="row-info">
                        <strong>Strict Mode</strong>
                        <span>Enable Android App Blocker</span>
                    </div>
                    <div className={`ios-toggle-hub ${tempSettings?.isStrict ? 'active' : ''}`} />
                </div>
                <div className="config-row" onClick={() => setTempSettings({...tempSettings, youtubeMode: !tempSettings?.youtubeMode})}>
                    <div className="row-info">
                        <strong>YouTube Study Mode</strong>
                        <span>Hide distractions on YT</span>
                    </div>
                    <div className={`ios-toggle-hub ${tempSettings?.youtubeMode ? 'active' : ''}`} />
                </div>
                <div className="config-row" onClick={() => setTempSettings({...tempSettings, browserMode: !tempSettings?.browserMode})}>
                    <div className="row-info">
                        <strong>Browser Study Mode</strong>
                        <span>Safe research browsing</span>
                    </div>
                    <div className={`ios-toggle-hub ${tempSettings?.browserMode ? 'active' : ''}`} />
                </div>
            </div>
        </div>

        {/* Music Engine */}
        <div className="config-group" style={{ marginTop: '30px' }}>
            <label className="group-label">🎵 Music Engine</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {musicTracks.map(t => (
                    <button 
                        key={t.id} 
                        onClick={() => setTempSettings({...tempSettings, musicType: tempSettings?.musicType === t.id ? 'none' : t.id})}
                        className={`music-choice ${tempSettings?.musicType === t.id ? 'active' : ''}`}
                    >
                        {t.icon}
                    </button>
                ))}
            </div>
        </div>

        {/* Blocklist Manager */}
        <div className="config-group" style={{ marginTop: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label className="group-label" style={{ marginBottom: 0 }}>🚫 App Blocklist</label>
                <span style={{ fontSize: '11px', opacity: 0.5 }}>{state.blockedApps?.length || 0} Blocked</span>
            </div>
            <div className="config-card" style={{ padding: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {(state.blockedApps || []).map(app => (
                    <span key={app} className="app-tag">{app}</span>
                ))}
                <button className="add-tag" onClick={() => showToast('Manage Blocklist in Settings ⚙️')}>+ Edit</button>
            </div>
        </div>

        {/* Allowed Tools (Whitelist) */}
        <div className="config-group" style={{ marginTop: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label className="group-label" style={{ marginBottom: 0 }}>✅ Allowed Tools</label>
                <span style={{ fontSize: '11px', opacity: 0.5 }}>Whitelist</span>
            </div>
            <div className="config-card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <input 
                        value={newAllowedApp} 
                        onChange={e => setNewAllowedApp(e.target.value)}
                        placeholder="App to allow (e.g. Calculator)"
                        style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: '8px 12px', borderRadius: '12px', fontSize: '12px' }}
                    />
                    <button onClick={addAllowedApp} style={{ background: '#4caf50', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '12px', fontWeight: 800, fontSize: '12px' }}>Allow</button>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {(state.allowedApps || ['Calculator', 'Phone']).map(app => (
                        <span key={app} className="app-tag" style={{ background: 'rgba(76,175,80,0.1)', color: '#4caf50', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {app}
                            <button onClick={() => removeAllowedApp(app)} style={{ background: 'none', border: 'none', color: '#ff4444', padding: 0, fontSize: '14px' }}>✕</button>
                        </span>
                    ))}
                </div>
            </div>
            <p style={{ fontSize: '11px', opacity: 0.4, marginTop: '8px' }}>
                Apps in this list will NOT trigger distraction alerts.
            </p>
        </div>

        {/* Start Session Trigger */}
        <div style={{ marginTop: '40px', paddingBottom: '100px' }}>
            <button className="start-btn" onClick={startSession}>
                Start Focus Session 🚀
            </button>
        </div>
      </div>

      <style>{`
        .config-group { display: flex; flex-direction: column; gap: 12px; }
        .group-label { font-size: 11px; font-weight: 800; opacity: 0.4; text-transform: uppercase; letter-spacing: 1px; }
        .config-card { background: #1d1a1c; border-radius: 24px; overflow: hidden; }
        .config-row { padding: 18px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.03); cursor: pointer; }
        .config-row:last-child { border-bottom: none; }
        .row-info { display: flex; flex-direction: column; gap: 2px; }
        .row-info strong { font-size: 15px; font-weight: 700; }
        .row-info span { font-size: 11px; opacity: 0.5; }
        
        .num-inp { background: rgba(255,255,255,0.05); border: none; color: #fff; width: 60px; padding: 8px; border-radius: 12px; text-align: center; font-weight: 800; font-family: inherit; }
        
        .ios-toggle-hub { width: 42px; height: 24px; background: rgba(255,255,255,0.1); border-radius: 20px; position: relative; transition: 0.3s; }
        .ios-toggle-hub.active { background: var(--primary); }
        .ios-toggle-hub::after { content: ''; position: absolute; top: 2px; left: 2px; width: 20px; height: 20px; background: #fff; border-radius: 50%; transition: 0.3s; }
        .ios-toggle-hub.active::after { left: 20px; }

        .music-choice { background: #1d1a1c; border: 2px solid transparent; border-radius: 16px; height: 60px; font-size: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
        .music-choice.active { border-color: var(--primary); background: rgba(137,68,104,0.1); }
        
        .app-tag { background: rgba(255,255,255,0.05); padding: 6px 14px; borderRadius: 12px; font-size: 11px; font-weight: 700; }
        .add-tag { background: var(--primary); border: none; color: #fff; padding: 6px 14px; border-radius: 12px; font-size: 11px; font-weight: 800; }
        
        .start-btn { width: 100%; padding: 24px; border-radius: 32px; border: none; background: #fff; color: #000; font-size: 18px; font-weight: 900; box-shadow: 0 10px 30px rgba(255,255,255,0.1); cursor: pointer; }
        
        @keyframes pulse-red {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,68,68,0.7); }
          70% { transform: scale(1.02); box-shadow: 0 0 0 20px rgba(255,68,68,0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,68,68,0); }
        }

        .reason-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 30px; backdrop-filter: blur(10px); }
        .reason-card { background: #1a181a; border: 1px solid #333; padding: 30px; border-radius: 32px; width: 100%; max-width: 400px; }
        .reason-input { width: 100%; height: 100px; background: rgba(255,255,255,0.05); border: 1px solid #333; border-radius: 20px; color: #fff; padding: 15px; font-family: inherit; font-size: 14px; margin-bottom: 12px; resize: none; }
        .reason-chip { background: rgba(255,255,255,0.05); border: 1px solid #333; color: #fff; padding: 6px 14px; border-radius: 12px; font-size: 11px; font-weight: 700; cursor: pointer; }
      `}</style>
    </div>
  );
}
