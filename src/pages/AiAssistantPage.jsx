import React, { useState, useRef, useEffect } from 'react';

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export default function AiAssistantPage({ state, setState, active, pos, showToast }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hello! I'm Era, your personal productivity companion. 🌸 Tell me your daily schedule or upcoming exams, and I'll help you organize them into your planner! ✨" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY;
    const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;

    if (!GROQ_KEY && !GEMINI_KEY) {
      showToast('Please add an API key to .env 🔑');
      return;
    }

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    const tasksList = Object.entries(state.tasks || {}).flatMap(([period, list]) => 
      list.map(t => `${t.title} [${t.done ? 'DONE' : 'PENDING'}] (${period}, ${t.startTime || 'no time'})`)
    ).join(', ');
    const examsList = (state.exams || []).map(e => `${e.subject} on ${e.date}`).join(', ');

    const noteSubjectsList = (state.noteSubjects || ['General']).join(', ');
    const noteCount = (state.notes || []).length;

    const systemPrompt = `You are 'Era', an elite personal assistant for a daily planner app. 
Your goal is to help the user manage their daily schedule, tasks, exams, and notes.
ALWAYS respond in JSON format.
Structure:
{
  "message": "Friendly response",
  "actions": [
    { "type": "ADD_TASK", "payload": { "title": "...", "time": "HH:mm", "note": "..." } },
    { "type": "ADD_NOTE_SUBJECT", "payload": { "name": "..." } },
    { "type": "ADD_NOTE", "payload": { "text": "...", "subject": "..." } },
    { "type": "DELETE_ALL_NOTES" },
    { "type": "CLEAR_TASKS" },
    { "type": "CLEAR_EXAMS" },
    { "type": "DELETE_TASK", "payload": { "title": "..." } },
    { "type": "NAVIGATE", "payload": { "page": "focus_hub" } }
  ]
}
Note: 'focus_hub' maps to page index 7. 'planner' is 0, 'notes' is 1, 'stats' is 2, 'schedule' is 3.
Current local time: ${new Date().toLocaleString()}
Current tasks: ${tasksList || 'None'}
Upcoming exams: ${examsList || 'None'}
Note subjects: ${noteSubjectsList}
Total notes: ${noteCount}`;

    try {
      let res;
      let rawText = '';

      if (GROQ_KEY) {
        // Use Groq API (OpenAI compatible)
        res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GROQ_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
              ...messages.map(m => ({ role: m.role, content: m.text })),
              { role: 'user', content: userMsg }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7
          })
        });
        const data = await res.json();
        rawText = data.choices[0].message.content;
      } else {
        // Fallback to Gemini
        res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              { role: 'user', parts: [{ text: systemPrompt }] },
              ...messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.text }] })),
              { role: 'user', parts: [{ text: userMsg }] }
            ]
          })
        });
        const data = await res.json();
        rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      }

      if (!res.ok) throw new Error('API request failed');

      let jsonStr = rawText;
      if (rawText.includes('```json')) {
        jsonStr = rawText.split('```json')[1].split('```')[0].trim();
      } else if (rawText.includes('```')) {
        jsonStr = rawText.split('```')[1].split('```')[0].trim();
      }

      let response;
      try {
        response = JSON.parse(jsonStr);
      } catch (e) {
        response = { message: rawText, actions: [] };
      }

      const finalMessage = response.message || (typeof response === 'string' ? response : rawText) || "Processed! ✨";
      setMessages(prev => [...prev, { role: 'assistant', text: finalMessage }]);

      if (response.actions && response.actions.length > 0) {
        processActions(response.actions);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', text: `Error: ${e.message}. Try refreshing! 🌸` }]);
    } finally {
      setLoading(false);
    }
  };

  const processActions = (actions) => {
    let actionSummary = [];
    
    setState(prev => {
      let newState = { ...prev };
      
      actions.forEach(action => {
        if (action.type === 'ADD_TASK') {
          const { title, time, note } = action.payload;
          const h = parseInt(time.split(':')[0], 10);
          const period = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
          const newTask = { id: Date.now() + Math.random(), title, note: note || '', startTime: time, done: false };
          newState.tasks = { ...newState.tasks, [period]: [...(newState.tasks[period] || []), newTask] };
          actionSummary.push('Added task');
        } 
        else if (action.type === 'ADD_RECURRING_TASK') {
          const { title, time, note, weekdays } = action.payload;
          const h = parseInt(time.split(':')[0], 10);
          const period = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
          const newTask = { 
            id: Date.now() + Math.random(), 
            title, 
            note: note || '', 
            startTime: time, 
            weekdays: weekdays || [0,1,2,3,4,5,6] 
          };
          
          newState.monthlyRoutine = { ...newState.monthlyRoutine };
          newState.monthlyRoutine[period] = [...(newState.monthlyRoutine[period] || []), newTask];
          
          // Also add to today's tasks if it's one of the selected weekdays
          const today = new Date().getDay();
          if (newTask.weekdays.includes(today)) {
            newState.tasks = { ...newState.tasks };
            newState.tasks[period] = [...(newState.tasks[period] || []), { ...newTask, done: false }];
          }
          actionSummary.push('Added routine');
        }
        else if (action.type === 'ADD_TIMETABLE') {
          const { subject, day, startTime, endTime } = action.payload;
          const newClass = { id: Date.now() + Math.random(), day, subject, startTime, endTime: endTime || '' };
          newState.timetable = [...(newState.timetable || []), newClass];
          actionSummary.push('Added class');
        }
        else if (action.type === 'ADD_EXAM') {
          const { subject, date, notes } = action.payload;
          const newExam = { id: Date.now() + Math.random(), subject, date, notes: notes || '' };
          newState.exams = [...(newState.exams || []), newExam];
          actionSummary.push('Added exam');
        }
        else if (action.type === 'ADD_NOTE_SUBJECT') {
          const { name } = action.payload;
          if (!(newState.noteSubjects || []).includes(name)) {
            newState.noteSubjects = [...(newState.noteSubjects || []), name];
          }
          actionSummary.push('Added subject');
        }
        else if (action.type === 'ADD_NOTE') {
          const { text, subject } = action.payload;
          const newNote = {
            id: Date.now() + Math.random(),
            text,
            subject: subject || 'General',
            pinned: false,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          };
          newState.notes = [newNote, ...(newState.notes || [])];
          actionSummary.push('Saved note');
        }
        else if (action.type === 'DELETE_ALL_NOTES') {
          newState.notes = [];
          actionSummary.push('Cleared all notes');
        }
        else if (action.type === 'CLEAR_TASKS') {
          newState.tasks = { anytime: [], morning: [], afternoon: [], evening: [] };
          actionSummary.push('Cleared all tasks');
        }
        else if (action.type === 'CLEAR_EXAMS') {
          newState.exams = [];
          actionSummary.push('Cleared all exams');
        }
        else if (action.type === 'DELETE_TASK') {
          const { title } = action.payload;
          Object.keys(newState.tasks).forEach(period => {
            newState.tasks[period] = newState.tasks[period].filter(t => t.title.toLowerCase() !== title.toLowerCase());
          });
          actionSummary.push(`Removed task: ${title}`);
        }
      });
      
      return newState;
    });
    
    if (actionSummary.length > 0) {
      showToast(actionSummary.join(', ') + '! 🚀');
    }
  };

  return (
    <div className={`page ${pos}`} id="ai-assistant-page">
      <div className="ph">
        <div className="ph-g">Smart Assistant ✨</div>
        <div className="ph-t">Era <em>AI</em></div>
        <div className="ph-s">Chat to organize your life effortlessly</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '10px 20px', background: 'var(--surface-container-low)', borderBottom: '1px solid var(--outline-variant)' }}>
        <button 
          onClick={() => setMessages([{ role: 'assistant', text: "Chat cleared! 🌸 How can I help you today?" }])}
          style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
        >
          Clear Chat
        </button>
      </div>

      <div className="chat-container" style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        padding: '20px', 
        overflowY: 'auto',
        maxHeight: 'calc(100vh - 250px)',
        gap: '12px'
      }}>
        {messages.map((m, i) => (
          <div key={i} style={{ 
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
            background: m.role === 'user' ? 'var(--primary)' : 'var(--surface-container-low)',
            color: m.role === 'user' ? '#fff' : 'var(--text)',
            padding: '12px 16px',
            borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            fontSize: '14px',
            lineHeight: '1.5',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            {m.text}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', background: 'var(--surface-container-low)', padding: '12px 16px', borderRadius: '18px 18px 18px 4px', display: 'flex', gap: '6px' }}>
            <div className="dot-typing" />
            <div className="dot-typing" style={{ animationDelay: '0.2s' }} />
            <div className="dot-typing" style={{ animationDelay: '0.4s' }} />
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="chat-input-area" style={{ 
        padding: '16px 20px', 
        background: 'var(--surface)', 
        borderTop: '1px solid var(--outline-variant)',
        display: 'flex',
        gap: '10px',
        alignItems: 'center'
      }}>
        <input 
          className="inp"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask me to add a class or task..."
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          style={{ margin: 0, flex: 1 }}
        />
        <button 
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{ 
            background: 'var(--primary)', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '14px', 
            width: '44px', 
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            cursor: 'pointer',
            opacity: (loading || !input.trim()) ? 0.6 : 1
          }}
        >
          {loading ? '⏳' : '🚀'}
        </button>
      </div>

      <style>{`
        .dot-typing {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--primary);
          animation: bounce 0.6s infinite alternate;
        }
        @keyframes bounce {
          from { transform: translateY(0); }
          to { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
