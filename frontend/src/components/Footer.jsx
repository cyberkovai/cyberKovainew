import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTrack } from '../context/TrackContext';
import { getInvestigationServices, getCyberServices, getSections } from '../api/client';
import { getAssetUrl } from '../utils/assets';
import { isSectionVisible } from '../utils/sections';

export default function Footer({ settings = {}, sections: propSections }) {
  const { activeTrack } = useTrack();
  const [forensicsServices, setForensicsServices] = useState([]);
  const [cyberServices, setCyberServices] = useState([]);
  const [sections, setSections] = useState(propSections || {});

  useEffect(() => {
    if (propSections && Object.keys(propSections).length > 0) {
      setSections(propSections);
    } else {
      getSections().then((s) => s && setSections(s)).catch(() => {});
    }
  }, [propSections]);

  useEffect(() => {
    getInvestigationServices()
      .then((s) => {
        if (Array.isArray(s) && s.length > 0) {
          setForensicsServices(s.filter((svc) => svc.status === 'active' || svc.active));
        }
      })
      .catch(() => {});

    getCyberServices()
      .then((data) => {
        if (data && typeof data === 'object') {
          const list = Object.entries(data).map(([slug, s]) => ({
            slug: s.slug || slug,
            title: s.footer_name || s.nav_label || s.title || slug,
            category: s.category || 'application-security',
            status: s.status || 'active',
            active: s.active !== false && s.status !== 'inactive',
          })).filter(s => s.active);
          setCyberServices(list);
        }
      })
      .catch(() => {});
  }, []);

  const siteName = settings.site_name || 'Cyber Kovai';
  const siteLocation = settings.site_location || 'Coimbatore, Tamil Nadu, India';
  const sitePhone = settings.site_phone || '+91 63820 19821';
  const sitePhoneTel = settings.site_phone_tel || '+916382019821';
  const siteEmail = settings.site_email || 'info@cyberkovai.com';
  const showTeam = (settings.show_team !== false && settings.show_team !== 0 && settings.show_team !== '0') && isSectionVisible(sections, 'show_team');
  const showTestimonials = (settings.show_testimonials !== false && settings.show_testimonials !== 0 && settings.show_testimonials !== '0') && isSectionVisible(sections, 'show_testimonials');

  const homeUrl = activeTrack === 'cyber' ? '/cyber-security?section=cyber' : '/cyber-intelligence?section=forensics';
  const aboutUrl = `/about?section=${activeTrack}`;
  const teamUrl = `/team?section=${activeTrack}`;
  const contactUrl = `/contact?section=${activeTrack}`;
  const servicesUrl = activeTrack === 'cyber' ? '/cyber-security?section=cyber#services' : '/cyber-intelligence?section=forensics#ci-services';

  return (
    <footer className="footer">
      <div className="container footer-grid">
        {/* Brand Column */}
        <div className="footer-brand">
          <Link to="/" className="logo" title="Cyber Kovai Home">
            <img src={getAssetUrl('assets/images/logo.png')} alt={siteName} />
            <span>CYBER <strong>KOVAI</strong></span>
          </Link>

          {activeTrack === 'forensics' ? (
            <p>
              CyberKovai provides confidential digital investigation services, court-admissible digital forensics, OSINT threat intelligence, and fraud prevention for legal counsel, enterprises, and individuals.
            </p>
          ) : (
            <p>
              CyberKovai is an elite cybersecurity and intelligence consultancy delivering comprehensive penetration testing, cyber risk management, compliance auditing, and cloud security defense.
            </p>
          )}

          <div className="social-links">
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">in</a>
          </div>
        </div>

        {activeTrack === 'forensics' ? (
          <>
            {/* Quick Links Column */}
            <div className="footer-column">
              <h4>Quick Links</h4>
              <Link to={homeUrl}>Home</Link>
              <Link to={aboutUrl}>About Us</Link>
              {showTeam && <Link to={teamUrl}>Our Team</Link>}
              <a href="#ci-services">Services</a>
              {showTestimonials && <a href="#ci-testimonials">Testimonials</a>}
              <Link to={contactUrl}>Contact Us</Link>
            </div>

            {/* Forensics Services Column */}
            <div className="footer-column">
              <h4>Our Services</h4>
              {forensicsServices.length > 0 ? (
                forensicsServices.map((svc) => (
                  <Link
                    key={svc.slug || svc.id}
                    to={`/services/${svc.slug}?section=forensics`}
                    className="footer-service-link"
                  >
                    {svc.footer_name || svc.short || svc.title}
                  </Link>
                ))
              ) : (
                <>
                  <Link to="/services/corporate-background-verification-bgv?section=forensics">Corporate BGV Verification</Link>
                  <Link to="/services/cybercrime-victim-assistance-account-recovery?section=forensics">Victim Recovery &amp; Support</Link>
                  <Link to="/services/digital-investigations-osint?section=forensics">Digital OSINT Investigations</Link>
                  <Link to="/services/social-media-investigations-impersonation-removal?section=forensics">Social Media Takedown</Link>
                  <Link to="/services/cyber-fraud-investigation-support?section=forensics">Cyber Fraud &amp; Financial Scam</Link>
                  <Link to="/services/digital-evidence-preservation-forensics?section=forensics">Digital Evidence Forensics</Link>
                  <Link to="/services/executive-family-digital-protection?section=forensics">Executive Digital Protection</Link>
                  <Link to="/services/cybersecurity-awareness-lea-training?section=forensics">LEA &amp; Corporate Training</Link>
                  <Link to="/services/child-digital-safety-protection?section=forensics">Child Digital Safety Support</Link>
                </>
              )}
            </div>

            {/* Contact Information Column */}
            <div className="footer-column">
              <h4>Contact Information</h4>
              <p className="reach-item">📍 {siteLocation}</p>
              <p className="reach-item">📞 <a href={`tel:${sitePhoneTel}`} style={{ color: 'inherit', textDecoration: 'none' }}>{sitePhone}</a></p>
              <p className="reach-item">✉️ <a href={`mailto:${siteEmail}`} style={{ color: 'inherit', textDecoration: 'none' }}>{siteEmail}</a></p>
              <div style={{ marginTop: '0.75rem' }}>
                <Link to={contactUrl} className="btn primary-btn" style={{ padding: '9px 18px', fontSize: '11px', letterSpacing: '0.05em', color: '#ffffff', minWidth: '140px', minHeight: '40px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#ffffff', fontWeight: 700 }}>ENQUIRE NOW ➔</span>
                </Link>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Cyber Navigation Column */}
            <div className="footer-column">
              <h4>NAVIGATION</h4>
              <Link to={homeUrl}>Home</Link>
              <Link to={aboutUrl}>About Us</Link>
              {showTeam && <Link to={teamUrl}>Our Team</Link>}
              <Link to="/cyber-security?section=cyber">Cyber Security</Link>
              <Link to="/cyber-intelligence?section=forensics">Digital Forensics</Link>
              <a href="#services">Services</a>
              <Link to={contactUrl}>Contact &amp; Consultation</Link>
            </div>

            {/* App & Network Sec Column */}
            <div className="footer-column">
              <h4>APP &amp; NETWORK SEC</h4>
              {cyberServices.filter(s => s.category === 'application-security' || s.category === 'network-security').length > 0 ? (
                cyberServices
                  .filter(s => s.category === 'application-security' || s.category === 'network-security')
                  .map(svc => (
                    <Link key={svc.slug} to={`/services/${svc.slug}`} className="footer-service-link">
                      {svc.title}
                    </Link>
                  ))
              ) : (
                <>
                  <Link to="/services/vulnerability-assessment-penetration-testing">Comprehensive VAPT</Link>
                  <Link to="/services/web-application-penetration-testing">Web App Security Testing</Link>
                  <Link to="/services/mobile-app-penetration-testing">Mobile App Security</Link>
                  <Link to="/services/api-penetration-testing">REST &amp; GraphQL API Testing</Link>
                  <Link to="/services/network-penetration-testing">Network Pen Testing</Link>
                  <Link to="/services/ai-security">AI Security &amp; LLM Auditing</Link>
                  <Link to="/services/firewall-security-audit">Firewall Perimeter Audit</Link>
                </>
              )}
            </div>

            {/* Cloud & Enterprise Column */}
            <div className="footer-column">
              <h4>CLOUD &amp; ENTERPRISE</h4>
              {cyberServices.filter(s => s.category === 'cloud-security' || s.category === 'enterprise-security' || (s.category !== 'application-security' && s.category !== 'network-security')).length > 0 ? (
                cyberServices
                  .filter(s => s.category === 'cloud-security' || s.category === 'enterprise-security' || (s.category !== 'application-security' && s.category !== 'network-security'))
                  .map(svc => (
                    <Link key={svc.slug} to={`/services/${svc.slug}`} className="footer-service-link">
                      {svc.title}
                    </Link>
                  ))
              ) : (
                <>
                  <Link to="/services/cloud-configuration-review">Cloud Security Posture (CSPM)</Link>
                  <Link to="/services/cloud-application-security-assessment-casa">Cloud CASA Assessment</Link>
                  <Link to="/services/cloud-container-security">Container &amp; K8s Security</Link>
                  <Link to="/services/aws-server-hardening">AWS &amp; Azure Cloud Hardening</Link>
                  <Link to="/services/virtual-ciso-services">Virtual CISO (vCISO) Advisory</Link>
                  <Link to="/services/erp-security-audit-assessment">Enterprise ERP &amp; SAP Audit</Link>
                </>
              )}
            </div>

            {/* Reach Us Column */}
            <div className="footer-column">
              <h4>REACH US</h4>
              <p className="reach-item">📍 {siteLocation}</p>
              <p className="reach-item">📞 <a href={`tel:${sitePhoneTel}`} style={{ color: 'inherit', textDecoration: 'none' }}>{sitePhone}</a></p>
              <p className="reach-item">✉️ <a href={`mailto:${siteEmail}`} style={{ color: 'inherit', textDecoration: 'none' }}>{siteEmail}</a></p>
              <div style={{ marginTop: '0.85rem' }}>
                <Link to={contactUrl} className="btn primary-btn" style={{ padding: '10px 20px', fontSize: '12.5px', fontWeight: 700, letterSpacing: '0.05em', borderRadius: '50px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', minWidth: '160px', minHeight: '44px' }}>
                  <span style={{ color: '#ffffff', fontWeight: 700 }}>SCHEDULE AUDIT ➔</span>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Global Service Areas Bar */}
      {isSectionVisible(sections, 'global_service_areas') && (
        <div className="container service-areas-bar">
          <h4>SERVICE COVERAGE</h4>
          <p><strong>India Hub:</strong> Coimbatore, Chennai, Bengaluru, Hyderabad, Mumbai, Delhi, Pune, and all major tech corridors.</p>
          <p><strong>Global Delivery:</strong> UAE (Abu Dhabi, Dubai), Saudi Arabia, Singapore, Australia, Germany, Canada, and US.</p>
        </div>
      )}

      {/* Footer Bottom Bar */}
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} {siteName}. All Rights Reserved.</p>
        <div className="footer-legal-links" role="navigation" aria-label="Legal policies">
          <Link to="/privacy-policy" title="Privacy Policy">Privacy Policy</Link>
          <span>|</span>
          <Link to="/terms-conditions" title="Terms & Conditions">Terms &amp; Conditions</Link>
          <span>|</span>
          <Link to="/security-disclosure" title="Security & Vulnerability Disclosure">Security Disclosure</Link>
        </div>
      </div>
    </footer>
  );
}

