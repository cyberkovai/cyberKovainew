import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import {
  adminGetTestimonials,
  adminSaveTestimonial,
  adminDeleteTestimonial,
  adminToggleTestimonial,
  getSettings,
  updateSettings,
  adminUploadFile,
} from '../api/client';

const normalizeImg = (path, fallback = '/assets/images/avatar_karthik.jpg') => {
  if (!path) return fallback;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/')) return path;
  return `/${path}`;
};

export default function AdminTestimonials() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTestimonialsMaster, setShowTestimonialsMaster] = useState(true);
  const [masterUpdating, setMasterUpdating] = useState(false);

  // View state: 'list' | 'add' | 'edit'
  const [view, setView] = useState('list');
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    role: '',
    tag: 'Digital Forensics',
    rating: 5,
    order: 1,
    status: 'active',
    avatar: 'assets/images/avatar_karthik.jpg',
    quote: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [testiData, settingsData] = await Promise.all([
        adminGetTestimonials().catch(() => []),
        getSettings().catch(() => ({})),
      ]);
      if (Array.isArray(testiData)) {
        setTestimonials(testiData);
      }
      if (settingsData && settingsData.show_testimonials !== undefined) {
        setShowTestimonialsMaster(Boolean(settingsData.show_testimonials));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Check URL params for ?action=add
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'add') {
      openAdd();
    }
  }, [searchParams]);

  const showToastMsg = (type, message) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const handleToggleMasterVisibility = async () => {
    setMasterUpdating(true);
    const newVal = !showTestimonialsMaster;
    try {
      await updateSettings({ show_testimonials: newVal });
      setShowTestimonialsMaster(newVal);
      showToastMsg(
        'success',
        newVal
          ? 'Testimonials section is now VISIBLE on the website and Supabase settings updated.'
          : 'Testimonials section is now HIDDEN from the website and Supabase settings updated.'
      );
    } catch (err) {
      showToastMsg('error', 'Failed to update visibility: ' + err.message);
    } finally {
      setMasterUpdating(false);
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setFormData({
      id: `testi-${Date.now()}`,
      name: '',
      role: '',
      tag: 'Digital Forensics',
      rating: 5,
      order: testimonials.length + 1,
      status: 'active',
      avatar: 'assets/images/avatar_karthik.jpg',
      quote: '',
    });
    setView('add');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openEdit = (item) => {
    const isActive = item.status ? item.status === 'active' : item.active !== false;
    setEditingId(item.id);
    setFormData({
      id: item.id,
      name: item.name || '',
      role: item.role || item.company || '',
      tag: item.tag || item.track || 'Digital Forensics',
      rating: item.rating !== undefined ? Number(item.rating) : 5,
      order: item.order !== undefined ? Number(item.order) : 1,
      status: isActive ? 'active' : 'inactive',
      avatar: item.avatar || 'assets/images/avatar_karthik.jpg',
      quote: item.quote || item.content || '',
    });
    setView('edit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToList = () => {
    setView('list');
    setEditingId(null);
    // clear ?action if present
    if (searchParams.get('action')) {
      searchParams.delete('action');
      setSearchParams(searchParams);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('prefix', 'avatar');
    try {
      const res = await adminUploadFile(fd);
      if (res && res.url) {
        setFormData((prev) => ({ ...prev, avatar: res.url }));
        showToastMsg('success', 'Avatar image uploaded and stored successfully.');
      }
    } catch (err) {
      alert('Avatar upload notice: ' + err.message + '. Retained existing image path.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.quote.trim()) {
      alert('Client Name and Testimonial Quote are required fields.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...formData,
        content: formData.quote,
        active: formData.status === 'active',
      };
      await adminSaveTestimonial(payload, editingId);
      showToastMsg('success', `Testimonial by '${formData.name}' successfully saved to Supabase database!`);
      setView('list');
      setEditingId(null);
      await loadData();
    } catch (err) {
      alert('Failed to save testimonial: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await adminToggleTestimonial(id);
      const updated = res?.data;
      const target = testimonials.find((t) => String(t.id) === String(id));
      const nextActive = updated
        ? (updated.status ? updated.status === 'active' : updated.active !== false)
        : (target ? (target.status ? target.status !== 'active' : target.active === false) : true);

      setTestimonials((prev) =>
        prev.map((t) => {
          if (String(t.id) === String(id)) {
            return {
              ...t,
              status: nextActive ? 'active' : 'inactive',
              active: nextActive,
            };
          }
          return t;
        })
      );

      const name = target?.name || 'Testimonial';
      showToastMsg(
        'success',
        nextActive
          ? `Testimonial by '${name}' is now ACTIVE in database and visible on website.`
          : `Testimonial by '${name}' is now HIDDEN in database and website.`
      );
    } catch (err) {
      showToastMsg('error', 'Could not toggle testimonial visibility: ' + err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to permanently delete testimonial by "${name}" from the database?`)) {
      try {
        await adminDeleteTestimonial(id);
        showToastMsg('success', 'Testimonial was successfully removed from Supabase database.');
        setTestimonials((prev) => prev.filter((t) => String(t.id) !== String(id)));
      } catch (err) {
        showToastMsg('error', 'Could not delete testimonial: ' + err.message);
      }
    }
  };

  return (
    <AdminLayout pageTitle="Client Testimonials" currentCount={testimonials.length}>
      {/* Toast Notification */}
      {toast && (
        <div
          className={`flash-alert ${toast.type}`}
          style={{
            marginBottom: '1.25rem',
            animation: 'fadeIn 0.25s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-sm)',
            background: toast.type === 'success' ? 'rgba(0, 230, 118, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${toast.type === 'success' ? '#00e676' : '#ef4444'}`,
            color: toast.type === 'success' ? '#00e676' : '#ef4444',
          }}
        >
          <span>
            <strong>{toast.type === 'success' ? '✓ Success:' : '⚠ Notice:'}</strong> {toast.message}
          </span>
          <button
            type="button"
            className="flash-close-btn"
            onClick={() => setToast(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', fontSize: '1.2rem', cursor: 'pointer' }}
          >
            &times;
          </button>
        </div>
      )}

      {/* ================= PAGE HEADER ROW ================= */}
      <div className="page-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-header-title" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            Client Testimonials &amp; Reviews
          </h1>
          <p className="page-header-desc" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Manage verified client feedback, corporate case reviews, and testimonials displayed on the website.
          </p>
        </div>
        <div>
          {view === 'list' ? (
            <button type="button" className="btn btn-primary" onClick={openAdd}>
              <span>+</span> Add Testimonial
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleBackToList}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              &larr; Back to Testimonials List
            </button>
          )}
        </div>
      </div>

      {/* ================= TESTIMONIALS VISIBILITY MASTER SWITCH BANNER ================= */}
      <div
        style={{
          background: 'rgba(13, 13, 38, 0.7)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <span style={{ fontSize: '1.4rem' }}>💬</span>
          <div>
            <div
              style={{
                fontSize: '0.92rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                flexWrap: 'wrap',
              }}
            >
              <span>Website Testimonials Visibility:</span>
              {showTestimonialsMaster ? (
                <span className="status-pill active" style={{ background: 'rgba(0, 230, 118, 0.15)', color: '#00e676', border: '1px solid rgba(0, 230, 118, 0.3)', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>
                  ● PUBLICLY VISIBLE
                </span>
              ) : (
                <span
                  className="status-pill inactive"
                  style={{
                    background: 'rgba(255, 171, 0, 0.15)',
                    color: '#ffab00',
                    border: '1px solid rgba(255, 171, 0, 0.3)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  ○ HIDDEN FROM WEBSITE
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {showTestimonialsMaster
                ? 'Active testimonials are displayed on the website and linked in the footer.'
                : 'The entire testimonials section is currently HIDDEN from the public website.'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <a
            href="/cyber-intelligence#ci-testimonials"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
            title="Preview testimonials section on live website"
          >
            Preview on Website ➔
          </a>
          <button
            type="button"
            onClick={handleToggleMasterVisibility}
            disabled={masterUpdating}
            className={`btn btn-sm ${showTestimonialsMaster ? 'btn-secondary' : 'btn-primary'}`}
            style={
              showTestimonialsMaster
                ? { borderColor: 'rgba(255, 171, 0, 0.4)', color: '#ffab00' }
                : {}
            }
          >
            {showTestimonialsMaster ? 'Hide All from Website' : 'Make Visible on Website'}
          </button>
        </div>
      </div>

      {/* ================= CONDITIONAL VIEW: ADD/EDIT FULL FORM OR LIST ================= */}
      {view === 'add' || view === 'edit' ? (
        /* ================= ADD / EDIT CARD (EXACT USER SCREENSHOT UI) ================= */
        <div
          className="admin-card"
          style={{
            background: 'rgba(13, 13, 38, 0.85)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1.75rem',
            marginBottom: '2rem',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(158, 62, 255, 0.15)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {view === 'edit'
                ? `Edit Client Testimonial: ${formData.name || 'Client Review'}`
                : 'Add New Client Testimonial'}
            </h3>
          </div>

          <form onSubmit={handleSubmit}>
            {/* ROW 1: Name, Role, Service Tag */}
            <div className="form-row-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="testi_name" className="form-label">
                  Client Name / Pseudonym <span className="required" style={{ color: '#ff3366' }}>*</span>
                </label>
                <input
                  type="text"
                  id="testi_name"
                  className="form-control"
                  required
                  placeholder="e.g. Rajesh M."
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="testi_role" className="form-label">
                  Client Role &amp; Organization <span className="required" style={{ color: '#ff3366' }}>*</span>
                </label>
                <input
                  type="text"
                  id="testi_role"
                  className="form-control"
                  required
                  placeholder="e.g. Managing Partner, Legal Advisory"
                  value={formData.role}
                  onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="testi_tag" className="form-label">
                  Service Tag
                </label>
                <input
                  type="text"
                  id="testi_tag"
                  className="form-control"
                  placeholder="Digital Forensics"
                  value={formData.tag}
                  onChange={(e) => setFormData((prev) => ({ ...prev, tag: e.target.value }))}
                />
              </div>
            </div>

            {/* ROW 2: Star Rating, Display Order, Publication Status */}
            <div className="form-row-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="testi_rating" className="form-label">
                  Star Rating
                </label>
                <select
                  id="testi_rating"
                  className="form-control"
                  value={formData.rating}
                  onChange={(e) => setFormData((prev) => ({ ...prev, rating: Number(e.target.value) }))}
                  style={{ color: '#ffab00', fontWeight: 600 }}
                >
                  <option value="5">★★★★★ (5 Stars)</option>
                  <option value="4">★★★★ (4 Stars)</option>
                  <option value="3">★★★ (3 Stars)</option>
                  <option value="2">★★ (2 Stars)</option>
                  <option value="1">★ (1 Star)</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="testi_order" className="form-label">
                  Display Order
                </label>
                <input
                  type="number"
                  id="testi_order"
                  className="form-control"
                  min="1"
                  placeholder="4"
                  value={formData.order}
                  onChange={(e) => setFormData((prev) => ({ ...prev, order: Number(e.target.value) }))}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="testi_status" className="form-label">
                  Publication Status
                </label>
                <select
                  id="testi_status"
                  className="form-control"
                  style={{ fontWeight: 600 }}
                  value={formData.status}
                  onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                >
                  <option value="active">Active (Visible on Website)</option>
                  <option value="inactive">Inactive (Hidden from Website)</option>
                </select>
                <span className="form-help" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}>
                  Choose whether this testimonial should appear on the public website.
                </span>
              </div>
            </div>

            {/* ROW 3: Client Photo / Avatar */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Client Photo / Avatar</label>
              <div style={{ marginBottom: '0.65rem' }}>
                <input
                  type="file"
                  accept="image/*"
                  className="form-control"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                {uploading && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--accent-purple-light)', marginTop: '0.25rem', display: 'block' }}>
                    Uploading portrait to storage...
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <img
                  src={normalizeImg(formData.avatar)}
                  alt="Avatar Preview"
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid var(--accent-purple)',
                    background: '#1a1836',
                    flexShrink: 0,
                  }}
                  onError={(e) => {
                    e.currentTarget.src = '/assets/images/avatar_karthik.jpg';
                  }}
                />
                <input
                  type="text"
                  className="form-control"
                  placeholder="assets/images/avatar_karthik.jpg"
                  value={formData.avatar}
                  onChange={(e) => setFormData((prev) => ({ ...prev, avatar: e.target.value }))}
                />
              </div>
              <span className="form-help" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}>
                Upload client portrait (JPG/PNG/WebP) or specify image path.
              </span>

              {/* Quick Presets */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quick Presets:</span>
                <button
                  type="button"
                  className="btn-action view"
                  style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: '4px' }}
                  onClick={() => setFormData((prev) => ({ ...prev, avatar: 'assets/images/avatar_karthik.jpg' }))}
                >
                  Rajesh
                </button>
                <button
                  type="button"
                  className="btn-action view"
                  style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: '4px' }}
                  onClick={() => setFormData((prev) => ({ ...prev, avatar: 'assets/images/avatar_priya.jpg' }))}
                >
                  Priya
                </button>
                <button
                  type="button"
                  className="btn-action view"
                  style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: '4px' }}
                  onClick={() => setFormData((prev) => ({ ...prev, avatar: 'assets/images/avatar_aravind.jpg' }))}
                >
                  Aravind
                </button>
              </div>
            </div>

            {/* ROW 4: Testimonial Quote */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="testi_quote" className="form-label">
                Client Testimonial Quote <span className="required" style={{ color: '#ff3366' }}>*</span>
              </label>
              <textarea
                id="testi_quote"
                rows="4"
                className="form-control"
                required
                placeholder="Detailed feedback or case resolution statement..."
                value={formData.quote}
                onChange={(e) => setFormData((prev) => ({ ...prev, quote: e.target.value }))}
                style={{ resize: 'vertical', minHeight: '110px' }}
              />
            </div>

            {/* ROW 5: Bottom Actions */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '0.85rem',
                paddingTop: '1.25rem',
                borderTop: '1px solid rgba(158, 62, 255, 0.15)',
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleBackToList}
                style={{ padding: '0.65rem 1.4rem', fontSize: '0.9rem' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
                style={{
                  padding: '0.65rem 1.6rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>💾</span> {saving ? 'Saving to Database...' : 'Save Testimonial'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* ================= ALL TESTIMONIALS TABLE CARD ================= */
        <div className="admin-card">
          <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 className="admin-card-title" style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
              All Testimonials ({testimonials.length})
            </h3>
            <a
              href="/cyber-intelligence#ci-testimonials"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              title="Preview testimonials section on live website"
            >
              Preview on Website ➔
            </a>
          </div>

          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>AVATAR</th>
                  <th>CLIENT / ORGANIZATION</th>
                  <th>QUOTE EXCERPT</th>
                  <th>SERVICE TAG</th>
                  <th>RATING</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {testimonials.length > 0 ? (
                  testimonials.map((t) => {
                    const isActive = t.status ? t.status === 'active' : t.active !== false;
                    return (
                      <tr key={t.id}>
                        <td>
                          <img
                            src={normalizeImg(t.avatar)}
                            alt={t.name || 'Client Avatar'}
                            className="table-avatar"
                            onError={(e) => {
                              e.currentTarget.src = '/assets/images/avatar_karthik.jpg';
                            }}
                          />
                        </td>
                        <td>
                          <span className="cell-title">{t.name}</span>
                          <span className="cell-subtitle">{t.role || t.company}</span>
                        </td>
                        <td style={{ maxWidth: '320px' }}>
                          <p
                            style={{
                              fontSize: '0.82rem',
                              color: 'var(--text-secondary)',
                              lineHeight: '1.4',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              margin: 0,
                            }}
                          >
                            &ldquo;{t.quote || t.content}&rdquo;
                          </p>
                        </td>
                        <td>
                          <span className="category-tag">{t.tag || t.track || 'Digital Forensics'}</span>
                        </td>
                        <td style={{ color: '#ffab00', fontSize: '0.85rem' }}>
                          {'★'.repeat(Number(t.rating) || 5)}
                        </td>
                        <td>
                          <button
                            type="button"
                            className={`status-pill ${isActive ? 'active' : 'inactive'}`}
                            style={{
                              cursor: 'pointer',
                              border: isActive
                                ? '1px solid rgba(0, 230, 118, 0.3)'
                                : '1px solid rgba(255, 171, 0, 0.3)',
                              background: isActive
                                ? 'rgba(0, 230, 118, 0.15)'
                                : 'rgba(255, 171, 0, 0.15)',
                              color: isActive ? '#00e676' : '#ffab00',
                            }}
                            onClick={() => handleToggle(t.id)}
                            title={isActive ? 'Click to hide from website' : 'Click to show on website'}
                          >
                            {isActive ? '● ACTIVE' : '○ HIDDEN'}
                          </button>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="action-btns-group" style={{ justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className={`btn-action ${isActive ? 'hide' : 'show'}`}
                              onClick={() => handleToggle(t.id)}
                              title={
                                isActive
                                  ? 'Hide this testimonial from website'
                                  : 'Make this testimonial visible on website'
                              }
                            >
                              {isActive ? 'Hide' : 'Show'}
                            </button>
                            <button
                              type="button"
                              className="btn-action edit"
                              onClick={() => openEdit(t)}
                              title="Edit this testimonial"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn-action delete"
                              onClick={() => handleDelete(t.id, t.name)}
                              title="Delete this testimonial"
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
                      colSpan="7"
                      style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}
                    >
                      {loading
                        ? 'Loading testimonials...'
                        : 'No testimonials found. Click "+ Add Testimonial" above to add your first review.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
