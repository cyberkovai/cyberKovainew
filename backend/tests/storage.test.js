import { describe, it } from 'node:test';
import assert from 'node:assert';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { storageService } from '../src/services/storageService.js';

process.env.NODE_ENV = 'test';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

describe('Storage & CRUD Operations Test Suite', () => {
  it('should load site settings with expected defaults', async () => {
    const settings = await storageService.getSettings();
    assert.ok(settings.site_name, 'Site name should exist');
    assert.ok(settings.site_email, 'Site email should exist');
    assert.ok(settings.site_phone, 'Site phone should exist');
  });

  it('should create, read, update, and delete a Cyber Service', async () => {
    const testSlug = 'automated-test-cloud-posture';
    const initialData = {
      slug: testSlug,
      title: 'Automated Test Cloud Posture',
      category: 'cloud-security',
      badge: 'TEST',
      tagline: 'Automated test suite service verification',
      short_desc: 'Comprehensive cloud security posture assessment.',
      status: 'active',
    };

    // Create
    const saved = await storageService.saveCyberService(initialData);
    assert.strictEqual(saved.slug, testSlug);

    // Read
    const retrieved = await storageService.getCyberService(testSlug);
    assert.ok(retrieved);
    assert.strictEqual(retrieved.title, 'Automated Test Cloud Posture');

    // Update
    const updated = await storageService.saveCyberService({
      ...retrieved,
      title: 'Updated Cloud Posture',
    }, testSlug);
    assert.strictEqual(updated.title, 'Updated Cloud Posture');

    // Delete
    const deleted = await storageService.deleteCyberService(testSlug);
    assert.strictEqual(deleted, true);

    const postDelete = await storageService.getCyberService(testSlug);
    assert.strictEqual(postDelete, null);
  });

  it('should create, toggle status, and delete a Core Practice', async () => {
    const testId = 'test-practice-zero-trust';
    const practiceData = {
      id: testId,
      title: 'Automated Test Practice',
      slug: 'test-practice',
      tag: 'AUTOMATION',
      code: 'TEST-01',
      badge: 'TESTING',
      order: 99,
      status: 'active',
      active: true,
    };

    const saved = await storageService.saveCyberPractice(practiceData, testId);
    assert.strictEqual(saved.id, testId);
    assert.strictEqual(saved.status, 'active');

    // Toggle status
    const toggled = await storageService.toggleCyberPracticeStatus(testId);
    assert.strictEqual(toggled.status, 'inactive');
    assert.strictEqual(toggled.active, false);

    // Delete
    await storageService.deleteCyberPractice(testId);
    const all = await storageService.getCyberPractices(true);
    const found = all.find(p => p.id === testId);
    assert.strictEqual(found, undefined);
  });

  it('should create, toggle, and delete an Investigation Threat', async () => {
    const threatData = {
      name: 'Automated Test Ransomware Threat',
      text: 'Automated Test Ransomware Threat',
      size: 'lg',
      accent: 'rose',
      order: 100,
      status: 'active',
    };

    const saved = await storageService.saveInvestigationThreat(threatData);
    assert.ok(saved.id);
    assert.strictEqual(saved.accent, 'rose');

    // Toggle
    const toggled = await storageService.toggleInvestigationThreatStatus(saved.id);
    assert.strictEqual(toggled.status, 'inactive');

    // Delete
    await storageService.deleteInvestigationThreat(saved.id);
    const list = await storageService.getInvestigationThreats(true);
    assert.strictEqual(list.some(t => t.id === saved.id), false);
  });

  it('should create, filter by track, and delete an FAQ', async () => {
    const faqData = {
      id: 'test-faq-track-filter',
      question: 'What is automated testing?',
      answer: 'Automated testing executes test suites programmatically.',
      category: 'General',
      track: 'cyber',
      status: 'active',
      order: 50,
    };

    await storageService.saveFaq(faqData, faqData.id);

    const cyberFaqs = await storageService.getFaqs('cyber', true);
    assert.ok(cyberFaqs.some(f => f.id === faqData.id));

    const invFaqs = await storageService.getFaqs('investigation', true);
    assert.strictEqual(invFaqs.some(f => f.id === faqData.id), false, 'Cyber FAQ must not appear under investigation track');

    await storageService.deleteFaq(faqData.id);
  });

  it('should persist leads reliably in local storage', async () => {
    const leadPayload = {
      name: 'Automated Test Lead',
      email: 'lead.tester@example.com',
      phone: '+919999988888',
      service: 'Vulnerability Assessment & Penetration Testing (VAPT)',
      message: 'This is an automated integration test lead.',
    };

    const saved = await storageService.saveLead(leadPayload);
    assert.ok(saved.id);
    assert.strictEqual(saved.name, leadPayload.name);
    assert.strictEqual(saved.email, leadPayload.email);

    const leads = await storageService.getLeads();
    const found = leads.find(l => l.id === saved.id);
    assert.ok(found, 'Lead must be found in stored leads list');
  });
});
