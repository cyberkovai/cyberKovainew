import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import {
  adminGetThreats,
  adminSaveThreat,
  adminDeleteThreat,
  adminToggleThreat,
  getSettings,
  updateSettings,
} from '../api/client';

// Palette definitions matching PHP backend & CSS exactly
const ACCENTS_META = {
  purple:  { label: 'Cyber Violet',   color: '#c084fc', border: 'rgba(192, 132, 252, 0.45)' },
  cyan:    { label: 'Neon Cyan',      color: '#22d3ee', border: 'rgba(34, 211, 238, 0.45)' },
  emerald: { label: 'Emerald Shield', color: '#34d399', border: 'rgba(52, 211, 153, 0.45)' },
  amber:   { label: 'Amber Alert',    color: '#fbbf24', border: 'rgba(251, 191, 36, 0.45)' },
  rose:    { label: 'Rose Flare',     color: '#fb7185', border: 'rgba(251, 113, 133, 0.45)' },
};

// Size hierarchy definitions matching PHP backend & CSS exactly
const SIZES_META = {
  md: { label: 'Medium (MD)',      desc: 'Standard incident tag' },
  xl: { label: 'Extra Large (XL)', desc: 'High visibility / primary pillar' },
  lg: { label: 'Large (LG)',       desc: 'Major threat category' },
  sm: { label: 'Small (SM)',       desc: 'Specific forensic technique' },
};

