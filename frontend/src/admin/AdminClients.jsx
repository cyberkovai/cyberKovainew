import React, { useMemo, useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import {
  adminGetClients,
  adminSaveClient,
  adminDeleteClient,
  adminToggleClient,
  adminUploadFile,
} from '../api/client';
import { getAssetUrl } from '../utils/assets';

const normalizeImg = (path, fallback = 'assets/images/client_copconnect.jpg') => {
  return getAssetUrl(path || fallback);
};

const isActiveStatus = (item) => (item?.status ? item.status === 'active' : item?.active !== false);

const trackOf = (item) => item?.track || 'both';

const matchesFilter = (item, filter) => {
  if (!filter || filter === 'all') return true;
  const track = trackOf(item);
  if (filter === 'investigation') {
    return track === 'investigation' || track === 'forensics' || track === 'both' || track === 'all';
  }
  if (filter === 'cyber') {
    return track === 'cyber' || track === 'both' || track === 'all';
  }
  return true;
};

const emptyForm = (order = 1, track = 'investigation') => ({
  id: '',
  name: '',
  category: '',
  desc: '',
  img: 'assets/images/client_copconnect.jpg',
  alt: '',
  website: '',
  track: track === 'all' ? 'investigation' : track,
  order,
  status: 'active',
});

export default function AdminClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState('list'); // 'list' | 'add' | 'edit'
  const [editingId, setEditingId] = useState(null);
  const [currentTrack, setCurrentTrack] = useState('all'); // 'all' | 'investigation' | 'cyber'
  const [formData, setFormData] = useState(emptyForm());
  const [toast, setToast] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 4500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await adminGetClients();
      setClients(Array.isArray(data) ? data : []);
    } catch {
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const investigationCount = useMemo(
    () => clients.filter((item) => matchesFilter(item, 'investigation')).length,
    [clients]
  );

  const cyberCount = useMemo(
    () => clients.filter((item) => matchesFilter(item, 'cyber')).length,
    [clients]
  );

  const displayClients = useMemo(
    () => clients.filter((item) => matchesFilter(item, currentTrack)),
    [clients, currentTrack]
  );

  const openAdd = () => {
    const nextId = `client-${Date.now()}`;
    setEditingId(null);
    setFormData({
      ...emptyForm(clients.length + 1, currentTrack),
      id: nextId,
    });
    setMode('add');
  };

  const openEdit = (client) => {
    setEditingId(client.id);
    setFormData({
      id: client.id,
      name: client.name || '',
      category: client.category || '',
      desc: client.desc || '',
      img: client.img || client.logo || 'assets/images/client_copconnect.jpg',
      alt: client.alt || (client.name ? `${client.name} - ${client.category || ''}` : ''),
      website: client.website || '',
      track: ['investigation', 'cyber', 'both'].includes(client.track) ? client.track : 'investigation',
      order: client.order ?? 1,
      status: isActiveStatus(client) ? 'active' : 'inactive',
    });
    setMode('edit');
  };

  const backToList = () => {
    setMode('list');
    setEditingId(null);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('prefix', 'client');
    try {
      const res = await adminUploadFile(fd);
      if (res?.url) {
        setFormData((prev) => ({ ...prev, img: res.url }));
        showToast('success', 'Logo uploaded successfully. Save the client to keep it.');
      }
    } catch (err) {
      showToast('warning', `Logo upload notice: ${err.message}. Retained existing logo.`);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = formData.name.trim();
    if (!name) {
      showToast('error', 'Client / Organization name cannot be empty.');
      return;
    }

    const track = ['investigation', 'cyber', 'both'].includes(formData.track) ? formData.track : 'investigation';
    const payload = {
      ...formData,
      name,
      category: formData.category.trim(),
      desc: formData.desc.trim(),
      img: formData.img.trim() || 'assets/images/client_copconnect.jpg',
      alt: formData.alt.trim() || `${name} - ${formData.category.trim()}`,
      website: formData.website.trim(),
      track,
      order: Number(formData.order) || 1,
      status: formData.status === 'inactive' ? 'inactive' : 'active',
      active: formData.status !== 'inactive',
    };

    setSaving(true);
    try {
      await adminSaveClient(payload, editingId);
      const trackLabel = track === 'investigation' ? 'Digital Investigation' : track === 'cyber' ? 'Cyber Security' : 'Both Tracks';
      showToast('success', `Client '${name}' successfully saved for ${trackLabel}!`);
      setMode('list');
      setEditingId(null);
      if (track !== 'both') setCurrentTrack(track);
      await loadData();
    } catch (err) {
      showToast('error', `Failed to save client: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (item) => {
    const label = item.name || 'Client';
    try {
      const res = await adminToggleClient(item.id);
      const updated = res?.data;
      const nextActive = updated ? isActiveStatus(updated) : !isActiveStatus(item);
      setClients((prev) =>
        prev.map((row) =>
          String(row.id) === String(item.id)
            ? { ...row, ...(updated || {}), status: nextActive ? 'active' : 'inactive', active: nextActive }
            : row
        )
      );
      showToast(
        'success',
        nextActive
          ? `Client '${label}' is now ACTIVE and visible on the website.`
          : `Client '${label}' is now HIDDEN from the website.`
      );
    } catch (err) {
      showToast('error', `Could not toggle client status: ${err.message}`);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    const label = target.name || 'Client';
    setDeleteTarget(null);
    try {
      await adminDeleteClient(target.id);
      setClients((prev) => prev.filter((row) => String(row.id) !== String(target.id)));
      showToast('success', `Client '${label}' was successfully deleted.`);
    } catch (err) {
      showToast('error', `Could not delete client '${label}': ${err.message}`);
    }
  };

  const listCardTitle =
    currentTrack === 'investigation'
      ? `🔍 Digital Investigation Clients (${displayClients.length})`
      : currentTrack === 'cyber'
        ? `🛡️ Cyber Security Clients (${displayClients.length})`
        : `All Trusted Clients & Partners (${displayClients.length})`;

  return (
    <AdminLayout pageTitle="Clients & Partner Organizations" currentCount={clients.length}>
      {/* Flash Alert Banner */}
      {toast && (
        <div
          className={`flash-alert ${toast.type === 'error' ? 'error' : toast.type === 'warning' ? 'warning' : 'success'}`}
          style={{ marginBottom: '1.25rem' }}
        >
          <span>
            <strong>{toast.type === 'success' ? '✓ Success:' : toast.type === 'warning' ? '⚠ Notice:' : '⚠ Error:'}</strong>{' '}
            {toast.message}
          </span>
          <button type="button" className="flash-close-btn" onClick={() => setToast(null)}>
            &times;
          </button>
        </div>
      )}

      {/* Page Header — Title & Description */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 className="page-header-title">Client Organizations &amp; Partners</h1>
        <p className="page-header-desc">
          Manage trusted client organizations, logos, badges, and case contents displayed separately for Digital Investigation and Cyber Security.
        </p>
      </div>

      {/* Action Buttons Row */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
        {mode === 'list' ? (
          <>
            <button type="button" className="btn btn-primary" onClick={openAdd}>
              <span>+</span> Add New Client
            </button>
            <a
              href={`${import.meta.env.BASE_URL}cyber-intelligence#ci-clients`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              title="Preview clients on Digital Investigation page"
            >
              Preview Investigation ➔
            </a>
            <a
              href={`${import.meta.env.BASE_URL}digital-forensics#clients`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              title="Preview clients on Cyber Security page"
            >
              Preview Cyber ➔
            </a>
          </>
        ) : (
          <button type="button" className="btn btn-secondary" onClick={backToList}>
            &larr; Back to Clients List
          </button>
        )}
      </div>

      {mode === 'add' || mode === 'edit' ? (
        /* ═══════════════════════════════════════════════════════════════════════════
             ADD / EDIT CLIENT FORM CARD
        ═══════════════════════════════════════════════════════════════════════════ */
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">
              {mode === 'edit'
                ? `✏️ Edit Client: ${formData.name}`
                : '+ Add New Client Organization'}
            </h3>
            <span
              className="category-tag"
              style={{
                background: 'rgba(139,32,255,0.15)',
                color: 'var(--accent-purple-light)',
                border: '1px solid rgba(139,32,255,0.35)',
              }}
            >
              {mode === 'edit' ? `Client ID: ${editingId}` : 'New Client Profile'}
            </span>
          </div>
          <div className="admin-card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                {/* Client Name */}
                <div className="form-group">
                  <label htmlFor="client_name" className="form-label">
                    Client / Organization Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="client_name"
                    name="name"
                    className="form-control"
                    required
                    placeholder="e.g. CopConnect or Gokarna Samudra"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  />
                  <span className="form-help">Company, institutional partner, or corporate client title.</span>
                </div>

                {/* Category */}
                <div className="form-group">
                  <label htmlFor="category" className="form-label">
                    Category / Industry Tag <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="category"
                    name="category"
                    className="form-control"
                    required
                    placeholder="e.g. Information Sharing and Analysis Center"
                    value={formData.category}
                    onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                  />
                  <span className="form-help">Highlighted label shown under client name (e.g. Beach Resort &amp; Hospitality).</span>
                </div>

                {/* Track */}
                <div className="form-group">
                  <label htmlFor="track" className="form-label">
                    Department / Display Track <span className="required">*</span>
                  </label>
                  <select
                    id="track"
                    name="track"
                    className="form-control"
                    style={{ fontWeight: 600 }}
                    required
                    value={formData.track}
                    onChange={(e) => setFormData((prev) => ({ ...prev, track: e.target.value }))}
                  >
                    <option value="investigation">🔍 Digital Investigation &amp; Forensics</option>
                    <option value="cyber">🛡️ Cyber Security &amp; Defense</option>
                    <option value="both">🌐 Both Tracks (Investigation &amp; Cyber)</option>
                  </select>
                  <span className="form-help">Choose which page(s) on the website will showcase this client.</span>
                </div>

                {/* Order */}
                <div className="form-group">
                  <label htmlFor="order" className="form-label">Display Order Sequence</label>
                  <input
                    type="number"
                    id="order"
                    name="order"
                    className="form-control"
                    min="1"
                    value={formData.order}
                    onChange={(e) => setFormData((prev) => ({ ...prev, order: e.target.value }))}
                  />
                  <span className="form-help">Position in the clients row (1 = first displayed).</span>
                </div>

                {/* Status */}
                <div className="form-group">
                  <label htmlFor="status" className="form-label">Publication Status</label>
                  <select
                    id="status"
                    name="status"
                    className="form-control"
                    style={{ fontWeight: 600 }}
                    value={formData.status}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="active">✅ Active (Visible on Website)</option>
                    <option value="inactive">🔒 Hidden (Hide from Website)</option>
                  </select>
                  <span className="form-help">Instantly show or hide this client from the public website.</span>
                </div>

                {/* Website URL */}
                <div className="form-group">
                  <label htmlFor="website" className="form-label">
                    Client Website URL <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span>
                  </label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    className="form-control"
                    placeholder="https://example.com"
                    value={formData.website}
                    onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                  />
                  <span className="form-help">Shown as a &quot;Visit Website ↗&quot; link in the admin table if provided.</span>
                </div>

                {/* Logo Upload & Preview */}
                <div className="form-group col-full">
                  <label htmlFor="logo_file" className="form-label">
                    Client Company Logo <span className="required">*</span>
                  </label>
                  <div className="input-with-preview" style={{ alignItems: 'flex-start', gap: '1.25rem' }}>
                    {/* Logo Preview Box */}
                    <div
                      style={{
                        background: '#ffffff',
                        padding: '10px',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        width: '180px',
                        height: '100px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                      }}
                    >
                      <img
                        src={normalizeImg(formData.img)}
                        alt="Logo Preview"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = getAssetUrl('assets/images/client_copconnect.jpg');
                        }}
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <input
                        type="file"
                        id="logo_file"
                        className="form-control"
                        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        style={{ marginBottom: '0.65rem' }}
                      />
                      <input
                        type="text"
                        id="img"
                        name="img"
                        className="form-control"
                        placeholder="assets/images/client_copconnect.jpg"
                        value={formData.img}
                        onChange={(e) => setFormData((prev) => ({ ...prev, img: e.target.value }))}
                      />
                      <span className="form-help">
                        {uploading
                          ? 'Uploading logo file…'
                          : 'Upload transparent PNG, SVG, WebP, or JPG. Logos are displayed in a white high-contrast container on the website.'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Alt Text */}
                <div className="form-group col-full">
                  <label htmlFor="alt" className="form-label">
                    Logo Alt Text <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Accessibility &amp; SEO)</span>
                  </label>
                  <input
                    type="text"
                    id="alt"
                    name="alt"
                    className="form-control"
                    placeholder="e.g. CopConnect - Information Sharing and Analysis Center"
                    value={formData.alt}
                    onChange={(e) => setFormData((prev) => ({ ...prev, alt: e.target.value }))}
                  />
                  <span className="form-help">Descriptive alt text for screen readers and SEO. Defaults to client name + category if left blank.</span>
                </div>

                {/* Case Description */}
                <div className="form-group col-full">
                  <label htmlFor="desc" className="form-label">
                    Case Engagement Content / Description <span className="required">*</span>
                  </label>
                  <textarea
                    id="desc"
                    name="desc"
                    rows="4"
                    className="form-control"
                    required
                    placeholder="Describe the scope of work, strategic partnership, digital forensic investigation, or cybersecurity protection provided..."
                    value={formData.desc}
                    onChange={(e) => setFormData((prev) => ({ ...prev, desc: e.target.value }))}
                  />
                  <span className="form-help">This description appears in the client card on the public website (2–3 sentences recommended).</span>
                </div>
              </div>

              {/* Form Actions */}
              <div
                style={{
                  paddingTop: '1.5rem',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <button type="button" className="btn btn-secondary" onClick={backToList} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
                  <span>💾</span> {mode === 'edit' ? 'Update Client' : 'Save Client Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════════════════════════════
             LIST VIEW
        ═══════════════════════════════════════════════════════════════════════════ */
        <>
          {/* Track Filter Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn btn-sm ${currentTrack === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              style={currentTrack === 'all' ? { background: '#9e3eff', borderColor: '#9e3eff' } : undefined}
              onClick={() => setCurrentTrack('all')}
            >
              All Clients ({clients.length})
            </button>

            <button
              type="button"
              className={`btn btn-sm ${currentTrack === 'investigation' ? 'btn-primary' : 'btn-secondary'}`}
              style={currentTrack === 'investigation' ? { background: '#8b20ff', borderColor: '#8b20ff' } : undefined}
              onClick={() => setCurrentTrack('investigation')}
            >
              <span
                style={{
                  color: currentTrack === 'investigation' ? '#ffffff' : '#00e5ff',
                  marginRight: '6px',
                  fontSize: '0.9rem',
                  lineHeight: 1,
                }}
              >
                ●
              </span>
              Digital Investigation ({investigationCount})
            </button>

            <button
              type="button"
              className={`btn btn-sm ${currentTrack === 'cyber' ? 'btn-primary' : 'btn-secondary'}`}
              style={currentTrack === 'cyber' ? { background: '#00b4d8', borderColor: '#00b4d8' } : undefined}
              onClick={() => setCurrentTrack('cyber')}
            >
              <span
                style={{
                  color: currentTrack === 'cyber' ? '#ffffff' : '#00b4d8',
                  marginRight: '6px',
                  fontSize: '0.9rem',
                }}
              >
                🛡️
              </span>
              Cyber Security ({cyberCount})
            </button>
          </div>

          {/* Clients Table Card */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-card-title">{listCardTitle}</h3>
              <div>
                <button type="button" className="btn btn-primary btn-sm" onClick={openAdd}>
                  + Add Client
                </button>
              </div>
            </div>

            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '90px' }}>LOGO</th>
                    <th>CLIENT / ORGANIZATION</th>
                    <th style={{ width: '160px' }}>DEPARTMENT / TRACK</th>
                    <th>CASE ENGAGEMENT DESCRIPTION</th>
                    <th style={{ width: '65px', textAlign: 'center' }}>ORDER</th>
                    <th style={{ width: '110px' }}>STATUS</th>
                    <th style={{ textAlign: 'right', width: '180px' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                        Loading client organizations…
                      </td>
                    </tr>
                  ) : displayClients.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏢</div>
                        <p style={{ fontSize: '0.95rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                          No clients found{currentTrack !== 'all' ? ' for this track' : ''}.
                        </p>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          style={{ margin: '0.5rem auto 0 auto' }}
                          onClick={openAdd}
                        >
                          + Add First Client
                        </button>
                      </td>
                    </tr>
                  ) : (
                    displayClients.map((c) => {
                      const isActive = isActiveStatus(c);
                      const track = trackOf(c);

                      return (
                        <tr key={c.id}>
                          {/* LOGO */}
                          <td>
                            <div
                              style={{
                                background: '#ffffff',
                                padding: '5px 7px',
                                borderRadius: '8px',
                                border: '1px solid rgba(255,255,255,0.15)',
                                width: '76px',
                                height: '44px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                flexShrink: 0,
                              }}
                            >
                              <img
                                src={normalizeImg(c.img || c.logo)}
                                alt={c.alt || c.name}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = getAssetUrl('assets/images/client_copconnect.jpg');
                                }}
                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                              />
                            </div>
                          </td>

                          {/* CLIENT / ORGANIZATION */}
                          <td>
                            <span className="cell-title">{c.name}</span>
                            <span className="cell-subtitle">{c.category || ''}</span>
                            {c.website ? (
                              <a
                                href={c.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  fontSize: '0.72rem',
                                  color: 'var(--accent-purple-light)',
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  marginTop: '3px',
                                }}
                              >
                                <span>🔗</span> Visit Website ↗
                              </a>
                            ) : null}
                          </td>

                          {/* DEPARTMENT / TRACK */}
                          <td>
                            {track === 'investigation' || track === 'forensics' ? (
                              <span
                                className="category-tag"
                                style={{
                                  background: 'rgba(139,32,255,0.18)',
                                  color: '#c44bff',
                                  border: '1px solid rgba(139,32,255,0.35)',
                                  whiteSpace: 'nowrap',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '0.25rem 0.65rem',
                                }}
                              >
                                <span style={{ color: '#c44bff', fontSize: '0.75rem' }}>●</span> Investigation
                              </span>
                            ) : track === 'cyber' ? (
                              <span
                                className="category-tag"
                                style={{
                                  background: 'rgba(0,180,216,0.18)',
                                  color: '#00e5ff',
                                  border: '1px solid rgba(0,180,216,0.35)',
                                  whiteSpace: 'nowrap',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '0.25rem 0.65rem',
                                }}
                              >
                                <span style={{ fontSize: '0.85rem' }}>🛡️</span> Cyber Security
                              </span>
                            ) : (
                              <span
                                className="category-tag"
                                style={{
                                  background: 'rgba(0,230,118,0.18)',
                                  color: '#00e676',
                                  border: '1px solid rgba(0,230,118,0.35)',
                                  whiteSpace: 'nowrap',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '0.25rem 0.65rem',
                                }}
                              >
                                <span>🌐</span> Both Tracks
                              </span>
                            )}
                          </td>

                          {/* CASE ENGAGEMENT DESCRIPTION */}
                          <td style={{ maxWidth: '300px' }}>
                            <p
                              style={{
                                fontSize: '0.82rem',
                                color: 'var(--text-secondary)',
                                lineHeight: '1.5',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                margin: 0,
                              }}
                              title={c.desc || ''}
                            >
                              {c.desc || '—'}
                            </p>
                          </td>

                          {/* ORDER */}
                          <td style={{ textAlign: 'center' }}>
                            <span
                              style={{
                                fontWeight: 700,
                                color: 'var(--text-muted)',
                                fontSize: '0.85rem',
                              }}
                            >
                              #{c.order ?? 1}
                            </span>
                          </td>

                          {/* STATUS (clickable toggle pill) */}
                          <td>
                            <button
                              type="button"
                              className={`status-pill ${isActive ? 'active' : 'inactive'}`}
                              style={{
                                cursor: 'pointer',
                                background: isActive ? 'rgba(0,230,118,0.12)' : 'rgba(255,171,0,0.15)',
                                color: isActive ? '#00e676' : '#ffab00',
                                border: isActive ? '1px solid rgba(0,230,118,0.35)' : '1px solid rgba(255,171,0,0.35)',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                padding: '0.22rem 0.75rem',
                                letterSpacing: '0.04em',
                              }}
                              title={isActive ? 'Click to hide this client from the website' : 'Click to show this client on the website'}
                              onClick={() => handleToggle(c)}
                            >
                              {isActive ? '● ACTIVE' : '○ HIDDEN'}
                            </button>
                          </td>

                          {/* ACTIONS */}
                          <td style={{ textAlign: 'right' }}>
                            <div className="action-btns-group" style={{ justifyContent: 'flex-end', gap: '0.4rem' }}>
                              <button
                                type="button"
                                className={`btn-action ${isActive ? 'hide' : 'show'}`}
                                title={isActive ? 'Hide this client from website' : 'Make this client visible on website'}
                                onClick={() => handleToggle(c)}
                              >
                                {isActive ? 'Hide' : 'Show'}
                              </button>
                              <button
                                type="button"
                                className="btn-action edit"
                                onClick={() => openEdit(c)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn-action delete"
                                onClick={() => setDeleteTarget(c)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="admin-modal-backdrop show"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeleteTarget(null);
          }}
        >
          <div className="admin-modal-dialog">
            <div className="admin-modal-content">
              <div className="admin-modal-header">
                <h3>Delete Client Organization</h3>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setDeleteTarget(null)}
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>
              <div className="admin-modal-body">
                <p style={{ margin: 0, lineHeight: 1.6 }}>
                  Are you sure you want to delete{' '}
                  <strong style={{ color: '#fff' }}>{deleteTarget.name || 'this client'}</strong>?
                  This removes the client organization and logos from the website.
                </p>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={confirmDelete}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
