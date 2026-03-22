/**
 * reservationService.js
 *
 * Generates pre-filled booking deep links for OpenTable, Resy, and Tock so
 * users land directly on the correct restaurant page with party size, date,
 * and time already populated — one tap away from confirming.
 *
 * Platform detection order (highest to lowest confidence):
 *   1. websiteUri contains an OpenTable restaurant page   → enrich directly
 *   2. websiteUri contains a Resy restaurant page         → enrich directly
 *   3. websiteUri contains a Tock restaurant page         → enrich directly
 *   4. reservable === true, no platform URL detected      → OpenTable search fallback
 *   5. reservable === false or nothing found              → return null
 *
 * NOTE: None of these platforms expose a public REST API for real-time slot
 * availability without a paid restaurant-partner agreement. This service
 * provides the next-best thing: deep links that pre-populate the booking
 * form. The `available` field is always null for this reason.
 *
 * URL parameter formats (verified against each platform's own share links):
 *   OpenTable direct:  ?covers=N&dateTime=YYYY-MM-DDTHH:MM
 *   OpenTable search:  ?covers=N&dateTime=YYYY-MM-DDTHH:MM&query=Name+City
 *   Resy:              ?seats=N&date=YYYY-MM-DD&time_slot=HH:MM:00
 *   Tock:              ?size=N&date=YYYY-MM-DD&time=HH:MM
 */

// ─── Platform detectors ───────────────────────────────────────────────────────

/**
 * OpenTable restaurant profile pages.
 * Patterns: opentable.com/r/{slug}  |  opentable.com/restaurant/profile/{id}
 */
function isOpenTableUrl(uri) {
  return /opentable\.com\/(r\/|restaurant\/)/i.test(uri ?? '');
}

/**
 * Resy restaurant pages.
 * Pattern: resy.com/cities/{city}/{slug}
 */
function isResyUrl(uri) {
  return /resy\.com\//i.test(uri ?? '');
}

/**
 * Tock restaurant pages.
 * Pattern: exploretock.com/{slug}
 */
function isTockUrl(uri) {
  return /exploretock\.com\//i.test(uri ?? '');
}

// ─── URL enrichers ────────────────────────────────────────────────────────────

/**
 * Append covers + dateTime to an existing OpenTable restaurant page URL.
 * If date or time is not available, only the known params are added.
 *
 * Example output:
 *   https://www.opentable.com/r/acme-kitchen-nyc?covers=4&dateTime=2026-03-21T19:30
 */
function enrichOpenTableUrl(existingUrl, sessionDate, sessionTime, partySize) {
  try {
    const url = new URL(existingUrl);
    url.searchParams.set('covers', String(partySize));
    if (sessionDate && sessionTime) {
      url.searchParams.set('dateTime', `${sessionDate}T${sessionTime}`);
    } else if (sessionDate) {
      // Date without time — let user pick time on OpenTable
      url.searchParams.set('dateTime', `${sessionDate}T19:00`);
    }
    return url.toString();
  } catch {
    return existingUrl;
  }
}

/**
 * Append seats + date + time_slot to an existing Resy restaurant page URL.
 * Resy's time_slot format is HH:MM:00 (seconds always zero).
 *
 * Example output:
 *   https://resy.com/cities/nyc/acme-kitchen?seats=4&date=2026-03-21&time_slot=19%3A30%3A00
 */
function enrichResyUrl(existingUrl, sessionDate, sessionTime, partySize) {
  try {
    const url = new URL(existingUrl);
    url.searchParams.set('seats', String(partySize));
    if (sessionDate) url.searchParams.set('date', sessionDate);
    if (sessionTime) url.searchParams.set('time_slot', `${sessionTime}:00`);
    return url.toString();
  } catch {
    return existingUrl;
  }
}

/**
 * Append size + date + time to an existing Tock restaurant page URL.
 * Tock's time format is HH:MM.
 *
 * Example output:
 *   https://www.exploretock.com/acme-kitchen?size=4&date=2026-03-21&time=19%3A30
 */
function enrichTockUrl(existingUrl, sessionDate, sessionTime, partySize) {
  try {
    const url = new URL(existingUrl);
    url.searchParams.set('size', String(partySize));
    if (sessionDate) url.searchParams.set('date', sessionDate);
    if (sessionTime) url.searchParams.set('time', sessionTime);
    return url.toString();
  } catch {
    return existingUrl;
  }
}

/**
 * Build an OpenTable search URL as a fallback when no direct platform page is
 * known. Appends restaurant name (and city if extractable from the address) so
 * OpenTable focuses results on the right venue.
 *
 * Example output:
 *   https://www.opentable.com/s/?covers=4&dateTime=2026-03-21T19:30&query=Acme+Kitchen+New+York
 */
function buildOpenTableSearchUrl(restaurantName, formattedAddress, sessionDate, sessionTime, partySize) {
  // Append just the city portion of the address to disambiguate common names.
  // Most Google Places addresses end with "City, State ZIP, Country".
  const city = formattedAddress
    ? formattedAddress.split(',').slice(-3, -1).join(',').trim()
    : '';
  const query = city ? `${restaurantName} ${city}` : restaurantName;

  const params = new URLSearchParams({ covers: String(partySize) });
  if (sessionDate && sessionTime) {
    params.set('dateTime', `${sessionDate}T${sessionTime}`);
  } else if (sessionDate) {
    params.set('dateTime', `${sessionDate}T19:00`);
  }
  params.set('query', query);
  return `https://www.opentable.com/s/?${params.toString()}`;
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Returns a ReservationData-shaped object for a restaurant, or null if no
 * booking link can be constructed.
 *
 * @param {Object} restaurant    - Raw Google Places result
 * @param {string|null} sessionDate  - "YYYY-MM-DD" or null
 * @param {string|null} sessionTime  - "HH:MM" or "HH:MM:SS" or null
 * @param {number|null} partySize    - Number of covers
 */
async function getReservationData(restaurant, sessionDate, sessionTime, partySize) {
  if (!partySize) return null;

  // Normalise time to HH:MM — Postgres returns HH:MM:SS
  const time = sessionTime ? sessionTime.slice(0, 5) : null;

  // Google Places explicitly marks this restaurant as not reservable — skip it.
  if (restaurant.reservable === false) return null;

  const name = restaurant.displayName?.text ?? '';
  const address = restaurant.formattedAddress ?? '';
  const websiteUri = restaurant.websiteUri ?? null;

  let bookingUrl = null;
  let platform = 'none';

  if (isOpenTableUrl(websiteUri)) {
    bookingUrl = enrichOpenTableUrl(websiteUri, sessionDate, time, partySize);
    platform = 'opentable';
  } else if (isResyUrl(websiteUri)) {
    bookingUrl = enrichResyUrl(websiteUri, sessionDate, time, partySize);
    platform = 'resy';
  } else if (isTockUrl(websiteUri)) {
    bookingUrl = enrichTockUrl(websiteUri, sessionDate, time, partySize);
    platform = 'tock';
  } else if (restaurant.reservable === true && name) {
    // No direct platform URL found — fall back to an OpenTable search pre-filtered
    // to this restaurant name and city. User lands one step away from booking.
    bookingUrl = buildOpenTableSearchUrl(name, address, sessionDate, time, partySize);
    platform = 'opentable';
  }

  if (!bookingUrl) return null;

  return {
    platform,           // 'opentable' | 'resy' | 'tock' | 'none'
    available: null,    // live slot data requires a paid platform API partnership
    slots: [],          // slot-level data not available without partner access
    bookingUrl,
    checkedAt: new Date().toISOString(),
  };
}

module.exports = { getReservationData };
