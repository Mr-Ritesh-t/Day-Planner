import { useState, useEffect } from 'react';

// Tiny utility to lighten/darken hex colors for secondary generator
function adjustColor(color, amount) {
  return '#' + color.replace(/^#/, '').replace(/../g, color => 
    ('0'+Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2)
  );
}

export default function SettingsModal({ isOpen, onClose, appSettings, setAppSettings }) {
  const [localZoom, setLocalZoom] = useState(appSettings.zoom || 100);

  useEffect(() => {
    if (isOpen) {
      setLocalZoom(appSettings.zoom || 100);
    }
  }, [isOpen, appSettings.zoom]);

  if (!isOpen) return null;

  const handleZoomChange = (val) => {
    setLocalZoom(val);
    setAppSettings(prev => ({ ...prev, zoom: val }));
  };

  const handleThemeToggle = () => {
    setAppSettings(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }));
  };

  const handleColorChange = (e) => {
    const newColor = e.target.value;
    setAppSettings(prev => ({ 
      ...prev, 
      primaryColor: newColor 
    }));
  };

  const handleRestore = () => {
    setLocalZoom(100);
    setAppSettings({ theme: 'light', zoom: 100, primaryColor: '#894468' });
  };

  return (
    <div className={`alovo ${isOpen ? 'open' : ''}`} style={{ zIndex: 2000 }} onClick={onClose}>
      <div className="albx" onClick={e => e.stopPropagation()}>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Settings</h2>
            <button className="nmclose" onClick={onClose} style={{ position: 'relative', top: '0', right: '0' }}>✕</button>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '24px' }}>Customize your app aesthetic seamlessly.</p>
          
          <hr />

          {/* Theme Mode Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800 }}>Dark Mode</div>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Switch to the dark side</div>
            </div>
            <button 
              className={`hck ${appSettings.theme === 'dark' ? 'on' : ''}`} 
              onClick={handleThemeToggle}
            >
              {appSettings.theme === 'dark' ? '✓' : ''}
            </button>
          </div>

          <hr />

          {/* Primary Color Picker */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800 }}>Primary Accent Color</div>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Choose your favorite color</div>
            </div>
            <input 
              type="color" 
              value={appSettings.primaryColor || '#894468'} 
              onChange={handleColorChange}
              style={{ width: '40px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-16px', marginBottom: '24px' }}>
             <button 
                onClick={() => setAppSettings(prev => ({ ...prev, primaryColor: '#894468' }))}
                style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
             >
               Reset Color
             </button>
          </div>

          <hr />

          {/* Font Size Slider */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '15px', fontWeight: 800 }}>Font & UI Scale</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary)' }}>{localZoom}%</div>
            </div>
            <input 
              type="range" 
              min="80" 
              max="135" 
              value={localZoom} 
              onChange={(e) => handleZoomChange(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--primary)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-dim)', marginTop: '8px', fontWeight: 700, textTransform: 'uppercase' }}>
              <span>Smaller</span>
              <span>Default (100%)</span>
              <span>Larger</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button 
              className="albtn" 
              onClick={handleRestore} 
              style={{ flex: 1, background: 'var(--surface-container-high)', color: 'var(--text-dim)', border: 'none' }}
            >
              Reset All
            </button>
            <button className="albtn" onClick={onClose} style={{ flex: 2 }}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
