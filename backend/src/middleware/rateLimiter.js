const attempts = new Map();

// Periodic prune to prevent memory leaks from inactive client IPs
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, record] of attempts.entries()) {
    if (now > record.resetTime) {
      attempts.delete(key);
    }
  }
}, 5 * 60 * 1000);
if (cleanupInterval.unref) {
  cleanupInterval.unref();
}

export const clearRateLimits = () => attempts.clear();

export const rateLimiter = (options = { maxAttempts: 5, windowMs: 15 * 60 * 1000 }) => {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const key = `${ip}_${req.baseUrl || ''}${req.path || ''}`;
    const now = Date.now();

    const record = attempts.get(key) || { count: 0, resetTime: now + options.windowMs };

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + options.windowMs;
    } else {
      record.count += 1;
    }

    attempts.set(key, record);

    if (record.count > options.maxAttempts) {
      const waitSeconds = Math.ceil((record.resetTime - now) / 1000);
      return res.status(429).json({
        success: false,
        message: `Too many attempts. Please try again after ${waitSeconds} seconds.`,
      });
    }

    next();
  };
};

