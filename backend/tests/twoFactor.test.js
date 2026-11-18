import { describe, it } from 'node:test';
import assert from 'node:assert';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import speakeasy from 'speakeasy';
import { twoFactorService } from '../src/services/twoFactorService.js';
import { storageService } from '../src/services/storageService.js';
import { cryptoService } from '../src/services/cryptoService.js';

process.env.NODE_ENV = 'test';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

describe('Two-Factor Authentication (TOTP) Test Suite', () => {
  const testUser = 'test_2fa_admin@cyberkovai.com';

  it('should encrypt and decrypt secrets using AES-256-GCM', () => {
    const rawSecret = 'JBSWY3DPEHPK3PXP';
    const encrypted = cryptoService.encrypt(rawSecret, testUser);
    assert.ok(encrypted.startsWith('v1:'), 'Encrypted payload must use v1 format');

    const decrypted = cryptoService.decrypt(encrypted, testUser);
    assert.strictEqual(decrypted, rawSecret, 'Decrypted secret must match original secret');

    // Mismatched authentication data must fail GCM tag check
    assert.throws(() => {
      cryptoService.decrypt(encrypted, 'wrong_user@cyberkovai.com');
    }, /Unsupported state or unable to authenticate data/);
  });

  it('should initialize 2FA setup with QR code and emergency backup codes', async () => {
    const setup = await twoFactorService.beginSetup(testUser);
    assert.ok(setup.secret, 'Secret should be generated');
    assert.ok(setup.otpauth_url, 'OTP auth URL should be present');
    assert.ok(setup.qr_code.startsWith('data:image/png;base64,'), 'QR code data URL should be generated');
    assert.strictEqual(setup.backup_codes.length, 8, 'Should generate 8 backup codes');
    assert.strictEqual(setup.test_token, undefined, 'test_token must NOT be leaked in setup response');

    const status = await twoFactorService.getStatus(testUser);
    assert.strictEqual(status.enabled, false);
    assert.strictEqual(status.pending_setup, true);
  });

  it('should reject hardcoded universal bypass codes ("123456", "000000")', async () => {
    const bypass1 = await twoFactorService.confirmSetup(testUser, '123456');
    assert.strictEqual(bypass1, false, '123456 must NOT confirm 2FA setup');

    const bypass2 = await twoFactorService.confirmSetup(testUser, '000000');
    assert.strictEqual(bypass2, false, '000000 must NOT confirm 2FA setup');
  });

  it('should confirm 2FA setup with a genuine TOTP code', async () => {
    const record = await storageService.get2FAData(testUser);
    const base32Secret = cryptoService.decrypt(record.secret_encrypted, testUser);

    const validToken = speakeasy.totp({
      secret: base32Secret,
      encoding: 'base32',
    });

    const confirmed = await twoFactorService.confirmSetup(testUser, validToken);
    assert.strictEqual(confirmed, true, 'Genuine TOTP token must confirm setup');

    const status = await twoFactorService.getStatus(testUser);
    assert.strictEqual(status.enabled, true);
    assert.strictEqual(status.pending_setup, false);
  });

  it('should allow login with single-use emergency backup code and invalidate it after use', async () => {
    const recordBefore = await storageService.get2FAData(testUser);
    const backupCode = recordBefore.backup_codes[0];
    assert.ok(backupCode, 'Backup code must exist');

    // First use: Valid
    const res1 = await twoFactorService.verify(testUser, backupCode);
    assert.strictEqual(res1.success, true);
    assert.strictEqual(res1.is_backup_code, true);

    // Second use: Must be rejected (single use only)
    const res2 = await twoFactorService.verify(testUser, backupCode);
    assert.strictEqual(res2.success, false, 'Consumed backup code cannot be reused');
  });

  it('should disable 2FA cleanly upon request', async () => {
    await twoFactorService.disable(testUser);
    const status = await twoFactorService.getStatus(testUser);
    assert.strictEqual(status.enabled, false);
    assert.strictEqual(status.pending_setup, false);
  });
});
