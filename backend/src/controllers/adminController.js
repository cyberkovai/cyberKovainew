import { storageService } from '../services/storageService.js';

export const adminController = {
  // DASHBOARD STATS
  async getDashboardStats(req, res) {
    try {
      const cyberServices = await storageService.getCyberServices(true);
      const invServices = await storageService.getInvestigationServices(true);
      const testimonials = await storageService.getTestimonials(true);
      const team = await storageService.getTeamMembers(true);
      const clients = await storageService.getClients('all', true);
      const accreditations = await storageService.getAccreditations('all', true);
      const faqs = await storageService.getFaqs('all', true);
      const threats = await storageService.getInvestigationThreats(true);
      const practices = await storageService.getCyberPractices(true);

      return res.json({
        success: true,
        data: {
          cyber_services_count: Object.keys(cyberServices).length,
          inv_services_count: invServices.length,
          testimonials_count: testimonials.length,
          team_count: team.length,
          clients_count: clients.length,
          accreditations_count: accreditations.length,
          faqs_count: faqs.length,
          threats_count: threats.length,
          practices_count: practices.length,
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // SETTINGS
  async updateSettings(req, res) {
    try {
      const updated = await storageService.updateSettings(req.body);
      await storageService.addAuditLog(req.user.username, 'settings_updated', req.body, req.ip, req.headers['user-agent']);
      return res.json({ success: true, message: 'Site settings updated successfully.', data: updated });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // SECTION VISIBILITY
  async updateSectionVisibility(req, res) {
    try {
      const updated = await storageService.updateSectionVisibility(req.body);
      await storageService.addAuditLog(req.user.username, 'section_visibility_updated', req.body, req.ip, req.headers['user-agent']);
      return res.json({ success: true, message: 'Section visibility updated successfully.', data: updated });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // CYBER SERVICES
  async getCyberServices(req, res) {
    try {
      const services = await storageService.getCyberServices(true);
      return res.json({ success: true, data: services });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async saveCyberService(req, res) {
    try {
      const originalSlug = req.query.originalSlug || req.body.originalSlug || null;
      const saved = await storageService.saveCyberService(req.body, originalSlug);
      await storageService.addAuditLog(req.user.username, 'cyber_service_saved', { slug: saved.slug }, req.ip, req.headers['user-agent']);
      return res.json({ success: true, message: 'Cyber service saved successfully.', data: saved });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async deleteCyberService(req, res) {
    try {
      const { slug } = req.params;
      const success = await storageService.deleteCyberService(slug);
      if (!success) return res.status(404).json({ success: false, message: 'Service not found.' });
      await storageService.addAuditLog(req.user.username, 'cyber_service_deleted', { slug }, req.ip, req.headers['user-agent']);
      return res.json({ success: true, message: 'Cyber service deleted successfully.' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // CORE PRACTICES
  async getCyberPractices(req, res) {
    try {
      const practices = await storageService.getCyberPractices(true);
      const settings = await storageService.getCyberPracticesSettings();
      return res.json({ success: true, data: { practices, settings } });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async saveCyberPractice(req, res) {
    try {
      const id = req.params.id || req.body.id || null;
      const saved = await storageService.saveCyberPractice(req.body, id);
      await storageService.addAuditLog(req.user.username, 'cyber_practice_saved', { id: saved.id }, req.ip, req.headers['user-agent']);
      return res.json({ success: true, message: 'Practice saved successfully.', data: saved });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async deleteCyberPractice(req, res) {
    try {
      const { id } = req.params;
      await storageService.deleteCyberPractice(id);
      await storageService.addAuditLog(req.user.username, 'cyber_practice_deleted', { id }, req.ip, req.headers['user-agent']);
      return res.json({ success: true, message: 'Practice deleted successfully.' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async toggleCyberPractice(req, res) {
    try {
      const { id } = req.params;
      const updated = await storageService.toggleCyberPracticeStatus(id);
      return res.json({ success: true, message: 'Practice status updated.', data: updated });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async updateCyberPracticesSettings(req, res) {
    try {
      const updated = await storageService.saveCyberPracticesSettings(req.body);
      await storageService.addAuditLog(req.user.username, 'cyber_practices_settings_updated', req.body, req.ip, req.headers['user-agent']);
      return res.json({ success: true, message: 'Section settings updated successfully.', data: updated });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // INVESTIGATION SERVICES
  async getInvestigationServices(req, res) {
    try {
      const services = await storageService.getInvestigationServices(true);
      return res.json({ success: true, data: services });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async saveInvestigationService(req, res) {
    try {
      const originalSlug = req.query.originalSlug || req.body.originalSlug || null;
      const saved = await storageService.saveInvestigationService(req.body, originalSlug);
      await storageService.addAuditLog(req.user.username, 'investigation_service_saved', { slug: saved.slug }, req.ip, req.headers['user-agent']);
      return res.json({ success: true, message: 'Investigation service saved successfully.', data: saved });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async deleteInvestigationService(req, res) {
    try {
      const { slug } = req.params;
      await storageService.deleteInvestigationService(slug);
      await storageService.addAuditLog(req.user.username, 'investigation_service_deleted', { slug }, req.ip, req.headers['user-agent']);
      return res.json({ success: true, message: 'Investigation service deleted successfully.' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async toggleInvestigationService(req, res) {
    try {
      const { slug } = req.params;
      const updated = await storageService.toggleInvestigationServiceStatus(slug);
      return res.json({ success: true, message: 'Investigation service status updated.', data: updated });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // THREATS
  async getThreats(req, res) {
    try {
      const threats = await storageService.getInvestigationThreats(true);
      return res.json({ success: true, data: threats });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async saveThreat(req, res) {
    try {
      const id = req.params.id || req.body.id || null;
      const saved = await storageService.saveInvestigationThreat(req.body, id);
      return res.json({ success: true, message: 'Threat saved successfully.', data: saved });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async deleteThreat(req, res) {
    try {
      const { id } = req.params;
      await storageService.deleteInvestigationThreat(id);
      return res.json({ success: true, message: 'Threat deleted successfully.' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async toggleThreat(req, res) {
    try {
      const { id } = req.params;
      const updated = await storageService.toggleInvestigationThreatStatus(id);
      return res.json({ success: true, message: 'Threat status updated.', data: updated });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // TESTIMONIALS
  async getTestimonials(req, res) {
    try {
      const testimonials = await storageService.getTestimonials(true);
      return res.json({ success: true, data: testimonials });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async saveTestimonial(req, res) {
    try {
      const id = req.params.id || req.body.id || null;
      const saved = await storageService.saveTestimonial(req.body, id);
      return res.json({ success: true, message: 'Testimonial saved successfully.', data: saved });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async deleteTestimonial(req, res) {
    try {
      const { id } = req.params;
      await storageService.deleteTestimonial(id);
      return res.json({ success: true, message: 'Testimonial deleted successfully.' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async toggleTestimonial(req, res) {
    try {
      const { id } = req.params;
      const updated = await storageService.toggleTestimonialStatus(id);
      return res.json({ success: true, message: 'Testimonial status updated.', data: updated });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // CLIENTS
  async getClients(req, res) {
    try {
      const track = req.query.track || 'all';
      const clients = await storageService.getClients(track, true);
      return res.json({ success: true, data: clients });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async saveClient(req, res) {
    try {
      const id = req.params.id || req.body.id || null;
      const saved = await storageService.saveClient(req.body, id);
      return res.json({ success: true, message: 'Client saved successfully.', data: saved });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async deleteClient(req, res) {
    try {
      const { id } = req.params;
      await storageService.deleteClient(id);
      return res.json({ success: true, message: 'Client deleted successfully.' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async toggleClient(req, res) {
    try {
      const { id } = req.params;
      const updated = await storageService.toggleClientStatus(id);
      return res.json({ success: true, message: 'Client status updated.', data: updated });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // ACCREDITATIONS
  async getAccreditations(req, res) {
    try {
      const accreditations = await storageService.getAccreditations('all', true);
      return res.json({ success: true, data: accreditations });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async saveAccreditation(req, res) {
    try {
      const id = req.params.id || req.body.id || null;
      const saved = await storageService.saveAccreditation(req.body, id);
      return res.json({ success: true, message: 'Accreditation saved successfully.', data: saved });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async deleteAccreditation(req, res) {
    try {
      const { id } = req.params;
      await storageService.deleteAccreditation(id);
      return res.json({ success: true, message: 'Accreditation deleted successfully.' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async toggleAccreditation(req, res) {
    try {
      const { id } = req.params;
      const updated = await storageService.toggleAccreditationStatus(id);
      return res.json({ success: true, message: 'Accreditation status updated.', data: updated });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // TEAM
  async getTeam(req, res) {
    try {
      const team = await storageService.getTeamMembers(true);
      return res.json({ success: true, data: team });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async saveTeamMember(req, res) {
    try {
      const id = req.params.id || req.body.id || null;
      const saved = await storageService.saveTeamMember(req.body, id);
      return res.json({ success: true, message: 'Team member saved successfully.', data: saved });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async deleteTeamMember(req, res) {
    try {
      const { id } = req.params;
      await storageService.deleteTeamMember(id);
      return res.json({ success: true, message: 'Team member deleted successfully.' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // FAQS
  async getFaqs(req, res) {
    try {
      const track = req.query.track || 'all';
      const faqs = await storageService.getFaqs(track, true);
      return res.json({ success: true, data: faqs });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async saveFaq(req, res) {
    try {
      const id = req.params.id || req.body.id || null;
      const saved = await storageService.saveFaq(req.body, id);
      return res.json({ success: true, message: 'FAQ saved successfully.', data: saved });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async deleteFaq(req, res) {
    try {
      const { id } = req.params;
      await storageService.deleteFaq(id);
      return res.json({ success: true, message: 'FAQ deleted successfully.' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async toggleFaq(req, res) {
    try {
      const { id } = req.params;
      const updated = await storageService.toggleFaqStatus(id);
      return res.json({ success: true, message: 'FAQ status updated.', data: updated });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // LEGAL POLICIES
  async getLegalPolicies(req, res) {
    try {
      const policies = await storageService.getLegalPolicies();
      return res.json({ success: true, data: policies });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async saveLegalPolicy(req, res) {
    try {
      const { key } = req.params;
      const saved = await storageService.saveLegalPolicy(key, req.body);
      await storageService.addAuditLog(req.user.username, 'legal_policy_saved', { key }, req.ip, req.headers['user-agent']);
      return res.json({ success: true, message: 'Legal policy saved successfully.', data: saved });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // FILE UPLOAD (Single image)
  async uploadFile(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded.' });
      }
      const prefix = req.body.prefix || 'img';
      const fileUrl = await storageService.handleFileUpload(req.file, prefix);
      return res.json({
        success: true,
        message: 'File uploaded successfully.',
        url: fileUrl,
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },
};

