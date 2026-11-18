import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { adminLogin } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
  const [username, setUsername] = useState('Kovaicyber@gmail.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const targetRedirect = location.state?.from
    ? (typeof location.state.from === 'string'
        ? location.state.from
        : (location.state.from.pathname + (location.state.from.hash || '')))
    : '/admin/profile#two-factor-security';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await adminLogin({ username, password });
      if (res && res.requires_2fa) {
        // Redirect to 2FA challenge page
        sessionStorage.setItem('ck_2fa_challenge_token', res.challenge_token);
        sessionStorage.setItem('ck_2fa_username', username);
        sessionStorage.setItem('ck_2fa_redirect', targetRedirect);
        navigate('/admin/verify-2fa');
      } else if (res && res.success) {
        login(res.user, res.token);
        navigate(targetRedirect, { replace: true });
      } else {
        setError(res?.message || 'Invalid username or password.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen-wrap" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050511', padding: '1.5rem' }}>
      <div className="login-box" style={{ width: '100%', maxWidth: '440px', background: 'rgba(14, 12, 34, 0.95)', border: '1px solid rgba(139, 32, 255, 0.3)', borderRadius: '20px', padding: '2.5rem', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
        <div className="login-logo-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/assets/images/logo.png" alt="Cyber Kovai" style={{ width: '64px', height: '64px', margin: '0 auto 1rem' }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>Cyber Kovai Admin</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            Security Operations Center (SOC) Console
          </p>
        </div>

        {error && (
          <div className="flash-alert error" style={{ marginBottom: '1.5rem', padding: '0.85rem 1rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '8px', color: '#fca5a5', fontSize: '0.9rem' }}>
            <strong>⚠ Error:</strong> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', color: '#f7f5ff', marginBottom: '0.5rem', fontWeight: 500 }}>
              Administrator Username / Email
            </label>
            <input
              type="text"
              className="form-control"
              required
              autoFocus
              placeholder="admin@cyberkovai.com"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '10px', background: 'rgba(5, 5, 17, 0.8)', border: '1px solid rgba(139, 32, 255, 0.3)', color: '#fff', fontFamily: 'inherit' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', color: '#f7f5ff', marginBottom: '0.5rem', fontWeight: 500 }}>
              Master Security Password
            </label>
            <input
              type="password"
              className="form-control"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '10px', background: 'rgba(5, 5, 17, 0.8)', border: '1px solid rgba(139, 32, 255, 0.3)', color: '#fff', fontFamily: 'inherit' }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '0.9rem', fontSize: '0.95rem', fontWeight: 700, borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Authenticating...' : 'Sign In to Console ➔'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          🔒 Protected under AES-256-GCM encryption &amp; TOTP 2FA protocols.
        </div>
      </div>
    </div>
  );
}

