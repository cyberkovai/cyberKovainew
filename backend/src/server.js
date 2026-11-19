
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import apiRoutes from './routes/api.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Allowed origins
const DEFAULT_ALLOWED_ORIGINS = [
  'https://cyberkovai.com',
  'https://www.cyberkovai.com',
  'https://cyberkovai.github.io',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

const normalizeOrigin = (val) => {
  if (!val || typeof val !== 'string') return '';
  const trimmed = val.trim();
  try {
    return new URL(trimmed).origin.toLowerCase();
  } catch {
    return trimmed.replace(/\/+$/, '').toLowerCase();
  }
};

const getAllowedOrigins = () => {
  const set = new Set(DEFAULT_ALLOWED_ORIGINS.map(normalizeOrigin).filter(Boolean));
  if (process.env.FRONTEND_URL) {
    const rawOrigins = process.env.FRONTEND_URL.split(/[\s,]+/);
    for (const raw of rawOrigins) {
      const envOrigin = normalizeOrigin(raw);
      if (envOrigin) {
        set.add(envOrigin);
      }
    }
  }
  return set;
};

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser clients (e.g. mobile apps, curl, server-to-server)
    if (!origin) {
      return callback(null, true);
    }
    const reqOrigin = normalizeOrigin(origin);
    const allowed = getAllowedOrigins();
    if (allowed.has(reqOrigin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};

// 1. CORS middleware for all routes
app.use(cors(corsOptions));

// 2. Explicit OPTIONS preflight handler for all routes
app.options('*', cors(corsOptions));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Cyber Kovai API',
    timestamp: new Date().toISOString(),
  });
});

// Legacy PHP endpoint alias
app.post('/process-contact.php', (req, res, next) => {
  req.url = '/contact';
  apiRoutes(req, res, next);
});

// Master API
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Cyber Kovai API is running',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: err.message,
    });
  }

  console.error('Server error:', err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Export for Vercel
export default app;

// Local development only (avoid port binding in serverless or test environment)
const isDirectEntry = process.argv[1] && (process.argv[1].endsWith('server.js') || process.argv[1].endsWith('server'));
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test' && isDirectEntry) {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Cyber Kovai API running on port ${PORT}`);
  });
}
