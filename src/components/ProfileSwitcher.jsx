export default function ProfileSwitcher({ activeId, onSwitch, profiles, deviceUserId }) {
  const ids = Object.keys(profiles);
  
  return (
    <div className="pswitch">
      {ids.map(id => (
        <button 
          key={id}
          className={`psw-btn ${activeId === id ? 'on' : ''}`} 
          onClick={() => onSwitch(id)}
        >
          <span className={`psw-dot ${ids.indexOf(id) === 0 ? 'ritesh' : 'albina'}`}></span>
          {profiles[id].name}
          {deviceUserId === id && <span className="psw-you">you</span>}
        </button>
      ))}
    </div>
  );
}
