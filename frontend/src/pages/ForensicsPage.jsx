import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LiveChatWidget from '../components/LiveChatWidget';
import ContactForm from '../components/ContactForm';
import CiHeroCanvas from '../components/forensics/CiHeroCanvas';
import CiLiveTrace from '../components/forensics/CiLiveTrace';
import CiShowcaseMatrix from '../components/forensics/CiShowcaseMatrix';
import CiProcessTimeline from '../components/forensics/CiProcessTimeline';
import CiThreatGlobe from '../components/forensics/CiThreatGlobe';
import CiWorldMap from '../components/forensics/CiWorldMap';
import CiCtaCanvas from '../components/forensics/CiCtaCanvas';
import { getAssetUrl } from '../utils/assets';
import { isSectionVisible } from '../utils/sections';
import {
  getSettings,
  getSections,
  getInvestigationServices,
  getTestimonials,
  getClients,
  getAccreditations,
  getFaqs,
} from '../api/client';

const TYPEWRITER_PHRASES = [
  'Cybercrime Analysis',
  'Digital Forensics',
  'OSINT Intelligence',
  'Evidence Recovery',
  'Cyber Fraud Tracing',
  'Incident Investigation',
  'Malware Analysis',
  'Evidence Preservation',
];

// Fallback Default Investigation Services (9 Specialized Practices)
const DEFAULT_INVESTIGATION_SERVICES = [
  {
    id: '9',
    slug: 'corporate-background-verification-bgv',
    title: 'Corporate Background Verification (BGV)',
    icon: '📋',
    image: 'assets/images/corporate_background_verification_bgv.jpg',
    description:
      'Comprehensive corporate background verification (BGV), pre-employment screening, executive due diligence, criminal & court record checks, academic/employment validation, and vendor risk verification for enterprises.',
  },
  {
    id: '1',
    slug: 'cybercrime-victim-assistance-account-recovery',
    title: 'Cybercrime Victim Assistance & Account Recovery',
    icon: '🛡️',
    image: 'assets/images/investigation_01_victim_recovery.jpg',
    description:
      'Support for individuals affected by account hacking, online fraud, phishing, impersonation, and cyber extortion incidents. We assist with incident assessment, evidence preservation, recovery guidance, and strengthening account security to prevent future attacks.',
  },
  {
    id: '2',
    slug: 'digital-investigations-osint',
    title: 'Digital Investigations & OSINT',
    icon: '🔍',
    image: 'assets/images/investigation_02_osint.jpg',
    description:
      'Comprehensive digital investigations using Open-Source Intelligence (OSINT) techniques to uncover online footprints, verify identities, and assess potential risks. Our reports provide actionable insights for personal, legal, and business decision-making.',
  },
  {
    id: '3',
    slug: 'social-media-investigations-impersonation-removal',
    title: 'Social Media Investigations & Impersonation Removal',
    icon: '📱',
    image: 'assets/images/investigation_03_social_media.jpg',
    description:
      'Identify and investigate fake profiles, impersonation attempts, account takeovers, and unauthorized content usage across major social media platforms. We help document evidence and support platform reporting and removal processes.',
  },
  {
    id: '4',
    slug: 'cyber-fraud-investigation-support',
    title: 'Cyber Fraud Investigation Support',
    icon: '💳',
    image: 'assets/images/investigation_04_fraud_support.jpg',
    description:
      'Professional investigation support for financial scams, investment fraud, crypto fraud, romance scams, and online marketplace deception. We analyze digital evidence, trace fraud indicators, and prepare detailed reports suitable for law enforcement review.',
  },
  {
    id: '5',
    slug: 'digital-evidence-preservation-forensics',
    title: 'Digital Evidence Preservation & Forensics',
    icon: '🔒',
    image: 'assets/images/investigation_05_digital_forensics.jpg',
    description:
      'Secure collection, preservation, and analysis of digital evidence from devices, emails, screenshots, and online accounts. Our forensic documentation helps maintain evidence integrity for investigations, disputes, and legal proceedings.',
  },
  {
    id: '6',
    slug: 'executive-family-digital-protection',
    title: 'Executive & Family Digital Protection',
    icon: '👥',
    image: 'assets/images/investigation_06_executive_family.jpg',
    description:
      'Proactive cybersecurity services designed to protect business leaders, public figures, families, and high-profile individuals from digital threats. We assess security risks, improve privacy controls, and strengthen account and device protection.',
  },
  {
    id: '7',
    slug: 'cybersecurity-awareness-lea-training',
    title: 'Cybersecurity Awareness & LEA Training',
    icon: '🎓',
    image: 'assets/images/investigation_07_lea_training.jpg',
    description:
      'Specialized training programs for law enforcement agencies, educational institutions, NGOs, and corporate teams on cybercrime prevention and investigation techniques. Sessions focus on practical skills, digital evidence handling, fraud awareness, and incident response readiness.',
  },
  {
    id: '8',
    slug: 'child-digital-safety-protection',
    title: 'Child Digital Safety & Protection',
    icon: '🧸',
    image: 'assets/images/investigation_08_child_safety.jpg',
    description:
      'We help safeguard children in the digital world through confidential investigations, online threat assessment, and digital evidence analysis. Our services focus on identifying cyberbullying, online harassment, suspicious digital interactions, and potential child exploitation risks, including the identification and reporting of Child Sexual Abuse Material (CSAM).',
  },
];

