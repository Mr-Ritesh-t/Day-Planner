import { useState } from 'react';
import FocusTracker from '../components/FocusTracker';

const TAGS = { dream: '✨', date: '🍷', love: '💖', memo: '💌' };
const DOT = { dream: 'var(--primary)', date: 'var(--secondary)', love: 'var(--primary)', memo: 'var(--secondary)' };
const CLR = ['c0', 'c1', 'c2', 'c3'];

export default function NotesPage({ state, setState, active, pos, showToast }) {
  const [nArea, setNArea] = useState('');
  const [ntag, setNtag] = useState('journal');
  const [viewNote, setViewNote] = useState(null);

  const saveNote = () => {
    if (!nArea.trim()) {
      showToast('Write something first 🌸');
      return;
    }
    const newNote = {
      id: Date.now(),
      text: nArea.trim(),
      tag: ntag,
      pinned: false,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
    setState(prev => ({ ...prev, notes: [newNote, ...prev.notes] }));
    setNArea('');
    showToast('Note saved 💾');
  };

  const delNote = (e, id) => {
    e.stopPropagation();
    setState(prev => ({ ...prev, notes: prev.notes.filter(n => n.id !== id) }));
  };

  const pinNote = (e, id) => {
    e.stopPropagation();
    setState(prev => ({
      ...prev,
      notes: prev.notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n)
    }));
  };

  const pinned = state.notes.filter(n => n.pinned);

  return (
    <div className={`page ${pos}`} id="p1">
      <div className="ntopbar">
        <div><div className="ntl">{state.name}'s Collection</div><h2>My Private <em>Notes</em></h2></div>
      </div>

      <div className="ncompose">
        <textarea 
          placeholder="Write a daily thought, a personal goal, or study notes... 📓&#10;&#10;Capture your ideas here." 
          value={nArea}
          onChange={e => setNArea(e.target.value)}
        ></textarea>
        <div className="cfooter">
          <div className="ctags">
            {Object.entries(TAGS).map(([key, emoji]) => (
              <button 
                key={key} 
                className={`tpill ${ntag === key ? 'on' : ''}`}
                onClick={() => setNtag(key)}
              >
                {emoji} {key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>
          <button className="bsave" onClick={saveNote}>Save Note 💾</button>
        </div>
      </div>

      <FocusTracker state={state} setState={setState} showToast={showToast} />

      <div className="sl">
        <span className="sli">📍</span>
        <h3>Pinned Notes</h3>
        <span className="slc">{pinned.length}</span>
      </div>
      <div className="pgrid">
        {!pinned.length ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '16px 0', color: 'var(--text3)', fontSize: '12px' }}>
            Pin a note to see it here 📌
          </div>
        ) : (
          pinned.map((n, i) => (
            <div key={n.id} className={`pc ${CLR[i % 4]}`} onClick={() => setViewNote(n)}>
              <button className="pcdel" onClick={(e) => delNote(e, n.id)}>✕</button>
              <div className="pct">{TAGS[n.tag]} {n.tag}</div>
              <div className="pcc">{n.text}</div>
              <div className="pcd">{n.date}</div>
            </div>
          ))
        )}
      </div>

      <div className="sl">
        <span className="sli">📜</span>
        <h3>All Notes</h3>
        <span className="slc">{state.notes.length}</span>
      </div>
      <div id="nList" style={{ padding: '0 20px' }}>
        {!state.notes.length ? (
          <div className="empty">
            No notes captured yet...<br />Let's write our first page! ✍️
          </div>
        ) : (
          state.notes.map(n => (
            <div key={n.id} className="nli" onClick={() => setViewNote(n)}>
              <div className="nlidot" style={{ background: DOT[n.tag] }}></div>
              <div className="nlib">
                <div className="nliTag">{TAGS[n.tag]} {n.tag}</div>
                <div className="nlitxt">{n.text}</div>
                <div className="nlidate">{n.date}</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="nlidel" onClick={(e) => pinNote(e, n.id)} style={{ fontSize: '14px' }}>
                  {n.pinned ? '📍' : '📌'}
                </button>
                <button className="nlidel" onClick={(e) => delNote(e, n.id)}>✕</button>
              </div>
            </div>
          ))
        )}
      </div>

      {viewNote && (
        <div className="nmo open" onClick={() => setViewNote(null)}>
          <div className="nmb" onClick={e => e.stopPropagation()}>
            <div className="nmh"></div>
            <button className="nmclose" onClick={() => setViewNote(null)}>✕</button>
            <div className="nmtxt" style={{ marginTop: '12px' }}>{viewNote.text}</div>
            <div className="nmdate">From our collection — {viewNote.date}</div>
          </div>
        </div>
      )}
    </div>
  );
}
