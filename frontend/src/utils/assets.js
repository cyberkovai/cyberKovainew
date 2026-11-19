/**
 * Resolves local assets against the Vite BASE_URL (for GitHub Pages / static hosting)
 * while safely preserving external / Supabase Storage URLs.
 *
 * @param {string} path - Local path (e.g. 'assets/images/logo.png') or full URL
 * @returns {string} - Properly prefixed asset URL or untouched external URL
 */
const SUPABASE_STORAGE_URL = 'https://nlopwybyiwmsypkrsogc.supabase.co/storage/v1/object/public/uploads';

export const getAssetUrl = (path) => {
  if (!path) return '';
  const clean = String(path).trim();

  // Preserve full external URLs, Supabase Storage URLs, data URIs, and blob URIs
  if (/^(https?:)?\/\//i.test(clean) || clean.startsWith('data:') || clean.startsWith('blob:')) {
    return clean;
  }

  // Map legacy / orphan upload paths or data/uploads to public Supabase Storage
  const uploadMatch = clean.match(/^(?:data\/)?uploads\/(.+)$/i);
  if (uploadMatch) {
    return `${SUPABASE_STORAGE_URL}/${uploadMatch[1]}`;
  }

  if (clean.includes('accred_1794298501_1bca47')) {
    return `${SUPABASE_STORAGE_URL}/accred_1794298501_1bca47.svg`;
  }
  if (clean.includes('accred_1794298552_96db9e')) {
    return `${SUPABASE_STORAGE_URL}/accred_1794298552_96db9e.png`;
  }

  const cleanPath = String(clean).replace(/\\/g, '/').replace(/^\/+/, '');
  const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
  return base.endsWith('/') ? `${base}${cleanPath}` : `${base}/${cleanPath}`;
};

export default getAssetUrl;
