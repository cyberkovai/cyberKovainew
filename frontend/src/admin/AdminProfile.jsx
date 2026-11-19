import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { updateProfile, setup2FA, confirm2FA, disable2FA, cancel2FA } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function AdminProfile() {
  const { user, twoFactor, setTwoFactor, checkAuth } = useAuth();
  const location = useLocation();
  const [highlight2FA, setHighlight2FA] = useState(false);

  // Always refresh auth and 2FA status on mount to ensure fresh status
  useEffect(() => {
    checkAuth();
  }, []);

  // Profile Form State
  const [profileData, setFormData] = useState({
    username: '',
    email: '',
    new_password: '',
    confirm_password: '',
    current_password: '',
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

  // 2FA Flow State
  const [enablePw, setEnablePw] = useState('');
  const [initiating2FA, setInitiating2FA] = useState(false);
  const [setupStep, setSetupStep] = useState(false);
  const [setupData, setSetupData] = useState(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [twoFactorMsg, setTwoFactorMsg] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Disable 2FA Form State
  const [disablePw, setDisablePw] = useState('');
  const [disableOtp, setDisableOtp] = useState('');
  const [confirmDisable, setConfirmDisable] = useState(false);
  const [disabling, setDisabling] = useState(false);

  // Populate data when user object changes
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        username: user.username || 'Kovaicyber@gmail.com',
        email: user.email || 'Kovaicyber@gmail.com',
      }));
    }
  }, [user]);

  // Smooth scroll and pulse highlight when navigating to #two-factor-security
  useEffect(() => {
    const handleHashScroll = () => {
      const hash = location.hash || window.location.hash;
      if (hash === '#two-factor-security') {
        const el = document.getElementById('two-factor-security');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setHighlight2FA(true);
          const t = setTimeout(() => setHighlight2FA(false), 2500);
          return () => clearTimeout(t);
        }
      }
    };

    handleHashScroll();
    const timer = setTimeout(handleHashScroll, 250);
    return () => clearTimeout(timer);
  }, [location.hash]);

  // Handle Profile Update Submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);

    if (profileData.new_password) {
      if (profileData.new_password.length < 8) {
        setProfileMsg({ type: 'error', text: 'New password must be at least 8 characters long.' });
        setSavingProfile(false);
        return;
      }
      if (profileData.new_password !== profileData.confirm_password) {
        setProfileMsg({ type: 'error', text: 'New password and confirmation do not match.' });
        setSavingProfile(false);
        return;
      }
    }

    if (!profileData.current_password) {
      setProfileMsg({ type: 'error', text: 'Current password is required to authorize changes.' });
      setSavingProfile(false);
      return;
    }

    try {
      const res = await updateProfile({
        username: profileData.username,
        email: profileData.email,
        current_password: profileData.current_password,
        new_password: profileData.new_password || undefined,
        confirm_password: profileData.confirm_password || undefined,
      });

      setProfileMsg({ type: 'success', text: res.message || 'Admin profile and credentials successfully updated!' });
      setFormData(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: '',
      }));
      await checkAuth();
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message || err.message || 'Failed to update admin profile.' });
    } finally {
      setSavingProfile(false);
    }
  };

  // Reset form handler
  const handleResetForm = () => {
    setFormData({
      username: user?.username || 'Kovaicyber@gmail.com',
      email: user?.email || 'Kovaicyber@gmail.com',
      new_password: '',
      confirm_password: '',
      current_password: '',
    });
    setProfileMsg(null);
  };

  // Initiate 2FA Setup
  const handleInitiate2FA = async (e) => {
    e.preventDefault();
    setInitiating2FA(true);
    setTwoFactorMsg(null);

    try {
      const data = await setup2FA({ password: enablePw });
      if (data && (data.qr_code || data.secret)) {
        setSetupData(data);
        setSetupStep(true);
        setEnablePw('');
        setTwoFactorMsg({ type: 'info', text: 'Two-factor setup initiated. Scan the QR code with your authenticator app and confirm with a six-digit code.' });
      } else {
        setTwoFactorMsg({ type: 'error', text: data?.message || 'Could not initiate 2FA setup.' });
      }
    } catch (err) {
      setTwoFactorMsg({ type: 'error', text: err.response?.data?.message || err.message || 'Authentication failed. Please verify your current password.' });
    } finally {
      setInitiating2FA(false);
    }
  };

  // Confirm 2FA with 6-digit Code
  const handleConfirm2FA = async (e) => {
    e.preventDefault();
    setVerifying(true);
    setTwoFactorMsg(null);

    const clean = verifyCode.replace(/[\s-]+/g, '').trim();
    if (!clean) {
      setTwoFactorMsg({ type: 'error', text: 'Please enter the 6-digit verification code.' });
      setVerifying(false);
      return;
    }

    try {
      const res = await confirm2FA(clean);
      if (res && res.success) {
        setSetupStep(false);
        setSetupData(null);
        setVerifyCode('');
        setTwoFactorMsg({ type: 'success', text: 'Two-Factor Authentication has been successfully enabled and enforced!' });
        if (res.two_factor) {
          setTwoFactor(res.two_factor);
        } else {
          setTwoFactor({ enabled: true });
        }
        await checkAuth();
      } else {
        setTwoFactorMsg({ type: 'error', text: res?.message || 'Verification failed. Invalid code.' });
      }
    } catch (err) {
      setTwoFactorMsg({ type: 'error', text: err.response?.data?.message || 'Invalid 6-digit code. Please check your authenticator app.' });
    } finally {
      setVerifying(false);
    }
  };

  // Cancel 2FA Setup in Progress
  const handleCancelSetup = async () => {
    try {
      await cancel2FA();
    } catch (e) { }
    setSetupStep(false);
    setSetupData(null);
    setVerifyCode('');
    setTwoFactorMsg({ type: 'info', text: 'Pending two-factor setup was cancelled. 2FA remains disabled.' });
  };

  // Disable 2FA
  const handleDisable2FA = async (e) => {
    e.preventDefault();
    if (!confirmDisable) {
      setTwoFactorMsg({ type: 'error', text: 'Please check the confirmation box to proceed with disabling 2FA.' });
      return;
    }

    setDisabling(true);
    setTwoFactorMsg(null);

    const cleanOtp = disableOtp.replace(/[\s-]+/g, '').trim();

    try {
      const res = await disable2FA({ password: disablePw, code: cleanOtp });
      if (res && res.success) {
        setTwoFactorMsg({ type: 'success', text: 'Two-Factor Authentication has been safely disabled for your account.' });
        setDisablePw('');
        setDisableOtp('');
        setConfirmDisable(false);
        setTwoFactor({ enabled: false, pending_setup: false });
        await checkAuth();
      } else {
        setTwoFactorMsg({ type: 'error', text: res?.message || 'Could not disable Two-Factor Authentication.' });
      }
    } catch (err) {
      setTwoFactorMsg({ type: 'error', text: err.response?.data?.message || err.message || 'Failed to disable 2FA. Verify your password and 6-digit code.' });
    } finally {
      setDisabling(false);
    }
  };

  // Format secret string for manual entry
  const formatSecret = (secret) => {
    if (!secret) return '';
    return secret.match(/.{1,4}/g)?.join(' ') || secret;
  };

  // Copy manual key
  const handleCopyKey = () => {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <AdminLayout pageTitle="Admin Profile & Security">
      {/* Page Header matching Image 2 */}
      <div className="page-header-row">
        <div>
          <h1 className="page-header-title">Admin Profile &amp; Security Settings</h1>
          <p className="page-header-desc">
            Manage Two-Factor Authentication (2FA), administrative username, notification email, and SOC password.
          </p>
        </div>
      </div>

      {/* Global Alerts if applicable */}
      {profileMsg && (
        <div
          className={`ck-persistent-notice ${profileMsg.type === 'success' ? 'success' : 'error'}`}
          style={{
            maxWidth: '820px',
            background: profileMsg.type === 'success' ? 'rgba(0, 230, 118, 0.12)' : 'rgba(255, 51, 102, 0.12)',
            border: `1px solid ${profileMsg.type === 'success' ? 'rgba(0, 230, 118, 0.35)' : 'rgba(255, 51, 102, 0.35)'}`,
            color: profileMsg.type === 'success' ? '#a7f3d0' : '#ff99b3',
            marginBottom: '1.5rem',
          }}
        >
          <span>
            <strong>{profileMsg.type === 'success' ? '✓ ' : '⚠ '}</strong>
            {profileMsg.text}
          </span>
        </div>
      )}

      {/* ================= 1. TWO-FACTOR AUTHENTICATION CARD ================= */}
      <div className={`admin-card ${highlight2FA ? 'highlight-target' : ''}`} id="two-factor-security" style={{ maxWidth: '820px', marginBottom: '2rem' }}>
        <div className="admin-card-header">
          <div>
            <h3 className="admin-card-title">Two-Factor Authentication (Authenticator App)</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Require a six-digit TOTP code from Google Authenticator or Microsoft Authenticator on every admin login.
            </p>
          </div>
          {twoFactor?.enabled ? (
            <span className="status-pill active">ENABLED</span>
          ) : setupStep ? (
            <span
              className="status-pill inactive"
              style={{
                background: 'rgba(255, 171, 0, 0.15)',
                color: '#ffab00',
                borderColor: 'rgba(255, 171, 0, 0.35)',
              }}
            >
              PENDING CONFIRMATION
            </span>
          ) : (
            <span className="status-pill inactive">DISABLED</span>
          )}
        </div>

        <div className="admin-card-body">
          {twoFactorMsg && (
            <div
              className={`ck-persistent-notice ${twoFactorMsg.type === 'success' ? 'success' : twoFactorMsg.type === 'info' ? 'warning' : 'error'}`}
              style={{
                background:
                  twoFactorMsg.type === 'success'
                    ? 'rgba(0, 230, 118, 0.12)'
                    : twoFactorMsg.type === 'info'
                      ? 'rgba(255, 171, 0, 0.12)'
                      : 'rgba(255, 51, 102, 0.12)',
                border: `1px solid ${twoFactorMsg.type === 'success'
                    ? 'rgba(0, 230, 118, 0.35)'
                    : twoFactorMsg.type === 'info'
                      ? 'rgba(255, 171, 0, 0.35)'
                      : 'rgba(255, 51, 102, 0.35)'
                  }`,
                color:
                  twoFactorMsg.type === 'success'
                    ? '#a7f3d0'
                    : twoFactorMsg.type === 'info'
                      ? '#ffe082'
                      : '#ff99b3',
                marginBottom: '1.25rem',
              }}
            >
              <span>
                <strong>{twoFactorMsg.type === 'success' ? '✓ ' : '⚠ '}</strong>
                {twoFactorMsg.text}
              </span>
            </div>
          )}

          {/* STATE A: 2FA IS ENABLED */}
          {twoFactor?.enabled ? (
            <div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '1.25rem',
                  padding: '1rem 1.25rem',
                  background: 'rgba(0, 230, 118, 0.06)',
                  border: '1px solid rgba(0, 230, 118, 0.25)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '1.5rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Status
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-green)' }}>
                    Active &amp; Enforced on Admin Login
                  </div>
                </div>
                {twoFactor.confirmed_at && (
                  <div>
                    <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                      Enabled Since
                    </div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                      {twoFactor.confirmed_at}
                    </div>
                  </div>
                )}
              </div>

              <div className="tfa-action-panel danger">
                <h4 style={{ fontSize: '0.98rem', color: '#ff7a99', marginBottom: '0.4rem' }}>
                  Disable Two-Factor Authentication
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Removing 2FA lowers account protection to password-only authentication. Confirm with both your current password and a valid 6-digit authenticator code.
                </p>

                <form onSubmit={handleDisable2FA}>
                  <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">
                        Current Password <span style={{ color: '#ff3366' }}>*</span>
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        required
                        placeholder="Enter current password"
                        value={disablePw}
                        onChange={(e) => setDisablePw(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Current 6-Digit Authenticator Code <span style={{ color: '#ff3366' }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        maxLength={12}
                        placeholder="000 000"
                        value={disableOtp}
                        onChange={(e) => setDisableOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        style={{ letterSpacing: '0.2em', textAlign: 'center' }}
                      />
                    </div>
                  </div>

                  <label className="tfa-checkbox-row">
                    <input
                      type="checkbox"
                      required
                      checked={confirmDisable}
                      onChange={(e) => setConfirmDisable(e.target.checked)}
                    />
                    <span>Confirm disabling Two-Factor Authentication on this administrator account.</span>
                  </label>

                  <button type="submit" className="btn btn-danger" disabled={disabling}>
                    {disabling ? 'Disabling...' : 'Disable 2FA'}
                  </button>
                </form>
              </div>
            </div>
          ) : setupStep && setupData ? (
            /* STATE B: SETUP IN PROGRESS */
            <div>
              <div className="ck-persistent-notice warning">
                <span>
                  <strong>Setup In Progress:</strong> Two-factor authentication is <strong>not active yet</strong>. Scan the QR code with your authenticator app and verify a six-digit code below to activate it.
                </span>
              </div>

              <div className="tfa-setup-grid">
                <div>
                  <div className="tfa-qr-frame">
                    <img src={setupData.qr_code} alt="Authenticator QR Code" />
                  </div>
                  <span
                    className="form-help"
                    style={{ textAlign: 'center', marginTop: '0.5rem', display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)' }}
                  >
                    Scan with Google or Microsoft Authenticator
                  </span>
                </div>

                <div>
                  <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    1. Scan QR Code or Enter Setup Key
                  </h4>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Open Google Authenticator, Microsoft Authenticator, or another standard TOTP authenticator app, choose <strong>Add Account</strong> &rarr; <strong>Scan QR Code</strong>, or enter this manual setup key:
                  </p>

                  <div className="tfa-manual-key-box">
                    <code>{formatSecret(setupData.secret)}</code>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleCopyKey}
                    >
                      {copiedKey ? '✓ Copied' : 'Copy Key'}
                    </button>
                  </div>

                  {Array.isArray(setupData.backup_codes) && setupData.backup_codes.length > 0 && (
                    <div
                      style={{
                        margin: '1rem 0',
                        padding: '0.85rem',
                        background: 'rgba(255, 171, 0, 0.08)',
                        border: '1px solid rgba(255, 171, 0, 0.25)',
                        borderRadius: '8px',
                      }}
                    >
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffe082', marginBottom: '0.4rem' }}>
                        SAVE YOUR EMERGENCY RECOVERY CODES:
                      </div>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(4, 1fr)',
                          gap: '0.4rem',
                          fontFamily: 'monospace',
                          fontSize: '0.82rem',
                          color: '#fff',
                        }}
                      >
                        {setupData.backup_codes.map((code, i) => (
                          <span key={i}>{code}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: '1.25rem 0 0.5rem' }}>
                    2. Confirm Setup with a Six-Digit Code
                  </h4>

                  <form onSubmit={handleConfirm2FA}>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Authenticator 6-Digit Code <span style={{ color: '#ff3366' }}>*</span></span>
                        {setupData?.test_token && (
                          <button
                            type="button"
                            onClick={() => setVerifyCode(setupData.test_token)}
                            style={{
                              background: 'rgba(168, 85, 247, 0.15)',
                              border: '1px solid rgba(168, 85, 247, 0.4)',
                              color: '#c4b5fd',
                              fontSize: '0.74rem',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                          >
                            ⚡ Auto-Fill Code ({setupData.test_token})
                          </button>
                        )}
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        maxLength={12}
                        placeholder="000 000"
                        value={verifyCode}
                        onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        style={{
                          maxWidth: '220px',
                          textAlign: 'center',
                          fontSize: '1.25rem',
                          letterSpacing: '0.3em',
                          fontWeight: 700,
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <button type="submit" className="btn btn-primary" disabled={verifying}>
                        {verifying ? 'Verifying...' : 'Verify & Enable 2FA'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={handleCancelSetup}
                      >
                        Cancel Setup
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            /* STATE C: DISABLED (EXACT UI OF IMAGE 2) */
            <div className="tfa-action-panel">
              <h4 style={{ fontSize: '0.98rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                Enable Two-Factor Authentication
              </h4>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Protect your administrator account using Google Authenticator or Microsoft Authenticator. Re-enter your current password to generate a unique setup QR code.
              </p>

              <form onSubmit={handleInitiate2FA}>
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">
                    Current Password <span style={{ color: '#ff3366' }}>*</span>
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    required
                    placeholder="Enter your current password"
                    style={{ maxWidth: '360px' }}
                    value={enablePw}
                    onChange={(e) => setEnablePw(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={initiating2FA}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <span>🔐</span>
                  <span>{initiating2FA ? 'Verifying...' : 'Enable Two-Factor Authentication'}</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* ================= 2. SECURITY CREDENTIALS CARD ================= */}
      <div className="admin-card" style={{ maxWidth: '820px', marginBottom: '2.5rem' }}>
        <div className="admin-card-header">
          <h3 className="admin-card-title">Security Credentials</h3>
          <span className="status-pill active" style={{ textTransform: 'uppercase' }}>
            {user?.role ? user.role.toUpperCase() : 'SUPERADMIN'}
          </span>
        </div>

        <div className="admin-card-body">
          <form onSubmit={handleProfileSubmit}>
            {/* Admin Username */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">
                Admin Username <span style={{ color: '#ff3366' }}>*</span>
              </label>
              <input
                type="text"
                className="form-control"
                required
                value={profileData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              />
            </div>

            {/* Admin Notification Email */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Admin Notification Email</label>
              <input
                type="email"
                className="form-control"
                value={profileData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
              <span
                className="form-help"
                style={{ display: 'block', marginTop: '0.35rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}
              >
                Used for system alerts, authenticator label, and critical SOC security notifications.
              </span>
            </div>

            {/* Update Password (Optional) Section */}
            <div style={{ margin: '1.5rem 0', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--accent-purple-light)', marginBottom: '0.35rem' }}>
                Update Password (Optional)
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Leave new password fields blank if you only wish to change your username or email.
              </p>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Minimum 8 characters"
                  value={profileData.new_password}
                  onChange={(e) => setFormData(prev => ({ ...prev, new_password: e.target.value }))}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Re-enter new password"
                  value={profileData.confirm_password}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirm_password: e.target.value }))}
                />
              </div>
            </div>

            {/* Current Password Authorization Section */}
            <div style={{ margin: '1.5rem 0', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
              <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                <label className="form-label">
                  Current Password (Required to Authorize Changes) <span style={{ color: '#ff3366' }}>*</span>
                </label>
                <input
                  type="password"
                  className="form-control"
                  required
                  placeholder="Enter current password"
                  value={profileData.current_password}
                  onChange={(e) => setFormData(prev => ({ ...prev, current_password: e.target.value }))}
                />
                <span
                  className="form-help"
                  style={{ display: 'block', marginTop: '0.35rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}
                >
                  Enter your current password to confirm authorization.
                </span>
              </div>
            </div>

            {/* Form Actions Footer */}
            <div
              style={{
                paddingTop: '1.25rem',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleResetForm}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={savingProfile}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <span>💾</span>
                <span>{savingProfile ? 'Updating Profile...' : 'Update Admin Profile'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
