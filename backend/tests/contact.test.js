import { describe, it } from 'node:test';
import assert from 'node:assert';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { contactService } from '../src/services/contactService.js';

process.env.NODE_ENV = 'test';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

describe('Contact Form & Lead Processing Test Suite', () => {
  it('should detect and reject bot submissions using hidden honeypot fields', async () => {
    const honeypotSubmission = {
      name: 'Spam Bot',
      email: 'bot@spam.com',
      phone: '+1234567890',
      service: 'General Cyber Security Consultation',
      message: 'Spam message content',
      website: 'http://spam-link.com', // Filled honeypot
    };

    const res = await contactService.processContact(honeypotSubmission, '127.0.0.1');
    assert.strictEqual(res.success, false);
    assert.match(res.message, /spam/i);
  });

  it('should validate required fields and reject empty submissions', async () => {
    const emptySubmission = {};
    const res = await contactService.processContact(emptySubmission, '127.0.0.1');
    assert.strictEqual(res.success, false);
    assert.match(res.message, /name/i);
  });

  it('should reject invalid email formats', async () => {
    const invalidEmail = {
      name: 'John Doe',
      email: 'not-an-email',
      phone: '+919876543210',
      service: 'General Cyber Security Consultation',
      message: 'Valid message body here.',
    };

    const res = await contactService.processContact(invalidEmail, '127.0.0.1');
    assert.strictEqual(res.success, false);
    assert.match(res.message, /valid email/i);
  });

  it('should reject phone numbers that are too short or invalid', async () => {
    const shortPhone = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '123',
      service: 'General Cyber Security Consultation',
      message: 'Valid message body here.',
    };

    const res = await contactService.processContact(shortPhone, '127.0.0.1');
    assert.strictEqual(res.success, false);
    assert.match(res.message, /valid contact number/i);
  });

  it('should require custom specification when service is "Other"', async () => {
    const otherServiceNoDetail = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+919876543210',
      service: 'Other',
      service_other: '',
      message: 'Valid message body here.',
    };

    const res = await contactService.processContact(otherServiceNoDetail, '127.0.0.1');
    assert.strictEqual(res.success, false);
    assert.match(res.message, /specify the service/i);
  });

  it('should accept valid submissions and safely persist them locally', async () => {
    // Note: without reCAPTCHA tokens in automated test, tests verify field sanitization and persistence
    // Disable reCAPTCHA momentarily for test context if enabled
    const origRecaptcha = process.env.ENABLE_RECAPTCHA;
    process.env.ENABLE_RECAPTCHA = 'false';

    const validSubmission = {
      name: 'Security Lead Specialist',
      email: 'security.lead@example.com',
      phone: '+91 98765 43210',
      service: 'Pre Matrimonial Screening',
      message: 'Confidential investigation request regarding digital footprints.',
    };

    const res = await contactService.processContact(validSubmission, '127.0.0.1');
    assert.strictEqual(res.success, true);
    assert.match(res.message, /received and recorded/i);

    process.env.ENABLE_RECAPTCHA = origRecaptcha;
  });
});
