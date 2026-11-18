import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_ANON_KEY || '';

const isTestEnv = process.env.NODE_ENV === 'test' || process.argv.some(arg => arg.includes('test'));

export const isSupabaseConfigured = Boolean(
  !isTestEnv &&
  supabaseUrl && supabaseUrl.trim() !== '' && supabaseKey && supabaseKey.trim() !== ''
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    })
  : null;

if (isSupabaseConfigured) {
  console.log('✅ Supabase Client initialized successfully.');
} else {
  console.log('ℹ️ Supabase credentials not set. Operating seamlessly with local JSON & file storage.');
}

