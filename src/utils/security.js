/**
 * Sanitize a URL — only allow http: and https: schemes.
 * Returns the URL if safe, or null if dangerous.
 */
export function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return trimmed;
    }
    return null;
  } catch {
    // Relative URLs or malformed — reject
    return null;
  }
}

/**
 * Hash a string using SHA-256 (async, uses Web Crypto API).
 */
export async function sha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Validate a gathering object has required fields and safe types.
 */
export function validateGathering(g) {
  if (!g || typeof g !== 'object') return false;
  if (typeof g.id !== 'string' || !g.id) return false;
  if (typeof g.name !== 'string' || !g.name) return false;
  if (typeof g.country !== 'string') return false;
  if (typeof g.lat !== 'number' || isNaN(g.lat)) return false;
  if (typeof g.lng !== 'number' || isNaN(g.lng)) return false;
  if (!['confirmed', 'tbd', 'past'].includes(g.dateStatus)) return false;
  return true;
}

/**
 * Return a sanitized copy of a gathering (URLs cleaned).
 * Does not mutate the original.
 */
export function sanitizeGathering(g) {
  return {
    ...g,
    instagram: (g.instagram && sanitizeUrl(g.instagram)) || '',
    website: (g.website && sanitizeUrl(g.website)) || null,
  };
}
