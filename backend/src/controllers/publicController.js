import { storageService } from '../services/storageService.js';
import { contactService } from '../services/contactService.js';

export const publicController = {
  async getSettings(req, res) {
    try {
      const settings = await storageService.getSettings();
      return res.json({ success: true, data: settings });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async getSectionVisibility(req, res) {
    try {
      const sections = await storageService.getSectionVisibility();
      return res.json({ success: true, data: sections });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async getCyberCategories(req, res) {
    try {
      const categories = await storageService.getCyberCategories();
      return res.json({ success: true, data: categories });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async getCyberServices(req, res) {
    try {
      const services = await storageService.getCyberServices(false);
      return res.json({ success: true, data: services });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async getCyberServiceBySlug(req, res) {
    try {
      const service = await storageService.getCyberService(req.params.slug);
      if (!service) {
        return res.status(404).json({ success: false, message: 'Service not found.' });
      }
      return res.json({ success: true, data: service });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async getCyberPractices(req, res) {
    try {
      const settings = await storageService.getCyberPracticesSettings();
      const practices = await storageService.getCyberPractices(false);
      return res.json({ success: true, data: { settings, practices } });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async getInvestigationServices(req, res) {
    try {
      const services = await storageService.getInvestigationServices(false);
      return res.json({ success: true, data: services });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async getInvestigationServiceBySlug(req, res) {
    try {
      const service = await storageService.getInvestigationService(req.params.slug);
      if (!service) {
        return res.status(404).json({ success: false, message: 'Investigation service not found.' });
      }
      return res.json({ success: true, data: service });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async getFullServiceBySlug(req, res) {
    try {
      const data = await storageService.getFullService(req.params.slug);
      if (!data) {
        return res.status(404).json({ success: false, message: 'Service not found.' });
      }
      return res.json({ success: true, data });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async getRecaptchaConfig(req, res) {
    try {
      const enabled = String(process.env.ENABLE_RECAPTCHA).toLowerCase() === 'true';
      const siteKey = process.env.RECAPTCHA_SITE_KEY || '6LfIJwYuAAAAAGqRA8w9Y_gV0Dg13VyMmKtIB36q';
      return res.json({ success: true, data: { enabled, siteKey } });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async getInvestigationThreats(req, res) {
    try {
      const threats = await storageService.getInvestigationThreats(false);
      return res.json({ success: true, data: threats });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async getTestimonials(req, res) {
    try {
      const testimonials = await storageService.getTestimonials(false);
      return res.json({ success: true, data: testimonials });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async getClients(req, res) {
    try {
      const track = req.query.track || 'all';
      const clients = await storageService.getClients(track, false);
      return res.json({ success: true, data: clients });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async getAccreditations(req, res) {
    try {
      const track = req.query.track || 'all';
      const accreditations = await storageService.getAccreditations(track, false);
      return res.json({ success: true, data: accreditations });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async getTeam(req, res) {
    try {
      const team = await storageService.getTeamMembers(false);
      return res.json({ success: true, data: team });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async getFaqs(req, res) {
    try {
      const track = req.query.track || 'all';
      const faqs = await storageService.getFaqs(track, false);
      return res.json({ success: true, data: faqs });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async getLegalPolicies(req, res) {
    try {
      const policies = await storageService.getLegalPolicies();
      return res.json({ success: true, data: policies });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async getLegalPolicyByKey(req, res) {
    try {
      const policy = await storageService.getLegalPolicy(req.params.key);
      if (!policy) {
        return res.status(404).json({ success: false, message: 'Policy not found.' });
      }
      return res.json({ success: true, data: policy });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async processContact(req, res) {
    try {
      const clientIp = req.ip || req.connection.remoteAddress || '';
      const result = await contactService.processContact(req.body, clientIp);
      if (!result.success) {
        return res.status(400).json(result);
      }
      return res.json(result);
    } catch (err) {
      console.error('Contact error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error processing contact.' });
    }
  },
};

