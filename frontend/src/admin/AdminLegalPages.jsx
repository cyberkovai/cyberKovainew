import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from './AdminLayout';
import { adminGetLegal, adminSaveLegal } from '../api/client';

const tabMeta = {
  privacy: {
    icon: '🔒',
    name: 'Privacy Policy',
    url: '../privacy-policy.php',
    liveUrl: '/privacy-policy',
  },
  terms: {
    icon: '⚖️',
    name: 'Terms & Conditions',
    url: '../terms-conditions.php',
    liveUrl: '/terms-conditions',
  },
  disclosure: {
    icon: '🛡️',
    name: 'Security Disclosure',
    url: '../security-disclosure.php',
    liveUrl: '/security-disclosure',
  },
};

export default function AdminLegalPages() {
  const [policies, setPolicies] = useState({});
  const [activeTab, setActiveTab] = useState('privacy');
  const [formData, setFormData] = useState({
    title: '',
    badge: '',
    last_updated: '',
    lead_summary: '',
    content: '',
  });
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    adminGetLegal()
      .then(data => {
        setPolicies(data || {});
        if (data && data[activeTab]) {
          setFormData(data[activeTab]);
        }
      })
      .catch(() => {});
  }, []);

  const switchTab = (tabKey) => {
    setActiveTab(tabKey);
    setSavedSuccess(false);
    if (policies[tabKey]) {
      setFormData(policies[tabKey]);
    } else {
      setFormData({
        title: tabMeta[tabKey]?.name || '',
        badge: '',
        last_updated: 'November 2026',
        lead_summary: '',
        content: '',
      });
    }
  };

  const handleCancel = () => {
    if (policies[activeTab]) {
      setFormData(policies[activeTab]);
      setSavedSuccess(false);
    }
  };

  const insertSnippet = (type) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    let snippet = '';
    if (type === 'heading') {
      snippet = "\n\n<h3>New Section Heading</h3>\n<p>Add descriptive paragraph here explaining this clause or policy commitment.</p>\n";
    } else if (type === 'paragraph') {
      snippet = "\n<p>Your paragraph text goes here.</p>\n";
    } else if (type === 'list') {
      snippet = "\n<ul>\n    <li>First specification item or guideline</li>\n    <li>Second specification item or guideline</li>\n    <li>Third specification item or guideline</li>\n</ul>\n";
    } else if (type === 'callout') {
      snippet = "\n<div style=\"padding: 1rem 1.25rem; background: rgba(158,62,255,0.08); border-left: 3px solid #00f0ff; border-radius: 6px; margin: 1.25rem 0;\">\n    <strong>Important Note:</strong> Highlighted notice or safe-harbor guideline for clients and researchers.\n</div>\n";
    }

    const currentVal = formData.content || '';
    const startPos = textarea.selectionStart ?? currentVal.length;
    const endPos = textarea.selectionEnd ?? currentVal.length;
    const newContent = currentVal.substring(0, startPos) + snippet + currentVal.substring(endPos);

    setFormData(prev => ({ ...prev, content: newContent }));

    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        textarea.selectionStart = startPos + snippet.length;
        textarea.selectionEnd = startPos + snippet.length;
      }
    }, 0);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      await adminSaveLegal(activeTab, formData);
      setPolicies(prev => ({
        ...prev,
        [activeTab]: {
          ...formData,
          updated_at: new Date().toISOString(),
        },
      }));
      setSavedSuccess(true);
    } catch (err) {
      alert('Error saving policy: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const currentMeta = tabMeta[activeTab] || tabMeta.privacy;

  return (
    <AdminLayout pageTitle="Legal &amp; Policy Management">
      {/* ================= PAGE HEADER ================= */}
      <div className="page-header-row">
        <div>
          <h1 className="page-header-title">Legal Documents &amp; Policy Management</h1>
          <p className="page-header-desc">
            Edit client-facing privacy policies, terms of service, and vulnerability disclosure standards displayed in website footers and compliance dockets.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <a
            href={`${import.meta.env.BASE_URL}${currentMeta.liveUrl.replace(/^\/+/, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
            title="Preview live legal page in new tab"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', textDecoration: 'none' }}
          >
            Preview Live Policy ➔
          </a>
        </div>
      </div>

      {/* ================= POLICY TAB SELECTOR ================= */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          borderBottom: '1px solid rgba(158, 62, 255, 0.2)',
          paddingBottom: '0.85rem',
        }}
      >
        {Object.entries(tabMeta).map(([tKey, meta]) => (
          <button
            key={tKey}
            type="button"
            className={`btn btn-sm ${activeTab === tKey ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => switchTab(tKey)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.55rem 1.15rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <span>{meta.icon}</span>
            <span>{meta.name}</span>
            {policies[tKey] && (
              <span style={{ fontSize: '0.65rem', opacity: 0.75, fontWeight: 500 }}>(Saved)</span>
            )}
          </button>
        ))}
      </div>

      {/* ================= SUCCESS NOTIFICATION ================= */}
      {savedSuccess && (
        <div
          className="flash-alert success"
          style={{
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>
            <strong>✓ Success:</strong> Legal document &apos;{formData.title || currentMeta.name}&apos; was successfully updated and is live on the website!
          </span>
          <button
            type="button"
            className="flash-close-btn"
            onClick={() => setSavedSuccess(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              fontSize: '1.25rem',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>
      )}

      {/* ================= POLICY EDIT FORM CARD ================= */}
      <div className="admin-card">
        <div
          className="admin-card-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h3
              className="admin-card-title"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}
            >
              <span>{currentMeta.icon}</span>
              <span>Editing: {formData.title || currentMeta.name}</span>
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Target URL: <code style={{ fontFamily: "Consolas, 'Courier New', monospace", color: '#00f0ff', background: 'rgba(0, 240, 255, 0.08)', padding: '0.15rem 0.35rem', borderRadius: '4px' }}>{currentMeta.url}</code>
            </span>
          </div>
          <div>
            <span
              className="status-pill active"
              style={{
                fontSize: '0.72rem',
                letterSpacing: '0.05em',
                fontWeight: 700,
              }}
            >
              LAST REVISED: {(formData.last_updated || 'NOVEMBER 2026').toUpperCase()}
            </span>
          </div>
        </div>

        <div className="admin-card-body">
          <form onSubmit={handleSave} id="policyForm">
            <div
              className="form-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {/* Document Title */}
              <div className="form-group">
                <label htmlFor="policy_title" className="form-label">
                  Document Title <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="policy_title"
                  name="title"
                  className="form-control"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
                <span className="form-help">Headline displayed as the main title of this legal policy.</span>
              </div>

              {/* Section Tag Pill */}
              <div className="form-group">
                <label htmlFor="policy_badge" className="form-label">
                  Section Tag Pill
                </label>
                <input
                  type="text"
                  id="policy_badge"
                  name="badge"
                  className="form-control"
                  placeholder="e.g. DATA PRIVACY &amp; INTEGRITY"
                  value={formData.badge}
                  onChange={(e) => setFormData(prev => ({ ...prev, badge: e.target.value }))}
                />
                <span className="form-help">Small illuminated tag pill rendered above the policy headline.</span>
              </div>

              {/* Revision Notice / Date */}
              <div className="form-group">
                <label htmlFor="policy_last_updated" className="form-label">
                  Revision Notice / Date <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="policy_last_updated"
                  name="last_updated"
                  className="form-control"
                  required
                  placeholder="e.g. November 2026 or November 6, 2026"
                  value={formData.last_updated}
                  onChange={(e) => setFormData(prev => ({ ...prev, last_updated: e.target.value }))}
                />
                <span className="form-help">Effective revision date visible to clients and auditing bodies.</span>
              </div>

              {/* Lead Overview Summary */}
              <div className="form-group col-full" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="policy_lead_summary" className="form-label">
                  Lead Overview Summary <span className="required">*</span>
                </label>
                <textarea
                  id="policy_lead_summary"
                  name="lead_summary"
                  rows={3}
                  className="form-control"
                  required
                  placeholder="Introductory paragraph rendered in the page header..."
                  value={formData.lead_summary}
                  onChange={(e) => setFormData(prev => ({ ...prev, lead_summary: e.target.value }))}
                />
                <span className="form-help">Introductory paragraph rendered in the page header.</span>
              </div>

              {/* Content Area with Formatting Bar */}
              <div className="form-group col-full" style={{ gridColumn: '1 / -1' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <label htmlFor="policy_content" className="form-label" style={{ margin: 0 }}>
                    Full Legal Document Content (HTML Supported) <span className="required">*</span>
                  </label>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => insertSnippet('heading')}
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                      title="Insert Heading 3"
                    >
                      + Section Heading
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => insertSnippet('paragraph')}
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                      title="Insert Paragraph"
                    >
                      + Paragraph
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => insertSnippet('list')}
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                      title="Insert Bullet List"
                    >
                      + Bullet List
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => insertSnippet('callout')}
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                      title="Insert Highlight Callout"
                    >
                      + Callout Box
                    </button>
                  </div>
                </div>
                <textarea
                  id="policy_content"
                  ref={textareaRef}
                  name="content"
                  rows={18}
                  className="form-control"
                  required
                  style={{
                    fontFamily: "Consolas, 'Courier New', monospace",
                    fontSize: '0.88rem',
                    lineHeight: 1.6,
                  }}
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                />
                <span className="form-help">
                  Clean HTML formatting is supported: <code>&lt;h3&gt;Section Title&lt;/h3&gt;</code>, <code>&lt;p&gt;Text&lt;/p&gt;</code>, <code>&lt;ul&gt;&lt;li&gt;Item&lt;/li&gt;&lt;/ul&gt;</code>, <code>&lt;strong&gt;Bold&lt;/strong&gt;</code>, <code>&lt;a href="..."&gt;Link&lt;/a&gt;</code>.
                </span>
              </div>
            </div>

            {/* Action Buttons Footer */}
            <div
              style={{
                marginTop: '1.75rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Changes take effect immediately on public URLs.
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCancel}
                  style={{ padding: '0.65rem 1.4rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    padding: '0.65rem 1.6rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                  }}
                  disabled={saving}
                >
                  <span>💾</span> {saving ? `Saving ${currentMeta.name}...` : `Save ${currentMeta.name}`}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
