import DOMPurify from 'dompurify';

/**
 * Sanitize user input to prevent XSS attacks.
 * Strips ALL HTML tags and attributes, returning only plain text.
 * Safe for both client and server environments.
 *
 * @param {string} input - Raw user input
 * @returns {string} Sanitized plain text
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return '';

  // Server-side fallback (DOMPurify requires a DOM)
  if (typeof window === 'undefined') {
    return input.replace(/<[^>]*>/g, '').trim();
  }

  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  }).trim();
}
