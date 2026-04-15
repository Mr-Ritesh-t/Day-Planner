export default function ProfileSwitcher({ activeId, onSwitch, profiles }) {
  return (
    <div className="pswitch">
      <button 
        className={`psw-btn ${activeId === 'ritesh' ? 'on' : ''}`} 
        onClick={() => onSwitch('ritesh')}
      >
        <span className="psw-dot ritesh"></span>
        Ritesh
      </button>
      <button 
        className={`psw-btn ${activeId === 'albina' ? 'on' : ''}`} 
        onClick={() => onSwitch('albina')}
      >
        <span className="psw-dot albina"></span>
        Albina
      </button>
    </div>
  );
}
