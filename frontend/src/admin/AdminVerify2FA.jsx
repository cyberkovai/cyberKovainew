import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { verify2FA } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function AdminVerify2FA() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const challengeToken = sessionStorage.getItem('ck_2fa_challenge_token');
  const username = sessionStorage.getItem('ck_2fa_username') || 'Administrator';

  useEffect(() => {
    if (!challengeToken) {
      navigate('/admin/login');
    }
  }, [challengeToken, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await verify2FA({
        code: code.trim(),
        challenge_token: challengeToken,
      });

      if (res && res.success) {
        sessionStorage.removeItem('ck_2fa_challenge_token');
        sessionStorage.removeItem('ck_2fa_username');
        const targetRedirect = sessionStorage.getItem('ck_2fa_redirect') || '/admin/profile#two-factor-security';
        sessionStorage.removeItem('ck_2fa_redirect');
        login(res.user, res.token);
        navigate(targetRedirect, { replace: true });
      } else {
        setError(res?.message || 'Verification failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid 6-digit authentication code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen-wrap" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050511', padding: '1.5rem' }}>
      <div className="login-box" style={{ width: '100%', maxWidth: '440px', background: 'rgba(14, 12, 34, 0.95)', border: '1px solid rgba(139, 32, 255, 0.3)', borderRadius: '20px', padding: '2.5rem', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
        <div className="login-logo-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🔐</div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>Two-Factor Authentication</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            Account: <strong>{username}</strong>
          </p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Enter the 6-digit verification code from your Google Authenticator or Microsoft Authenticator app (or enter an emergency backup code).
          </p>
        </div>

        {error && (
          <div className="flash-alert error" style={{ marginBottom: '1.5rem', padding: '0.85rem 1rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '8px', color: '#fca5a5', fontSize: '0.9rem' }}>
            <strong>⚠ Error:</strong> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <input
              type="text"
              className="form-control"
              required
              autoFocus
              maxLength="16"
              autoComplete="one-time-code"
              placeholder="123 456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{
                width: '100%',
                padding: '0.9rem',
                borderRadius: '10px',
                background: 'rgba(5, 5, 17, 0.8)',
                border: '1px solid rgba(139, 32, 255, 0.4)',
                color: '#fff',
                fontSize: '1.4rem',
                textAlign: 'center',
                letterSpacing: '0.2em',
                fontFamily: 'monospace',
                fontWeight: 700,
              }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '0.9rem', fontSize: '0.95rem', fontWeight: 700, borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Verifying Code...' : 'Verify Code & Enter Console ➔'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => navigate('/admin/login')}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.82rem', cursor: 'pointer', textDecoration: 'underline' }}
          >
            ← Back to Login Screen
          </button>
        </div>
      </div>
    </div>
  );
}

