import React, { useMemo, useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import {
  adminGetAccreditations,
  adminSaveAccreditation,
  adminDeleteAccreditation,
  adminToggleAccreditation,
  adminUploadFile,
} from '../api/client';
import { getAssetUrl } from '../utils/assets';

const normalizeImg = (path, fallback = 'assets/images/aid.png') => {
  return getAssetUrl(path || fallback);
};

const isActiveStatus = (item) => (item?.status ? item.status === 'active' : item?.active !== false);

const trackOf = (item) => item?.track || 'both';

const matchesFilter = (item, filter) => {
  const track = trackOf(item);
  if (filter === 'investigation') {
    return track === 'investigation' || track === 'forensics' || track === 'both' || track === 'all';
  }
  if (filter === 'cyber') {
    return track === 'cyber' || track === 'both' || track === 'all';
  }
  return true;
};

const emptyForm = (order = 1, track = 'both') => ({
  id: '',
  name: '',
  short_name: '',
  img: 'assets/images/aid.png',
  alt: '',
  website: '',
  track: track === 'all' ? 'both' : track,
  order,
  status: 'active',
  icon: '🛡️',
  code: '',
  title: '',
});

function websiteLabel(url) {
  if (!url) return '';
  try {
    return new URL(url).host || url;
  } catch {
    return url;
  }
}

export default function AdminAccreditations() {
  const [accreds, setAccreds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState('list');
  const [editingId, setEditingId] = useState(null);
  const [currentTrack, setCurrentTrack] = useState('all');
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
      const data = await adminGetAccreditations();
      setAccreds(Array.isArray(data) ? data : []);
    } catch {
      setAccreds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const investigationCount = useMemo(
    () => accreds.filter((item) => matchesFilter(item, 'investigation')).length,
    [accreds]
  );
  const cyberCount = useMemo(
    () => accreds.filter((item) => matchesFilter(item, 'cyber')).length,
    [accreds]
  );
  const displayAccreds = useMemo(
    () => accreds.filter((item) => matchesFilter(item, currentTrack)),
    [accreds, currentTrack]
  );

  const openAdd = () => {
    setEditingId(null);
    setFormData(emptyForm(accreds.length + 1, currentTrack));
    setMode('add');
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      ...item,
      name: item.name || item.title || '',
      short_name: item.short_name || item.code || '',
      title: item.title || item.name || '',
      code: item.code || item.short_name || '',
      img: item.img || 'assets/images/aid.png',
      alt: item.alt || '',
      website: item.website || '',
      track: ['investigation', 'cyber', 'both'].includes(item.track) ? item.track : 'both',
      order: item.order ?? 1,
      status: isActiveStatus(item) ? 'active' : 'inactive',
      icon: item.icon || '🛡️',
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
    fd.append('prefix', 'accred');
    try {
      const res = await adminUploadFile(fd);
      if (res?.url) {
        setFormData((prev) => ({ ...prev, img: res.url }));
        showToast('success', 'Badge logo uploaded. Save the accreditation to keep it.');
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
    const shortName = formData.short_name.trim();
    if (!name && !shortName) {
      showToast('error', 'Please provide an Organization / Association name or short acronym.');
      return;
    }
    if (!name || !shortName) {
      showToast('error', 'Full association name and short acronym are both required.');
      return;
    }

    const track = ['investigation', 'cyber', 'both'].includes(formData.track) ? formData.track : 'both';
    const payload = {
      ...formData,
      name,
      short_name: shortName,
      title: formData.title?.trim() || name,
      code: formData.code?.trim() || shortName,
      alt: formData.alt.trim() || `${shortName} - ${name}`,
      website: formData.website.trim(),
      img: formData.img.trim() || 'assets/images/aid.png',
      track,
      order: Number(formData.order) || 1,
      status: formData.status === 'inactive' ? 'inactive' : 'active',
      active: formData.status !== 'inactive',
    };

    setSaving(true);
    try {
      await adminSaveAccreditation(payload, editingId);
      const trackLabel = track === 'investigation' ? 'Investigation' : track === 'cyber' ? 'Cyber Security' : 'Both Tracks';
      showToast('success', `Accreditation '${shortName || name}' successfully saved for ${trackLabel}!`);
      setMode('list');
      setEditingId(null);
      if (track !== 'both') setCurrentTrack(track);
      await loadData();
    } catch (err) {
      showToast('error', `Failed to save accreditation: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (item) => {
    const label = item.short_name || item.name || item.title || 'Accreditation';
    try {
      const res = await adminToggleAccreditation(item.id);
      const updated = res?.data;
      const nextActive = updated ? isActiveStatus(updated) : !isActiveStatus(item);
      setAccreds((prev) =>
        prev.map((row) =>
          String(row.id) === String(item.id)
            ? { ...row, ...(updated || {}), status: nextActive ? 'active' : 'inactive', active: nextActive }
            : row
        )
      );
      showToast(
        'success',
        nextActive
          ? `Accreditation '${label}' is now ACTIVE and visible on the website.`
          : `Accreditation '${label}' is now HIDDEN from the website.`
      );
    } catch (err) {
      showToast('error', `Could not toggle accreditation status: ${err.message}`);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const label = deleteTarget.short_name || deleteTarget.name || deleteTarget.title || 'Accreditation';
    try {
      await adminDeleteAccreditation(deleteTarget.id);
      setAccreds((prev) => prev.filter((row) => String(row.id) !== String(deleteTarget.id)));
      showToast('success', `Accreditation '${label}' was successfully deleted.`);
      setDeleteTarget(null);
    } catch (err) {
      showToast('error', `Could not delete accreditation '${label}': ${err.message}`);
    }
  };

  const listTitle =
    currentTrack === 'investigation'
      ? `Digital Investigation Credentials (${displayAccreds.length})`
      : currentTrack === 'cyber'
        ? `Cyber Security Credentials (${displayAccreds.length})`
        : `All Memberships, Associations & Accreditations (${displayAccreds.length})`;

  return (
    <AdminLayout pageTitle="Accreditations & Credentials" currentCount={accreds.length}>
      {toast && (
        <div className={`flash-alert ${toast.type === 'error' ? 'error' : toast.type === 'warning' ? 'warning' : 'success'}`} style={{ marginBottom: '1.25rem' }}>
          <span>
            <strong>{toast.type === 'success' ? '✓ Success:' : '⚠ Notice:'}</strong> {toast.message}
          </span>
          <button type="button" className="flash-close-btn" onClick={() => setToast(null)}>&times;</button>
        </div>
      )}

      {/* Title + Description — full width, no competition with buttons */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 className="page-header-title">Memberships, Associations &amp; Accreditations</h1>
        <p className="page-header-desc">
          Manage verified professional credentials, investigative council memberships, and certification logos displayed on the website.
        </p>
      </div>

      {/* Action Buttons Row — separate row below title */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
        {mode === 'list' ? (
          <>
            <button type="button" className="btn btn-primary" onClick={openAdd}>
              <span>+</span> Add New Accreditation
            </button>
            <a href={`${import.meta.env.BASE_URL}cyber-intelligence#credentials`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" title="Preview on Digital Investigation page">
              Preview Investigation ➔
            </a>
            <a href={`${import.meta.env.BASE_URL}digital-forensics#credentials`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" title="Preview on Cyber Security page">
              Preview Cyber ➔
            </a>
          </>
        ) : (
          <button type="button" className="btn btn-secondary" onClick={backToList}>
            &larr; Back to Accreditations List
          </button>
        )}
      </div>

      {mode === 'add' || mode === 'edit' ? (
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">
              {mode === 'edit'
                ? `Edit Accreditation: ${formData.short_name || formData.name}`
                : 'Add New Accreditation / Membership'}
            </h3>
            <span className="category-tag" style={{ background: 'rgba(139, 32, 255, 0.15)', color: 'var(--accent-purple-light)' }}>
              {mode === 'edit' ? `Badge ID: ${editingId}` : 'New Credential'}
            </span>
          </div>
          <div className="admin-card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="name" className="form-label">Full Association / Organization Name <span className="required">*</span></label>
                  <input
                    type="text"
                    id="name"
                    className="form-control"
                    required
                    placeholder="e.g. Association of Investigators and Detectives"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value, title: prev.title && prev.title !== prev.name ? prev.title : e.target.value }))}
                  />
                  <span className="form-help">Official statutory body or professional association name.</span>
                </div>

                <div className="form-group">
                  <label htmlFor="short_name" className="form-label">Short Acronym / Code <span className="required">*</span></label>
                  <input
                    type="text"
                    id="short_name"
                    className="form-control"
                    required
                    placeholder="e.g. AID, TAPDI, APDI, UNIP"
                    value={formData.short_name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, short_name: e.target.value, code: prev.code && prev.code !== prev.short_name ? prev.code : e.target.value }))}
                  />
                  <span className="form-help">Short label used for tags and badge references.</span>
                </div>

                <div className="form-group">
                  <label htmlFor="track" className="form-label">Display Track / Scope <span className="required">*</span></label>
                  <select
                    id="track"
                    className="form-control"
                    style={{ fontWeight: 600 }}
                    required
                    value={formData.track}
                    onChange={(e) => setFormData((prev) => ({ ...prev, track: e.target.value }))}
                  >
                    <option value="both">🌐 Both Tracks (Displays on both Investigation & Cyber pages)</option>
                    <option value="investigation">🔍 Digital Investigation & Forensics</option>
                    <option value="cyber">🛡️ Cyber Security & Defense</option>
                  </select>
                  <span className="form-help">Choose which page(s) on the website will showcase this credential.</span>
                </div>

                <div className="form-group">
                  <label htmlFor="order" className="form-label">Display Order Sequence</label>
                  <input
                    type="number"
                    id="order"
                    className="form-control"
                    min="1"
                    value={formData.order}
                    onChange={(e) => setFormData((prev) => ({ ...prev, order: e.target.value }))}
                  />
                  <span className="form-help">Display sequence position (1 = first badge on the left).</span>
                </div>

                <div className="form-group">
                  <label htmlFor="status" className="form-label">Publication Status</label>
                  <select
                    id="status"
                    className="form-control"
                    style={{ fontWeight: 600 }}
                    value={formData.status}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="active">Active (Visible on Website)</option>
                    <option value="inactive">Hidden (Hide from Website)</option>
                  </select>
                  <span className="form-help">Instantly show or hide this badge from the live site.</span>
                </div>

                <div className="form-group">
                  <label htmlFor="website" className="form-label">Association Website URL (Optional)</label>
                  <input
                    type="url"
                    id="website"
                    className="form-control"
                    placeholder="https://association.org"
                    value={formData.website}
                    onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                  />
                  <span className="form-help">Optional link opening the official organization website when clicked.</span>
                </div>

                <div className="form-group col-full">
                  <label htmlFor="logo_file" className="form-label">Accreditation Badge / Logo Image <span className="required">*</span></label>
                  <div className="input-with-preview" style={{ alignItems: 'flex-start' }}>
                    <div style={{ background: '#ffffff', padding: '12px 22px', borderRadius: '18px', border: '1px solid rgba(139, 32, 255, 0.3)', width: '190px', height: '74px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 8px 24px rgba(0,0,0,0.35)' }}>
                      {formData.img ? (
                        <img
                          src={normalizeImg(formData.img)}
                          alt=""
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = getAssetUrl('assets/images/aid.png');
                          }}
                          style={{ maxHeight: '48px', maxWidth: '155px', objectFit: 'contain' }}
                        />
                      ) : (
                        <span style={{ fontSize: '1.6rem' }}>{formData.icon || '🛡️'}</span>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <input
                        type="file"
                        id="logo_file"
                        className="form-control"
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        style={{ marginBottom: '0.6rem' }}
                      />
                      <input
                        type="text"
                        id="img"
                        className="form-control"
                        placeholder="assets/images/aid.png"
                        value={formData.img}
                        onChange={(e) => setFormData((prev) => ({ ...prev, img: e.target.value }))}
                      />
                      <span className="form-help">
                        {uploading
                          ? 'Uploading logo…'
                          : 'Upload PNG, SVG, WebP, or JPG logo. The badge card provides a crisp white background with rounded corners matching the live website.'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="form-group col-full">
                  <label htmlFor="alt" className="form-label">Image Alt Text (Accessibility &amp; SEO)</label>
                  <input
                    type="text"
                    id="alt"
                    className="form-control"
                    placeholder="e.g. AID - Association of Investigators and Detectives"
                    value={formData.alt}
                    onChange={(e) => setFormData((prev) => ({ ...prev, alt: e.target.value }))}
                  />
                  <span className="form-help">Descriptive text for accessibility compliance and SEO crawlers.</span>
                </div>
              </div>

              <div style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={backToList} disabled={saving}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
                  <span>💾</span> {saving ? 'Saving...' : 'Save Accreditation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn btn-sm ${currentTrack === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              style={currentTrack === 'all' ? { background: '#8b20ff', borderColor: '#8b20ff' } : undefined}
              onClick={() => setCurrentTrack('all')}
            >
              All Credentials ({accreds.length})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${currentTrack === 'investigation' ? 'btn-primary' : 'btn-secondary'}`}
              style={currentTrack === 'investigation' ? { background: '#8b20ff', borderColor: '#8b20ff' } : undefined}
              onClick={() => setCurrentTrack('investigation')}
            >
              <span style={{ color: currentTrack === 'investigation' ? '#ffffff' : '#8b20ff', marginRight: '6px', fontSize: '0.9rem', lineHeight: 1 }}>●</span>
              Investigation Track ({investigationCount})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${currentTrack === 'cyber' ? 'btn-primary' : 'btn-secondary'}`}
              style={currentTrack === 'cyber' ? { background: '#00b4d8', borderColor: '#00b4d8' } : undefined}
              onClick={() => setCurrentTrack('cyber')}
            >
              <span style={{ marginRight: '6px' }}>🛡️</span>
              Cyber Track ({cyberCount})
            </button>
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-card-title">
                {currentTrack === 'investigation' ? '🔍 ' : currentTrack === 'cyber' ? '🛡️ ' : ''}
                {listTitle}
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-primary btn-sm" onClick={openAdd}>
                  + Add Accreditation
                </button>
              </div>
            </div>
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '140px' }}>BADGE PREVIEW</th>
                    <th>ACRONYM &amp; NAME</th>
                    <th>DISPLAY TRACK</th>
                    <th>WEBSITE</th>
                    <th style={{ width: '60px' }}>ORDER</th>
                    <th>STATUS</th>
                    <th style={{ textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                        Loading accreditations…
                      </td>
                    </tr>
                  ) : displayAccreds.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                        No accreditations found for this track. Click &quot;Add New Accreditation&quot; above to create your first badge.
                      </td>
                    </tr>
                  ) : (
                    displayAccreds.map((item) => {
                      const active = isActiveStatus(item);
                      const track = trackOf(item);
                      const acronym = item.short_name || item.code || 'BADGE';
                      const fullName = item.name || item.title || '';
                      return (
                        <tr key={item.id}>
                          <td>
                            <div style={{ background: '#ffffff', padding: '6px 12px', borderRadius: '12px', border: '1px solid var(--border-color)', width: '120px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.25)' }}>
                              {item.img ? (
                                <img
                                  src={normalizeImg(item.img)}
                                  alt={item.alt || item.short_name || item.name}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = getAssetUrl('assets/images/aid.png');
                                  }}
                                  style={{ maxHeight: '38px', maxWidth: '100px', objectFit: 'contain' }}
                                />
                              ) : (
                                <span style={{ fontSize: '1.4rem' }}>{item.icon || '🛡️'}</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2px' }}>
                              <span className="category-tag" style={{ background: 'rgba(139, 32, 255, 0.22)', color: '#c44bff', fontWeight: 700 }}>
                                {acronym}
                              </span>
                            </div>
                            <span className="cell-title" style={{ fontSize: '0.88rem' }}>{fullName}</span>
                          </td>
                          <td>
                            {track === 'investigation' || track === 'forensics' ? (
                              <span className="category-tag" style={{ background: 'rgba(139, 32, 255, 0.18)', color: '#c44bff', border: '1px solid rgba(139, 32, 255, 0.35)' }}>
                                🔍 Investigation
                              </span>
                            ) : track === 'cyber' ? (
                              <span className="category-tag" style={{ background: 'rgba(0, 180, 216, 0.18)', color: '#00e5ff', border: '1px solid rgba(0, 180, 216, 0.35)' }}>
                                🛡️ Cyber Security
                              </span>
                            ) : (
                              <span className="category-tag" style={{ background: 'rgba(0, 230, 118, 0.18)', color: '#00e676', border: '1px solid rgba(0, 230, 118, 0.35)' }}>
                                🌐 Both Tracks
                              </span>
                            )}
                          </td>
                          <td>
                            {item.website ? (
                              <a href={item.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.78rem', color: 'var(--accent-purple-light)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <span>🔗</span> {websiteLabel(item.website)} ↗
                              </a>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>
                            )}
                          </td>
                          <td>
                            <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                              #{item.order ?? 1}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className={`status-pill ${active ? 'active' : 'inactive'}`}
                              style={{
                                cursor: 'pointer',
                                border: active ? '1px solid rgba(0, 230, 118, 0.3)' : '1px solid rgba(255,171,0,0.3)',
                                ...(active ? {} : { background: 'rgba(255,171,0,0.15)', color: '#ffab00' }),
                              }}
                              title={active ? 'Click to hide from website' : 'Click to show on website'}
                              onClick={() => handleToggle(item)}
                            >
                              {active ? '● ACTIVE' : '○ HIDDEN'}
                            </button>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="action-btns-group" style={{ justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                className={`btn-action ${active ? 'hide' : 'show'}`}
                                title={active ? 'Hide this badge from website' : 'Make this badge visible on website'}
                                onClick={() => handleToggle(item)}
                              >
                                {active ? 'Hide' : 'Show'}
                              </button>
                              <button type="button" className="btn-action edit" onClick={() => openEdit(item)}>Edit</button>
                              <button
                                type="button"
                                className="btn-action delete"
                                onClick={() => setDeleteTarget(item)}
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

      {deleteTarget && (
        <div className="admin-modal-backdrop show">
          <div className="admin-modal-dialog">
            <div className="admin-modal-content">
              <div className="admin-modal-header">
                <h3>Delete Accreditation</h3>
                <button type="button" className="modal-close-btn" onClick={() => setDeleteTarget(null)}>&times;</button>
              </div>
              <div className="admin-modal-body">
                <p style={{ margin: 0, lineHeight: 1.6 }}>
                  Are you sure you want to delete{' '}
                  <strong style={{ color: '#fff' }}>{deleteTarget.short_name || deleteTarget.name || 'this accreditation'}</strong>?
                  This removes the badge from the website.
                </p>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button type="button" className="btn btn-danger" onClick={confirmDelete}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
