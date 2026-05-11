import { useState, useRef, useMemo } from 'react';
import FocusTracker from '../components/FocusTracker';
import SharedWhiteboard from '../components/SharedWhiteboard';

const DOT_COLORS = ['var(--primary)', 'var(--secondary)', '#e28743', '#5da9e9', '#9b59b6', '#27ae60'];

export default function NotesPage({ state, setState, active, pos, showToast }) {
  const [nArea, setNArea] = useState('');
  const [activeSubject, setActiveSubject] = useState('General');
  const [viewNote, setViewNote] = useState(null);
  const [filterSubject, setFilterSubject] = useState('All');

  const subjects = useMemo(() => {
    const list = state.noteSubjects || ['General'];
    if (!list.includes('General')) return ['General', ...list];
    return list;
  }, [state.noteSubjects]);

  const saveNote = () => {
    if (!nArea.trim()) { showToast('Write something first 🌸'); return; }
    const newNote = {
      id: Date.now(),
      text: nArea.trim(),
      subject: activeSubject,
      pinned: false,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
    setState(prev => ({ ...prev, notes: [newNote, ...prev.notes] }));
    setNArea('');
    showToast(`Note saved to ${activeSubject} 💾`);
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

  const addSubject = () => {
    const name = prompt("Enter new note subject:");
    if (!name) return;
    if (subjects.includes(name)) { showToast('Subject already exists! 🌸'); return; }
    setState(prev => ({ ...prev, noteSubjects: [...(prev.noteSubjects || []), name] }));
    setActiveSubject(name);
    showToast(`Note subject "${name}" added! 📚`);
  };

  const removeSubject = (sub) => {
    if (sub === 'General') return;
    if (!confirm(`Remove subject "${sub}"? Notes will be moved to General.`)) return;
    
    setState(prev => ({
      ...prev,
      noteSubjects: (prev.noteSubjects || []).filter(s => s !== sub),
      notes: (prev.notes || []).map(n => n.subject === sub ? { ...n, subject: 'General' } : n)
    }));
    
    if (activeSubject === sub) setActiveSubject('General');
    if (filterSubject === sub) setFilterSubject('All');
    showToast(`Subject "${sub}" removed`);
  };

  const filteredNotes = filterSubject === 'All' 
    ? state.notes 
    : state.notes.filter(n => (n.subject || 'General') === filterSubject);

  const pinned = filteredNotes.filter(n => n.pinned);

  return (
    <div className={`page ${pos}`} id="p1">
      <div className="ntopbar">
        <div><div className="ntl">{state.name}'s Knowledge Base</div><h2>Subject <em>Notes</em></h2></div>
      </div>

      <div className="ncompose">
        <textarea
          placeholder={`Write notes for ${activeSubject}... 📓`}
          value={nArea}
          onChange={e => setNArea(e.target.value)}
        />
        <div className="cfooter">
          <div className="ctags" style={{ overflowX: 'auto', display: 'flex', gap: '8px', paddingBottom: '4px' }}>
            {subjects.map((sub) => (
              <button
                key={sub}
                className={`tpill ${activeSubject === sub ? 'on' : ''}`}
                onClick={() => setActiveSubject(sub)}
                style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                📚 {sub}
                {sub !== 'General' && (
                  <span 
                    style={{ opacity: 0.5, fontSize: '10px', padding: '2px' }} 
                    onClick={(e) => { e.stopPropagation(); removeSubject(sub); }}
                  >✕</span>
                )}
              </button>
            ))}
            <button className="tpill add-tag-btn" onClick={addSubject}>+ New Subject</button>
          </div>
          <button className="bsave" onClick={saveNote}>Save 💾</button>
        </div>
      </div>

      <SharedWhiteboard activeProfile={state} />
      <FocusTracker state={state} setState={setState} showToast={showToast} />

      <div className="sl">
        <span className="sli">🏷️</span>
        <h3>Filter by Subject</h3>
      </div>
      <div className="ctags" style={{ padding: '0 20px', marginBottom: '16px', overflowX: 'auto', display: 'flex', gap: '8px' }}>
        <button className={`tpill ${filterSubject === 'All' ? 'on' : ''}`} onClick={() => setFilterSubject('All')}>All</button>
        {subjects.map(sub => (
          <button
            key={sub}
            className={`tpill ${filterSubject === sub ? 'on' : ''}`}
            onClick={() => setFilterSubject(sub)}
          >
            {sub}
          </button>
        ))}
      </div>

      {pinned.length > 0 && (
        <>
          <div className="sl">
            <span className="sli">📍</span>
            <h3>Pinned in {filterSubject}</h3>
          </div>
          <div className="pgrid">
            {pinned.map((n, i) => (
              <div key={n.id} className={`pc c${i%4}`} onClick={() => setViewNote(n)}>
                <button className="pcdel" onClick={(e) => delNote(e, n.id)}>✕</button>
                <div className="pct">📚 {n.subject || 'General'}</div>
                <div className="pcc">{n.text}</div>
                <div className="pcd">{n.date}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="sl">
        <span className="sli">📜</span>
        <h3>{filterSubject} Notes</h3>
        <span className="slc">{filteredNotes.length}</span>
      </div>
      <div id="nList" style={{ padding: '0 20px' }}>
        {!filteredNotes.length ? (
          <div className="empty">
            No notes in {filterSubject} yet...<br />Let's write something! ✍️
          </div>
        ) : (
          filteredNotes.map(n => (
            <div key={n.id} className="nli" onClick={() => setViewNote(n)}>
              <div className="nlidot" style={{ background: DOT_COLORS[subjects.indexOf(n.subject || 'General') % DOT_COLORS.length] }}></div>
              <div className="nlib">
                <div className="nliTag">📚 {n.subject || 'General'}</div>
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
            <div style={{ fontSize: '13px', color: 'var(--secondary)', fontWeight: 700, marginBottom: '12px' }}>
              📚 {viewNote.subject || 'General'}
            </div>
            <div className="nmtxt" style={{ marginTop: '4px' }}>{viewNote.text}</div>
            <div className="nmdate">Created on {viewNote.date}</div>
          </div>
        </div>
      )}
    </div>
  );
}
