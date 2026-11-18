import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LiveChatWidget from '../components/LiveChatWidget';
import ContactForm from '../components/ContactForm';
import RouteGlobe from '../components/RouteGlobe';
import AttackSurfaceHero from '../components/cyber/AttackSurfaceHero';
import {
  getSettings,
  getSections,
  getCyberServices,
  getPractices,
  getClients,
  getAccreditations,
  getFaqs,
} from '../api/client';

const GLITCH_PHRASES = [
  'Application Security',
  'Network Security',
  'Cloud Security',
  'Enterprise Security',
];

const DEFAULT_PRACTICES = [
  {
    id: '01',
    title: 'Vulnerability Assessment & Pen Testing (VAPT)',
    slug: 'vulnerability-assessment-penetration-testing',
    tag: '// APPSEC-01',
    badge: 'PRIMARY PRACTICE',
    status_text: 'ARMORED',
    is_hero: true,
    description:
      'Simulate real-world attacks across web applications, APIs, mobile apps, and systems to uncover exploitable flaws before adversaries do.',
  },
  {
    id: '02',
    title: 'Network & Wireless Penetration Testing',
    slug: 'network-penetration-testing',
    tag: '// NETSEC-02',
    badge: '',
    status_text: 'ARMORED',
    is_hero: false,
    description:
      'Comprehensive perimeter and internal network auditing, firewall rulebase evaluations, and rogue wireless access point testing.',
  },
  {
    id: '03',
    title: 'Cloud Security & Posture Management (CSPM)',
    slug: 'cloud-configuration-review',
    tag: '// CLOUD-03',
    badge: '',
    status_text: 'ARMORED',
    is_hero: false,
    description:
      'Audit AWS, Azure, and GCP architectures for misconfigurations, excessive IAM privileges, CASA compliance, and container vulnerabilities.',
  },
  {
    id: '04',
    title: 'Virtual CISO (vCISO) & Executive Advisory',
    slug: 'virtual-ciso-services',
    tag: '// ENTPR-04',
    badge: 'PRIMARY PRACTICE',
    status_text: 'ARMORED',
    is_hero: true,
    description:
      'Strategic cybersecurity leadership, governance, vendor risk management, and regulatory alignment with ISO 27001, SOC 2, and NIST.',
  },
  {
    id: '05',
    title: 'REST & GraphQL API Security Testing',
    slug: 'api-penetration-testing',
    tag: '// APISEC-05',
    badge: '',
    status_text: 'ARMORED',
    is_hero: false,
    description:
      'Deep technical auditing for OWASP API Security Top 10 vulnerabilities, broken authentication, rate-limiting flaws, and mass assignment.',
  },
  {
    id: '06',
    title: 'Secure Source Code Review (SAST/DAST)',
    slug: 'secure-source-code-review',
    tag: '// DEVSEC-06',
    badge: '',
    status_text: 'ARMORED',
    is_hero: false,
    description:
      'Automated and manual line-by-line static analysis to identify hidden backdoors, cryptographic bugs, and code injection vulnerabilities.',
  },
  {
    id: '07',
    title: 'Zero-Trust Architecture & Threat Hardening',
    slug: 'security-architecture-review',
    tag: '// ZEROTRUST-07',
    badge: '',
    status_text: 'ARMORED',
    is_hero: false,
    description:
      'Enterprise identity defense, Microsoft 365 hardening, network segmentation, and micro-perimeter security to stop ransomware spread.',
  },
  {
    id: '08',
    title: 'AI Security & LLM Red Teaming',
    slug: 'ai-security',
    tag: '// AISEC-08',
    badge: 'AI DEFENSE PRACTICE',
    status_text: 'ARMORED',
    is_hero: true,
    description:
      'Adversarial prompt injection testing, RAG pipeline defense, model weight integrity, and LLM guardrail auditing to secure enterprise AI.',
  },
];

const DEFAULT_PROCESS_STEPS = [
  {
    num: '01',
    title: 'Scoping & Reconnaissance',
    desc: 'Map external attack surfaces, identify target domains, cloud assets, and APIs.',
  },
  {
    num: '02',
    title: 'Vulnerability Exploitation',
    desc: 'Execute automated scans and certified manual exploit testing aligned with OWASP & NIST.',
  },
  {
    num: '03',
    title: 'Risk Scoring & Analysis',
    desc: 'Quantify business impact using CVSS v3.1 metrics and map full attack chains.',
  },
  {
    num: '04',
    title: 'Remediation Roadmap',
    desc: 'Deliver executive summaries and technical reports with exact step-by-step fix guides.',
  },
  {
    num: '05',
    title: 'Verification & Attestation',
    desc: 'Perform complimentary re-testing and issue a verifiable Security Attestation Certificate.',
  },
];

const DEFAULT_CLIENT_TIERS = [
  {
    icon: '🚀',
    title: 'High-Growth Startups',
    desc: 'Securing MVP architectures, passing enterprise vendor risk assessments, and pre-launch VAPT.',
  },
  {
    icon: '🏢',
    title: 'Regional SaaS & Mid-Market',
    desc: 'Continuous vulnerability management, SOC 2 compliance readiness, and API protection.',
  },
  {
    icon: '🏙️',
    title: 'High-Capacity Enterprises',
    desc: 'Comprehensive red teaming, multi-cloud hardening, ERP auditing, and zero-trust engineering.',
  },
  {
    icon: '🏛️',
    title: 'Institutional & Public Sector',
    desc: 'Safeguarding critical public infrastructure, sovereign data, and compliance audits.',
  },
  {
    icon: '🌐',
    title: 'Global Multinationals',
    desc: 'Distributed attack surface management, supply chain assessments, and executive vCISO advisory.',
  },
];

