import multer from 'multer';
import path from 'path';

// Use memory storage so we can upload either to Supabase Storage or local disk atomically
const storage = multer.memoryStorage();

const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
const ALLOWED_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;
    if (ALLOWED_EXTS.includes(ext) && ALLOWED_MIMES.includes(mime)) {
      cb(null, true);
    } else {
      cb(new Error('Only valid image files (JPG, PNG, WEBP, GIF, SVG) are allowed.'));
    }
  },
});

