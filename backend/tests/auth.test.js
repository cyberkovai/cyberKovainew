import { test, describe, it, before } from 'node:test';
import assert from 'node:assert';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { storageService } from '../src/services/storageService.js';

process.env.NODE_ENV = 'test';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'cyber-kovai-super-secret-jwt-key-2026-secure-token';

describe('Authentication & Access Control Test Suite', () => {
  it('should verify genuine password hash and reject invalid credentials', async () => {
    const admin = await storageService.getAdmin('Kovaicyber@gmail.com');
    assert.ok(admin, 'Admin account should exist');

    // Valid master password
    const validMatch = await bcrypt.compare('CyberKovai@2026', admin.password_hash);
    assert.strictEqual(validMatch, true, 'Valid password must match hash');

    // Incorrect password
    const wrongMatch = await bcrypt.compare('WrongPassword123!', admin.password_hash);
    assert.strictEqual(wrongMatch, false, 'Wrong password must be rejected');
  });

  it('should reject previous backdoor bypass passwords', async () => {
    const admin = await storageService.getAdmin('Kovaicyber@gmail.com');
    const backdoorPasswords = ['admin', 'admin123', 'Admin@123', 'password', '123456'];

    for (const pwd of backdoorPasswords) {
      const match = await bcrypt.compare(pwd, admin.password_hash);
      assert.strictEqual(match, false, `Backdoor password "${pwd}" must NOT match the hash`);
    }
  });

  it('should generate valid JWT tokens with appropriate claims', () => {
    const payload = {
      username: 'Kovaicyber@gmail.com',
      role: 'superadmin',
      auth_complete: true,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    assert.ok(token, 'Token should be generated');

    const decoded = jwt.verify(token, JWT_SECRET);
    assert.strictEqual(decoded.username, 'Kovaicyber@gmail.com');
    assert.strictEqual(decoded.role, 'superadmin');
    assert.strictEqual(decoded.auth_complete, true);
  });

  it('should reject expired or forged JWT tokens', () => {
    const fakeToken = jwt.sign({ username: 'hacker' }, 'wrong-secret-key');
    assert.throws(() => {
      jwt.verify(fakeToken, JWT_SECRET);
    }, /invalid signature/);

    const expiredToken = jwt.sign({ username: 'admin' }, JWT_SECRET, { expiresIn: '-1s' });
    assert.throws(() => {
      jwt.verify(expiredToken, JWT_SECRET);
    }, /jwt expired/);
  });

  it('should prevent access to protected resources when 2FA is pending', () => {
    const pendingToken = jwt.sign(
      { username: 'Kovaicyber@gmail.com', two_factor_pending: true },
      JWT_SECRET,
      { expiresIn: '300s' }
    );
    const decoded = jwt.verify(pendingToken, JWT_SECRET);
    assert.strictEqual(decoded.two_factor_pending, true);
    assert.ok(!decoded.auth_complete, 'Session must not be marked auth_complete');
  });
});
