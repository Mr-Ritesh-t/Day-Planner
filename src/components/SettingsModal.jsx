import { useState, useEffect } from 'react';
import { I18N } from '../i18n';
import { auth, updatePassword, sendPasswordResetEmail, deleteUser, signOut, EmailAuthProvider, reauthenticateWithCredential, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function SettingsModal({ isOpen, onClose, appSettings, setAppSettings, userData, partnerData, showToast }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [localZoom, setLocalZoom] = useState(appSettings?.zoom || 100);
  const [pwdForm, setPwdForm] = useState({ old: '', new: '', confirm: '', show: false });
  const [reasonForm, setReasonForm] = useState({ type: '', text: '', open: false });
  
  const lang = appSettings?.language || 'en';
  const t = I18N[lang] || I18N.en;

  useEffect(() => {
    if (isOpen) {
      setLocalZoom(appSettings?.zoom || 100);
    }
  }, [isOpen, appSettings?.zoom]);

  if (!isOpen) return null;

  const handleUpdateSetting = (key, val) => {
    setAppSettings(prev => ({ ...prev, [key]: val }));
  };

  const handleUpdateNestedSetting = (category, key, val) => {
    setAppSettings(prev => ({
      ...prev,
      [category]: { ...prev[category], [key]: val }
    }));
  };

  const handlePasswordChange = async () => {
    if (pwdForm.new !== pwdForm.confirm) {
      showToast('Passwords do not match! 🌸');
      return;
    }
    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, pwdForm.old);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, pwdForm.new);
      showToast('Password updated successfully! ✨');
      setPwdForm({ old: '', new: '', confirm: '', show: false });
    } catch (err) {
      showToast('Error: ' + err.message);
    }
  };

  const handleAccountAction = async () => {
    try {
      if (reasonForm.type === 'logout') {
        await signOut(auth);
        showToast('Logged out effectively. 🌸');
      } else if (reasonForm.type === 'delete') {
         const user = auth.currentUser;
         await setDoc(doc(db, 'logs', user.uid), { action: 'delete', reason: reasonForm.text, date: new Date().toISOString() });
         await deleteUser(user);
         showToast('Account deleted. We will miss you! 🕊️');
      }
      onClose();
    } catch (err) {
      showToast('Error: ' + err.message);
    }
  };

  const TABS = [
    { id: 'profile', icon: '👤', label: t.profile },
    { id: 'activity', icon: '📈', label: t.activity },
    { id: 'display', icon: '🎨', label: t.display },
    { id: 'notifications', icon: '🔔', label: t.notifications },
    { id: 'security', icon: '🛡️', label: t.security },
    { id: 'account', icon: '⚙️', label: t.account }
  ];

  return (
    <div className={`alovo settings-overlay ${isOpen ? 'open' : ''}`} style={{ zIndex: 9999 }} onClick={onClose}>
      <div className="albx" style={{ maxHeight: '85vh', overflowY: 'auto', textAlign: 'left', padding: '24px 20px', display: 'block' }} onClick={e => e.stopPropagation()}>
        
        {/* Simple Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div className="ph-t" style={{ fontSize: '24px' }}>{t.settings}</div>
          <button className="bico" onClick={onClose} style={{ width: '36px', height: '36px', fontSize: '14px' }}>✕</button>
        </div>

        {/* Top Horizontal Navigation */}
        <nav className="sidebar-nav" style={{ 
          display: 'flex', 
          overflowX: 'auto', 
          gap: '8px', 
          paddingBottom: '12px', 
          marginBottom: '20px',
          borderBottom: '1px solid var(--glass-border)',
          scrollbarWidth: 'none'
        }}>
          {TABS.map(tab => (
            <button 
              key={tab.id} 
              className={`sidebar-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flexShrink: 0,
                padding: '8px 16px',
                borderRadius: '12px',
                background: activeTab === tab.id ? 'var(--primary)' : 'var(--surface-container-low)',
                color: activeTab === tab.id ? '#fff' : 'var(--text-dim)',
                border: 'none',
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Main Content Area */}
        <main className="settings-main" style={{ background: 'transparent', padding: 0 }}>
          <div className="content-container" style={{ padding: 0 }}>
            
            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="tab-section animate-fade-in">
                <h1 className="tab-title">{t.profile}</h1>
                
                <section className="setting-card profile-info-card">
                   <div className="user-avatar-large">
                      {userData?.name?.charAt(0) || 'U'}
                   </div>
                   <div className="user-details">
                      <div className="detail-group">
                        <label style={{fontSize: '12px'}}>{t.p_name}</label>
                        <p style={{fontSize: '12px'}}>{userData?.name || 'User'}</p>
                      </div>
                      <div className="detail-group" >
                        <label style={{fontSize: '12px'}}>{t.p_email}</label>
                        <p style={{fontSize: '12px'}}>{userData?.email || auth.currentUser?.email}</p>
                      </div>
                   </div>
                </section>

                <section className="setting-card">
                  <header className="card-header">
                    <h3>Status & Privacy</h3>
                    <p>Manage your account health and visibility</p>
                  </header>
                  <div className="card-rows">
                    <div className="config-row">
                      <div className="config-info">
                        <strong>{t.p_status}</strong>
                        <span>Account is safe and compliant</span>
                      </div>
                      <span className="badge-status online">{userData?.accountStatus || 'Healthy'}</span>
                    </div>
                    <div className="config-row">
                      <div className="config-info">
                        <strong>{t.private}</strong>
                        <span>Mask your notes from partner view</span>
                      </div>
                      <button 
                        className={`ios-toggle ${appSettings?.isPrivate ? 'active' : ''}`}
                        onClick={() => handleUpdateSetting('isPrivate', !appSettings?.isPrivate)}
                      />
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* ACTIVITY TAB */}
            {activeTab === 'activity' && (
              <div className="tab-section animate-fade-in" >
                <h1 className="tab-title">{t.activity}</h1>
                <div className="activity-grid" >
                   <div className="activity-stat streak">
                      <div className="stat-icon">🔥</div>
                      <div className="stat-content">
                        <label>{t.a_streak}</label>
                        <strong>{userData?.streak || 0} Days</strong>
                      </div>
                   </div>
                   <div className="activity-stat score">
                      <div className="stat-icon">✨</div>
                      <div className="stat-content">
                        <label>{t.a_prog}</label>
                        <strong>{userData?.score || 0} Pts</strong>
                      </div>
                   </div>
                </div>

                <section className="setting-card">
                  <header className="card-header">
                    <h3>Moderation</h3>
                    <p>Users you have restricted</p>
                  </header>
                  <div className="blocked-container">
                    {(userData?.blockedUsers || []).length === 0 ? (
                      <div className="empty-state">No blocked users</div>
                    ) : (
                      userData.blockedUsers.map(uid => (
                        <div key={uid} className="blocked-user-pill">
                          <span>{uid}</span>
                          <button className="unblock-btn">✕</button>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>
            )}

            {/* DISPLAY TAB */}
            {activeTab === 'display' && (
              <div className="tab-section animate-fade-in">
                <h1 className="tab-title">{t.display}</h1>
                
                <section className="setting-card">
                  <header className="card-header">
                    <h3>Visual Identity</h3>
                    <p>Theme and atmosphere settings</p>
                  </header>
                  <div className="card-rows">
                    <div className="config-row">
                      <div className="config-info">
                        <strong>{t.theme}</strong>
                        <span>Deep dark mode for late sessions</span>
                      </div>
                      <button 
                        className={`ios-toggle ${appSettings.theme === 'dark' ? 'active' : ''}`} 
                        onClick={() => handleUpdateSetting('theme', appSettings.theme === 'dark' ? 'light' : 'dark')}
                      />
                    </div>
                    <div className="config-row">
                      <div className="config-info">
                        <strong>{t.bold}</strong>
                        <span>High contrast text everywhere</span>
                      </div>
                      <button 
                        className={`ios-toggle ${appSettings.isBold ? 'active' : ''}`} 
                        onClick={() => handleUpdateSetting('isBold', !appSettings.isBold)}
                      />
                    </div>
                  </div>
                </section>

                <section className="setting-card">
                  <header className="card-header">
                    <h3>{t.bgMode}</h3>
                    <p>Adjust the background intensity</p>
                  </header>
                  <div className="mode-selector">
                    {['normal', 'white', 'black'].map(m => (
                      <button 
                        key={m} 
                        className={`choice-btn ${appSettings.bgMode === m ? 'selected' : ''}`}
                        onClick={() => handleUpdateSetting('bgMode', m)}
                      >
                        {m.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="setting-card">
                  <header className="card-header">
                    <h3>{t.zoom}</h3>
                    <p>Adjust the interface scale</p>
                  </header>
                  <div className="slider-box">
                    <input 
                       type="range" min="80" max="140" value={localZoom} 
                       className="premium-slider"
                       onChange={e => {
                         const v = Number(e.target.value);
                         setLocalZoom(v);
                         handleUpdateSetting('zoom', v);
                       }}
                    />
                    <div className="slider-labels">
                       <span>80%</span>
                       <span className="current-zoom">{localZoom}%</span>
                       <span>140%</span>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <div className="tab-section animate-fade-in">
                <h1 className="tab-title">{t.notifications}</h1>
                <section className="setting-card">
                  <header className="card-header">
                    <h3>Smart Alerts</h3>
                    <p>How we nudge you throughout the day</p>
                  </header>
                  <div className="card-rows">
                    {[
                      { id: 'alarms', label: t.n_alarms, desc: "Periodic routine triggers" },
                      { id: 'milestones', label: t.n_miles, desc: "Celeberate achievement 50pts" },
                      { id: 'streak', label: t.n_remind, desc: "8 PM routine check-in" },
                      { id: 'partnerPts', label: "Partner Point Alerts", desc: "Know when they grow" }
                    ].map(n => (
                      <div className="config-row" key={n.id}>
                        <div className="config-info">
                          <strong>{n.label}</strong>
                          <span>{n.desc}</span>
                        </div>
                        <button 
                          className={`ios-toggle ${appSettings.notifications?.[n.id] ? 'active' : ''}`} 
                          onClick={() => handleUpdateNestedSetting('notifications', n.id, !appSettings.notifications?.[n.id])}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* SECURITY TAB */}
            {activeTab === 'security' && (
              <div className="tab-section animate-fade-in">
                <h1 className="tab-title">{t.security}</h1>
                
                <section className="setting-card">
                  <header className="card-header">
                    <h3>{t.lang}</h3>
                    <p>Choose your preferred language</p>
                  </header>
                  <div className="lang-selector">
                    <button className={`choice-btn ${appSettings.language === 'en' ? 'selected' : ''}`} onClick={() => handleUpdateSetting('language', 'en')}>English</button>
                    <button className={`choice-btn ${appSettings.language === 'hi' ? 'selected' : ''}`} onClick={() => handleUpdateSetting('language', 'hi')}>हिन्दी</button>
                  </div>
                </section>

                <section className="setting-card">
                   <header className="card-header">
                    <h3>Password Management</h3>
                    <p>Secure your personal sanctuary</p>
                  </header>
                  <div className="security-actions">
                    <button className="action-btn-outline" onClick={() => setPwdForm(p => ({ ...p, show: !p.show }))}>
                      {pwdForm.show ? 'Cancel' : t.s_pwd}
                    </button>
                    
                    {pwdForm.show && (
                      <div className="inline-pwd-form animate-slide-down">
                        <input type="password" placeholder="Old Password" value={pwdForm.old} onChange={e => setPwdForm({...pwdForm, old: e.target.value})} className="auth-step-input" />
                        <input type="password" placeholder="New Password" value={pwdForm.new} onChange={e => setPwdForm({...pwdForm, new: e.target.value})} className="auth-step-input" />
                        <input type="password" placeholder="Confirm New" value={pwdForm.confirm} onChange={e => setPwdForm({...pwdForm, confirm: e.target.value})} className="auth-step-input" />
                        <button className="primary-glass-btn" onClick={handlePasswordChange}>Save Changes</button>
                      </div>
                    )}

                    <button className="link-btn" onClick={async () => {
                      try {
                        await sendPasswordResetEmail(auth, auth.currentUser.email);
                        showToast('Reset email sent! 📧');
                      } catch (e) { showToast(e.message); }
                    }}>
                      {t.s_forgot}
                    </button>
                  </div>
                </section>
              </div>
            )}

            {/* ACCOUNT TAB */}
            {activeTab === 'account' && (
              <div className="tab-section animate-fade-in">
                <h1 className="tab-title">{t.account}</h1>
                <section className="setting-card danger-zone">
                  <header className="card-header">
                    <h3>Danger Zone</h3>
                    <p>Irreversible account actions</p>
                  </header>
                  <div className="danger-actions">
                    <div className="action-item">
                      <div className="config-info">
                        <strong>Logout Session</strong>
                        <span>Terminates this active device session</span>
                      </div>
                      <button className="destruct-btn" onClick={() => setReasonForm({ open: true, type: 'logout', text: '' })}>{t.acc_out}</button>
                    </div>
                    <div className="action-item">
                      <div className="config-info">
                        <strong>{t.acc_del}</strong>
                        <span>Permanently purge all your data</span>
                      </div>
                      <button className="destruct-btn fatal" onClick={() => setReasonForm({ open: true, type: 'delete', text: '' })}>Purge Data</button>
                    </div>
                  </div>
                </section>

                {reasonForm.open && (
                  <div className="reason-overlay" onClick={() => setReasonForm({...reasonForm, open: false})}>
                    <div className="reason-modal" onClick={e => e.stopPropagation()}>
                      <h2>{reasonForm.type === 'logout' ? t.logout_confirm : t.confirm_del}</h2>
                      <p>Could you let us know why?</p>
                      <textarea 
                        className="reason-input"
                        placeholder={t.reason_placeholder} 
                        value={reasonForm.text} 
                        onChange={e => setReasonForm({...reasonForm, text: e.target.value})}
                      />
                      <div className="reason-actions">
                        <button className="cancel-btn" onClick={() => setReasonForm({ ...reasonForm, open: false })}>Cancel</button>
                        <button className={`confirm-action-btn ${reasonForm.type === 'delete' ? 'fatal' : ''}`} onClick={handleAccountAction}>
                          Confirm & Proceed
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </main>

      </div>

      <style jsx>{`
        .settings-overlay {
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(8px);
          transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          opacity: 0;
          pointer-events: none;
        }
        .settings-overlay.open { opacity: 1; pointer-events: auto; }
        
        .settings-main { overflow-y: visible; background: transparent; }
        .content-container { padding: 0; margin: 0 auto; width: 100%; }
        
        .tab-title { font-size: 28px; font-weight: 950; margin-bottom: 24px; color: var(--text); letter-spacing: -1px; }
        .tab-section { display: flex; flex-direction: column; gap: 32px; }

        /* Card Styles */
        .setting-card {
          background: var(--surface-container);
          border-radius: 24px;
          padding: 24px;
          border: 1px solid rgba(0,0,0,0.03);
          transition: 0.3s;
        }
        .card-header { margin-bottom: 24px; }
        .card-header h3 { font-size: 18px; font-weight: 800; margin-bottom: 4px; }
        .card-header p { font-size: 13px; color: var(--text-dim); font-weight: 500; }
        
        .profile-info-card { display: flex; gap: 32px; align-items: center; background: linear-gradient(135deg, var(--primary-container), var(--surface-container)); }
        .user-avatar-large {
          width: 100px;
          height: 100px;
          background: white;
          color: var(--primary);
          border-radius: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
          font-weight: 900;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .user-details { flex: 1; display: flex; flex-direction: column; gap: 16px; }
        .detail-group label { font-size: 10px; font-weight: 800; color: var(--primary); text-transform: uppercase; letter-spacing: 1px; }
        .detail-group p { font-size: 18px; font-weight: 800; color: var(--text); }

        .card-rows { display: flex; flex-direction: column; gap: 20px; }
        .config-row { display: flex; justify-content: space-between; align-items: center; }
        .config-info { display: flex; flex-direction: column; gap: 2px; }
        .config-info strong { font-size: 15px; font-weight: 800; }
        .config-info span { font-size: 12px; color: var(--text-dim); }

        /* Toggles & Controls */
        .ios-toggle {
          width: 48px;
          height: 26px;
          background: #e0e0e0;
          border-radius: 100px;
          position: relative;
          border: none;
          cursor: pointer;
          transition: 0.3s;
        }
        .ios-toggle.active { background: var(--primary); }
        .ios-toggle::after {
          content: '';
          position: absolute;
          left: 3px;
          top: 3px;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          transition: 0.3s;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .ios-toggle.active::after { left: 25px; }

        .activity-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; }
        .activity-stat {
          padding: 24px;
          background: white;
          border-radius: 24px;
          display: flex;
          align-items: center;
          gap: 1px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.03);
          border: 1px solid rgba(0,0,0,0.02);
        }
        .stat-icon { font-size: 32px; }
        .stat-content label { font-size: 11px; font-weight: 800; opacity: 0.5; text-transform: uppercase; }
        .stat-content strong { font-size: 20px; font-weight: 900; color: var(--text); display: block; }

        .mode-selector, .lang-selector { display: flex; gap: 12px; }
        .choice-btn {
          flex: 1;
          padding: 14px;
          background: white;
          border: 2px solid transparent;
          border-radius: 16px;
          font-weight: 800;
          font-size: 13px;
          cursor: pointer;
          transition: 0.2s;
        }
        .choice-btn.selected { border-color: var(--primary); color: var(--primary); background: var(--primary-container); }

        .slider-box { padding: 10px 0; }
        .premium-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 6px;
          background: #eee;
          border-radius: 10px;
          outline: none;
        }
        .premium-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          background: var(--primary);
          border-radius: 50%;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .slider-labels { display: flex; justify-content: space-between; font-size: 11px; font-weight: 800; opacity: 0.4; margin-top: 12px; }
        .current-zoom { color: var(--primary); opacity: 1 !important; font-size: 13px; }

        .destruct-btn {
          padding: 10px 20px;
          background: #fdf2f2;
          color: #cf2222;
          border: none;
          border-radius: 12px;
          font-weight: 800;
          cursor: pointer;
          font-size: 13px;
        }
        .destruct-btn.fatal { background: #fee2e2; }
        .action-btn-outline {
          padding: 14px;
          border: 2px solid var(--primary-container);
          background: transparent;
          color: var(--primary);
          border-radius: 16px;
          font-weight: 800;
          cursor: pointer;
        }
        .auth-step-input {
          padding: 14px;
          border-radius: 12px;
          border: 1px solid rgba(0,0,0,0.1);
          background: white;
          font-weight: 600;
        }
        .primary-glass-btn {
          padding: 14px;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 800;
          cursor: pointer;
        }

        .reason-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .reason-modal {
          background: var(--surface);
          padding: 32px;
          border-radius: 32px;
          width: 90%;
          max-width: 440px;
          box-shadow: 0 50px 100px rgba(0,0,0,0.4);
          animation: modal-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .reason-modal h2 { font-size: 24px; font-weight: 900; margin-bottom: 8px; }
        .reason-input {
          width: 100%;
          height: 120px;
          margin-top: 16px;
          padding: 16px;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 16px;
          resize: none;
          font-family: inherit;
        }
        .reason-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 24px; }
        .cancel-btn { padding: 16px; background: var(--surface-container); border: none; border-radius: 16px; font-weight: 800; cursor: pointer; }
        .confirm-action-btn { padding: 16px; background: var(--primary); color: white; border: none; border-radius: 16px; font-weight: 800; cursor: pointer; }
        .confirm-action-btn.fatal { background: #ef4444; }

        /* Animations */
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes modal-pop { from { transform: scale(0.9) translateY(20px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }

        /* Mobile Adjustments */
        /* Mobile Adjustments */
        @media (max-width: 768px) {
          .tab-title { font-size: 24px; margin-bottom: 20px; }
        }

        /* Scrollbar Fixes */
        .settings-main::-webkit-scrollbar { width: 8px; }
        .settings-main::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
        .settings-main:hover::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); }
      `}</style>
    </div>
  );
}
