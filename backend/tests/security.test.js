import { describe, it } from 'node:test';
import assert from 'node:assert';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { rateLimiter, clearRateLimits } from '../src/middleware/rateLimiter.js';
import { storageService } from '../src/services/storageService.js';

process.env.NODE_ENV = 'test';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

describe('Security & Vulnerability Test Suite', () => {
  it('should enforce rate limits and block excessive requests with HTTP 429', () => {
    clearRateLimits();
    const limiter = rateLimiter({ maxAttempts: 3, windowMs: 60000 });
    const dummyReq = { ip: '192.168.1.100', path: '/test-endpoint', baseUrl: '/api' };

    let statusCode = null;
    let responseBody = null;
    const dummyRes = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        responseBody = data;
        return this;
      },
    };

    // Attempts 1, 2, 3 should pass
    let calledNext = 0;
    const next = () => { calledNext++; };

    limiter(dummyReq, dummyRes, next);
    limiter(dummyReq, dummyRes, next);
    limiter(dummyReq, dummyRes, next);
    assert.strictEqual(calledNext, 3, 'First 3 requests should pass');

    // Attempt 4 should be rate limited
    limiter(dummyReq, dummyRes, next);
    assert.strictEqual(statusCode, 429, '4th request must receive HTTP 429');
    assert.strictEqual(responseBody.success, false);
    assert.match(responseBody.message, /Too many attempts/);

    clearRateLimits();
  });

  it('should prevent SQL Injection payloads from corrupting storage queries', async () => {
    const maliciousSlug = "test' OR '1'='1; DROP TABLE settings; --";
    const result = await storageService.getCyberService(maliciousSlug);
    assert.strictEqual(result, null, 'SQL injection string must not match or execute');

    // Verify settings still intact
    const settings = await storageService.getSettings();
    assert.ok(settings.site_name, 'Settings table/file must remain untouched');
  });

  it('should safely record audit log entries with client metadata', async () => {
    const logItem = await storageService.addAuditLog(
      'security_test_admin',
      'automated_security_probe',
      { probe: 'xss_sql_audit_test' },
      '127.0.0.1',
      'Node.js Test Runner'
    );

    assert.ok(logItem.created_at);
    assert.strictEqual(logItem.admin_id, 'security_test_admin');
    assert.strictEqual(logItem.action, 'automated_security_probe');
  });
});
