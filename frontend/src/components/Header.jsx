import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTrack } from '../context/TrackContext';
import { getInvestigationServices, getCyberServices } from '../api/client';
import { getAssetUrl } from '../utils/assets';

const DEFAULT_CYBER_MENU = {
  'application-security': {
    title: 'Application Security',
    services: [
      { slug: 'vulnerability-assessment-penetration-testing', title: 'Vulnerability Assessment & Pen Testing (VAPT)' },
      { slug: 'web-application-penetration-testing', title: 'Web Application Penetration Testing' },
      { slug: 'mobile-app-penetration-testing', title: 'Mobile App Penetration Testing' },
      { slug: 'api-penetration-testing', title: 'API Penetration Testing' },
      { slug: 'secure-source-code-review', title: 'Secure Source Code Review' },
      { slug: 'ecommerce-security', title: 'E-Commerce Security' },
      { slug: 'saas-security', title: 'SaaS Security Assessment' },
      { slug: 'devsecops', title: 'DevSecOps Pipeline Security' },
      { slug: 'ai-security', title: 'AI Security & LLM Auditing' },
    ],
  },
  'network-security': {
    title: 'Network Security',
    services: [
      { slug: 'network-penetration-testing', title: 'Network Penetration Testing' },
      { slug: 'wireless-penetration-testing', title: 'Wireless Penetration Testing' },
      { slug: 'firewall-security-audit', title: 'Firewall Security Audit' },
    ],
  },
  'cloud-security': {
    title: 'Cloud Security',
    services: [
      { slug: 'cloud-configuration-review', title: 'Cloud Security Posture (CSPM)' },
      { slug: 'cloud-application-security-assessment-casa', title: 'Cloud CASA Assessment' },
      { slug: 'cloud-container-security', title: 'Container & Kubernetes Security' },
      { slug: 'gcp-server-hardening', title: 'GCP Server Hardening' },
      { slug: 'aws-server-hardening', title: 'AWS Server Hardening' },
      { slug: 'azure-server-hardening', title: 'Azure Server Hardening' },
    ],
  },
  'enterprise-security': {
    title: 'Enterprise Security',
    services: [
      { slug: 'virtual-ciso-services', title: 'Virtual CISO (vCISO) Advisory' },
      { slug: 'black-box-testing', title: 'Black Box Penetration Testing' },
      { slug: 'email-security-audit', title: 'Email Security Audit' },
      { slug: 'server-hardening', title: 'Enterprise Server Hardening' },
      { slug: 'microsoft-365-security', title: 'Microsoft 365 Security Audit' },
      { slug: 'erp-security-audit-assessment', title: 'ERP & SAP Security Audit' },
      { slug: 'security-architecture-review', title: 'Security Architecture Review' },
      { slug: 'wordpress-security', title: 'WordPress Security Hardening' },
    ],
  },
};