// Fallback Default Accreditations
const DEFAULT_ACCREDITATIONS = [
  {
    id: 'accred-1',
    name: 'Association of Investigators and Detectives',
    short_name: 'AID',
    img: 'assets/images/aid.png',
    alt: 'AID - Association of Investigators and Detectives',
  },
  {
    id: 'accred-2',
    name: 'Tamilnadu Association of Professional Detectives and Investigators',
    short_name: 'TAPDI',
    img: 'assets/images/tapdi.png',
    alt: 'TAPDI - Tamilnadu Association of Professional Detectives and Investigators',
  },
  {
    id: 'accred-3',
    name: 'Association of Professional Detectives & Investigators',
    short_name: 'APDI',
    img: 'assets/images/apdi.png',
    alt: 'APDI - Association of Professional Detectives & Investigators',
  },
  {
    id: 'accred-4',
    name: 'Unified Network of Investigative Professionals',
    short_name: 'UNIP',
    img: 'assets/images/unip.svg',
    alt: 'UNIP - Unified Network of Investigative Professionals',
  },
];

// Fallback Default Clients
const DEFAULT_CLIENTS = [
  {
    id: 'client-1',
    name: 'CopConnect',
    category: 'Information Sharing and Analysis Center',
    desc: 'Strategic collaboration in cyber threat intelligence sharing, awareness, and digital incident advisory.',
    img: 'assets/images/client_copconnect.jpg',
  },
  {
    id: 'client-2',
    name: 'Gokarna Samudra',
    category: 'Beach Resort & Hospitality',
    desc: 'Digital infrastructure protection, cyber dispute resolution, and guest data privacy security.',
    img: 'assets/images/client_gokarna_samudra.jpg',
  },
];

// Fallback Default Testimonials
const DEFAULT_TESTIMONIALS = [
  {
    id: 'testi-1',
    quote:
      "CyberKovai's digital forensics team recovered critical deleted evidence and provided an airtight forensic report that proved decisive in our corporate litigation. Exceptional discretion and technical test.",
    name: 'Rajesh M.',
    role: 'Managing Partner, Legal Advisory',
    avatar: 'assets/images/avatar_karthik.jpg',
  },
  {
    id: 'testi-2',
    quote:
      'Their cyber fraud tracing and blockchain analysis uncovered the illicit movement of funds after our firm suffered a major financial wire fraud. The dossier provided to law enforcement led directly to key recoveries.',
    name: 'Priya S.',
    role: 'Chief Financial Officer, Enterprise Logistics',
    avatar: 'assets/images/avatar_priya.jpg',
  },
  {
    id: 'testi-3',
    quote:
      'We faced an aggressive online harassment and executive impersonation campaign. CyberKovai identified the perpetrators through OSINT within 72 hours and facilitated swift platform takedowns.',
    name: 'Aravind K.',
    role: 'VP Operations & Corporate Affairs',
    avatar: 'assets/images/avatar_aravind.jpg',
  },
];

