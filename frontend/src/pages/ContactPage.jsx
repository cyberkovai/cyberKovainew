import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LiveChatWidget from '../components/LiveChatWidget';
import ContactForm from '../components/ContactForm';
import { getSettings, getSections, getCyberServices, getInvestigationServices } from '../api/client';
import { useTrack } from '../context/TrackContext';

export default function ContactPage() {
  const [settings, setSettings] = useState({});
  const [sections, setSections] = useState({});
  const [cyberServices, setCyberServices] = useState([]);
  const [invServices, setInvServices] = useState([]);
  const { activeTrack } = useTrack();

  useEffect(() => {
    getSettings().then(setSettings).catch(() => {});
    getSections().then(setSections).catch(() => {});
    getCyberServices().then(data => setCyberServices(Object.values(data))).catch(() => {});
    getInvestigationServices().then(setInvServices).catch(() => {});
  }, []);

  const homeUrl = activeTrack === 'cyber' ? '/digital-forensics?section=cyber' : '/cyber-intelligence?section=forensics';

  return (
    <>
      <Header settings={settings} />

      <main className="contact-page">
        {/* ================= HERO / BREADCRUMB ================= */}
        {sections.contact_hero !== false && (
          <section className="about-hero-header">
            <div className="container">
              <div className="breadcrumb">
                <Link to={homeUrl}>Home</Link> <span className="sep">/</span> <span className="current">Contact</span>
              </div>
              <h1 className="page-title">
                Get in Touch for a <span className="gradient-text">Confidential Consultation</span>
              </h1>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '640px', margin: '12px 0 0', fontSize: '1.05rem' }}>
                Speak directly with our senior cybersecurity specialists and certified digital forensic investigators. 100% strict client confidentiality guaranteed under non-disclosure protocols.
              </p>
            </div>
          </section>
        )}

        {/* ================= CONTACT SECTION & FORM ================= */}
        {sections.contact_form_section !== false && (
          <section className="contact-section" style={{ paddingTop: '40px' }}>
            <div className="container">
              <div className="cta-banner-box">
                <span className="section-tag">SECURE INQUIRY</span>

                <h2>
                  Ready to Protect Your <span>Digital Assets?</span>
                </h2>

                <p>
                  Whether you need proactive cyber threat defense or discreet digital forensic investigation, our specialists are ready to assist with fast, reliable, and actionable insights.
                </p>

                <div className="contact-buttons">
                  <a href={`tel:${settings.site_phone_tel || '+916382019821'}`} className="btn primary-btn">
                    Call Now: {settings.site_phone || '+91 63820 19821'} ➔
                  </a>
                  <a href={`mailto:${settings.site_email || 'info@cyberkovai.com'}`} className="btn outline-btn">
                    Email: {settings.site_email || 'info@cyberkovai.com'}
                  </a>
                </div>

                <ContactForm
                  cyberServices={cyberServices}
                  investigationServices={invServices}
                  initialService={activeTrack === 'cyber' ? 'General Cyber Security Consultation' : 'General Digital Investigation Consultation'}
                />
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

