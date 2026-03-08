/**
 * Format ISO date string for display.
 * @param {string} iso - ISO 8601 date string
 * @returns {string} Formatted date (e.g. "Mar 8, 2025") or "—" if invalid
 */
export function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' });
}
