import { useState } from 'react';

export default function DeviceSetupScreen({ onSelect }) {
  const [chosen, setChosen] = useState(null);

  const handleSelect = (id) => {
    setChosen(id);
    setTimeout(() => onSelect(id), 600);
  };

  return (
    <div className="dsetup-overlay">
      <div className="dsetup-card">
        <div className="dsetup-glow" />
        <div className="dsetup-emoji">💌</div>
        <h1 className="dsetup-title">Welcome Back</h1>
        <p className="dsetup-sub">Who's using this device?</p>
        <p className="dsetup-hint">This is a one-time setup — we'll remember your choice.</p>
        <div className="dsetup-profiles">
          <button
            className={`dsetup-profile-btn ritesh ${chosen === 'ritesh' ? 'chosen' : ''}`}
            onClick={() => handleSelect('ritesh')}
            disabled={!!chosen}
          >
            <span className="dsetup-avatar">🧑‍💻</span>
            <span className="dsetup-pname">Ritesh</span>
            <span className="dsetup-pclaim">This is me 💙</span>
          </button>
          <button
            className={`dsetup-profile-btn albina ${chosen === 'albina' ? 'chosen' : ''}`}
            onClick={() => handleSelect('albina')}
            disabled={!!chosen}
          >
            <span className="dsetup-avatar">👩‍🎨</span>
            <span className="dsetup-pname">Albina</span>
            <span className="dsetup-pclaim">This is me 💖</span>
          </button>
        </div>
        <p className="dsetup-footer">You can still view &amp; edit each other's profiles anytime ✨</p>
      </div>
    </div>
  );
}
