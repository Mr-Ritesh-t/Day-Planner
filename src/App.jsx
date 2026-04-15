import { useState, useEffect, useCallback } from 'react';
import { db, hasFirebaseConfig } from './firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import './index.css';
import PlannerPage from './pages/PlannerPage';
import NotesPage from './pages/NotesPage';
import ProgressPage from './pages/ProgressPage';
import WelcomeScreen from './components/WelcomeScreen';
import CalendarPage from './pages/CalendarPage';
import AlarmsPage from './pages/AlarmsPage';
import BottomNav from './components/BottomNav';
import AlarmModal from './components/AlarmModal';
import DeviceSetupScreen from './components/DeviceSetupScreen';
import { ACH, cntDone } from './constants';

function App() {
  const createProfile = (name) => ({
    name, score: 0, dailyScore: 0, streak: 0,
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
    unlockedAchievements: [], customAlarms: []
  });

  const [appSettings, setAppSettings] = useState(() => {
    const saved = localStorage.getItem('hdp_react_settings');
    if (saved) return JSON.parse(saved);
    return { theme: 'light', zoom: 100, primaryColor: '#894468' };
  });

  // Device identity — who owns THIS device. Never synced to cloud.
  const [deviceUserId, setDeviceUserId] = useState(() => localStorage.getItem('hdp_device_user') || null);

  // activeId — which profile is currently being viewed/edited on this device. Also local-only.
  const [activeId, setActiveId] = useState(() => {
    return localStorage.getItem('hdp_device_user') || 'ritesh';
  });

  const [state, _setState] = useState(() => {
    const saved = localStorage.getItem('hdp_react_v1');
    if (saved) {
      const data = JSON.parse(saved);
      // Strip activeId from cloud data if it slipped in
      const { activeId: _, ...rest } = data;
      if (!rest.profiles) {
        return {
          profiles: {
            ritesh: { ...rest, name: 'Ritesh' },
            albina: createProfile('Albina')
          },
          lastDate: rest.lastDate || new Date().toDateString()
        };
      }
      return rest;
    }
    return {
      profiles: {
        ritesh: createProfile('Ritesh'),
        albina: createProfile('Albina')
      },
      lastDate: new Date().toDateString()
    };
  });

  const activeProfile = state.profiles[activeId];

  const [currentPage, setCurrentPage] = useState(0);
  const [toast, setToast] = useState({ msg: '', on: false });
  const [alarm, setAlarm] = useState({ title: '', msg: '', open: false });
  const [activePeriod, setActivePeriod] = useState('all');

  const [isLoadingSync, setIsLoadingSync] = useState(hasFirebaseConfig);

  const setState = useCallback((updater) => {
    _setState(prev => {
      const nextState = typeof updater === 'function' ? updater(prev) : updater;
      
      // Remove activeId before syncing/caching — it's device-local only
      const { activeId: _, ...syncState } = nextState;

      // Local caching
      localStorage.setItem('hdp_react_v1', JSON.stringify(syncState));

      // Cloud syncing — never write activeId to Firebase
      if (hasFirebaseConfig && db) {
        const dRef = doc(db, 'planner', 'sharedData');
        setDoc(dRef, syncState, { merge: true }).catch(err => console.error('Cloud Sync Error:', err));
      }
      return syncState;
    });
  }, []);

  // Cloud Sync Listener — only syncs profile data, never activeId
  useEffect(() => {
    if (!hasFirebaseConfig || !db) return;
    const dRef = doc(db, 'planner', 'sharedData');
    const unsubscribe = onSnapshot(dRef, (snap) => {
      setIsLoadingSync(false);
      if (snap.exists()) {
        const cloudData = snap.data();
        if (cloudData) {
          // Strip activeId if it somehow exists in old cloud data
          const { activeId: _, ...profileData } = cloudData;
          _setState(prev => {
             const prevStr = JSON.stringify({ profiles: prev.profiles, lastDate: prev.lastDate });
             const newStr = JSON.stringify({ profiles: profileData.profiles, lastDate: profileData.lastDate });
             if (prevStr !== newStr) {
               localStorage.setItem('hdp_react_v1', JSON.stringify(profileData));
               return profileData;
             }
             return prev;
          });
        }
      }
    }, (err) => {
      console.error('Firebase snapshot error:', err);
      setIsLoadingSync(false);
    });
    return () => unsubscribe();
  }, []);

  // Request Native Notifications
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('hdp_react_settings', JSON.stringify(appSettings));
    
    // Theme Mode
    if (appSettings.theme === 'dark') {
      document.body.classList.add('theme-dark');
    } else {
      document.body.classList.remove('theme-dark');
    }

    // Zoom Scaling
    document.documentElement.style.zoom = appSettings.zoom ? `${appSettings.zoom}%` : '100%';

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

  // Check New Day logic for ALL profiles
  useEffect(() => {
    const today = new Date().toDateString();
    if (state.lastDate !== today) {
      setState(prev => {
        const newProfiles = { ...prev.profiles };

        Object.keys(newProfiles).forEach(id => {
          const p = newProfiles[id];
          const done = cntDone(p);
          const doneTasksList = Object.values(p.tasks).flat().filter(t => t.done).map(t => ({ title: t.title, time: t.startTime || t.time || '', note: t.note || '' }));
          const newWeekData = [...p.weekData, { date: prev.lastDate, tasks: done, doneTasksList, mood: p.mood, study: p.studyMins, points: p.dailyScore || 0 }];
          if (newWeekData.length > 7) newWeekData.shift();

          const routineTasks = p.monthlyRoutine || { anytime: [], morning: [], afternoon: [], evening: [] };
          const newDayTasks = {};
          const todayObj = new Date();
          const todayDay = todayObj.getDay();
          const todayISO = todayObj.toISOString().split('T')[0];

          Object.keys(routineTasks).forEach(period => {
            newDayTasks[period] = routineTasks[period]
              .filter(t => {
                // If weekdays are set, today must be in the list
                if (t.weekdays && t.weekdays.length > 0 && !t.weekdays.includes(todayDay)) return false;
                // If startDate is set, must be today or later
                if (t.startDate && todayISO < t.startDate) return false;
                // If endDate is set, must be today or earlier
                if (t.endDate && todayISO > t.endDate) return false;
                return true;
              })
              .map(t => ({
                ...t,
                id: Date.now() + Math.random(),
                done: false,
                af: false
              }));
          });

          newProfiles[id] = {
            ...p,
            streak: done > 0 ? p.streak + 1 : 0,
            habits: p.habits.map(h => ({ ...h, done: false })),
            customAlarms: (p.customAlarms || []).map(a => ({ ...a, triggeredToday: false })),
            mood: null,
            studyMins: 0,
            dailyScore: 0,
            weekData: newWeekData,
            tasks: newDayTasks
          };
        });

        return {
          ...prev,
          lastDate: today,
          profiles: newProfiles
        };
      });
    }
  }, [state.lastDate]);

  // Alarm Check logic — always fires for THIS DEVICE's own profile (deviceUserId),
  // regardless of which profile is currently being viewed.
  const deviceProfile = deviceUserId ? state.profiles[deviceUserId] : null;
  useEffect(() => {
    if (!deviceProfile) return;
    const interval = setInterval(() => {
      const now = new Date();
      const cur = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      let triggered = false;
      const newTasks = { ...deviceProfile.tasks };
      let triggeredTitle = '';

      Object.keys(newTasks).forEach(period => {
        newTasks[period] = newTasks[period].map(t => {
          const checkTime = t.startTime || t.time;
          if (checkTime === cur && !t.done && !t.af) {
            triggered = true;
            triggeredTitle = t.title;
            return { ...t, af: true };
          }
          return t;
        });
      });

      let newCustomAlarms = [...(deviceProfile.customAlarms || [])];
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
        // Write the alarm-fired state back to the device owner's profile
        setState(prev => ({
          ...prev,
          profiles: {
            ...prev.profiles,
            [deviceUserId]: { ...prev.profiles[deviceUserId], tasks: newTasks, customAlarms: newCustomAlarms }
          }
        }));
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [deviceProfile?.tasks, deviceUserId]);

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

  // Achievement Check for active profile
  useEffect(() => {
    ACH.forEach(a => {
      if (!activeProfile.unlockedAchievements.includes(a.id) && a.req(activeProfile)) {
        setState(prev => ({
          ...prev,
          profiles: {
            ...prev.profiles,
            [activeId]: {
              ...prev.profiles[activeId],
              unlockedAchievements: [...prev.profiles[activeId].unlockedAchievements, a.id],
              score: prev.profiles[activeId].score + (a.pts || 0),
              dailyScore: (prev.profiles[activeId].dailyScore || 0) + (a.pts || 0)
            }
          }
        }));
        showToast('🏅 ' + a.name + ' unlocked!');
      }
    });
  }, [activeProfile, showToast]);

  // Switch profile locally — does NOT affect Firebase or the other device
  const switchProfile = (id) => {
    setActiveId(id);
  };

  // Called once from DeviceSetupScreen to permanently assign this device
  const handleDeviceSetup = (id) => {
    localStorage.setItem('hdp_device_user', id);
    setDeviceUserId(id);
    setActiveId(id);
  };

  const saveName = (name) => {
    setState(prev => ({
      ...prev,
      profiles: {
        ...prev.profiles,
        [prev.activeId]: { ...prev.profiles[prev.activeId], name }
      }
    }));
    showToast('Welcome, ' + name + '! 💖');
  };
  if (isLoadingSync) {
    return (
      <div className="app-container">
        <div className="ambient">
          <div className="ab1"></div>
          <div className="ab2"></div>
        </div>
        <div className="nscr" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', textAlign: 'center' }}>
          <div className="loader-inner">🌸</div>
          <h2 style={{ marginTop: '24px', fontStyle: 'italic' }}>Synchronizing...</h2>
          <p style={{ opacity: 0.6 }}>Gathering our moments from the cloud ✨</p>
        </div>
      </div>
    );
  }

  // One-time device setup — shown only if device identity not yet set
  if (!deviceUserId) {
    return (
      <div className="app-container">
        <div className="ambient"><div className="ab1"></div><div className="ab2"></div></div>
        <DeviceSetupScreen onSelect={handleDeviceSetup} />
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="ambient">
        <div className="ab1"></div>
        <div className="ab2"></div>
        <div className="ab3"></div>
      </div>

      {(!activeProfile || !activeProfile.name) ? (
        <WelcomeScreen onSave={saveName} />
      ) : (
        <>
          <div id="root-container">
            <PlannerPage 
              state={activeProfile} 
              setState={(updater) => setState(prev => ({
                ...prev,
                profiles: {
                  ...prev.profiles,
                  [activeId]: typeof updater === 'function' ? updater(prev.profiles[activeId]) : updater
                }
              }))} 
              active={currentPage === 0} 
              pos={currentPage === 0 ? 'act' : (currentPage < 0 ? 'hr' : 'hl')}
              activePeriod={activePeriod}
              setActivePeriod={setActivePeriod}
              showToast={showToast}
              onSwitch={switchProfile}
              activeId={activeId}
              deviceUserId={deviceUserId}
              fullState={state}
              appSettings={appSettings}
              setAppSettings={setAppSettings}
            />
            <NotesPage 
              state={activeProfile} 
              setState={(updater) => setState(prev => ({
                ...prev,
                profiles: {
                  ...prev.profiles,
                  [activeId]: typeof updater === 'function' ? updater(prev.profiles[activeId]) : updater
                }
              }))} 
              active={currentPage === 1}
              pos={currentPage === 1 ? 'act' : (currentPage < 1 ? 'hr' : 'hl')}
              showToast={showToast}
            />
            <ProgressPage 
              state={activeProfile} 
              setState={(updater) => setState(prev => ({
                ...prev,
                profiles: {
                  ...prev.profiles,
                  [activeId]: typeof updater === 'function' ? updater(prev.profiles[activeId]) : updater
                }
              }))} 
              active={currentPage === 2}
              pos={currentPage === 2 ? 'act' : (currentPage < 2 ? 'hr' : 'hl')}
              showToast={showToast}
              fullState={state}
              onGo={setCurrentPage}
              deviceUserId={deviceUserId}
            />
            <AlarmsPage 
              state={activeProfile} 
              setState={(updater) => setState(prev => ({
                ...prev,
                profiles: {
                  ...prev.profiles,
                  [activeId]: typeof updater === 'function' ? updater(prev.profiles[activeId]) : updater
                }
              }))} 
              active={currentPage === 3}
              pos={currentPage === 3 ? 'act' : (currentPage < 3 ? 'hr' : 'hl')}
              showToast={showToast}
            />
            <CalendarPage 
              state={activeProfile} 
              setState={(updater) => setState(prev => ({
                ...prev,
                profiles: {
                  ...prev.profiles,
                  [activeId]: typeof updater === 'function' ? updater(prev.profiles[activeId]) : updater
                }
              }))} 
              active={currentPage === 4}
              pos={currentPage === 4 ? 'act' : 'hl'}
              fullState={state}
            />
          </div>

          <BottomNav 
            current={currentPage} 
            onGo={setCurrentPage} 
            noteCount={activeProfile.notes.length}
          />

          <AlarmModal alarm={alarm} onClose={() => setAlarm(prev => ({ ...prev, open: false }))} />
          
          <div className={`toast ${toast.on ? 'on' : ''}`}>{toast.msg}</div>
        </>
      )}
    </div>
  );
}

export default App;
