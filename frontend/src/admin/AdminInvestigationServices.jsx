import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import {
  adminGetInvestigationServices,
  adminSaveInvestigationService,
  adminDeleteInvestigationService,
  adminToggleInvestigationService,
  adminUploadFile,
} from '../api/client';
import { getAssetUrl } from '../utils/assets';

export default function AdminInvestigationServices() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState(null);

  // View state: 'list' | 'add' | 'edit'
  const [view, setView] = useState('list');
  const [currentStatus, setCurrentStatus] = useState('all');

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Editing service slug (null if adding)
  const [editingSlug, setEditingSlug] = useState(null);

  // Form State
  const defaultForm = {
    id: '',
    slug: '',
    title: '',
    short: '',
    footer_name: '',
    icon: '🛡️',
    image: 'assets/images/investigation_01_victim_recovery.jpg',
    description: '',
    overview: '',
    order: 1,
    status: 'active',
  };
  const [formData, setFormData] = useState(defaultForm);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await adminGetInvestigationServices();
      if (Array.isArray(data)) {
        setServices(data);
      }
    } catch (err) {
      console.error('Error loading investigation services:', err);
      setFlash({ type: 'error', message: 'Failed to load investigation practices: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle URL query triggers e.g. ?action=add or ?action=edit&slug=...
  useEffect(() => {
    const action = searchParams.get('action');
    const slug = searchParams.get('slug');
    if (action === 'add') {
      openAdd();
      setSearchParams({}, { replace: true });
    } else if (action === 'edit' && slug && services.length > 0) {
      const match = services.find((s) => s.slug === slug);
      if (match) {
        openEdit(match);
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, services]);

  // Auto-dismiss flash after 5s
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 5000);
    return () => clearTimeout(t);
  }, [flash]);

  // Counts
  const activeCount = useMemo(() => {
    return services.filter(s => (s.status ? s.status === 'active' : s.active !== false)).length;
  }, [services]);

  const hiddenCount = useMemo(() => {
    return services.filter(s => (s.status ? s.status === 'inactive' : s.active === false)).length;
  }, [services]);

  // Filtered list
  const displayList = useMemo(() => {
    return services.filter(s => {
      const isActive = s.status ? s.status === 'active' : s.active !== false;
      if (currentStatus === 'active') return isActive;
      if (currentStatus === 'inactive') return !isActive;
      return true;
    });
  }, [services, currentStatus]);

  const openAdd = () => {
    setEditingSlug(null);
    const nextOrder = services.length + 1;
    setFormData({
      ...defaultForm,
      id: String(nextOrder),
      order: nextOrder,
    });
    setView('add');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openEdit = (svc) => {
    setEditingSlug(svc.slug);
    setFormData({
      id: svc.id || '',
      slug: svc.slug || '',
      title: svc.title || '',
      short: svc.short || svc.title || '',
      footer_name: svc.footer_name || svc.short || svc.title || '',
      icon: svc.icon || '🛡️',
      image: svc.image || 'assets/images/investigation_01_victim_recovery.jpg',
      description: svc.description || '',
      overview: svc.overview || '',
      order: svc.order !== undefined && svc.order !== '' ? svc.order : (services.indexOf(svc) + 1),
      status: svc.status || (svc.active !== false ? 'active' : 'inactive'),
    });
    setView('edit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelForm = () => {
    setView('list');
    setEditingSlug(null);
    setFormData(defaultForm);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('prefix', 'inv');
    try {
      const res = await adminUploadFile(fd);
      if (res && res.url) {
        setFormData(prev => ({ ...prev, image: res.url }));
        setFlash({ type: 'success', message: 'Image uploaded successfully.' });
      }
    } catch (err) {
      setFlash({ type: 'error', message: 'Upload failed: ' + err.message });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFlash({ type: 'error', message: 'Practice title cannot be empty.' });
      return;
    }

    const finalSlug = formData.slug.trim()
      ? formData.slug.trim()
      : formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    const payload = {
      ...formData,
      slug: finalSlug,
      short: formData.short.trim() || formData.title.trim(),
      footer_name: formData.footer_name.trim() || formData.short.trim() || formData.title.trim(),
      order: formData.order !== undefined && formData.order !== '' ? Number(formData.order) : (services.length + 1),
      status: formData.status,
      active: formData.status === 'active',
    };

    try {
      setSaving(true);
      await adminSaveInvestigationService(payload, editingSlug);
      setFlash({
        type: 'success',
        message: `Investigation practice "${payload.title}" successfully saved!`,
      });
      await loadData();
      setView('list');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setFlash({ type: 'error', message: 'Failed to save practice: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (slug) => {
    try {
      const updated = await adminToggleInvestigationService(slug);
      const svc = services.find(s => s.slug === slug);
      const title = svc?.title || slug;
      const isNowActive = updated?.data?.status
        ? updated.data.status === 'active'
        : (updated?.data?.active !== false);

      setFlash({
        type: 'success',
        message: isNowActive
          ? `Practice "${title}" is now ACTIVE and visible on the website.`
          : `Practice "${title}" is now HIDDEN from the website.`,
      });
      await loadData();
    } catch (err) {
      setFlash({ type: 'error', message: 'Error toggling practice status: ' + err.message });
    }
  };

  const confirmDelete = (svc) => {
    setItemToDelete(svc);
    setDeleteModalOpen(true);
  };

  const handleDeleteExecute = async () => {
    if (!itemToDelete) return;
    try {
      setDeleting(true);
      await adminDeleteInvestigationService(itemToDelete.slug);
      setDeleteModalOpen(false);
      setFlash({
        type: 'success',
        message: `Investigation practice "${itemToDelete.title}" was successfully deleted.`,
      });
      setItemToDelete(null);
      await loadData();
    } catch (err) {
      setFlash({ type: 'error', message: 'Error deleting practice: ' + err.message });
    } finally {
      setDeleting(false);
    }
  };

  const previewImgSrc = getAssetUrl(formData.image || 'assets/images/investigation_01_victim_recovery.jpg');

  const isFormView = view === 'add' || view === 'edit';

  return (
    <AdminLayout pageTitle="Digital Investigation Services" currentCount={services.length}>
      {/* ================= FLASH MESSAGE ================= */}
      {flash && (
        <div
          className={`admin-alert ${flash.type === 'error' ? 'alert-error' : flash.type === 'warning' ? 'alert-warning' : 'alert-success'}`}
          style={{
            marginBottom: '1.5rem',
            padding: '1rem 1.25rem',
            borderRadius: '10px',
            background: flash.type === 'error' ? 'rgba(255, 51, 102, 0.15)' : flash.type === 'warning' ? 'rgba(255, 171, 0, 0.15)' : 'rgba(0, 230, 118, 0.15)',
            border: `1px solid ${flash.type === 'error' ? 'rgba(255, 51, 102, 0.35)' : flash.type === 'warning' ? 'rgba(255, 171, 0, 0.35)' : 'rgba(0, 230, 118, 0.35)'}`,
            color: flash.type === 'error' ? '#ff3366' : flash.type === 'warning' ? '#ffab00' : '#00e676',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span>{flash.type === 'error' ? '❌' : flash.type === 'warning' ? '⚠️' : '✅'}</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{flash.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFlash(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}
          >
            &times;
          </button>
        </div>
      )}

      {/* ================= PAGE HEADER ================= */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 className="page-header-title">Comprehensive Digital Investigation Solutions</h1>
        <p className="page-header-desc">
          Manage digital forensics, OSINT, cyber fraud tracing, and evidence preservation practices displayed on the website.
        </p>
      </div>

      {/* ================= ACTION BUTTONS ROW ================= */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap',
          marginBottom: '1.5rem',
          alignItems: 'center',
        }}
      >
        {!isFormView ? (
          <>
            <button type="button" className="btn btn-primary" onClick={openAdd}>
              <span>+</span> Add Investigation Practice
            </button>
            <Link
              to="/admin/investigation-threats"
              className="btn btn-secondary btn-sm"
              title="Manage Threats & Incidents Word Cloud"
            >
              🎯 Incidents &amp; Threats Cloud
            </Link>
            <Link
              to="/admin/faqs?track=investigation"
              className="btn btn-secondary btn-sm"
              title="Manage Digital Investigation FAQs"
            >
              ❓ Investigation FAQs
            </Link>
            <a
              href={`${import.meta.env.BASE_URL}cyber-intelligence?section=forensics`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              title="Preview Investigation Services section on website"
            >
              Preview on Website ➔
            </a>
          </>
        ) : (
          <button type="button" className="btn btn-secondary" onClick={cancelForm}>
            &larr; Back to Services List
          </button>
        )}
      </div>

      {/* ================================================================
           ADD / EDIT FULL-PAGE FORM
      ================================================================ */}
      {isFormView && (
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">
              {view === 'edit' ? `Edit Practice: ${formData.title}` : 'Add New Investigation Practice'}
            </h3>
            <span
              className="category-tag"
              style={{ background: 'rgba(139, 32, 255, 0.15)', color: 'var(--accent-purple-light)' }}
            >
              {view === 'edit' ? `Slug: ${formData.slug}` : 'New Practice'}
            </span>
          </div>

          <div className="admin-card-body">
            <form onSubmit={handleSubmit} encType="multipart/form-data">
              <div className="form-grid">
                {/* Practice / Service Title */}
                <div className="form-group col-full">
                  <label className="form-label">
                    Practice / Service Title <span className="required" style={{ color: '#ff3366' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. Cybercrime Victim Assistance & Account Recovery"
                    value={formData.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        title: val,
                        slug: view === 'edit'
                          ? prev.slug
                          : val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
                        short: prev.short || val,
                      }));
                    }}
                  />
                  <span className="form-help" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.3rem' }}>
                    Main headline displayed on the front-end service card.
                  </span>
                </div>

                {/* URL Slug */}
                <div className="form-group">
                  <label className="form-label">
                    URL Slug <span className="required" style={{ color: '#ff3366' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. cybercrime-victim-assistance-account-recovery"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  />
                  <span className="form-help" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.3rem' }}>
                    Unique URL identifier (creates <code>/services/{formData.slug || 'slug'}</code>)
                  </span>
                </div>

                {/* Short / Navigation Title */}
                <div className="form-group">
                  <label className="form-label">
                    Short / Navigation Title <span className="required" style={{ color: '#ff3366' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. Victim & Account Recovery"
                    value={formData.short}
                    onChange={(e) => setFormData(prev => ({ ...prev, short: e.target.value }))}
                  />
                  <span className="form-help" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.3rem' }}>
                    Used for compact badges, header dropdowns, and pills
                  </span>
                </div>

                {/* Footer Name */}
                <div className="form-group">
                  <label className="form-label">Footer Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Victim & Account Recovery"
                    value={formData.footer_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, footer_name: e.target.value }))}
                  />
                  <span className="form-help" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.3rem' }}>
                    Custom label reflected in the website footer links (falls back to Short Title if blank)
                  </span>
                </div>

                {/* Emoji / Icon */}
                <div className="form-group">
                  <label className="form-label">Emoji / Icon</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="🛡️"
                    value={formData.icon}
                    onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  />
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                    {['🛡️', '🔍', '📱', '💳', '💾', '👨‍👩‍👧‍👦', '🎓', '👶'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, icon: emoji }))}
                        style={{
                          background: formData.icon === emoji ? 'rgba(139,32,255,0.25)' : 'rgba(255,255,255,0.06)',
                          border: `1px solid ${formData.icon === emoji ? 'rgba(139,32,255,0.6)' : 'var(--border-color)'}`,
                          borderRadius: '4px',
                          padding: '0.15rem 0.45rem',
                          cursor: 'pointer',
                          fontSize: '1rem',
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <span className="form-help" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.3rem' }}>
                    Icon symbol (e.g. 🛡️, 🔍, 📱, 💳, 💾, 👨‍👩‍👧‍👦, 🎓, 👶)
                  </span>
                </div>

                {/* Display Order Sequence */}
                <div className="form-group">
                  <label className="form-label">Display Order Sequence</label>
                  <input
                    type="number"
                    className="form-control"
                    min="1"
                    value={formData.order}
                    onChange={(e) => setFormData(prev => ({ ...prev, order: e.target.value }))}
                  />
                  <span className="form-help" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.3rem' }}>
                    Order position on the website cards grid (1 = first card)
                  </span>
                </div>

                {/* Publication Status */}
                <div className="form-group">
                  <label className="form-label">Publication Status</label>
                  <select
                    className="form-control"
                    style={{ fontWeight: 600 }}
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="active">Active (Visible on Website)</option>
                    <option value="inactive">Hidden (Hide from Website)</option>
                  </select>
                  <span className="form-help" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.3rem' }}>
                    Instantly show or hide this card from the live site
                  </span>
                </div>

                {/* Card Banner Image */}
                <div className="form-group col-full">
                  <label className="form-label">
                    Card Banner Image <span className="required" style={{ color: '#ff3366' }}>*</span>
                  </label>
                  <div className="input-with-preview" style={{ alignItems: 'flex-start' }}>
                    <div
                      style={{
                        background: 'rgba(10, 10, 31, 0.9)',
                        padding: '6px',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        width: '220px',
                        height: '130px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        flexShrink: 0,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                      }}
                    >
                      <img
                        src={previewImgSrc}
                        alt="Preview"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = getAssetUrl('assets/images/investigation_01_victim_recovery.jpg');
                        }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label
                        className="btn btn-secondary btn-sm"
                        style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}
                      >
                        {uploading ? '⏳ Uploading...' : '📁 Choose File'}
                        <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="assets/images/investigation_01_victim_recovery.jpg"
                        value={formData.image}
                        onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                      />
                      <span className="form-help" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.4rem' }}>
                        Upload JPG, PNG, or WebP image. This visual is displayed at the top of the card in the "Comprehensive Digital Investigation Solutions" section.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Summary Description */}
                <div className="form-group col-full">
                  <label className="form-label">
                    Card Summary Description <span className="required" style={{ color: '#ff3366' }}>*</span>
                  </label>
                  <textarea
                    className="form-control"
                    rows="4"
                    required
                    placeholder="Describe what this practice offers (e.g. Support for individuals affected by account hacking, online fraud...)..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                  <span className="form-help" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.3rem' }}>
                    This is the core paragraph text rendered inside the card on the website.
                  </span>
                </div>

                {/* Extended Overview */}
                <div className="form-group col-full">
                  <label className="form-label">Extended Overview (Service Detail Page)</label>
                  <textarea
                    className="form-control"
                    rows="5"
                    placeholder="In-depth explanation rendered on the dedicated service page (/services/slug.php)..."
                    value={formData.overview}
                    onChange={(e) => setFormData(prev => ({ ...prev, overview: e.target.value }))}
                  />
                  <span className="form-help" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.3rem' }}>
                    Optional deep-dive content displayed when users click "Explore Investigation →".
                  </span>
                </div>
              </div>

              {/* Form Actions */}
              <div
                style={{
                  paddingTop: '1.5rem',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                }}
              >
                <button type="button" className="btn btn-secondary" onClick={cancelForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <span>💾</span> {saving ? 'Saving...' : 'Save Investigation Practice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================
           LIST VIEW
      ================================================================ */}
      {!isFormView && (
        <>
          {/* Status Filter Navigation Pills */}
          <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setCurrentStatus('all')}
              className={`btn btn-sm ${currentStatus === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            >
              All Practices ({services.length})
            </button>
            <button
              type="button"
              onClick={() => setCurrentStatus('active')}
              className={`btn btn-sm ${currentStatus === 'active' ? 'btn-primary' : 'btn-secondary'}`}
              style={currentStatus === 'active' ? {} : {}}
            >
              <span style={{ color: '#00e676', marginRight: '5px' }}>●</span>
              Active on Website ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setCurrentStatus('inactive')}
              className={`btn btn-sm ${currentStatus === 'inactive' ? 'btn-primary' : 'btn-secondary'}`}
              style={currentStatus === 'inactive' ? {} : {}}
            >
              <span style={{ color: '#ffab00', marginRight: '5px' }}>◯</span>
              Hidden / Draft ({hiddenCount})
            </button>
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-card-title">
                {currentStatus === 'active' && `● Active Practices (${displayList.length})`}
                {currentStatus === 'inactive' && `◯ Hidden Practices (${displayList.length})`}
                {currentStatus === 'all' && `Comprehensive Digital Investigation Practices (${displayList.length})`}
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-primary btn-sm" onClick={openAdd}>
                  + Add Practice
                </button>
              </div>
            </div>
            <div className="table-responsive">
              <table className="admin-table inv-services-table">
                <thead>
                  <tr>
                    <th style={{ width: '100px' }}>Banner</th>
                    <th>Practice Title</th>
                    <th>Short Nav</th>
                    <th>Card Description</th>
                    <th style={{ width: '60px' }}>Order</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                        Loading investigation practices...
                      </td>
                    </tr>
                  ) : displayList.length > 0 ? (
                    displayList.map((svc, index) => {
                      const isActive = svc.status ? svc.status === 'active' : svc.active !== false;
                      const imageSrc = getAssetUrl(svc.image || 'assets/images/investigation_01_victim_recovery.jpg');
                      const orderNum = svc.order !== undefined && svc.order !== '' ? svc.order : (index + 1);

                      return (
                        <tr key={svc.slug || svc.id || index}>
                          <td>
                            <div
                              style={{
                                background: 'rgba(10, 10, 31, 0.9)',
                                padding: '3px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                width: '90px',
                                height: '54px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                              }}
                            >
                              <img
                                src={imageSrc}
                                alt={svc.title}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = getAssetUrl('assets/images/investigation_01_victim_recovery.jpg');
                                }}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }}
                              />
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '2px' }}>
                              <span style={{ fontSize: '1.1rem' }}>{svc.icon || '🛡️'}</span>
                              <span className="cell-title">{svc.title}</span>
                            </div>
                            <span className="cell-subtitle">
                              Slug: <code style={{ color: 'var(--accent-purple-light)' }}>{svc.slug}</code>
                            </span>
                          </td>
                          <td>
                            <span className="category-tag">{svc.short || svc.title}</span>
                            {svc.footer_name && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', marginTop: '4px' }}>
                                Footer: <strong style={{ color: "#00e5ff" }}>{svc.footer_name}</strong>
                              </div>
                            )}
                          </td>
                          <td style={{ maxWidth: '320px' }}>
                            <p
                              style={{
                                fontSize: '0.82rem',
                                color: 'var(--text-secondary)',
                                lineHeight: '1.45',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                margin: 0,
                              }}
                            >
                              {svc.description || '—'}
                            </p>
                          </td>
                          <td>
                            <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                              #{orderNum}
                            </span>
                          </td>
                          <td>
                            {isActive ? (
                              <button
                                type="button"
                                className="status-pill active"
                                onClick={() => handleToggle(svc.slug)}
                                style={{ cursor: 'pointer', border: '1px solid rgba(0, 230, 118, 0.3)' }}
                                title="Click to hide from website"
                              >
                                ● ACTIVE
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="status-pill inactive"
                                onClick={() => handleToggle(svc.slug)}
                                style={{
                                  cursor: 'pointer',
                                  background: 'rgba(255,171,0,0.15)',
                                  color: '#ffab00',
                                  borderColor: 'rgba(255,171,0,0.3)',
                                }}
                                title="Click to show on website"
                              >
                                ◯ HIDDEN
                              </button>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="action-btns-group" style={{ justifyContent: 'flex-end' }}>
                              {isActive ? (
                                <button
                                  type="button"
                                  className="btn-action hide"
                                  onClick={() => handleToggle(svc.slug)}
                                  title="Hide this practice from website"
                                >
                                  Hide
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="btn-action show"
                                  onClick={() => handleToggle(svc.slug)}
                                  title="Make this practice visible on website"
                                >
                                  Show
                                </button>
                              )}
                              <a
                                href={`${import.meta.env.BASE_URL}cyber-intelligence?section=forensics#svc-${svc.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-action view"
                                title="View on live website"
                              >
                                View
                              </a>
                              <button
                                type="button"
                                className="btn-action edit"
                                onClick={() => openEdit(svc)}
                                title="Edit practice"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn-action delete"
                                onClick={() => confirmDelete(svc)}
                                title="Delete practice"
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
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                        No investigation practices found for this filter. Click "+ Add Practice" above to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {deleteModalOpen && itemToDelete && (
        <div className="admin-modal-backdrop show" style={{ zIndex: 1060 }}>
          <div className="admin-modal-dialog" style={{ maxWidth: '480px', width: '90%' }}>
            <div
              className="admin-modal-content"
              style={{
                background: 'var(--bg-surface-card)',
                border: '1px solid rgba(255, 51, 102, 0.4)',
                borderRadius: '14px',
                overflow: 'hidden',
              }}
            >
              <div
                className="admin-modal-header"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1.25rem 1.5rem',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--accent-red)', margin: 0 }}>
                  Confirm Deletion
                </h3>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setDeleteModalOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}
                >
                  &times;
                </button>
              </div>
              <div className="admin-modal-body" style={{ padding: '1.5rem' }}>
                <p style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '1rem' }}>
                  Are you sure you want to permanently delete the investigation practice{' '}
                  <strong style={{ color: 'var(--accent-cyan)' }}>"{itemToDelete.title}"</strong>?
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
                  <div>Slug: <code style={{ color: 'var(--accent-cyan)' }}>{itemToDelete.slug}</code></div>
                  <div style={{ marginTop: '0.25rem' }}>Order: <span style={{ color: '#fff' }}>#{itemToDelete.order || 1}</span></div>
                  <div style={{ marginTop: '0.5rem', color: '#ff3366', fontWeight: 600 }}>
                    ⚠️ This action cannot be undone.
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
                  onClick={handleDeleteExecute}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete Practice'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
