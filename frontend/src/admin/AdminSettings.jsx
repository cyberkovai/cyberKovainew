import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { getSettings, updateSettings } from '../api/client';

export default function AdminSettings() {
  const [formData, setFormData] = useState({
    site_name: '',
    site_tagline: '',
    site_email: '',
    site_phone: '',
    site_phone_tel: '',
    site_phone_alt: '',
    site_location: '',
    site_address: '',
    working_hours: '',
    social_linkedin: '',
    social_twitter: '',
    show_team: true,
    show_testimonials: true,
  });
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getSettings().then(data => {
      if (data) {
        setFormData({
          site_name: data.site_name || '',
          site_tagline: data.site_tagline || '',
          site_email: data.site_email || '',
          site_phone: data.site_phone || '',
          site_phone_tel: data.site_phone_tel || '',
          site_phone_alt: data.site_phone_alt || '',
          site_location: data.site_location || '',
          site_address: data.site_address || '',
          working_hours: data.working_hours || '',
          social_linkedin: data.social_linkedin || '',
          social_twitter: data.social_twitter || '',
          show_team: data.show_team !== false && data.show_team !== '0' && data.show_team !== 0,
          show_testimonials: data.show_testimonials !== false && data.show_testimonials !== '0' && data.show_testimonials !== 0,
        });
      }
    }).catch(err => {
      console.error('Failed to load settings:', err);
    });
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let val = value;
    if (type === 'checkbox') {
      val = checked;
    } else if (name === 'show_team' || name === 'show_testimonials') {
      val = value === '1' || value === 1 || value === true;
    }
    setFormData(prev => ({
      ...prev,
      [name]: val,
    }));
    setSavedSuccess(false);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    setError(null);
    try {
      await updateSettings(formData);
      setSavedSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout pageTitle="Site & Contact Settings">
      <div className="page-header-row">
        <div>
          <h1 className="page-header-title">Application Contact Info &amp; Site Settings</h1>
          <p className="page-header-desc">
            Edit the official email ID, phone numbers, and physical address. Updates take effect immediately throughout all headers, footers, contact portals, and notification services.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="flash-alert success" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>✓</span>
            <span>Application contact information and site settings successfully updated! Changes are live across all pages, footers, headers, and contact forms.</span>
          </div>
          <button type="button" className="flash-close-btn" onClick={() => setSavedSuccess(false)} title="Dismiss">×</button>
        </div>
      )}

      {error && (
        <div className="flash-alert error" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>✕</span>
            <span>{error}</span>
          </div>
          <button type="button" className="flash-close-btn" onClick={() => setError(null)} title="Dismiss">×</button>
        </div>
      )}

      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">Global Contact &amp; Business Information</h3>
          <span className="status-pill active">
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e676', display: 'inline-block', marginRight: '4px' }}></span>
            File Storage Synced
          </span>
        </div>
        <div className="admin-card-body">
          <form onSubmit={handleSubmit}>
            {/* Phone Numbers Section */}
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '1rem', color: 'var(--accent-purple-light, #c06cff)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>📞</span> Phone Numbers
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted, #676384)', marginBottom: '1.25rem' }}>
                Configure customer-facing display numbers and device auto-dial link values.
              </p>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="site_phone" className="form-label">
                    Primary Phone (Display Format) <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="site_phone"
                    name="site_phone"
                    className="form-control"
                    required
                    placeholder="+91 63820 19821"
                    value={formData.site_phone || ''}
                    onChange={handleChange}
                  />
                  <span className="form-help">Formatted for visual display in navbar, footer, and buttons (e.g. +91 63820 19821)</span>
                </div>

                <div className="form-group">
                  <label htmlFor="site_phone_tel" className="form-label">
                    Click-to-Call Number (tel: Protocol) <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="site_phone_tel"
                    name="site_phone_tel"
                    className="form-control"
                    required
                    placeholder="+916382019821"
                    value={formData.site_phone_tel || ''}
                    onChange={handleChange}
                  />
                  <span className="form-help">E.164 international digits without spaces, used for mobile dialer links (e.g. +916382019821)</span>
                </div>

                <div className="form-group col-full">
                  <label htmlFor="site_phone_alt" className="form-label">
                    Secondary / WhatsApp / Signal Number
                  </label>
                  <input
                    type="text"
                    id="site_phone_alt"
                    name="site_phone_alt"
                    className="form-control"
                    placeholder="+91 98765 43210"
                    value={formData.site_phone_alt || ''}
                    onChange={handleChange}
                  />
                  <span className="form-help">Optional alternative hotline or WhatsApp contact number</span>
                </div>
              </div>
            </div>

            {/* Email Address Section */}
            <div style={{ marginBottom: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color, rgba(158, 62, 255, 0.22))' }}>
              <h4 style={{ fontSize: '1rem', color: 'var(--accent-purple-light, #c06cff)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>✉️</span> Email Address
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted, #676384)', marginBottom: '1.25rem' }}>
                Official inquiries, forensic report requests, and automated contact form recipient.
              </p>

              <div className="form-grid">
                <div className="form-group col-full">
                  <label htmlFor="site_email" className="form-label">
                    Primary Official Email ID <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    id="site_email"
                    name="site_email"
                    className="form-control"
                    required
                    placeholder="info@cyberkovai.com"
                    value={formData.site_email || ''}
                    onChange={handleChange}
                  />
                  <span className="form-help">Displayed in all headers and footers; receiving inbox for website inquiries.</span>
                </div>
              </div>
            </div>

            {/* Address & Location Section */}
            <div style={{ marginBottom: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color, rgba(158, 62, 255, 0.22))' }}>
              <h4 style={{ fontSize: '1rem', color: 'var(--accent-purple-light, #c06cff)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>📍</span> Address &amp; Geographical Location
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted, #676384)', marginBottom: '1.25rem' }}>
                Geographical hub and full corporate office location.
              </p>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="site_location" className="form-label">
                    City / Region Headline <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="site_location"
                    name="site_location"
                    className="form-control"
                    required
                    placeholder="Coimbatore, Tamil Nadu, India"
                    value={formData.site_location || ''}
                    onChange={handleChange}
                  />
                  <span className="form-help">Short location tag displayed in footer items &amp; badge pills.</span>
                </div>

                <div className="form-group">
                  <label htmlFor="working_hours" className="form-label">
                    Operational / Working Hours
                  </label>
                  <input
                    type="text"
                    id="working_hours"
                    name="working_hours"
                    className="form-control"
                    placeholder="24/7 Incident Response & Emergency Forensics"
                    value={formData.working_hours || ''}
                    onChange={handleChange}
                  />
                  <span className="form-help">Operating availability notice.</span>
                </div>

                <div className="form-group col-full">
                  <label htmlFor="site_address" className="form-label">
                    Full Physical Office Address <span className="required">*</span>
                  </label>
                  <textarea
                    id="site_address"
                    name="site_address"
                    rows="3"
                    className="form-control"
                    required
                    placeholder="Full Street Address, IT Park, City, PIN"
                    value={formData.site_address || ''}
                    onChange={handleChange}
                  ></textarea>
                  <span className="form-help">Detailed physical headquarters address.</span>
                </div>
              </div>
            </div>

            {/* General Application Identity Section */}
            <div style={{ marginBottom: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color, rgba(158, 62, 255, 0.22))' }}>
              <h4 style={{ fontSize: '1rem', color: 'var(--accent-purple-light, #c06cff)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🛡️</span> Application Identity &amp; Social Links
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted, #676384)', marginBottom: '1.25rem' }}>
                Site title, brand tagline, and social profile links.
              </p>

              <div className="identity-social-grid">
                <div className="form-group">
                  <label htmlFor="site_name" className="form-label">
                    Site / Brand Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="site_name"
                    name="site_name"
                    className="form-control"
                    required
                    placeholder="Cyber Kovai"
                    value={formData.site_name || ''}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="site_tagline" className="form-label">
                    Brand Tagline
                  </label>
                  <input
                    type="text"
                    id="site_tagline"
                    name="site_tagline"
                    className="form-control"
                    placeholder="Verified Facts, Confident Decisions."
                    value={formData.site_tagline || ''}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="social_linkedin" className="form-label">
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    id="social_linkedin"
                    name="social_linkedin"
                    className="form-control"
                    placeholder="https://linkedin.com/company/cyberkovai"
                    value={formData.social_linkedin || ''}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="social_twitter" className="form-label">
                    Twitter / X URL
                  </label>
                  <input
                    type="url"
                    id="social_twitter"
                    name="social_twitter"
                    className="form-control"
                    placeholder="https://twitter.com/cyberkovai"
                    value={formData.social_twitter || ''}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Website Features & Visibility Section */}
            <div style={{ marginBottom: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color, rgba(158, 62, 255, 0.22))' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <h4 style={{ fontSize: '1rem', color: 'var(--accent-purple-light, #c06cff)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <span>⚙️</span> Website Features &amp; Visibility Controls
                </h4>
                <Link to="/admin/section-visibility" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>👁️</span> Manage Every Page Section Visibility ➔
                </Link>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted, #676384)', marginBottom: '1.25rem' }}>
                Control the public display of major website sections, or use <Link to="/admin/section-visibility" style={{ color: 'var(--accent-cyan, #00e5ff)' }}>Section Visibility</Link> to hide/unhide every individual section across all pages.
              </p>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="show_team" className="form-label">
                    Our Team Page Visibility <span className="required">*</span>
                  </label>
                  <select
                    id="show_team"
                    name="show_team"
                    className="form-control"
                    style={{ fontWeight: 600 }}
                    value={formData.show_team ? '1' : '0'}
                    onChange={handleChange}
                  >
                    <option value="1">
                      Visible — Show "Our Team" in header menu, footer links, and allow /team.php
                    </option>
                    <option value="0">
                      Hidden — Hide "Our Team" from all navigation menus &amp; redirect visitors
                    </option>
                  </select>
                  <span className="form-help">
                    When set to <strong>Hidden</strong>, "Our Team" is hidden from menus and /team.php redirects to About.
                  </span>
                </div>

                <div className="form-group">
                  <label htmlFor="show_testimonials" className="form-label">
                    Client Testimonials Visibility <span className="required">*</span>
                  </label>
                  <select
                    id="show_testimonials"
                    name="show_testimonials"
                    className="form-control"
                    style={{ fontWeight: 600 }}
                    value={formData.show_testimonials ? '1' : '0'}
                    onChange={handleChange}
                  >
                    <option value="1">
                      Visible — Display testimonials section on website &amp; footer link
                    </option>
                    <option value="0">
                      Hidden — Completely hide testimonials section &amp; footer link from website
                    </option>
                  </select>
                  <span className="form-help">
                    When set to <strong>Hidden</strong>, the testimonials section is completely hidden from the public website.
                  </span>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--border-color, rgba(158, 62, 255, 0.22))', display: 'flex', justifyContent: 'flex-end', gap: '1rem', alignItems: 'center' }}>
              <button type="button" onClick={() => navigate('/admin')} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>💾</span> {saving ? 'Saving Settings...' : 'Save All Site Settings & Contact Info'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