export default function Header({ settings = {} }) {
  const { activeTrack } = useTrack();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const [aboutDropdownOpen, setAboutDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [forensicsNavServices, setForensicsNavServices] = useState([]);
  const [cyberNavServices, setCyberNavServices] = useState(null);

  const siteName = settings.site_name || 'Cyber Kovai';
  const siteEmail = settings.site_email || 'info@cyberkovai.com';
  const sitePhone = settings.site_phone || '+91 63820 19821';
  const sitePhoneTel = settings.site_phone_tel || '+916382019821';
  const showTeam = settings.show_team !== false && settings.show_team !== 0 && settings.show_team !== '0';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load both forensics and cyber services dynamically for the navbar dropdowns
  useEffect(() => {
    getInvestigationServices()
      .then((services) => {
        if (Array.isArray(services) && services.length > 0) {
          setForensicsNavServices(services.filter((s) => s.status === 'active' || s.active));
        }
      })
      .catch(() => { });

    getCyberServices()
      .then((services) => {
        if (services && typeof services === 'object' && Object.keys(services).length > 0) {
          const list = Object.entries(services).map(([slug, s]) => ({
            slug: s.slug || slug,
            title: s.nav_label || s.title || slug,
            category: s.category || 'application-security',
            status: s.status || 'active',
            active: s.active !== false && s.status !== 'inactive',
          })).filter(s => s.active);
          setCyberNavServices(list);
        }
      })
      .catch(() => { });
  }, []);

  // Compute grouped cyber columns dynamically
  const cyberColumns = useMemo(() => {
    if (!cyberNavServices || cyberNavServices.length === 0) {
      return DEFAULT_CYBER_MENU;
    }

    const grouped = {
      'application-security': { title: 'Application Security', services: [] },
      'network-security': { title: 'Network Security', services: [] },
      'cloud-security': { title: 'Cloud Security', services: [] },
      'enterprise-security': { title: 'Enterprise Security', services: [] },
    };

    cyberNavServices.forEach((svc) => {
      const cat = svc.category || 'application-security';
      if (!grouped[cat]) {
        grouped[cat] = {
          title: cat.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          services: [],
        };
      }
      grouped[cat].services.push(svc);
    });

    return grouped;
  }, [cyberNavServices]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
    setServicesDropdownOpen(false);
    setAboutDropdownOpen(false);
  }, [location]);

  // URLs depending on track
  const homeUrl = activeTrack === 'cyber' ? '/digital-forensics?section=cyber' : '/cyber-intelligence?section=forensics';
  const servicesUrl = activeTrack === 'cyber' ? '/digital-forensics?section=cyber#services' : '/cyber-intelligence?section=forensics#ci-services';
  const aboutUrl = `/about?section=${activeTrack}`;
  const teamUrl = `/team?section=${activeTrack}`;
  const contactUrl = `/contact?section=${activeTrack}`;

  const isHomeActive = location.pathname === '/' ||
    (activeTrack === 'cyber' && location.pathname.includes('digital-forensics')) ||
    (activeTrack === 'forensics' && location.pathname.includes('cyber-intelligence'));
  const isServicesActive = location.pathname.includes('/services');
  const isAboutActive = location.pathname.includes('/about');
  const isTeamActive = location.pathname.includes('/team');
  const isContactActive = location.pathname.includes('/contact');

  return (
    <header className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`} id="siteNavbar">
      <div className="container nav-container">
        <Link to="/" className="logo" title="Cyber Kovai - Selection Portal">
          <img src={getAssetUrl('assets/images/logo.png')} alt={siteName} />
          <span>CYBER <strong>KOVAI</strong></span>
        </Link>

        {/* Mobile Navigation Drawer & Desktop Menu */}
        <nav className={`nav-menu ${mobileOpen ? 'active' : ''}`} id="navMenu">
          {/* Mobile Drawer Top Bar */}
          <div className="mobile-drawer-header">
            <Link to="/" className="mobile-drawer-brand" title={siteName} onClick={() => setMobileOpen(false)}>
              <img src={getAssetUrl('assets/images/logo.png')} alt={siteName} />
              <span>CYBER <strong>KOVAI</strong></span>
            </Link>
            <button
              type="button"
              className="mobile-drawer-close"
              id="mobileDrawerClose"
              aria-label="Close navigation menu"
              onClick={() => setMobileOpen(false)}
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* 1. HOME */}
          <Link to={homeUrl} className={`nav-main-link ${isHomeActive ? 'active' : ''}`}>
            Home
          </Link>

          {/* 2. SERVICES MEGA DROPDOWN */}
          {activeTrack === 'cyber' ? (
            <div className={`nav-item has-dropdown services-nav-item ${isServicesActive ? 'active' : ''} ${servicesDropdownOpen ? 'open' : ''}`} id="servicesNavItem">
              <a
                href={servicesUrl}
                className="nav-link dropdown-toggle"
                id="servicesDropdownBtn"
                onClick={(e) => {
                  if (window.innerWidth <= 991) {
                    e.preventDefault();
                    setServicesDropdownOpen(!servicesDropdownOpen);
                  }
                }}
              >
                <span>Services</span>
                <span className="nav-arrow" aria-hidden="true">➔</span>
              </a>

              <div className="mega-dropdown" id="servicesMegaMenu">
                <div className="mega-dropdown-inner">
                  {Object.entries(cyberColumns).map(([catKey, col]) => (
                    <div className="mega-col-group" key={catKey}>
                      <div className="mega-category-block" data-category={catKey}>
                        <div className="mega-cat-header">
                          <h4 className="mega-col-title">{col.title}</h4>
                          <span className="mega-cat-arrow" aria-hidden="true">➔</span>
                        </div>
                        <ul className="mega-links-list">
                          {col.services.map((svc) => (
                            <li key={svc.slug} className="submodule-item">
                              <Link to={`/services/${svc.slug}`}>{svc.title}</Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Digital Investigation & Forensics Dropdown */
            <div className={`nav-item has-dropdown services-nav-item ${isServicesActive ? 'active' : ''} ${servicesDropdownOpen ? 'open' : ''}`} id="servicesNavItem">
              <a
                href={servicesUrl}
                className="nav-link dropdown-toggle"
                id="servicesDropdownBtn"
                onClick={(e) => {
                  if (window.innerWidth <= 991) {
                    e.preventDefault();
                    setServicesDropdownOpen(!servicesDropdownOpen);
                  }
                }}
              >
                <span>Services</span>
                <span className="nav-arrow" aria-hidden="true">➔</span>
              </a>

              <div className="mega-dropdown forensics-mega-dropdown" id="servicesMegaMenu">
                <ul className="mega-links-list forensics-links-list">
                  {forensicsNavServices.length > 0 ? (
                    forensicsNavServices.map((svc) => (
                      <li key={svc.slug || svc.id} className="submodule-item">
                        <Link to={`/services/${svc.slug}?section=forensics`}>{svc.title}</Link>
                      </li>
                    ))
                  ) : (
                    <>
                      <li className="submodule-item"><Link to="/services/corporate-background-verification-bgv?section=forensics">Corporate Background Verification (BGV)</Link></li>
                      <li className="submodule-item"><Link to="/services/cybercrime-victim-assistance-account-recovery?section=forensics">Cybercrime Victim Assistance &amp; Account Recovery</Link></li>
                      <li className="submodule-item"><Link to="/services/digital-investigations-osint?section=forensics">Digital Investigations &amp; OSINT Intelligence</Link></li>
                      <li className="submodule-item"><Link to="/services/social-media-investigations-impersonation-removal?section=forensics">Social Media Impersonation Removal &amp; Investigations</Link></li>
                      <li className="submodule-item"><Link to="/services/cyber-fraud-investigation-support?section=forensics">Cyber Fraud &amp; Financial Scam Investigation</Link></li>
                      <li className="submodule-item"><Link to="/services/digital-evidence-preservation-forensics?section=forensics">Digital Evidence Preservation &amp; Forensics</Link></li>
                      <li className="submodule-item"><Link to="/services/executive-family-digital-protection?section=forensics">Executive &amp; Family Digital Protection</Link></li>
                      <li className="submodule-item"><Link to="/services/cybersecurity-awareness-lea-training?section=forensics">Cybersecurity Awareness &amp; LEA Advisory</Link></li>
                      <li className="submodule-item"><Link to="/services/child-digital-safety-protection?section=forensics">Child Digital Safety &amp; Parental Cyber Support</Link></li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* 3. ABOUT */}
          {showTeam ? (
            <div className={`nav-item has-dropdown about-nav-item ${(isAboutActive || isTeamActive) ? 'active' : ''} ${aboutDropdownOpen ? 'open' : ''}`} id="aboutNavItem">
              <Link
                to={aboutUrl}
                className="nav-link dropdown-toggle"
                id="aboutDropdownBtn"
                onClick={(e) => {
                  if (window.innerWidth <= 991) {
                    e.preventDefault();
                    setAboutDropdownOpen(!aboutDropdownOpen);
                  }
                }}
              >
                <span>{activeTrack === 'forensics' ? 'About Us' : 'About'}</span>
                <svg className="dropdown-arrow-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="6,9 12,15 18,9" /></svg>
                <span className="nav-arrow" aria-hidden="true">➔</span>
              </Link>
              <div className="about-dropdown" id="aboutMegaMenu">
                <ul className="mega-links-list about-links-list">
                  <li className="submodule-item">
                    <Link to={aboutUrl} className={isAboutActive ? 'active' : ''}>
                      {activeTrack === 'forensics' ? 'About Us' : 'About CyberKovai'}
                    </Link>
                  </li>
                  <li className="submodule-item">
                    <Link to={teamUrl} className={isTeamActive ? 'active' : ''}>
                      Our Team
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <Link to={aboutUrl} className={`nav-main-link ${isAboutActive ? 'active' : ''}`}>
              {activeTrack === 'forensics' ? 'About Us' : 'About'}
            </Link>
          )}

          {/* 4. CONTACT */}
          <Link to={contactUrl} className={`nav-main-link ${isContactActive ? 'active' : ''}`}>
            {activeTrack === 'forensics' ? 'Contact Us' : 'Contact'}
          </Link>

          {/* QUICK CONTACT SECTION IN MOBILE DRAWER */}
          <div className="mobile-drawer-quick-contact">
            <div className="quick-contact-header">
              <h4 className="quick-contact-title">Quick Contact</h4>
              <p className="quick-contact-subtitle">Talk to our team</p>
            </div>

            <a href={`mailto:${siteEmail}`} className="qc-card qc-card-email">
              <span className="qc-label">Email</span>
              <span className="qc-value">{siteEmail}</span>
            </a>

            <a href={`tel:${sitePhoneTel}`} className="qc-card qc-card-phone">
              <span className="qc-label">Phone</span>
              <span className="qc-value">{sitePhone}</span>
            </a>

            <div className="qc-bottom-row">
              <div className="qc-social-card">
                <span className="qc-label">Social</span>
                <div className="qc-social-icons">
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45c-.88 0-1.6.72-1.6 1.6s.72 1.6 1.6 1.6 1.6-.72 1.6-1.6-.72-1.6-1.6-1.6Z" /></svg>
                  </a>
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                  </a>
                </div>
              </div>

              <Link to={contactUrl} className="qc-cta-button" onClick={() => setMobileOpen(false)}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" /></svg>
                <span>Message</span>
              </Link>
            </div>
          </div>
        </nav>

        {/* Action button & Mobile Hamburger */}
        <div className="nav-actions">
          <Link to={contactUrl} className="nav-button">
            {activeTrack === 'forensics' ? 'Confidential Consultation' : 'Consult Our Experts'}
          </Link>
          <button
            className="menu-toggle"
            id="menuToggle"
            aria-label="Toggle Menu"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            ☰
          </button>
        </div>
      </div>
    </header>
  );
}

