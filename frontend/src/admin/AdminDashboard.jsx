import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import {
  getDashboardStats,
  getSettings,
  adminGetInvestigationServices,
  getInvestigationServices,
} from '../api/client';
import { useAuth } from '../context/AuthContext';
import { getAssetUrl } from '../utils/assets';

const DEFAULT_INV_SERVICES = [
  {
    id: '9',
    slug: 'corporate-background-verification-bgv',
    title: 'Corporate Background Verification (BGV)',
    short: 'Corporate BGV Verification',
    image: 'assets/images/corporate_background_verification_bgv.jpg',
    status: 'active',
  },
  {
    id: '1',
    slug: 'cybercrime-victim-assistance-account-recovery',
    title: 'Cybercrime Victim Assistance & Account Recovery',
    short: 'Victim & Account Recovery',
    image: 'assets/images/investigation_01_victim_recovery.jpg',
    status: 'active',
  },
  {
    id: '2',
    slug: 'digital-investigations-osint',
    title: 'Digital Investigations & OSINT',
    short: 'Digital Investigations & OSINT',
    image: 'assets/images/investigation_02_osint.jpg',
    status: 'active',
  },
  {
    id: '3',
    slug: 'social-media-investigations-impersonation-removal',
    title: 'Social Media Investigations & Impersonation Removal',
    short: 'Social Media Investigations',
    image: 'assets/images/investigation_03_social_media.jpg',
    status: 'active',
  },
  {
    id: '4',
    slug: 'cyber-fraud-investigation-support',
    title: 'Cyber Fraud Investigation Support',
    short: 'Cyber Fraud Investigation',
    image: 'assets/images/investigation_04_fraud.jpg',
    status: 'active',
  },
];