const DEFAULT_SIMULATOR_TOOLS = [
  {
    icon: '🌐',
    title: 'Web App & API Vulnerability Probe',
    desc: 'Scan for SQLi, XSS, SSRF, BOLA, and OWASP Top 10 exploits',
    tag: 'WEB & API',
  },
  {
    icon: '🛡️',
    title: 'Perimeter & Port Exposure Scan',
    desc: 'Detect open firewall ports, exposed services & DNS leaks',
    tag: 'NETWORK',
  },
  {
    icon: '☁️',
    title: 'Cloud Misconfiguration Audit',
    desc: 'Uncover open S3 buckets, IAM privilege flaws & GCP risks',
    tag: 'CLOUD INFRA',
  },
  {
    icon: '🦠',
    title: 'Ransomware & Malware Resilience',
    desc: 'Evaluate endpoint defense & lateral movement barriers',
    tag: 'RANSOMWARE',
  },
  {
    icon: '💻',
    title: 'Source Code & Secret Leak Probe',
    desc: 'Detect exposed API keys, credentials, and CVE-prone libraries',
    tag: 'CODE AUDIT',
  },
  {
    icon: '🎣',
    title: 'Phishing & Identity Compromise',
    desc: 'Simulate credential stuffing, spear-phishing & auth bypass',
    tag: 'IDENTITY',
  },
  {
    icon: '📦',
    title: 'Supply Chain & Third-Party Audit',
    desc: 'Identify vulnerabilities in vendor dependencies & integrations',
    tag: 'SUPPLY CHAIN',
  },
  {
    icon: '📋',
    title: 'Regulatory & Compliance Check',
    desc: 'Evaluate readiness for ISO 27001, SOC 2, HIPAA & NIST CSF',
    tag: 'COMPLIANCE',
  },
];

const DEFAULT_CYBER_FAQS = [
  {
    question: 'What cybersecurity services does Cyber Kovai provide?',
    answer:
      'Cyber Kovai provides comprehensive offensive and defensive cybersecurity solutions, including Vulnerability Assessment and Penetration Testing (VAPT), Web & Mobile Application Security, Network Penetration Testing, Cloud Security Audits (AWS, GCP, Azure), API Security, Virtual CISO (vCISO) Advisory, Secure Code Review, and Zero-Trust Architecture Hardening.',
  },
  {
    question: 'What standards and frameworks do you follow during testing?',
    answer:
      'Our security testing strictly adheres to industry-leading frameworks including OWASP Top 10, OWASP API Security Top 10, NIST SP 800-115, SANS/CWE 25, and PTES (Penetration Testing Execution Standard), ensuring thorough and standardized vulnerability discovery.',
  },
  {
    question: 'How long does a security assessment or penetration test take?',
    answer:
      'Assessment timelines depend on scope and infrastructure size. A typical web application or network VAPT takes between 3 to 10 business days. We provide continuous interim alerts for any critical zero-day discoveries followed by a detailed formal report.',
  },
  {
    question: 'Do you provide re-testing after our engineering team fixes vulnerabilities?',
    answer:
      'Yes. We include complimentary verification re-testing within 30 days to confirm that reported vulnerabilities are properly patched, followed by the issuance of a formal Certificate of Security Attestation.',
  },
  {
    question: 'How is our proprietary source code and sensitive infrastructure protected?',
    answer:
      'All engagements are conducted under legally binding Non-Disclosure Agreements (NDAs). We utilize encrypted communication channels, secure isolated testing pods, and strict data-handling protocols aligned with ISO 27001.',
  },
];

const DEFAULT_CYBER_CLIENTS = [
  {
    name: 'CopConnect',
    category: 'Information Sharing and Analysis Center',
    desc: 'Enterprise cyber threat intelligence sharing, automated incident indicators, and proactive defensive threat coordination.',
    img: 'assets/images/client_copconnect.jpg',
  },
  {
    name: 'Gokarna Samudra',
    category: 'Beach Resort & Hospitality',
    desc: 'Digital infrastructure protection, web/network penetration testing, and guest data privacy security audits.',
    img: 'assets/images/client_gokarna_samudra.jpg',
  },
];

const DEFAULT_ACCREDS = [
  { img: 'assets/images/aid.png', alt: 'AID - Association of Investigators and Detectives' },
  { img: 'assets/images/tapdi.png', alt: 'TAPDI - Tamilnadu Association of Professional Detectives and Investigators' },
  { img: 'assets/images/apdi.png', alt: 'APDI - Association of Professional Detectives & Investigators' },
  { img: 'assets/images/unip.svg', alt: 'UNIP - Unified Network of Investigative Professionals' },
];

const normalizeImg = (path, fallback = '') => {
  if (!path) return fallback;
  if (path.startsWith('http') || path.startsWith('/')) return path;
  return '/' + path;
};

