import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LiveChatWidget from '../components/LiveChatWidget';
import ContactForm from '../components/ContactForm';
import { getSettings, getSections, getCyberServices, getInvestigationServices } from '../api/client';
import { useTrack } from '../context/TrackContext';
import { isSectionVisible } from '../utils/sections';

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

  return (
    <>
      <Header settings={settings} />

      <main className="contact-page">
        {/* ================= HERO HEADER ================= */}
        {isSectionVisible(sections, 'contact_hero') && (
          <section className="contact-page-hero">
            <div className="container">
              <h1 className="contact-hero-title">
                Get in Touch for a <span className="contact-title-gradient">Confidential Consultation</span>
              </h1>
              <p className="contact-hero-subtitle">
                Speak directly with our senior cybersecurity specialists and certified digital forensic investigators. 100% strict client confidentiality guaranteed under non-disclosure protocols.
              </p>
            </div>
          </section>
        )}

        {/* ================= CONTACT CARD & FORM ================= */}
        {isSectionVisible(sections, 'contact_form_section') && (
          <section className="contact-page-body">
            <div className="container">
              <div className="contact-card-box">
                <span className="contact-card-tag">SECURE INQUIRY</span>

                <h2 className="contact-card-title">
                  Ready to Protect Your Digital Assets?
                </h2>

                <p className="contact-card-desc">
                  Whether you need proactive cyber threat defense or discreet digital forensic investigation, our specialists are ready to assist with fast, reliable, and actionable insights.
                </p>

                <div className="contact-card-buttons">
                  <a href={`tel:${settings.site_phone_tel || '+916382019821'}`} className="contact-card-call-btn">
                    Call Now: {settings.site_phone || '+91 63820 19821'} ➔
                  </a>
                  <a href={`mailto:${settings.site_email || 'info@cyberkovai.com'}`} className="contact-card-email-btn">
                    Email: {settings.site_email || 'info@cyberkovai.com'}
                  </a>
                </div>

                <ContactForm
                  cyberServices={cyberServices}
                  investigationServices={invServices}
                  initialService={activeTrack === 'cyber' ? 'General Cyber Security Consultation' : 'General Digital Investigation Consultation'}
                  submitText="Submit Confidential Request ➔"
                />
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

