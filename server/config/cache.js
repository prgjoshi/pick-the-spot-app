/**
 * cache.js — Redis client wrapper with graceful fallback.
 *
 * When REDIS_URL is set (Upstash or any Redis-compatible service), caching
 * is active. When it is absent (local dev without Redis), all cache
 * operations are no-ops so the app continues to work without a cache layer.
 *
 * Recommended provider: Upstash Redis (https://upstash.com)
 *   - Serverless, per-request pricing — free tier covers ~10k requests/day.
 *   - Works with any standard Redis client over TLS.
 *   - Set REDIS_URL in .env to the "Redis URL" shown in the Upstash console.
 */

const Redis = require('ioredis');

const DEFAULT_TTL_SECONDS = 3600; // 1 hour — Places API results don't change frequently

let client = null;

if (process.env.REDIS_URL) {
  client = new Redis(process.env.REDIS_URL, {
    tls: process.env.REDIS_URL.startsWith('rediss://') ? {} : undefined,
    maxRetriesPerRequest: 2,
    connectTimeout: 3000,
    lazyConnect: true,
  });

  client.on('error', (err) => {
    // Log but never crash the process — cache miss is always safe.
    console.error('[cache] Redis error:', err.message);
  });

  client.connect().catch((err) => {
    console.error('[cache] Redis connect failed (cache disabled):', err.message);
    client = null;
  });
} else {
  console.log('[cache] REDIS_URL not set — caching disabled (add Upstash URL to enable).');
}

/**
 * Get a cached value. Returns null on miss or if cache is unavailable.
 * @param {string} key
 * @returns {Promise<any|null>}
 */
async function get(key) {
  if (!client) return null;
  try {
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

/**
 * Store a value with an optional TTL.
 * Silently no-ops if cache is unavailable.
 * @param {string} key
 * @param {any} value
 * @param {number} [ttl] seconds (default 1 hour)
 */
async function set(key, value, ttl = DEFAULT_TTL_SECONDS) {
  if (!client) return;
  try {
    await client.set(key, JSON.stringify(value), 'EX', ttl);
  } catch {
    // Swallow — a failed cache write is never fatal.
  }
}

/**
 * Delete a cached key (e.g. to invalidate stale results).
 * @param {string} key
 */
async function del(key) {
  if (!client) return;
  try {
    await client.del(key);
  } catch {
    // Swallow.
  }
}

module.exports = { get, set, del };
