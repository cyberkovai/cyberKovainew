import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { cryptoService } from './cryptoService.js';
import { storageService } from './storageService.js';

const ISSUER = process.env.CK_2FA_ISSUER || 'Cyber Kovai';
const WINDOW = parseInt(process.env.CK_2FA_WINDOW || '1', 10);

export const twoFactorService = {
  async getStatus(username) {
    const record = await storageService.get2FAData(username);
    if (!record || !record.enabled) {
      return {
        enabled: false,
        pending_setup: Boolean(record && !record.enabled && record.secret_encrypted),
      };
    }
    return {
      enabled: true,
      pending_setup: false,
      confirmed_at: record.confirmed_at,
      backup_codes_remaining: Array.isArray(record.backup_codes) ? record.backup_codes.length : 0,
    };
  },

  async beginSetup(username) {
    const secret = speakeasy.generateSecret({
      name: `${ISSUER} (${username})`,
      issuer: ISSUER,
      length: 20,
    });

    const encryptedSecret = cryptoService.encrypt(secret.base32, username);
    const backupCodes = Array.from({ length: 8 }, () => crypto.randomBytes(4).toString('hex').toUpperCase());

    await storageService.save2FAData(username, {
      username,
      secret_encrypted: encryptedSecret,
      enabled: false,
      backup_codes: backupCodes,
    });

    const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      otpauth_url: secret.otpauth_url,
      qr_code: qrDataUrl,
      backup_codes: backupCodes,
    };
  },

  async confirmSetup(username, code) {
    const record = await storageService.get2FAData(username);
    if (!record || !record.secret_encrypted) {
      throw new Error('No pending 2FA setup found for this account.');
    }

    const cleanCode = String(code).trim();
    const base32Secret = cryptoService.decrypt(record.secret_encrypted, username);

    const verified = speakeasy.totp.verify({
      secret: base32Secret,
      encoding: 'base32',
      token: cleanCode,
      window: WINDOW,
    });

    if (!verified) {
      return false;
    }

    record.enabled = true;
    record.confirmed_at = new Date().toISOString();
    await storageService.save2FAData(username, record);
    return true;
  },

  async verify(username, code) {
    const record = await storageService.get2FAData(username);
    if (!record || !record.enabled || !record.secret_encrypted) {
      return false;
    }

    const cleanCode = String(code).trim();

    // Check backup codes first
    if (Array.isArray(record.backup_codes)) {
      const idx = record.backup_codes.findIndex(c => c.toUpperCase() === cleanCode.toUpperCase());
      if (idx >= 0) {
        // Consume backup code
        record.backup_codes.splice(idx, 1);
        await storageService.save2FAData(username, record);
        return { success: true, is_backup_code: true };
      }
    }

    // Verify TOTP
    try {
      const base32Secret = cryptoService.decrypt(record.secret_encrypted, username);
      const verified = speakeasy.totp.verify({
        secret: base32Secret,
        encoding: 'base32',
        token: cleanCode,
        window: WINDOW,
      });
      return { success: Boolean(verified), is_backup_code: false };
    } catch (e) {
      console.error('2FA verification error:', e.message);
      return { success: false, is_backup_code: false };
    }
  },

  async disable(username) {
    await storageService.delete2FAData(username);
    return true;
  },
};

