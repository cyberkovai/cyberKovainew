import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import {
  adminGetCyberServices,
  adminSaveCyberService,
  adminDeleteCyberService,
} from '../api/client';

const CATEGORIES = [
  { key: 'application-security', name: 'Application Security' },
  { key: 'network-security', name: 'Network Security' },
  { key: 'cloud-security', name: 'Cloud Security' },
  { key: 'enterprise-security', name: 'Enterprise Security' },
];

const CATEGORY_MAP = {
  'application-security': 'Application Security',
  'network-security': 'Network Security',
  'cloud-security': 'Cloud Security',
  'enterprise-security': 'Enterprise Security',
};

const slugify = (text) =>
  (text || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');

const parseKeyFeatures = (text) => {
  if (!text) return [];
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(':');
      if (idx !== -1) {
        return {
          title: line.slice(0, idx).trim(),
          desc: line.slice(idx + 1).trim(),
        };
      }
      return { title: line, desc: '' };
    });
};

const parseDeliverables = (text) => {
  if (!text) return [];
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
};

export default function AdminCyberServices() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [servicesRaw, setServicesRaw] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState('all');
  const [mode, setMode] = useState('list'); // 'list' | 'form'
  const [editingSlug, setEditingSlug] = useState(null);
  const [originalItem, setOriginalItem] = useState(null);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState(null);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [targetToDelete, setTargetToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    nav_label: '',
    footer_name: '',
    category: 'application-security',
    badge: '',
    status: 'active',
    tagline: '',
    short_desc: '',
    overview: '',
    why_needed: '',
    key_features: '',
    deliverables: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await adminGetCyberServices();
      setServicesRaw(data || {});
    } catch (err) {
      setFlash({
        type: 'error',
        message: 'Failed to load cyber services: ' + (err.message || 'Network error'),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Normalize raw data into an array of services with guaranteed slug
  const serviceList = useMemo(() => {
    if (!servicesRaw) return [];
    if (Array.isArray(servicesRaw)) {
      return servicesRaw.map((s, idx) => ({
        ...s,
        slug: s.slug || s.id || `cyber-service-${idx + 1}`,
      }));
    }
    return Object.entries(servicesRaw).map(([keySlug, svc]) => ({
      ...svc,
      slug: svc.slug || keySlug,
    }));
  }, [servicesRaw]);

  // Handle URL query parameters for deep linking (?action=add or ?action=edit&slug=...)
  useEffect(() => {
    const action = searchParams.get('action');
    const slug = searchParams.get('slug');
    const cat = searchParams.get('category');

    if (cat && (cat === 'all' || CATEGORY_MAP[cat])) {
      setFilterCat(cat);
    }

    if (action === 'add') {
      openAdd();
    } else if (action === 'edit' && slug && serviceList.length > 0) {
      const match = serviceList.find((s) => s.slug === slug);
      if (match) {
        openEdit(match);
      }
    }
  }, [searchParams, serviceList]);

  // Dynamic counts for each category
  const categoryCounts = useMemo(() => {
    const counts = { all: serviceList.length };
    CATEGORIES.forEach((c) => {
      counts[c.key] = serviceList.filter((s) => (s.category || '') === c.key).length;
    });
    return counts;
  }, [serviceList]);

  // Filtered services for table
  const filteredList = useMemo(() => {
    if (filterCat === 'all') return serviceList;
    return serviceList.filter((s) => (s.category || '') === filterCat);
  }, [serviceList, filterCat]);

  const openAdd = () => {
    setEditingSlug(null);
    setOriginalItem(null);
    setSlugManuallyEdited(false);
    setFormData({
      slug: '',
      title: '',
      nav_label: '',
      footer_name: '',
      category: filterCat !== 'all' ? filterCat : 'application-security',
      badge: '',
      status: 'active',
      tagline: '',
      short_desc: '',
      overview: '',
      why_needed: '',
      key_features: '',
      deliverables: '',
    });
    setMode('form');
  };

  const openEdit = (svc) => {
    setEditingSlug(svc.slug);
    setOriginalItem(svc);
    setSlugManuallyEdited(true);

    let kfText = '';
    if (Array.isArray(svc.key_features)) {
      kfText = svc.key_features
        .map((f) => (typeof f === 'string' ? f : `${f.title || ''}: ${f.desc || ''}`))
        .join('\n');
    } else if (typeof svc.key_features === 'string') {
      kfText = svc.key_features;
    }

    let delivText = '';
    if (Array.isArray(svc.deliverables)) {
      delivText = svc.deliverables
        .map((d) => (typeof d === 'string' ? d : d.title || d.desc || ''))
        .join('\n');
    } else if (typeof svc.deliverables === 'string') {
      delivText = svc.deliverables;
    }

    let overviewText = svc.overview || '';
    if (!overviewText && (svc.overview_p1 || svc.overview_p2)) {
      overviewText = [svc.overview_p1, svc.overview_p2].filter(Boolean).join('\n\n');
    }

    setFormData({
      slug: svc.slug || '',
      title: svc.title || '',
      nav_label: svc.nav_label || svc.title || '',
      footer_name: svc.footer_name || svc.nav_label || svc.title || '',
      category: svc.category || 'application-security',
      badge: svc.badge || '',
      status: svc.status || (svc.active !== false ? 'active' : 'inactive'),
      tagline: svc.tagline || '',
      short_desc: svc.short_desc || '',
      overview: overviewText,
      why_needed: svc.why_needed || '',
      key_features: kfText,
      deliverables: delivText,
    });

    setMode('form');
  };

  const handleBackToList = () => {
    setMode('list');
    setEditingSlug(null);
    setOriginalItem(null);
    setSearchParams(filterCat !== 'all' ? { category: filterCat } : {});
  };

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => {
      const next = { ...prev, title: val };
      if (!editingSlug && !slugManuallyEdited) {
        next.slug = slugify(val);
      }
      if (!editingSlug && (!prev.nav_label || prev.nav_label === prev.title)) {
        next.nav_label = val;
      }
      if (!editingSlug && (!prev.footer_name || prev.footer_name === prev.title)) {
        next.footer_name = val;
      }
      return next;
    });
  };

  const handleCategoryFilter = (catKey) => {
    setFilterCat(catKey);
    if (catKey === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ category: catKey });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFlash(null);

    try {
      const cleanSlug = slugify(formData.slug || formData.title);
      if (!cleanSlug) {
        throw new Error('Service slug cannot be empty.');
      }
      if (!formData.title.trim()) {
        throw new Error('Service title cannot be empty.');
      }

      const payload = {
        ...(originalItem || {}),
        slug: cleanSlug,
        title: formData.title.trim(),
        nav_label: (formData.nav_label || formData.title).trim(),
        footer_name: (formData.footer_name || formData.nav_label || formData.title).trim(),
        category: formData.category,
        badge: (formData.badge || '').trim(),
        status: formData.status,
        active: formData.status === 'active',
        tagline: (formData.tagline || '').trim(),
        short_desc: (formData.short_desc || '').trim(),
        overview: (formData.overview || '').trim(),
        why_needed: (formData.why_needed || '').trim(),
        key_features: parseKeyFeatures(formData.key_features),
        deliverables: parseDeliverables(formData.deliverables),
      };

      await adminSaveCyberService(payload, editingSlug);
      setFlash({
        type: 'success',
        message: `Cyber service '${formData.title.trim()}' successfully saved!`,
      });
      setMode('list');
      setEditingSlug(null);
      setOriginalItem(null);
      setSearchParams(filterCat !== 'all' ? { category: filterCat } : {});
      await loadData();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setFlash({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to save cyber service.',
      });
    } finally {
      setSaving(false);
    }
  };

  const requestDelete = (svc) => {
    setTargetToDelete(svc);
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!targetToDelete) return;
    setDeleting(true);
    setFlash(null);
    try {
      await adminDeleteCyberService(targetToDelete.slug);
      setFlash({
        type: 'success',
        message: `Cyber service '${targetToDelete.title}' was successfully deleted.`,
      });
      setDeleteModalOpen(false);
      setTargetToDelete(null);
      await loadData();
    } catch (err) {
      setFlash({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Could not delete cyber service.',
      });
    } finally {
      setDeleting(false);
    }
  };

  const totalCyberCount = servicesRaw
    ? (Array.isArray(servicesRaw) ? servicesRaw.length : Object.keys(servicesRaw).length)
    : 26;

  return (
    <AdminLayout pageTitle="Cyber Security Services" currentCount={totalCyberCount || 26}>
      {/* ================= PAGE HEADER ROW ================= */}
      <div className="page-header-row">
        <div>
          <h1 className="page-header-title">Cyber Security &amp; Defense Services</h1>
          <p className="page-header-desc">
            Manage penetration testing, cloud architecture, network hardening, and enterprise cybersecurity services.
          </p>
        </div>
        {mode === 'list' ? (
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                openAdd();
                setSearchParams({ action: 'add' });
              }}
            >
              <span>+</span> Add Cyber Service
            </button>
            <Link
              to="/admin/faqs?track=cyber"
              className="btn btn-secondary btn-sm"
              title="Manage Cyber Security FAQs"
            >
              ❓ Cyber Security FAQs
            </Link>
            <a
              href={`${import.meta.env.BASE_URL}cyber-security#cyber-services`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              title="Preview on Cyber Security page"
            >
              Preview on Website ➔
            </a>
          </div>
        ) : (
          <div>
            <button type="button" className="btn btn-secondary" onClick={handleBackToList}>
              &larr; Back to Services List
            </button>
          </div>
        )}
      </div>

      {/* ================= FLASH MESSAGE BANNER ================= */}
      {flash && (
        <div className={`flash-alert ${flash.type}`} style={{ marginBottom: '1.5rem' }}>
          <span>
            <strong>{flash.type === 'success' ? '✓ Success:' : '⚠ Error:'}</strong> {flash.message}
          </span>
          <button
            type="button"
            className="flash-close-btn"
            onClick={() => setFlash(null)}
            aria-label="Close alert"
          >
            &times;
          </button>
        </div>
      )}

      {/* ================= ADD / EDIT VIEW ================= */}
      {mode === 'form' ? (
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">
              {editingSlug
                ? `Edit Cyber Service: ${formData.title || editingSlug}`
                : 'Add New Cyber Service'}
            </h3>
          </div>
          <div className="admin-card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group col-full">
                  <label htmlFor="svc-title" className="form-label">
                    Full Service Title <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="svc-title"
                    className="form-control"
                    required
                    placeholder="e.g. REST & GraphQL API Penetration Testing"
                    value={formData.title}
                    onChange={handleTitleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="svc-slug" className="form-label">
                    URL Slug <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="svc-slug"
                    className="form-control"
                    required
                    placeholder="e.g. api-penetration-testing"
                    value={formData.slug}
                    onChange={(e) => {
                      setSlugManuallyEdited(true);
                      setFormData((prev) => ({ ...prev, slug: e.target.value }));
                    }}
                  />
                  <span className="form-help">
                    Unique URL path (e.g. /services/api-penetration-testing)
                  </span>
                </div>

                <div className="form-group">
                  <label htmlFor="svc-category" className="form-label">
                    Security Category <span className="required">*</span>
                  </label>
                  <select
                    id="svc-category"
                    className="form-control"
                    required
                    value={formData.category}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, category: e.target.value }))
                    }
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.key} value={cat.key}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="svc-nav-label" className="form-label">
                    Menu / Navigation Label
                  </label>
                  <input
                    type="text"
                    id="svc-nav-label"
                    className="form-control"
                    placeholder="e.g. API Security Testing"
                    value={formData.nav_label}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, nav_label: e.target.value }))
                    }
                  />
                  <span className="form-help">
                    Compact label for header dropdown &amp; mega menu lists
                  </span>
                </div>

                <div className="form-group">
                  <label htmlFor="svc-footer-name" className="form-label">
                    Footer Name
                  </label>
                  <input
                    type="text"
                    id="svc-footer-name"
                    className="form-control"
                    placeholder="e.g. REST &amp; GraphQL API Testing"
                    value={formData.footer_name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, footer_name: e.target.value }))
                    }
                  />
                  <span className="form-help">
                    Custom label reflected in the website footer links (falls back to Menu Label if blank)
                  </span>
                </div>

                <div className="form-group">
                  <label htmlFor="svc-badge" className="form-label">
                    Certification / Standard Badge
                  </label>
                  <input
                    type="text"
                    id="svc-badge"
                    className="form-control"
                    placeholder="e.g. OWASP API Security Top 10"
                    value={formData.badge}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, badge: e.target.value }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="svc-status" className="form-label">
                    Publication Status
                  </label>
                  <select
                    id="svc-status"
                    className="form-control"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, status: e.target.value }))
                    }
                  >
                    <option value="active">Active (Visible on Website)</option>
                    <option value="inactive">Draft / Hidden</option>
                  </select>
                </div>

                <div className="form-group col-full">
                  <label htmlFor="svc-tagline" className="form-label">
                    Hero Tagline
                  </label>
                  <input
                    type="text"
                    id="svc-tagline"
                    className="form-control"
                    placeholder="Short impactful punchline for the hero banner..."
                    value={formData.tagline}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, tagline: e.target.value }))
                    }
                  />
                </div>

                <div className="form-group col-full">
                  <label htmlFor="svc-short-desc" className="form-label">
                    Short Description <span className="required">*</span>
                  </label>
                  <textarea
                    id="svc-short-desc"
                    className="form-control"
                    rows={3}
                    required
                    placeholder="Concise 1-2 sentence description for cards and search summaries..."
                    value={formData.short_desc}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, short_desc: e.target.value }))
                    }
                  />
                </div>

                <div className="form-group col-full">
                  <label htmlFor="svc-overview" className="form-label">
                    Detailed Overview
                  </label>
                  <textarea
                    id="svc-overview"
                    className="form-control"
                    rows={5}
                    placeholder="Detailed service description displayed on the dedicated service page..."
                    value={formData.overview}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, overview: e.target.value }))
                    }
                  />
                </div>

                <div className="form-group col-full">
                  <label htmlFor="svc-why-needed" className="form-label">
                    Why This Service is Critical (&quot;Why Needed&quot; Section)
                  </label>
                  <textarea
                    id="svc-why-needed"
                    className="form-control"
                    rows={3}
                    placeholder="Explain the risks, business impacts, or regulatory mandates..."
                    value={formData.why_needed}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, why_needed: e.target.value }))
                    }
                  />
                </div>

                <div className="form-group col-full">
                  <label htmlFor="svc-key-features" className="form-label">
                    Key Features (One feature per line, format: &quot;Feature Title: Feature Description&quot;)
                  </label>
                  <textarea
                    id="svc-key-features"
                    className="form-control"
                    rows={5}
                    placeholder={`Dual Methodology: Automated and manual verification\nThreat Modeling: Realistic adversary simulations\nBusiness Logic Flaws: Nuanced state testing`}
                    value={formData.key_features}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, key_features: e.target.value }))
                    }
                  />
                  <span className="form-help">Enter each capability on a new line.</span>
                </div>

                <div className="form-group col-full">
                  <label htmlFor="svc-deliverables" className="form-label">
                    Deliverables (One item per line)
                  </label>
                  <textarea
                    id="svc-deliverables"
                    className="form-control"
                    rows={4}
                    placeholder={`Executive Summary Report\nTechnical Vulnerability Dossier with CVSS v3.1\nProof of Concept (PoC) Exploit Code\nComplimentary Re-Testing Attestation`}
                    value={formData.deliverables}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, deliverables: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div
                style={{
                  paddingTop: '1.5rem',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  marginTop: '1.5rem',
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleBackToList}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <span>💾</span> {saving ? 'Saving...' : 'Save Cyber Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* ================= LIST VIEW ================= */
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
            <h3 className="admin-card-title">
              All Cyber Services ({filteredList.length} of {serviceList.length})
            </h3>

            {/* Category Filter Pills */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`btn btn-sm ${filterCat === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleCategoryFilter('all')}
              >
                All ({categoryCounts.all ?? serviceList.length})
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  className={`btn btn-sm ${filterCat === cat.key ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleCategoryFilter(cat.key)}
                >
                  {cat.name} ({categoryCounts[cat.key] ?? 0})
                </button>
              ))}
            </div>
          </div>

          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>#</th>
                  <th>Service Name</th>
                  <th>Category</th>
                  <th>Badge / Standard</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}
                    >
                      Loading cyber services...
                    </td>
                  </tr>
                ) : filteredList.length > 0 ? (
                  filteredList.map((svc, idx) => {
                    const catName =
                      CATEGORY_MAP[svc.category] || svc.category || 'General';
                    const isInactive =
                      svc.status === 'inactive' || svc.active === false;

                    return (
                      <tr key={svc.slug || idx}>
                        <td>
                          <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>
                            {idx + 1}
                          </span>
                        </td>
                        <td>
                          <span className="cell-title">{svc.title}</span>
                          <span className="cell-subtitle">
                            Slug:{' '}
                            <code style={{ color: 'var(--accent-purple-light)' }}>
                              {svc.slug}
                            </code>
                            {svc.footer_name ? (
                              <>
                                &nbsp;&bull;&nbsp;Footer:{' '}
                                <span style={{ color: 'var(--accent-cyan)', fontWeight: 500 }}>
                                  {svc.footer_name}
                                </span>
                              </>
                            ) : null}
                          </span>
                        </td>
                        <td>
                          <span className="category-tag">{catName}</span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {svc.badge || '—'}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`status-pill ${isInactive ? 'inactive' : 'active'}`}
                          >
                            {isInactive ? 'INACTIVE' : 'ACTIVE'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div
                            className="action-btns-group"
                            style={{ justifyContent: 'flex-end' }}
                          >
                            <a
                              href={`${import.meta.env.BASE_URL}services/${svc.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-action view"
                              title="View live page"
                            >
                              View
                            </a>
                            <button
                              type="button"
                              className="btn-action edit"
                              onClick={() => {
                                openEdit(svc);
                                setSearchParams({ action: 'edit', slug: svc.slug });
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn-action delete"
                              onClick={() => requestDelete(svc)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        textAlign: 'center',
                        padding: '2.5rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      No cyber services found in this category. Click &quot;Add Cyber Service&quot; above to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {deleteModalOpen && targetToDelete && (
        <div className="admin-modal-backdrop show">
          <div className="admin-modal-dialog" style={{ maxWidth: '480px' }}>
            <div className="admin-modal-content">
              <div className="admin-modal-header">
                <h3
                  style={{
                    margin: 0,
                    fontSize: '1.15rem',
                    color: '#ff3366',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span>🗑️</span> Confirm Service Deletion
                </h3>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={deleting}
                >
                  &times;
                </button>
              </div>
              <div className="admin-modal-body" style={{ padding: '1.5rem' }}>
                <p
                  style={{
                    margin: '0 0 1rem 0',
                    color: 'var(--text-primary)',
                    lineHeight: 1.6,
                  }}
                >
                  Are you sure you want to permanently delete{' '}
                  <strong style={{ color: '#fff' }}>{targetToDelete.title}</strong>?
                </p>
                <div
                  style={{
                    background: 'rgba(255, 51, 102, 0.08)',
                    border: '1px solid rgba(255, 51, 102, 0.25)',
                    borderRadius: '6px',
                    padding: '0.75rem 1rem',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <div>
                    Slug:{' '}
                    <code style={{ color: 'var(--accent-purple-light)' }}>
                      {targetToDelete.slug}
                    </code>
                  </div>
                  <div style={{ marginTop: '0.25rem' }}>
                    Category:{' '}
                    <span style={{ color: '#fff' }}>
                      {CATEGORY_MAP[targetToDelete.category] || targetToDelete.category}
                    </span>
                  </div>
                  <div
                    style={{
                      marginTop: '0.6rem',
                      color: '#ff3366',
                      fontWeight: 600,
                    }}
                  >
                    ⚠ This action cannot be undone.
                  </div>
                </div>
              </div>
              <div
                className="admin-modal-footer"
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  padding: '1rem 1.5rem',
                  borderTop: '1px solid var(--border-color)',
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={executeDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete Service'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
