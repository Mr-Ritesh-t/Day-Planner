import { useState, useRef } from 'react';
import FocusTracker from '../components/FocusTracker';
import SharedWhiteboard from '../components/SharedWhiteboard';

const DEFAULT_TAGS = { dream: '✨', date: '🍷', love: '💖', memo: '💌' };
const DOT_COLORS = ['var(--primary)', 'var(--secondary)', '#e28743', '#5da9e9', '#9b59b6', '#27ae60'];
const CLR = ['c0', 'c1', 'c2', 'c3'];

const EMOJI_OPTIONS = ['✨','💖','🍷','💌','🌸','🌟','🔥','📚','🎵','🌙','☀️','🧠','🏆','🎯','💡','🌈','🍀','❤️','🤍','💜','💙','🧡','💛','💚','🐱','🐶','🌺','🦋','🎨','📝'];

export default function NotesPage({ state, setState, active, pos, showToast }) {
  const [nArea, setNArea] = useState('');
  const [ntag, setNtag] = useState('dream');
  const [viewNote, setViewNote] = useState(null);

  // Custom tag creator state
  const [addingTag, setAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagEmoji, setNewTagEmoji] = useState('✨');
  const tagInputRef = useRef(null);

  // Merge default tags with custom tags saved in profile
  const customTags = state.customTags || {};
  const allTags = { ...DEFAULT_TAGS, ...customTags };

  const getDotColor = (key) => {
    const i = Object.keys(allTags).indexOf(key);
    return DOT_COLORS[i % DOT_COLORS.length];
  };

  const saveNote = () => {
    if (!nArea.trim()) { showToast('Write something first 🌸'); return; }
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

  const saveCustomTag = () => {
    const name = newTagName.trim().toLowerCase().replace(/\s+/g, '-');
    if (!name) { showToast('Enter a tag name 🌸'); return; }
    if (allTags[name]) { showToast('Tag already exists!'); return; }
    setState(prev => ({
      ...prev,
      customTags: { ...(prev.customTags || {}), [name]: newTagEmoji }
    }));
    setNtag(name);
    setNewTagName('');
    setNewTagEmoji('✨');
    setAddingTag(false);
    showToast(`Tag "${newTagEmoji} ${name}" created! 🎉`);
  };

  const deleteCustomTag = (key) => {
    setState(prev => {
      const { [key]: _, ...rest } = prev.customTags || {};
      return { ...prev, customTags: rest };
    });
    if (ntag === key) setNtag('dream');
    showToast('Tag removed');
  };

  const pinned = state.notes.filter(n => n.pinned);

  return (
    <div className={`page ${pos}`} id="p1">
      <div className="ntopbar">
        <div><div className="ntl">{state.name}'s Collection</div><h2>My Private <em>Notes</em></h2></div>
      </div>

      <div className="ncompose">
        <textarea
          placeholder={"Write a daily thought, a personal goal, or study notes... 📓\n\nCapture your ideas here."}
          value={nArea}
          onChange={e => setNArea(e.target.value)}
        />
        <div className="cfooter">
          <div className="ctags">
            {/* Default + custom tags */}
            {Object.entries(allTags).map(([key, emoji]) => (
              <button
                key={key}
                className={`tpill ${ntag === key ? 'on' : ''}`}
                onClick={() => setNtag(key)}
              >
                {emoji} {key.charAt(0).toUpperCase() + key.slice(1)}
                {/* Delete custom tags */}
                {key in customTags && (
                  <span
                    className="tag-del"
                    onClick={e => { e.stopPropagation(); deleteCustomTag(key); }}
                  >✕</span>
                )}
              </button>
            ))}

            {/* Add tag button */}
            <button
              className={`tpill add-tag-btn ${addingTag ? 'on' : ''}`}
              onClick={() => { setAddingTag(v => !v); setTimeout(() => tagInputRef.current?.focus(), 100); }}
            >
              + Tag
            </button>
          </div>
          <button className="bsave" onClick={saveNote}>Save 💾</button>
        </div>

        {/* Custom tag creator panel */}
        {addingTag && (
          <div className="tag-creator">
            <div className="tag-creator-row">
              {/* Emoji picker */}
              <div className="tag-emoji-pick">{newTagEmoji}</div>
              <input
                ref={tagInputRef}
                className="tag-name-inp"
                placeholder="tag name..."
                value={newTagName}
                onChange={e => setNewTagName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveCustomTag()}
                maxLength={16}
              />
              <button className="tag-save-btn" onClick={saveCustomTag}>Add</button>
            </div>
            {/* Emoji grid */}
            <div className="tag-emoji-grid">
              {EMOJI_OPTIONS.map(em => (
                <button
                  key={em}
                  className={`tag-em-btn ${newTagEmoji === em ? 'on' : ''}`}
                  onClick={() => setNewTagEmoji(em)}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <SharedWhiteboard activeProfile={state} />
      <FocusTracker state={state} setState={setState} showToast={showToast} />

      <div className="sl">
        <span className="sli">📍</span>
        <h3>Pinned Notes</h3>
        <span className="slc">{pinned.length}</span>
      </div>
      <div className="pgrid">
        {!pinned.length ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '16px 0', color: 'var(--text-dim)', fontSize: '12px' }}>
            Pin a note to see it here 📌
          </div>
        ) : (
          pinned.map((n, i) => (
            <div key={n.id} className={`pc ${CLR[i % 4]}`} onClick={() => setViewNote(n)}>
              <button className="pcdel" onClick={(e) => delNote(e, n.id)}>✕</button>
              <div className="pct">{allTags[n.tag] || '🏷️'} {n.tag}</div>
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
              <div className="nlidot" style={{ background: getDotColor(n.tag) }}></div>
              <div className="nlib">
                <div className="nliTag">{allTags[n.tag] || '🏷️'} {n.tag}</div>
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
              {allTags[viewNote.tag] || '🏷️'} {viewNote.tag}
            </div>
            <div className="nmtxt" style={{ marginTop: '4px' }}>{viewNote.text}</div>
            <div className="nmdate">From our collection — {viewNote.date}</div>
          </div>
        </div>
      )}
    </div>
  );
}
