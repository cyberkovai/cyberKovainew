/**
 * Section visibility helper
 * Evaluates whether a section is visible.
 * Handles boolean true/false, number 1/0, and string "1"/"0"/"true"/"false".
 */
export const isSectionVisible = (sections, key, defaultVal = true) => {
  if (!sections || typeof sections !== 'object') return defaultVal;
  const val = sections[key];
  if (val === undefined || val === null) return defaultVal;
  if (val === false || val === 0 || val === '0' || val === 'false') return false;
  return true;
};
