import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { adminGetFaqs, adminSaveFaq, adminDeleteFaq, adminToggleFaq } from '../api/client';

export default function AdminFaqs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState(null);

  // Filters state
  const [currentTrack, setCurrentTrack] = useState('all'); // 'all' | 'investigation' | 'cyber'
  const [currentStatus, setCurrentStatus] = useState('all'); // 'all' | 'active' | 'inactive'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Modals & view state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Live accordion preview expansion state
  const [previewExpanded, setPreviewExpanded] = useState(true);

  // FAQ Form Data
  const [formData, setFormData] = useState({
    id: '',
    track: 'investigation',
    question: '',
    answer: '',
    category: 'General',
    order: 1,
    status: 'active',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await adminGetFaqs('all');
      setFaqs(Array.isArray(data) ? data : []);
    } catch (err) {
      setFlash({ type: 'error', message: 'Failed to load FAQs: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const action = searchParams.get('action');
    const id = searchParams.get('id');
    if (action === 'add') {
      setEditingId(null);
      const defaultTrack = currentTrack !== 'all' ? currentTrack : 'investigation';
      setFormData({
        id: '',
        track: defaultTrack,
        question: '',
        answer: '',
        category: 'General',
        order: faqs.length + 1,
        status: 'active',
      });
      setPreviewExpanded(true);
      setIsFormOpen(true);
    } else if (action === 'edit' && id && faqs.length > 0) {
      const found = faqs.find(f => String(f.id) === String(id));
      if (found) {
        setEditingId(found.id);
        const isItemActive = (found.status ? found.status === 'active' : found.active !== false);
        setFormData({
          id: found.id,
          track: found.track || 'investigation',
          question: found.question || '',
          answer: found.answer || '',
          category: found.category || 'General',
          order: found.order !== undefined ? found.order : (faqs.length + 1),
          status: isItemActive ? 'active' : 'inactive',
        });
        setPreviewExpanded(true);
        setIsFormOpen(true);
      }
    }
  }, [searchParams, faqs]);

  // Counts across the entire dataset
  const countAll = faqs.length;
  const countInv = faqs.filter(f => (f.track === 'investigation' || f.track === 'both' || f.track === 'all')).length;
  const countCyber = faqs.filter(f => (f.track === 'cyber' || f.track === 'both' || f.track === 'all')).length;

  // Filtered dataset for display
  const displayList = useMemo(() => {
    return faqs.filter((faq) => {
      // 1. Track filter
      if (currentTrack !== 'all') {
        const t = faq.track || 'both';
        if (t !== currentTrack && t !== 'both' && t !== 'all') {
          return false;
        }
      }

      // 2. Status filter
      const isItemActive = (faq.status ? faq.status === 'active' : faq.active !== false);
      if (currentStatus === 'active' && !isItemActive) return false;
      if (currentStatus === 'inactive' && isItemActive) return false;

      // 3. Search query filter
      if (searchQuery.trim() !== '') {
        const needle = searchQuery.toLowerCase().trim();
        const q = (faq.question || '').toLowerCase();
        const a = (faq.answer || '').toLowerCase();
        const c = (faq.category || '').toLowerCase();
        if (!q.includes(needle) && !a.includes(needle) && !c.includes(needle)) {
          return false;
        }
      }

      return true;
    });
  }, [faqs, currentTrack, currentStatus, searchQuery]);

  // Counts for status pills within current track
  const statusCounts = useMemo(() => {
    const trackFaqs = faqs.filter(f => {
      if (currentTrack === 'all') return true;
      const t = f.track || 'both';
      return (t === currentTrack || t === 'both' || t === 'all');
    });
    const active = trackFaqs.filter(f => (f.status ? f.status === 'active' : f.active !== false)).length;
    const hidden = trackFaqs.length - active;
    return { all: trackFaqs.length, active, hidden };
  }, [faqs, currentTrack]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  const openAdd = () => {
    setEditingId(null);
    const defaultTrack = currentTrack !== 'all' ? currentTrack : 'investigation';
    setFormData({
      id: '',
      track: defaultTrack,
      question: '',
      answer: '',
      category: 'General',
      order: faqs.length + 1,
      status: 'active',
    });
    setPreviewExpanded(true);
    setIsFormOpen(true);
    setSearchParams({ action: 'add' });
  };

  const openEdit = (faq) => {
    setEditingId(faq.id);
    const isItemActive = (faq.status ? faq.status === 'active' : faq.active !== false);
    setFormData({
      id: faq.id,
      track: faq.track || 'investigation',
      question: faq.question || '',
      answer: faq.answer || '',
      category: faq.category || 'General',
      order: faq.order !== undefined ? faq.order : (faqs.length + 1),
      status: isItemActive ? 'active' : 'inactive',
    });
    setPreviewExpanded(true);
    setIsFormOpen(true);
    setSearchParams({ action: 'edit', id: faq.id });
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setSearchParams({}, { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.question.trim() || !formData.answer.trim()) {
      setFlash({ type: 'error', message: 'Both Question and Answer fields are required.' });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...formData,
        order: Number(formData.order) || 1,
        active: formData.status === 'active',
      };
      await adminSaveFaq(payload, editingId);
      closeForm();
      setFlash({
        type: 'success',
        message: editingId ? `FAQ "${formData.question}" updated successfully!` : 'New FAQ created successfully!',
      });
      loadData();
    } catch (err) {
      setFlash({ type: 'error', message: 'Failed to save FAQ: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      const updated = await adminToggleFaq(id);
      const isNowActive = updated?.data?.status ? updated.data.status === 'active' : updated?.data?.active !== false;
      setFlash({
        type: 'success',
        message: isNowActive
          ? 'FAQ is now ACTIVE and visible on the website.'
          : 'FAQ is now HIDDEN from the website.',
      });
      loadData();
    } catch (err) {
      setFlash({ type: 'error', message: 'Could not toggle FAQ status: ' + err.message });
    }
  };

  const confirmDelete = (faq) => {
    setItemToDelete(faq);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      setDeleting(true);
      await adminDeleteFaq(itemToDelete.id);
      setDeleteModalOpen(false);
      setFlash({ type: 'success', message: `FAQ "${itemToDelete.question}" was successfully deleted.` });
      setItemToDelete(null);
      loadData();
    } catch (err) {
      setFlash({ type: 'error', message: 'Could not delete FAQ: ' + err.message });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout pageTitle="Frequently Asked Questions (FAQs)" currentCount={faqs.length}>
      {/* Toast Notification */}
      {flash && (
        <div className={`flash-alert ${flash.type}`} style={{ marginBottom: '1.25rem' }}>
          <span>
            <strong>{flash.type === 'success' ? '✓ Success: ' : '⚠ Error: '}</strong>
            {flash.message}
          </span>
          <button type="button" className="flash-close-btn" onClick={() => setFlash(null)}>
            &times;
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header-row" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-header-title">Frequently Asked Questions (FAQs)</h1>
          <p className="page-header-desc">
            Manage client questions and answers separately for Digital Investigation and Cyber Security tracks.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {isFormOpen ? (
            <button type="button" className="btn-faq-back" onClick={closeForm}>
              &larr; Back to FAQs List
            </button>
          ) : (
            <>
              <button type="button" className="btn btn-primary" onClick={openAdd}>
                <span>+</span> Add New FAQ
              </button>
              <a
                href="/cyber-intelligence#ci-faq"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                title="Preview on Digital Investigation page"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                Preview Investigation FAQs ➔
              </a>
              <a
                href="/digital-forensics#faq"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                title="Preview on Cyber Security page"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                Preview Cyber FAQs ➔
              </a>
            </>
          )}
        </div>
      </div>

      {isFormOpen ? (
        /* ================= ADD / EDIT FAQ CARD (EXACT UI) ================= */
        <div className="faq-form-card">
          <div className="faq-form-card-header">
            <h2 className="faq-form-card-title">
              {editingId ? `Edit FAQ: ${formData.question}` : 'Add New Frequently Asked Question'}
            </h2>
            <span className="badge-new-question">
              {editingId ? `ID: ${editingId}` : 'New Question'}
            </span>
          </div>
          <div className="faq-form-card-body">
            <form onSubmit={handleSubmit} id="faqForm">
              {/* Service Track */}
              <div className="form-group col-full" style={{ marginBottom: '1.5rem' }}>
                <label className="faq-label">
                  Service Track <span className="required">*</span>
                </label>
                <div className="faq-track-grid" id="faqTrackGrid">
                  {/* Digital Investigation */}
                  <label
                    className={`faq-track-card track-investigation ${formData.track === 'investigation' ? 'is-selected' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, track: 'investigation' }))}
                  >
                    <input
                      type="radio"
                      name="track"
                      value="investigation"
                      checked={formData.track === 'investigation'}
                      onChange={() => setFormData(prev => ({ ...prev, track: 'investigation' }))}
                    />
                    <div className="faq-track-head">
                      <span className="faq-radio-circle">
                        <span className="faq-radio-dot"></span>
                      </span>
                      <div className="faq-track-title-wrap">
                        <span className="faq-track-dot-cyan"></span>
                        <span className="faq-track-title-cyan">Digital Investigation</span>
                      </div>
                    </div>
                    <p className="faq-track-desc">
                      Displays on <code>cyber-intelligence.php#ci-faq</code> (Forensics, OSINT, Scams)
                    </p>
                  </label>

                  {/* Cyber Security */}
                  <label
                    className={`faq-track-card track-cyber ${formData.track === 'cyber' ? 'is-selected' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, track: 'cyber' }))}
                  >
                    <input
                      type="radio"
                      name="track"
                      value="cyber"
                      checked={formData.track === 'cyber'}
                      onChange={() => setFormData(prev => ({ ...prev, track: 'cyber' }))}
                    />
                    <div className="faq-track-head">
                      <span className="faq-radio-circle">
                        <span className="faq-radio-dot"></span>
                      </span>
                      <div className="faq-track-title-wrap">
                        <span className="faq-track-dot-purple"></span>
                        <span className="faq-track-title-purple">Cyber Security</span>
                      </div>
                    </div>
                    <p className="faq-track-desc">
                      Displays on <code>digital-forensics.php#faq</code> (VAPT, Cloud, Audits)
                    </p>
                  </label>

                  {/* Both Services */}
                  <label
                    className={`faq-track-card track-both ${formData.track === 'both' ? 'is-selected' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, track: 'both' }))}
                  >
                    <input
                      type="radio"
                      name="track"
                      value="both"
                      checked={formData.track === 'both'}
                      onChange={() => setFormData(prev => ({ ...prev, track: 'both' }))}
                    />
                    <div className="faq-track-head">
                      <span className="faq-radio-circle">
                        <span className="faq-radio-dot"></span>
                      </span>
                      <div className="faq-track-title-wrap">
                        <span className="faq-track-icon-green">🌐</span>
                        <span className="faq-track-title-green">Both Services</span>
                      </div>
                    </div>
                    <p className="faq-track-desc">
                      Universal questions displayed across both pages
                    </p>
                  </label>
                </div>
              </div>

              {/* Row 2: Topic / Category Tag | Display Order Sequence | Publication Status */}
              <div className="faq-form-row-3">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="faq_category" className="faq-label">
                    Topic / Category Tag
                  </label>
                  <input
                    type="text"
                    id="faq_category"
                    name="category"
                    className="faq-input-control"
                    placeholder="e.g. Evidence & Legal, VAPT Timelines"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  />
                  <span className="faq-help-text">Badge category shown alongside the question.</span>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="faq_order" className="faq-label">
                    Display Order Sequence
                  </label>
                  <input
                    type="number"
                    id="faq_order"
                    name="order"
                    className="faq-input-control"
                    min="1"
                    value={formData.order}
                    onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value, 10) || 1 }))}
                  />
                  <span className="faq-help-text">Position sequence in the accordion list (1 = first item).</span>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="faq_status" className="faq-label">
                    Publication Status
                  </label>
                  <div className="faq-select-wrap">
                    <select
                      id="faq_status"
                      name="status"
                      className="faq-select-control"
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="active">Active (Visible on Website)</option>
                      <option value="inactive">Hidden (Hide from Website)</option>
                    </select>
                  </div>
                  <span className="faq-help-text">Instantly publish or unpublish this question.</span>
                </div>
              </div>

              {/* Row 3: Question Text */}
              <div className="form-group col-full" style={{ marginTop: '1.5rem', marginBottom: 0 }}>
                <label htmlFor="faq_question" className="faq-label">
                  Question Text <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="faq_question"
                  name="question"
                  className="faq-input-control"
                  required
                  placeholder="e.g. Are your forensic reports admissible in court?"
                  value={formData.question}
                  onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                />
                <span className="faq-help-text">The primary question header clicked by the user to expand.</span>
              </div>

              {/* Row 4: Detailed Answer */}
              <div className="form-group col-full" style={{ marginTop: '1.5rem', marginBottom: 0 }}>
                <label htmlFor="faq_answer" className="faq-label">
                  Detailed Answer <span className="required">*</span>
                </label>
                <textarea
                  id="faq_answer"
                  name="answer"
                  rows={5}
                  className="faq-input-control"
                  required
                  placeholder="Provide clear, reassuring, and technically accurate answer..."
                  style={{ resize: 'vertical', minHeight: '120px', lineHeight: 1.5 }}
                  value={formData.answer}
                  onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
                />
                <span className="faq-help-text">Expanded answer content shown when the accordion expands.</span>
              </div>

              {/* Row 5: Live Accordion Preview (Real-time) */}
              <div className="form-group col-full" style={{ marginTop: '1.75rem', marginBottom: 0 }}>
                <label className="faq-label">Live Accordion Preview (Real-time)</label>
                <div className="faq-preview-container">
                  <div className="faq-preview-box">
                    <div
                      className="faq-preview-header"
                      id="faqPreviewToggle"
                      role="button"
                      tabIndex={0}
                      title="Click to collapse / expand preview"
                      onClick={() => setPreviewExpanded(!previewExpanded)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setPreviewExpanded(!previewExpanded);
                        }
                      }}
                    >
                      <span className="faq-preview-title" id="previewQText">
                        {formData.question.trim() ? formData.question : 'Sample Question Preview'}
                      </span>
                      <span
                        className={`faq-preview-chevron ${!previewExpanded ? 'is-collapsed' : ''}`}
                        id="previewChevron"
                      >
                        ⌄
                      </span>
                    </div>
                    {previewExpanded && (
                      <div className="faq-preview-body" id="faqPreviewBody">
                        <p id="previewAText">
                          {formData.answer.trim() || 'Sample answer text preview will be rendered here as you type into the form fields above.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 6: Form Footer Actions */}
              <div className="faq-form-footer">
                <button type="button" className="btn-faq-cancel" onClick={closeForm}>
                  Cancel
                </button>
                <button type="submit" className="btn-faq-save" disabled={saving}>
                  <span style={{ fontSize: '1rem', lineHeight: 1 }}>💾</span> {saving ? 'Saving...' : 'Save FAQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <>
          {/* Primary Track Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`btn btn-sm ${currentTrack === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setCurrentTrack('all')}
          style={{
            fontWeight: 700,
            padding: '0.45rem 1rem',
            borderRadius: '9999px',
          }}
        >
          All Tracks ({countAll})
        </button>

        <button
          type="button"
          className={`btn btn-sm ${currentTrack === 'investigation' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setCurrentTrack('investigation')}
          style={{
            fontWeight: 700,
            padding: '0.45rem 1rem',
            borderRadius: '9999px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            ...(currentTrack === 'investigation'
              ? { background: '#22d3ee', borderColor: '#22d3ee', color: '#000' }
              : {}),
          }}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22d3ee', display: 'inline-block' }}></span>
          Digital Investigation FAQs ({countInv})
        </button>

        <button
          type="button"
          className={`btn btn-sm ${currentTrack === 'cyber' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setCurrentTrack('cyber')}
          style={{
            fontWeight: 700,
            padding: '0.45rem 1rem',
            borderRadius: '9999px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            ...(currentTrack === 'cyber'
              ? { background: '#c084fc', borderColor: '#c084fc', color: '#000' }
              : {}),
          }}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#c084fc', display: 'inline-block' }}></span>
          Cyber Security FAQs ({countCyber})
        </button>
      </div>

      {/* Secondary Filters Bar: Status Tabs + Search */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            className={`btn btn-sm ${currentStatus === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setCurrentStatus('all')}
            style={{ borderRadius: '9999px', padding: '0.35rem 0.85rem', fontWeight: 600 }}
          >
            All ({statusCounts.all})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${currentStatus === 'active' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setCurrentStatus('active')}
            style={{
              borderRadius: '9999px',
              padding: '0.35rem 0.85rem',
              fontWeight: 600,
              ...(currentStatus === 'active' ? { background: '#00e676', borderColor: '#00e676', color: '#000' } : {}),
            }}
          >
            ● Active
          </button>
          <button
            type="button"
            className={`btn btn-sm ${currentStatus === 'inactive' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setCurrentStatus('inactive')}
            style={{
              borderRadius: '9999px',
              padding: '0.35rem 0.85rem',
              fontWeight: 600,
              ...(currentStatus === 'inactive' ? { background: '#ffab00', borderColor: '#ffab00', color: '#000' } : {}),
            }}
          >
            ○ Hidden
          </button>
        </div>

        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', margin: 0 }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search questions..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{
              width: '220px',
              padding: '0.4rem 0.85rem',
              fontSize: '0.82rem',
              borderRadius: '8px',
              background: 'rgba(11, 11, 26, 0.7)',
              border: '1px solid var(--border-color)',
              color: '#fff',
            }}
          />
          <button type="submit" className="btn btn-secondary btn-sm" style={{ padding: '0.42rem 0.9rem' }}>
            Filter
          </button>
          {searchQuery && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              title="Clear search filter"
              onClick={handleClearSearch}
              style={{ padding: '0.42rem 0.65rem' }}
            >
              ✕
            </button>
          )}
        </form>
      </div>

      {/* Main Table Card */}
      <div className="admin-card" style={{ background: 'var(--bg-surface-card)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden' }}>
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
          <h3 className="admin-card-title" style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#fff' }}>
            {currentTrack === 'investigation' && `🔍 Digital Investigation & Forensics FAQs (${displayList.length})`}
            {currentTrack === 'cyber' && `🛡️ Cyber Security & VAPT FAQs (${displayList.length})`}
            {currentTrack === 'all' && `All Frequently Asked Questions (${displayList.length})`}
          </h3>
          <button type="button" className="btn btn-primary btn-sm" onClick={openAdd}>
            + Add FAQ
          </button>
        </div>

        <div className="table-responsive">
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(16, 16, 46, 0.6)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ width: '70px', padding: '1rem 1.25rem', textAlign: 'left', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ORDER</th>
                <th style={{ width: '160px', padding: '1rem 1.25rem', textAlign: 'left', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SERVICE TRACK</th>
                <th style={{ padding: '1rem 1.25rem', textAlign: 'left', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>QUESTION &amp; TOPIC</th>
                <th style={{ padding: '1rem 1.25rem', textAlign: 'left', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ANSWER SUMMARY</th>
                <th style={{ width: '120px', padding: '1rem 1.25rem', textAlign: 'left', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>STATUS</th>
                <th style={{ width: '190px', padding: '1rem 1.25rem', textAlign: 'right', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
                    Loading questions &amp; answers...
                  </td>
                </tr>
              ) : displayList.length > 0 ? (
                displayList.map((faq) => {
                  const isItemActive = (faq.status ? faq.status === 'active' : faq.active !== false);
                  const trackType = faq.track || 'investigation';

                  return (
                    <tr
                      key={faq.id}
                      style={{
                        borderBottom: '1px solid rgba(158, 62, 255, 0.08)',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      {/* ORDER */}
                      <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          #{faq.order || 1}
                        </span>
                      </td>

                      {/* SERVICE TRACK */}
                      <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle' }}>
                        {trackType === 'investigation' && (
                          <span className="track-badge investigation">
                            🔍 Investigation
                          </span>
                        )}
                        {trackType === 'cyber' && (
                          <span className="track-badge cyber">
                            🛡️ Cyber Security
                          </span>
                        )}
                        {trackType === 'both' && (
                          <span className="track-badge both">
                            🌐 Both Services
                          </span>
                        )}
                        {trackType !== 'investigation' && trackType !== 'cyber' && trackType !== 'both' && (
                          <span className="track-badge both">
                            {trackType}
                          </span>
                        )}
                      </td>

                      {/* QUESTION & TOPIC */}
                      <td style={{ padding: '1rem 1.25rem', maxWidth: '340px', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.92rem', marginBottom: '0.35rem', lineHeight: 1.4 }}>
                          {faq.question}
                        </div>
                        <span className="category-tag" style={{ fontSize: '0.72rem' }}>
                          {faq.category || 'General'}
                        </span>
                      </td>

                      {/* ANSWER SUMMARY */}
                      <td style={{ padding: '1rem 1.25rem', maxWidth: '400px', verticalAlign: 'middle' }}>
                        <p
                          style={{
                            fontSize: '0.84rem',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.5,
                            margin: 0,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {faq.answer}
                        </p>
                      </td>

                      {/* STATUS */}
                      <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle' }}>
                        <button
                          type="button"
                          className={`status-pill ${isItemActive ? 'active' : 'inactive'}`}
                          style={{
                            cursor: 'pointer',
                            border: isItemActive ? '1px solid rgba(0, 230, 118, 0.3)' : '1px solid rgba(255, 171, 0, 0.3)',
                            background: isItemActive ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 171, 0, 0.15)',
                            color: isItemActive ? '#00e676' : '#ffab00',
                          }}
                          title={isItemActive ? 'Click to hide from website' : 'Click to show on website'}
                          onClick={() => handleToggle(faq.id)}
                        >
                          {isItemActive ? '● ACTIVE' : '○ HIDDEN'}
                        </button>
                      </td>

                      {/* ACTIONS */}
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right', verticalAlign: 'middle' }}>
                        <div className="action-btns-group" style={{ justifyContent: 'flex-end', gap: '0.45rem' }}>
                          <button
                            type="button"
                            className={`btn-action ${isItemActive ? 'hide' : 'show'}`}
                            title={isItemActive ? 'Hide FAQ from website' : 'Make FAQ visible on website'}
                            onClick={() => handleToggle(faq.id)}
                          >
                            {isItemActive ? 'Hide' : 'Show'}
                          </button>
                          <button
                            type="button"
                            className="btn-action edit"
                            title="Edit FAQ"
                            onClick={() => openEdit(faq)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn-action delete"
                            title="Delete FAQ"
                            onClick={() => confirmDelete(faq)}
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
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
                    No FAQs found matching your filter criteria. Click "+ Add FAQ" above to create one.
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

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {deleteModalOpen && itemToDelete && (
        <div className="admin-modal-backdrop show" style={{ zIndex: 1060, position: 'fixed', inset: 0, background: 'rgba(5, 5, 15, 0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="admin-modal-dialog" style={{ maxWidth: '520px', width: '100%' }}>
            <div className="admin-modal-content" style={{ background: 'var(--bg-surface-card)', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden' }}>
              <div
                className="admin-modal-header"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1.25rem 1.5rem',
                  borderBottom: '1px solid var(--border-color)',
                  background: 'rgba(255, 51, 102, 0.08)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span style={{ fontSize: '1.3rem' }}>🗑️</span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                    Delete Frequently Asked Question?
                  </h3>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setDeleteModalOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.4rem', cursor: 'pointer' }}
                >
                  &times;
                </button>
              </div>
              <div className="admin-modal-body" style={{ padding: '1.5rem' }}>
                <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  Are you sure you want to permanently delete this question? This action cannot be undone.
                </p>
                <div
                  style={{
                    padding: '0.9rem 1rem',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <strong style={{ color: '#fff', fontSize: '0.92rem', display: 'block', marginBottom: '0.35rem' }}>
                    {itemToDelete.question}
                  </strong>
                  <span className="category-tag" style={{ fontSize: '0.72rem' }}>
                    {itemToDelete.category || 'General'}
                  </span>
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
                  background: 'rgba(16, 16, 46, 0.4)',
                }}
              >
                <button type="button" className="btn btn-secondary" onClick={() => setDeleteModalOpen(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={deleting}
                  onClick={handleDelete}
                  style={{ background: 'var(--accent-red)', borderColor: 'var(--accent-red)', color: '#fff', fontWeight: 600 }}
                >
                  {deleting ? 'Deleting...' : 'Delete FAQ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