// Fallback Default FAQs
const DEFAULT_FAQS = [
  {
    id: 'faq-inv-1',
    question: 'What digital investigation and forensic services do you offer?',
    answer:
      'We provide Digital Forensics & Artifact Extraction, OSINT & Background Intelligence, Cyber Fraud & Scam Tracing, Social Media Investigations & Impersonation Removal, Cybercrime Victim Assistance, Executive Digital Protection, and Child Digital Safety investigations.',
  },
  {
    id: 'faq-inv-2',
    question: 'Are your forensic reports admissible in court?',
    answer:
      'Yes. All digital evidence is collected, preserved, and analyzed following ISO/IEC 27037 standards. We maintain a rigorous chain of custody and verify artifacts with cryptographic SHA-256 hashes, ensuring our comprehensive reports are fully admissible in legal proceedings.',
  },
  {
    id: 'faq-inv-3',
    question: 'How do you guarantee the confidentiality of my case?',
    answer:
      '100% confidentiality is guaranteed from your very first consultation. All case files, client identities, and forensic findings are protected under legally binding Non-Disclosure Agreements (NDAs) and stored in encrypted offline forensic vaults.',
  },
  {
    id: 'faq-inv-4',
    question: 'Can you help trace stolen cryptocurrency or financial fraud?',
    answer:
      'Yes. Our financial forensics and blockchain tracing experts trace transaction trails across blockchains, centralized exchanges, and payment gateway infrastructure to build law-enforcement ready evidentiary dossiers for asset recovery.',
  },
  {
    id: 'faq-inv-5',
    question: 'How quickly can your forensic team initiate an investigation?',
    answer:
      'For emergency incidents involving ransomware, active extortion, ongoing financial wire fraud, or child safety threats, our senior investigators can initiate intake and evidence acquisition protocols within 2 to 4 hours.',
  },
];

const normalizeImg = (path, fallback = '') => {
  return getAssetUrl(path || fallback);
};

