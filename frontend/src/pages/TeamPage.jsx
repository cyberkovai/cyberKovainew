import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LiveChatWidget from '../components/LiveChatWidget';
import { getSettings, getTeam } from '../api/client';
import { useTrack } from '../context/TrackContext';
import { getAssetUrl } from '../utils/assets';

const DEFAULT_PHOTO = 'assets/images/arun_s.png';

const resolvePhotoUrl = (photo) => {
  return getAssetUrl(photo || DEFAULT_PHOTO);
};

const toList = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
};

const DEFAULT_TEAM = [
  {
    id: 'team-1',
    name: 'Arun S',
    role: 'Principal Security Architect',
    company: 'IBM INDIA',
    experience: '12+',
    badge: 'Verified Security Leader',
    photo: 'assets/images/arun_s.png',
    specializations: [
      'Product Security Expert',
      'Security Architect',
      'Cyber Strategist',
      'Cyber Crime Investigator',
      'National Security Scholar'
    ],
    bio: 'Principal Security Architect at IBM India with 12+ years across cybersecurity leadership, application security, cloud security and cyber forensics.',
    domains: [
      {
        icon: 'shield',
        title: 'Application & Product Security',
        desc: 'VAPT, Threat Modeling, DevSecOps'
      },
      {
        icon: 'cloud',
        title: 'Cloud Security & Architecture',
        desc: 'Zero Trust, Hybrid Cloud Resiliency'
      },
      {
        icon: 'search',
        title: 'Cyber Crime & Forensics',
        desc: 'Digital Evidence, Threat Intelligence'
      },
      {
        icon: 'building',
        title: 'National Security & Strategy',
        desc: 'Defense-Grade Risk Frameworks'
      }
    ],
    status: 'active',
    order: 1
  }
];

const renderDomainIcon = (dom) => {
  const title = dom.title || '';
  if (/Application|Product/i.test(title)) {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="domain-svg">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    );
  }
  if (/Cloud/i.test(title)) {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e0e7ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="domain-svg">
        <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
      </svg>
    );
  }
  if (/Crime|Forensics/i.test(title)) {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="domain-svg">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
        <circle cx="11" cy="11" r="3" fill="#38bdf8" fillOpacity="0.3" />
      </svg>
    );
  }
  if (/National|Strategy/i.test(title)) {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e0e7ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="domain-svg">
        <line x1="2" y1="20" x2="22" y2="20" />
        <line x1="12" y1="2" x2="20" y2="7" />
        <line x1="12" y1="2" x2="4" y2="7" />
        <line x1="4" y1="7" x2="20" y2="7" />
        <line x1="6" y1="10" x2="6" y2="17" />
        <line x1="10" y1="10" x2="10" y2="17" />
        <line x1="14" y1="10" x2="14" y2="17" />
        <line x1="18" y1="10" x2="18" y2="17" />
      </svg>
    );
  }
  return <span className="domain-emoji">{dom.icon || '🛡️'}</span>;
};

