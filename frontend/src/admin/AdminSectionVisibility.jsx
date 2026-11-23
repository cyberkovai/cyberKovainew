import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { getSections, updateSections } from '../api/client';
import { isSectionVisible } from '../utils/sections';

const SECTION_REGISTRY = [
  {
    key: 'cyber',
    group_title: 'Cyber Security Page',
    group_file: 'cyber-security.php',
    group_icon: '🛡️',
    group_desc: 'Show or hide individual sections on the main Cyber Security landing page.',
    sections: [
      {
        key: 'cyber_hero',
        label: 'Hero Banner & Honeycomb Visual',
        desc: 'Top hero banner with particle canvas, headline, CTAs, and live attack map preview.',
        default: true,
      },
      {
        key: 'cyber_about',
        label: 'About Cyber Kovai Section',
        desc: 'Overview of offensive threat defense and interactive 3D SOC command visual.',
        default: true,
      },
      {
        key: 'cyber_capabilities',
        label: 'Core Cyber Security Capabilities',
        desc: '3-pillar capability cards (Offensive VAPT, Cloud Defense, Zero-Trust Architecture).',
        default: true,
      },
      {
        key: 'cyber_stats',
        label: 'Security Audit Stats Strip',
        desc: 'Key metrics strip (500+ Audits, 10k+ Vulnerabilities, Zero-False-Positives, etc.).',
        default: true,
      },
      {
        key: 'cyber_practices',
        label: 'Core Cyber Practices (Bento Grid)',
        desc: '8 interactive practice cards linking into detailed security services.',
        default: true,
      },
      {
        key: 'cyber_process',
        label: 'Methodology / Defense Lifecycle',
        desc: 'Structured step-by-step cyber defense assessment process.',
        default: true,
      },
      {
        key: 'cyber_industries',
        label: 'Industries We Protect',
        desc: 'Interactive industry sector selector (Healthcare, Finance, SaaS, Govt, etc.).',
        default: true,
      },
      {
        key: 'cyber_clients',
        label: 'Clients & Partner Engagements',
        desc: 'From Startups to Multinationals scale cards and featured partner logos.',
        default: true,
      },
      {
        key: 'cyber_coverage',
        label: 'Global Reach & Coimbatore Hub',
        desc: 'Interactive world reach map and global security audit coverage details.',
        default: true,
      },
      {
        key: 'cyber_credentials',
        label: 'Memberships, Associations & Certifications',
        desc: 'Accreditation badges and verified industry credential logos.',
        default: true,
      },
      {
        key: 'cyber_simulator',
        label: 'Cyber Attack Surface Simulator',
        desc: 'Interactive diagnostic assessment simulator section.',
        default: true,
      },
      {
        key: 'cyber_faq',
        label: 'Cyber Security FAQs',
        desc: 'Frequently asked questions accordion for cybersecurity engagements.',
        default: true,
      },
      {
        key: 'cyber_contact',
        label: 'Consultation CTA & Contact Form',
        desc: 'Bottom encrypted security audit booking form and direct inquiry section.',
        default: true,
      },
    ],
  },
  {
    key: 'investigation',
    group_title: 'Digital Investigation & Forensics Page',
    group_file: 'cyber-intelligence.php',
    group_icon: '🔍',
    group_desc: 'Show or hide individual sections on the Digital Investigation & Forensics landing page.',
    sections: [
      {
        key: 'inv_hero',
        label: 'Hero Banner & Live Trace Animation',
        desc: 'Hero headline with typewriter rotator and interactive Live Trace network visual.',
        default: true,
      },
      {
        key: 'inv_showcase',
        label: 'Core Investigation Pillars Showcase',
        desc: 'Expandable multi-pillar investigation & forensic matrix panels.',
        default: true,
      },
      {
        key: 'inv_services',
        label: 'Digital Investigation Practices Grid',
        desc: 'Service cards grid (BGV, Victim Recovery, OSINT, Fraud Tracing, etc.).',
        default: true,
      },
      {
        key: 'inv_process',
        label: 'Evidentiary Process Timeline',
        desc: '5-step chain-of-custody investigation workflow timeline.',
        default: true,
      },
      {
        key: 'inv_risks',
        label: 'Incidents & Threats 3D Globe',
        desc: 'Interactive 3D rotating sphere of investigation threat tags.',
        default: true,
      },
      {
        key: 'inv_credentials',
        label: 'Memberships, Associations & Accreditations',
        desc: 'Investigative accreditation logos and certified body badges.',
        default: true,
      },
      {
        key: 'inv_coverage',
        label: 'Global Investigation Footprint Map',
        desc: 'Interactive dotted world map with regional filters and investigation stats.',
        default: true,
      },
      {
        key: 'inv_clients',
        label: 'Organizations That Trust CyberKovai (Clients)',
        desc: 'Partner organizations and institutional investigation engagements deck.',
        default: true,
      },
      {
        key: 'show_testimonials',
        label: 'Client Case Testimonials',
        desc: 'Client reviews section on the investigation page and testimonial links in footer.',
        default: true,
      },
      {
        key: 'inv_faq',
        label: 'Investigation FAQs',
        desc: 'Frequently asked questions accordion for digital investigations.',
        default: true,
      },
      {
        key: 'inv_contact',
        label: 'Confidential Investigation CTA & Form',
        desc: 'Bottom discreet inquiry form and direct investigator contact section.',
        default: true,
      },
    ],
  },
  {
    key: 'about',
    group_title: 'About Us & Leadership Pages',
    group_file: 'about.php / team.php',
    group_icon: '👥',
    group_desc: 'Control visibility of sections on the About Us page and Leadership Team page.',
    sections: [
      {
        key: 'about_hero',
        label: 'About Page Header & Breadcrumb',
        desc: 'Top page title banner and breadcrumb navigation on about.php.',
        default: true,
      },
      {
        key: 'about_who_we_are',
        label: 'Who We Are & Overview',
        desc: 'Company story, mission highlights, and visual card on about.php.',
        default: true,
      },
      {
        key: 'about_principles',
        label: 'Guiding Principles Section',
        desc: 'Confidentiality, legal rigor, and ethical investigation principles grid.',
        default: true,
      },
      {
        key: 'about_cta',
        label: 'About Page Call-to-Action Banner',
        desc: 'Bottom consultation invitation banner on about.php.',
        default: true,
      },
      {
        key: 'show_team',
        label: 'Our Team Page & Menu Links',
        desc: 'Controls /team.php page access plus "Our Team" links in header dropdown and footer.',
        default: true,
      },
    ],
  },
  {
    key: 'service_detail',
    group_title: 'Service Detail Pages',
    group_file: 'service.php / services/*.php',
    group_icon: '📄',
    group_desc: 'Show or hide sections across all individual Cyber Security & Investigation service detail pages.',
    sections: [
      {
        key: 'svc_hero',
        label: 'Service Hero & Summary HUD Card',
        desc: 'Service headline, trust highlights, preview visual, and audit specs card.',
        default: true,
      },
      {
        key: 'svc_overview',
        label: 'Executive Summary & Regulatory Compliance',
        desc: 'Detailed overview, business context box, and compliance standard tags.',
        default: true,
      },
      {
        key: 'svc_capabilities',
        label: 'Core Capabilities / What We Assess',
        desc: 'Numbered capability cards detailing what is covered in the engagement.',
        default: true,
      },
      {
        key: 'svc_methodology',
        label: 'Engagement Methodology Timeline',
        desc: 'Phased execution timeline for the selected service.',
        default: true,
      },
      {
        key: 'svc_deliverables',
        label: 'Tangible Deliverables Checklist',
        desc: 'List of reports, certificates, and evidence packs delivered.',
        default: true,
      },
      {
        key: 'svc_faqs',
        label: 'Service-Specific FAQs',
        desc: 'Accordion of common questions specific to the viewed service.',
        default: true,
      },
      {
        key: 'svc_related',
        label: 'Related Services Grid',
        desc: 'Cross-linked sibling services from the same practice category.',
        default: true,
      },
      {
        key: 'svc_booking',
        label: 'Confidential Engagement & Booking Form',
        desc: 'Bottom proposal request form with trust badges and certification summary.',
        default: true,
      },
    ],
  },
  {
    key: 'contact_global',
    group_title: 'Contact Page & Global Elements',
    group_file: 'contact.php / footer.php',
    group_icon: '🌐',
    group_desc: 'Control sections on the Contact page and global widgets shown across the entire site.',
    sections: [
      {
        key: 'contact_hero',
        label: 'Contact Page Header Banner',
        desc: 'Top headline banner and breadcrumb on contact.php.',
        default: true,
      },
      {
        key: 'contact_form_section',
        label: 'Contact Form & Consultation Block',
        desc: 'Main NDA consultation card and encrypted inquiry form on contact.php.',
        default: true,
      },
      {
        key: 'global_service_areas',
        label: 'Footer Service Coverage Bar',
        desc: 'India Hub & Global Delivery location strip shown above the footer bottom bar.',
        default: true,
      },
      {
        key: 'global_chat_widget',
        label: 'Floating Online Chat Widget',
        desc: 'Persistent floating Online support pill and welcome popup across all pages.',
        default: true,
      },
    ],
  },
];

