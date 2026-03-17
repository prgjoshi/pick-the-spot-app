/**
 * reservationService.js
 *
 * Generates smart pre-filled booking deep links for restaurants using
 * OpenTable's public search URL structure. Party size, session date, and
 * session time are embedded so users land directly on a pre-filled booking page.
 *
 * NOTE: OpenTable, Resy, and Tock do not expose public REST APIs for real-time
 * slot availability — their booking data is behind paid restaurant-partner
 * agreements. This service provides the next best thing: deep links that
 * pre-populate the booking form so users land one step away from confirming
 * a reservation. The existing Google Places regularOpeningHours data is used
 * to determine if a restaurant is actually open at the session time.
 */

const FETCH_TIMEOUT_MS = 5000;

// ─── URL Builders ─────────────────────────────────────────────────────────────

/**
 * Build an OpenTable restaurant search URL with pre-filled party size, date,
 * and time. When `restaurantName` is provided, OT searches and focuses results
 * on that restaurant. This is the same URL their own website generates.
 *
 * Example:
 * https://www.opentable.com/s/?covers=2&dateTime=2026-03-18T19:30&query=La+Pecora+Bianca+New+York
 */
function buildOpenTableSearchUrl(restaurantName, sessionDate, sessionTime, partySize) {
  const params = new URLSearchParams({
    covers: String(partySize),
    dateTime: `${sessionDate}T${sessionTime}`,
    query: restaurantName,
  });
  return `https://www.opentable.com/s/?${params.toString()}`;
}

/**
 * Detect if a websiteUri looks like an OpenTable restaurant profile page.
 * e.g. https://www.opentable.com/r/la-pecora-bianca-soho-new-york
 */
function isOpenTableUrl(uri) {
  return /opentable\.com\/(r\/|restaurant\/)/i.test(uri ?? '');
}

/**
 * Detect if a websiteUri looks like a Resy restaurant page.
 * e.g. https://resy.com/cities/ny/la-pecora-bianca
 */
function isResyUrl(uri) {
  return /resy\.com\//i.test(uri ?? '');
}

/**
 * If the restaurant already links directly to their OpenTable page, extract the
 * slug and append the booking parameters so the user lands pre-filled.
 * e.g. /r/slug → /r/slug?covers=2&dateTime=2026-03-18T19:30
 */
function enrichOpenTableUrl(existingUrl, sessionDate, sessionTime, partySize) {
  try {
    const url = new URL(existingUrl);
    url.searchParams.set('covers', String(partySize));
    url.searchParams.set('dateTime', `${sessionDate}T${sessionTime}`);
    return url.toString();
  } catch {
    return existingUrl;
  }
}

/**
 * Resy deep-link: append date and seats to an existing Resy URL.
 * e.g. resy.com/cities/ny/slug → resy.com/cities/ny/slug?date=2026-03-18&seats=2
 */
function enrichResyUrl(existingUrl, sessionDate, partySize) {
  try {
    const url = new URL(existingUrl);
    url.searchParams.set('date', sessionDate);
    url.searchParams.set('seats', String(partySize));
    return url.toString();
  } catch {
    return existingUrl;
  }
}

// ─── Main Export ─────────────────────────────────────────────────────────────

/**
 * Enrich a single restaurant with reservation booking link data.
 *
 * Strategy (in priority order):
 *  1. If websiteUri is an OpenTable page → enrich with date/covers params
 *  2. If websiteUri is a Resy page → enrich with date/seats params
 *  3. If reservable === true → generate OT search URL for this restaurant
 *  4. Otherwise → return null (not reservable, skip)
 *
 * Returns a ReservationData-shaped object or null.
 * `available` is always null (we can't confirm live slot availability without
 * a paid API partnership) — the isOpenAtSessionTime check in scoringService
 * covers the "is the place open" question.
 */
async function getReservationData(restaurant, sessionDate, sessionTime, partySize) {
  if (!sessionDate || !sessionTime || !partySize) return null;
  // Normalise time to HH:MM (Postgres returns HH:MM:SS)
  const time = sessionTime.slice(0, 5);

  // Google Places says explicitly not reservable
  if (restaurant.reservable === false) return null;

  const name = restaurant.displayName?.text ?? '';
  const websiteUri = restaurant.websiteUri ?? null;

  let bookingUrl = null;
  let platform = 'none';

  if (isOpenTableUrl(websiteUri)) {
    // Restaurant already has an OT profile page — enrich with group params
    bookingUrl = enrichOpenTableUrl(websiteUri, sessionDate, time, partySize);
    platform = 'opentable';
  } else if (isResyUrl(websiteUri)) {
    // Restaurant has a Resy page — enrich with date and seats
    bookingUrl = enrichResyUrl(websiteUri, sessionDate, partySize);
    platform = 'resy';
  } else if (restaurant.reservable === true && name) {
    // Reservable but no direct OT/Resy link — generate an OT search URL
    bookingUrl = buildOpenTableSearchUrl(name, sessionDate, time, partySize);
    platform = 'opentable';
  }

  if (!bookingUrl) return null;

  return {
    platform,
    available: null,   // live slot data not available without paid API partnership
    slots: [],         // slot-level data requires partner API access
    bookingUrl,
    checkedAt: new Date().toISOString(),
  };
}

module.exports = { getReservationData };
