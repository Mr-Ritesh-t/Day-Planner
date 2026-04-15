export default function BottomNav({ current, onGo, noteCount }) {
  return (
    <nav className="bnav">
      <div className="nav-items">
        <div className={`nitem ${current === 0 ? 'on' : ''}`} onClick={() => onGo(0)}>
          <div className="npill"></div>
          <div className="ni">📋</div>
          <div className="nl">Daily</div>
        </div>
        <div className={`nitem ${current === 1 ? 'on' : ''}`} onClick={() => onGo(1)}>
          <div className="npill"></div>
          <div className="ni">💌</div>
          <div className="nl">Memories</div>
          {noteCount > 0 && (
            <span className="nbadge on">{noteCount > 9 ? '9+' : noteCount}</span>
          )}
        </div>
        <div className={`nitem ${current === 2 ? 'on' : ''}`} onClick={() => onGo(2)}>
          <div className="npill"></div>
          <div className="ni">📈</div>
          <div className="nl">Progress</div>
        </div>
        <div className={`nitem ${current === 3 ? 'on' : ''}`} onClick={() => onGo(3)}>
          <div className="npill"></div>
          <div className="ni">⏰</div>
          <div className="nl">Alarms</div>
        </div>
      </div>
    </nav>
  );
}
