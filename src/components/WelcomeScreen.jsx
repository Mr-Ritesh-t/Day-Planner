import { useState } from 'react';

export default function WelcomeScreen({ onSave }) {
  const [val, setVal] = useState('');
  return (
    <div className="nscr">
      <div className="nsico">💍</div>
      <h1>Our Shared<br /><em>Sanctuary</em></h1>
      <p>A place for our routines, our dreams,<br />and every little moment in between ✨</p>
      <input 
        className="nsinp" 
        value={val} 
        onChange={e => setVal(e.target.value)} 
        placeholder="Enter your name, love..." 
        maxLength="20" 
        onKeyDown={e => e.key === 'Enter' && onSave(val)}
      />
      <button className="nsbtn" onClick={() => onSave(val)}>Enter Our World 💖</button>
    </div>
  );
}
