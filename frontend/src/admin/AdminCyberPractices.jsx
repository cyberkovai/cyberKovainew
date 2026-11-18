import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import {
  adminGetPractices,
  adminSavePractice,
  adminDeletePractice,
  adminTogglePractice,
  adminUpdatePracticesSettings,
  adminGetCyberServices,
} from '../api/client';

export default function AdminCyberPractices() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [practices, setPractices] = useState([]);
  const [settings, setSettings] = useState({
    tag: 'OUR PRACTICES',
    title: 'Core Cyber Practices. One Standard: <span>Uncompromising Defense.</span>',
    subtitle: 'Comprehensive offensive and defensive cybersecurity practices engineered for modern digital enterprises.',
  });
  const [cyberServices, setCyberServices] = useState({});
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState(null);

  // Filters state
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [heroFilter, setHeroFilter] = useState('all'); // 'all' | 'hero' | 'standard'
  const [searchQuery, setSearchQuery] = useState('');

  // View state ('list' | 'add' | 'edit')
  const [view, setView] = useState('list');

  // Modals state
  const [headingModalOpen, setHeadingModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [savingPractice, setSavingPractice] = useState(false);
  const [savingHeading, setSavingHeading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Editing practice ID (null if adding)
  const [editingId, setEditingId] = useState(null);

  // Practice Form State
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    slug: '',
    link: '',
    tag: '',
    code: '',
    badge: '',
    status_text: 'ARMORED',
    icon: '🛡️',
    order: 1,
    is_hero: false,
    status: 'active',
    description: '',
  });

  // Section Heading Form State
  const [headingForm, setHeadingForm] = useState({
    tag: 'OUR PRACTICES',
    title: 'Core Cyber Practices. One Standard: <span>Uncompromising Defense.</span>',
    subtitle: 'Comprehensive offensive and defensive cybersecurity practices engineered for modern digital enterprises.',
  });

  // Load all practices and settings
  const loadData = async () => {
    try {
      setLoading(true);
      const data = await adminGetPractices();
      if (data) {
        if (Array.isArray(data.practices)) {
          setPractices(data.practices);
        }
        if (data.settings) {
          setSettings(prev => ({
            ...prev,
            ...data.settings,
            tag: data.settings.tag || data.settings.badge || prev.tag,
            title: data.settings.title || prev.title,
            subtitle: data.settings.subtitle || data.settings.subtext || prev.subtitle,
          }));
          setHeadingForm({
            tag: data.settings.tag || data.settings.badge || 'OUR PRACTICES',
            title: data.settings.title || 'Core Cyber Practices. One Standard: <span>Uncompromising Defense.</span>',
            subtitle: data.settings.subtitle || data.settings.subtext || 'Comprehensive offensive and defensive cybersecurity practices engineered for modern digital enterprises.',
          });
        }
      }
    } catch (err) {
      console.error('Error loading practices:', err);
      setFlash({ type: 'error', message: 'Failed to load practices: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  // Load cyber services for quick-fill dropdown
  useEffect(() => {
    loadData();
    adminGetCyberServices()
      .then(res => {
        if (res && typeof res === 'object') {
          setCyberServices(res);
        }
      })
      .catch(() => {});
  }, []);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (headingModalOpen) setHeadingModalOpen(false);
        if (deleteModalOpen) setDeleteModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [headingModalOpen, deleteModalOpen]);

  // Handle URL query trigger e.g. ?action=add
  useEffect(() => {
    const action = searchParams.get('action');
    const id = searchParams.get('id');
    if (action === 'add') {
      const nextOrder = practices.length + 1;
      setEditingId(null);
      setFormData({
        id: '',
        title: '',
        slug: '',
        link: '',
        tag: '',
        code: '',
        badge: '',
        status_text: 'ARMORED',
        icon: '🛡️',
        order: nextOrder,
        is_hero: false,
        status: 'active',
        description: '',
      });
      setView('add');
    } else if (action === 'edit' && id && practices.length > 0) {
      const found = practices.find(p => String(p.id) === String(id));
      if (found) {
        setEditingId(found.id);
        const isActive = found.status ? found.status === 'active' : found.active !== false;
        setFormData({
          id: found.id || '',
          title: found.title || '',
          slug: found.slug || '',
          link: found.link || '',
          tag: found.tag || '',
          code: found.code || '',
          badge: found.badge || '',
          status_text: found.status_text || 'ARMORED',
          icon: found.icon || '🛡️',
          order: found.order !== undefined ? found.order : 1,
          is_hero: Boolean(found.is_hero),
          status: isActive ? 'active' : 'inactive',
          description: found.description || '',
        });
        setView('edit');
      }
    } else if (!action) {
      setView('list');
      setEditingId(null);
    }
  }, [searchParams, practices]);

  // Dynamic statistics
  const stats = useMemo(() => {
    const total = practices.length;
    let active = 0;
    let hero = 0;
    let hidden = 0;
    practices.forEach(p => {
      const isActive = p.status ? p.status === 'active' : p.active !== false;
      if (isActive) active++;
      else hidden++;
      if (p.is_hero) hero++;
    });
    return { total, active, hero, hidden };
  }, [practices]);

  // Filtered display list
  const displayList = useMemo(() => {
    return practices.filter(p => {
      const isActive = p.status ? p.status === 'active' : p.active !== false;

      // Status filter
      if (statusFilter === 'active' && !isActive) return false;
      if (statusFilter === 'inactive' && isActive) return false;

      // Hero filter
      if (heroFilter === 'hero' && !p.is_hero) return false;
      if (heroFilter === 'standard' && p.is_hero) return false;

      // Search query
      if (searchQuery.trim() !== '') {
        const needle = searchQuery.toLowerCase().trim();
        const titleMatch = (p.title || '').toLowerCase().includes(needle);
        const tagMatch = (p.tag || '').toLowerCase().includes(needle);
        const slugMatch = (p.slug || '').toLowerCase().includes(needle);
        const descMatch = (p.description || '').toLowerCase().includes(needle);
        if (!titleMatch && !tagMatch && !slugMatch && !descMatch) return false;
      }

      return true;
    });
  }, [practices, statusFilter, heroFilter, searchQuery]);

  // Open Add Practice View
  const openAdd = () => {
    const nextOrder = practices.length + 1;
    setEditingId(null);
    setFormData({
      id: '',
      title: '',
      slug: '',
      link: '',
      tag: '',
      code: '',
      badge: '',
      status_text: 'ARMORED',
      icon: '🛡️',
      order: nextOrder,
      is_hero: false,
      status: 'active',
      description: '',
    });
    setView('add');
    setSearchParams({ action: 'add' });
  };

  // Open Edit Practice View
  const openEdit = (practice) => {
    setEditingId(practice.id);
    const isActive = practice.status ? practice.status === 'active' : practice.active !== false;
    setFormData({
      id: practice.id || '',
      title: practice.title || '',
      slug: practice.slug || '',
      link: practice.link || '',
      tag: practice.tag || '',
      code: practice.code || '',
      badge: practice.badge || '',
      status_text: practice.status_text || 'ARMORED',
      icon: practice.icon || '🛡️',
      order: practice.order !== undefined ? practice.order : 1,
      is_hero: Boolean(practice.is_hero),
      status: isActive ? 'active' : 'inactive',
      description: practice.description || '',
    });
    setView('edit');
    setSearchParams({ action: 'edit', id: practice.id });
  };

  // Cancel handler returning to list
  const handleCancel = () => {
    setView('list');
    setEditingId(null);
    setSearchParams({});
  };

  // Quick fill helper from registered cyber service
  const handleQuickFill = (serviceSlug) => {
    if (!serviceSlug) return;
    const svc = cyberServices[serviceSlug];
    if (!svc) return;

    const cleanPrefix = serviceSlug.replace(/[^a-zA-Z]/g, '').substring(0, 6).toUpperCase();

    setFormData(prev => ({
      ...prev,
      title: prev.title ? prev.title : (svc.title || ''),
      slug: serviceSlug,
      link: `services/${serviceSlug}.php`,
      description: prev.description ? prev.description : (svc.short_desc || svc.overview || svc.description || ''),
      tag: prev.tag ? prev.tag : `// ${cleanPrefix}-01`,
    }));
  };

  // Save practice handler (Create or Update)
  const handleSavePractice = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Practice title cannot be empty.');
      return;
    }

    try {
      setSavingPractice(true);
      const payload = {
        ...formData,
        order: Number(formData.order) || 1,
        active: formData.status === 'active',
        status: formData.status,
      };

      await adminSavePractice(payload, editingId);
      setView('list');
      setEditingId(null);
      setSearchParams({});
      setFlash({
        type: 'success',
        message: `Core practice "${formData.title}" was successfully saved!`,
      });
      await loadData();
    } catch (err) {
      alert('Failed to save practice: ' + (err.response?.data?.message || err.message));
    } finally {
      setSavingPractice(false);
    }
  };

  // Toggle active/hidden status
  const handleToggleStatus = async (id, title) => {
    try {
      await adminTogglePractice(id);
      setFlash({
        type: 'success',
        message: `Practice "${title || '#' + id}" status updated!`,
      });
      await loadData();
    } catch (err) {
      alert('Failed to toggle status: ' + err.message);
    }
  };

  // Trigger Delete Modal
  const openDeleteConfirm = (practice) => {
    setItemToDelete(practice);
    setDeleteModalOpen(true);
  };

  // Execute practice deletion
  const handleDeleteExecute = async () => {
    if (!itemToDelete) return;
    try {
      setDeleting(true);
      await adminDeletePractice(itemToDelete.id);
      setDeleteModalOpen(false);
      setFlash({
        type: 'success',
        message: `Core practice "${itemToDelete.title}" has been deleted.`,
      });
      setItemToDelete(null);
      await loadData();
    } catch (err) {
      alert('Failed to delete practice: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Open Edit Section Heading Modal
  const openHeadingModal = () => {
    setHeadingForm({
      tag: settings.tag || 'OUR PRACTICES',
      title: settings.title || 'Core Cyber Practices. One Standard: <span>Uncompromising Defense.</span>',
      subtitle: settings.subtitle || 'Comprehensive offensive and defensive cybersecurity practices engineered for modern digital enterprises.',
    });
    setHeadingModalOpen(true);
  };

  // Save Section Heading handler
  const handleSaveHeading = async (e) => {
    e.preventDefault();
    try {
      setSavingHeading(true);
      const res = await adminUpdatePracticesSettings(headingForm);
      if (res?.data) {
        setSettings(prev => ({ ...prev, ...res.data }));
      } else {
        setSettings({ ...headingForm });
      }
      setHeadingModalOpen(false);
      setFlash({
        type: 'success',
        message: 'Bento Grid section heading & description successfully updated!',
      });
    } catch (err) {
      alert('Failed to update section heading: ' + err.message);
    } finally {
      setSavingHeading(false);
    }
  };

  return (
    <AdminLayout pageTitle="Core Cyber Practices (Bento Grid)" currentCount={practices.length}>
      {/* Alert Banner */}
      {flash && (
        <div
          className={`flash-alert ${flash.type}`}
          style={{
            marginBottom: '1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.85rem 1.25rem',
            borderRadius: '8px',
            background: flash.type === 'success' ? 'rgba(0, 230, 118, 0.12)' : 'rgba(255, 51, 102, 0.12)',
            border: `1px solid ${flash.type === 'success' ? 'rgba(0, 230, 118, 0.35)' : 'rgba(255, 51, 102, 0.35)'}`,
            color: flash.type === 'success' ? '#00e676' : '#ff3366',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>{flash.type === 'success' ? '✓' : '⚠'}</span>
            <strong>{flash.type === 'success' ? 'Success:' : 'Error:'}</strong>
            <span>{flash.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFlash(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: '1.2rem',
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>
      )}

      {view === 'add' || view === 'edit' ? (
        /* ================= ADD / EDIT VIEW (EXACT MATCHING UI) ================= */
        <div className="admin-practices-form-view">
          {/* Header with Back button */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h1 className="page-header-title" style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginBottom: '0.35rem' }}>
              Core Cyber Practices (Bento Grid)
            </h1>
            <p className="page-header-desc" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              Manage the interactive Bento Grid capabilities, hero highlights, links, badges, and section headings shown on the website.
            </p>
            <div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancel}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem 1.25rem',
                  borderRadius: '8px',
                  background: '#16132b',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <span>&larr;</span> Back to Practices List
              </button>
            </div>
          </div>

          {/* Add / Edit Bento Card */}
          <div
            className="admin-card"
            style={{
              background: 'rgba(16, 12, 34, 0.75)',
              border: '1px solid rgba(158, 62, 255, 0.2)',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            <div
              className="admin-card-header"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.25rem 1.75rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <h3
                className="admin-card-title"
                style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0 }}
              >
                {view === 'edit'
                  ? `Edit Core Practice: ${formData.title || '#' + editingId}`
                  : 'Add New Core Cyber Practice'}
              </h3>
              <span
                className="category-tag"
                style={{
                  background: 'rgba(139, 32, 255, 0.15)',
                  color: 'var(--accent-purple-light, #c084fc)',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.03em',
                }}
              >
                {view === 'edit' ? `ID: #${editingId}` : 'New Bento Card'}
              </span>
            </div>

            <div className="admin-card-body" style={{ padding: '1.75rem' }}>
              <form onSubmit={handleSavePractice}>
                {/* Helper Quick-Fill from Registered Services */}
                <div
                  style={{
                    marginBottom: '1.5rem',
                    padding: '1rem 1.25rem',
                    background: 'rgba(158, 62, 255, 0.08)',
                    border: '1px solid rgba(158, 62, 255, 0.25)',
                    borderRadius: '8px',
                  }}
                >
                  <label
                    htmlFor="service_picker"
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#c084fc',
                      marginBottom: '0.45rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    ⚡ QUICK-FILL FROM CYBER SERVICES (OPTIONAL)
                  </label>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select
                      id="service_picker"
                      className="form-control"
                      style={{
                        flex: '1 1 360px',
                        maxWidth: '520px',
                        background: 'rgba(10, 8, 25, 0.8)',
                        border: '1px solid rgba(158, 62, 255, 0.3)',
                        borderRadius: '6px',
                        color: '#f3f4f6',
                        padding: '0.65rem 0.85rem',
                        fontSize: '0.88rem',
                      }}
                      onChange={(e) => handleQuickFill(e.target.value)}
                      defaultValue=""
                    >
                      <option value="">-- Choose a registered cyber service to autofill --</option>
                      {Object.entries(cyberServices).map(([slug, svc]) => (
                        <option key={slug} value={slug}>
                          {svc.title || slug} ({slug})
                        </option>
                      ))}
                    </select>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      Select a service to automatically fill Title, Slug, Link, and Description.
                    </span>
                  </div>
                </div>

                {/* Practice Title */}
                <div className="form-group col-full" style={{ marginBottom: '1.25rem' }}>
                  <label
                    htmlFor="practice_title"
                    className="form-label"
                    style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.35rem' }}
                  >
                    Practice Title <span style={{ color: '#ff4d4f' }}>*</span>
                  </label>
                  <input
                    type="text"
                    id="practice_title"
                    name="title"
                    className="form-control"
                    required
                    placeholder="e.g. Vulnerability Assessment & Pen Testing (VAPT)"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    style={{
                      width: '100%',
                      background: 'rgba(10, 8, 25, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '6px',
                      color: '#fff',
                      padding: '0.65rem 0.85rem',
                      fontSize: '0.9rem',
                    }}
                  />
                  <span className="form-help" style={{ display: 'block', fontSize: '0.78rem', color: '#8b949e', marginTop: '0.35rem' }}>
                    Headline displayed as the card's main title.
                  </span>
                </div>

                {/* Row 2: 3 Columns */}
                <div className="form-row-3" style={{ marginBottom: '1.25rem' }}>
                  {/* Service Slug */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label
                      htmlFor="practice_slug"
                      className="form-label"
                      style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.35rem' }}
                    >
                      Service Slug <span style={{ color: '#ff4d4f' }}>*</span>
                    </label>
                    <input
                      type="text"
                      id="practice_slug"
                      name="slug"
                      className="form-control"
                      required
                      placeholder="e.g. vulnerability-assessment-penetration"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      style={{
                        width: '100%',
                        background: 'rgba(10, 8, 25, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '6px',
                        color: '#fff',
                        padding: '0.65rem 0.85rem',
                        fontSize: '0.9rem',
                      }}
                    />
                    <span className="form-help" style={{ display: 'block', fontSize: '0.78rem', color: '#8b949e', marginTop: '0.35rem' }}>
                      Matches the corresponding service file in <code style={{ color: '#c084fc', background: 'rgba(255,255,255,0.06)', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>services/[slug].php</code>.
                    </span>
                  </div>

                  {/* Navigation Destination Link */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label
                      htmlFor="practice_link"
                      className="form-label"
                      style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.35rem' }}
                    >
                      Navigation Destination Link
                    </label>
                    <input
                      type="text"
                      id="practice_link"
                      name="link"
                      className="form-control"
                      placeholder="services/vulnerability-assessment-penetr"
                      value={formData.link}
                      onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                      style={{
                        width: '100%',
                        background: 'rgba(10, 8, 25, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '6px',
                        color: '#fff',
                        padding: '0.65rem 0.85rem',
                        fontSize: '0.9rem',
                      }}
                    />
                    <span className="form-help" style={{ display: 'block', fontSize: '0.78rem', color: '#8b949e', marginTop: '0.35rem' }}>
                      Leave blank to automatically resolve via slug. Direct URLs (https://...) are also supported.
                    </span>
                  </div>

                  {/* Dossier Tag / Code */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label
                      htmlFor="practice_tag"
                      className="form-label"
                      style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.35rem' }}
                    >
                      Dossier Tag / Code
                    </label>
                    <input
                      type="text"
                      id="practice_tag"
                      name="tag"
                      className="form-control"
                      placeholder="e.g. // APPSEC-01"
                      value={formData.tag}
                      onChange={(e) => setFormData(prev => ({ ...prev, tag: e.target.value }))}
                      style={{
                        width: '100%',
                        background: 'rgba(10, 8, 25, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '6px',
                        color: '#fff',
                        padding: '0.65rem 0.85rem',
                        fontSize: '0.9rem',
                      }}
                    />
                    <span className="form-help" style={{ display: 'block', fontSize: '0.78rem', color: '#8b949e', marginTop: '0.35rem' }}>
                      Terminal/monospaced code displayed in the top right of the card.
                    </span>
                  </div>
                </div>

                {/* Row 3: 3 Columns */}
                <div className="form-row-3" style={{ marginBottom: '1.25rem' }}>
                  {/* Sequence Code */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label
                      htmlFor="practice_code"
                      className="form-label"
                      style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.35rem' }}
                    >
                      Sequence Code
                    </label>
                    <input
                      type="text"
                      id="practice_code"
                      name="code"
                      className="form-control"
                      placeholder="e.g. 01, 02, 08"
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                      style={{
                        width: '100%',
                        background: 'rgba(10, 8, 25, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '6px',
                        color: '#fff',
                        padding: '0.65rem 0.85rem',
                        fontSize: '0.9rem',
                      }}
                    />
                    <span className="form-help" style={{ display: 'block', fontSize: '0.78rem', color: '#8b949e', marginTop: '0.35rem' }}>
                      2-digit numerical index code (e.g. 01).
                    </span>
                  </div>

                  {/* Hero Badge Text */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label
                      htmlFor="practice_badge"
                      className="form-label"
                      style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.35rem' }}
                    >
                      Hero Badge Text (Optional)
                    </label>
                    <input
                      type="text"
                      id="practice_badge"
                      name="badge"
                      className="form-control"
                      placeholder="e.g. PRIMARY PRACTICE, AI DEFENSE PR."
                      value={formData.badge}
                      onChange={(e) => setFormData(prev => ({ ...prev, badge: e.target.value }))}
                      style={{
                        width: '100%',
                        background: 'rgba(10, 8, 25, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '6px',
                        color: '#fff',
                        padding: '0.65rem 0.85rem',
                        fontSize: '0.9rem',
                      }}
                    />
                    <span className="form-help" style={{ display: 'block', fontSize: '0.78rem', color: '#8b949e', marginTop: '0.35rem' }}>
                      Colored badge pill shown beside the dossier code.
                    </span>
                  </div>

                  {/* Footer Status Text */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label
                      htmlFor="practice_status_text"
                      className="form-label"
                      style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.35rem' }}
                    >
                      Footer Status Text
                    </label>
                    <input
                      type="text"
                      id="practice_status_text"
                      name="status_text"
                      className="form-control"
                      placeholder="ARMORED"
                      value={formData.status_text}
                      onChange={(e) => setFormData(prev => ({ ...prev, status_text: e.target.value }))}
                      style={{
                        width: '100%',
                        background: 'rgba(10, 8, 25, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '6px',
                        color: '#fff',
                        padding: '0.65rem 0.85rem',
                        fontSize: '0.9rem',
                      }}
                    />
                    <span className="form-help" style={{ display: 'block', fontSize: '0.78rem', color: '#8b949e', marginTop: '0.35rem' }}>
                      Status text shown beside the green pulsing dot (default: ARMORED).
                    </span>
                  </div>
                </div>

                {/* Row 4: 2 Columns */}
                <div className="form-row-2" style={{ marginBottom: '1.25rem' }}>
                  {/* Display Order */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label
                      htmlFor="practice_order"
                      className="form-label"
                      style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.35rem' }}
                    >
                      Display Order
                    </label>
                    <input
                      type="number"
                      id="practice_order"
                      name="order"
                      className="form-control"
                      min="1"
                      step="1"
                      value={formData.order}
                      onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value, 10) || 1 }))}
                      style={{
                        width: '100%',
                        background: 'rgba(10, 8, 25, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '6px',
                        color: '#fff',
                        padding: '0.65rem 0.85rem',
                        fontSize: '0.9rem',
                      }}
                    />
                    <span className="form-help" style={{ display: 'block', fontSize: '0.78rem', color: '#8b949e', marginTop: '0.35rem' }}>
                      Items are arranged in ascending order (1, 2, 3...).
                    </span>
                  </div>

                  {/* Publication Status */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label
                      htmlFor="practice_status"
                      className="form-label"
                      style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.35rem' }}
                    >
                      Publication Status
                    </label>
                    <select
                      id="practice_status"
                      name="status"
                      className="form-control"
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      style={{
                        width: '100%',
                        background: 'rgba(10, 8, 25, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '6px',
                        color: '#fff',
                        padding: '0.65rem 0.85rem',
                        fontSize: '0.9rem',
                      }}
                    >
                      <option value="active">● Active (Visible in Bento Grid)</option>
                      <option value="inactive">○ Hidden / Draft</option>
                    </select>
                  </div>
                </div>

                {/* Row 5: Hero Spotlight Card (Wide Bento Span) */}
                <div className="form-group col-full" style={{ marginBottom: '1.25rem' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      cursor: 'pointer',
                      padding: '0.75rem 1rem',
                      background: 'rgba(158, 62, 255, 0.06)',
                      border: '1px solid rgba(158, 62, 255, 0.2)',
                      borderRadius: '6px',
                    }}
                  >
                    <input
                      type="checkbox"
                      name="is_hero"
                      checked={formData.is_hero}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_hero: e.target.checked }))}
                      style={{
                        width: '18px',
                        height: '18px',
                        accentColor: '#9e3eff',
                        cursor: 'pointer',
                      }}
                    />
                    <div>
                      <strong style={{ color: '#fff', fontSize: '0.9rem' }}>Hero Spotlight Card (Wide Bento Span)</strong>
                      <div style={{ fontSize: '0.8rem', color: '#8b949e', marginTop: '0.15rem' }}>
                        Gives this card an elevated glowing gradient border and wide layout span inside the Bento grid.
                      </div>
                    </div>
                  </label>
                </div>

                {/* Row 6: Practice Description */}
                <div className="form-group col-full" style={{ marginBottom: '1.5rem' }}>
                  <label
                    htmlFor="practice_description"
                    className="form-label"
                    style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.35rem' }}
                  >
                    Practice Description <span style={{ color: '#ff4d4f' }}>*</span>
                  </label>
                  <textarea
                    id="practice_description"
                    name="description"
                    rows={3}
                    className="form-control"
                    required
                    placeholder="Simulate real-world attacks across web applications, APIs, mobile apps, and systems to uncover exploitable flaws before adversaries do."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    style={{
                      width: '100%',
                      minHeight: '85px',
                      background: 'rgba(10, 8, 25, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '6px',
                      color: '#fff',
                      padding: '0.75rem 0.85rem',
                      fontSize: '0.9rem',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                    }}
                  />
                  <span className="form-help" style={{ display: 'block', fontSize: '0.78rem', color: '#8b949e', marginTop: '0.35rem' }}>
                    Summary paragraph displayed in the body of the Bento card.
                  </span>
                </div>

                {/* Row 7: Action Buttons */}
                <div style={{ marginTop: '1.75rem', display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={savingPractice}
                    style={{
                      background: 'linear-gradient(135deg, #9e3eff 0%, #7928ca 100%)',
                      color: '#fff',
                      fontWeight: 600,
                      border: 'none',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 15px rgba(158, 62, 255, 0.35)',
                    }}
                  >
                    {savingPractice
                      ? 'Saving...'
                      : view === 'edit'
                      ? 'Update Core Practice'
                      : 'Save Core Practice'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCancel}
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#e2e8f0',
                      fontWeight: 600,
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : (
        /* ================= LIST VIEW ================= */
        <>
      {/* Page Header */}
      <div className="page-header-row" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-header-title" style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginBottom: '0.35rem' }}>
            Core Cyber Practices (Bento Grid)
          </h1>
          <p className="page-header-desc" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Manage the interactive Bento Grid capabilities, hero highlights, links, badges, and section headings shown on the website.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={openAdd}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 700,
              padding: '0.65rem 1.25rem',
            }}
          >
            <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>+</span> Add Core Practice
          </button>
          <a
            href={`${import.meta.env.BASE_URL}digital-forensics?section=cyber`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.65rem 1rem',
              fontSize: '0.85rem',
            }}
            title="Preview on Digital Forensics / Cyber Security page"
          >
            <span>Preview on Website</span>
            <span>➔</span>
          </a>
          <Link
            to="/admin/services-cyber"
            className="btn btn-secondary btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.65rem 1rem',
              fontSize: '0.85rem',
            }}
            title="Manage Cyber Services details"
          >
            <span>🛡️</span>
            <span>Cyber Services</span>
          </Link>
        </div>
      </div>

      {/* Section Heading Callout Card */}
      <div
        className="section-heading-card"
        style={{
          marginBottom: '1.75rem',
          background: 'linear-gradient(135deg, rgba(158, 62, 255, 0.12) 0%, rgba(20, 16, 40, 0.95) 100%)',
          border: '1px solid rgba(158, 62, 255, 0.35)',
          borderLeft: '4px solid var(--accent-purple)',
          borderRadius: '12px',
          padding: '1.5rem 1.75rem',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#00e676',
                  boxShadow: '0 0 8px #00e676',
                }}
              ></span>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--accent-cyan)',
                }}
              >
                FRONT-END BENTO GRID SECTION TAG: {settings.tag || 'OUR PRACTICES'}
              </span>
            </div>
            <h2
              style={{
                fontSize: '1.35rem',
                fontWeight: 800,
                color: '#fff',
                marginBottom: '0.4rem',
                lineHeight: 1.3,
              }}
              dangerouslySetInnerHTML={{
                __html: settings.title || 'Core Cyber Practices. One Standard: <span>Uncompromising Defense.</span>',
              }}
            />
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5, maxWidth: '820px' }}>
              {settings.subtitle || 'Comprehensive offensive and defensive cybersecurity practices engineered for modern digital enterprises.'}
            </p>
          </div>
          <div style={{ flexShrink: 0 }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={openHeadingModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.25rem',
                fontWeight: 600,
                borderColor: 'rgba(158, 62, 255, 0.5)',
                background: 'rgba(158, 62, 255, 0.18)',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              <span>✏️</span>
              <span>Edit Section Heading</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Counter Grid */}
      <div className="stats-grid" style={{ marginBottom: '1.75rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="stat-card" style={{ padding: '1.25rem 1.5rem', borderRadius: '12px' }}>
          <div className="stat-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span className="stat-label" style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
              Total Practices
            </span>
            <div className="stat-icon-wrap" style={{ fontSize: '1.4rem' }}>⚡</div>
          </div>
          <div className="stat-value" style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginBottom: '0.25rem' }}>
            {stats.total}
          </div>
          <div className="stat-subtext" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Configured Bento Grid items
          </div>
        </div>

        <div className="stat-card" style={{ padding: '1.25rem 1.5rem', borderRadius: '12px' }}>
          <div className="stat-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span className="stat-label" style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
              Active on Site
            </span>
            <div className="stat-icon-wrap" style={{ fontSize: '1.4rem' }}>🛡️</div>
          </div>
          <div className="stat-value" style={{ fontSize: '2rem', fontWeight: 800, color: '#00e676', marginBottom: '0.25rem' }}>
            {stats.active}
          </div>
          <div className="stat-subtext" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Live visible cards
          </div>
        </div>

        <div className="stat-card" style={{ padding: '1.25rem 1.5rem', borderRadius: '12px' }}>
          <div className="stat-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span className="stat-label" style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
              Hero Spotlight Cards
            </span>
            <div className="stat-icon-wrap" style={{ fontSize: '1.4rem' }}>⭐</div>
          </div>
          <div className="stat-value" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-purple-light)', marginBottom: '0.25rem' }}>
            {stats.hero}
          </div>
          <div className="stat-subtext" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Spans 2-columns with glowing border
          </div>
        </div>

        <div className="stat-card" style={{ padding: '1.25rem 1.5rem', borderRadius: '12px' }}>
          <div className="stat-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span className="stat-label" style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
              Hidden / Draft
            </span>
            <div className="stat-icon-wrap" style={{ fontSize: '1.4rem' }}>👁️</div>
          </div>
          <div className="stat-value" style={{ fontSize: '2rem', fontWeight: 800, color: '#ffab00', marginBottom: '0.25rem' }}>
            {stats.hidden}
          </div>
          <div className="stat-subtext" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Excluded from public site
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
        }}
      >
        {/* Status Filter Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn btn-sm ${statusFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('all')}
            style={{ fontWeight: 600, padding: '0.45rem 0.85rem' }}
          >
            All Practices ({stats.total})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${statusFilter === 'active' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('active')}
            style={{
              fontWeight: 600,
              padding: '0.45rem 0.85rem',
              ...(statusFilter === 'active' ? { background: '#00e676', borderColor: '#00e676', color: '#000' } : {}),
            }}
          >
            ● Active ({stats.active})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${statusFilter === 'inactive' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('inactive')}
            style={{
              fontWeight: 600,
              padding: '0.45rem 0.85rem',
              ...(statusFilter === 'inactive' ? { background: '#ffab00', borderColor: '#ffab00', color: '#000' } : {}),
            }}
          >
            ○ Hidden ({stats.hidden})
          </button>
        </div>

        {/* Quick Search & Layout Filter Controls */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="form-control"
            value={heroFilter}
            onChange={(e) => setHeroFilter(e.target.value)}
            style={{
              width: 'auto',
              padding: '0.45rem 0.85rem',
              fontSize: '0.85rem',
              background: 'var(--bg-surface-elevated)',
              borderColor: 'var(--border-color)',
              color: '#fff',
              borderRadius: '6px',
            }}
          >
            <option value="all">All Card Layouts</option>
            <option value="hero">⭐ Hero Highlights Only</option>
            <option value="standard">Standard Bento Cards</option>
          </select>

          <input
            type="text"
            className="form-control"
            placeholder="Search practices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '200px',
              padding: '0.45rem 0.85rem',
              fontSize: '0.85rem',
              background: 'var(--bg-surface-elevated)',
              borderColor: 'var(--border-color)',
              color: '#fff',
              borderRadius: '6px',
            }}
          />

          {(heroFilter !== 'all' || searchQuery !== '' || statusFilter !== 'all') && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setStatusFilter('all');
                setHeroFilter('all');
                setSearchQuery('');
              }}
              title="Clear filters"
              style={{ padding: '0.45rem 0.75rem' }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Practices Table Card */}
      <div className="admin-card" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <div
          className="admin-card-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <h3 className="admin-card-title" style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0 }}>
            Configured Core Cyber Practices ({displayList.length})
          </h3>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={openAdd}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
          >
            <span>+</span> Add Core Practice
          </button>
        </div>

        <div className="table-responsive">
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(16, 16, 46, 0.6)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ width: '60px', padding: '1rem 1.25rem', textAlign: 'left', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>ORDER</th>
                <th style={{ width: '150px', padding: '1rem 1.25rem', textAlign: 'left', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>DOSSIER TAG</th>
                <th style={{ padding: '1rem 1.25rem', textAlign: 'left', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>PRACTICE TITLE &amp; DESCRIPTION</th>
                <th style={{ width: '180px', padding: '1rem 1.25rem', textAlign: 'left', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>LINK / DESTINATION</th>
                <th style={{ width: '150px', padding: '1rem 1.25rem', textAlign: 'left', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>LAYOUT / BADGE</th>
                <th style={{ width: '110px', padding: '1rem 1.25rem', textAlign: 'left', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>STATUS</th>
                <th style={{ width: '190px', padding: '1rem 1.25rem', textAlign: 'right', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Loading core cyber practices...
                  </td>
                </tr>
              ) : displayList.length > 0 ? (
                displayList.map((practice) => {
                  const isActive = practice.status ? practice.status === 'active' : practice.active !== false;
                  const isHero = Boolean(practice.is_hero);
                  const displayOrder = practice.order !== undefined ? practice.order : practice.id;
                  const targetLink = practice.link || (practice.slug ? `services/${practice.slug}.php` : '');

                  return (
                    <tr
                      key={practice.id}
                      style={{
                        borderBottom: '1px solid rgba(158, 62, 255, 0.1)',
                        transition: 'background 0.2s ease',
                      }}
                    >
                      {/* Order */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.2rem 0.55rem',
                            background: 'rgba(255, 255, 255, 0.06)',
                            borderRadius: '4px',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            color: 'var(--accent-purple-light)',
                          }}
                        >
                          {displayOrder}
                        </span>
                      </td>

                      {/* Dossier Tag */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <code
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--accent-cyan)',
                            fontWeight: 700,
                            fontFamily: 'monospace',
                          }}
                        >
                          {practice.tag || `// SEC-${String(practice.id).padStart(2, '0')}`}
                        </code>
                      </td>

                      {/* Title & Description */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>
                            {practice.title}
                          </div>
                          <div
                            style={{
                              fontSize: '0.8rem',
                              color: 'var(--text-muted)',
                              maxWidth: '440px',
                              lineHeight: 1.4,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {practice.description}
                          </div>
                        </div>
                      </td>

                      {/* Link / Destination */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontSize: '0.8rem' }}>
                          {targetLink ? (
                            <a
                              href={`${import.meta.env.BASE_URL}${targetLink.replace(/^\/+/, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: 'var(--accent-cyan)',
                                textDecoration: 'none',
                                wordBreak: 'break-all',
                                fontWeight: 500,
                              }}
                              title="Open destination"
                            >
                              {targetLink.split('/').pop()} ↗
                            </a>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </div>
                      </td>

                      {/* Layout / Badge */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'flex-start' }}>
                          {isHero ? (
                            <span
                              className="status-pill active"
                              style={{
                                fontSize: '0.68rem',
                                padding: '0.15rem 0.5rem',
                                background: 'rgba(158, 62, 255, 0.25)',
                                color: '#d8b4fe',
                                border: '1px solid rgba(158, 62, 255, 0.45)',
                                fontWeight: 700,
                                letterSpacing: '0.04em',
                              }}
                            >
                              ⭐ HERO WIDE
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Standard</span>
                          )}

                          {practice.badge && (
                            <span
                              style={{
                                fontSize: '0.66rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                background: 'rgba(0, 229, 255, 0.12)',
                                color: 'var(--accent-cyan)',
                                padding: '0.12rem 0.45rem',
                                borderRadius: '4px',
                                border: '1px solid rgba(0, 229, 255, 0.25)',
                                letterSpacing: '0.04em',
                              }}
                            >
                              {practice.badge}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <button
                          type="button"
                          className={`status-pill ${isActive ? 'active' : 'inactive'}`}
                          onClick={() => handleToggleStatus(practice.id, practice.title)}
                          style={{
                            cursor: 'pointer',
                            border: isActive ? '1px solid rgba(0, 230, 118, 0.35)' : '1px solid rgba(255, 171, 0, 0.35)',
                            background: isActive ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 171, 0, 0.15)',
                            color: isActive ? '#00e676' : '#ffab00',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                          }}
                          title={isActive ? 'Click to hide from website' : 'Click to make visible on website'}
                        >
                          {isActive ? '● ACTIVE' : '○ HIDDEN'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <div className="action-btns-group" style={{ justifyContent: 'flex-end', display: 'flex', gap: '0.4rem' }}>
                          <button
                            type="button"
                            className={`btn-action ${isActive ? 'hide' : 'show'}`}
                            onClick={() => handleToggleStatus(practice.id, practice.title)}
                            title={isActive ? 'Hide practice from website' : 'Make practice visible on website'}
                          >
                            {isActive ? 'Hide' : 'Show'}
                          </button>
                          <button
                            type="button"
                            className="btn-action edit"
                            onClick={() => openEdit(practice)}
                            title="Edit practice"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn-action delete"
                            onClick={() => openDeleteConfirm(practice)}
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
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2.75rem', color: 'var(--text-muted)' }}>
                    No core cyber practices matched the chosen filters. Click "Add Core Practice" above to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

      {/* ================= EDIT SECTION HEADING MODAL ================= */}
      {headingModalOpen && (
        <div
          className="admin-modal-backdrop show"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: '1rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !savingHeading) {
              setHeadingModalOpen(false);
            }
          }}
        >
          <div
            className="admin-modal-dialog"
            style={{
              maxWidth: '620px',
              width: '100%',
              margin: 'auto',
            }}
          >
            <div
              className="admin-modal-content"
              style={{
                background: '#100c24',
                border: '1px solid rgba(158, 62, 255, 0.35)',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(158, 62, 255, 0.2)',
              }}
            >
              <div
                className="admin-modal-header"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1.25rem 1.75rem',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                  Edit Core Practices Bento Grid Section Heading
                </h3>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setHeadingModalOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#8b949e',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    lineHeight: 1,
                    padding: '0.2rem',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#8b949e')}
                  aria-label="Close modal"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSaveHeading}>
                <div className="admin-modal-body" style={{ padding: '1.5rem 1.75rem' }}>
                  {/* Field 1: Section Tag Pill */}
                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label
                      className="form-label"
                      style={{
                        display: 'block',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#e2e8f0',
                        marginBottom: '0.4rem',
                      }}
                    >
                      Section Tag Pill <span style={{ color: '#ff4d4f' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="OUR PRACTICES"
                      value={headingForm.tag}
                      onChange={(e) => setHeadingForm(prev => ({ ...prev, tag: e.target.value }))}
                      style={{
                        width: '100%',
                        background: 'rgba(16, 12, 34, 0.85)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        color: '#fff',
                        padding: '0.75rem 0.9rem',
                        fontSize: '0.9rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <span
                      className="form-help"
                      style={{
                        display: 'block',
                        fontSize: '0.78rem',
                        color: '#8b949e',
                        marginTop: '0.35rem',
                      }}
                    >
                      Small tag pill rendered above the headline (e.g. OUR PRACTICES).
                    </span>
                  </div>

                  {/* Field 2: Section Heading Title */}
                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label
                      className="form-label"
                      style={{
                        display: 'block',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#e2e8f0',
                        marginBottom: '0.4rem',
                      }}
                    >
                      Section Heading Title <span style={{ color: '#ff4d4f' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="Core Cyber Practices. One Standard: <span>Uncompromising Defense.</span>"
                      value={headingForm.title}
                      onChange={(e) => setHeadingForm(prev => ({ ...prev, title: e.target.value }))}
                      style={{
                        width: '100%',
                        background: 'rgba(16, 12, 34, 0.85)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        color: '#fff',
                        padding: '0.75rem 0.9rem',
                        fontSize: '0.9rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <span
                      className="form-help"
                      style={{
                        display: 'block',
                        fontSize: '0.78rem',
                        color: '#8b949e',
                        marginTop: '0.35rem',
                      }}
                    >
                      HTML allowed (e.g. &lt;span&gt;Uncompromising Defense.&lt;/span&gt; for gradient color accent).
                    </span>
                  </div>

                  {/* Field 3: Section Subtitle / Description */}
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label
                      className="form-label"
                      style={{
                        display: 'block',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#e2e8f0',
                        marginBottom: '0.4rem',
                      }}
                    >
                      Section Subtitle / Description <span style={{ color: '#ff4d4f' }}>*</span>
                    </label>
                    <textarea
                      className="form-control"
                      rows={3}
                      required
                      placeholder="Comprehensive offensive and defensive cybersecurity practices engineered for modern digital enterprises."
                      value={headingForm.subtitle}
                      onChange={(e) => setHeadingForm(prev => ({ ...prev, subtitle: e.target.value }))}
                      style={{
                        width: '100%',
                        minHeight: '85px',
                        background: 'rgba(16, 12, 34, 0.85)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        color: '#fff',
                        padding: '0.75rem 0.9rem',
                        fontSize: '0.9rem',
                        lineHeight: 1.5,
                        resize: 'vertical',
                        fontFamily: 'inherit',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <span
                      className="form-help"
                      style={{
                        display: 'block',
                        fontSize: '0.78rem',
                        color: '#8b949e',
                        marginTop: '0.35rem',
                      }}
                    >
                      Supporting paragraph rendered right below the section title on the website.
                    </span>
                  </div>
                </div>

                <div
                  className="admin-modal-footer"
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '0.75rem',
                    padding: '1.25rem 1.75rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    background: 'rgba(10, 8, 24, 0.5)',
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setHeadingModalOpen(false)}
                    disabled={savingHeading}
                    style={{
                      background: '#16132b',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#e2e8f0',
                      padding: '0.65rem 1.35rem',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={savingHeading}
                    style={{
                      background: 'linear-gradient(135deg, #9e3eff 0%, #7928ca 100%)',
                      color: '#fff',
                      padding: '0.65rem 1.5rem',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      border: 'none',
                      boxShadow: '0 4px 15px rgba(158, 62, 255, 0.4)',
                      cursor: 'pointer',
                    }}
                  >
                    {savingHeading ? 'Saving...' : 'Save Section Heading'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {deleteModalOpen && itemToDelete && (
        <div className="admin-modal-backdrop show" style={{ zIndex: 1060 }}>
          <div className="admin-modal-dialog" style={{ maxWidth: '480px', width: '90%' }}>
            <div className="admin-modal-content" style={{ background: 'var(--bg-surface-card)', border: '1px solid rgba(255, 51, 102, 0.4)', borderRadius: '14px', overflow: 'hidden' }}>
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
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    lineHeight: 1,
                  }}
                >
                  &times;
                </button>
              </div>
              <div className="admin-modal-body" style={{ padding: '1.5rem' }}>
                <p style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '1rem' }}>
                  Are you sure you want to permanently delete the core practice{' '}
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
                  <div>Dossier Tag: <code style={{ color: 'var(--accent-cyan)' }}>{itemToDelete.tag}</code></div>
                  <div style={{ marginTop: '0.25rem' }}>Order: <span style={{ color: '#fff' }}>#{itemToDelete.order}</span></div>
                  <div style={{ marginTop: '0.5rem', color: '#ff3366', fontWeight: 600 }}>
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
