import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardStats } from '../api/client';

// Preserve sidebar scroll position across admin route changes without any scrollTo animations
let savedSidebarScrollTop = 0;

export const DEFAULT_SIDEBAR_STATS = {
  cyber_services_count: 26,
  practices_count: 9,
  inv_services_count: 11,
  threats_count: 39,
  faqs_count: 10,
  testimonials_count: 5,
  clients_count: 4,
  accreditations_count: 8,
  team_count: 1,
};

const ROUTE_KEY_MAP = {
  '/admin/services-cyber': 'cyber_services_count',
  '/admin/cyber-practices': 'practices_count',
  '/admin/services-investigation': 'inv_services_count',
  '/admin/investigation-threats': 'threats_count',
  '/admin/threats': 'threats_count',
  '/admin/faqs': 'faqs_count',
  '/admin/testimonials': 'testimonials_count',
  '/admin/clients': 'clients_count',
  '/admin/accreditations': 'accreditations_count',
  '/admin/team': 'team_count',
};

const getInitialSidebarStats = () => {
  try {
    const cached = sessionStorage.getItem('ck_sidebar_stats');
    if (cached) {
      return { ...DEFAULT_SIDEBAR_STATS, ...JSON.parse(cached) };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_SIDEBAR_STATS };
};

export default function AdminLayout({ children, pageTitle = 'Dashboard', currentCount }) {
  const { user, twoFactor, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState(getInitialSidebarStats);
  const [flash, setFlash] = useState(null);

  // Sidebar scroll state & progress
  const navRef = useRef(null);
  const [canScrollTop, setCanScrollTop] = useState(false);
  const [canScrollBottom, setCanScrollBottom] = useState(false);
  const [navProgress, setNavProgress] = useState(0);

  useEffect(() => {
    getDashboardStats()
      .then((data) => {
        if (data && typeof data === 'object') {
          setStats((prev) => {
            const next = { ...prev, ...data };
            try {
              sessionStorage.setItem('ck_sidebar_stats', JSON.stringify(next));
            } catch {
              // ignore
            }
            return next;
          });
        }
      })
      .catch(() => {});
  }, [location.pathname]);

  // Sync currentCount prop if provided by the active section page
  useEffect(() => {
    const activeKey = ROUTE_KEY_MAP[location.pathname];
    if (activeKey && typeof currentCount === 'number') {
      setStats((prev) => {
        if (prev[activeKey] === currentCount) return prev;
        const next = { ...prev, [activeKey]: currentCount };
        try {
          sessionStorage.setItem('ck_sidebar_stats', JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    }
  }, [currentCount, location.pathname]);

  // Listen to custom count updates dispatched across components
  useEffect(() => {
    const handleCountUpdate = (e) => {
      if (e?.detail?.key && typeof e.detail.count === 'number') {
        setStats((prev) => {
          const next = { ...prev, [e.detail.key]: e.detail.count };
          try {
            sessionStorage.setItem('ck_sidebar_stats', JSON.stringify(next));
          } catch {
            // ignore
          }
          return next;
        });
      }
    };
    window.addEventListener('ck:update_count', handleCountUpdate);
    return () => window.removeEventListener('ck:update_count', handleCountUpdate);
  }, []);

  // Handle scroll events inside the sidebar navigation
  const handleNavScroll = () => {
    const el = navRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    savedSidebarScrollTop = scrollTop;
    const maxScroll = scrollHeight - clientHeight;

    setCanScrollTop(scrollTop > 6);
    setCanScrollBottom(maxScroll > 0 && scrollTop < maxScroll - 6);
    setNavProgress(maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0);
  };

  // Restore sidebar scroll position instantly without triggering any scrollTo animation
  useLayoutEffect(() => {
    const el = navRef.current;
    if (el) {
      if (savedSidebarScrollTop > 0) {
        el.scrollTop = savedSidebarScrollTop;
      }
      handleNavScroll();
    }
  }, [location.pathname]);

  // Recalculate on window resize
  useEffect(() => {
    handleNavScroll();
    window.addEventListener('resize', handleNavScroll, { passive: true });
    return () => window.removeEventListener('resize', handleNavScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const currentPath = location.pathname;

  const getCount = (key) => {
    const activeKey = ROUTE_KEY_MAP[currentPath];
    if (activeKey === key && typeof currentCount === 'number') {
      return currentCount;
    }
    return stats[key] ?? DEFAULT_SIDEBAR_STATS[key];
  };

  return (
    <div className="admin-body">
      {/* ================= SIDEBAR ================= */}
      <aside
        className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}
        id="adminSidebar"
        data-lenis-prevent="true"
      >
        <div className="sidebar-header">
          <Link to="/admin" className="sidebar-logo">
            <img src="/assets/images/logo.png" alt="Cyber Kovai" />
            <span className="logo-text">Cyber <strong>Kovai</strong></span>
          </Link>
          <span className="sidebar-badge">SOC</span>
        </div>

        {/* Sidebar Scroll Wrapper with top/bottom fade indicators and progress bar */}
        <div className="sidebar-scroll-wrapper">
          {/* Top scroll fade indicator */}
          <div
            className={`sidebar-scroll-fade top ${canScrollTop ? 'active' : ''}`}
            aria-hidden="true"
          />

          {/* Vertical scroll progress line */}
          <div className="sidebar-scroll-progress-track" aria-hidden="true">
            <div
              className="sidebar-scroll-progress-bar"
              style={{ height: `${navProgress}%` }}
            />
          </div>

          <nav
            className="sidebar-nav"
            ref={navRef}
            onScroll={handleNavScroll}
            data-lenis-prevent="true"
          >
            <div className="nav-section-title">Overview</div>
            <Link to="/admin" className={`sidebar-link ${currentPath === '/admin' ? 'active' : ''}`}>
              <span className="link-icon">📊</span>
              <span>Dashboard</span>
            </Link>

            <div className="nav-section-title">Services Management</div>
            <Link to="/admin/services-cyber" className={`sidebar-link ${currentPath === '/admin/services-cyber' ? 'active' : ''}`}>
              <span className="link-icon">🛡️</span>
              <span>Cyber Services</span>
              <span className="badge-count">{getCount('cyber_services_count')}</span>
            </Link>
            <Link to="/admin/cyber-practices" className={`sidebar-link ${currentPath === '/admin/cyber-practices' ? 'active' : ''}`}>
              <span className="link-icon">⚡</span>
              <span>Core Practices (Bento)</span>
              <span className="badge-count">{getCount('practices_count')}</span>
            </Link>
            <Link to="/admin/services-investigation" className={`sidebar-link ${currentPath === '/admin/services-investigation' ? 'active' : ''}`}>
              <span className="link-icon">🔍</span>
              <span>Investigation Services</span>
              <span className="badge-count">{getCount('inv_services_count')}</span>
            </Link>
            <Link to="/admin/investigation-threats" className={`sidebar-link ${currentPath === '/admin/investigation-threats' || currentPath === '/admin/threats' ? 'active' : ''}`}>
              <span className="link-icon">🎯</span>
              <span>Threats &amp; Incidents</span>
              <span className="badge-count">{getCount('threats_count')}</span>
            </Link>

            <div className="nav-section-title">Content &amp; Leadership</div>
            <Link to="/admin/faqs" className={`sidebar-link ${currentPath === '/admin/faqs' ? 'active' : ''}`}>
              <span className="link-icon">❓</span>
              <span>FAQs (Cyber &amp; Inv)</span>
              <span className="badge-count">{getCount('faqs_count')}</span>
            </Link>
            <Link to="/admin/testimonials" className={`sidebar-link ${currentPath === '/admin/testimonials' ? 'active' : ''}`}>
              <span className="link-icon">⭐</span>
              <span>Testimonials</span>
              <span className="badge-count">{getCount('testimonials_count')}</span>
            </Link>
            <Link to="/admin/clients" className={`sidebar-link ${currentPath === '/admin/clients' ? 'active' : ''}`}>
              <span className="link-icon">🏢</span>
              <span>Clients &amp; Logos</span>
              <span className="badge-count">{getCount('clients_count')}</span>
            </Link>
            <Link to="/admin/accreditations" className={`sidebar-link ${currentPath === '/admin/accreditations' ? 'active' : ''}`}>
              <span className="link-icon">🏅</span>
              <span>Accreditations &amp; Badges</span>
              <span className="badge-count">{getCount('accreditations_count')}</span>
            </Link>
            <Link to="/admin/team" className={`sidebar-link ${currentPath === '/admin/team' ? 'active' : ''}`}>
              <span className="link-icon">👥</span>
              <span>Our Team</span>
              <span className="badge-count">{getCount('team_count')}</span>
            </Link>
            <Link to="/admin/legal-pages" className={`sidebar-link ${currentPath === '/admin/legal-pages' ? 'active' : ''}`}>
              <span className="link-icon">📜</span>
              <span>Legal &amp; Policies</span>
            </Link>

            <div className="nav-section-title">Configuration</div>
            <Link to="/admin/section-visibility" className={`sidebar-link ${currentPath === '/admin/section-visibility' ? 'active' : ''}`}>
              <span className="link-icon">👁️</span>
              <span>Section Visibility</span>
            </Link>
            <Link to="/admin/settings" className={`sidebar-link ${currentPath === '/admin/settings' || currentPath === '/admin/settings.php' ? 'active' : ''}`}>
              <span className="link-icon">⚙️</span>
              <span>Site &amp; Contact Info</span>
            </Link>
            <Link to="/admin/profile" className={`sidebar-link ${currentPath === '/admin/profile' ? 'active' : ''}`}>
              <span className="link-icon">👤</span>
              <span>Admin Profile</span>
            </Link>
            <Link
              to="/admin/profile#two-factor-security"
              className={`sidebar-link ${location.hash === '#two-factor-security' ? 'tfa-link-active' : ''}`}
            >
              <span className="link-icon">🔐</span>
              <span>Two-Factor Auth (2FA)</span>
              <span
                className="badge-count"
                style={{
                  background: twoFactor?.enabled ? 'rgba(0,230,118,0.18)' : 'rgba(255,171,0,0.18)',
                  color: twoFactor?.enabled ? '#00e676' : '#ffab00',
                }}
              >
                {twoFactor?.enabled ? 'ON' : 'OFF'}
              </span>
            </Link>

            <div className="nav-section-title">Session</div>
            <button
              type="button"
              className="sidebar-link sidebar-link-logout"
              onClick={handleLogout}
              style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <span className="link-icon">🚪</span>
              <span>Log Out</span>
            </button>
          </nav>

          {/* Bottom scroll fade indicator */}
          <div
            className={`sidebar-scroll-fade bottom ${canScrollBottom ? 'active' : ''}`}
            aria-hidden="true"
          />
        </div>

        <div className="sidebar-footer">
          <Link to="/admin/profile" className="admin-user-pill" title="Edit Profile">
            <div className="admin-avatar-small">
              {(user?.username || 'K')[0].toUpperCase()}
            </div>
            <div className="admin-user-info">
              <div className="admin-name">{user?.username || 'Kovaicyber@gmail.com'}</div>
              <div className="admin-role">{user?.role || 'Superadmin'}</div>
            </div>
          </Link>
          <button type="button" className="btn-sidebar-logout" title="Sign Out" onClick={handleLogout}>
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT WRAPPER ================= */}
      <div className="admin-main-wrap">
        {/* TOPBAR */}
        <header className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              type="button"
              className="mobile-menu-toggle"
              id="mobileSidebarToggle"
              aria-label="Toggle Sidebar"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰
            </button>
            <div className="topbar-breadcrumbs">
              <Link to="/admin">Admin</Link>
              <span className="sep">/</span>
              <span className="current">{pageTitle}</span>
            </div>
          </div>

          <div className="topbar-actions">
            <a href="/" target="_blank" rel="noopener noreferrer" className="btn-view-site" title="Open live website in new tab">
              <span>🌐</span> View Live Site ➔
            </a>
            <button type="button" className="btn-topbar-logout" title="Sign Out" onClick={handleLogout}>
              <span>🚪</span> Log Out
            </button>
          </div>
        </header>

        {/* CONTENT AREA */}
        <main className="admin-content">
          {flash && (
            <div className={`flash-alert ${flash.type}`}>
              <span>
                <strong>{flash.type === 'success' ? '✓ Success:' : '⚠ Error:'}</strong> {flash.message}
              </span>
              <button type="button" className="flash-close-btn" onClick={() => setFlash(null)}>&times;</button>
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}
