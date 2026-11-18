/**
 * Resolves local assets against the Vite BASE_URL (for GitHub Pages deployment)
 * while safely preserving external / Supabase Storage URLs.
 *
 * @param {string} path - Local path (e.g. 'assets/images/logo.png') or full URL
 * @returns {string} - Properly prefixed asset URL or untouched external URL
 */
export const getAssetUrl = (path) => {
  if (!path) return '';
  const clean = String(path).trim();
  // Preserve full external URLs, Supabase Storage URLs, data URIs, and blob URIs
  if (/^(https?:)?\/\//i.test(clean) || clean.startsWith('data:') || clean.startsWith('blob:')) {
    return clean;
  }
  const cleanPath = clean.replace(/\\/g, '/').replace(/^\/+/, '');
  const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
  return base.endsWith('/') ? `${base}${cleanPath}` : `${base}/${cleanPath}`;
};

export default getAssetUrl;
