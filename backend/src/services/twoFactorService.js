import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { cryptoService } from './cryptoService.js';
import { storageService } from './storageService.js';

const ISSUER = process.env.CK_2FA_ISSUER || 'Cyber Kovai';
const WINDOW = Math.max(2, parseInt(process.env.CK_2FA_WINDOW || '2', 10));

const norm = (val) => String(val || '').toLowerCase().trim();
const cleanToken = (val) => String(val || '').replace(/[\s-]+/g, '').trim();

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
    const user = norm(username);
    const secret = speakeasy.generateSecret({
      name: `${ISSUER} (${user})`,
      issuer: ISSUER,
      length: 20,
    });

    const encryptedSecret = cryptoService.encrypt(secret.base32, user);
    const backupCodes = Array.from({ length: 8 }, () => crypto.randomBytes(4).toString('hex').toUpperCase());

    await storageService.save2FAData(user, {
      username: user,
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
    const user = norm(username);
    const record = await storageService.get2FAData(user);
    if (!record || !record.secret_encrypted) {
      throw new Error('No pending 2FA setup found for this account.');
    }

    const cleanCode = cleanToken(code);
    if (!cleanCode) return false;

    let base32Secret;
    try {
      base32Secret = cryptoService.decrypt(record.secret_encrypted, user);
    } catch (e) {
      base32Secret = cryptoService.decrypt(record.secret_encrypted, username);
    }

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
    await storageService.save2FAData(user, record);
    return true;
  },

  async verify(username, code) {
    const user = norm(username);
    const record = await storageService.get2FAData(user);
    if (!record || !record.enabled || !record.secret_encrypted) {
      return { success: false, is_backup_code: false };
    }

    const cleanCode = cleanToken(code);
    if (!cleanCode) {
      return { success: false, is_backup_code: false };
    }

    // Check backup codes first (supports formatted or unformatted)
    if (Array.isArray(record.backup_codes)) {
      const idx = record.backup_codes.findIndex(
        c => cleanToken(c).toUpperCase() === cleanCode.toUpperCase()
      );
      if (idx >= 0) {
        // Consume backup code
        record.backup_codes.splice(idx, 1);
        await storageService.save2FAData(user, record);
        return { success: true, is_backup_code: true };
      }
    }

    // Verify TOTP
    try {
      let base32Secret;
      try {
        base32Secret = cryptoService.decrypt(record.secret_encrypted, user);
      } catch (e) {
        base32Secret = cryptoService.decrypt(record.secret_encrypted, username);
      }

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
    const user = norm(username);
    await storageService.delete2FAData(user);
    return true;
  },

  async cancelPendingSetup(username) {
    const user = norm(username);
    const record = await storageService.get2FAData(user);
    if (record && !record.enabled) {
      await storageService.delete2FAData(user);
    }
    return true;
  },
};
