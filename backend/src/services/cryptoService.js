import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const CIPHER = 'aes-256-gcm';
const VERSION = 'v1';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function parseKey(rawKey) {
  let key = rawKey || process.env.CK_APP_KEY || '';
  if (key.startsWith('base64:')) {
    key = Buffer.from(key.slice(7), 'base64');
  } else {
    key = Buffer.from(key, 'utf8');
  }

  if (key.length === 32) return key;

  // Derive 32 bytes using SHA-256 if key is not exactly 32 bytes
  return crypto.createHash('sha256').update(key).digest();
}

export const cryptoService = {
  encrypt(plaintext, aad = '') {
    const key = parseKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(CIPHER, key, iv);
    if (aad) cipher.setAAD(Buffer.from(aad, 'utf8'));

    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return [
      VERSION,
      iv.toString('base64'),
      tag.toString('base64'),
      encrypted.toString('base64'),
    ].join(':');
  },

  decrypt(payload, aad = '') {
    const parts = payload.split(':');
    if (parts.length !== 4 || parts[0] !== VERSION) {
      throw new Error('Invalid encrypted 2FA payload format');
    }

    const key = parseKey();
    const iv = Buffer.from(parts[1], 'base64');
    const tag = Buffer.from(parts[2], 'base64');
    const ciphertext = Buffer.from(parts[3], 'base64');

    const decipher = crypto.createDecipheriv(CIPHER, key, iv);
    decipher.setAuthTag(tag);
    if (aad) decipher.setAAD(Buffer.from(aad, 'utf8'));

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf8');
  },
};

