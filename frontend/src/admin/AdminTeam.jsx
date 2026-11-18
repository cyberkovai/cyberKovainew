import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import {
  adminGetTeam,
  adminSaveTeam,
  adminDeleteTeam,
  adminUploadFile,
  getSettings,
  updateSettings,
} from '../api/client';

const normalizeImg = (path, fallback = '/assets/images/arun_s.png') => {
  if (!path) return fallback;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) return path;
  return `/${path}`;
};

const formatExperience = (exp) => {
  if (!exp) return '12+ YEARS';
  const val = String(exp).trim();
  if (/years?$/i.test(val)) return val.toUpperCase();
  return `${val.toUpperCase()} YEARS`;
};

const emptyDomains = () => ([
  { icon: '🛡️', title: '', desc: '' },
  { icon: '🛡️', title: '', desc: '' },
  { icon: '🛡️', title: '', desc: '' },
  { icon: '🛡️', title: '', desc: '' },
]);

const splitList = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
};

export default function AdminTeam() {
  const [searchParams] = useSearchParams();
  const [team, setTeam] = useState([]);
  const [view, setView] = useState('list'); // 'list' | 'add' | 'edit'
  const [editingId, setEditingId] = useState(null);
  const [showTeamMaster, setShowTeamMaster] = useState(true);
  const [masterUpdating, setMasterUpdating] = useState(false);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    role: '',
    company: '',
    photo: 'assets/images/arun_s.png',
    experience: '12+',
    badge: 'Verified Security Leader',
    bio: '',
    specializationsText: '',
    order: 1,
    status: 'active',
    domains: emptyDomains(),
  });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const loadData = async () => {
    try {
      const [teamData, settingsData] = await Promise.all([
        adminGetTeam().catch(() => []),
        getSettings().catch(() => ({})),
      ]);
      if (Array.isArray(teamData)) {
        setTeam(teamData);
      }
      if (settingsData && settingsData.show_team !== undefined) {
        setShowTeamMaster(Boolean(settingsData.show_team));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'add') {
      openAdd();
    }
  }, [searchParams]);

  const handleToggleMasterVisibility = async () => {
    setMasterUpdating(true);
    const newVal = !showTeamMaster;
    try {
      await updateSettings({ show_team: newVal });
      setShowTeamMaster(newVal);
      showToast(
        'success',
        newVal
          ? 'Our Team section is now VISIBLE on the website and Supabase settings updated.'
          : 'Our Team section is now HIDDEN from the website and Supabase settings updated.'
      );
    } catch (err) {
      showToast('error', 'Failed to update visibility: ' + err.message);
    } finally {
      setMasterUpdating(false);
    }
  };

  const openAdd = () => {
    const nextId = `team-${Date.now()}`;
    setEditingId(null);
    setFormData({
      id: nextId,
      name: '',
      role: 'Principal Security Architect',
      company: 'Cyber Kovai',
      photo: 'assets/images/arun_s.png',
      experience: '12+',
      badge: 'Verified Security Leader',
      bio: '',
      specializationsText: 'Product Security Expert, Security Architect, Cyber Strategist, Cyber Crime Investigator',
      order: team.length + 1,
      status: 'active',
      domains: [
        { icon: '🛡️', title: 'Application & Product Security', desc: 'VAPT, Threat Modeling, DevSecOps' },
        { icon: '☁️', title: 'Cloud Security & Architecture', desc: 'Zero Trust, Hybrid Cloud Resiliency' },
        { icon: '🔍', title: 'Cyber Crime & Forensics', desc: 'Digital Evidence, Threat Intelligence' },
        { icon: '🏛️', title: 'National Security & Strategy', desc: 'Defense-Grade Risk Frameworks' },
      ],
    });
    setView('add');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openEdit = (member) => {
    const memberDomains = Array.isArray(member.domains) ? member.domains : [];
    const domains = emptyDomains().map((empty, index) => ({
      ...empty,
      ...(memberDomains[index] || {}),
    }));

    setEditingId(member.id);
    setFormData({
      id: member.id,
      name: member.name || '',
      role: member.role || '',
      company: member.company || '',
      photo: member.photo || member.image || 'assets/images/arun_s.png',
      experience: member.experience || '',
      badge: member.badge || '',
      bio: member.bio || '',
      specializationsText: splitList(member.specializations).join(', '),
      order: member.order || member.sort_order || 1,
      status: member.status || (member.active === false ? 'inactive' : 'active'),
      domains,
    });
    setView('edit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToList = () => {
    setView('list');
    setEditingId(null);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('prefix', 'team');
    try {
      const res = await adminUploadFile(fd);
      if (res && res.url) {
        setFormData(prev => ({ ...prev, photo: res.url }));
        showToast('success', 'Portrait photo uploaded successfully.');
      }
    } catch (err) {
      showToast('error', 'Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const updateDomain = (index, field, value) => {
    setFormData((prev) => {
      const domains = prev.domains.map((domain, i) => (
        i === index ? { ...domain, [field]: value } : domain
      ));
      return { ...prev, domains };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.role.trim()) {
      showToast('error', 'Full Name and Professional Role are required.');
      return;
    }

    setSaving(true);
    const specializations = splitList(formData.specializationsText);
    const domains = formData.domains
      .map((domain) => ({
        icon: (domain.icon || '🛡️').trim(),
        title: (domain.title || '').trim(),
        desc: (domain.desc || '').trim(),
      }))
      .filter((domain) => domain.title !== '');

    const payload = {
      ...formData,
      order: Number(formData.order) || 1,
      specializations,
      domains,
      active: formData.status === 'active',
    };
    delete payload.specializationsText;

    try {
      await adminSaveTeam(payload, editingId);
      showToast('success', `Team profile for "${formData.name}" successfully saved to database!`);
      setView('list');
      setEditingId(null);
      await loadData();
    } catch (err) {
      showToast('error', 'Error saving team member: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This will also remove their specializations and domain capabilities from the database.`)) {
      try {
        await adminDeleteTeam(id);
        showToast('success', `Team member "${name}" was successfully removed from database.`);
        await loadData();
      } catch (err) {
        showToast('error', 'Error deleting team member: ' + err.message);
      }
    }
  };

  return (
    <AdminLayout pageTitle="Our Team & Leadership" currentCount={team.length}>
      {/* Toast Notification */}
      {toast && (
        <div
          className={`flash-alert ${toast.type}`}
          style={{
            marginBottom: '1.25rem',
            animation: 'fadeIn 0.25s ease',
          }}
        >
          <span>
            <strong>{toast.type === 'success' ? '✓ Success:' : '⚠ Notice:'}</strong> {toast.message}
          </span>
          <button
            type="button"
            className="flash-close-btn"
            onClick={() => setToast(null)}
          >
            &times;
          </button>
        </div>
      )}

      {/* ================= PAGE HEADER ================= */}
      <div className="page-header-row">
        <div>
          <h1 className="page-header-title">Our Team &amp; Security Architects</h1>
          <p className="page-header-desc">
            Manage leadership profiles, verified security leader badges, expertise domains, and biographies.
          </p>
        </div>
        <div>
          {view === 'list' ? (
            <button type="button" className="btn btn-primary" onClick={openAdd}>
              <span>+</span> Add Team Member
            </button>
          ) : (
            <button type="button" className="btn btn-secondary" onClick={handleBackToList}>
              &larr; Back to Team List
            </button>
          )}
        </div>
      </div>

      {/* ================= TEAM VISIBILITY MASTER SWITCH BANNER ================= */}
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
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              background: 'rgba(158, 62, 255, 0.15)',
              border: '1px solid rgba(158, 62, 255, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#c084fc"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
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
              <span>Website Team Visibility:</span>
              {showTeamMaster ? (
                <span
                  className="status-pill active"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontWeight: 700,
                  }}
                >
                  <span style={{ fontSize: '0.75rem' }}>●</span> PUBLICLY VISIBLE
                </span>
              ) : (
                <span
                  className="status-pill inactive"
                  style={{
                    background: 'rgba(255, 171, 0, 0.15)',
                    color: '#ffab00',
                    borderColor: 'rgba(255, 171, 0, 0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontWeight: 700,
                  }}
                >
                  <span style={{ fontSize: '0.75rem' }}>○</span> HIDDEN FROM WEBSITE
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {showTeamMaster
                ? '"Our Team" link is active in the header menu & footer, and /team.php is accessible.'
                : '"Our Team" link is hidden from all menus, and /team.php safely redirects to the About page.'}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleMasterVisibility}
          disabled={masterUpdating}
          className={`btn btn-sm ${showTeamMaster ? 'btn-secondary' : 'btn-primary'}`}
          style={
            showTeamMaster
              ? { borderColor: 'rgba(255, 171, 0, 0.4)', color: '#ffab00' }
              : {}
          }
        >
          {showTeamMaster ? 'Hide Team from Website' : 'Make Team Visible on Website'}
        </button>
      </div>

      {/* ================= CONDITIONAL: ADD / EDIT VIEW OR LIST VIEW ================= */}
      {view === 'add' || view === 'edit' ? (
        <div className="admin-card" style={{ marginBottom: '2rem' }}>
          <div
            className="admin-card-header"
            style={{
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              paddingBottom: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            <h3 className="admin-card-title" style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              {view === 'edit' ? `Edit Team Member Profile: ${formData.name || ''}` : 'Add New Team Member'}
            </h3>
          </div>

          <form onSubmit={handleSubmit}>
            {/* ROW 1: 3 Columns (Name, Role, Company Tag) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1.25rem',
                marginBottom: '1.25rem',
              }}
            >
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Full Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. Arun S"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Professional Role / Title <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. Principal Security Architect"
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Company / Affiliation Tag
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="IBM India"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                />
                <span
                  className="form-help"
                  style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}
                >
                  Appears as highlighted badge next to the role
                </span>
              </div>
            </div>

            {/* ROW 2: 3 Columns (Experience Badge, Verification Label, Display Order) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1.25rem',
                marginBottom: '1.25rem',
              }}
            >
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Years of Experience Badge
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="12+"
                  value={formData.experience}
                  onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                />
                <span
                  className="form-help"
                  style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}
                >
                  Badge shown over the photo (e.g. 12+)
                </span>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Verification Badge Label
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Verified Security Leader"
                  value={formData.badge}
                  onChange={(e) => setFormData(prev => ({ ...prev, badge: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Display Order
                </label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  placeholder="2"
                  value={formData.order}
                  onChange={(e) => setFormData(prev => ({ ...prev, order: e.target.value }))}
                />
              </div>
            </div>

            {/* ROW 3: Full Width (Publication Status) */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ fontWeight: 600 }}>
                Publication Status
              </label>
              <select
                className="form-control"
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="active">Active (Visible on Website)</option>
                <option value="inactive">Hidden (Hide from Website)</option>
              </select>
              <span
                className="form-help"
                style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}
              >
                Choose whether this team member profile should appear on the public website.
              </span>
            </div>

            {/* ROW 4: Leader Portrait Photo (File Picker + Circular Preview & URL) */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ fontWeight: 600 }}>
                Leader Portrait Photo
              </label>

              {/* Styled File Input Button Bar */}
              <div
                style={{
                  background: 'rgba(5, 5, 20, 0.45)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.65rem 0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '0.75rem',
                }}
              >
                <label
                  className="btn btn-secondary btn-sm"
                  style={{
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                    margin: 0,
                    padding: '0.4rem 0.85rem',
                  }}
                >
                  {uploading ? 'Uploading...' : 'Choose File'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    style={{ display: 'none' }}
                  />
                </label>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {uploading ? 'Uploading image to storage...' : 'No file chosen (or select new photo)'}
                </span>
              </div>

              {/* Image Preview Thumbnail + Path Input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <img
                  src={normalizeImg(formData.photo)}
                  alt={formData.name || 'Leader Portrait'}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    objectFit: 'cover',
                    border: '1px solid rgba(158, 62, 255, 0.4)',
                    background: 'rgba(15, 15, 35, 0.8)',
                    flexShrink: 0,
                  }}
                  onError={(e) => {
                    e.currentTarget.src = '/assets/images/arun_s.png';
                  }}
                />
                <input
                  type="text"
                  className="form-control"
                  placeholder="assets/images/arun_s.png"
                  value={formData.photo}
                  onChange={(e) => setFormData(prev => ({ ...prev, photo: e.target.value }))}
                />
              </div>
              <span
                className="form-help"
                style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}
              >
                Upload high-res portrait (PNG/JPG/WebP) or specify relative asset path.
              </span>
            </div>

            {/* ROW 5: Specialization Tag Pills */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ fontWeight: 600 }}>
                Specialization Tag Pills (Comma-separated)
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Product Security Expert, Security Architect, Cyber Strategist, Cyber Crime Investigator"
                value={formData.specializationsText}
                onChange={(e) => setFormData(prev => ({ ...prev, specializationsText: e.target.value }))}
              />
              <span
                className="form-help"
                style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}
              >
                Separate tags by commas. Rendered as purple badges on the team card.
              </span>
            </div>

            {/* ROW 6: Executive Biography / Statement */}
            <div className="form-group" style={{ marginBottom: '1.75rem' }}>
              <label className="form-label" style={{ fontWeight: 600 }}>
                Executive Biography / Statement
              </label>
              <textarea
                className="form-control"
                rows={4}
                placeholder="Principal Security Architect with 12+ years across cybersecurity leadership..."
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              ></textarea>
            </div>

            {/* ROW 7: Domain Capabilities (Up to 4 Core Practice Areas) */}
            <div
              style={{
                paddingTop: '1.5rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                marginBottom: '1.5rem',
              }}
            >
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#c084fc', marginBottom: '0.25rem' }}>
                Domain Capabilities (Up to 4 Core Practice Areas)
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Showcased in the 2x2 capability grid at the bottom of the leader profile.
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '1rem',
                }}
              >
                {formData.domains.map((domain, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '1rem',
                      background: 'rgba(5, 5, 20, 0.55)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        marginBottom: '0.65rem',
                        letterSpacing: '0.02em',
                      }}
                    >
                      Domain #{index + 1}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.65rem' }}>
                      <input
                        type="text"
                        className="form-control"
                        style={{ width: '56px', textAlign: 'center', fontSize: '1.1rem', flexShrink: 0 }}
                        placeholder="🛡️"
                        value={domain.icon}
                        onChange={(e) => updateDomain(index, 'icon', e.target.value)}
                        title="Domain Icon (Emoji or Character)"
                      />
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Domain Title"
                        value={domain.title}
                        onChange={(e) => updateDomain(index, 'title', e.target.value)}
                      />
                    </div>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Sub-capabilities (e.g. VAPT, Threat Modeling)"
                      value={domain.desc}
                      onChange={(e) => updateDomain(index, 'desc', e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* ROW 8: Action Buttons */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '0.85rem',
                marginTop: '2rem',
                paddingTop: '1.25rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <button type="button" className="btn btn-secondary" onClick={handleBackToList}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <span>💾</span> {saving ? 'Saving...' : 'Save Team Member Profile'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* ================= ALL TEAM MEMBERS TABLE CARD ================= */
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Leadership &amp; Security Architects ({team.length})</h3>
            <a
              href="/team"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ textDecoration: 'none' }}
            >
              Preview Public Team Page &rarr;
            </a>
          </div>
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '65px' }}>PHOTO</th>
                  <th>LEADER NAME</th>
                  <th>ROLE &amp; AFFILIATION</th>
                  <th>EXPERIENCE</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {team.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      No team profiles found. Click "+ Add Team Member" above to create a leadership profile.
                    </td>
                  </tr>
                ) : (
                  team.map((member) => {
                    const isActive = member.status ? member.status === 'active' : member.active !== false;
                    return (
                      <tr key={member.id}>
                        <td>
                          <img
                            src={normalizeImg(member.photo)}
                            alt={member.name}
                            className="table-thumbnail"
                            onError={(e) => {
                              e.currentTarget.src = '/assets/images/arun_s.png';
                            }}
                          />
                        </td>
                        <td>
                          <span className="cell-title">{member.name}</span>
                          <span
                            className="cell-subtitle"
                            style={{
                              color: 'var(--accent-purple-light)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              marginTop: '0.2rem',
                            }}
                          >
                            ● {member.badge || 'Verified Security Leader'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.45rem' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{member.role}</span>
                            {member.company && (
                              <span className="category-tag">
                                {member.company}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="status-pill active" style={{ fontWeight: 700 }}>
                            {formatExperience(member.experience)}
                          </span>
                        </td>
                        <td>
                          <span className={`status-pill ${isActive ? 'active' : 'inactive'}`} style={{ fontWeight: 700 }}>
                            {isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="action-btns-group" style={{ justifyContent: 'flex-end' }}>
                            <a
                              href="/team"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-action view"
                              title="View live on website"
                            >
                              View
                            </a>
                            <button
                              type="button"
                              className="btn-action edit"
                              onClick={() => openEdit(member)}
                              title="Edit profile"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn-action delete"
                              onClick={() => handleDelete(member.id, member.name)}
                              title="Delete profile"
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
      )}
    </AdminLayout>
  );
}
