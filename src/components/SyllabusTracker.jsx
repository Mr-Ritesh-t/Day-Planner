import { useState } from 'react';

const STATUS_CONFIG = {
  done: { label: 'Done ✓', color: '#27ae60', bg: '#27ae6022' },
  inprogress: { label: 'In Progress', color: '#e28743', bg: '#e2874322' },
  todo: { label: 'To Do', color: 'var(--text-dim)', bg: 'var(--surface-container-low)' },
};
const STATUS_CYCLE = { todo: 'inprogress', inprogress: 'done', done: 'todo' };

export default function SyllabusTracker({ state, setState, showToast }) {
  const [newSubject, setNewSubject] = useState('');
  const [newTopic, setNewTopic] = useState({});
  const [expanded, setExpanded] = useState({});

  const syllabus = state.syllabus || {};

  const addSubject = () => {
    const name = newSubject.trim();
    if (!name) return;
    if (syllabus[name]) { showToast('Subject already exists!'); return; }
    setState(prev => ({ ...prev, syllabus: { ...(prev.syllabus || {}), [name]: [] } }));
    setNewSubject('');
    setExpanded(p => ({ ...p, [name]: true }));
    showToast(`${name} added 📚`);
  };

  const deleteSubject = (name) => {
    setState(prev => {
      const { [name]: _, ...rest } = (prev.syllabus || {});
      return { ...prev, syllabus: rest };
    });
  };

  const addTopic = (subject) => {
    const topic = (newTopic[subject] || '').trim();
    if (!topic) return;
    const newEntry = { id: Date.now(), topic, status: 'todo' };
    setState(prev => ({
      ...prev,
      syllabus: {
        ...(prev.syllabus || {}),
        [subject]: [...(prev.syllabus[subject] || []), newEntry]
      }
    }));
    setNewTopic(p => ({ ...p, [subject]: '' }));
  };

  const cycleStatus = (subject, id) => {
    setState(prev => ({
      ...prev,
      syllabus: {
        ...(prev.syllabus || {}),
        [subject]: (prev.syllabus[subject] || []).map(t =>
          t.id === id ? { ...t, status: STATUS_CYCLE[t.status] } : t
        )
      }
    }));
  };

  const deleteTopic = (subject, id) => {
    setState(prev => ({
      ...prev,
      syllabus: {
        ...(prev.syllabus || {}),
        [subject]: (prev.syllabus[subject] || []).filter(t => t.id !== id)
      }
    }));
  };

  const getCompletion = (topics) => {
    if (!topics.length) return 0;
    return Math.round((topics.filter(t => t.status === 'done').length / topics.length) * 100);
  };

  const subjects = Object.keys(syllabus);

  return (
    <div style={{margin:'10px'}}>
      <div className="sl">
        <span className="sli">📖</span>
        <h3>Syllabus Tracker</h3>
        <span className="slc">{subjects.length} subjects</span>
      </div>

      {/* Add subject */}
      <div className="irow" style={{ marginTop: 0, marginBottom: '16px', padding: '0 4px' }}>
        <input
          className="inp"
          placeholder="Add new subject..."
          value={newSubject}
          onChange={e => setNewSubject(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addSubject()}
          style={{ flex: 1 }}
        />
      </div>
      <button className={`fab-add ${newSubject.trim() ? 'ready' : ''}`} onClick={addSubject} style={{ flexShrink: 0 }}>Add</button>

      {!subjects.length ? (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-dim)', fontSize: '12px' }}>
          Add your subjects to track your syllabus 📚
        </div>
      ) : (
        subjects.map(subject => {
          const topics = syllabus[subject] || [];
          const pct = getCompletion(topics);
          const isExpanded = expanded[subject];
          const done = topics.filter(t => t.status === 'done').length;

          return (
            <div key={subject} className="gc" style={{ marginBottom: '12px', padding: '0', overflow: 'hidden' }}>
              {/* Subject header */}
              <div
                style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
                onClick={() => setExpanded(p => ({ ...p, [subject]: !p[subject] }))}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: '14px' }}>{subject}</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: pct === 100 ? '#27ae60' : 'var(--primary)' }}>{pct}%</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{done}/{topics.length}</span>
                      <span style={{ fontSize: '16px', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>⌄</span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div style={{ height: '4px', background: 'var(--surface-container-low)', borderRadius: '4px', marginTop: '8px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`, height: '100%',
                      background: pct === 100 ? '#27ae60' : pct >= 60 ? '#e28743' : 'var(--primary)',
                      borderRadius: '4px', transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>
              </div>

              {/* Topics list */}
              {isExpanded && (
                <div style={{ borderTop: '1px solid var(--glass-border)', padding: '12px 16px' }}>
                  {topics.map(t => {
                    const cfg = STATUS_CONFIG[t.status];
                    return (
                      <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid var(--glass-border)' }}>
                        <button
                          onClick={() => cycleStatus(subject, t.id)}
                          style={{
                            background: cfg.bg, color: cfg.color,
                            border: `1px solid ${cfg.color}44`,
                            borderRadius: '10px', padding: '4px 10px', fontSize: '10px',
                            fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0
                          }}
                        >
                          {cfg.label}
                        </button>
                        <span style={{
                          flex: 1, fontSize: '13px',
                          textDecoration: t.status === 'done' ? 'line-through' : 'none',
                          opacity: t.status === 'done' ? 0.5 : 1,
                          fontWeight: t.status === 'inprogress' ? 700 : 400
                        }}>
                          {t.topic}
                        </span>
                        <button className="nlidel" onClick={() => deleteTopic(subject, t.id)} style={{ flexShrink: 0 }}>✕</button>
                      </div>
                    );
                  })}

                  {/* Add topic */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <input
                      className="inp"
                      placeholder="Add topic..."
                      value={newTopic[subject] || ''}
                      onChange={e => setNewTopic(p => ({ ...p, [subject]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && addTopic(subject)}
                      style={{ flex: 1, fontSize: '12px', padding: '8px 12px' }}
                    />
                    <button
                      onClick={() => addTopic(subject)}
                      style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '10px', padding: '8px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      +
                    </button>
                    <button
                      onClick={() => deleteSubject(subject)}
                      style={{ background: '#ff444422', color: '#ff4444', border: '1px solid #ff444444', borderRadius: '10px', padding: '8px 12px', fontSize: '12px', cursor: 'pointer' }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
