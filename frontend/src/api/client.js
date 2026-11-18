import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept request to attach Bearer token if stored in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ck_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Public API
export const getSettings = () => api.get('/settings').then(r => r.data.data);
export const getSections = () => api.get('/sections').then(r => r.data.data);
export const getCategories = () => api.get('/categories').then(r => r.data.data);
export const getCyberServices = () => api.get('/services/cyber').then(r => r.data.data);
export const getCyberService = (slug) => api.get(`/services/cyber/${slug}`).then(r => r.data.data);
export const getFullService = (slug) => api.get(`/services/full/${slug}`).then(r => r.data.data);
export const getRecaptchaConfig = () => api.get('/recaptcha-config').then(r => r.data.data);
export const getPractices = () => api.get('/practices').then(r => r.data.data);
export const getInvestigationServices = () => api.get('/services/investigation').then(r => r.data.data);
export const getInvestigationService = (slug) => api.get(`/services/investigation/${slug}`).then(r => r.data.data);
export const getThreats = () => api.get('/threats').then(r => r.data.data);
export const getTestimonials = () => api.get('/testimonials').then(r => r.data.data);
export const getClients = (track = 'all') => api.get(`/clients?track=${track}`).then(r => r.data.data);
export const getAccreditations = (track = 'all') => api.get(`/accreditations?track=${track}`).then(r => r.data.data);
export const getTeam = () => api.get('/team').then(r => r.data.data);
export const getFaqs = (track = 'all') => api.get(`/faqs?track=${track}`).then(r => r.data.data);
export const getLegalPolicies = () => api.get('/legal').then(r => r.data.data);
export const getLegalPolicy = (key) => api.get(`/legal/${key}`).then(r => r.data.data);
export const submitContact = (formData) => api.post('/contact', formData).then(r => r.data);

// Auth API
export const adminLogin = (creds) => api.post('/auth/login', creds).then(r => r.data);
export const verify2FA = (data) => api.post('/auth/verify-2fa', data).then(r => r.data);
export const getCurrentUser = () => api.get('/auth/current-user').then(r => r.data);
export const setup2FA = (data = {}) => api.post('/auth/setup-2fa', data).then(r => r.data);
export const confirm2FA = (code) => api.post('/auth/confirm-2fa', { code }).then(r => r.data);
export const disable2FA = (data = {}) => api.post('/auth/disable-2fa', data).then(r => r.data);
export const cancel2FA = () => api.post('/auth/cancel-2fa').then(r => r.data);
export const updateProfile = (data) => api.put('/auth/profile', data).then(r => r.data);
export const adminLogout = () => api.post('/auth/logout').then(r => r.data);

// Admin CRUD API
export const getDashboardStats = () => api.get('/admin/dashboard').then(r => r.data.data);
export const updateSettings = (data) => api.put('/admin/settings', data).then(r => r.data);
export const updateSections = (data) => api.put('/admin/sections', data).then(r => r.data);

// Admin Cyber Services
export const adminGetCyberServices = () => api.get('/admin/services/cyber').then(r => r.data.data);
export const adminSaveCyberService = (data, originalSlug) => api.post(`/admin/services/cyber${originalSlug ? `?originalSlug=${originalSlug}` : ''}`, data).then(r => r.data);
export const adminDeleteCyberService = (slug) => api.delete(`/admin/services/cyber/${slug}`).then(r => r.data);

// Admin Practices
export const adminGetPractices = () => api.get('/admin/practices').then(r => r.data.data);
export const adminSavePractice = (data, id) => api.post(`/admin/practices${id ? `/${id}` : ''}`, data).then(r => r.data);
export const adminDeletePractice = (id) => api.delete(`/admin/practices/${id}`).then(r => r.data);
export const adminTogglePractice = (id) => api.patch(`/admin/practices/${id}/toggle`).then(r => r.data);
export const adminUpdatePracticesSettings = (data) => api.put('/admin/practices/settings', data).then(r => r.data);

// Admin Investigation Services
export const adminGetInvestigationServices = () => api.get('/admin/services/investigation').then(r => r.data.data);
export const adminSaveInvestigationService = (data, originalSlug) => api.post(`/admin/services/investigation${originalSlug ? `?originalSlug=${originalSlug}` : ''}`, data).then(r => r.data);
export const adminDeleteInvestigationService = (slug) => api.delete(`/admin/services/investigation/${slug}`).then(r => r.data);
export const adminToggleInvestigationService = (slug) => api.patch(`/admin/services/investigation/${slug}/toggle`).then(r => r.data);

// Admin Threats
export const adminGetThreats = () => api.get('/admin/threats').then(r => r.data.data);
export const adminSaveThreat = (data, id) => api.post(`/admin/threats${id ? `/${id}` : ''}`, data).then(r => r.data);
export const adminDeleteThreat = (id) => api.delete(`/admin/threats/${id}`).then(r => r.data);
export const adminToggleThreat = (id) => api.patch(`/admin/threats/${id}/toggle`).then(r => r.data);

// Admin Testimonials
export const adminGetTestimonials = () => api.get('/admin/testimonials').then(r => r.data.data);
export const adminSaveTestimonial = (data, id) => api.post(`/admin/testimonials${id ? `/${id}` : ''}`, data).then(r => r.data);
export const adminDeleteTestimonial = (id) => api.delete(`/admin/testimonials/${id}`).then(r => r.data);
export const adminToggleTestimonial = (id) => api.patch(`/admin/testimonials/${id}/toggle`).then(r => r.data);

// Admin Clients
export const adminGetClients = (track = 'all') => api.get(`/admin/clients?track=${track}`).then(r => r.data.data);
export const adminSaveClient = (data, id) => api.post(`/admin/clients${id ? `/${id}` : ''}`, data).then(r => r.data);
export const adminDeleteClient = (id) => api.delete(`/admin/clients/${id}`).then(r => r.data);
export const adminToggleClient = (id) => api.patch(`/admin/clients/${id}/toggle`).then(r => r.data);

// Admin Accreditations
export const adminGetAccreditations = () => api.get('/admin/accreditations').then(r => r.data.data);
export const adminSaveAccreditation = (data, id) => api.post(`/admin/accreditations${id ? `/${id}` : ''}`, data).then(r => r.data);
export const adminDeleteAccreditation = (id) => api.delete(`/admin/accreditations/${id}`).then(r => r.data);
export const adminToggleAccreditation = (id) => api.patch(`/admin/accreditations/${id}/toggle`).then(r => r.data);

// Admin Team
export const adminGetTeam = () => api.get('/admin/team').then(r => r.data.data);
export const adminSaveTeam = (data, id) => api.post(`/admin/team${id ? `/${id}` : ''}`, data).then(r => r.data);
export const adminDeleteTeam = (id) => api.delete(`/admin/team/${id}`).then(r => r.data);

// Admin FAQs
export const adminGetFaqs = (track = 'all') => api.get(`/admin/faqs?track=${track}`).then(r => r.data.data);
export const adminSaveFaq = (data, id) => api.post(`/admin/faqs${id ? `/${id}` : ''}`, data).then(r => r.data);
export const adminDeleteFaq = (id) => api.delete(`/admin/faqs/${id}`).then(r => r.data);
export const adminToggleFaq = (id) => api.patch(`/admin/faqs/${id}/toggle`).then(r => r.data);

// Admin Legal
export const adminGetLegal = () => api.get('/admin/legal').then(r => r.data.data);
export const adminSaveLegal = (key, data) => api.put(`/admin/legal/${key}`, data).then(r => r.data);

// File Upload
export const adminUploadFile = (formData) => api.post('/admin/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
}).then(r => r.data);

export default api;

