import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import ScrollToTopButton from './components/ScrollToTopButton';

// Public Pages
import PortalPage from './pages/PortalPage';
import CyberSecurityPage from './pages/CyberSecurityPage';
import ForensicsPage from './pages/ForensicsPage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import AboutPage from './pages/AboutPage';
import TeamPage from './pages/TeamPage';
import ContactPage from './pages/ContactPage';
import LegalPage from './pages/LegalPage';

// Admin Pages
import AdminLogin from './admin/AdminLogin';
import AdminVerify2FA from './admin/AdminVerify2FA';
import AdminDashboard from './admin/AdminDashboard';
import AdminCyberServices from './admin/AdminCyberServices';
import AdminCyberPractices from './admin/AdminCyberPractices';
import AdminInvestigationServices from './admin/AdminInvestigationServices';
import AdminThreats from './admin/AdminThreats';
import AdminTestimonials from './admin/AdminTestimonials';
import AdminClients from './admin/AdminClients';
import AdminAccreditations from './admin/AdminAccreditations';
import AdminTeam from './admin/AdminTeam';
import AdminFaqs from './admin/AdminFaqs';
import AdminLegalPages from './admin/AdminLegalPages';
import AdminSectionVisibility from './admin/AdminSectionVisibility';
import AdminSettings from './admin/AdminSettings';
import AdminProfile from './admin/AdminProfile';

function ProtectedAdminRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div style={{ color: '#fff', textAlign: 'center', padding: '4rem' }}>Checking authorization...</div>;
  }
  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  return children;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
      {/* Selection Portal */}
      <Route path="/" element={<PortalPage />} />
      <Route path="/index.php" element={<PortalPage />} />

      {/* Cyber Security Track */}
      <Route path="/digital-forensics" element={<CyberSecurityPage />} />
      <Route path="/digital-forensics.php" element={<CyberSecurityPage />} />
      <Route path="/digitalforensics" element={<CyberSecurityPage />} />
      <Route path="/digitalforensics.php" element={<CyberSecurityPage />} />
      <Route path="/digital-forensics/services" element={<CyberSecurityPage />} />
      <Route path="/digitalforensics/services" element={<CyberSecurityPage />} />

      {/* Forensics Track */}
      <Route path="/cyber-intelligence" element={<ForensicsPage />} />
      <Route path="/cyber-intelligence.php" element={<ForensicsPage />} />
      <Route path="/cyber-intelligence/services" element={<ForensicsPage />} />
      <Route path="/investigation" element={<ForensicsPage />} />
      <Route path="/investigation.php" element={<ForensicsPage />} />

      {/* About Us & Team */}
      <Route path="/about" element={<AboutPage />} />
      <Route path="/about.php" element={<AboutPage />} />
      <Route path="/team" element={<TeamPage />} />
      <Route path="/team.php" element={<TeamPage />} />
      <Route path="/our-team" element={<TeamPage />} />

      {/* Contact Us */}
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/contact.php" element={<ContactPage />} />

      {/* Service Detail Dynamic Pages */}
      <Route path="/services/:slug" element={<ServiceDetailPage />} />
      <Route path="/services/:slug.php" element={<ServiceDetailPage />} />
      <Route path="/digital-forensics/services/:slug" element={<ServiceDetailPage />} />
      <Route path="/cyber-intelligence/services/:slug" element={<ServiceDetailPage />} />
      <Route path="/investigation/services/:slug" element={<ServiceDetailPage />} />

      {/* Legal & Compliance Policies */}
      <Route path="/legal" element={<LegalPage />} />
      <Route path="/legal.php" element={<LegalPage />} />
      <Route path="/privacy-policy" element={<LegalPage defaultKey="privacy" />} />
      <Route path="/privacy-policy.php" element={<LegalPage defaultKey="privacy" />} />
      <Route path="/terms-conditions" element={<LegalPage defaultKey="terms" />} />
      <Route path="/terms-conditions.php" element={<LegalPage defaultKey="terms" />} />
      <Route path="/security-disclosure" element={<LegalPage defaultKey="disclosure" />} />
      <Route path="/security-disclosure.php" element={<LegalPage defaultKey="disclosure" />} />

      {/* Admin Authentication */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/login.php" element={<AdminLogin />} />
      <Route path="/admin/verify-2fa" element={<AdminVerify2FA />} />
      <Route path="/admin/verify-2fa.php" element={<AdminVerify2FA />} />

      {/* Admin Protected Console */}
      <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
      <Route path="/admin/index" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
      <Route path="/admin/index.php" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
      <Route path="/admin/services-cyber" element={<ProtectedAdminRoute><AdminCyberServices /></ProtectedAdminRoute>} />
      <Route path="/admin/services-cyber.php" element={<ProtectedAdminRoute><AdminCyberServices /></ProtectedAdminRoute>} />
      <Route path="/admin/cyber-practices" element={<ProtectedAdminRoute><AdminCyberPractices /></ProtectedAdminRoute>} />
      <Route path="/admin/cyber-practices.php" element={<ProtectedAdminRoute><AdminCyberPractices /></ProtectedAdminRoute>} />
      <Route path="/admin/services-investigation" element={<ProtectedAdminRoute><AdminInvestigationServices /></ProtectedAdminRoute>} />
      <Route path="/admin/services-investigation.php" element={<ProtectedAdminRoute><AdminInvestigationServices /></ProtectedAdminRoute>} />
      <Route path="/admin/investigation-threats" element={<ProtectedAdminRoute><AdminThreats /></ProtectedAdminRoute>} />
      <Route path="/admin/investigation-threats.php" element={<ProtectedAdminRoute><AdminThreats /></ProtectedAdminRoute>} />
      <Route path="/admin/threats" element={<ProtectedAdminRoute><AdminThreats /></ProtectedAdminRoute>} />
      <Route path="/admin/threats.php" element={<ProtectedAdminRoute><AdminThreats /></ProtectedAdminRoute>} />
      <Route path="/admin/testimonials" element={<ProtectedAdminRoute><AdminTestimonials /></ProtectedAdminRoute>} />
      <Route path="/admin/testimonials.php" element={<ProtectedAdminRoute><AdminTestimonials /></ProtectedAdminRoute>} />
      <Route path="/admin/clients" element={<ProtectedAdminRoute><AdminClients /></ProtectedAdminRoute>} />
      <Route path="/admin/clients.php" element={<ProtectedAdminRoute><AdminClients /></ProtectedAdminRoute>} />
      <Route path="/admin/accreditations" element={<ProtectedAdminRoute><AdminAccreditations /></ProtectedAdminRoute>} />
      <Route path="/admin/accreditations.php" element={<ProtectedAdminRoute><AdminAccreditations /></ProtectedAdminRoute>} />
      <Route path="/admin/team" element={<ProtectedAdminRoute><AdminTeam /></ProtectedAdminRoute>} />
      <Route path="/admin/team.php" element={<ProtectedAdminRoute><AdminTeam /></ProtectedAdminRoute>} />
      <Route path="/admin/faqs" element={<ProtectedAdminRoute><AdminFaqs /></ProtectedAdminRoute>} />
      <Route path="/admin/faqs.php" element={<ProtectedAdminRoute><AdminFaqs /></ProtectedAdminRoute>} />
      <Route path="/admin/legal-pages" element={<ProtectedAdminRoute><AdminLegalPages /></ProtectedAdminRoute>} />
      <Route path="/admin/legal-pages.php" element={<ProtectedAdminRoute><AdminLegalPages /></ProtectedAdminRoute>} />
      <Route path="/admin/section-visibility" element={<ProtectedAdminRoute><AdminSectionVisibility /></ProtectedAdminRoute>} />
      <Route path="/admin/section-visibility.php" element={<ProtectedAdminRoute><AdminSectionVisibility /></ProtectedAdminRoute>} />
      <Route path="/admin/settings" element={<ProtectedAdminRoute><AdminSettings /></ProtectedAdminRoute>} />
      <Route path="/admin/settings.php" element={<ProtectedAdminRoute><AdminSettings /></ProtectedAdminRoute>} />
      <Route path="/admin/profile" element={<ProtectedAdminRoute><AdminProfile /></ProtectedAdminRoute>} />
      <Route path="/admin/profile.php" element={<ProtectedAdminRoute><AdminProfile /></ProtectedAdminRoute>} />

      {/* Fallback to portal */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <ScrollToTopButton />
    </>
  );
}

