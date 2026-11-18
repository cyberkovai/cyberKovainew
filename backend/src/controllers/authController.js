import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { storageService } from '../services/storageService.js';
import { twoFactorService } from '../services/twoFactorService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'cyber-kovai-super-secret-jwt-key-2026-secure-token';
const CHALLENGE_TTL = parseInt(process.env.CK_2FA_CHALLENGE_TTL || '300', 10);

async function checkPasswordMatch(inputPassword, storedHash) {
  if (!inputPassword || !storedHash) return false;
  let hash = storedHash;
  if (hash.startsWith('$2y$')) hash = '$2a$' + hash.substring(4);
  try {
    return await bcrypt.compare(inputPassword, hash);
  } catch (e) {
    return false;
  }
}

export const authController = {
  async login(req, res) {
    try {
      const { username, password } = req.body;
      const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';

      if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required.' });
      }

      const admin = await storageService.getAdmin(username.trim());
      if (!admin) {
        await storageService.addAuditLog('unknown', 'login_failed', { reason: 'User not found', username }, clientIp, userAgent);
        return res.status(401).json({ success: false, message: 'Invalid credentials provided.' });
      }

      const match = await checkPasswordMatch(password, admin.password_hash);
      if (!match) {
        await storageService.addAuditLog(admin.username, 'login_failed', { reason: 'Bad password' }, clientIp, userAgent);
        return res.status(401).json({ success: false, message: 'Invalid credentials provided.' });
      }

      // Check 2FA status
      const status2fa = await twoFactorService.getStatus(admin.username);

      if (status2fa.enabled) {
        // Issue temporary 2FA challenge token (5 mins)
        const challengeToken = jwt.sign(
          { username: admin.username, two_factor_pending: true },
          JWT_SECRET,
          { expiresIn: CHALLENGE_TTL }
        );

        return res.json({
          success: true,
          requires_2fa: true,
          challenge_token: challengeToken,
          message: 'Please provide your 6-digit authenticator code.',
        });
      }

      // If 2FA not enabled, login is complete
      const token = jwt.sign(
        { username: admin.username, role: admin.role, auth_complete: true },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.cookie('ck_admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      await storageService.addAuditLog(admin.username, 'login_success', {}, clientIp, userAgent);

      return res.json({
        success: true,
        token,
        user: {
          username: admin.username,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
      });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
  },

  async verify2FA(req, res) {
    try {
      const { code, challenge_token } = req.body;
      const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';

      if (!code || !challenge_token) {
        return res.status(400).json({ success: false, message: 'Challenge token and code are required.' });
      }

      let decoded;
      try {
        decoded = jwt.verify(challenge_token, JWT_SECRET);
      } catch (e) {
        return res.status(401).json({ success: false, message: '2FA challenge has expired. Please log in again.' });
      }

      if (!decoded.two_factor_pending || !decoded.username) {
        return res.status(400).json({ success: false, message: 'Invalid 2FA challenge token.' });
      }

      const result = await twoFactorService.verify(decoded.username, code);
      if (!result || !result.success) {
        await storageService.addAuditLog(decoded.username, '2fa_failed', {}, clientIp, userAgent);
        return res.status(401).json({ success: false, message: 'Invalid authentication code or recovery code.' });
      }

      const admin = await storageService.getAdmin(decoded.username);
      const token = jwt.sign(
        { username: admin.username, role: admin.role, auth_complete: true },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.cookie('ck_admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      await storageService.addAuditLog(
        admin.username,
        '2fa_success',
        { is_backup_code: result.is_backup_code },
        clientIp,
        userAgent
      );

      return res.json({
        success: true,
        token,
        is_backup_code: result.is_backup_code,
        user: {
          username: admin.username,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
      });
    } catch (err) {
      console.error('Verify 2FA error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
  },

  async currentUser(req, res) {
    try {
      const status2fa = await twoFactorService.getStatus(req.user.username);
      return res.json({
        success: true,
        user: req.user,
        two_factor: status2fa,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async setup2FA(req, res) {
    try {
      const { password } = req.body || {};
      if (password) {
        const admin = await storageService.getAdmin(req.user.username);
        if (!admin) {
          return res.status(404).json({ success: false, message: 'User not found.' });
        }
        const match = await checkPasswordMatch(password, admin.password_hash);
        if (!match) {
          return res.status(401).json({ success: false, message: 'Current password is incorrect. Re-authentication is required before enabling 2FA.' });
        }
      }

      const setup = await twoFactorService.beginSetup(req.user.username);
      return res.json({ success: true, ...setup });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async confirm2FA(req, res) {
    try {
      const { code } = req.body;
      if (!code) return res.status(400).json({ success: false, message: 'Verification code is required.' });

      const verified = await twoFactorService.confirmSetup(req.user.username, code);
      if (!verified) {
        return res.status(400).json({ success: false, message: 'Invalid 6-digit verification code. Please check your authenticator app.' });
      }

      await storageService.addAuditLog(req.user.username, '2fa_enabled', {}, req.ip, req.headers['user-agent']);
      return res.json({ success: true, message: 'Two-factor authentication successfully enabled!' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async disable2FA(req, res) {
    try {
      const { password, code } = req.body || {};
      const admin = await storageService.getAdmin(req.user.username);
      if (!admin) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      if (password) {
        const match = await checkPasswordMatch(password, admin.password_hash);
        if (!match) {
          return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
        }
      }

      if (code) {
        const verified = await twoFactorService.verify(req.user.username, code);
        if (!verified || !verified.success) {
          return res.status(400).json({ success: false, message: 'Invalid 6-digit authenticator code.' });
        }
      }

      await twoFactorService.disable(req.user.username);
      await storageService.addAuditLog(req.user.username, '2fa_disabled', {}, req.ip, req.headers['user-agent']);
      return res.json({ success: true, message: 'Two-factor authentication disabled.' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async updateProfile(req, res) {
    try {
      const { username, name, email, current_password, new_password, confirm_password } = req.body;
      const currentAdmin = await storageService.getAdmin(req.user.username);

      if (!currentAdmin) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      if (!current_password) {
        return res.status(400).json({ success: false, message: 'Current password is required to authorize changes.' });
      }

      const match = await checkPasswordMatch(current_password, currentAdmin.password_hash);
      if (!match) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect. Verification failed.' });
      }

      let passwordHash = null;
      if (new_password) {
        if (confirm_password !== undefined && new_password !== confirm_password) {
          return res.status(400).json({ success: false, message: 'New password and confirmation do not match.' });
        }
        if (new_password.length < 8) {
          return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long.' });
        }
        passwordHash = await bcrypt.hash(new_password, 10);
      }

      const updated = await storageService.updateAdminProfile(
        req.user.username,
        (username || req.user.username).trim(),
        (email || req.user.email).trim(),
        passwordHash,
        name || currentAdmin.name
      );

      // Re-issue JWT if username changed
      const token = jwt.sign(
        { username: updated.username, role: updated.role, auth_complete: true },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.cookie('ck_admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({
        success: true,
        message: 'Admin profile and credentials successfully updated!',
        token,
        user: {
          username: updated.username,
          name: updated.name,
          email: updated.email,
          role: updated.role,
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  logout(req, res) {
    res.clearCookie('ck_admin_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    return res.json({ success: true, message: 'Logged out successfully.' });
  },
};

