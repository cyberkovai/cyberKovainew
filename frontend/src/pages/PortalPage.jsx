import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrack } from '../context/TrackContext';
import { getAssetUrl } from '../utils/assets';

export default function PortalPage() {
  const { activeTrack, switchTrack } = useTrack();
  const [activeCard, setActiveCard] = useState(activeTrack || 'forensics');
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add('portal-page');
    return () => {
      document.body.classList.remove('portal-page');
    };
  }, []);

  const handleSelectTrack = (track, targetUrl) => {
    switchTrack(track);
    navigate(targetUrl);
  };

  return (
    <main className="portal-page">
      <section className="split-hero-stage" id="home">
        <div className="split-ambient-glow" aria-hidden="true"></div>

        <div className="container split-hero-container">
          {/* CARD 1: DIGITAL INVESTIGATION & FORENSICS */}
          <article
            className={`split-card investigation-card ${activeCard === 'forensics' ? 'active' : ''}`}
            id="cardInvestigation"
            data-track="forensics"
            tabIndex="0"
            role="region"
            aria-label="Digital Investigation and Forensics Services"
            onMouseEnter={() => setActiveCard('forensics')}
            onClick={() => handleSelectTrack('forensics', '/cyber-intelligence?section=forensics')}
          >
            {/* Background Visual & Warm Monochrome Overlay */}
            <div className="split-card-bg">
              <img
                src={getAssetUrl('assets/images/homeleft.png')}
                alt="Investigation Intelligence and Digital Forensics"
                className="split-card-art"
                loading="eager"
              />
              <div className="split-card-overlay split-card-overlay-warm"></div>
            </div>

            {/* Collapsed Vertical Title & Outline 01 */}
            <div className="split-card-collapsed" aria-hidden="true">
              <div className="collapsed-track-title">Forensic Intelligence</div>
              <div className="collapsed-number">01</div>
            </div>

            {/* Expanded Content */}
            <div className="split-card-content">
              <div className="split-card-tag split-card-tag-warm">
                <span className="tag-dash"></span>
                <span className="tag-text">FORENSIC INTELLIGENCE</span>
              </div>

              <h2 className="split-card-title">
                <span className="split-card-title-line">Cybercrime Investigations</span>
                <br />
                &amp; Digital Forensics
              </h2>

              <p className="split-card-desc">
                Uncover digital evidence, investigate cybercrime, and trace malicious activity with expert forensic analysis, OSINT investigations, cyber fraud detection, and digital evidence recovery.
              </p>

              <div className="split-card-action">
                <button
                  type="button"
                  className="split-cta-circle split-cta-circle-warm"
                  id="investigationCtaBtn"
                  aria-label="Explore Investigation Services"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectTrack('forensics', '/cyber-intelligence?section=forensics');
                  }}
                >
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="7" y1="17" x2="17" y2="7"></line>
                    <polyline points="7 7 17 7 17 17"></polyline>
                  </svg>
                </button>
                <button
                  type="button"
                  className="split-cta-label split-cta-label-warm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectTrack('forensics', '/cyber-intelligence?section=forensics');
                  }}
                >
                  Explore Investigation Services <span>➔</span>
                </button>
              </div>
            </div>
          </article>

          {/* CARD 2: OFFENSIVE SECURITY & CYBER ASSURANCE */}
          <article
            className={`split-card cyber-card ${activeCard === 'cyber' ? 'active' : ''}`}
            id="cardCyber"
            data-track="cyber"
            tabIndex="0"
            role="region"
            aria-label="Cyber Intelligence Services"
            onMouseEnter={() => setActiveCard('cyber')}
            onClick={() => handleSelectTrack('cyber', '/digital-forensics?section=cyber')}
          >
            {/* Background Visual & Overlay */}
            <div className="split-card-bg">
              <img
                src={getAssetUrl('assets/images/rightside.png')}
                alt="Cyber Intelligence and Defense Artwork"
                className="split-card-art"
                loading="eager"
              />
              <div className="split-card-overlay"></div>
            </div>

            {/* Collapsed Vertical Title & Outline 02 */}
            <div className="split-card-collapsed" aria-hidden="true">
              <div className="collapsed-track-title">Offensive Security</div>
              <div className="collapsed-number">02</div>
            </div>

            {/* Expanded Content */}
            <div className="split-card-content">
              <div className="split-card-tag">
                <span className="tag-dash"></span>
                <span className="tag-text">OFFENSIVE SECURITY</span>
              </div>

              <h2 className="split-card-title">
                <span className="split-card-title-line">Offensive Security</span>
                <br />
                &amp; Cyber Assurance
              </h2>

              <p className="split-card-desc">
                Proactive penetration testing, vulnerability assessments, threat detection, and security validation to identify weaknesses, strengthen your defenses, and protect critical digital assets.
              </p>

              <div className="split-card-action">
                <button
                  type="button"
                  className="split-cta-circle"
                  id="cyberCtaBtn"
                  aria-label="Explore Cyber Intelligence"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectTrack('cyber', '/digital-forensics?section=cyber');
                  }}
                >
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="7" y1="17" x2="17" y2="7"></line>
                    <polyline points="7 7 17 7 17 17"></polyline>
                  </svg>
                </button>
                <button
                  type="button"
                  className="split-cta-label"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectTrack('cyber', '/digital-forensics?section=cyber');
                  }}
                >
                  Explore Cyber Intelligence <span>➔</span>
                </button>
              </div>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}

