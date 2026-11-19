process.env.NODE_ENV = 'test';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { EventEmitter } from 'node:events';
import serverApp from '../src/server.js';
import apiIndexApp from '../api/index.js';
import apiCatchAllApp from '../api/[...all].js';

describe('Vercel Routing, Serverless Exports & CORS Preflight Test Suite', () => {
  it('should verify all serverless entrypoints export the same Express application', () => {
    assert.strictEqual(typeof serverApp, 'function', 'server.js must export an Express app');
    assert.strictEqual(apiIndexApp, serverApp, 'api/index.js must export the exact serverApp instance');
    assert.strictEqual(apiCatchAllApp, serverApp, 'api/[...all].js must export the exact serverApp instance');
  });

  // Direct Express dispatch without TCP socket / sandbox port binding restrictions
  const dispatch = (app, { method = 'GET', url = '/', headers = {}, body = null }) => {
    return new Promise((resolve) => {
      const req = new EventEmitter();
      req.method = method;
      req.url = url;
      req.headers = Object.fromEntries(
        Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])
      );
      req.connection = { remoteAddress: '127.0.0.1' };
      req.socket = req.connection;

      const res = new EventEmitter();
      res.statusCode = 200;
      res._headers = {};
      res.setHeader = (key, val) => {
        res._headers[key.toLowerCase()] = val;
      };
      res.getHeader = (key) => res._headers[key.toLowerCase()];
      res.removeHeader = (key) => {
        delete res._headers[key.toLowerCase()];
      };

      let responseBody = '';
      res.write = (chunk) => {
        if (chunk) responseBody += chunk.toString();
        return true;
      };
      res.end = (chunk) => {
        if (chunk) responseBody += chunk.toString();
        resolve({
          statusCode: res.statusCode,
          headers: res._headers,
          body: responseBody,
          json: () => {
            try { return JSON.parse(responseBody); } catch { return null; }
          },
        });
      };

      app.handle(req, res);

      if (body) {
        req.emit('data', Buffer.from(typeof body === 'string' ? body : JSON.stringify(body)));
      }
      req.emit('end');
    });
  };

  it('GET /health should return HTTP 200 OK with service info', async () => {
    const res = await dispatch(serverApp, {
      method: 'GET',
      url: '/health',
    });
    assert.strictEqual(res.statusCode, 200);
    const data = res.json();
    assert.ok(data);
    assert.strictEqual(data.status, 'ok');
    assert.strictEqual(data.service, 'Cyber Kovai API');
  });

  it('GET / should return HTTP 200 OK root endpoint', async () => {
    const res = await dispatch(serverApp, {
      method: 'GET',
      url: '/',
    });
    assert.strictEqual(res.statusCode, 200);
    const data = res.json();
    assert.ok(data);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.message, 'Cyber Kovai API is running');
  });

  it('GET /api should return HTTP 200 OK API discovery route', async () => {
    const res = await dispatch(serverApp, {
      method: 'GET',
      url: '/api',
    });
    assert.strictEqual(res.statusCode, 200);
    const data = res.json();
    assert.ok(data);
    assert.strictEqual(data.success, true);
    assert.ok(data.endpoints);
  });

  it('OPTIONS /api/auth/login preflight from https://cyberkovai.com should return HTTP 204 and required CORS headers', async () => {
    const res = await dispatch(serverApp, {
      method: 'OPTIONS',
      url: '/api/auth/login',
      headers: {
        Origin: 'https://cyberkovai.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
    });

    assert.strictEqual(res.statusCode, 204, `Expected 204 but received ${res.statusCode}`);
    assert.strictEqual(
      res.headers['access-control-allow-origin'],
      'https://cyberkovai.com'
    );
    assert.ok(res.headers['access-control-allow-methods'].includes('POST'));
    assert.ok(res.headers['access-control-allow-methods'].includes('OPTIONS'));
    assert.ok(res.headers['access-control-allow-methods'].includes('GET'));
    assert.ok(res.headers['access-control-allow-headers'].toLowerCase().includes('content-type'));
    assert.ok(res.headers['access-control-allow-headers'].toLowerCase().includes('authorization'));
    assert.strictEqual(res.headers['access-control-allow-credentials'], 'true');
  });

  it('OPTIONS /api/auth/login preflight from https://www.cyberkovai.com should return HTTP 204 and required CORS headers', async () => {
    const res = await dispatch(serverApp, {
      method: 'OPTIONS',
      url: '/api/auth/login',
      headers: {
        Origin: 'https://www.cyberkovai.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
    });

    assert.strictEqual(res.statusCode, 204, `Expected 204 but received ${res.statusCode}`);
    assert.strictEqual(
      res.headers['access-control-allow-origin'],
      'https://www.cyberkovai.com'
    );
    assert.strictEqual(res.headers['access-control-allow-credentials'], 'true');
  });

  it('OPTIONS /api/auth/login preflight from GitHub Pages origin should return HTTP 204 and required CORS headers', async () => {
    const res = await dispatch(serverApp, {
      method: 'OPTIONS',
      url: '/api/auth/login',
      headers: {
        Origin: 'https://cyberkovai.github.io',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
    });

    assert.strictEqual(res.statusCode, 204, `Expected 204 but received ${res.statusCode}`);
    assert.strictEqual(
      res.headers['access-control-allow-origin'],
      'https://cyberkovai.github.io'
    );
    assert.ok(res.headers['access-control-allow-methods'].includes('POST'));
    assert.ok(res.headers['access-control-allow-methods'].includes('OPTIONS'));
    assert.strictEqual(res.headers['access-control-allow-credentials'], 'true');
  });

  it('OPTIONS /api/auth/login preflight from local Vite dev origin should return HTTP 204', async () => {
    const res = await dispatch(serverApp, {
      method: 'OPTIONS',
      url: '/api/auth/login',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
    });

    assert.strictEqual(res.statusCode, 204, `Expected 204 but received ${res.statusCode}`);
    assert.strictEqual(
      res.headers['access-control-allow-origin'],
      'http://localhost:5173'
    );
  });

  it('POST /api/auth/login from https://cyberkovai.com should include CORS headers in the actual response', async () => {
    const res = await dispatch(serverApp, {
      method: 'POST',
      url: '/api/auth/login',
      headers: {
        Origin: 'https://cyberkovai.com',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'wrong-user',
        password: 'wrong-password',
      }),
    });

    // Request returns 400 or 401, and CORS headers MUST be present!
    assert.ok(res.statusCode === 400 || res.statusCode === 401, `Unexpected status: ${res.statusCode}`);
    assert.strictEqual(
      res.headers['access-control-allow-origin'],
      'https://cyberkovai.com'
    );
    assert.strictEqual(res.headers['access-control-allow-credentials'], 'true');
    assert.notStrictEqual(res.headers['access-control-allow-origin'], '*');
  });

  it('CORS should reject unauthorized origins with HTTP 403', async () => {
    const res = await dispatch(serverApp, {
      method: 'OPTIONS',
      url: '/api/auth/login',
      headers: {
        Origin: 'https://malicious-attacker-domain.com',
        'Access-Control-Request-Method': 'POST',
      },
    });

    assert.strictEqual(res.statusCode, 403);
    const data = res.json();
    assert.ok(data);
    assert.strictEqual(data.success, false);
    assert.ok(data.message.includes('CORS origin not allowed'));
  });

  it('CORS should allow dynamic comma-separated FRONTEND_URL origins', async () => {
    const originalFrontendUrl = process.env.FRONTEND_URL;
    process.env.FRONTEND_URL = 'https://preview-1.example.com, https://preview-2.example.com/';
    try {
      const res = await dispatch(serverApp, {
        method: 'OPTIONS',
        url: '/api/auth/login',
        headers: {
          Origin: 'https://preview-1.example.com',
          'Access-Control-Request-Method': 'POST',
        },
      });

      assert.strictEqual(res.statusCode, 204);
      assert.strictEqual(
        res.headers['access-control-allow-origin'],
        'https://preview-1.example.com'
      );
    } finally {
      process.env.FRONTEND_URL = originalFrontendUrl;
    }
  });

  it('OPTIONS /api/services/cyber preflight from GitHub Pages should succeed with HTTP 204', async () => {
    const res = await dispatch(serverApp, {
      method: 'OPTIONS',
      url: '/api/services/cyber',
      headers: {
        Origin: 'https://cyberkovai.github.io',
        'Access-Control-Request-Method': 'GET',
      },
    });

    assert.strictEqual(res.statusCode, 204, `Expected 204 but got ${res.statusCode}`);
    assert.strictEqual(
      res.headers['access-control-allow-origin'],
      'https://cyberkovai.github.io'
    );
  });
});