export default function TeamPage() {
  const [settings, setSettings] = useState(null);
  const [teamMembers, setTeamMembers] = useState(DEFAULT_TEAM);
  const { activeTrack } = useTrack();

  useEffect(() => {
    getSettings().then(setSettings).catch(() => setSettings({}));
    getTeam()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setTeamMembers(data);
        }
      })
      .catch(() => { });
  }, []);

  const homeUrl = activeTrack === 'cyber' ? '/cyber-security?section=cyber' : '/cyber-intelligence?section=forensics';
  const aboutUrl = `/about?section=${activeTrack}`;
  const contactUrl = `/contact?section=${activeTrack}`;

  // Only published profiles, ordered the same way as the PHP team page.
  const rawList = teamMembers && teamMembers.length > 0 ? teamMembers : DEFAULT_TEAM;
  const visibleMembers = [...rawList]
    .filter((member) => member.status !== 'inactive')
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

  // Mirror the PHP page: if the "Our Team" section is disabled, redirect to About.
  if (settings && (settings.show_team === false || settings.show_team === 0 || settings.show_team === '0')) {
    return <Navigate to={aboutUrl} replace />;
  }

  return (
    <>
      <Header settings={settings || {}} />

      <main className="about-page team-page-view">
        {/* ================= HERO / BREADCRUMB ================= */}
        <section className="about-hero-header">
          <div className="container">
            <div className="breadcrumb">
              <Link to={homeUrl}>Home</Link> <span className="sep">/</span> <Link to={aboutUrl}>About</Link> <span className="sep">/</span> <span className="current">Our Team</span>
            </div>
            <h1 className="page-title">
              Leadership &amp; <span className="gradient-text">Security Architects</span>
            </h1>
            <p className="section-subtitle" style={{ maxWidth: '720px', margin: '1rem auto 0', opacity: 0.85 }}>
              Led by elite cybersecurity practitioners, principal enterprise architects, and seasoned cyber crime investigators.
            </p>
          </div>
        </section>

        {/* ================= TEAM SHOWCASE SECTION ================= */}
        <section className="section team-section" id="team">
          <div className="container">
            <div className="team-showcase-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
              {visibleMembers.length > 0 ? (
                visibleMembers.map((member) => {
                  const specializations = toList(member.specializations);
                  const domains = Array.isArray(member.domains) ? member.domains.filter(Boolean) : [];

                  return (
                    <div key={member.id} className="team-leader-card">
                      <div className="leader-visual-wrap">
                        <div className="leader-img-frame">
                          <img
                            src={resolvePhotoUrl(member.photo)}
                            alt={`${member.name} - ${member.role}`}
                            className="leader-photo"
                          />
                          {member.experience && (
                            <div className="leader-exp-badge">
                              <strong>{member.experience}</strong>
                              <span>YEARS EXP</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="leader-info-wrap">
                        <div className="leader-header-bar">
                          <div>
                            <h3 className="leader-name">{member.name}</h3>
                            <div className="leader-primary-role">
                              {member.company && (
                                <span className="ibm-tag">{member.company}</span>
                              )}
                              <span className="role-text">{member.role}</span>
                            </div>
                          </div>
                          {member.badge && (
                            <div className="leader-badge-pill">
                              <span className="pulse-indicator"></span> {member.badge}
                            </div>
                          )}
                        </div>

                        {/* Specializations Pills */}
                        {specializations.length > 0 && (
                          <div className="leader-tags-cloud">
                            {specializations.map((spec, i) => (
                              <span key={`${spec}-${i}`} className="tag-pill">{spec}</span>
                            ))}
                          </div>
                        )}

                        {/* Executive Bio */}
                        {member.bio && (
                          <div className="leader-bio-quote">
                            <p style={{ whiteSpace: 'pre-line' }}>{member.bio}</p>
                          </div>
                        )}

                        {/* Domain Capabilities */}
                        {domains.length > 0 && (
                          <div className="leader-domains-grid">
                            {domains.map((dom, i) => (
                              <div key={`${dom.title || 'domain'}-${i}`} className="domain-badge-item">
                                <div className="domain-icon">{renderDomainIcon(dom)}</div>
                                <div>
                                  <strong>{dom.title || ''}</strong>
                                  <span>{dom.desc || ''}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p style={{ textAlign: 'center', opacity: 0.7 }}>No team profiles published at this time.</p>
              )}
            </div>
          </div>
        </section>

        {/* ================= CALL TO ACTION ================= */}
        <section className="section about-cta-section">
          <div className="container">
            <div className="about-cta-banner">
              <div className="cta-inner-content">
                <h2>Consult With Our <span className="gradient-text">Lead Architects</span></h2>
                <p>Discuss your enterprise security posture, risk strategy, or investigative requirements in confidence.</p>
                <Link to={contactUrl} className="btn cta-purple-btn">
                  Schedule a Consultation <span className="arrow">➔</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer settings={settings || {}} />
      <LiveChatWidget settings={settings || {}} />
    </>
  );
}
