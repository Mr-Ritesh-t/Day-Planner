import { useState, useEffect } from 'react';

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const CACHE_KEY = 'hdp_ai_tip';

export default function AiStudyTip({ subjects }) {
  const [tip, setTip] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { tip: t, date } = JSON.parse(cached);
      if (date === new Date().toDateString()) {
        setTip(t);
        return;
      }
    }
    fetchTip();
  }, []);

  const fetchTip = async () => {
    if (!GEMINI_KEY) {
      setTip('💡 Add a VITE_GEMINI_API_KEY in your .env file to get AI study tips!');
      return;
    }

    setLoading(true);
    setError('');
    const subjectList = subjects && subjects.length > 0
      ? subjects.map(s => s.name).join(', ')
      : 'general studies';

    const prompt = `You are a friendly, motivating study coach for students. Give ONE practical, specific study tip (2-3 sentences max) for someone currently studying: ${subjectList}. Make it actionable, encouraging, and relevant. No generic advice. Be fresh and creative.`;

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 150, temperature: 0.8 }
          })
        }
      );
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (text) {
        setTip(text.trim());
        localStorage.setItem(CACHE_KEY, JSON.stringify({ tip: text.trim(), date: new Date().toDateString() }));
      } else {
        setError('Could not load tip. Try again!');
      }
    } catch (e) {
      setError('Network error. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    localStorage.removeItem(CACHE_KEY);
    fetchTip();
  };

  return (
    <div className="gc" style={{ padding: '20px', marginBottom: '16px', background: 'linear-gradient(135deg, rgba(255,193,7,0.12), rgba(255,193,7,0.04))', border: '1.5px solid rgba(255,193,7,0.3)',margin:'10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>🤖</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: '13px' }}>AI Study Tip</div>
            <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Powered by Gemini</div>
          </div>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          style={{
            background: 'rgba(255,193,7,0.2)', color: '#b8860b',
            border: 'none', borderRadius: '10px', padding: '6px 12px',
            fontSize: '11px', fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.5 : 1
          }}
        >
          {loading ? '⏳' : '🔄 New Tip'}
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-dim)', fontSize: '13px' }}>
          <div style={{ width: '16px', height: '16px', border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          Generating your tip...
        </div>
      ) : error ? (
        <div style={{ color: '#ff4444', fontSize: '13px' }}>{error}</div>
      ) : (
        <div style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text)', fontStyle: 'italic' }}>
          "{tip}"
        </div>
      )}

      <div style={{ marginTop: '10px', fontSize: '10px', color: 'var(--text-dim)' }}>
        ✨ Tip refreshes daily · Tailored to: {subjects && subjects.length > 0 ? subjects.slice(0, 3).map(s => s.name).join(', ') : 'your subjects'}
      </div>
    </div>
  );
}
