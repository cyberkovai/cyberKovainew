import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static Assets
const rootDir = path.resolve(__dirname, '../../');
app.use('/assets', express.static(path.join(rootDir, 'assets')));
app.use('/data/uploads', express.static(path.join(rootDir, 'data/uploads')));

// Legacy PHP endpoint alias for contact submission
app.post('/process-contact.php', (req, res, next) => {
  req.url = '/contact';
  apiRoutes(req, res, next);
});

// Mount Master API
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Cyber Kovai API', timestamp: new Date().toISOString() });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Cyber Kovai Express Backend running on http://127.0.0.1:${PORT}`);
  console.log(`📡 Connected to API at http://127.0.0.1:${PORT}/api`);
});

