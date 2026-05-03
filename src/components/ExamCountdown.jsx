import { useState } from 'react';

export default function ExamCountdown({ state, setState, showToast, compact = false }) {
  const [showForm, setShowForm] = useState(false);
  const [subj, setSubj] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');

  const exams = state.exams || [];

  const addExam = () => {
    if (!subj.trim() || !date) { showToast('Fill in subject & date 📅'); return; }
    const newExam = { id: Date.now(), subject: subj.trim(), date, notes: notes.trim() };
    setState(prev => ({ ...prev, exams: [...(prev.exams || []), newExam] }));
    setSubj(''); setDate(''); setNotes(''); setShowForm(false);
    showToast('Exam added 📚');
  };

  const delExam = (id) => {
    setState(prev => ({ ...prev, exams: (prev.exams || []).filter(e => e.id !== id) }));
  };

  const getDaysLeft = (dateStr) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const exam = new Date(dateStr); exam.setHours(0, 0, 0, 0);
    return Math.ceil((exam - today) / (1000 * 60 * 60 * 24));
  };

  const upcoming = exams
    .map(e => ({ ...e, days: getDaysLeft(e.date) }))
    .filter(e => e.days >= 0)
    .sort((a, b) => a.days - b.days);

  const urgent = upcoming.filter(e => e.days <= 7);

  const getBadgeStyle = (days) => {
    if (days === 0) return { bg: '#ff4444', color: '#fff' };
    if (days <= 3) return { bg: '#ff8c00', color: '#fff' };
    if (days <= 7) return { bg: 'var(--primary)', color: '#fff' };
    return { bg: 'var(--surface-container-low)', color: 'var(--text)' };
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  // If compact, only return the urgent banners
  if (compact) {
    return (
      <div style={{ margin: '0 0 8px' }}>
        {urgent.map(e => {
          const { bg, color } = getBadgeStyle(e.days);
          return (
            <div key={e.id} style={{
              background: `linear-gradient(135deg, ${bg}22, ${bg}11)`,
              border: `1.5px solid ${bg}55`,
              borderRadius: '16px',
              padding: '12px 16px',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '10px'
            }}>
              <div style={{ fontSize: '28px', lineHeight: 1 }}>📝</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '13px' }}>{e.subject} Exam</div>
                {e.notes && <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>{e.notes}</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ background: bg, color, borderRadius: '10px', padding: '4px 10px', fontWeight: 800, fontSize: '13px', whiteSpace: 'nowrap' }}>
                  {e.days === 0 ? 'TODAY!' : `${e.days}d left`}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px' }}>{formatDate(e.date)}</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Full management view
  return (
    <div style={{ margin: '0 0 16px' }}>
      {/* Section header */}
      <div className="sl">
        <span className="sli">📝</span>
        <h3>Exam Countdown</h3>
        <span className="slc">{upcoming.length}</span>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{ marginLeft: 'auto', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '12px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
        >
          {showForm ? '✕ Close' : '+ Add'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="add-box" style={{ marginBottom: '12px' }}>
          <input className="inp" placeholder="Subject (e.g. Mathematics)" value={subj} onChange={e => setSubj(e.target.value)} />
          <div className="irow" style={{ marginTop: '10px' }}>
            <input className="inp" placeholder="Date" type="date" value={date} onChange={e => setDate(e.target.value)} style={{ flex: 1 }} />
            <input className="inp" placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} style={{ flex: 2 }} />
          </div>
          <button className={`fab-add ${subj.trim() && date ? 'ready' : ''}`} onClick={addExam}>Add</button>
        </div>
      )}

      {/* All upcoming exams */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {!upcoming.length ? (
          <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-dim)', fontSize: '12px' }}>
            No upcoming exams 🎉 Add one to track your countdown!
          </div>
        ) : (
          upcoming.map(e => {
            const { bg } = getBadgeStyle(e.days);
            return (
              <div key={e.id} className="nli" style={{ padding: '12px 16px', margin: '1px' }}>
                <div className="nlidot" style={{ background: bg }} />
                <div className="nlib">
                  <div style={{ fontWeight: 700, fontSize: '13px' }}>{e.subject}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{formatDate(e.date)} · {e.days === 0 ? '🔴 Today!' : `${e.days} days left`}</div>
                  {e.notes && <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px', fontStyle: 'italic' }}>{e.notes}</div>}
                </div>
                <button className="nlidel" onClick={() => delExam(e.id)}>✕</button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