export default function AdminThreats() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [threats, setThreats] = useState([]);
  const [siteSettings, setSiteSettings] = useState({
    investigation_threats_title: 'Incidents & Threats We <span class="ci-grad-text">Investigate</span>',
    investigation_threats_subtitle: 'Specialized investigative capabilities across diverse cybercrime, financial fraud, and digital dispute categories.',
  });
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState(null);

  // View state: 'list' | 'add' | 'edit'
  const [view, setView] = useState('list');

  // Filters state
  const [currentStatus, setCurrentStatus] = useState('all'); // 'all' | 'active' | 'inactive'
  const [currentAccent, setCurrentAccent] = useState('all'); // 'all' | 'purple' | 'cyan' | ...
  const [currentSize, setCurrentSize] = useState('all');     // 'all' | 'xl' | 'lg' | ...
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInputValue, setSearchInputValue] = useState('');

  // Modals state
  const [headingModalOpen, setHeadingModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [savingThreat, setSavingThreat] = useState(false);
  const [savingHeading, setSavingHeading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Editing item ID (null when adding new)
  const [editingId, setEditingId] = useState(null);

  // Threat Form State
  const [formData, setFormData] = useState({
    id: '',
    text: '',
    size: 'md',
    accent: 'purple',
    order: 1,
    status: 'active',
  });

  // Heading Form State
  const [headingForm, setHeadingForm] = useState({
    section_title: '',
    section_subtitle: '',
  });

  // Load Data
  const loadData = async () => {
    try {
      setLoading(true);
      const [threatsData, settingsData] = await Promise.all([
        adminGetThreats(),
        getSettings().catch(() => ({})),
      ]);

      if (Array.isArray(threatsData)) {
        setThreats(threatsData);
      }
      if (settingsData && typeof settingsData === 'object') {
        setSiteSettings(prev => ({
          ...prev,
          ...settingsData,
          investigation_threats_title: settingsData.investigation_threats_title || prev.investigation_threats_title,
          investigation_threats_subtitle: settingsData.investigation_threats_subtitle || prev.investigation_threats_subtitle,
        }));
      }
    } catch (err) {
      setFlash({ type: 'error', message: 'Failed to load threats data: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle URL query params (?action=add or ?action=edit&id=...)
  useEffect(() => {
    const actionParam = searchParams.get('action');
    const idParam = searchParams.get('id');

    if (actionParam === 'add') {
      const nextOrder = threats.length > 0
        ? Math.max(...threats.map(t => parseInt(t.order, 10) || 0)) + 1
        : 1;
      setEditingId(null);
      setFormData({
        id: '',
        text: '',
        size: 'md',
        accent: 'purple',
        order: nextOrder || (threats.length + 1),
        status: 'active',
      });
      setView('add');
    } else if (actionParam === 'edit' && idParam && threats.length > 0) {
      const item = threats.find(t => String(t.id) === String(idParam));
      if (item) {
        const isItemActive = item.status === 'active' || (item.status === undefined && item.active !== false);
        setEditingId(item.id);
        setFormData({
          id: item.id || '',
          text: item.text || item.name || '',
          size: item.size || 'md',
          accent: item.accent || 'purple',
          order: item.order !== undefined ? item.order : 1,
          status: isItemActive ? 'active' : 'inactive',
        });
        setView('edit');
      }
    } else if (!actionParam) {
      setView('list');
      setEditingId(null);
    }
  }, [searchParams, threats]);

  // Flash auto-dismiss after 6s
  useEffect(() => {
    if (flash) {
      const timer = setTimeout(() => setFlash(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [flash]);

  // Counts
  const activeCount = useMemo(() => {
    return threats.filter(t => (t.status ? t.status === 'active' : t.active !== false)).length;
  }, [threats]);

  const hiddenCount = useMemo(() => {
    return threats.filter(t => (t.status ? t.status === 'inactive' : t.active === false)).length;
  }, [threats]);

  // Filtered List
  const displayList = useMemo(() => {
    let list = [...threats];

    // Status filter
    if (currentStatus === 'active') {
      list = list.filter(t => (t.status ? t.status === 'active' : t.active !== false));
    } else if (currentStatus === 'inactive') {
      list = list.filter(t => (t.status ? t.status === 'inactive' : t.active === false));
    }

    // Accent filter
    if (currentAccent !== 'all') {
      list = list.filter(t => (t.accent || 'purple') === currentAccent);
    }

    // Size filter
    if (currentSize !== 'all') {
      list = list.filter(t => (t.size || 'md') === currentSize);
    }

    // Search query filter
    if (searchQuery.trim() !== '') {
      const needle = searchQuery.trim().toLowerCase();
      list = list.filter(t => {
        const name = (t.text || t.name || '').toLowerCase();
        return name.includes(needle);
      });
    }

    // Sort by order sequence
    list.sort((a, b) => (parseInt(a.order, 10) || 0) - (parseInt(b.order, 10) || 0));

    return list;
  }, [threats, currentStatus, currentAccent, currentSize, searchQuery]);

  // Open Add View
  const openAdd = () => {
    const nextOrder = threats.length > 0
      ? Math.max(...threats.map(t => parseInt(t.order, 10) || 0)) + 1
      : 1;
    setEditingId(null);
    setFormData({
      id: '',
      text: '',
      size: 'md',
      accent: 'purple',
      order: nextOrder || (threats.length + 1),
      status: 'active',
    });
    setView('add');
    setSearchParams({ action: 'add' });
  };

  // Open Edit View
  const openEdit = (item) => {
    const isItemActive = item.status === 'active' || (item.status === undefined && item.active !== false);
    setEditingId(item.id);
    setFormData({
      id: item.id || '',
      text: item.text || item.name || '',
      size: item.size || 'md',
      accent: item.accent || 'purple',
      order: item.order !== undefined ? item.order : 1,
      status: isItemActive ? 'active' : 'inactive',
    });
    setView('edit');
    setSearchParams({ action: 'edit', id: item.id });
  };

  // Close form and return to list
  const handleBackToList = () => {
    setView('list');
    setEditingId(null);
    setSearchParams({});
  };

  // Open Heading Modal
  const openEditHeadingModal = () => {
    setHeadingForm({
      section_title: siteSettings.investigation_threats_title || 'Incidents & Threats We <span class="ci-grad-text">Investigate</span>',
      section_subtitle: siteSettings.investigation_threats_subtitle || 'Specialized investigative capabilities across diverse cybercrime, financial fraud, and digital dispute categories.',
    });
    setHeadingModalOpen(true);
  };

  // Open Delete Confirm
  const openDeleteConfirm = (item) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  // Save Threat Tag
  const handleSaveThreat = async (e) => {
    e.preventDefault();
    if (!formData.text.trim()) {
      setFlash({ type: 'error', message: 'Threat / Incident tag text cannot be empty.' });
      return;
    }

    try {
      setSavingThreat(true);
      const payload = {
        ...formData,
        text: formData.text.trim(),
        name: formData.text.trim(),
        order: parseInt(formData.order, 10) || 1,
        active: formData.status === 'active',
        status: formData.status,
      };

      await adminSaveThreat(payload, editingId);
      setFlash({
        type: 'success',
        message: `Threat tag '${payload.text}' was successfully saved!`,
      });
      setView('list');
      setEditingId(null);
      setSearchParams({});
      await loadData();
    } catch (err) {
      setFlash({ type: 'error', message: 'Failed to save threat tag: ' + (err.response?.data?.message || err.message) });
    } finally {
      setSavingThreat(false);
    }
  };

  // Save Heading & Subtitle
  const handleSaveHeading = async (e) => {
    e.preventDefault();
    try {
      setSavingHeading(true);
      const updated = {
        investigation_threats_title: headingForm.section_title.trim() || 'Incidents & Threats We <span class="ci-grad-text">Investigate</span>',
        investigation_threats_subtitle: headingForm.section_subtitle.trim() || 'Specialized investigative capabilities across diverse cybercrime, financial fraud, and digital dispute categories.',
      };

      await updateSettings(updated);
      setSiteSettings(prev => ({ ...prev, ...updated }));
      setFlash({ type: 'success', message: 'Section heading and description successfully updated!' });
      setHeadingModalOpen(false);
    } catch (err) {
      setFlash({ type: 'error', message: 'Failed to save section heading: ' + (err.response?.data?.message || err.message) });
    } finally {
      setSavingHeading(false);
    }
  };

  // Toggle Threat Status
  const handleToggle = async (id) => {
    try {
      const target = threats.find(t => String(t.id) === String(id));
      const targetName = target ? (target.text || target.name || `Tag #${id}`) : `Tag #${id}`;

      await adminToggleThreat(id);
      await loadData();

      const isNowActive = target ? (target.status === 'inactive' || target.active === false) : true;
      setFlash({
        type: 'success',
        message: isNowActive
          ? `Threat tag '${targetName}' is now ACTIVE and visible on the website.`
          : `Threat tag '${targetName}' is now HIDDEN from the website.`,
      });
    } catch (err) {
      setFlash({ type: 'error', message: 'Could not toggle threat tag status: ' + err.message });
    }
  };

  // Delete Threat
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      setDeleting(true);
      const name = itemToDelete.text || itemToDelete.name || `Tag #${itemToDelete.id}`;
      await adminDeleteThreat(itemToDelete.id);
      setFlash({ type: 'success', message: `Threat tag '${name}' was successfully deleted.` });
      setDeleteModalOpen(false);
      setItemToDelete(null);
      await loadData();
    } catch (err) {
      setFlash({ type: 'error', message: 'Could not delete threat tag: ' + err.message });
    } finally {
      setDeleting(false);
    }
  };

  // Handle Search Form Submit
  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(searchInputValue);
  };

  // Reset Filters
  const resetFilters = () => {
    setCurrentStatus('all');
    setCurrentAccent('all');
    setCurrentSize('all');
    setSearchQuery('');
    setSearchInputValue('');
  };

  return (
    <AdminLayout pageTitle="Investigation Threats & Incidents Cloud" currentCount={threats.length}>
      {/* Flash Alert */}
      {flash && (
        <div
          className={`flash-alert ${flash.type}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1.25rem',
            marginBottom: '1.25rem',
            borderRadius: '8px',
            background: flash.type === 'success' ? 'rgba(0, 230, 118, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${flash.type === 'success' ? '#00e676' : '#ef4444'}`,
            color: flash.type === 'success' ? '#00e676' : '#ef4444',
          }}
        >
          <span>
            <strong>{flash.type === 'success' ? '✓ Success: ' : '⚠ Error: '}</strong>
            {flash.message}
          </span>
          <button
            type="button"
            onClick={() => setFlash(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', fontSize: '1.2rem', cursor: 'pointer', lineHeight: 1 }}
          >
            &times;
          </button>
        </div>
      )}

      {/* ================= PAGE HEADER ROW ================= */}
      <div className="page-header-row">
        <div>
          <h1 className="page-header-title">Incidents &amp; Threats We Investigate</h1>
          <p className="page-header-desc">
            Manage 3D keyword globe tags, display hierarchy, and cyber neon accents displayed on the Digital Investigation page.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {view === 'list' ? (
            <>
              <button type="button" className="btn btn-primary" onClick={openAdd}>
                <span>+</span> Add Threat Tag
              </button>
              <a
                href={`${import.meta.env.BASE_URL}cyber-intelligence#ci-risks`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                title="Preview on Digital Investigation page"
              >
                Preview on Website ➔
              </a>
              <Link
                to="/admin/services-investigation"
                className="btn btn-secondary btn-sm"
                title="Manage 8 Investigation Practices"
              >
                🔍 Practices List
              </Link>
            </>
          ) : (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleBackToList}
            >
              &larr; Back to Threats List
            </button>
          )}
        </div>
      </div>

      {view === 'add' || view === 'edit' ? (
        /* ================= ADD / EDIT FULL PAGE FORM VIEW (EXACT SCREENSHOT UI) ================= */
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">
              {view === 'edit' ? `Edit Threat Tag: ${formData.text || ('Tag #' + editingId)}` : 'Add New Threat / Incident Tag'}
            </h3>
            <span
              className="category-tag"
              style={{
                background: 'rgba(139, 32, 255, 0.15)',
                color: 'var(--accent-purple-light)',
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.35rem 0.85rem',
                borderRadius: '9999px',
              }}
            >
              {view === 'edit' ? `Tag ID: #${editingId}` : 'New Word Cloud Chip'}
            </span>
          </div>

          <div className="admin-card-body" style={{ padding: '1.75rem' }}>
            <form onSubmit={handleSaveThreat}>
              <div className="threats-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                {/* Row 1: Threat / Incident Label (Full Width) */}
                <div className="form-group col-full" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                  <label htmlFor="threat_text" className="form-label" style={{ display: 'block', marginBottom: '0.45rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Threat / Incident Label <span className="required" style={{ color: 'var(--accent-red)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    id="threat_text"
                    className="form-control"
                    required
                    placeholder="e.g. Crypto & Blockchain Tracing, Ransomware Incident Triage"
                    value={formData.text}
                    onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
                    autoFocus
                  />
                  <span className="form-help" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}>
                    Text displayed inside the pill chip. Keep concise and impactful.
                  </span>
                </div>

                {/* Row 2 - Col 1: Size Hierarchy */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="threat_size" className="form-label" style={{ display: 'block', marginBottom: '0.45rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Size Hierarchy <span className="required" style={{ color: 'var(--accent-red)' }}>*</span>
                  </label>
                  <select
                    id="threat_size"
                    className="form-control"
                    style={{ fontWeight: 600, background: '#0a0a1f', color: '#fff', borderColor: 'rgba(158, 62, 255, 0.25)' }}
                    value={formData.size}
                    onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
                  >
                    {Object.entries(SIZES_META).map(([sKey, sData]) => (
                      <option key={sKey} value={sKey}>
                        {sData.label} — {sData.desc}
                      </option>
                    ))}
                  </select>
                  <span className="form-help" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}>
                    Controls typography prominence and padding in the word cloud.
                  </span>
                </div>

                {/* Row 2 - Col 2: Cyber Accent Color */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="threat_accent" className="form-label" style={{ display: 'block', marginBottom: '0.45rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Cyber Accent Color <span className="required" style={{ color: 'var(--accent-red)' }}>*</span>
                  </label>
                  <select
                    id="threat_accent"
                    className="form-control"
                    style={{ fontWeight: 600, background: '#0a0a1f', color: '#fff', borderColor: 'rgba(158, 62, 255, 0.25)' }}
                    value={formData.accent}
                    onChange={(e) => setFormData(prev => ({ ...prev, accent: e.target.value }))}
                  >
                    {Object.entries(ACCENTS_META).map(([aKey, aData]) => (
                      <option key={aKey} value={aKey}>
                        ● {aData.label} ({aKey})
                      </option>
                    ))}
                  </select>
                  <span className="form-help" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}>
                    Glowing indicator dot color, border glow, and hover reflection.
                  </span>
                </div>

                {/* Row 2 - Col 3: Display Order Sequence */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="threat_order" className="form-label" style={{ display: 'block', marginBottom: '0.45rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Display Order Sequence
                  </label>
                  <input
                    type="number"
                    id="threat_order"
                    className="form-control"
                    min="1"
                    value={formData.order}
                    onChange={(e) => setFormData(prev => ({ ...prev, order: e.target.value }))}
                  />
                  <span className="form-help" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}>
                    Placement sequence in the word-cloud flow (1 = first chip).
                  </span>
                </div>

                {/* Row 3 - Col 1: Publication Status */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="threat_status" className="form-label" style={{ display: 'block', marginBottom: '0.45rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Publication Status
                  </label>
                  <select
                    id="threat_status"
                    className="form-control"
                    style={{ fontWeight: 600, background: '#0a0a1f', color: '#fff', borderColor: 'rgba(158, 62, 255, 0.25)' }}
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="active">Active (Visible on Website)</option>
                    <option value="inactive">Hidden (Hide from Website)</option>
                  </select>
                  <span className="form-help" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}>
                    Toggle between active public visibility and draft mode.
                  </span>
                </div>

                {/* Row 4: Live Pill Preview (Real-time) (Full Width) */}
                <div className="form-group col-full" style={{ gridColumn: '1 / -1', marginTop: '0.5rem', marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.45rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Live Pill Preview (Real-time)
                  </label>
                  <div
                    style={{
                      background: 'radial-gradient(circle at center, #150f2e 0%, #060513 100%)',
                      padding: '2.25rem 1.5rem',
                      borderRadius: '14px',
                      border: '1px dashed rgba(158, 62, 255, 0.28)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '140px',
                      boxShadow: 'inset 0 2px 14px rgba(0,0,0,0.6)',
                    }}
                  >
                    <div
                      className={`ci-risk-tag tag-${formData.size} accent-${formData.accent}`}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                      title="Hover to test animation!"
                    >
                      <span className="ci-risk-dot"></span>
                      <span>{formData.text.trim() !== '' ? formData.text.trim() : 'Threat Tag Preview'}</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1.25rem', letterSpacing: '0.02em', margin: '1.25rem 0 0 0' }}>
                      Interactive preview: Move your mouse over the pill above to test the hover glow and scaling effects.
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Bottom Actions */}
              <div
                style={{
                  paddingTop: '1.5rem',
                  marginTop: '1.5rem',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleBackToList}
                  disabled={savingThreat}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingThreat}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'linear-gradient(135deg, #9e3eff 0%, #6412b8 100%)',
                    boxShadow: '0 4px 18px rgba(158, 62, 255, 0.45)',
                    color: '#fff',
                    fontWeight: 600,
                    padding: '0.75rem 1.6rem',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: savingThreat ? 'not-allowed' : 'pointer',
                  }}
                >
                  <span>💾</span>
                  <span>{savingThreat ? 'Saving...' : 'Save Threat Tag'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* ================= LIST VIEW ================= */
        <>
          {/* Front-End Section Heading Callout Card */}
          <div className="section-heading-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '280px' }}>
                <div className="section-heading-badge">
                  <span className="section-heading-badge-dot"></span>
                  <span>Front-End Section Heading &amp; Subtitle</span>
                </div>
                <h2
                  className="section-heading-title"
                  dangerouslySetInnerHTML={{
                    __html: siteSettings.investigation_threats_title || 'Incidents & Threats We <span class="ci-grad-text">Investigate</span>',
                  }}
                />
                <p className="section-heading-subtitle">
                  {siteSettings.investigation_threats_subtitle ||
                    'Specialized investigative capabilities across diverse cybercrime, financial fraud, and digital dispute categories.'}
                </p>
              </div>
              <div style={{ flexShrink: 0 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={openEditHeadingModal}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 1.15rem',
                    fontWeight: 600,
                    borderColor: 'rgba(158, 62, 255, 0.45)',
                    background: 'rgba(158, 62, 255, 0.14)',
                  }}
                >
                  <span>✏️</span>
                  <span>Edit Section Heading</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            {/* Status Filter Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`btn btn-sm ${currentStatus === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setCurrentStatus('all')}
              >
                All Tags ({threats.length})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${currentStatus === 'active' ? 'btn-primary' : 'btn-secondary'}`}
                style={currentStatus === 'active' ? { background: '#00e676', borderColor: '#00e676', color: '#000', fontWeight: 700 } : {}}
                onClick={() => setCurrentStatus('active')}
              >
                ● Active ({activeCount})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${currentStatus === 'inactive' ? 'btn-primary' : 'btn-secondary'}`}
                style={currentStatus === 'inactive' ? { background: '#ffab00', borderColor: '#ffab00', color: '#000', fontWeight: 700 } : {}}
                onClick={() => setCurrentStatus('inactive')}
              >
                ○ Hidden ({hiddenCount})
              </button>
            </div>

            {/* Quick Search & Dropdown Filters Form */}
            <form onSubmit={handleFilterSubmit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', margin: 0 }}>
              <select
                className="form-control"
                style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.82rem', background: '#0a0a1f', color: '#fff', borderColor: 'rgba(158, 62, 255, 0.25)' }}
                value={currentAccent}
                onChange={(e) => setCurrentAccent(e.target.value)}
              >
                <option value="all">All Accents</option>
                {Object.entries(ACCENTS_META).map(([aKey, aData]) => (
                  <option key={aKey} value={aKey}>
                    ● {aData.label}
                  </option>
                ))}
              </select>

              <select
                className="form-control"
                style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.82rem', background: '#0a0a1f', color: '#fff', borderColor: 'rgba(158, 62, 255, 0.25)' }}
                value={currentSize}
                onChange={(e) => setCurrentSize(e.target.value)}
              >
                <option value="all">All Sizes</option>
                {Object.entries(SIZES_META).map(([sKey, sData]) => (
                  <option key={sKey} value={sKey}>
                    {sKey.toUpperCase()} ({sData.label.split(' (')[0]})
                  </option>
                ))}
              </select>

              <input
                type="text"
                className="form-control"
                placeholder="Search threats..."
                value={searchInputValue}
                onChange={(e) => setSearchInputValue(e.target.value)}
                style={{ width: 180, padding: '0.4rem 0.75rem', fontSize: '0.82rem', background: '#0a0a1f', color: '#fff', borderColor: 'rgba(158, 62, 255, 0.25)' }}
              />

              <button type="submit" className="btn btn-secondary btn-sm">Filter</button>

              {(currentAccent !== 'all' || currentSize !== 'all' || searchQuery !== '' || currentStatus !== 'all') && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  title="Clear filters"
                  onClick={resetFilters}
                >
                  ✕
                </button>
              )}
            </form>
          </div>

          {/* Main Table Card */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-card-title">
                Threat &amp; Incident Word Cloud Tags ({displayList.length})
              </h3>
              <button type="button" className="btn btn-primary btn-sm" onClick={openAdd}>
                + Add Threat Tag
              </button>
            </div>

            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>#</th>
                    <th style={{ minWidth: '240px' }}>Live Pill Preview</th>
                    <th>Threat / Incident Name</th>
                    <th>Size Hierarchy</th>
                    <th>Cyber Accent</th>
                    <th style={{ width: '70px' }}>Order</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        Loading threat tags...
                      </td>
                    </tr>
                  ) : displayList.length > 0 ? (
                    displayList.map((t) => {
                      const tId = t.id;
                      const tText = t.text || t.name || '';
                      const tSize = t.size || 'md';
                      const tAccent = t.accent || 'purple';
                      const tOrder = t.order ?? 1;
                      const isActive = t.status === 'active' || (t.status === undefined && t.active !== false);
                      const accentInfo = ACCENTS_META[tAccent] || ACCENTS_META.purple;

                      return (
                        <tr key={tId}>
                          <td>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                              #{tId}
                            </span>
                          </td>
                          <td>
                            <div className={`ci-risk-tag tag-${tSize} accent-${tAccent}`}>
                              <span className="ci-risk-dot"></span>
                              <span>{tText}</span>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.92rem' }}>
                              {tText}
                            </span>
                          </td>
                          <td>
                            <span className="category-tag" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>
                              {tSize}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                              <span
                                style={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: '50%',
                                  background: accentInfo.color,
                                  boxShadow: `0 0 6px ${accentInfo.color}`,
                                  display: 'inline-block',
                                }}
                              />
                              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                {accentInfo.label}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                              {tOrder}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className={`status-pill ${isActive ? 'active' : 'inactive'}`}
                              style={{
                                cursor: 'pointer',
                                background: isActive ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 171, 0, 0.15)',
                                color: isActive ? '#00e676' : '#ffab00',
                                borderColor: isActive ? 'rgba(0, 230, 118, 0.3)' : 'rgba(255, 171, 0, 0.3)',
                              }}
                              title={isActive ? 'Click to hide from website' : 'Click to make visible on website'}
                              onClick={() => handleToggle(tId)}
                            >
                              {isActive ? '● ACTIVE' : '○ HIDDEN'}
                            </button>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="action-btns-group" style={{ justifyContent: 'flex-end' }}>
                              {isActive ? (
                                <button
                                  type="button"
                                  className="btn-action hide"
                                  title="Hide tag from website"
                                  onClick={() => handleToggle(tId)}
                                >
                                  Hide
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="btn-action show"
                                  title="Make tag visible on website"
                                  onClick={() => handleToggle(tId)}
                                >
                                  Show
                                </button>
                              )}
                              <button
                                type="button"
                                className="btn-action edit"
                                title="Edit tag"
                                onClick={() => openEdit(t)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn-action delete"
                                title="Delete tag"
                                onClick={() => openDeleteConfirm(t)}
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
                      <td colSpan="8" style={{ textAlign: 'center', padding: '2.75rem', color: 'var(--text-muted)' }}>
                        No threats or incident tags matched the chosen filters. Click &quot;Add Threat Tag&quot; above to create one.
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
        <div className="admin-modal-backdrop show" onClick={(e) => { if (e.target === e.currentTarget) setHeadingModalOpen(false); }}>
          <div className="admin-modal" style={{ maxWidth: '620px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Incidents &amp; Threats Section Heading</h3>
              <button type="button" className="modal-close-btn" onClick={() => setHeadingModalOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveHeading}>
              <div className="modal-body" style={{ padding: '1.5rem' }}>
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">
                    Section Heading Title <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={headingForm.section_title}
                    onChange={(e) => setHeadingForm(prev => ({ ...prev, section_title: e.target.value }))}
                  />
                  <span className="form-help">
                    HTML allowed (e.g. <code>&lt;span className=&quot;ci-grad-text&quot;&gt;Investigate&lt;/span&gt;</code> for violet gradient accent).
                  </span>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">
                    Section Subtitle / Description <span className="required">*</span>
                  </label>
                  <textarea
                    rows={3}
                    className="form-control"
                    required
                    value={headingForm.section_subtitle}
                    onChange={(e) => setHeadingForm(prev => ({ ...prev, section_subtitle: e.target.value }))}
                  />
                  <span className="form-help">
                    Supporting paragraph rendered right below the section title on the website.
                  </span>
                </div>
              </div>

              <div
                className="modal-footer"
                style={{
                  padding: '1rem 1.5rem',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setHeadingModalOpen(false)}
                  disabled={savingHeading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingHeading}
                >
                  {savingHeading ? 'Saving...' : 'Save Section Heading'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {deleteModalOpen && itemToDelete && (
        <div className="admin-modal-backdrop show" onClick={(e) => { if (e.target === e.currentTarget) setDeleteModalOpen(false); }}>
          <div className="admin-modal" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#ef4444' }}>
                ⚠️ Confirm Deletion
              </h3>
              <button type="button" className="modal-close-btn" onClick={() => setDeleteModalOpen(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem' }}>
              <p style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '0.75rem' }}>
                Are you sure you want to permanently delete the threat tag:
              </p>
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '1rem',
                }}
              >
                <div className={`ci-risk-tag tag-${itemToDelete.size || 'md'} accent-${itemToDelete.accent || 'purple'}`}>
                  <span className="ci-risk-dot"></span>
                  <span>{itemToDelete.text || itemToDelete.name}</span>
                </div>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>
                This action cannot be undone. This tag will no longer appear in the 3D Fibonacci keyword globe on the website.
              </p>
            </div>
            <div
              className="modal-footer"
              style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
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
                style={{ background: '#ef4444', borderColor: '#ef4444', color: '#fff' }}
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