export default function CyberSecurityPage() {
  const [settings, setSettings] = useState({});
  const [sections, setSections] = useState({});
  const [cyberServices, setCyberServices] = useState([]);
  const [practices, setPractices] = useState(DEFAULT_PRACTICES);
  const [practicesSettings, setPracticesSettings] = useState({
    tag: 'OUR PRACTICES',
    title: 'Core Cyber Practices. One Standard: <span>Uncompromising Defense.</span>',
    subtitle: 'Comprehensive offensive and defensive cybersecurity practices engineered for modern digital enterprises.',
  });
  const [clients, setClients] = useState(DEFAULT_CYBER_CLIENTS);
  const [accreditations, setAccreditations] = useState(DEFAULT_ACCREDS);
  const [faqs, setFaqs] = useState(DEFAULT_CYBER_FAQS);
  const [openFaq, setOpenFaq] = useState(0);

  // Glitch rotator state
  const [glitchIdx, setGlitchIdx] = useState(0);

  useEffect(() => {
    getSettings().then((s) => s && setSettings(s)).catch(() => {});
    getSections().then((s) => s && setSections(s)).catch(() => {});
    getCyberServices()
      .then((data) => {
        if (data && typeof data === 'object') {
          const list = Object.values(data).filter(s => s && s.active !== false && s.status !== 'inactive');
          setCyberServices(list);
        }
      })
      .catch(() => {});
    getPractices()
      .then((data) => {
        if (data) {
          if (Array.isArray(data.practices) && data.practices.length > 0) {
            setPractices(data.practices);
          }
          if (data.settings) {
            setPracticesSettings({
              tag: data.settings.tag || 'OUR PRACTICES',
              title: data.settings.title || 'Core Cyber Practices. One Standard: <span>Uncompromising Defense.</span>',
              subtitle: data.settings.subtitle || 'Comprehensive offensive and defensive cybersecurity practices engineered for modern digital enterprises.',
            });
          }
        }
      })
      .catch(() => {});
    getClients('cyber')
      .then((c) => {
        if (Array.isArray(c) && c.length > 0) setClients(c);
      })
      .catch(() => {});
    getAccreditations('cyber')
      .then((a) => {
        if (Array.isArray(a) && a.length > 0) setAccreditations(a);
      })
      .catch(() => {});
    getFaqs('cyber')
      .then((f) => {
        if (Array.isArray(f) && f.length > 0) setFaqs(f);
      })
      .catch(() => {});
  }, []);

  // Scroll to hash target if provided e.g. #services or #practices
  useEffect(() => {
    if (window.location.hash) {
      const targetId = window.location.hash.replace('#', '');
      const el = document.getElementById(targetId);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 200);
      }
    }
  }, []);

  // Glitch phrase rotator timer
  useEffect(() => {
    const timer = setInterval(() => {
      setGlitchIdx((prev) => (prev + 1) % GLITCH_PHRASES.length);
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  const handleNextGlitch = () => {
    setGlitchIdx((prev) => (prev + 1) % GLITCH_PHRASES.length);
    window.dispatchEvent(new CustomEvent('ck:next'));
  };

  const currentGlitchPhrase = GLITCH_PHRASES[glitchIdx];

  return (
    <>
      <Header settings={settings} />

      <main className="df-page cyber-track-view">
        {/* ================= 1. HERO SECTION ================= */}
        {sections.cyber_hero !== false && (
          <section className="hero" id="home">
            <div className="hero-bg"></div>

            <div className="container hero-content">
              <div className="hero-left">
                <div className="hero-tags-wrapper">
                  <span className="hero-tag-pill">CYBER DEFENSE</span>
                  <span className="hero-tag-pill">ZERO-TRUST SECURITY</span>
                  <span className="hero-tag-pill">OFFENSIVE RESEARCH</span>
                </div>

                <h1>
                  Advanced Cyber Security<br />
                  <span className="hero-gradient-text">Solutions</span><br />
                  <span className="hero-by-line" onClick={handleNextGlitch} style={{ cursor: 'pointer' }}>
                    <span
                      className="cyber-glitch-wrapper"
                      title="Explore Cyber Security Services (Click to cycle)"
                    >
                      <span className="cyber-glitch-text" data-text={currentGlitchPhrase}>
                        {currentGlitchPhrase}
                      </span>
                      <span className="cyber-cursor" aria-hidden="true">_</span>
                      <span className="cyber-scan-bar" aria-hidden="true"></span>
                    </span>
                  </span>
                </h1>

                <p>
                  CyberKovai delivers proactive cybersecurity solutions, certified penetration testing, and enterprise defense for modern businesses. Our certified cyber security experts provide continuous vulnerability management, cloud hardening, application security, and 24/7 digital resilience.
                </p>

                <div className="hero-buttons">
                  <a href="#contact" className="btn primary-btn">
                    Schedule Security Audit <span>➔</span>
                  </a>
                  <a href="#services" className="btn outline-btn">
                    Explore Security Practices <span>➔</span>
                  </a>
                </div>

                <div className="hero-features-row">
                  <div><span>✓</span> Offensive VAPT &amp; Attack Simulations</div>
                  <div><span>✓</span> Zero-Trust Architecture Hardening</div>
                  <div><span>✓</span> OWASP, NIST &amp; ISO 27001 Aligned</div>
                </div>
              </div>

              {/* RIGHT SIDE: Attack Surface Honeycomb Visual */}
              <AttackSurfaceHero />
            </div>
          </section>
        )}

        {/* ================= 2. ABOUT CYBER DEFENSE ================= */}
        {sections.cyber_about !== false && (
          <section className="section about-section cyber-about-section" id="about">
            <div className="about-ambient-glow about-glow-left" aria-hidden="true"></div>
            <div className="about-ambient-glow about-glow-right" aria-hidden="true"></div>

            <div className="container about-grid">
              <div className="about-content">
                <div className="cyber-badge-tag">
                  <span className="cyber-tag-pulse"></span>
                  <span className="cyber-tag-text">ABOUT CYBER KOVAI</span>
                  <span className="cyber-tag-code">[ SYSTEM // THREAT DEFENSE ACTIVE ]</span>
                </div>

                <h2 className="about-headline">
                  Defend Your Digital Infrastructure with{' '}
                  <span className="cyber-gradient-text">Elite Cyber Security Experts</span>
                </h2>

                <div className="about-lead-box">
                  <p className="about-lead-text">
                    At Cyber Kovai, we provide cutting-edge offensive security, continuous vulnerability assessment, and zero-trust engineering to help organizations safeguard digital assets and defend against complex cyber threats.
                  </p>
                </div>

                {/* Interactive Capability Cards */}
                <div className="about-capabilities">
                  <div className="capability-card" tabIndex="0">
                    <div className="capability-icon-wrap">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                    </div>
                    <div className="capability-body">
                      <div className="capability-header">
                        <h4>Certified Security Experts</h4>
                        <span className="capability-tag">CISM &amp; CISA</span>
                      </div>
                      <p>Elite red-team specialists simulating real-world adversary tactics to uncover critical vulnerabilities before malicious actors exploit them.</p>
                    </div>
                    <div className="capability-check">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  </div>

                  <div className="capability-card" tabIndex="0">
                    <div className="capability-icon-wrap icon-cyan">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        <circle cx="12" cy="16" r="1" />
                      </svg>
                    </div>
                    <div className="capability-body">
                      <div className="capability-header">
                        <h4>Continuous Vulnerability Management</h4>
                        <span className="capability-tag tag-cyan">OWASP &amp; NIST</span>
                      </div>
                      <p>Systematic surface scanning, CVSS v3.1 threat prioritization, and technical remediation roadmaps to eliminate attack surfaces.</p>
                    </div>
                    <div className="capability-check">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  </div>

                  <div className="capability-card" tabIndex="0">
                    <div className="capability-icon-wrap icon-purple">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                        <path d="M12 12v4m-2-2h4" />
                      </svg>
                    </div>
                    <div className="capability-body">
                      <div className="capability-header">
                        <h4>Multi-Cloud &amp; Zero-Trust Hardening</h4>
                        <span className="capability-tag tag-purple">AWS, GCP &amp; AZURE</span>
                      </div>
                      <p>Hardening cloud architectures, APIs, and enterprise perimeters against ransomware, lateral movement, and data breaches.</p>
                    </div>
                    <div className="capability-check">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Mini Stat Ticker Row */}
                <div className="about-stat-strip">
                  <div className="stat-strip-item">
                    <span className="stat-strip-num">500+</span>
                    <span className="stat-strip-lbl">Security Audits Executed</span>
                  </div>
                  <div className="stat-strip-divider"></div>
                  <div className="stat-strip-item">
                    <span className="stat-strip-num">10,000+</span>
                    <span className="stat-strip-lbl">Vulnerabilities Remediated</span>
                  </div>
                  <div className="stat-strip-divider"></div>
                  <div className="stat-strip-item">
                    <span className="stat-strip-num">99.9%</span>
                    <span className="stat-strip-lbl">Threat Mitigation Rate</span>
                  </div>
                </div>
              </div>

              {/* Right Cyber Console Stage */}
              <div className="about-visual-column">
                <div className="cyber-console-card">
                  <div className="console-top-bar">
                    <div className="console-dots">
                      <span className="dot dot-red"></span>
                      <span className="dot dot-yellow"></span>
                      <span className="dot dot-green"></span>
                    </div>
                  </div>

                  <div className="console-media-window">
                    <div className="hud-corner hud-tl" aria-hidden="true"></div>
                    <div className="hud-corner hud-tr" aria-hidden="true"></div>
                    <div className="hud-corner hud-bl" aria-hidden="true"></div>
                    <div className="hud-corner hud-br" aria-hidden="true"></div>

                    <div className="cyber-scan-laser" aria-hidden="true"></div>
                    <div className="cyber-grid-mesh" aria-hidden="true"></div>

                    <img
                      src="/assets/images/soc_command_center.jpg"
                      alt="Cyber Kovai SOC Command Operations Center"
                      className="about-hero-img"
                      loading="lazy"
                    />

                    <div className="hologram-pill holo-top-left">
                      <span className="pill-glow-dot"></span>
                      <span><strong>10+ Years</strong> Cyber Defense Mastery</span>
                    </div>

                    <div className="hologram-badge holo-top-right">
                      <div className="holo-badge-icon holo-icon-purple">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          <path d="m9 12 2 2 4-4" />
                        </svg>
                      </div>
                      <div className="holo-badge-content">
                        <span className="holo-badge-label">Verified Security Posture</span>
                        <div className="holo-badge-value">
                          <strong>500+</strong> <span>Systems Secured</span>
                        </div>
                      </div>
                      <div className="holo-sparkle" aria-hidden="true">✦</div>
                    </div>

                    <div className="hologram-badge holo-bottom-left">
                      <div className="holo-badge-icon holo-icon-emerald">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <circle cx="12" cy="12" r="6" />
                          <circle cx="12" cy="12" r="2" />
                        </svg>
                      </div>
                      <div className="holo-badge-content">
                        <span className="holo-badge-label">Defense Efficacy</span>
                        <div className="holo-badge-value">
                          <strong className="text-emerald">99.9%</strong> <span>Threat Mitigation</span>
                        </div>
                      </div>
                      <div className="holo-sparkle holo-sparkle-emerald" aria-hidden="true">✦</div>
                    </div>

                    <div className="console-telemetry-bar">
                      <span className="telemetry-item">SOC RADAR: ACTIVE</span>
                      <span className="telemetry-item">STATUS: PERIMETER SECURED</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ================= 3. CORE CYBER CAPABILITIES (3 PILLARS) ================= */}
        {sections.cyber_capabilities !== false && (
          <section className="section cyber-capabilities-section" id="capabilities">
            <div className="container">
              <div className="section-heading text-center">
                <span className="section-tag">CYBER DEFENSE</span>
                <h2>
                  Core Cyber <span>Security Capabilities</span>
                </h2>
                <p>
                  Offensive attack simulations, continuous vulnerability auditing, and zero-trust architecture hardening designed to neutralize complex adversarial threats.
                </p>
              </div>

              <div className="cyber-capabilities-grid">
                {/* CARD 1 */}
                <div className="cyber-cap-card cap-card-attack">
                  <div className="cap-card-icon-wrap">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                      <path d="M10 16V10H16" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M38 16V10H32" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M10 32V38H16" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M38 32V38H32" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="24" cy="24" r="14" stroke="#f43f5e" strokeWidth="2" strokeDasharray="3 3" />
                      <path d="M24 16L31 19.5V25C31 29.5 28 33 24 34.5C20 33 17 29.5 17 25V19.5L24 16Z" fill="#3b82f6" fillOpacity="0.18" stroke="#2563eb" strokeWidth="2.2" strokeLinejoin="round" />
                      <circle cx="24" cy="24" r="2" fill="#2563eb" />
                      <path d="M24 26V28.5" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <h3 className="cap-card-title">Real-World Attack Simulation</h3>
                  <ul className="cap-card-list list-blue">
                    <li><span className="cap-check">✓</span> Offensive red-team tactics simulating real-world adversary behavior.</li>
                    <li><span className="cap-check">✓</span> Led by certified security experts holding CISM &amp; CISA credentials.</li>
                    <li><span className="cap-check">✓</span> Deep exploit validation uncovering critical vulnerabilities before breach.</li>
                    <li><span className="cap-check">✓</span> Post-assessment remediation re-testing and verified certification.</li>
                  </ul>
                </div>

                {/* CARD 2 */}
                <div className="cyber-cap-card cap-card-vuln">
                  <div className="cap-card-icon-wrap">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                      <rect x="8" y="9" width="32" height="23" rx="3" stroke="#2563eb" strokeWidth="2.2" fill="#2563eb" fillOpacity="0.1" />
                      <path d="M20 32V37H28V32" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="15" y1="37" x2="33" y2="37" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" />
                      <circle cx="24" cy="20.5" r="7" stroke="#38bdf8" strokeWidth="1.8" />
                      <circle cx="24" cy="20.5" r="3" stroke="#38bdf8" strokeWidth="1.5" />
                      <line x1="24" y1="13.5" x2="24" y2="27.5" stroke="#38bdf8" strokeWidth="1.5" />
                      <line x1="17" y1="20.5" x2="31" y2="20.5" stroke="#38bdf8" strokeWidth="1.5" />
                    </svg>
                  </div>
                  <h3 className="cap-card-title">Continuous Vulnerability Management</h3>
                  <ul className="cap-card-list list-amber">
                    <li><span className="cap-check">✓</span> Systematic surface scanning across networks, web apps &amp; APIs.</li>
                    <li><span className="cap-check">✓</span> Comprehensive auditing mapped to OWASP Top 10 &amp; NIST frameworks.</li>
                    <li><span className="cap-check">✓</span> CVSS v3.1 dynamic scoring with severity-based risk prioritization.</li>
                    <li><span className="cap-check">✓</span> Actionable remediation roadmaps to eliminate attack surfaces.</li>
                  </ul>
                </div>

                {/* CARD 3 */}
                <div className="cyber-cap-card cap-card-arch">
                  <div className="cap-card-icon-wrap">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                      <path d="M34 23C34 19.13 30.87 16 27 16C26.36 16 25.75 16.09 25.17 16.25C23.94 13.73 21.17 12 18 12C13.58 12 10 15.58 10 20C10 20.35 10.02 20.69 10.07 21.03C7.72 21.94 6 24.27 6 27C6 30.87 9.13 34 13 34H33C36.87 34 40 30.87 40 27C40 24.82 39 22.88 37.44 21.61C37.47 21.41 37.5 21.2 37.5 21" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="#3b82f6" fillOpacity="0.1" />
                      <path d="M24 19L29 21.5V25.5C29 28.5 27 31 24 32C21 31 19 28.5 19 25.5V21.5L24 19Z" fill="#10b981" fillOpacity="0.22" stroke="#10b981" strokeWidth="2" strokeLinejoin="round" />
                      <path d="M22 25.5L23.5 27L26.5 24" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="16" cy="40" r="2.2" stroke="#10b981" strokeWidth="1.8" />
                      <circle cx="24" cy="40" r="2.2" stroke="#10b981" strokeWidth="1.8" />
                      <circle cx="32" cy="40" r="2.2" stroke="#10b981" strokeWidth="1.8" />
                      <line x1="16" y1="34" x2="16" y2="37.8" stroke="#10b981" strokeWidth="1.5" />
                      <line x1="24" y1="34" x2="24" y2="37.8" stroke="#10b981" strokeWidth="1.5" />
                      <line x1="32" y1="34" x2="32" y2="37.8" stroke="#10b981" strokeWidth="1.5" />
                    </svg>
                  </div>
                  <h3 className="cap-card-title">Multi-Cloud &amp; Zero-Trust Hardening</h3>
                  <ul className="cap-card-list list-green">
                    <li><span className="cap-check">✓</span> Architecture hardening across AWS, Google Cloud (GCP) &amp; Azure.</li>
                    <li><span className="cap-check">✓</span> Zero-Trust perimeter design enforcing strict least-privilege access.</li>
                    <li><span className="cap-check">✓</span> Fortifying cloud APIs and endpoints against ransomware &amp; breaches.</li>
                    <li><span className="cap-check">✓</span> Network micro-segmentation to halt adversary lateral movement.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ================= 4. HUD STATS COUNTER BAR ================= */}
        {sections.cyber_stats !== false && (
          <section className="stats-section cyber-stats-section">
            <div className="container">
              <div className="stats-counter-grid cyber-hud-stats">
                {[
                  { value: '500+', label: 'SECURITY AUDITS COMPLETED' },
                  { value: '10k+', label: 'VULNERABILITIES REMEDIATED' },
                  { value: '99.9%', label: 'THREAT MITIGATION RATE' },
                  { value: '140+', label: 'ATTACK VECTORS AUDITED' },
                  { value: '0', label: 'CRITICAL RESIDUAL EXPOSURES' },
                ].map((stat, idx) => (
                  <div key={idx} className="stat-counter-card cyber-hud-stat-card">
                    <div className="stat-card-beam" aria-hidden="true"></div>
                    <div className="stat-hud-chip">VERIFIED METRIC</div>
                    <strong className="stat-counter-val">{stat.value}</strong>
                    <span className="stat-counter-lbl">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ================= 5. CORE CYBER PRACTICES (BENTO GRID) ================= */}
        {sections.cyber_practices !== false && (
          <section className="section services-section cyber-practices-section" id="services">
            <span id="practices" style={{ display: 'block', position: 'relative', top: '-100px', visibility: 'hidden' }}></span>
            <div className="container">
              <div className="section-heading text-center">
                <span className="section-tag">{practicesSettings.tag || 'OUR PRACTICES'}</span>
                <h2
                  dangerouslySetInnerHTML={{
                    __html: practicesSettings.title || 'Core Cyber Practices. One Standard: <span>Uncompromising Defense.</span>',
                  }}
                />
                <p>
                  {practicesSettings.subtitle || 'Comprehensive offensive and defensive cybersecurity practices engineered for modern digital enterprises.'}
                </p>
              </div>

              <div className="practices-bento-grid">
                {practices.map((practice, index) => {
                  const isHero = Boolean(practice.is_hero) || [0, 3, 7].includes(index);
                  const bentoClassNum = (index % 8) + 1;
                  const badgeText =
                    practice.badge ||
                    (isHero
                      ? index === 7 || bentoClassNum === 8
                        ? 'AI DEFENSE PRACTICE'
                        : 'PRIMARY PRACTICE'
                      : '');
                  const statusText = practice.status_text || 'ARMORED';

                  return (
                    <article
                      key={practice.slug || practice.id || index}
                      className={`practice-bento-card ${isHero ? 'bento-hero-card' : ''} bento-item-${bentoClassNum}`}
                    >
                      <div className="bento-card-header">
                        <div className="bento-icon-wrapper">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                        </div>
                        <div className="bento-dossier-tag">
                          <span className="dossier-code">{practice.tag || `// SEC-${String(index + 1).padStart(2, '0')}`}</span>
                          {badgeText && <span className="dossier-badge">{badgeText}</span>}
                        </div>
                      </div>

                      <div className="bento-card-content">
                        <h3>
                          <Link to={`/services/${practice.slug}?section=cyber`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            {practice.title}
                          </Link>
                        </h3>
                        <p>{practice.description}</p>
                      </div>

                      <div className="bento-card-footer">
                        <Link to={`/services/${practice.slug}?section=cyber`} className="practice-cyber-link">
                          <span>Explore Security Practice</span>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                          </svg>
                        </Link>
                        <div className="bento-status-indicator">
                          <span className="status-pulse-dot"></span>
                          <span className="status-text">{statusText}</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ================= 6. STRUCTURED DEFENSE LIFECYCLE (5-STAGE PIPELINE) ================= */}
        {sections.cyber_process !== false && (
          <section className="section process-section cyber-process-section" id="process">
            <div className="container">
              <div className="section-heading text-center">
                <span className="section-tag">OUR METHODOLOGY</span>
                <h2>
                  A Structured <span>Cyber Defense Lifecycle</span>
                </h2>
                <p>
                  A systematic 5-stage methodology to detect, neutralize, and safeguard your infrastructure against sophisticated adversaries.
                </p>
              </div>

              <div className="cyber-pipeline-wrapper">
                <div className="pipeline-conduit-line" aria-hidden="true">
                  <div className="pipeline-glow-pulse"></div>
                </div>

                <div className="cyber-pipeline-track">
                  {DEFAULT_PROCESS_STEPS.map((step) => (
                    <div key={step.num} className="pipeline-stage-card" tabIndex="0">
                      <div className="stage-node-wrapper">
                        <div className="stage-node-circle">
                          <span className="stage-node-pulse"></span>
                          <span className="stage-node-num">{step.num}</span>
                        </div>
                        <div className="stage-phase-label">PHASE {step.num}</div>
                      </div>

                      <div className="stage-card-body">
                        <div className="stage-icon-capsule">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                        </div>
                        <h3>{step.title}</h3>
                        <p>{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ================= 7. CYBER INTELLIGENCE FOR EVERY INDUSTRY ================= */}
        {sections.cyber_industries !== false && (
          <section className="section industries-section cyber-industries-section" id="industries">
            <div className="container industries-container">
              <div className="section-heading text-center">
                <span className="section-tag">INDUSTRIES</span>
                <h2>
                  Cyber Intelligence for <span>Every Industry</span>
                </h2>
                <p>Tailored intelligence to address industry-specific risks and challenges.</p>
              </div>

              <div className="industries-cyber-grid">
                <div className="industry-cyber-col" tabIndex="0">
                  <div className="industry-cyber-icon-orb">
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 21h18M3 10h18M12 3l9 7H3l9-7z" />
                      <path d="M5 10v11M9 10v11M15 10v11M19 10v11" />
                    </svg>
                  </div>
                  <h3>Banking &amp; Financial Services</h3>
                  <p>Fraud prevention, threat monitoring and risk visibility.</p>
                </div>

                <div className="industry-cyber-col" tabIndex="0">
                  <div className="industry-cyber-icon-orb">
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 21h18" />
                      <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
                      <path d="M12 7v6M9 10h6" />
                      <path d="M10 17h4" />
                    </svg>
                  </div>
                  <h3>Healthcare &amp; Life Sciences</h3>
                  <p>Protect sensitive data and ensure operational resilience.</p>
                </div>

                <div className="industry-cyber-col" tabIndex="0">
                  <div className="industry-cyber-icon-orb">
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <rect x="9" y="8" width="6" height="6" rx="1" />
                      <path d="M9 11H7M17 11h-2M12 8V6M12 16v-2" />
                    </svg>
                  </div>
                  <h3>Technology &amp; SaaS</h3>
                  <p>Monitor threats targeting digital platforms and intellectual property.</p>
                </div>

                <div className="industry-cyber-col" tabIndex="0">
                  <div className="industry-cyber-icon-orb">
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 20h20" />
                      <path d="M4 20V9l6 4V9l6 4V4h4v16" />
                      <rect x="7" y="16" width="2" height="4" />
                      <rect x="13" y="16" width="2" height="4" />
                    </svg>
                  </div>
                  <h3>Manufacturing &amp; Industrial</h3>
                  <p>Identify risks to OT/IT environments and supply chains.</p>
                </div>

                <div className="industry-cyber-col" tabIndex="0">
                  <div className="industry-cyber-icon-orb">
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L2 7h20L12 2z" />
                      <path d="M4 10v9M8 10v9M12 10v9M16 10v9M20 10v9" />
                      <path d="M2 19h20M1 22h22" />
                    </svg>
                  </div>
                  <h3>Government &amp; Public Sector</h3>
                  <p>Enhance threat visibility and protect critical infrastructure.</p>
                </div>

                <div className="industry-cyber-col" tabIndex="0">
                  <div className="industry-cyber-icon-orb">
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="9" cy="21" r="1.5" />
                      <circle cx="19" cy="21" r="1.5" />
                      <path d="M2.5 2.5h3l2.4 12.3a2 2 0 0 0 2 1.6h9.6a2 2 0 0 0 2-1.6l1.5-8.3H6.2" />
                    </svg>
                  </div>
                  <h3>Retail &amp; E-commerce</h3>
                  <p>Detect fraud, account takeovers and emerging cyber threats.</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ================= 8. FROM STARTUPS TO MULTINATIONALS (TIERS & PARTNERS) ================= */}
        {sections.cyber_clients !== false && (
          <section className="section clients-section cyber-clients-section">
            <div className="container">
              <div className="section-heading text-center">
                <span className="section-tag">WHO WE SECURE</span>
                <h2>
                  From Startups to <span>Multinationals</span>
                </h2>
                <p>
                  Organizations across every tier trust Cyber Kovai for offensive security testing, multi-cloud hardening, and proactive cyber defense.
                </p>
              </div>

              <div className="client-tiers-deck">
                {DEFAULT_CLIENT_TIERS.map((tier, i) => {
                  const tierNum = i + 1;
                  const tierNames = [
                    'EMERGING VENTURES',
                    'REGIONAL MID-MARKET',
                    'HIGH-CAPACITY ENTERPRISE',
                    'INSTITUTIONAL BODIES',
                    'GLOBAL CONGLOMERATE',
                  ];
                  return (
                    <div key={i} className="client-tier-card" tabIndex="0">
                      <div className="tier-top-strip">
                        <span className="tier-chip">TIER 0{tierNum}</span>
                        <span className="tier-label">{tierNames[i]}</span>
                      </div>
                      <div className="tier-icon-orb">{tier.icon}</div>
                      <h3>{tier.title}</h3>
                      <p>{tier.desc}</p>
                      <div className="tier-capacity-bar" title={`Scale Deployment Tier ${tierNum} of 5`}>
                        <div className="tier-fill-track" style={{ width: `${tierNum * 20}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Featured Client Partnerships Showcase */}
              {clients.length > 0 && (
                <div className="cyber-clients-showcase">
                  <div className="cyber-clients-showcase-label">
                    <span className="pulse-dot"></span>
                    <span>FEATURED CLIENT ENGAGEMENTS</span>
                  </div>
                  <div className="cyber-clients-logos-deck">
                    {clients.map((client, idx) => (
                      <div key={client.name + idx} className="cyber-client-card">
                        <div className="cyber-client-logo-box">
                          <img
                            src={normalizeImg(client.img, '/assets/images/client_copconnect.jpg')}
                            alt={client.alt || client.name}
                            className="cyber-client-logo-img"
                            loading="lazy"
                          />
                        </div>
                        <div className="cyber-client-meta">
                          <div className="cyber-client-header">
                            <h4>{client.name}</h4>
                          </div>
                          <span className="cyber-client-cat">{client.category}</span>
                          {client.desc && <p className="cyber-client-desc">{client.desc}</p>}
                          <div className="cyber-client-footer">
                            <span className="pulse-dot"></span>
                            <span>ARMORED PARTNERSHIP</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ================= 9. GLOBAL REACH & WORLD GLOBE ================= */}
        {sections.cyber_coverage !== false && (
          <section className="section coverage-section" id="coverage">
            <div className="container">
              <div className="coverage-grid">
                <div className="coverage-globe-col">
                  <div id="globe-wrap" className="globe-box">
                    <RouteGlobe height={420} />
                    <div id="hint">Drag to rotate • auto-rotates when idle</div>
                  </div>
                </div>

                <div className="coverage-content-col">
                  <span className="section-tag">GLOBAL REACH</span>
                  <h2>
                    From Coimbatore <span>to the World</span>
                  </h2>
                  <p className="coverage-subtitle">
                    Delivering offensive security testing, cloud defense, and cyber resilience across India and globally.
                  </p>

                  <div className="coverage-features">
                    <div className="coverage-feature">
                      <div className="coverage-feature-text">
                        <h4>Global Remote &amp; On-Premises Security Audits</h4>
                        <p>Seamless security testing and penetration assessments across Asia-Pacific, Middle East, Europe, and North America.</p>
                      </div>
                    </div>

                    <div className="coverage-feature">
                      <div className="coverage-feature-text">
                        <h4>Certified Security Researchers &amp; Penetration Testers</h4>
                        <p>Direct access to CISA, CISM, OSCP, CEH, and CISSP certified ethical hackers with proven track records.</p>
                      </div>
                    </div>

                    <div className="coverage-feature">
                      <div className="coverage-feature-text">
                        <h4>Strict International Security Compliance</h4>
                        <p>All assessments are conducted strictly adhering to OWASP Top 10, NIST CSF, ISO 27001, and regional data protection mandates.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ================= 10. ACCREDITATIONS & CREDENTIALS ================= */}
        {sections.cyber_credentials !== false && accreditations.length > 0 && (
          <section className="section credentials-section" id="credentials">
            <div className="container">
              <div className="section-heading text-center">
                <span className="section-tag">OUR CREDENTIALS</span>
                <h2>
                  Memberships, Associations &amp; <span>Certifications</span>
                </h2>
                <p>
                  We are associated with reputable organizations and certified bodies to ensure the highest standards of professionalism and ethics.
                </p>
              </div>

              <div className="credentials-grid">
                {accreditations.map((badge, idx) => (
                  <div key={badge.id || idx} className="credentials-card">
                    {badge.website ? (
                      <a
                        href={badge.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="badge-card"
                        title={badge.name || badge.alt || ''}
                      >
                        <img
                          src={normalizeImg(badge.img, '/assets/images/apdi.png')}
                          alt={badge.alt || badge.name}
                          className="badge-img"
                        />
                      </a>
                    ) : (
                      <div className="badge-card" title={badge.name || badge.alt || ''}>
                        <img
                          src={normalizeImg(badge.img, '/assets/images/apdi.png')}
                          alt={badge.alt || badge.name}
                          className="badge-img"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ================= 11. CYBER ATTACK SURFACE SIMULATOR PROBES ================= */}
        {sections.cyber_simulator !== false && (
          <section className="section tools-section cyber-tools-section" id="company">
            <div className="container">
              <div className="section-heading text-center">
                <span className="section-tag">DIAGNOSTICS</span>
                <h2>
                  Cyber Attack Surface <span>Simulator</span>
                </h2>
                <p>
                  Identify potential security exposures and evaluate your defense readiness across critical attack vectors.
                </p>
              </div>

              <div className="simulator-matrix-deck">
                {DEFAULT_SIMULATOR_TOOLS.map((tool, i) => (
                  <div key={i} className="simulator-probe-card" tabIndex="0">
                    <div className="probe-sweep-laser" aria-hidden="true"></div>

                    <div className="probe-card-header">
                      <div className="probe-terminal-meta">
                        <span className="probe-live-dot"></span>
                        <span className="probe-meta-text">PROBE 0{i + 1} // ACTIVE</span>
                      </div>
                      <span className="probe-vector-chip">{tool.tag}</span>
                    </div>

                    <div className="probe-icon-wrap">{tool.icon}</div>
                    <h3>{tool.title}</h3>
                    <p>{tool.desc}</p>

                    <div className="probe-card-footer">
                      <span className="probe-action-text">Run Diagnostic</span>
                      <span className="probe-reticle-arrow">➔</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ================= 12. FAQ (HELP CENTER) ================= */}
        {sections.cyber_faq !== false && (
          <section className="section ci-faq-section cyber-faq-section" id="faq">
            <div className="container">
              <div className="ci-faq-grid">
                <div className="ci-faq-left">
                  <span className="section-tag">
                    <span className="pulse-dot"></span>
                    HELP CENTER
                  </span>
                  <h2>
                    Frequently Asked <br />
                    <span className="ci-grad-text">Questions</span>
                  </h2>
                  <p>
                    Have questions regarding our cybersecurity assessments, penetration testing methodology, or compliance standards? Our security team is ready to assist.
                  </p>
                  <a href="#contact" className="btn primary-btn ci-faq-btn">
                    <span>Ask a Question</span>
                    <span className="btn-arrow" aria-hidden="true">➔</span>
                  </a>
                </div>

                <div className="ci-faq-list">
                  {faqs.map((faq, idx) => {
                    const isOpen = openFaq === idx;
                    return (
                      <div key={faq.id || idx} className={`ci-faq-item ${isOpen ? 'active ci-faq-open' : ''}`}>
                        <button
                          className="ci-faq-q"
                          type="button"
                          aria-expanded={isOpen ? 'true' : 'false'}
                          onClick={() => setOpenFaq(isOpen ? null : idx)}
                        >
                          <span>{faq.question || faq.q}</span>
                          <span
                            className="ci-faq-arrow"
                            style={{
                              transform: isOpen ? 'rotate(90deg)' : 'none',
                              transition: 'transform 0.25s ease',
                            }}
                          >
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </span>
                        </button>
                        {isOpen && (
                          <div className="ci-faq-a" style={{ display: 'block' }}>
                            <p>{faq.answer || faq.a}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ================= 13. CTA BANNER & CONTACT FORM ================= */}
        {sections.cyber_contact !== false && (
          <section className="contact-section" id="contact">
            <div className="container">
              <div className="cta-banner-box">
                <span className="section-tag">GET STARTED</span>
                <h2>
                  Ready to Strengthen Your <span>Cyber Defenses?</span>
                </h2>
                <p>
                  Partner with Cyber Kovai for certified penetration testing, cloud security hardening, and enterprise cyber resilience.
                </p>

                <div className="contact-buttons">
                  <a href={`tel:${settings.site_phone_tel || '+916382019821'}`} className="btn primary-btn">
                    Schedule Security Consultation ➔
                  </a>
                  <a href={`mailto:${settings.site_email || 'info@cyberkovai.com'}`} className="btn outline-btn">
                    Email Security Team
                  </a>
                </div>

                {/* Interactive Contact Form */}
                <div className="contact-form-wrapper" style={{ marginTop: '3rem', width: '100%', textAlign: 'left' }}>
                  <ContactForm
                    cyberServices={cyberServices}
                    initialService="Comprehensive VAPT Assessment"
                  />
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer settings={settings} />
      <LiveChatWidget settings={settings} />
    </>
  );
}
