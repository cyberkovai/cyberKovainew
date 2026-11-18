import React, { useState, useEffect, useRef } from 'react';
import { submitContact, getCyberServices, getInvestigationServices } from '../api/client';
import { useTrack } from '../context/TrackContext';

const EMPTY_SERVICES_ARRAY = [];

export default function ContactForm({
  cyberServices = EMPTY_SERVICES_ARRAY,
  investigationServices = EMPTY_SERVICES_ARRAY,
  initialService = '',
}) {
  const { activeTrack } = useTrack();
  const [fetchedCyberServices, setFetchedCyberServices] = useState([]);
  const [fetchedInvServices, setFetchedInvServices] = useState([]);

  const cyberFetchedRef = useRef(false);
  const invFetchedRef = useRef(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: initialService || (activeTrack === 'cyber' ? 'General Cyber Security Consultation' : 'General Digital Investigation Consultation'),
    service_other: '',
    message: '',
    website: '', // honeypot
    hp_time: '',
  });

  useEffect(() => {
    if (initialService) {
      setFormData(prev => ({ ...prev, service: initialService }));
    }
  }, [initialService]);

  useEffect(() => {
    if ((!cyberServices || cyberServices.length === 0) && !cyberFetchedRef.current) {
      cyberFetchedRef.current = true;
      getCyberServices()
        .then((data) => {
          if (data && typeof data === 'object') {
            const list = Object.values(data).filter(s => s && s.active !== false && s.status !== 'inactive');
            setFetchedCyberServices(list);
          }
        })
        .catch(() => {});
    }
  }, [cyberServices?.length]);

  useEffect(() => {
    if ((!investigationServices || investigationServices.length === 0) && !invFetchedRef.current) {
      invFetchedRef.current = true;
      getInvestigationServices()
        .then((list) => {
          if (Array.isArray(list)) {
            setFetchedInvServices(list.filter(s => s && s.active !== false && s.status !== 'inactive'));
          }
        })
        .catch(() => {});
    }
  }, [investigationServices?.length]);

  const effectiveCyberServices = (cyberServices && cyberServices.length > 0) ? cyberServices : fetchedCyberServices;
  const effectiveInvServices = (investigationServices && investigationServices.length > 0) ? investigationServices : fetchedInvServices;

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: '' }

  const isOtherSelected = formData.service.toLowerCase().startsWith('other');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    setLoading(true);

    try {
      let recaptchaToken = '';
      if (window.grecaptcha && typeof window.grecaptcha.getResponse === 'function') {
        recaptchaToken = window.grecaptcha.getResponse();
      }

      const payload = {
        ...formData,
        'g-recaptcha-response': recaptchaToken,
      };

      const res = await submitContact(payload);
      if (res && res.success) {
        setStatus({
          type: 'success',
          message: res.message || 'Thank you! Your confidential enquiry has been received and recorded. Our team will contact you shortly.',
        });
        setFormData({
          name: '',
          email: '',
          phone: '',
          service: activeTrack === 'cyber' ? 'General Cyber Security Consultation' : 'General Digital Investigation Consultation',
          service_other: '',
          message: '',
          website: '',
          hp_time: '',
        });
        if (window.grecaptcha && typeof window.grecaptcha.reset === 'function') {
          window.grecaptcha.reset();
        }
      } else {
        setStatus({
          type: 'error',
          message: res?.message || 'Unable to record lead. Please try again.',
        });
      }
    } catch (err) {
      setStatus({
        type: 'error',
        message: err.response?.data?.message || err.message || 'An error occurred during submission. Please check your network and try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-form-wrapper" style={{ marginTop: '3rem', width: '100%', textAlign: 'left' }}>
      <form id="contactForm" onSubmit={handleSubmit}>
        {/* Spam Honeypot (hidden from human visitors) */}
        <div style={{ display: 'none' }} aria-hidden="true">
          <input
            type="text"
            name="website"
            value={formData.website}
            onChange={handleChange}
            tabIndex="-1"
            autoComplete="off"
          />
          <input
            type="text"
            name="hp_time"
            value={formData.hp_time}
            onChange={handleChange}
            tabIndex="-1"
            autoComplete="off"
          />
        </div>

        {status && (
          <div
            id="formResponse"
            style={{
              display: 'block',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              fontWeight: 500,
              backgroundColor: status.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${status.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
              color: status.type === 'success' ? '#10b981' : '#ef4444',
            }}
          >
            {status.message}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.2rem', marginBottom: '1.2rem' }}>
          <div>
            <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.9 }}>
              Your Name / Pseudonym *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.9rem 1.1rem', borderRadius: '10px', fontFamily: 'inherit' }}
            />
          </div>
          <div>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.9 }}>
              Secure Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              placeholder="john@example.com"
              value={formData.email}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.9rem 1.1rem', borderRadius: '10px', fontFamily: 'inherit' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.2rem', marginBottom: '1.2rem', alignItems: 'start' }}>
          <div>
            <label htmlFor="phone" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.9 }}>
              Phone / WhatsApp / Signal *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              placeholder="+91 63820 19821"
              value={formData.phone}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.9rem 1.1rem', borderRadius: '10px', fontFamily: 'inherit' }}
            />
          </div>
          <div>
            <label htmlFor="service" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.9 }}>
              Service Required *
            </label>
            <select
              id="service"
              name="service"
              required
              value={formData.service}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.9rem 1.1rem', borderRadius: '10px', fontFamily: 'inherit', background: '#0e0c20', color: '#fff' }}
            >
              {activeTrack === 'cyber' ? (
                <>
                  <option value="General Cyber Security Consultation">General Cyber Security Consultation</option>
                  {Array.isArray(effectiveCyberServices) && effectiveCyberServices.map((svc) => (
                    <option key={svc.slug || svc.title} value={svc.title}>{svc.title}</option>
                  ))}
                  {(!effectiveCyberServices || effectiveCyberServices.length === 0) && (
                    <>
                      <option value="Vulnerability Assessment & Pen Testing (VAPT)">Vulnerability Assessment & Pen Testing (VAPT)</option>
                      <option value="Web Application Penetration Testing">Web Application Penetration Testing</option>
                      <option value="Mobile App Penetration Testing">Mobile App Penetration Testing</option>
                      <option value="Network Penetration Testing">Network Penetration Testing</option>
                      <option value="Cloud Security Posture (CSPM)">Cloud Security Posture (CSPM)</option>
                      <option value="Virtual CISO (vCISO) Advisory">Virtual CISO (vCISO) Advisory</option>
                    </>
                  )}
                </>
              ) : (
                <>
                  <option value="General Digital Investigation Consultation">General Digital Investigation Consultation</option>
                  {Array.isArray(effectiveInvServices) && effectiveInvServices.map((svc) => (
                    <option key={svc.slug || svc.title} value={svc.title}>{svc.title}</option>
                  ))}
                  {(!effectiveInvServices || effectiveInvServices.length === 0) && (
                    <>
                      <option value="Corporate Background Verification (BGV)">Corporate Background Verification (BGV)</option>
                      <option value="Digital Forensics & Incident Response">Digital Forensics & Incident Response</option>
                      <option value="OSINT Threat Intelligence & Asset Tracing">OSINT Threat Intelligence & Asset Tracing</option>
                      <option value="Cyber Fraud & Financial Scam Investigation">Cyber Fraud & Financial Scam Investigation</option>
                      <option value="Executive & Family Digital Protection">Executive & Family Digital Protection</option>
                    </>
                  )}
                </>
              )}
              <option value="Other">Other / Specialized Scope</option>
            </select>

            {isOtherSelected && (
              <div style={{ marginTop: '0.75rem' }}>
                <input
                  type="text"
                  name="service_other"
                  placeholder="Specify custom security requirement..."
                  value={formData.service_other}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '8px', fontFamily: 'inherit' }}
                />
              </div>
            )}
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="message" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.9 }}>
            Confidential Details / Scope Overview *
          </label>
          <textarea
            id="message"
            name="message"
            rows="4"
            required
            placeholder="Please detail your target systems, suspected incidents, or investigation objectives..."
            value={formData.message}
            onChange={handleChange}
            style={{ width: '100%', padding: '0.9rem 1.1rem', borderRadius: '10px', fontFamily: 'inherit', resize: 'vertical' }}
          ></textarea>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <button
            type="submit"
            className="btn primary-btn"
            disabled={loading}
            style={{ padding: '12px 28px', fontSize: '14px', letterSpacing: '0.05em', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            <span>{loading ? 'TRANSMITTING ENQUIRY...' : 'REQUEST CONFIDENTIAL CONSULTATION ➔'}</span>
          </button>
          <span style={{ fontSize: '0.8rem', opacity: 0.65 }}>
            🔒 Strictly Protected Under NDA &amp; Attorney-Client Privilege Protocols
          </span>
        </div>
      </form>
    </div>
  );
}