export default function AdminSectionVisibility() {
  const [sections, setSections] = useState({});
  const [activeGroup, setActiveGroup] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '', ok: true });
  const toastTimerRef = useRef(null);

  // Initialize and fetch section visibility from API
  useEffect(() => {
    getSections()
      .then((data) => {
        if (data && typeof data === 'object') {
          setSections(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load section visibility:', err);
      });
  }, []);

  const showToast = (msg, ok = true) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ show: true, msg, ok });
    toastTimerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 2800);
  };

  // Live count computations
  const totalSections = useMemo(() => {
    return SECTION_REGISTRY.reduce((acc, g) => acc + g.sections.length, 0);
  }, []);

  const visibleTotal = useMemo(() => {
    let count = 0;
    SECTION_REGISTRY.forEach((g) => {
      g.sections.forEach((s) => {
        if (isSectionVisible(sections, s.key)) count++;
      });
    });
    return count;
  }, [sections]);

  const hiddenTotal = totalSections - visibleTotal;

  // Single section toggle with instant API update
  const handleToggle = async (key) => {
    const isCurrentlyVisible = isSectionVisible(sections, key);
    const newVisible = !isCurrentlyVisible;

    // Optimistic UI update
    setSections((prev) => ({ ...prev, [key]: newVisible }));
    showToast(
      newVisible ? 'Section is now VISIBLE on website.' : 'Section is now HIDDEN from website.',
      true
    );

    try {
      await updateSections({ [key]: newVisible });
    } catch (err) {
      console.error('Toggle error:', err);
      // Revert optimistic update on error
      setSections((prev) => ({ ...prev, [key]: isCurrentlyVisible }));
      showToast('Network error saving visibility setting.', false);
    }
  };

  // Show all sections across the entire site
  const handleShowAll = async () => {
    if (!window.confirm(`Make all ${totalSections} sections visible across the entire website?`)) {
      return;
    }
    const allVis = { ...sections };
    SECTION_REGISTRY.forEach((g) => {
      g.sections.forEach((s) => {
        allVis[s.key] = true;
      });
    });

    setSections(allVis);
    try {
      await updateSections(allVis);
      showToast('All website sections are now set to VISIBLE.', true);
    } catch (err) {
      console.error('Show all error:', err);
      showToast('Failed to update visibility settings.', false);
    }
  };

  // Group-level Show All or Hide All
  const handleGroupToggle = async (groupKey, visible) => {
    const group = SECTION_REGISTRY.find((g) => g.key === groupKey);
    if (!group) return;

    if (!visible && !window.confirm(`Hide all sections in '${group.group_title}'?`)) {
      return;
    }

    const updated = { ...sections };
    group.sections.forEach((s) => {
      updated[s.key] = visible;
    });

    setSections(updated);
    try {
      await updateSections(updated);
      showToast(
        `All sections in '${group.group_title}' are now ${visible ? 'VISIBLE' : 'HIDDEN'}.`,
        true
      );
    } catch (err) {
      console.error('Group toggle error:', err);
      showToast('Failed to update group visibility.', false);
    }
  };

  // Explicit Save All (bulk save form submission)
  const handleSaveAll = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await updateSections(sections);
      showToast('All section visibility settings have been saved and synced across the website!', true);
    } catch (err) {
      console.error('Bulk save error:', err);
      showToast('Failed to write section visibility settings.', false);
    } finally {
      setSaving(false);
    }
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();

  return (
    <AdminLayout pageTitle="Section Visibility Controls">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-header-title">Website Section Visibility Controls</h1>
          <p className="page-header-desc">
            Instantly hide or unhide any section across Cyber Security, Digital Investigation, About Us, Service Detail, Contact, and Global pages. Changes apply live immediately.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
              padding: '0.45rem 0.9rem',
              background: 'var(--bg-surface-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              fontSize: '0.82rem',
            }}
          >
            <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>
              👁️ {visibleTotal}
            </span>{' '}
            Visible
            <span style={{ opacity: 0.3 }}>|</span>
            <span style={{ color: 'var(--accent-amber)', fontWeight: 700 }}>
              {hiddenTotal}
            </span>{' '}
            Hidden
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleShowAll}
            title="Make all sections visible"
          >
            <span>👁️</span> Show All Sections
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Toolbar */}
      <div className="sv-toolbar">
        <div className="sv-filter-tabs">
          <button
            type="button"
            className={`sv-tab-btn ${activeGroup === 'all' ? 'active' : ''}`}
            onClick={() => setActiveGroup('all')}
          >
            All Pages ({totalSections})
          </button>
          {SECTION_REGISTRY.map((group) => (
            <button
              key={group.key}
              type="button"
              className={`sv-tab-btn ${activeGroup === group.key ? 'active' : ''}`}
              onClick={() => setActiveGroup(group.key)}
            >
              {group.group_icon} {group.group_title} ({group.sections.length})
            </button>
          ))}
        </div>
        <input
          type="text"
          className="form-control sv-search-input"
          placeholder="Filter sections by name or keyword..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Main Section Cards */}
      <form onSubmit={handleSaveAll}>
        {SECTION_REGISTRY.map((group) => {
          const isGroupSelected = activeGroup === 'all' || activeGroup === group.key;
          if (!isGroupSelected) return null;

          // Filter sections by search query
          const filteredSections = group.sections.filter((s) => {
            if (!normalizedQuery) return true;
            const searchCorpus = `${s.label} ${s.desc} ${s.key}`.toLowerCase();
            return searchCorpus.includes(normalizedQuery);
          });

          // If search query is entered and no sections in this group match, omit the card
          if (normalizedQuery && filteredSections.length === 0) return null;

          // Count group visible
          const groupTotal = group.sections.length;
          const groupVisible = group.sections.filter((s) => isSectionVisible(sections, s.key)).length;

          return (
            <div key={group.key} className="admin-card sv-group-card">
              <div className="admin-card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3
                    className="admin-card-title"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}
                  >
                    <span>{group.group_icon}</span>
                    <span>{group.group_title}</span>
                    <span className="sv-code-badge">{group.group_file}</span>
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {group.group_desc}
                  </p>
                </div>
                <div className="sv-group-actions">
                  <span className="status-pill active">
                    {groupVisible} / {groupTotal} Visible
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleGroupToggle(group.key, true)}
                  >
                    Show All
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleGroupToggle(group.key, false)}
                  >
                    Hide All
                  </button>
                </div>
              </div>
              <div className="admin-card-body">
                <div className="sv-grid">
                  {filteredSections.map((meta) => {
                    const isVis = isSectionVisible(sections, meta.key);
                    return (
                      <div
                        key={meta.key}
                        className={`sv-item ${isVis ? '' : 'is-hidden-state'}`}
                        onClick={() => handleToggle(meta.key)}
                      >
                        <div className="sv-item-info">
                          <div className="sv-item-title-row">
                            <span className="sv-item-title">{meta.label}</span>
                            <span className={`sv-state-pill ${isVis ? 'visible' : 'hidden'}`}>
                              {isVis ? 'Visible' : 'Hidden'}
                            </span>
                          </div>
                          <div className="sv-item-desc">{meta.desc}</div>
                        </div>
                        <label
                          className="sv-switch"
                          title={`Toggle visibility for ${meta.label}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isVis}
                            onChange={() => handleToggle(meta.key)}
                          />
                          <span className="sv-slider" />
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {/* Footer Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem',
            paddingTop: '0.5rem',
            marginBottom: '2rem',
          }}
        >
          <Link to="/admin" className="btn btn-secondary">
            Back to Dashboard
          </Link>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <span>💾</span> {saving ? 'Saving...' : 'Save All Section Visibility Settings'}
          </button>
        </div>
      </form>

      {/* Floating Status Toast Notification */}
      {toast.show && (
        <div
          className="sv-toast"
          style={{
            borderColor: toast.ok ? 'rgba(0, 230, 118, 0.65)' : 'rgba(255, 51, 102, 0.75)',
          }}
          role="status"
          aria-live="polite"
        >
          <span>{toast.ok ? '✅' : '⚠️'}</span>
          <span>{toast.msg}</span>
        </div>
      )}
    </AdminLayout>
  );
}