export default function ForensicsPage() {
  const location = useLocation();
  const [settings, setSettings] = useState({});
  const [sections, setSections] = useState({});
  const [invServices, setInvServices] = useState(DEFAULT_INVESTIGATION_SERVICES);
  const [testimonials, setTestimonials] = useState(DEFAULT_TESTIMONIALS);
  const [clients, setClients] = useState(DEFAULT_CLIENTS);
  const [accreditations, setAccreditations] = useState(DEFAULT_ACCREDITATIONS);
  const [faqs, setFaqs] = useState(DEFAULT_FAQS);
  const [openFaq, setOpenFaq] = useState(null);

  // Typewriter effect state
  const [typewriterText, setTypewriterText] = useState(TYPEWRITER_PHRASES[0]);
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    getSettings().then((s) => s && setSettings(s)).catch(() => { });
    getSections().then((s) => s && setSections(s)).catch(() => { });
    getInvestigationServices()
      .then((s) => {
        if (Array.isArray(s) && s.length > 0) setInvServices(s);
      })
      .catch(() => { });
    getTestimonials()
      .then((t) => {
        if (Array.isArray(t) && t.length > 0) setTestimonials(t);
      })
      .catch(() => { });
    getClients('forensics')
      .then((c) => {
        if (Array.isArray(c) && c.length > 0) setClients(c);
      })
      .catch(() => { });
    getAccreditations('forensics')
      .then((a) => {
        if (Array.isArray(a) && a.length > 0) setAccreditations(a);
      })
      .catch(() => { });
    getFaqs('forensics')
      .then((f) => {
        if (Array.isArray(f) && f.length > 0) setFaqs(f);
      })
      .catch(() => { });
  }, []);

  // Handle ?section=forensics (and similar) query param — scroll to #ci-services
  // Also handles hash fragments like #ci-services
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get('section');
    const hash = location.hash ? location.hash.replace('#', '') : null;

    // Map section param to anchor IDs
    const sectionMap = {
      forensics: null, // forensics = stay at top (hero), not scroll to services
      services: 'ci-services',
      'ci-services': 'ci-services',
      process: 'ci-process',
      threats: 'ci-threats',
      contact: 'contact',
      hero: 'ci-home',
      showcase: 'ci-showcase',
    };

    // Hash takes priority over section param
    const targetId = hash || (section ? sectionMap[section] : null);
    if (!targetId) return;

    const scrollToSection = () => {
      const el = document.getElementById(targetId);
      if (el) {
        const offset = 90; // header height offset
        const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    };

    // Allow page to fully render before scrolling
    const timer = setTimeout(scrollToSection, 450);
    return () => clearTimeout(timer);
  }, [location.search, location.hash]);

  // Smooth Typewriter Rotator
  useEffect(() => {
    let timer;
    const currentPhrase = TYPEWRITER_PHRASES[phraseIdx];

    if (!isDeleting) {
      if (typewriterText.length < currentPhrase.length) {
        timer = setTimeout(() => {
          setTypewriterText(currentPhrase.slice(0, typewriterText.length + 1));
        }, 85);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 2200);
      }
    } else {
      if (typewriterText.length > 0) {
        timer = setTimeout(() => {
          setTypewriterText(currentPhrase.slice(0, typewriterText.length - 1));
        }, 45);
      } else {
        setIsDeleting(false);
        setPhraseIdx((prev) => (prev + 1) % TYPEWRITER_PHRASES.length);
      }
    }

    return () => clearTimeout(timer);
  }, [typewriterText, isDeleting, phraseIdx]);

  // Scroll Reveal Intersection Observer — enhanced with staggered delays
  useEffect(() => {
    const els = document.querySelectorAll('.ci-reveal');
    if (!els.length) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      els.forEach((el) => el.classList.add('ci-visible'));
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('ci-visible');
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.02, rootMargin: '120px 0px 40px 0px' }
    );

    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [invServices, testimonials, clients, accreditations, faqs]);

  return (
    <>
      <Header settings={settings} />

      <main className="cyber-intelligence-page forensics-track-view">
        {/* ================= 1. HERO SECTION ================= */}
        {isSectionVisible(sections, 'inv_hero') && (
          <section className="ci-hero" id="ci-home">
            {/* Particle canvas background */}
            <CiHeroCanvas />

            {/* HUD grid overlay */}
            <div className="ci-hero-hud" aria-hidden="true">
              <div className="ci-hud-corner ci-hud-tl"></div>
              <div className="ci-hud-corner ci-hud-tr"></div>
              <div className="ci-hud-corner ci-hud-bl"></div>
              <div className="ci-hud-corner ci-hud-br"></div>
              <div className="ci-hud-h-line"></div>
              <div className="ci-hud-v-line"></div>
            </div>

            <div className="container ci-hero-inner">
              {/* LEFT: Content */}
              <div className="ci-hero-content">
                <div className="ci-hero-label ci-reveal">
                  <svg viewBox="0 0 10 10" width="8" height="8" fill="var(--orchid)">
                    <circle cx="5" cy="5" r="5" />
                  </svg>
                  DIGITAL INVESTIGATION &amp; FORENSICS
                </div>

                <h1 className="ci-hero-heading ci-reveal">
                  Uncover Digital Truth<br />
                  <span className="ci-hero-rotator ci-typewriter-rotator" id="ciHeroRotator">
                    <span className="ci-grad-text ci-typewriter-text" id="ciTypewriterText">
                      {typewriterText}
                    </span>
                    <span className="ci-typewriter-cursor" aria-hidden="true"></span>
                  </span>
                </h1>

                <p className="ci-hero-desc ci-reveal">
                  Confidential, court-admissible digital investigations, OSINT intelligence, cyber fraud tracing, and evidence preservation for individuals, legal counsel, and enterprises.
                </p>

                <div className="ci-hero-trust ci-reveal">
                  <span>✓ Court-Admissible Evidence</span>
                  <span>✓ 100% Confidential Inquiry</span>
                  <span>✓ Certified Specialists</span>
                </div>

                <div className="ci-hero-btns ci-reveal">
                  <a href="#ci-services" className="btn primary-btn">
                    Explore Investigation Services <span>➔</span>
                  </a>
                  <a href="#contact" className="btn outline-btn">
                    Schedule Consultation <span>➔</span>
                  </a>
                </div>
              </div>

              {/* RIGHT: Live Trace Hero Visual */}
              <CiLiveTrace />
            </div>
          </section>
        )}

        {/* ================= 2. 9-PILLAR INTERACTIVE SHOWCASE MATRIX ================= */}
        {isSectionVisible(sections, 'inv_showcase') && <CiShowcaseMatrix />}

        {/* ================= 3. COMPREHENSIVE DIGITAL INVESTIGATION SOLUTIONS ================= */}
        {isSectionVisible(sections, 'inv_services') && (
          <section className="section ci-services-section" id="ci-services">
            <div className="container">
              <div className="section-heading text-center ci-reveal">
                <span className="section-tag">
                  <span className="pulse-dot"></span>
                  OUR SPECIALIZED PRACTICES
                </span>
                <h2>
                  Comprehensive <span className="ci-grad-text">Digital Investigation</span> Solutions
                </h2>
                <p>
                  From incident evidence recovery and cyber fraud tracing to OSINT and child safety, we provide legally sound investigations with complete discretion.
                </p>
              </div>

                <div className="ci-services-grid">
                  {invServices.map((svc, idx) => (
                    <article
                      key={svc.slug || svc.id || idx}
                      className="ci-svc-card ci-reveal reveal-scale"
                      id={`svc-${svc.slug}`}
                      data-slug={svc.slug}
                      data-index={idx}
                    >
                      <div className="ci-svc-img-wrap">
                        <img
                          src={normalizeImg(svc.image, '/assets/images/investigation_01_victim_recovery.jpg')}
                          alt={svc.title}
                          className="ci-svc-img"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="ci-svc-img-gradient"></div>
                      </div>
                      <div className="ci-svc-body">
                        <h3>{svc.title}</h3>
                        <p>{svc.description}</p>
                        <Link to={`/services/${svc.slug}?section=forensics`} className="ci-svc-link">
                          Explore Investigation <span>➔</span>
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
          </section>
        )}

        {/* ================= 4. EVIDENTIARY PROCESS (5 FORENSIC TIMELINE NODES) ================= */}
        {isSectionVisible(sections, 'inv_process') && <CiProcessTimeline />}

        {/* ================= 5. INCIDENTS & THREATS WE INVESTIGATE (3D FIBONACCI KEYWORD GLOBE) ================= */}
        {isSectionVisible(sections, 'inv_risks') && (
          <section className="section ci-risks-section" id="ci-risks">
            <div className="container">
              <div className="section-heading text-center ci-reveal">
                <h2
                  dangerouslySetInnerHTML={{
                    __html: settings.investigation_threats_title || 'Incidents &amp; Threats We <span class="ci-grad-text">Investigate</span>',
                  }}
                />
                <p>
                  {settings.investigation_threats_subtitle ||
                    'Specialized investigative capabilities across diverse cybercrime, financial fraud, and digital dispute categories.'}
                </p>
              </div>

              <CiThreatGlobe />
            </div>
          </section>
        )}

        {/* ================= 6. MEMBERSHIPS, ASSOCIATIONS & ACCREDITATIONS ================= */}
        {isSectionVisible(sections, 'inv_credentials') && accreditations.length > 0 && (
          <section
            className="section credentials-section"
            id="credentials"
            style={{ textAlign: 'center', padding: '3.5rem 0', background: 'rgba(5, 5, 17, 0.7)' }}
          >
            <div className="container">
              <div className="section-heading text-center ci-reveal">
                <span className="section-tag">
                  <span className="pulse-dot"></span>
                  OUR CREDENTIALS
                </span>
                <h2>
                  Memberships, Associations &amp; <span>Accreditations</span>
                </h2>
                <p style={{ maxWidth: '680px', margin: '0 auto 2.5rem', opacity: 0.85 }}>
                  We are associated with reputable investigative organizations and certified bodies to ensure the highest standards of professionalism, ethics, and legal compliance.
                </p>
              </div>

              <div className="credentials-grid ci-reveal">
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

        {/* ================= 7. GLOBAL FOOTPRINT (WORLD MAP + STATS) ================= */}
        {isSectionVisible(sections, 'inv_coverage') && <CiWorldMap />}

        {/* ================= 8. ORGANIZATIONS THAT TRUST CYBERKOVAI ================= */}
        {isSectionVisible(sections, 'inv_clients') && clients.length > 0 && (
          <section className="section ci-clients-section" id="ci-clients">
            <div className="container">
              <div className="section-heading text-center ci-reveal">
                <span className="section-tag">
                  <span className="pulse-dot"></span>
                  OUR CLIENTS
                </span>
                <h2>
                  Organizations That <span className="ci-grad-text">Trust CyberKovai</span>
                </h2>
                <p>
                  From institutional intelligence analysis centers to premier hospitality brands, we deliver discreet digital investigation and cybersecurity services.
                </p>
              </div>

              <div className="ci-clients-deck ci-reveal">
                {clients.map((client, idx) => (
                  <div key={client.id || idx} className="ci-client-card">
                    <div className="ci-client-logo-box">
                      <img
                        src={normalizeImg(client.img, '/assets/images/client_copconnect.jpg')}
                        alt={client.alt || client.name}
                        className="ci-client-logo-img"
                        loading="lazy"
                      />
                    </div>
                    <div className="ci-client-card-body">
                      <h3>{client.name}</h3>
                      <div className="ci-client-category-badge">
                        <span className="ci-client-badge-dot"></span>
                        <span>{client.category}</span>
                      </div>
                      {client.desc && <p>{client.desc}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ================= 9. CASE TESTIMONIALS ================= */}
        {isSectionVisible(sections, 'show_testimonials') && (settings.show_testimonials !== false && settings.show_testimonials !== 0 && settings.show_testimonials !== '0') && testimonials.length > 0 && (
          <section className="section ci-testimonials" id="ci-testimonials">
            <div className="container">
              <div className="section-heading text-center ci-reveal">
                <span className="section-tag">
                  <span className="pulse-dot"></span>
                  CASE TESTIMONIALS
                </span>
                <h2>
                  What Our <span className="ci-grad-text">Clients Say</span>
                </h2>
              </div>

              <div className="ci-testi-grid">
                {testimonials.map((t, idx) => (
                  <div key={t.id || idx} className="ci-testi-card ci-reveal">
                    <div className="ci-testi-quote-icon">&ldquo;</div>
                    <p className="ci-testi-quote">{t.quote || t.content}</p>
                    <div className="ci-testi-author">
                      <img
                        src={normalizeImg(t.avatar, '/assets/images/avatar_karthik.jpg')}
                        alt={t.name}
                        className="ci-testi-avatar-img"
                        loading="lazy"
                      />
                      <div className="ci-testi-meta">
                        <strong>{t.name}</strong>
                        <span>{t.role || t.company}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ================= 10. FAQ (HELP CENTER) ================= */}
        {isSectionVisible(sections, 'inv_faq') && (
          <section className="section ci-faq-section" id="ci-faq">
            <div className="container">
              <div className="ci-faq-grid">
                <div className="ci-faq-left ci-reveal">
                  <span className="section-tag">
                    <span className="pulse-dot"></span>
                    HELP CENTER
                  </span>
                  <h2>
                    Frequently Asked <span className="ci-grad-text">Questions</span>
                  </h2>
                  <p>
                    Have questions regarding evidence admissibility, confidentiality, or case timelines? Our forensic team is ready to assist.
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
                      <div key={faq.id || idx} className={`ci-faq-item ci-reveal ${isOpen ? 'active' : ''}`}>
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

        {/* ================= 11. FINAL CTA & CONFIDENTIAL INQUIRY FORM ================= */}
        {isSectionVisible(sections, 'inv_contact') && (
          <section className="ci-final-cta" id="contact" style={{ padding: '4.5rem 0' }}>
            <CiCtaCanvas />

            <div className="container ci-cta-inner">
              <span className="section-tag ci-reveal">
                <span className="pulse-dot"></span>
                CONFIDENTIAL INQUIRY
              </span>
              <h2>
                Need a Discreet <span className="ci-grad-text">Digital Investigation?</span>
              </h2>
              <p className="ci-cta-tagline ci-reveal">
                Speak directly with our senior forensic investigators. All consultations are 100% confidential and protected by strict non-disclosure agreements.
              </p>

              <div className="ci-cta-btns ci-reveal" style={{ marginBottom: '2.5rem' }}>
                <a href={`tel:${settings.site_phone_tel || '+916382019821'}`} className="btn primary-btn">
                  <span>📞</span> Call Senior Investigator ➔
                </a>
                <a href={`mailto:${settings.site_email || 'info@cyberkovai.com'}`} className="btn outline-btn">
                  <span>✉️</span> Email Investigation Team
                </a>
              </div>

              {/* Interactive Contact Form */}
              <div
                className="contact-form-wrapper ci-reveal"
                style={{
                  width: '100%',
                  maxWidth: '820px',
                  margin: '0 auto',
                  textAlign: 'left',
                  background: 'rgba(13, 11, 26, 0.9)',
                  padding: '2.2rem',
                  borderRadius: '20px',
                  border: '1px solid rgba(139, 32, 255, 0.35)',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                }}
              >
                <ContactForm
                  investigationServices={invServices}
                  initialService="Corporate Background Verification (BGV)"
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
