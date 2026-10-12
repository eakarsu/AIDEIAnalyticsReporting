import React, { useState } from 'react';

const configuredApiBase = process.env.REACT_APP_API_URL || '/api';
const API = configuredApiBase.endsWith('/api')
  ? configuredApiBase
  : `${configuredApiBase.replace(/\/$/, '')}/api`;

export function configuredDemoCredentials() {
  if (process.env.NODE_ENV === 'production' || process.env.REACT_APP_ENABLE_DEMO_CREDENTIAL_AUTOFILL !== 'true') return null;
  const email = process.env.REACT_APP_DEMO_EMAIL || '';
  const password = process.env.REACT_APP_DEMO_PASSWORD || '';
  return email && password ? { email, password } : null;
}

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const demoCredentials = configuredDemoCredentials();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    if (!demoCredentials) return;
    setEmail(demoCredentials.email);
    setPassword(demoCredentials.password);
    setError('');
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-logo">
          <div className="logo-badge">DEI</div>
          <h1>AI DEI Analytics & Reporting</h1>
          <p>Enterprise Diversity, Equity & Inclusion Platform</p>
        </div>
        {error && <div className="login-error">{error}</div>}
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-email">Email Address</label>
            <input id="login-email" type="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} placeholder="Enter your email" required />
          </div>
          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input id="login-password" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Enter your password" required />
          </div>
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          {demoCredentials && (
            <button type="button" className="auto-fill-btn" onClick={fillDemoCredentials} disabled={loading}>
              Fill Demo Credentials
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

export default Login;
