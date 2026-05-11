import React, { useState, useEffect, useCallback, useMemo, Component } from 'react';
import { db, auth, hasFirebaseConfig, requestFCMToken, onAuthStateChanged, signOut } from './firebase';
import { LocalNotifications } from '@capacitor/local-notifications';
import { CapgoAlarm } from '@capgo/capacitor-alarm';
import { doc, setDoc, onSnapshot, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import './index.css';
import PlannerPage from './pages/PlannerPage';
import NotesPage from './pages/NotesPage';
import ProgressPage from './pages/ProgressPage';
import WelcomeScreen from './components/WelcomeScreen';
import AuthPage from './pages/AuthPage';
import CalendarPage from './pages/CalendarPage';
import AlarmsPage from './pages/AlarmsPage';
import ScreenTimePage from './pages/ScreenTimePage';
import AiAssistantPage from './pages/AiAssistantPage';

import BottomNav from './components/BottomNav';
import AlarmModal from './components/AlarmModal';
import WeeklyReport from './components/WeeklyReport';
import { ACH, cntDone } from './constants';
import { I18N } from './i18n';

function ErrorFallback({ error }) {
  return (
    <div style={{ padding: '40px', background: 'white', color: 'black', position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <h2 style={{ color: '#894468', marginBottom: '16px' }}>The Sanctuary encountered a small storm 🌸</h2>
      <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '12px', marginBottom: '24px', maxWidth: '300px' }}>
        <code style={{ fontSize: '11px', color: '#ff4444', wordBreak: 'break-all' }}>{error.message}</code>
      </div>
      <button onClick={() => window.location.reload()} style={{ padding: '14px 28px', background: '#894468', color: 'white', border: 'none', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(137,68,104,0.2)' }}>
        Restore the Peace ✨
      </button>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() { if (this.state.hasError) return <ErrorFallback error={this.state.error} />; return this.props.children; }
}

function App() {
  const getMonday = (d) => {
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1 - day);
    const mon = new Date(d);
    mon.setDate(d.getDate() + diff);
    return mon;
  };

  const createProfile = (name, email) => ({
    name, email, score: 0, dailyScore: 0, streak: 0,
    notifiedPartnerMilestone: 0,
    targetNotifiedToday: false,
    accountStatus: 'Healthy',
    blockedUsers: [],
    focusSession: {
      isActive: false,
      phase: 'IDLE', // IDLE, WORK, BREAK
      startTime: null,
      subjectId: null,
      settings: {
        workMins: 25,
        breakMins: 5,
        isStrict: false,
        youtubeMode: false,
        browserMode: false,
        musicType: 'none'
      },
      stats: {
        elapsedSecs: 0,
        distractions: []
      }
    },
    blockedApps: ['Instagram', 'Snapchat', 'TikTok'],
    allowedApps: ['Calculator', 'Phone', 'Clock', 'Calendar'],
    tasks: { anytime: [], morning: [], afternoon: [], evening: [] },
    monthlyRoutine: { anytime: [], morning: [], afternoon: [], evening: [] },
    habits: [
      { id: 1, e: '💧', n: 'Drink Water', done: false },
      { id: 2, e: '🏃‍♀️', n: 'Exercise', done: false },
      { id: 3, e: '📚', n: 'Study', done: false },
      { id: 4, e: '😴', n: 'Sleep Early', done: false },
      { id: 5, e: '🧘‍♀️', n: 'Meditate', done: false },
      { id: 6, e: '🥗', n: 'Eat Healthy', done: false },
    ],
    mood: null, moodHist: [],
    notes: [], subjects: [], weekData: [], studyMins: 0,
    unlockedAchievements: [], customAlarms: [],
    // Study features
    exams: [],
    syllabus: {},
    weeklyStudyGoal: 600,
    weekStudyMins: 0,
    weekStartDate: '',
    assignments: [],
    timetable: [],
    pomodoroSettings: { work: 25, shortBreak: 5, longBreak: 15 },
    pomodoroCount: 0,
    energyLog: [],
    // New Features
    isPrivate: false,
    blockedUsers: [],
    reportedUsers: [],
    accountStatus: 'Healthy',
    reasonForLeaving: '',
    language: 'en'
  });

  const [appSettings, setAppSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('hdp_react_settings');
      if (saved && saved !== 'undefined') return JSON.parse(saved);
    } catch (e) { console.error('Settings parse error', e); }
    return { 
      theme: 'light', 
      zoom: 100, 
      primaryColor: '#894468',
      language: 'en',
      bgMode: 'normal',
      isBold: false,
      notifications: { alarms: true, milestones: true, streak: true, partnerPts: true }
    };
  });

  // --- Authentication & Data Fetching ---
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [partnerData, setPartnerData] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // activeId — which profile is currently being viewed/edited. 
  // Defaults to own UID, can be switched to partnerId.
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      console.log('👤 Auth state change:', u ? 'User Logged In' : 'No User');
      setUser(u);
      setAuthLoading(false);
      if (u) {
        setActiveId(u.uid);
      }
    });
  }, []);

  // Listen to OWN data
  useEffect(() => {
    const handleNav = (e) => setCurrentPage(e.detail);
    window.addEventListener('navTo', handleNav);
    return () => window.removeEventListener('navTo', handleNav);
  }, []);

  useEffect(() => {
    if (!user) return;
    console.log('📡 Starting profile listener for:', user.uid);
    const dRef = doc(db, 'users', user.uid);
    const unsub = onSnapshot(dRef, 
      (snap) => {
        const data = snap.exists() ? snap.data() : null;
        if (data && data.name) {
          console.log('✅ Full profile loaded for:', data.name);
          setUserData(data);
        } else {
          console.log('❓ Profile incomplete or missing, showing setup');
          setUserData({ needsSetup: true });
        }
      },
      (err) => {
        console.error('❌ Firestore Listen Error:', err);
        showToast('Database Error: Check your connection 🌸');
      }
    );
    return unsub;
  }, [user]);

  // Listen to PARTNER data
  useEffect(() => {
    if (!userData?.partnerId) {
      setPartnerData(null);
      return;
    }
    const dRef = doc(db, 'users', userData.partnerId);
    const unsub = onSnapshot(dRef, (snap) => {
      if (snap.exists()) setPartnerData(snap.data());
    });
    return unsub;
  }, [userData?.partnerId]);

  // Synthetic state to keep existing components working
  const state = useMemo(() => {
    const profiles = {};
    if (userData && user) profiles[user.uid] = userData;
    if (partnerData && userData?.partnerId) profiles[userData.partnerId] = partnerData;
    
    return {
      profiles,
      lastDate: userData?.lastDate || new Date().toDateString()
    };
  }, [userData, partnerData, user]);

  const maskPrivateData = (prof, isOwn) => {
    if (isOwn) return prof;
    if (prof?.isPrivate) {
      return {
        ...prof,
        tasks: { anytime: [], morning: [], afternoon: [], evening: [] },
        habits: (prof.habits || []).map(h => ({ ...h, done: false, n: 'Private Habit' })),
        notes: [],
        subjects: [],
        isMasked: true
      };
    }
    return prof;
  };

  const activeProfile = maskPrivateData(state.profiles[activeId] || userData, activeId === user?.uid);

  const [currentPage, setCurrentPage] = useState(0);
  const [toast, setToast] = useState({ msg: '', on: false });
  const [alarm, setAlarm] = useState({ title: '', msg: '', open: false });
  const [activePeriod, setActivePeriod] = useState('all');
  const [showReport, setShowReport] = useState(false);

  const setState = useCallback(async (updater) => {
    if (!user || !userData) return;
    
    // Determine which profile is active
    const currentId = activeId || user.uid;
    const currentData = currentId === user.uid ? userData : partnerData;
    
    if (!currentData && currentId !== user.uid) {
      console.warn('⚠️ No partner data to update');
      return;
    }

    const nextData = typeof updater === 'function' ? updater(currentData || userData) : updater;
    
    console.log(`📤 Saving to Firestore for ID: ${currentId}...`);
    try {
      const dRef = doc(db, 'users', currentId);
      await setDoc(dRef, nextData, { merge: true });
      console.log('✅ Saved successfully');
    } catch (err) {
      console.error('❌ Firestore Save Error:', err);
      showToast('Error saving data: ' + err.code);
    }
  }, [user, userData, partnerData, activeId]);

  // Request FCM push permission
  useEffect(() => {
    if (!user) return;
    const registerPush = async () => {
      const token = await requestFCMToken();
      if (token && db) {
        const userRef = doc(db, 'users', user.uid);
        setDoc(userRef, { fcmToken: token, updatedAt: Date.now() }, { merge: true });
      }
    };
    registerPush();
  }, [user]);

  useEffect(() => {
    localStorage.setItem('hdp_react_settings', JSON.stringify(appSettings));
    
    // Theme Mode
    const body = document.body;
    appSettings.theme === 'dark' ? body.classList.add('theme-dark') : body.classList.remove('theme-dark');
    appSettings.isBold ? body.classList.add('mode-bold') : body.classList.remove('mode-bold');

    // Zoom Scaling
    document.documentElement.style.zoom = appSettings.zoom ? `${appSettings.zoom}%` : '100%';

    // Background Mode
    const appCont = document.querySelector('.app-container');
    if (appCont) {
      appCont.classList.remove('mode-white', 'mode-black');
      if (appSettings.bgMode === 'white') appCont.classList.add('mode-white');
      if (appSettings.bgMode === 'black') appCont.classList.add('mode-black');
    }

    // Primary Colors
    if (appSettings.primaryColor) {
      document.documentElement.style.setProperty('--primary', appSettings.primaryColor);
      
      const lighten = (color, amount) => {
        return '#' + color.replace(/^#/, '').replace(/../g, c => 
          ('0'+Math.min(255, Math.max(0, parseInt(c, 16) + amount)).toString(16)).substr(-2)
        );
      };
      
      const pCont = appSettings.theme === 'dark' ? lighten(appSettings.primaryColor, -60) : lighten(appSettings.primaryColor, 80);
      document.documentElement.style.setProperty('--primary-container', pCont);
    } else {
      document.documentElement.style.removeProperty('--primary');
      document.documentElement.style.removeProperty('--primary-container');
    }
  }, [appSettings]);

  // Toast Helper
  const showToast = useCallback((msg) => {
    setToast({ msg, on: true });
    if (window._toastTimeout) clearTimeout(window._toastTimeout);
    window._toastTimeout = setTimeout(() => setToast(prev => ({ ...prev, on: false })), 2400);
  }, []);

  // Check New Day logic for the LOGGED-IN user
  useEffect(() => {
    if (!userData || userData.needsSetup) return;
    const today = new Date().toDateString();
    if (userData.lastDate !== today) {
      setState(p => {
        const done = cntDone(p);
        const doneTasksList = Object.values(p.tasks).flat().filter(t => t.done).map(t => ({ title: t.title, time: t.startTime || t.time || '', note: t.note || '' }));
        const newWeekData = [...(p.weekData || []), { date: p.lastDate, tasks: done, doneTasksList, mood: p.mood, study: p.studyMins, points: p.dailyScore || 0 }];
        if (newWeekData.length > 7) newWeekData.shift();

        const routineTasks = p.monthlyRoutine || { anytime: [], morning: [], afternoon: [], evening: [] };
        const newDayTasks = {};
        const todayObj = new Date();
        const todayDay = todayObj.getDay();
        const todayISO = todayObj.toISOString().split('T')[0];

        Object.keys(routineTasks).forEach(period => {
          newDayTasks[period] = routineTasks[period]
            .filter(t => {
              if (t.weekdays && t.weekdays.length > 0 && !t.weekdays.includes(todayDay)) return false;
              if (t.startDate && todayISO < t.startDate) return false;
              if (t.endDate && todayISO > t.endDate) return false;
              return true;
            })
            .map(t => {
              // Sync routines to native clock app for the day
              const timeStr = t.startTime || t.time;
              if (timeStr) {
                const [h, m] = timeStr.split(':');
                CapgoAlarm.createAlarm({
                  hour: parseInt(h, 10),
                  minute: parseInt(m, 10),
                  label: t.title,
                  skipUi: true,
                  vibrate: true
                }).catch(e => console.log('Routine alarm skip:', e));
              }

              return {
                ...t,
                id: Date.now() + Math.random(),
                done: false,
                af: false
              };
            });
        });

        const currentWeekStart = getMonday(new Date()).toISOString().split('T')[0];
        const weekChanged = p.weekStartDate !== currentWeekStart;

        return {
          ...p,
          lastDate: today,
          streak: done > 0 ? (p.streak || 0) + 1 : 0,
          habits: (p.habits || []).map(h => ({ ...h, done: false })),
          customAlarms: (p.customAlarms || []).map(a => ({ ...a, triggeredToday: false })),
          mood: null,
          studyMins: 0,
          dailyScore: 0,
          weekData: newWeekData,
          tasks: newDayTasks,
          weekStudyMins: weekChanged ? 0 : (p.weekStudyMins || 0),
          weekStartDate: weekChanged ? currentWeekStart : (p.weekStartDate || currentWeekStart),
        };
      });
    }
  }, [userData?.lastDate]);

  // Alarm Check logic — fires for OWN user
  useEffect(() => {
    if (!userData) return;
    const interval = setInterval(() => {
      const now = new Date();
      const cur = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      let triggered = false;
      const newTasks = { ...userData.tasks };
      let triggeredTitle = '';

      Object.keys(newTasks).forEach(period => {
        newTasks[period] = (newTasks[period] || []).map(t => {
          const checkTime = t.startTime || t.time;
          if (checkTime === cur && !t.done && !t.af) {
            triggered = true;
            triggeredTitle = t.title;
            return { ...t, af: true };
          }
          return t;
        });
      });

      let newCustomAlarms = [...(userData.customAlarms || [])];
      newCustomAlarms = newCustomAlarms.map(a => {
        if (a.time === cur && a.enabled && !a.triggeredToday) {
          triggered = true;
          triggeredTitle = a.title;
          return { ...a, triggeredToday: true };
        }
        return a;
      });

      if (triggered) {
        fireAlarm(triggeredTitle);
        setState(p => ({ ...p, tasks: newTasks, customAlarms: newCustomAlarms }));
      }

      // 🕒 Evening Streak Reminder
      if (now.getHours() === 20 && now.getMinutes() === 0 && cntDone(userData) === 0 && appSettings.notifications?.streak) {
        fireAlarm(t.n_remind || "Keep your streak alive! 🌸");
      }

      // 🎯 Daily Target Points Notification
      const dailyTarget = 200; // Mock target
      if (userData.dailyScore >= dailyTarget && !userData.targetNotifiedToday && appSettings.notifications?.streak) {
        fireAlarm("Goal Reached! 🎯");
        setState(p => ({ ...p, targetNotifiedToday: true }));
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [userData?.tasks, user]);

  const fireAlarm = (title) => {
    const alMsgs = ["Time for your routine! 💖", "Hey, it's time for " + title + "! ✨", "Little reminder for you... 🌸", "A nudge for your day! 🌟"];
    const textMsg = alMsgs[Math.floor(Math.random() * alMsgs.length)];
    setAlarm({ title, msg: textMsg, open: true });
    playChime();

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(`Reminder: ${title}`, { body: textMsg });
    }
  };

  const playChime = () => {
    try {
      const c = new (window.AudioContext || window.webkitAudioContext)();
      [523, 659, 784, 659].forEach((f, i) => {
        const o = c.createOscillator(), g = c.createGain(); o.connect(g); g.connect(c.destination);
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0, c.currentTime + i * .22);
        g.gain.linearRampToValueAtTime(.1, c.currentTime + i * .22 + .05);
        g.gain.linearRampToValueAtTime(0, c.currentTime + i * .22 + .2);
        o.start(c.currentTime + i * .22); o.stop(c.currentTime + i * .22 + .22);
      });
    } catch (e) { }
  };

  // Achievement Check 
  useEffect(() => {
    if (!userData || userData.needsSetup) return;
    ACH.forEach(a => {
      if (!(userData.unlockedAchievements || []).includes(a.id) && a.req(userData)) {
        setState(p => ({
          ...p,
          unlockedAchievements: [...(p.unlockedAchievements || []), a.id],
          score: (p.score || 0) + (a.pts || 0),
          dailyScore: (p.dailyScore || 0) + (a.pts || 0)
        }));
        showToast('🏅 ' + a.name + ' unlocked!');
      }
    });
  }, [userData, showToast]);

  // Partner Point Milestone Tracker
  useEffect(() => {
    if (!partnerData || !userData || !appSettings.notifications?.partnerPts) return;
    const pScore = partnerData.score || 0;
    const lastMilestone = userData.notifiedPartnerMilestone || 0;
    const nextMilestone = Math.floor(pScore / 50) * 50;

    if (nextMilestone > lastMilestone && nextMilestone > 0) {
      showToast(`🏆 ${partnerData.name} just reached ${nextMilestone} points! ✨`);
      setState(p => ({ ...p, notifiedPartnerMilestone: nextMilestone }));
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(`Milestone!`, { body: `${partnerData.name} has achieved ${nextMilestone} points! 💖` });
      }
    }
  }, [partnerData?.score]);

  const saveName = async (n) => {
    if (!n.trim()) {
      showToast('Please enter a name! 🌸');
      return;
    }
    console.log('✍️ Creating profile for:', n);
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newProfile = { 
      ...createProfile(n, user.email), 
      uid: user.uid, 
      email: user.email, 
      inviteCode,
      lastDate: new Date().toDateString()
    };
    
    try {
      await setDoc(doc(db, 'users', user.uid), newProfile);
      await setDoc(doc(db, 'invites', inviteCode), { uid: user.uid });
      console.log('✅ New profile record created');
      showToast('Welcome, ' + n + '! 💖');
    } catch (err) {
      console.error('❌ Failed to create profile:', err);
      showToast('Error: Is Firestore enabled in Test Mode?');
    }
  };

  // --- Rendering logic with final fallback ---
  const getUI = () => {
    const lang = appSettings.language || 'en';
    const t = I18N[lang] || I18N.en;

    try {
      if (authLoading) return (
        <div className="nscr" style={{ zIndex: 9991 }}>
          <div className="loader-inner">🌸</div>
          <div style={{ marginTop: '20px', fontSize: '12px' }}>{t.welcome}</div>
        </div>
      );

      if (!user) return <AuthPage showToast={showToast} />;

      if (!userData) return (
        <div className="nscr" style={{ zIndex: 9992 }}>
          <div className="loader-inner" style={{ borderTopColor: 'var(--primary)' }}>✨</div>
          <div style={{ marginTop: '20px', fontWeight: 'bold', color: 'var(--primary)' }}>{t.finding}</div>
          <div style={{ fontSize: '10px', opacity: 0.5, marginTop: '8px' }}>User: {user.uid.slice(0,6)}</div>
        </div>
      );

      if (userData.needsSetup) {
        return <WelcomeScreen onSave={saveName} />;
      }

      return (
        <>
          <div id="root-container">
            <PlannerPage 
              state={activeProfile} 
              setState={setState} 
              active={currentPage === 0} 
              pos={currentPage === 0 ? 'act' : (currentPage < 0 ? 'hr' : 'hl')}
              activePeriod={activePeriod}
              setActivePeriod={setActivePeriod}
              showToast={showToast}
              onSwitch={setActiveId}
              activeId={activeId}
              deviceUserId={user.uid}
              fullState={state}
              onLogOut={() => signOut(auth)}
              appSettings={appSettings}
              setAppSettings={setAppSettings}
              userData={userData}
              partnerData={partnerData}
            />
            <NotesPage 
              state={activeProfile} 
              setState={setState} 
              active={currentPage === 1}
              pos={currentPage === 1 ? 'act' : (currentPage < 1 ? 'hr' : 'hl')}
              showToast={showToast}
            />
            <ProgressPage 
              state={activeProfile} 
              setState={setState} 
              active={currentPage === 2}
              pos={currentPage === 2 ? 'act' : (currentPage < 2 ? 'hr' : 'hl')}
              showToast={showToast}
              fullState={state}
              onGo={setCurrentPage}
              deviceUserId={user.uid}
              setShowReport={setShowReport}
              onLogOut={() => signOut(auth)}
            />
            <AlarmsPage 
              state={activeProfile} 
              setState={setState} 
              active={currentPage === 3}
              pos={currentPage === 3 ? 'act' : (currentPage < 3 ? 'hr' : 'hl')}
              showToast={showToast}
              fullState={state}
            />
            <CalendarPage 
              state={activeProfile} 
              setState={setState} 
              active={currentPage === 4}
              pos={currentPage === 4 ? 'act' : 'hl'}
              fullState={state}
            />
            <ScreenTimePage 
              state={activeProfile} 
              setState={setState}
              active={currentPage === 5}
              pos={currentPage === 5 ? 'act' : 'hl'}
              showToast={showToast}
              activeId={activeId}
              onSwitch={setActiveId}
              deviceUserId={user.uid}
              fullState={state}
            />
            <AiAssistantPage 
              state={activeProfile} 
              setState={setState}
              active={currentPage === 6}
              pos={currentPage === 6 ? 'act' : 'hl'}
              showToast={showToast}
            />

          </div>

          <BottomNav
            current={currentPage}
            onGo={setCurrentPage}
            noteCount={activeProfile?.notes?.length || 0}
            examCount={(activeProfile?.exams || []).filter(e => e?.date && Math.ceil((new Date(e.date) - new Date()) / (1000 * 60 * 60 * 24)) <= 7).length}
            assignmentCount={(activeProfile?.assignments || []).filter(a => a?.status === 'pending').length}
          />

          <AlarmModal alarm={alarm} onClose={() => setAlarm(prev => ({ ...prev, open: false }))} />
          
          {/* Focus Overlay */}
          {(activeProfile?.isStrictMode || activeProfile?.youtubeStudyMode || activeProfile?.browserStudyMode) && (
            <div style={{
              position: 'fixed',
              top: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(10px)',
              padding: '8px 16px',
              borderRadius: '20px',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              pointerEvents: 'none'
            }}>
              <div className="pulse-dot" style={{ width: '8px', height: '8px', background: '#4caf50', borderRadius: '50%' }} />
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {activeProfile.isStrictMode ? 'Strict Mode' : activeProfile.youtubeStudyMode ? 'YouTube Mode' : 'Browser Mode'} Active
              </span>
            </div>
          )}
          
          {showReport && (
            <WeeklyReport
              state={activeProfile}
              fullState={state}
              onClose={() => setShowReport(false)}
            />
          )}
        </>
      );
    } catch (e) {
      return (
        <div style={{ padding: '30px', background: 'white', color: 'black', position: 'fixed', inset: 0, zIndex: 99999 }}>
          <h2 style={{ color: 'var(--primary)' }}>App Error 🌸</h2>
          <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap', marginTop: '10px' }}>{e.message}</pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: '20px', padding: '10px 20px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px' }}>
            Reload App
          </button>
        </div>
      );
    }
  };

  return (
    <div className="app-container" style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: 'var(--bg)' }}>
      <div className="ambient" style={{ zIndex: 0 }}>
        <div className="ab1"></div>
        <div className="ab2"></div>
        <div className="ab3"></div>
      </div>
      
      <ErrorBoundary>
        {getUI()}
      </ErrorBoundary>

      <div className={`toast ${toast.on ? 'on' : ''}`} style={{ zIndex: 999999 }}>{toast.msg}</div>
    </div>
  );
}

export default App;
