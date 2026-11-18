import React, { useState, useEffect, useRef } from 'react';

const DEFAULT_PILLARS = [
  {
    id: 'pillar-bgv',
    target_slug: 'corporate-background-verification-bgv',
    num: '01',
    badge: 'CORPORATE DUE DILIGENCE',
    title: 'Corporate Background Verification (BGV)',
    short: 'Corporate BGV',
    metric: '99.8% Credential Verification',
    metric_sub: 'Pre-Employment, Executive & Vendor Checks',
    status: 'DUE DILIGENCE READY',
    status_color: '#10b981',
    desc: 'Comprehensive corporate background verification (BGV), pre-employment screening, executive due diligence, criminal & court record checks, academic/employment validation, and vendor risk verification for enterprises.',
    capabilities: [
      'Employment & UAN Checks',
      'Education Authentication',
      'Criminal & Court Records',
      'MCA Directorship Screening',
    ],
    svg_icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    id: 'pillar-forensics',
    target_slug: 'cybercrime-victim-assistance-account-recovery',
    num: '02',
    badge: 'COURT ADMISSIBLE',
    title: 'Digital Forensics & Artifact Analysis',
    short: 'Digital Forensics',
    metric: '100% Cryptographic Verification',
    metric_sub: 'ISO/IEC 27037 Court Evidence Standard',
    status: 'CHAIN-OF-CUSTODY READY',
    status_color: '#8b20ff',
    desc: 'Court-admissible bit-stream imaging, volatile memory capture, deleted artifact carving, timestamp tampering detection, and root-cause breach tracing.',
    capabilities: [
      'Memory & Disk Imaging',
      'Deleted File Carving',
      'Cryptographic Hashing',
      'Court-Ready Expert Reports',
    ],
    svg_icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 0 0-7.07 17.07l.07.07" />
        <path d="M12 6a6 6 0 0 0-4.24 10.24" />
        <path d="M12 10a2 2 0 0 0-1.41 3.41" />
        <path d="M12 18v4" />
        <path d="M8 22h8" />
        <circle cx="12" cy="12" r="1" />
      </svg>
    ),
  },
  {
    id: 'pillar-osint',
    target_slug: 'digital-investigations-osint',
    num: '03',
    badge: 'DEEP INTELLIGENCE',
    title: 'Digital Investigations & OSINT',
    short: 'OSINT & Tracing',
    metric: '99.4% Attribution Confidence',
    metric_sub: 'Surface, Deep & Dark Web Profiling',
    status: 'RECONNAISSANCE ACTIVE',
    status_color: '#00f0ff',
    desc: 'Comprehensive digital investigations using Open-Source Intelligence (OSINT) techniques to uncover online footprints, verify identities, and assess potential risks. Our reports provide actionable insights for personal, legal, and business decision-making.',
    capabilities: [
      'Digital Footprint Tracing',
      'Multi-Source Intelligence',
      'Identity Verification',
      'Actionable Risk Reports',
    ],
    svg_icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
        <circle cx="11" cy="11" r="3" />
      </svg>
    ),
  },
  {
    id: 'pillar-social',
    target_slug: 'social-media-investigations-impersonation-removal',
    num: '04',
    badge: 'IDENTITY DEFENSE',
    title: 'Social Media Investigations & Impersonation Removal',
    short: 'Social Media Intel',
    metric: '99.1% Impersonation Removal Rate',
    metric_sub: 'Evidence Capture & Takedown Support',
    status: 'TAKEDOWN STREAM ACTIVE',
    status_color: '#10b981',
    desc: 'Identify and investigate fake profiles, impersonation attempts, account takeovers, and unauthorized content usage across major social media platforms. We help document evidence and support platform reporting and removal processes.',
    capabilities: [
      'Fake Profile & Botnet Tracing',
      'Harassment & Defamation Evidence',
      'Account Takeover Recovery',
      'Platform Legal Reporting Support',
    ],
    svg_icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: 'pillar-fraud',
    target_slug: 'cyber-fraud-investigation-support',
    num: '05',
    badge: 'FINANCIAL FORENSICS',
    title: 'Cyber Fraud Investigation Support',
    short: 'Cyber Fraud Tracing',
    metric: '₹50Cr+ Traced In Fraud Cases',
    metric_sub: 'Crypto, Banking & Wire Scam Tracing',
    status: 'FRAUD INTEL ACTIVE',
    status_color: '#f59e0b',
    desc: 'Professional investigation support for financial scams, investment fraud, crypto fraud, romance scams, and online marketplace deception. We analyze digital evidence, trace fraud indicators, and prepare detailed reports suitable for law enforcement review.',
    capabilities: [
      'Cryptocurrency Ledger Tracing',
      'Phishing & Wire Scam Tracking',
      'Mule Account Identification',
      'LEA Complaint Dossier Prep',
    ],
    svg_icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="14" x="2" y="5" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
        <circle cx="7" cy="15" r="1" />
      </svg>
    ),
  },
  {
    id: 'pillar-evidence',
    target_slug: 'digital-evidence-preservation-forensics',
    num: '06',
    badge: 'CHAIN OF CUSTODY',
    title: 'Digital Evidence Preservation & Forensics',
    short: 'Evidence Forensics',
    metric: '100% Evidentiary Integrity',
    metric_sub: 'Device, Email & Online Preservation',
    status: 'EVIDENCE SEALED',
    status_color: '#8b20ff',
    desc: 'Secure collection, preservation, and analysis of digital evidence from devices, emails, screenshots, and online accounts. Our forensic documentation helps maintain evidence integrity for investigations, disputes, and legal proceedings.',
    capabilities: [
      'Secure Device Imaging',
      'Tamper-Proof Metadata Capture',
      'Email & Cloud Acquisition',
      'Court-Admissible Dossiers',
    ],
    svg_icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
  },
  {
    id: 'pillar-executive',
    target_slug: 'executive-family-digital-protection',
    num: '07',
    badge: 'VIP PROTECTION',
    title: 'Executive & Family Digital Protection',
    short: 'Executive Defense',
    metric: '24/7 Dark Web Monitoring',
    metric_sub: 'Founders, Executives & Family Offices',
    status: 'VIP SHIELD ACTIVE',
    status_color: '#00f0ff',
    desc: 'Proactive cybersecurity services designed to protect business leaders, public figures, families, and high-profile individuals from digital threats. We assess security risks, improve privacy controls, and strengthen account and device protection.',
    capabilities: [
      'VIP Dark Web Exposure Audits',
      'Personal Device Hardening',
      'Anti-Doxxing & Privacy Controls',
      'Family Home Network Defense',
    ],
    svg_icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l7 4v6c0 5-3.5 9-7 10-3.5-1-7-5-7-10V6l7-4z" />
        <circle cx="12" cy="9" r="2.5" />
        <path d="M8 16c0-2.2 1.8-4 4-4s4 1.8 4 4" />
      </svg>
    ),
  },
  {
    id: 'pillar-lea',
    target_slug: 'cybersecurity-awareness-lea-training',
    num: '08',
    badge: 'ACCREDITED TRAINING',
    title: 'Cybersecurity Awareness & LEA Training',
    short: 'LEA Training',
    metric: '5,000+ Personnel Trained',
    metric_sub: 'Police Academies & Enterprise Teams',
    status: 'ACCREDITED DRILLS',
    status_color: '#eab308',
    desc: 'Specialized training programs for law enforcement agencies, educational institutions, NGOs, and corporate teams on cybercrime prevention and investigation techniques. Sessions focus on practical skills, digital evidence handling, fraud awareness, and incident response readiness.',
    capabilities: [
      'Forensic Seizure Protocols',
      'Chain-of-Custody Procedures',
      'Fraud Awareness Training',
      'Incident Response Readiness',
    ],
    svg_icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
  },
  {
    id: 'pillar-child',
    target_slug: 'child-digital-safety-protection',
    num: '09',
    badge: 'ETHICAL SAFEGUARDING',
    title: 'Child Digital Safety & Protection',
    short: 'Child Protection',
    metric: '100% Confidential Inquiry',
    metric_sub: 'Anti-Bullying & Threat Assessment',
    status: 'ETHICAL DEFENSE ACTIVE',
    status_color: '#ec4899',
    desc: 'We help safeguard children in the digital world through confidential investigations, online threat assessment, and digital evidence analysis. Our services focus on identifying cyberbullying, online harassment, suspicious digital interactions, and potential child exploitation risks, including the identification and reporting of Child Sexual Abuse Material (CSAM).',
    capabilities: [
      'Cyberbullying Identification',
      'Online Harassment Analysis',
      'Suspicious Interaction Triage',
      'CSAM Escalation & Reporting',
    ],
    svg_icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <circle cx="12" cy="10" r="3" />
        <path d="M7 18a5 5 0 0 1 10 0" />
      </svg>
    ),
  },
];