export default function AdminDashboard() {
  const { twoFactor } = useAuth();
  const [stats, setStats] = useState({});
  const [settings, setSettings] = useState({});
  const [invServices, setInvServices] = useState([]);

  useEffect(() => {
    getDashboardStats().then(setStats).catch(() => {});
    getSettings().then(setSettings).catch(() => {});

    // Fetch investigation services for the overview table
    adminGetInvestigationServices()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setInvServices(data);
        } else {
          getInvestigationServices().then((res) => {
            if (Array.isArray(res) && res.length > 0) setInvServices(res);
          }).catch(() => {});
        }
      })
      .catch(() => {
        getInvestigationServices().then((res) => {
          if (Array.isArray(res) && res.length > 0) setInvServices(res);
        }).catch(() => {});
      });
  }, []);

  const displayInvServices = invServices.length > 0 ? invServices : DEFAULT_INV_SERVICES;

  const cyberServicesCount = stats.cyber_services_count ?? 26;
  const invServicesCount = stats.inv_services_count ?? (invServices.length || 11);
  const testimonialsCount = stats.testimonials_count ?? 5;
  const teamCount = stats.team_count ?? 1;
  const practicesCount = stats.practices_count ?? 9;
  const threatsCount = stats.threats_count ?? 39;
  const faqsCount = stats.faqs_count ?? 10;
  const accreditationsCount = stats.accreditations_count ?? 8;

  const isTeamVisible = settings.show_team !== false && settings.show_team !== 0;

  return (
    <AdminLayout pageTitle="Dashboard Overview">
      {/* 2FA Disabled Alert Banner */}
      {!twoFactor?.enabled && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-sm, 10px)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            background: 'rgba(255, 171, 0, 0.12)',
            border: '1px solid rgba(255, 171, 0, 0.35)',
            color: '#ffe082',
          }}
        >
          <span>
            <strong>🔐 Admin Two-Factor Authentication (2FA) is Disabled:</strong>{' '}
            Enable TOTP authenticator verification (Google / Microsoft Authenticator) to protect admin logins.
          </span>
          <Link to="/admin/profile#two-factor-security" className="btn btn-primary btn-sm">
            Setup 2FA Now ➔
          </Link>
        </div>
      )}

      {/* Page Header — Title + Description */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 className="page-header-title">Security Operations Center Dashboard</h1>
        <p className="page-header-desc">
          Manage services, testimonials, leadership team, and site-wide contact info stored in secure file storage.
        </p>
      </div>

      {/* Action Buttons Row */}
      <div
        style={{
          display: 'flex',
          gap: '0.6rem',
          flexWrap: 'wrap',
          marginBottom: '2rem',
          alignItems: 'center',
        }}
      >
        <Link to="/admin/cyber-practices?action=add" className="btn btn-primary btn-sm">
          + Add Core Practice
        </Link>
        <Link to="/admin/services-cyber?action=add" className="btn btn-secondary btn-sm">
          + Add Cyber Service
        </Link>
        <Link to="/admin/services-investigation?action=add" className="btn btn-secondary btn-sm">
          + Add Investigation Service
        </Link>
        <Link to="/admin/investigation-threats?action=add" className="btn btn-secondary btn-sm">
          + Add Threat Tag
        </Link>
        <Link to="/admin/faqs?action=add" className="btn btn-secondary btn-sm">
          + Add FAQ
        </Link>
        <Link to="/admin/section-visibility" className="btn btn-secondary btn-sm">
          👁️ Section Visibility
        </Link>
        <Link to="/admin/profile#two-factor-security" className="btn btn-secondary btn-sm">
          🔐 Two-Factor Auth (2FA)
        </Link>
      </div>

      {/* ================= STATS CARDS ================= */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Cyber Services</span>
            <div className="stat-icon-wrap">🛡️</div>
          </div>
          <div className="stat-value">{cyberServicesCount}</div>
          <div className="stat-subtext">VAPT, Cloud, Network, Enterprise</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Investigation Services</span>
            <div className="stat-icon-wrap">🔍</div>
          </div>
          <div className="stat-value">{invServicesCount}</div>
          <div className="stat-subtext">Digital forensics, OSINT, Fraud</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Client Testimonials</span>
            <div className="stat-icon-wrap">⭐</div>
          </div>
          <div className="stat-value">{testimonialsCount}</div>
          <div className="stat-subtext">Published client reviews</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Our Team</span>
            <div className="stat-icon-wrap">👥</div>
          </div>
          <div className="stat-value">{teamCount}</div>
          <div className="stat-subtext" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Security architects</span>
            {isTeamVisible ? (
              <span className="status-pill active" style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem' }}>
                VISIBLE
              </span>
            ) : (
              <span
                className="status-pill inactive"
                style={{
                  fontSize: '0.68rem',
                  padding: '0.1rem 0.45rem',
                  background: 'rgba(255,171,0,0.15)',
                  color: '#ffab00',
                  borderColor: 'rgba(255,171,0,0.35)',
                }}
              >
                HIDDEN
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ================= 2-COLUMN DASHBOARD GRID ================= */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        {/* Contact & Application Information Card */}
        <div className="admin-card" style={{ marginBottom: 0 }}>
          <div className="admin-card-header">
            <h3 className="admin-card-title">Live Application Contact Details</h3>
            <Link to="/admin/settings" className="btn btn-secondary btn-sm">
              Edit Contact Info ➔
            </Link>
          </div>
          <div className="admin-card-body">
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              These values are propagated throughout headers, footers, contact pages, and service inquiry blocks.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '0.75rem',
                  borderBottom: '1px solid rgba(158,62,255,0.1)',
                }}
              >
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Primary Email</span>
                <strong style={{ fontSize: '0.9rem', color: 'var(--accent-purple-light)' }}>
                  {settings.site_email || 'info@cyberkovai.com'}
                </strong>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '0.75rem',
                  borderBottom: '1px solid rgba(158,62,255,0.1)',
                }}
              >
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Primary Phone</span>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  {settings.site_phone || '+91 63820 19821'}
                </strong>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '0.75rem',
                  borderBottom: '1px solid rgba(158,62,255,0.1)',
                }}
              >
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Dial Link (tel:)</span>
                <code style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>
                  {settings.site_phone_tel || '+916382019821'}
                </code>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '0.75rem',
                  borderBottom: '1px solid rgba(158,62,255,0.1)',
                }}
              >
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Location</span>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  {settings.site_location || 'Coimbatore, Tamil Nadu, India'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Full Address</span>
                <span
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    textAlign: 'right',
                    maxWidth: '65%',
                  }}
                >
                  {settings.site_address ||
                    'Cyber Kovai Intelligence & Forensics Center, Coimbatore, Tamil Nadu, India'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Navigation & Storage Diagnostics */}
        <div className="admin-card" style={{ marginBottom: 0 }}>
          <div className="admin-card-header">
            <h3 className="admin-card-title">Storage &amp; System Health</h3>
            <span className="status-pill active">JSON VAULT ACTIVE</span>
          </div>
          <div className="admin-card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '0.75rem',
                  borderBottom: '1px solid rgba(158,62,255,0.1)',
                }}
              >
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Storage Engine</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff' }}>
                  File Storage (JSON + Exclusive Locks)
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '0.75rem',
                  borderBottom: '1px solid rgba(158,62,255,0.1)',
                }}
              >
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Data Vault Directory</span>
                <code style={{ fontSize: '0.8rem', color: 'var(--accent-purple-light)' }}>/data/*.json</code>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '0.75rem',
                  borderBottom: '1px solid rgba(158,62,255,0.1)',
                }}
              >
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Uploads Directory</span>
                <code style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>/data/uploads/</code>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '0.75rem',
                  borderBottom: '1px solid rgba(158,62,255,0.1)',
                }}
              >
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Direct Web Access</span>
                <span className="status-pill active">BLOCKED VIA .HTACCESS</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '0.75rem',
                  borderBottom: '1px solid rgba(158,62,255,0.1)',
                }}
              >
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Admin 2FA Protection</span>
                {twoFactor?.enabled ? (
                  <Link
                    to="/admin/profile#two-factor-security"
                    className="status-pill active"
                    style={{ textDecoration: 'none' }}
                  >
                    Enabled (TOTP)
                  </Link>
                ) : (
                  <Link
                    to="/admin/profile#two-factor-security"
                    className="status-pill inactive"
                    style={{
                      textDecoration: 'none',
                      background: 'rgba(255,171,0,0.15)',
                      color: '#ffab00',
                      borderColor: 'rgba(255,171,0,0.35)',
                    }}
                  >
                    DISABLED — SETUP 2FA ➔
                  </Link>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>PHP Version</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>8.3.36</span>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Link
                to="/admin/cyber-practices"
                className="btn btn-secondary btn-sm"
                style={{ borderColor: 'rgba(158,62,255,0.4)', background: 'rgba(158,62,255,0.12)' }}
              >
                Manage Core Practices ({practicesCount}) ➔
              </Link>
              <Link to="/admin/services-cyber" className="btn btn-secondary btn-sm">
                Manage Cyber Services ➔
              </Link>
              <Link to="/admin/services-investigation" className="btn btn-secondary btn-sm">
                Manage Investigation ➔
              </Link>
              <Link to="/admin/investigation-threats" className="btn btn-secondary btn-sm">
                Manage Threats Cloud ({threatsCount}) ➔
              </Link>
              <Link to="/admin/faqs" className="btn btn-secondary btn-sm">
                Manage FAQs ({faqsCount}) ➔
              </Link>
              <Link to="/admin/clients" className="btn btn-secondary btn-sm">
                Manage Clients &amp; Logos ➔
              </Link>
              <Link to="/admin/accreditations" className="btn btn-secondary btn-sm">
                Manage Accreditations ({accreditationsCount}) ➔
              </Link>
              <Link to="/admin/testimonials" className="btn btn-secondary btn-sm">
                Manage Testimonials ➔
              </Link>
              <Link to="/admin/team" className="btn btn-secondary btn-sm">
                Manage Team ➔
              </Link>
              <Link
                to="/admin/legal-pages"
                className="btn btn-secondary btn-sm"
                style={{
                  borderColor: 'rgba(0,240,255,0.4)',
                  background: 'rgba(0,240,255,0.08)',
                  color: '#00f0ff',
                }}
              >
                Manage Legal &amp; Policies ➔
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ================= RECENT INVESTIGATION SERVICES TABLE ================= */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">Investigation Services Overview</h3>
          <Link to="/admin/services-investigation" className="btn btn-secondary btn-sm">
            View All ({invServicesCount}) ➔
          </Link>
        </div>
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>IMAGE</th>
                <th>SERVICE NAME</th>
                <th>SHORT TITLE</th>
                <th>STATUS</th>
                <th style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {displayInvServices.map((svc) => (
                <tr key={svc.slug || svc.id}>
                  <td>
                    <img
                      src={getAssetUrl(svc.image || 'assets/images/investigation_01_victim_recovery.jpg')}
                      alt=""
                      className="table-thumbnail"
                      onError={(e) => {
                        e.target.src = getAssetUrl('assets/images/investigation_01_victim_recovery.jpg');
                      }}
                    />
                  </td>
                  <td>
                    <span className="cell-title">{svc.title}</span>
                    <span className="cell-subtitle">Slug: {svc.slug}</span>
                  </td>
                  <td>
                    <span className="category-tag">{svc.short || svc.title}</span>
                  </td>
                  <td>
                    <span
                      className={`status-pill ${
                        svc.status !== 'inactive' && svc.active !== false ? 'active' : 'inactive'
                      }`}
                    >
                      {svc.status
                        ? svc.status.toUpperCase()
                        : svc.active !== false
                        ? 'ACTIVE'
                        : 'INACTIVE'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="action-btns-group" style={{ justifyContent: 'flex-end' }}>
                      <Link
                        to={`/admin/services-investigation?action=edit&slug=${encodeURIComponent(svc.slug)}`}
                        className="btn-action edit"
                      >
                        Edit
                      </Link>
                      <a
                        href={`${import.meta.env.BASE_URL}services/${svc.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-action view"
                      >
                        Preview
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
