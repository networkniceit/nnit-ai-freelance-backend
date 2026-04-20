// frontend/App.js
// Main React app combining login, dashboard, and Stripe subscription flows
import React, { useState } from 'react';
import { UserDashboard } from './Dashboard';
import SubscriptionButton from './SubscriptionButton';

export default function App() {
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.token) {
        setToken(data.token);
        setLoggedIn(true);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Login error');
    }
  };

  // Example Stripe priceId (replace with your real priceId from Stripe dashboard)
  const priceId = 'price_12345';

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
      <h1>NNIT AI Platform</h1>
      {!loggedIn ? (
        <form onSubmit={handleLogin} style={{ marginBottom: 32 }}>
          <h2>Login</h2>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', marginBottom: 8, padding: 8 }} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', marginBottom: 8, padding: 8 }} />
          <button type="submit" style={{ padding: '10px 24px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, fontSize: 16, cursor: 'pointer' }}>Login</button>
          {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
        </form>
      ) : (
        <>
          <UserDashboard token={token} />
          <div style={{ marginTop: 32 }}>
            <h3>Subscribe to a Plan</h3>
            <SubscriptionButton priceId={priceId} token={token} />
          </div>
        </>
      )}
    </div>
  );
}
