import express from 'express';
import { publicController } from '../controllers/publicController.js';
import { authController } from '../controllers/authController.js';
import { adminController } from '../controllers/adminController.js';
import { requireAuth } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// ==========================================
// PUBLIC ROUTES
// ==========================================

// API root info
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Cyber Kovai API is running',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            settings: '/api/settings',
            services: '/api/services/cyber',
            login: '/api/auth/login',
        },
    });
});

// Site Settings & Visibility
router.get('/settings', publicController.getSettings);
router.get('/sections', publicController.getSectionVisibility);

// Categories
router.get('/categories', publicController.getCyberCategories);

// Cyber Services
router.get('/services/cyber', publicController.getCyberServices);
router.get('/services/cyber/:slug', publicController.getCyberServiceBySlug);

// Full Service Detail (service.php parity: static rich data + stored overrides)
router.get('/services/full/:slug', publicController.getFullServiceBySlug);

// reCAPTCHA public site config (mirrors ENABLE_RECAPTCHA / RECAPTCHA_SITE_KEY)
router.get('/recaptcha-config', publicController.getRecaptchaConfig);

// Practices
router.get('/practices', publicController.getCyberPractices);

// Investigation Services
router.get('/services/investigation', publicController.getInvestigationServices);
router.get('/services/investigation/:slug', publicController.getInvestigationServiceBySlug);

// Threats
router.get('/threats', publicController.getInvestigationThreats);

// Testimonials
router.get('/testimonials', publicController.getTestimonials);

// Clients
router.get('/clients', publicController.getClients);

// Accreditations
router.get('/accreditations', publicController.getAccreditations);

// Team
router.get('/team', publicController.getTeam);

// FAQs
router.get('/faqs', publicController.getFaqs);

// Legal Policies
router.get('/legal', publicController.getLegalPolicies);
router.get('/legal/:key', publicController.getLegalPolicyByKey);

// Contact Form (matches process-contact.php)
router.post('/contact', rateLimiter({ maxAttempts: 10, windowMs: 15 * 60 * 1000 }), publicController.processContact);

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================
router.post('/auth/login', rateLimiter({ maxAttempts: 5, windowMs: 15 * 60 * 1000 }), authController.login);
router.post('/auth/verify-2fa', rateLimiter({ maxAttempts: 5, windowMs: 15 * 60 * 1000 }), authController.verify2FA);
router.post('/auth/logout', authController.logout);

// Protected Auth Endpoints
router.get('/auth/current-user', requireAuth, authController.currentUser);
router.post('/auth/setup-2fa', requireAuth, authController.setup2FA);
router.post('/auth/confirm-2fa', requireAuth, authController.confirm2FA);
router.post('/auth/disable-2fa', requireAuth, authController.disable2FA);
router.post('/auth/cancel-2fa', requireAuth, authController.cancelPending2FA);
router.put('/auth/profile', requireAuth, authController.updateProfile);

// ==========================================
// ADMIN DASHBOARD & CRUD ROUTES
// ==========================================
router.get('/admin/dashboard', requireAuth, adminController.getDashboardStats);
router.put('/admin/settings', requireAuth, adminController.updateSettings);
router.put('/admin/sections', requireAuth, adminController.updateSectionVisibility);

// Cyber Services
router.get('/admin/services/cyber', requireAuth, adminController.getCyberServices);
router.post('/admin/services/cyber', requireAuth, adminController.saveCyberService);
router.delete('/admin/services/cyber/:slug', requireAuth, adminController.deleteCyberService);

