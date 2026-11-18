import jwt from 'jsonwebtoken';
import { storageService } from '../services/storageService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'cyber-kovai-super-secret-jwt-key-2026-secure-token';

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.ck_admin_token) {
      token = req.cookies.ck_admin_token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // If 2FA is pending, reject access to protected admin actions
    if (decoded.two_factor_pending) {
      return res.status(403).json({
        success: false,
        requires_2fa: true,
        message: 'Two-factor authentication code required.',
      });
    }

    const admin = await storageService.getAdmin(decoded.username);
    if (!admin) {
      return res.status(401).json({ success: false, message: 'User account not found.' });
    }

    req.user = {
      username: admin.username,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    };

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session.' });
  }
};

