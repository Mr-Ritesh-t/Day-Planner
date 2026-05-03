import { useState } from 'react';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from '../firebase';

export default function AuthPage({ showToast }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Attempting auth...', { isLogin, email });

    if (!email || !password || (!isLogin && !name)) {
      showToast('Please fill in all fields! 🌸');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        console.log('Signing in...');
        await signInWithEmailAndPassword(auth, email, password);
        showToast('Welcome back! ✨');
      } else {
        console.log('Creating account...');
        await createUserWithEmailAndPassword(auth, email, password);
        showToast('Account created! 💖');
      }
    } catch (err) {
      console.error('Auth mismatch:', err);
      // Simplify common firebase errors
      let msg = err.message.replace('Firebase:', '');
      if (msg.includes('auth/invalid-credential')) msg = "Invalid email or password.";
      if (msg.includes('auth/email-already-in-use')) msg = "Email already in use.";
      if (msg.includes('auth/weak-password')) msg = "Password is too weak.";
      
      showToast(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="albx" style={{ transform: 'none', position: 'relative', zIndex: 10, maxWidth: '360px', padding: '40px 24px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✨</div>
          <h2 style={{ fontSize: '24px', fontWeight: 800 }}>{isLogin ? 'Welcome Back' : 'Join the Hub'}</h2>
          <p style={{ opacity: 0.6, fontSize: '14px', marginTop: '8px' }}>
            {isLogin ? 'Sign in to sync your moments' : 'Start your journey today'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
          {!isLogin && (
            <input 
              className="inp" 
              placeholder="Your Name" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              style={{ padding: '16px' }}
            />
          )}
          <input 
            className="inp" 
            type="email" 
            placeholder="Email Address" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            style={{ padding: '16px' }}
          />
          <input 
            className="inp" 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            style={{ padding: '16px' }}
          />
          
          <button 
            type="submit" 
            className={`fab-add ${((isLogin || name) && email && password) ? 'ready' : ''}`} 
            style={{ width: '100%', marginTop: '12px', height: '56px' }}
            disabled={loading}
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        {isLogin && (
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button 
              onClick={async () => {
                if (!email) { showToast('Enter your email first! 🌸'); return; }
                try {
                  await sendPasswordResetEmail(auth, email);
                  showToast('Reset email sent! 📧');
                } catch (e) { showToast(e.message); }
              }}
              style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '13px', cursor: 'pointer' }}
            >
              Forgot Password?
            </button>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px' }}>
          <span style={{ opacity: 0.6 }}>{isLogin ? "Don't have an account? " : "Already have an account? "}</span>
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </div>
      </div>
    </div>
  );
}

