import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LiveChatWidget from '../components/LiveChatWidget';
import RecaptchaField from '../components/RecaptchaField';
import {
  getSettings,
  getSections,
  getFullService,
  submitContact,
  getCyberServices,
  getInvestigationServices,
} from '../api/client';
import { useTrack } from '../context/TrackContext';
import { getAssetUrl } from '../utils/assets';
import { isSectionVisible } from '../utils/sections';

function resolveImage(src) {
  return getAssetUrl(src);
}

export default function ServiceDetailPage() {
  const { slug } = useParams();
  const cleanSlug = (slug || '').replace(/\.php$/, '');
  const { activeTrack } = useTrack();

  const [settings, setSettings] = useState({});
  const [sections, setSections] = useState({});
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);
  const recaptchaRef = useRef(null);
  const [recaptchaToken, setRecaptchaToken] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    service_other: '',
    message: '',
    website: '',
    hp_time: '',
  });
  const [formStatus, setFormStatus] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [trackServices, setTrackServices] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setOpenFaq(null);

    getSettings().then((s) => !cancelled && s && setSettings(s)).catch(() => { });
    getSections().then((s) => !cancelled && s && setSections(s)).catch(() => { });

    getFullService(cleanSlug)
      .then((res) => {
        if (cancelled || !res) return;
        setData(res);
        setForm((prev) => ({ ...prev, service: res.service.title }));

        const isForensicsCat = res.categorySlug === 'digital-investigations' || activeTrack === 'forensics';
        if (isForensicsCat) {
          getInvestigationServices()
            .then((list) => {
              if (!cancelled && Array.isArray(list)) {
                setTrackServices(list.filter(s => s.active !== false && s.status !== 'inactive').map(s => s.title));
              }
            })
            .catch(() => { });
        } else {
          getCyberServices()
            .then((obj) => {
              if (!cancelled && obj && typeof obj === 'object') {
                setTrackServices(Object.values(obj).filter(s => s.active !== false && s.status !== 'inactive').map(s => s.title));
              }
            })
            .catch(() => { });
        }
      })
      .catch(() => !cancelled && setData(null))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [cleanSlug, activeTrack]);

  // Match PHP: a freshly loaded service page starts at the top.
  useEffect(() => {
    if (!window.location.hash) window.scrollTo(0, 0);
  }, [cleanSlug]);

  const service = data?.service;
  const category = data?.category || {};
  const related = Array.isArray(data?.related) ? data.related : [];
  const categorySlug = data?.categorySlug || service?.category || 'application-security';

  const isVisible = (key) => isSectionVisible(sections, key);

  const activeSection = useMemo(() => {
    if (categorySlug === 'digital-investigations') return 'forensics';
    return activeTrack === 'forensics' ? 'forensics' : 'cyber';
  }, [categorySlug, activeTrack]);

  const homeUrl = activeSection === 'cyber'
    ? '/digital-forensics?section=cyber'
    : '/cyber-intelligence?section=forensics';
  const servicesUrl = activeSection === 'cyber'
    ? '/digital-forensics?section=cyber#services'
    : '/cyber-intelligence?section=forensics#ci-services';
  const breadcrumbServicesUrl = categorySlug === 'digital-investigations'
    ? '/cyber-intelligence?section=forensics#ci-services'
    : servicesUrl;

  const sitePhone = settings.site_phone || '+91 63820 19821';
  const sitePhoneTel = settings.site_phone_tel || '+916382019821';

  const isOtherSelected = form.service.toLowerCase().startsWith('other');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormStatus(null);
    setFormLoading(true);

    try {
      let token = recaptchaToken;
      if (!token && recaptchaRef.current) {
        token = recaptchaRef.current.getResponse();
      }
      if (!token && window.grecaptcha && typeof window.grecaptcha.getResponse === 'function') {
        token = window.grecaptcha.getResponse();
      }

      const res = await submitContact({
        ...form,
        'g-recaptcha-response': token,
      });

      if (res && res.success) {
        setFormStatus({
          type: 'success',
          message: res.message || 'Thank you! Your confidential enquiry has been received and recorded. Our team will contact you shortly.',
        });
        setForm((prev) => ({
          ...prev,
          name: '',
          email: '',
          phone: '',
          service_other: '',
          message: '',
          website: '',
          hp_time: '',
        }));
        setRecaptchaToken('');
        if (recaptchaRef.current) {
          recaptchaRef.current.reset();
        } else if (window.grecaptcha && typeof window.grecaptcha.reset === 'function') {
          window.grecaptcha.reset();
        }
      } else {
        setFormStatus({
          type: 'error',
          message: res?.message || 'Unable to record lead. Please try again.',
        });
      }
    } catch (err) {
      setFormStatus({
        type: 'error',
        message: err.response?.data?.message || err.message || 'An error occurred during submission. Please check your network and try again.',
      });
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header settings={settings} />
        <main className="service-detail-page" style={{ padding: '8rem 0', textAlign: 'center' }}>
          <div className="container">
            <h2 style={{ color: '#fff' }}>Loading Service Specification...</h2>
          </div>
        </main>
        <Footer settings={settings} />
        <LiveChatWidget settings={settings} />
      </>
    );
  }

  if (!service) {
    return (
      <>
        <Header settings={settings} />
        <main className="service-detail-page" style={{ padding: '8rem 0', textAlign: 'center' }}>
          <div className="container">
            <h1 style={{ color: '#fff' }}>Service Not Found</h1>
            <p style={{ color: 'var(--text-secondary)', margin: '1rem 0 2rem' }}>
              The requested service specification could not be located.
            </p>
            <Link to="/" className="btn primary-btn">
              Return to Selection Portal ➔
            </Link>
          </div>
        </main>
        <Footer settings={settings} />
        <LiveChatWidget settings={settings} />
      </>
    );
  }

  const serviceImage = resolveImage(service.image);
  const compliance = Array.isArray(service.compliance) ? service.compliance : [];
  const keyFeatures = Array.isArray(service.key_features) ? service.key_features : [];
  const methodology = Array.isArray(service.methodology) ? service.methodology : [];
  const deliverables = Array.isArray(service.deliverables) ? service.deliverables : [];
  const faqs = Array.isArray(service.faqs) ? service.faqs : [];

  return (
    <>
      <Header settings={settings} />

      <main className="service-detail-page">
        {/* ================= HERO & BREADCRUMB ================= */}
        {isVisible('svc_hero') && (
          <section className="svc-hero">
            <div className="svc-hero-hud" aria-hidden="true">
              <div className="svc-hud-grid"></div>
              <div className="svc-hud-glow"></div>
            </div>

            <div className="container svc-hero-container">
              {/* Breadcrumbs */}
              <nav className="svc-breadcrumb" aria-label="Breadcrumb">
                <Link to={homeUrl}>Home</Link>
                <span className="svc-sep">/</span>
                <Link to={breadcrumbServicesUrl}>Services</Link>
                <span className="svc-sep">/</span>
                <span className="svc-cat-crumb">{category.name}</span>
                <span className="svc-sep">/</span>
                <span className="svc-curr">{service.title}</span>
              </nav>

              <div className="svc-hero-grid">
                {/* Left Content */}
                <div className="svc-hero-main">
                  <div className="svc-badge-pill">
                    <span className="svc-badge-icon">{category.icon || '🛡️'}</span>
                    <span className="svc-badge-text">{service.badge || category.badge}</span>
                  </div>

                  <h1 className="svc-hero-title">{service.title}</h1>

                  <p className="svc-hero-tagline">{service.tagline}</p>

                  <p className="svc-hero-desc">{service.short_desc}</p>

                  <div className="svc-hero-trust-bar">
                    <div className="svc-trust-item">
                      <span className="svc-check">✓</span>
                      <span>Zero False Positives</span>
                    </div>
                    <div className="svc-trust-item">
                      <span className="svc-check">✓</span>
                      <span>Manual &amp; Automated Exploits</span>
                    </div>
                    <div className="svc-trust-item">
                      <span className="svc-check">✓</span>
                      <span>Attestation Certificate Included</span>
                    </div>
                  </div>

                  <div className="svc-hero-actions">
                    <a href="#book-assessment" className="btn primary-btn svc-book-btn">
                      <span>Schedule Security Audit</span>
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </a>
                    <a href="#methodology" className="btn outline-btn">
                      Explore Methodology
                    </a>
                    <a href={`tel:${sitePhoneTel}`} className="btn outline-btn">
                      Talk to an Expert
                    </a>
                  </div>
                </div>

                {/* Right Visual Stats Card */}
                <div className="svc-hero-card-side">
                  {serviceImage && (
                    <div className="svc-hero-img-box">
                      <img
                        src={serviceImage}
                        alt={service.title}
                        className="svc-hero-preview-img"
                        loading="eager"
                      />
                      <div className="svc-hero-img-overlay">
                        <span className="svc-img-tag">{service.badge || category.badge || 'CYBER PRACTICE'}</span>
                        <span className="svc-img-status">ACTIVE PRACTICE</span>
                      </div>
                    </div>
                  )}

                  <div className="svc-hud-card">
                    <div className="svc-card-header">
                      <div className="svc-status-indicator">
                        <span className="svc-status-dot"></span>
                        <span className="svc-status-label">AUDIT READY</span>
                      </div>
                      <span className="svc-card-badge">{category.name}</span>
                    </div>

                    <div className="svc-card-body">
                      <div className="svc-stat-highlight">
                        <span className="svc-stat-big">100%</span>
                        <span className="svc-stat-sub">Confidential &amp; Compliant Assessment</span>
                      </div>

                      <div className="svc-spec-list">
                        <div className="svc-spec-row">
                          <span className="svc-spec-k">Frameworks</span>
                          <span className="svc-spec-v">{compliance.slice(0, 3).join(', ')}</span>
                        </div>
                        <div className="svc-spec-row">
                          <span className="svc-spec-k">Delivery Format</span>
                          <span className="svc-spec-v">Executive Brief + Technical PoC</span>
                        </div>
                        <div className="svc-spec-row">
                          <span className="svc-spec-k">Testing Mode</span>
                          <span className="svc-spec-v">Black, Gray &amp; White Box</span>
                        </div>
                        <div className="svc-spec-row">
                          <span className="svc-spec-k">Re-Testing</span>
                          <span className="svc-spec-v">Complimentary Post-Fix Audit</span>
                        </div>
                      </div>
                    </div>

                    <div className="svc-card-footer">
                      <div className="svc-card-security-seal">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        <span>Certified Ethical Cybersecurity Labs</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ================= OVERVIEW & BUSINESS CONTEXT ================= */}
        {isVisible('svc_overview') && (
          <section className="section svc-overview-section" id="overview">
            <div className="container">
              <div className="svc-split-grid">
                <div className="svc-split-text">
                  <div className="section-tag">EXECUTIVE SUMMARY</div>
                  <h2>
                    Defend Your Assets With <span>Precision Intelligence</span>
                  </h2>
                  <p className="svc-lead-para">{service.overview}</p>

                  <div className="svc-why-box">
                    <div className="svc-why-icon">⚠️</div>
                    <div className="svc-why-content">
                      <h4>Why Your Organization Needs This</h4>
                      <p>{service.why_needed}</p>
                    </div>
                  </div>
                </div>

                <div className="svc-split-visual">
                  <div className="svc-compliance-card">
                    <h3>Regulatory &amp; Security Standards Aligned</h3>
                    <p>Our audit methodology strictly mirrors established international compliance mandates and defensive controls:</p>

                    <div className="svc-compliance-tags">
                      {compliance.map((std, idx) => (
                        <span className="svc-comp-tag" key={`${std}-${idx}`}>
                          <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor">
                            <path d="M13.485 1.431a1.473 1.473 0 0 1 2.104 2.062l-7.84 9.801a1.473 1.473 0 0 1-2.12.04L.431 8.138a1.473 1.473 0 0 1 2.084-2.083l4.111 4.112 6.82-8.696a.486.486 0 0 1 .04-.04z" />
                          </svg>
                          {std}
                        </span>
                      ))}
                    </div>

                    <div className="svc-audit-seal-box">
                      <div className="svc-seal-icon">🛡️</div>
                      <div>
                        <strong>Attestation of Security</strong>
                        <small>Official compliance-ready verification letter issued upon successful assessment and remediation.</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ================= CORE CAPABILITIES / WHAT WE ASSESS ================= */}
        {isVisible('svc_capabilities') && (
          <section className="section svc-capabilities-section" id="capabilities">
            <div className="container">
              <div className="section-heading text-center">
                <span className="section-tag">IN-DEPTH COVERAGE</span>
                <h2>
                  What We <span>Assess &amp; Test</span>
                </h2>
                <p>Comprehensive attack surface evaluation targeting critical vectors and architectural weak points.</p>
              </div>

              <div className="svc-features-grid">
                {keyFeatures.map((feat, idx) => (
                  <div className="svc-feature-card" key={`${feat.title}-${idx}`}>
                    <div className="svc-feature-num">{`0${idx + 1}`}</div>
                    <h3 className="svc-feature-title">{feat.title}</h3>
                    <p className="svc-feature-desc">{feat.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ================= METHODOLOGY & TESTING PHASES ================= */}
        {isVisible('svc_methodology') && (
          <section className="section svc-methodology-section" id="methodology">
            <div className="container">
              <div className="section-heading text-center">
                <span className="section-tag">SYSTEMATIC EXECUTION</span>
                <h2>
                  Engagement <span>Methodology</span>
                </h2>
                <p>A rigorous, phased framework ensuring maximum vulnerability discovery with zero disruption to live operations.</p>
              </div>

              <div className="svc-timeline">
                {methodology.map((phase, idx) => (
                  <div className="svc-timeline-step" key={`${phase.step}-${idx}`}>
                    <div className="svc-step-badge">{phase.step}</div>
                    <div className="svc-step-content">
                      <h4 className="svc-step-title">{phase.title}</h4>
                      <p className="svc-step-desc">{phase.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ================= DELIVERABLES ================= */}
        {isVisible('svc_deliverables') && (
          <section className="section svc-deliverables-section">
            <div className="container">
              <div className="svc-deliverables-wrapper">
                <div className="svc-deliv-header">
                  <span className="section-tag">WHAT YOU RECEIVE</span>
                  <h2>
                    Tangible <span>Deliverables</span>
                  </h2>
                  <p>Clear, actionable intelligence tailored for both executive boards and technical engineering teams.</p>
                </div>

                <div className="svc-deliv-grid">
                  {deliverables.map((item, idx) => (
                    <div className="svc-deliv-item" key={`${item}-${idx}`}>
                      <div className="svc-deliv-check">✓</div>
                      <div className="svc-deliv-text">
                        <strong>{item}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ================= FAQS ================= */}
        {faqs.length > 0 && isVisible('svc_faqs') && (
          <section className="section svc-faq-section" id="faqs">
            <div className="container" style={{ maxWidth: '900px' }}>
              <div className="section-heading text-center">
                <span className="section-tag">QUESTIONS &amp; ANSWERS</span>
                <h2>
                  Frequently Asked <span>Questions</span>
                </h2>
                <p>Everything you need to know about our {service.title} service.</p>
              </div>

              <div className="ci-faq-list">
                {faqs.map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div className={['ci-faq-item', isOpen ? 'ci-faq-open active' : ''].filter(Boolean).join(' ')} key={`${faq.q}-${idx}`}>
                      <button
                        type="button"
                        className="ci-faq-q"
                        aria-expanded={isOpen ? 'true' : 'false'}
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                      >
                        <span>{faq.q}</span>
                        <span
                          className="ci-faq-arrow"
                          style={{
                            transform: isOpen ? 'rotate(180deg)' : 'none',
                            transition: 'transform 0.25s ease',
                          }}
                        >
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="6,9 12,15 18,9" />
                          </svg>
                        </span>
                      </button>
                      <div
                        className="ci-faq-a"
                        style={{
                          maxHeight: isOpen ? '800px' : '0',
                          opacity: isOpen ? 1 : 0,
                          overflow: 'hidden',
                          transition: 'max-height 0.35s ease, opacity 0.25s ease, padding 0.3s ease',
                        }}
                      >
                        <p>{faq.a}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ================= RELATED SERVICES ================= */}
        {related.length > 0 && isVisible('svc_related') && (
          <section className="section svc-related-section">
            <div className="container">
              <div className="section-heading">
                <span className="section-tag">EXPLORE MORE</span>
                <h2>
                  Related Services in <span>{category.name}</span>
                </h2>
              </div>

              <div className="svc-related-grid">
                {related.map((rel) => (
                  <Link
                    to={`/services/${rel.slug}${activeSection === 'forensics' ? '?section=forensics' : ''}`}
                    className="svc-related-card"
                    key={rel.slug}
                  >
                    <div className="svc-rel-icon">{category.icon || '🛡️'}</div>
                    <h4 className="svc-rel-title">{rel.title}</h4>
                    <p className="svc-rel-desc">{(rel.short_desc || '').slice(0, 110)}...</p>
                    <span className="svc-rel-link">Explore Service ➔</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ================= BOOKING & CONSULTATION CTA ================= */}
        {isVisible('svc_booking') && (
          <section className="section svc-booking-section" id="book-assessment">
            <div className="container">
              <div className="svc-booking-card">
                <div className="svc-booking-info">
                  <span className="section-tag">CONFIDENTIAL ENGAGEMENT</span>
                  <h2>
                    Schedule Your <span>{service.title}</span>
                  </h2>
                  <p>
                    Speak directly with our certified cybersecurity specialists. We sign strict Non-Disclosure Agreements (NDAs) prior to discussing sensitive architecture or scope details.
                  </p>

                  <div className="svc-booking-trust">
                    <div className="svc-b-trust-item">
                      <strong>100%</strong>
                      <span>Confidentiality Guaranteed</span>
                    </div>
                    <div className="svc-b-trust-item">
                      <strong>24h</strong>
                      <span>Proposal &amp; Scoping Turnaround</span>
                    </div>
                    <div className="svc-b-trust-item">
                      <strong>Certified</strong>
                      <span>
                        {(activeSection === 'forensics' || categorySlug === 'digital-investigations')
                          ? 'CBCO, CAISA, CCMP, CPAML, CCLP, CFI Specialists , National Cyber Security Scholars'
                          : 'OSCP, CEH, CISSP Specialists'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="svc-booking-form-wrapper">
                  <form id="contactForm" onSubmit={handleSubmit} className="svc-contact-form">
                    {/* Spam honeypot (hidden from human visitors) */}
                    <div style={{ display: 'none' }} aria-hidden="true">
                      <input type="text" name="website" value={form.website} onChange={handleChange} tabIndex="-1" autoComplete="off" />
                      <input type="text" name="hp_time" value={form.hp_time} onChange={handleChange} tabIndex="-1" autoComplete="off" />
                    </div>

                    {formStatus && (
                      <div
                        id="formResponse"
                        style={{
                          display: 'block',
                          padding: '1rem',
                          borderRadius: '8px',
                          marginBottom: '1.5rem',
                          fontWeight: 500,
                          backgroundColor: formStatus.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          border: `1px solid ${formStatus.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                          color: formStatus.type === 'success' ? '#10b981' : '#ef4444',
                        }}
                      >
                        {formStatus.message}
                      </div>
                    )}

                    <div className="form-group">
                      <label htmlFor="service">Service Required *</label>
                      <select id="service" name="service" required value={form.service} onChange={handleChange}>
                        <option value={service.title}>{service.title}</option>
                        {trackServices
                          .filter((title) => title !== service.title)
                          .map((title) => (
                            <option key={title} value={title}>{title}</option>
                          ))}
                        <option value="Other">Other (Please specify)</option>
                      </select>
                      <div className="service-other-wrap" style={{ display: isOtherSelected ? 'block' : 'none', marginTop: '0.65rem' }}>
                        <label
                          htmlFor="service_other"
                          style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.82rem', opacity: 0.9, color: 'var(--purple-light)' }}
                        >
                          Specify Your Requirement *
                        </label>
                        <input
                          type="text"
                          id="service_other"
                          name="service_other"
                          placeholder="Type your custom security requirement..."
                          value={form.service_other}
                          onChange={handleChange}
                          required={isOtherSelected}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="client_name">Your Name / Pseudonym *</label>
                      <input
                        type="text"
                        id="client_name"
                        name="name"
                        required
                        placeholder="e.g. John Doe"
                        value={form.name}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="client_email">Secure Email Address *</label>
                        <input
                          type="email"
                          id="client_email"
                          name="email"
                          required
                          placeholder="john@company.com"
                          value={form.email}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="client_phone">Phone / WhatsApp / Signal *</label>
                        <input
                          type="tel"
                          id="client_phone"
                          name="phone"
                          required
                          placeholder={sitePhone}
                          value={form.phone}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="client_scope">Confidential Details / Message *</label>
                      <textarea
                        id="client_scope"
                        name="message"
                        rows="3"
                        required
                        placeholder="Describe your requirement in brief. All submissions are encrypted and kept strictly confidential under NDA."
                        value={form.message}
                        onChange={handleChange}
                      ></textarea>
                    </div>

                    <div className="form-group recaptcha-wrapper-group" style={{ marginBottom: '1.5rem' }}>
                      <RecaptchaField
                        ref={recaptchaRef}
                        onChange={(token) => setRecaptchaToken(token)}
                        onExpired={() => setRecaptchaToken('')}
                      />
                    </div>

                    <button type="submit" className="btn primary-btn svc-submit-btn" disabled={formLoading}>
                      {formLoading ? 'Requesting...' : 'Request Confidential Audit Proposal ➔'}
                    </button>
                  </form>
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
