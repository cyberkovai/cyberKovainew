import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LiveChatWidget from '../components/LiveChatWidget';
import { getSettings, getLegalPolicies } from '../api/client';
import { useTrack } from '../context/TrackContext';

export default function LegalPage({ defaultKey = 'privacy' }) {
  const location = useLocation();
  const { activeTrack } = useTrack();
  const [settings, setSettings] = useState({});
  const [policies, setPolicies] = useState({});
  const [currentKey, setCurrentKey] = useState(defaultKey);

  // Determine key from URL path
  useEffect(() => {
    if (location.pathname.includes('privacy-policy')) setCurrentKey('privacy');
    else if (location.pathname.includes('terms-conditions')) setCurrentKey('terms');
    else if (location.pathname.includes('security-disclosure')) setCurrentKey('disclosure');
    else {
      const params = new URLSearchParams(location.search);
      const pol = params.get('policy');
      if (pol && ['privacy', 'terms', 'disclosure'].includes(pol)) {
        setCurrentKey(pol);
      }
    }
  }, [location]);

  useEffect(() => {
    getSettings().then(setSettings).catch(() => {});
    getLegalPolicies().then(setPolicies).catch(() => {});
  }, []);

  const policy = policies[currentKey] || {
    title: 'Legal Policy',
    badge: 'COMPLIANCE & LEGAL',
    last_updated: 'November 2026',
    lead_summary: 'Cyber Kovai is committed to safeguarding client privacy and enterprise security.',
    content: '<p>Loading legal document...</p>',
  };

  const policyMeta = [
    { key: 'privacy', path: '/privacy-policy', icon: '🔒', name: 'Privacy Policy' },
    { key: 'terms', path: '/terms-conditions', icon: '⚖️', name: 'Terms & Conditions' },
    { key: 'disclosure', path: '/security-disclosure', icon: '🛡️', name: 'Security Disclosure' },
  ];

  const homeUrl = activeTrack === 'cyber' ? '/digital-forensics?section=cyber' : '/cyber-intelligence?section=forensics';

  return (
    <>
      <Header settings={settings} />

      <main className="legal-policy-page">
        {/* ================= PAGE HERO / BREADCRUMB ================= */}
        <section
          className="about-hero-header legal-hero-header"
          style={{
            position: 'relative',
            padding: '7rem 0 3.5rem',
            background: 'radial-gradient(circle at 50% 0%, rgba(139, 32, 255, 0.15) 0%, transparent 65%), #050511',
          }}
        >
          <div className="container">
            <div
              className="breadcrumb"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                marginBottom: '1.25rem',
              }}
            >
              <Link to={homeUrl} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Home</Link>
              <span className="sep" style={{ opacity: 0.4 }}>/</span>
              <span style={{ opacity: 0.7 }}>Legal &amp; Compliance</span>
              <span className="sep" style={{ opacity: 0.4 }}>/</span>
              <span className="current" style={{ color: '#00f0ff', fontWeight: 600 }}>{policy.title}</span>
            </div>

            <div style={{ display: 'inline-block', marginBottom: '0.75rem' }}>
              <span
                className="section-tag"
                style={{ background: 'rgba(0, 240, 255, 0.08)', borderColor: 'rgba(0, 240, 255, 0.3)', color: '#00f0ff' }}
              >
                {policy.badge || 'COMPLIANCE & LEGAL'}
              </span>
            </div>

            <h1
              className="page-title"
              style={{ fontSize: 'clamp(2.2rem, 4.5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.15, margin: '0 0 1rem', color: '#fff' }}
            >
              {policy.title}
            </h1>

            <p
              className="coverage-subtitle"
              style={{ maxWidth: '820px', fontSize: '1.05rem', lineHeight: 1.6, color: 'var(--text-secondary)', margin: '0 0 1.5rem' }}
            >
              {policy.lead_summary}
            </p>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.4rem 0.95rem',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '50px',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
              }}
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399' }}></span>
              <span>Effective Revision: <strong>{policy.last_updated || 'November 2026'}</strong></span>
            </div>
          </div>
        </section>

        {/* ================= POLICY CONTENT SECTION ================= */}
        <section className="section" style={{ padding: '3.5rem 0 5rem' }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 280px) 1fr', gap: '2.5rem', alignItems: 'start' }}>
              {/* Sticky Sidebar Policy Switcher */}
              <aside style={{ position: 'sticky', top: '100px' }}>
                <div
                  style={{
                    background: 'rgba(14, 12, 32, 0.85)',
                    border: '1px solid rgba(139, 32, 255, 0.22)',
                    borderRadius: '16px',
                    padding: '1.4rem',
                    backdropFilter: 'blur(14px)',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--purple-light, #b84dff)',
                      marginBottom: '1rem',
                      paddingBottom: '0.5rem',
                      borderBottom: '1px solid rgba(139, 32, 255, 0.15)',
                    }}
                  >
                    Legal Documents
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    {policyMeta.map((m) => {
                      const isActive = (currentKey === m.key);
                      return (
                        <Link
                          key={m.key}
                          to={m.path}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.65rem',
                            padding: '0.7rem 0.95rem',
                            borderRadius: '10px',
                            fontSize: '0.88rem',
                            fontWeight: isActive ? '700' : '500',
                            color: isActive ? '#fff' : 'var(--text-secondary)',
                            background: isActive
                              ? 'linear-gradient(135deg, rgba(139, 32, 255, 0.35), rgba(75, 14, 170, 0.35))'
                              : 'transparent',
                            border: `1px solid ${isActive ? 'rgba(168, 85, 247, 0.45)' : 'transparent'}`,
                            textDecoration: 'none',
                            transition: 'all 0.25s ease',
                          }}
                        >
                          <span style={{ fontSize: '1rem' }}>{m.icon}</span>
                          <span>{m.name}</span>
                        </Link>
                      );
                    })}
                  </div>

                  {/* Legal Inquiries Help Card */}
                  <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(139, 32, 255, 0.15)' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', marginBottom: '0.35rem' }}>
                      Compliance &amp; Legal Support
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.85rem' }}>
                      For subpoena requests, regulatory inquiries, or evidence chain verification, contact our Legal Office:
                    </p>
                    <a
                      href={`mailto:${settings.site_email || 'info@cyberkovai.com'}`}
                      style={{ fontSize: '0.78rem', color: '#00f0ff', fontWeight: 600, textDecoration: 'none' }}
                    >
                      legal@cyberkovai.com ➔
                    </a>
                  </div>
                </div>
              </aside>

              {/* Main Document Content Area */}
              <div
                style={{
                  background: 'rgba(14, 12, 34, 0.75)',
                  border: '1px solid rgba(139, 32, 255, 0.18)',
                  borderRadius: '20px',
                  padding: '3rem',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 12px 36px rgba(0, 0, 0, 0.35)',
                }}
              >
                <div
                  className="legal-doc-content"
                  dangerouslySetInnerHTML={{ __html: policy.content }}
                  style={{
                    color: 'var(--text-secondary)',
                    lineHeight: 1.8,
                    fontSize: '1rem',
                  }}
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer settings={settings} />
      <LiveChatWidget settings={settings} />
    </>
  );
}

