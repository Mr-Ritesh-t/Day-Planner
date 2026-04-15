export default function ProfileSwitcher({ activeId, onSwitch, profiles, deviceUserId }) {
  return (
    <div className="pswitch">
      <button 
        className={`psw-btn ${activeId === 'ritesh' ? 'on' : ''}`} 
        onClick={() => onSwitch('ritesh')}
      >
        <span className="psw-dot ritesh"></span>
        Ritesh
        {deviceUserId === 'ritesh' && <span className="psw-you">you</span>}
      </button>
      <button 
        className={`psw-btn ${activeId === 'albina' ? 'on' : ''}`} 
        onClick={() => onSwitch('albina')}
      >
        <span className="psw-dot albina"></span>
        Albina
        {deviceUserId === 'albina' && <span className="psw-you">you</span>}
      </button>
    </div>
  );
}
