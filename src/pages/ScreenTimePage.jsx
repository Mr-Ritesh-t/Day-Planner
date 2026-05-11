import React, { useState, useEffect } from 'react';
import { CapacitorUsageStatsManager } from '@capgo/capacitor-android-usagestatsmanager';
import ProfileSwitcher from '../components/ProfileSwitcher';

export default function ScreenTimePage({ state, setState, active, pos, showToast, activeId, onSwitch, deviceUserId, fullState }) {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [localUsage, setLocalUsage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localTotal, setLocalTotal] = useState(0);

  const isOwnProfile = activeId === deviceUserId;

  useEffect(() => {
    if (active && isOwnProfile) {
      checkPermissionAndFetch();
    }
  }, [active, isOwnProfile]);

  const checkPermissionAndFetch = async () => {
    setLoading(true);
    try {
      const { granted } = await CapacitorUsageStatsManager.isUsageStatsPermissionGranted();
      setPermissionGranted(granted);
      
      if (granted) {
        await fetchUsageStats();
      }
    } catch (e) {
      console.error('Error checking permission:', e);
      showToast('Error accessing usage stats');
    }
    setLoading(false);
  };

  const fetchUsageStats = async () => {
    try {
      const now = Date.now();
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const beginTime = startOfDay.getTime();

      const stats = await CapacitorUsageStatsManager.queryAndAggregateUsageStats({
        beginTime,
        endTime: now
      });

      const processed = Object.entries(stats)
        .map(([packageName, data]) => ({
          packageName,
          appName: data.appName || packageName.split('.').pop(),
          totalTime: Math.floor(data.totalTimeInForeground / 60000), // convert to minutes
          lastUsed: data.lastTimeUsed
        }))
        .filter(app => app.totalTime > 0)
        .sort((a, b) => b.totalTime - a.totalTime);

      setLocalUsage(processed);
      const total = processed.reduce((sum, app) => sum + app.totalTime, 0);
      setLocalTotal(total);

      // Sync to Firestore
      setState(prev => ({
        ...prev,
        screenTime: {
          totalMinutes: total,
          lastUpdated: Date.now(),
          breakdown: processed.slice(0, 10) // Only sync top 10 for efficiency
        }
      }));
    } catch (e) {
      console.error('Error fetching stats:', e);
      showToast('Could not load app usage');
    }
  };

  const openSettings = async () => {
    try {
      await CapacitorUsageStatsManager.openUsageStatsSettings();
      showToast('Please grant permission and return 🌸');
    } catch (e) {
      showToast('Error opening settings');
    }
  };

  const formatTime = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  // Data to display depends on whether we are looking at own profile or partner's
  const displayTotal = isOwnProfile ? localTotal : (state?.screenTime?.totalMinutes || 0);
  const displayUsage = isOwnProfile ? localUsage : (state?.screenTime?.breakdown || []);
  const lastUpdate = isOwnProfile ? Date.now() : (state?.screenTime?.lastUpdated || null);

  return (
    <div className={`page ${pos}`} id="screen-time-page">
      <div className="ph">
        <div className="ph-g">Digital Wellbeing 🧘‍♀️</div>
        <div className="ph-t">Screen <em>Time</em></div>
        <div className="ph-s">Shared growth and digital balance</div>
        <ProfileSwitcher activeId={activeId} onSwitch={onSwitch} profiles={fullState.profiles} deviceUserId={deviceUserId} />
      </div>

      <div className="shero" style={{ background: 'linear-gradient(135deg, var(--secondary), var(--primary))', marginTop: '16px' }}>
        <div className="shl">{isOwnProfile ? 'My Usage Today' : `${state?.name}'s Usage`}</div>
        <div className="shv">{formatTime(displayTotal)}</div>
        <div className="shs">
          {displayTotal > 300 ? 'A very active day! ✨' : 'Great digital balance! 🌸'}
        </div>
        {lastUpdate && !isOwnProfile && (
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginTop: '8px' }}>
            Last updated: {new Date(lastUpdate).toLocaleTimeString()}
          </div>
        )}
      </div>

      {isOwnProfile && !permissionGranted ? (
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
          <h3 style={{ marginBottom: '12px' }}>Permission Required</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-dim)', marginBottom: '24px', lineHeight: '1.6' }}>
            To share and see your app usage, we need "Usage Access" permission.
          </p>
          <button className="albtn" onClick={openSettings}>
            Grant Permission ✨
          </button>
        </div>
      ) : loading && isOwnProfile ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div className="loader-inner" style={{ fontSize: '32px' }}>🌸</div>
          <p style={{ marginTop: '16px', color: 'var(--text-dim)' }}>Gathering insights...</p>
        </div>
      ) : (
        <div style={{ padding: '20px' }}>
          <div className="sl" style={{ paddingLeft: 0 }}>
            <span className="sli">📱</span>
            <h3>{isOwnProfile ? 'My Breakdown' : 'App Breakdown'}</h3>
            {isOwnProfile && (
              <button 
                onClick={fetchUsageStats} 
                style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Refresh
              </button>
            )}
          </div>

          <div className="tcards" style={{ marginTop: '12px' }}>
            {displayUsage.length === 0 ? (
              <div className="empty">
                <div className="eic">📭</div>
                {isOwnProfile ? 'No usage recorded yet today.' : `${state?.name} hasn't shared usage yet.`}
              </div>
            ) : (
              displayUsage.map((app, i) => {
                const percent = displayTotal > 0 ? (app.totalTime / displayTotal) * 100 : 0;
                return (
                  <div key={app.packageName} className="tc" style={{ display: 'block', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ fontWeight: '800', fontSize: '15px' }}>{app.appName}</div>
                      <div style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '14px' }}>{formatTime(app.totalTime)}</div>
                    </div>
                    <div className="scib" style={{ height: '6px', marginTop: 0 }}>
                      <div 
                        className="scif" 
                        style={{ 
                          width: `${percent}%`, 
                          background: `linear-gradient(90deg, var(--primary), var(--primary-container))`,
                          opacity: 0.8
                        }} 
                      />
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '6px', textAlign: 'right', opacity: 0.7 }}>
                      {Math.round(percent)}% of total time
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mot" style={{ marginTop: '32px' }}>
            <div className="mi">💡</div>
            <div className="mt">"The secret of change is to focus all of your energy, not on fighting the old, but on building the new."</div>
            <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '8px', opacity: 0.6 }}>— Socrates</p>
          </div>
        </div>
      )}
    </div>
  );
}
