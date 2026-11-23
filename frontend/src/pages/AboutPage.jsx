import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LiveChatWidget from '../components/LiveChatWidget';
import { getSettings, getSections } from '../api/client';
import { useTrack } from '../context/TrackContext';
import { getAssetUrl } from '../utils/assets';
import { isSectionVisible } from '../utils/sections';

export default function AboutPage() {
  const [settings, setSettings] = useState({});
  const [sections, setSections] = useState({});
  const { activeTrack } = useTrack();

  useEffect(() => {
    getSettings().then(setSettings).catch(() => {});
    getSections().then(setSections).catch(() => {});
  }, []);

  const homeUrl = activeTrack === 'cyber' ? '/cyber-security?section=cyber' : '/cyber-intelligence?section=forensics';
  const contactUrl = `/contact?section=${activeTrack}`;

  return (
    <>
      <Header settings={settings} />

      <main className="about-page">
        {/* ================= HERO / BREADCRUMB ================= */}
        {isSectionVisible(sections, 'about_hero') && (
          <section className="about-hero-header">
            <div className="container">
              <div className="breadcrumb">
                <Link to={homeUrl}>Home</Link> <span className="sep">/</span> <span className="current">About</span>
              </div>
              <h1 className="page-title">
                Intelligence That Goes <span className="gradient-text">Beyond Data</span>
              </h1>
            </div>
          </section>
        )}

        {/* ================= SECTION 1: WHO WE ARE ================= */}
        {isSectionVisible(sections, 'about_who_we_are') && (
          <section className="section who-we-are-section">
            <div className="container">
              <div className="who-we-are-grid">
                <div className="who-we-are-content">
                  <div className="section-badge-tag">
                    <span className="dash">—</span> WHO WE ARE <span className="dash">—</span>
                  </div>
                  <h2>Why Organizations<br />Choose CyberKovai</h2>
                  <h3 className="purple-highlight-subtitle">Trusted Investigation &amp; Intelligence</h3>

                  <p>
                    CyberKovai is a professional investigation and intelligence agency delivering confidential, reliable and evidence-based investigation services for individuals, families, businesses and organizations.
                  </p>
                  <p>
                    Our experienced investigators combine traditional investigation methods with modern technology, digital intelligence and analytical techniques to uncover facts, verify information and provide actionable insights.
                  </p>
                  <p>
                    From personal investigations to corporate intelligence, we approach every assignment with confidentiality, professionalism and attention to detail.
                  </p>
                </div>

                <div className="who-we-are-visual">
                  <div className="visual-card-wrapper">
                    <img
                      src={getAssetUrl('assets/images/about_investigator_woman.jpg')}
                      alt="Why Organizations Choose CyberKovai"
                      className="investigator-visual-img"
                    />
                    <div className="glass-badge badge-top-right">
                      <strong>10+</strong> <span>YEARS OF EXPERIENCE</span>
                    </div>
                    <div className="glass-badge badge-bottom-left">
                      <strong>500+</strong> <span>INVESTIGATIONS COMPLETED</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 COUNTER CARDS ROW */}
              <div className="stats-cards-bar">
                <div className="stat-bar-card">
                  <div className="stat-icon">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                  </div>
                  <div className="stat-details">
                    <span className="stat-number">10+</span>
                    <span className="stat-text">YEARS OF EXPERIENCE</span>
                  </div>
                </div>

                <div className="stat-bar-card">
                  <div className="stat-icon">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div className="stat-details">
                    <span className="stat-number">99%</span>
                    <span className="stat-text">SUCCESSFUL CASE RESOLUTION</span>
                  </div>
                </div>

                <div className="stat-bar-card">
                  <div className="stat-icon">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <div className="stat-details">
                    <span className="stat-number">500+</span>
                    <span className="stat-text">INVESTIGATIONS COMPLETED</span>
                  </div>
                </div>

                <div className="stat-bar-card">
                  <div className="stat-icon">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="#eab308" stroke="#eab308" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </div>
                  <div className="stat-details">
                    <span className="stat-number">15+</span>
                    <span className="stat-text">INVESTIGATION SPECIALISTS</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ================= SECTION 2: PRINCIPLES THAT DEFINE OUR INVESTIGATIONS ================= */}
        {isSectionVisible(sections, 'about_principles') && (
          <section className="section principles-section" id="principles">
            <div className="principles-ambient-glow" aria-hidden="true"></div>
            <div className="container">
              <div className="principles-header">
                <div className="principles-tag">
                  <span>OUR APPROACH</span>
                  <span className="principles-tag-line" aria-hidden="true"></span>
                </div>
                <h2>
                  Principles That Define Our <span className="gradient-text">Investigations</span>
                </h2>
                <p>
                  Every investigation combines technical expertise, ethical practices, and evidence-led intelligence to deliver reliable, confidential, and actionable outcomes.
                </p>
              </div>

              <div className="principles-grid">
                {/* 01: Confidentiality */}
                <div className="principle-card">
                  <div className="principle-icon-box">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <h3>Confidentiality</h3>
                  <p>Protecting personal information and investigation details at every stage.</p>
                </div>

                {/* 02: Accuracy & Evidence */}
                <div className="principle-card">
                  <div className="principle-icon-box">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="6" />
                      <circle cx="12" cy="12" r="2" />
                    </svg>
                  </div>
                  <h3>Accuracy &amp; Evidence</h3>
                  <p>Verifying digital evidence and delivering reliable findings.</p>
                </div>

                {/* 03: Legal & Ethical Practice */}
                <div className="principle-card">
                  <div className="principle-icon-box">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3v18M3 7l9-4 9 4M3 7l4 10a5 5 0 0 0 10 0L21 7M3 7h18" />
                    </svg>
                  </div>
                  <h3>Legal &amp; Ethical Practice</h3>
                  <p>Following lawful procedures and respecting privacy and individual rights.</p>
                </div>

                {/* 04: Actionable Intelligence */}
                <div className="principle-card">
                  <div className="principle-icon-box">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                      <polyline points="17 6 23 6 23 12" />
                    </svg>
                  </div>
                  <h3>Actionable Intelligence</h3>
                  <p>Turning digital findings into clear, informed next steps.</p>
                </div>

                {/* 05: Intelligence-Led Methods */}
                <div className="principle-card">
                  <div className="principle-icon-box">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="2" x2="12" y2="22" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                  </div>
                  <h3>Intelligence-Led Methods</h3>
                  <p>Combining traditional investigative methods with modern digital techniques.</p>
                </div>

                {/* 06: Experienced Investigators */}
                <div className="principle-card">
                  <div className="principle-icon-box">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <h3>Experienced Investigators</h3>
                  <p>Applying practical experience across corporate, cyber, and background investigations.</p>
                </div>

                {/* 07: Technology-Enabled Analysis */}
                <div className="principle-card">
                  <div className="principle-icon-box">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                  </div>
                  <h3>Technology-Enabled Analysis</h3>
                  <p>Using modern forensic tools to examine devices, data, and digital activity.</p>
                </div>

                {/* 08: Clear, Professional Reporting */}
                <div className="principle-card">
                  <div className="principle-icon-box">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </div>
                  <h3>Clear, Professional Reporting</h3>
                  <p>Presenting documented findings in a structured, understandable report.</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ================= SECTION 3: CALL TO ACTION ================= */}
        {isSectionVisible(sections, 'about_cta') && (
          <section className="section about-cta-section">
            <div className="container">
              <div className="about-cta-banner">
                <div className="cta-inner-content">
                  <h2>
                    Work With a Team That Sees <span className="gradient-text">What Others Miss</span>
                  </h2>
                  <p>
                    Start with a confidential consultation. Tell us about your requirement and our investigation team will recommend the right approach for your case.
                  </p>
                  <Link to={contactUrl} className="btn cta-purple-btn">
                    Talk to an Expert <span className="arrow">➔</span>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer settings={settings} sections={sections} />
      <LiveChatWidget settings={settings} sections={sections} />
    </>
  );
}

