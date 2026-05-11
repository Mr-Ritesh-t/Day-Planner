export default function BottomNav({ current, onGo, noteCount, examCount, assignmentCount }) {
  const items = [
    { id: 0, label: 'Planner', icon: '📋' },
    { id: 1, label: 'Notes', icon: '💌' },
    { id: 2, label: 'Stats', icon: '📊' },
    { id: 3, label: 'Alarms', icon: '🎒' },
    { id: 3, label: 'Alarms', icon: '🎒' }
  ];

  return (
    <nav className="bnav">
      <div className="nav-items" style={{ padding: '0 16px' }}>
        <div className={`nitem ${current === 0 ? 'on' : ''}`} onClick={() => onGo(0)}>
          <div className="npill" style={{ background: 'var(--primary)', opacity: current === 0 ? 0.1 : 0 }}></div>
          <div className="ni">📋</div>
          <div className="nl">Planner</div>
        </div>
        <div className={`nitem ${current === 1 ? 'on' : ''}`} onClick={() => onGo(1)}>
          <div className="npill" style={{ background: 'var(--primary)', opacity: current === 1 ? 0.1 : 0 }}></div>
          <div className="ni">💌</div>
          <div className="nl">Notes</div>
          {noteCount > 0 && <span className="nbadge on">{noteCount}</span>}
        </div>
        <div className={`nitem ${current === 2 ? 'on' : ''}`} onClick={() => onGo(2)}>
          <div className="npill" style={{ background: 'var(--primary)', opacity: current === 2 ? 0.1 : 0 }}></div>
          <div className="ni">📊</div>
          <div className="nl">Stats</div>
        </div>
        <div className={`nitem ${current === 3 ? 'on' : ''}`} onClick={() => onGo(3)}>
          <div className="npill" style={{ background: 'var(--primary)', opacity: current === 3 ? 0.1 : 0 }}></div>
          <div className="ni">🎒</div>
          <div className="nl">Schedule</div>
          {(examCount > 0 || assignmentCount > 0) && (
            <span className="nbadge on" style={{ background: assignmentCount > 0 ? '#ff4444' : '#ff8c00' }}>
              {examCount + assignmentCount}
            </span>
          )}
        </div>
        <div className={`nitem ${current === 6 ? 'on' : ''}`} onClick={() => onGo(6)}>
          <div className="npill" style={{ background: 'var(--primary)', opacity: current === 6 ? 0.1 : 0 }}></div>
          <div className="ni">🤖</div>
          <div className="nl">Era</div>
        </div>

      </div>
    </nav>
  );
}
