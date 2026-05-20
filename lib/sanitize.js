import DOMPurify from 'dompurify';

/**
 * Sanitizes user input to prevent XSS.
 * Strips ALL HTML tags — returns plain text only.
 * Safe for both client and server environments.
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return '';

  if (typeof window === 'undefined') {
    // Server-side: strip tags and neutralize script patterns
    return input
      .replace(/<[^>]*>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }

  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  }).trim();
}

/**
 * Sanitizes rich text that is allowed to contain ONLY safe formatting.
 * Use for fields like remediation descriptions where bold/italic is acceptable
 * but scripts, iframes, and event handlers must be blocked.
 */
export function sanitizeRichText(input) {
  if (typeof input !== 'string') return '';

  if (typeof window === 'undefined') {
    return input.replace(/<[^>]*>/g, '').trim();
  }

  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
    FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick'],
  }).trim();
}

/**
 * Sanitizes a value for safe CSV export.
 * Neutralizes formula injection (= + - @ tab CR).
 */
export function sanitizeCsvCell(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (/^[=+\-@\t\r]/.test(str)) return `'${str}`;
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}