export default function CiShowcaseMatrix({ onExploreService }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef(null);
  const isHoveredRef = useRef(false);

  useEffect(() => {
    const isMobile = window.innerWidth <= 992;
    if (isMobile) return;

    timerRef.current = setInterval(() => {
      if (!isHoveredRef.current) {
        setActiveIndex((prev) => (prev + 1) % DEFAULT_PILLARS.length);
      }
    }, 6500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleMouseEnter = (idx) => {
    if (window.innerWidth > 992) {
      isHoveredRef.current = true;
      setActiveIndex(idx);
    }
  };

  const handleMouseLeave = () => {
    isHoveredRef.current = false;
  };

  const handleClick = (idx) => {
    setActiveIndex(idx);
  };

  const handleScrollToService = (slug) => {
    const card = document.getElementById('svc-' + slug) || document.querySelector(`.ci-svc-card[data-slug="${slug}"]`);
    if (card) {
      const header = document.querySelector('.header, .site-header, header');
      const offset = (header ? header.offsetHeight : 70) + 24;
      const top = card.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      card.classList.add('ci-svc-highlight');
      setTimeout(() => card.classList.remove('ci-svc-highlight'), 3800);
    }
  };

  return (
    <section className="section ci-showcase-section" id="ci-showcase" aria-label="Digital Investigation Pillars">
      <div className="ci-showcase-ambient-glow" aria-hidden="true"></div>

      <div className="container">
        <div className="section-heading text-center ci-reveal">
          <span className="section-tag">
            <span className="pulse-dot"></span>
            CORE INVESTIGATION PILLARS
          </span>
          <h2>
            Digital Forensic &amp; <span>Investigation Matrix</span>
          </h2>
          <p className="section-desc" style={{ maxWidth: '740px', margin: '0 auto' }}>
            Court-grade forensic artifact analysis, OSINT intelligence mapping, financial fraud indicators tracing, and evidentiary preservation across our specialized investigation pillars.
          </p>
        </div>

        <div className="ci-showcase-wrapper ci-reveal" onMouseLeave={handleMouseLeave}>
          <div className="ci-showcase-panels" id="ciShowcasePanels" role="tablist" aria-label="Digital Investigation Pillars">
            {DEFAULT_PILLARS.map((panel, i) => {
              const isActive = i === activeIndex;
              return (
                <div
                  key={panel.id}
                  className={`ci-panel ${isActive ? 'ci-panel-active' : ''}`}
                  id={`ciPanel${i}`}
                  role="tab"
                  tabIndex={0}
                  aria-selected={isActive ? 'true' : 'false'}
                  aria-label={panel.title}
                  onMouseEnter={() => handleMouseEnter(i)}
                  onClick={() => handleClick(i)}
                >
                  <div className="ci-panel-overlay"></div>
                  <div className="ci-panel-glow-edge"></div>

                  <div className="ci-panel-particles" aria-hidden="true">
                    <span className="ci-ptcl ptcl-1"></span>
                    <span className="ci-ptcl ptcl-2"></span>
                    <span className="ci-ptcl ptcl-3"></span>
                    <span className="ci-ptcl ptcl-4"></span>
                    <span className="ci-ptcl ptcl-5"></span>
                  </div>

                  {/* COLLAPSED STATE */}
                  <div className="ci-panel-collapsed" aria-hidden={isActive ? 'true' : 'false'}>
                    <span className="ci-panel-num">{panel.num}</span>
                    <div className="ci-panel-icon-badge">{panel.svg_icon}</div>
                    <div className="ci-panel-short-title">
                      <span>{panel.short || panel.title}</span>
                    </div>
                    <div className="ci-panel-expand-pill">
                      <span className="expand-dot"></span>
                      <span>EXPAND</span>
                    </div>
                  </div>

                  {/* EXPANDED STATE */}
                  <div className="ci-panel-expanded" aria-hidden={isActive ? 'false' : 'true'}>
                    <div className="ci-panel-exp-header">
                      <div className="ci-panel-tag-group">
                        <span className="ci-panel-exp-num">{panel.num}</span>
                        <span className="ci-panel-exp-badge">{panel.badge}</span>
                        <span className="ci-panel-exp-status">
                          <span
                            className="status-pulse-dot"
                            style={{
                              background: panel.status_color || '#10b981',
                              boxShadow: `0 0 8px ${panel.status_color || '#10b981'}`,
                            }}
                          ></span>
                          {panel.status}
                        </span>
                      </div>
                      <div className="ci-panel-exp-icon">{panel.svg_icon}</div>
                    </div>

                    <h3 className="ci-panel-exp-title">{panel.title}</h3>
                    <p className="ci-panel-exp-desc">{panel.desc}</p>

                    <div className="ci-panel-caps">
                      {panel.capabilities.map((cap) => (
                        <span key={cap} className="ci-cap-tag">
                          <span className="ci-cap-dot"></span>
                          {cap}
                        </span>
                      ))}
                    </div>

                    <div className="ci-panel-exp-footer">
                      <div className="ci-panel-metric-box">
                        <div className="ci-metric-value">{panel.metric}</div>
                        {panel.metric_sub && <div className="ci-metric-sub">{panel.metric_sub}</div>}
                      </div>

                      <a
                        href={`#svc-${panel.target_slug}`}
                        className="ci-panel-cta"
                        onClick={(e) => {
                          e.preventDefault();
                          handleScrollToService(panel.target_slug);
                        }}
                        title={`Explore ${panel.title}`}
                      >
                        <span>Explore Service</span>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                          <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

