
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import apiRoutes from './routes/api.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const allowedOrigins = [
  FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

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
  console.error('Server error:', err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Export for Vercel
export default app;

// Local development only
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Cyber Kovai API running on port ${PORT}`);
  });
}
