import { useState } from 'react';

export default function LoginScreen({ onUnlock }) {
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = () => {
    
    if (pass.toLowerCase() === '2009') {
      onUnlock();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="nscr">
      <div className="nsico">🔒</div>
      <h1>Private<br /><em>Sanctuary</em></h1>
      <p>Enter the secret key to access our shared world 🌸</p>
      
      <div style={{ width: '100%', position: 'relative' }}>
        <input 
          type="password"
          className={`nsinp ${error ? 'error' : ''}`} 
          value={pass} 
          onChange={e => setPass(e.target.value)} 
          placeholder="Our secret key..." 
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
        />
        {error && <div style={{ 
          color: '#ff4d4d', 
          fontSize: '12px', 
          marginTop: '8px', 
          fontWeight: '700' 
        }}>That's not it, love! Try again. ❤️</div>}
      </div>

      <button className="nsbtn" onClick={handleLogin}>Unlock Together 💖</button>
      
      <div style={{ marginTop: '24px', opacity: 0.4, fontSize: '10px', textTransform: 'uppercase' }}>
        Cloud Synchronized & Secure
      </div>
    </div>
  );
}
