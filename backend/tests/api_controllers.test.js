import { describe, it } from 'node:test';
import assert from 'node:assert';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { publicController } from '../src/controllers/publicController.js';
import { authController } from '../src/controllers/authController.js';
import { adminController } from '../src/controllers/adminController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
process.env.NODE_ENV = 'test';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

function createMockRes() {
  return {
    statusCode: 200,
    body: null,
    cookies: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    cookie(name, val) {
      this.cookies[name] = val;
      return this;
    },
    clearCookie(name) {
      delete this.cookies[name];
      return this;
    },
  };
}

describe('Controllers & API Business Logic Integration Test Suite', () => {
  let adminSessionUser = null;

  it('publicController.getSettings returns site configuration', async () => {
    const req = {};
    const res = createMockRes();
    await publicController.getSettings(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.site_name);
  });

  it('publicController.getSectionVisibility returns section map', async () => {
    const req = {};
    const res = createMockRes();
    await publicController.getSectionVisibility(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(typeof res.body.data === 'object');
  });

  it('publicController.getCyberServices returns active services', async () => {
    const req = {};
    const res = createMockRes();
    await publicController.getCyberServices(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Object.keys(res.body.data).length > 0);
  });

  it('publicController.getInvestigationServices returns investigation list', async () => {
    const req = {};
    const res = createMockRes();
    await publicController.getInvestigationServices(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
  });

  it('publicController.getCyberPractices returns practices and settings', async () => {
    const req = {};
    const res = createMockRes();
    await publicController.getCyberPractices(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.practices));
    assert.ok(res.body.data.settings);
  });

  it('publicController.getInvestigationThreats returns threat tags', async () => {
    const req = {};
    const res = createMockRes();
    await publicController.getInvestigationThreats(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
  });

  it('publicController.getFaqs returns FAQs filtered by track', async () => {
    const req = { query: { track: 'cyber' } };
    const res = createMockRes();
    await publicController.getFaqs(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
  });

  it('authController.login rejects bad credentials with 401', async () => {
    const req = {
      body: { username: 'Kovaicyber@gmail.com', password: 'InvalidPasswordXYZ!' },
      ip: '127.0.0.1',
      headers: {},
    };
    const res = createMockRes();
    await authController.login(req, res);
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.success, false);
  });

  it('authController.login successfully authenticates master admin and sets cookie', async () => {
    const req = {
      body: { username: 'Kovaicyber@gmail.com', password: 'CyberKovai@2026' },
      ip: '127.0.0.1',
      headers: {},
    };
    const res = createMockRes();
    await authController.login(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.token, 'Token must be present in response');
    assert.ok(res.cookies.ck_admin_token, 'Cookie must be set');
    assert.strictEqual(res.body.user.role, 'superadmin');
    adminSessionUser = res.body.user;
  });

  it('adminController.getDashboardStats returns valid aggregate metrics', async () => {
    const req = { user: adminSessionUser };
    const res = createMockRes();
    await adminController.getDashboardStats(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.cyber_services_count >= 0);
    assert.ok(res.body.data.inv_services_count >= 0);
  });

  it('publicController.processContact handles confidential contact submissions', async () => {
    const orig = process.env.ENABLE_RECAPTCHA;
    process.env.ENABLE_RECAPTCHA = 'false';

    const req = {
      body: {
        name: 'Enterprise Client Representative',
        email: 'representative@corp.com',
        phone: '+91 91234 56789',
        service: 'Application Security / VAPT',
        message: 'Requesting confidential cyber security assessment.',
      },
      ip: '127.0.0.1',
    };
    const res = createMockRes();
    await publicController.processContact(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);

    process.env.ENABLE_RECAPTCHA = orig;
  });

  it('authController.logout clears authentication cookies', () => {
    const req = {};
    const res = createMockRes();
    res.cookies.ck_admin_token = 'sample-token';
    authController.logout(req, res);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.cookies.ck_admin_token, undefined);
  });
});
