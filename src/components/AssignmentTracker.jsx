import { useState } from 'react';

export default function AssignmentTracker({ state, setState, showToast, compact }) {
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');

  const assignments = state.assignments || [];

  const getDaysLeft = (dateStr) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const due = new Date(dateStr); due.setHours(0, 0, 0, 0);
    return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  };

  const addAssignment = () => {
    if (!subject.trim() || !title.trim() || !dueDate) { showToast('Fill in all fields 📝'); return; }
    const newA = { id: Date.now(), subject: subject.trim(), title: title.trim(), dueDate, status: 'pending' };
    setState(prev => ({ ...prev, assignments: [...(prev.assignments || []), newA] }));
    setSubject(''); setTitle(''); setDueDate(''); setShowForm(false);
    showToast('Assignment added 📚');
  };

  const toggleStatus = (id) => {
    setState(prev => ({
      ...prev,
      assignments: (prev.assignments || []).map(a =>
        a.id === id
          ? { ...a, status: a.status === 'pending' ? 'submitted' : 'pending' }
          : a
      )
    }));
  };

  const deleteAssignment = (id) => {
    setState(prev => ({ ...prev, assignments: (prev.assignments || []).filter(a => a.id !== id) }));
  };

  const sorted = [...assignments].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  const pending = sorted.filter(a => a.status === 'pending');
  const submitted = sorted.filter(a => a.status === 'submitted');

  const getUrgencyColor = (days) => {
    if (days < 0) return '#ff4444';
    if (days <= 2) return '#ff8c00';
    if (days <= 5) return 'var(--primary)';
    return '#27ae60';
  };

  const formatDue = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  // Compact banner for planner page — show only urgent pending
  if (compact) {
    const urgent = pending.filter(a => getDaysLeft(a.dueDate) <= 3);
    if (!urgent.length) return null;
    return (
      <div style={{ margin: '10px 10px 12px' }}>
        {urgent.slice(0, 2).map(a => {
          const d = getDaysLeft(a.dueDate);
          return (
            <div key={a.id} style={{
              background: d < 0 ? '#ff444422' : '#ff8c0022',
              border: `1.5px solid ${d < 0 ? '#ff4444' : '#ff8c00'}55`,
              borderRadius: '14px', padding: '10px 14px',
              display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px'
            }}>
              <span style={{ fontSize: '18px' }}>📋</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '12px' }}>{a.title}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{a.subject} · due {formatDue(a.dueDate)}</div>
              </div>
              <div style={{ fontWeight: 800, fontSize: '12px', color: d < 0 ? '#ff4444' : '#ff8c00' }}>
                {d < 0 ? 'OVERDUE' : `${d}d`}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      {/* Section header */}
      <div className="sl">
        <span className="sli">📋</span>
        <h3>Assignments</h3>
        <span className="slc">{pending.length} pending</span>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{ marginLeft: 'auto', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '12px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
        >
          + Add
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="add-box" style={{ marginBottom: '12px' }}>
          <input className="inp" placeholder="Subject (e.g. Physics)" value={subject} onChange={e => setSubject(e.target.value)} />
          <div className="irow" style={{ marginTop: '10px' }}>
            <input className="inp" placeholder="Assignment title" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <span style={{fontSize:'12px',color:'var(--text-dim)',margin:'10px'}}>Add Due Date</span>
           <div style={{}}>
            
            <input className="inp" type="date" placeholder='Date' value={dueDate} onChange={e => setDueDate(e.target.value)} style={{width:'50%'}} />
            <button className={`fab-add ${subject.trim() && title.trim() && dueDate ? 'ready' : ''}`} onClick={addAssignment}>Add</button>
            </div>
        </div>
      )}

      {/* Pending assignments */}
      {!assignments.length ? (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-dim)', fontSize: '12px' }}>
          No assignments yet 🎉 Stay on top of your work!
        </div>
      ) : (
        <>
          {pending.map(a => {
            const days = getDaysLeft(a.dueDate);
            const urgColor = getUrgencyColor(days);
            return (
              <div key={a.id} className="nli" style={{ padding: '12px 16px', marginBottom: '6px' }}>
                <div className="nlidot" style={{ background: urgColor }} />
                <div className="nlib" style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '13px' }}>{a.title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                    {a.subject} · Due {formatDue(a.dueDate)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: '12px', color: urgColor, minWidth: '48px', textAlign: 'right' }}>
                    {days < 0 ? '⚠️ Late' : days === 0 ? 'Today!' : `${days}d`}
                  </div>
                  <button
                    onClick={() => toggleStatus(a.id)}
                    style={{ background: '#27ae6022', color: '#27ae60', border: '1px solid #27ae6044', borderRadius: '10px', padding: '5px 10px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    ✓ Done
                  </button>
                  <button className="nlidel" onClick={() => deleteAssignment(a.id)}>✕</button>
                </div>
              </div>
            );
          })}

          {submitted.length > 0 && (
            <>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', padding: '8px 0 4px', opacity: 0.7 }}>✓ Submitted ({submitted.length})</div>
              {submitted.map(a => (
                <div key={a.id} className="nli" style={{ padding: '10px 16px', opacity: 0.55, marginBottom: '4px' }}>
                  <div className="nlidot" style={{ background: '#27ae60' }} />
                  <div className="nlib" style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '12px', textDecoration: 'line-through' }}>{a.title}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{a.subject} · {formatDue(a.dueDate)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => toggleStatus(a.id)}
                      style={{ background: 'var(--surface-container-low)', color: 'var(--text-dim)', border: 'none', borderRadius: '10px', padding: '4px 8px', fontSize: '10px', cursor: 'pointer' }}
                    >
                      Undo
                    </button>
                    <button className="nlidel" onClick={() => deleteAssignment(a.id)}>✕</button>
                  </div>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