// Core Practices
router.get('/admin/practices', requireAuth, adminController.getCyberPractices);
router.post('/admin/practices', requireAuth, adminController.saveCyberPractice);
router.post('/admin/practices/settings', requireAuth, adminController.updateCyberPracticesSettings);
router.put('/admin/practices/settings', requireAuth, adminController.updateCyberPracticesSettings);
router.post('/admin/practices/:id', requireAuth, adminController.saveCyberPractice);
router.put('/admin/practices/:id', requireAuth, adminController.saveCyberPractice);
router.delete('/admin/practices/:id', requireAuth, adminController.deleteCyberPractice);
router.patch('/admin/practices/:id/toggle', requireAuth, adminController.toggleCyberPractice);

// Investigation Services
router.get('/admin/services/investigation', requireAuth, adminController.getInvestigationServices);
router.post('/admin/services/investigation', requireAuth, adminController.saveInvestigationService);
router.delete('/admin/services/investigation/:slug', requireAuth, adminController.deleteInvestigationService);
router.patch('/admin/services/investigation/:slug/toggle', requireAuth, adminController.toggleInvestigationService);

// Threats
router.get('/admin/threats', requireAuth, adminController.getThreats);
router.post('/admin/threats', requireAuth, adminController.saveThreat);
router.post('/admin/threats/:id', requireAuth, adminController.saveThreat);
router.put('/admin/threats/:id', requireAuth, adminController.saveThreat);
router.delete('/admin/threats/:id', requireAuth, adminController.deleteThreat);
router.patch('/admin/threats/:id/toggle', requireAuth, adminController.toggleThreat);

// Testimonials
router.get('/admin/testimonials', requireAuth, adminController.getTestimonials);
router.post('/admin/testimonials', requireAuth, adminController.saveTestimonial);
router.post('/admin/testimonials/:id', requireAuth, adminController.saveTestimonial);
router.put('/admin/testimonials/:id', requireAuth, adminController.saveTestimonial);
router.delete('/admin/testimonials/:id', requireAuth, adminController.deleteTestimonial);
router.patch('/admin/testimonials/:id/toggle', requireAuth, adminController.toggleTestimonial);

// Clients
router.get('/admin/clients', requireAuth, adminController.getClients);
router.post('/admin/clients', requireAuth, adminController.saveClient);
router.delete('/admin/clients/:id', requireAuth, adminController.deleteClient);
router.patch('/admin/clients/:id/toggle', requireAuth, adminController.toggleClient);

// Accreditations
router.get('/admin/accreditations', requireAuth, adminController.getAccreditations);
router.post('/admin/accreditations', requireAuth, adminController.saveAccreditation);
router.post('/admin/accreditations/:id', requireAuth, adminController.saveAccreditation);
router.put('/admin/accreditations/:id', requireAuth, adminController.saveAccreditation);
router.delete('/admin/accreditations/:id', requireAuth, adminController.deleteAccreditation);
router.patch('/admin/accreditations/:id/toggle', requireAuth, adminController.toggleAccreditation);

// Team Members
router.get('/admin/team', requireAuth, adminController.getTeam);
router.post('/admin/team', requireAuth, adminController.saveTeamMember);
router.post('/admin/team/:id', requireAuth, adminController.saveTeamMember);
router.put('/admin/team/:id', requireAuth, adminController.saveTeamMember);
router.delete('/admin/team/:id', requireAuth, adminController.deleteTeamMember);

// FAQs
router.get('/admin/faqs', requireAuth, adminController.getFaqs);
router.post('/admin/faqs', requireAuth, adminController.saveFaq);
router.post('/admin/faqs/:id', requireAuth, adminController.saveFaq);
router.put('/admin/faqs/:id', requireAuth, adminController.saveFaq);
router.delete('/admin/faqs/:id', requireAuth, adminController.deleteFaq);
router.patch('/admin/faqs/:id/toggle', requireAuth, adminController.toggleFaq);

// Legal Policies
router.get('/admin/legal', requireAuth, adminController.getLegalPolicies);
router.put('/admin/legal/:key', requireAuth, adminController.saveLegalPolicy);

// Upload
router.post('/admin/upload', requireAuth, upload.single('file'), adminController.uploadFile);

export default router;

