// Scoring weights (must sum to 1.0)
const WEIGHTS = { cuisine: 0.35, price: 0.25, distance: 0.20, rating: 0.10, availability: 0.10 };
const MAX_RADIUS_KM = 10;

// Maps Google place types to the app's cuisine names (must match mobile app CUISINE_TYPES constant)
const CUISINE_TYPE_MAP = {
  italian_restaurant: 'Italian',
  mexican_restaurant: 'Mexican',
  chinese_restaurant: 'Chinese',
  japanese_restaurant: 'Japanese',
  american_restaurant: 'American',
  thai_restaurant: 'Thai',
  indian_restaurant: 'Indian',
  mediterranean_restaurant: 'Mediterranean',
  french_restaurant: 'French',
  korean_restaurant: 'Korean',
  sushi_restaurant: 'Japanese',
  pizza_restaurant: 'Italian',
  burger_restaurant: 'American',
};

const PRICE_LEVEL_MAP = {
  PRICE_LEVEL_FREE: 1,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

// ─── Utility ────────────────────────────────────────────────────────────────

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getPlaceCuisines(place) {
  return (place.types || [])
    .map((t) => CUISINE_TYPE_MAP[t])
    .filter(Boolean);
}

// ─── Hard Filters ────────────────────────────────────────────────────────────

/**
 * Returns true (filter out) if ANY member's excluded_cuisines list covers
 * ALL of the restaurant's detected cuisine types.
 * e.g. Member excludes "Japanese" → Japanese-only restaurants are removed.
 * A restaurant serving both Italian and Japanese is kept.
 */
function isExcludedByCuisine(place, preferences) {
  const placeCuisines = getPlaceCuisines(place);
  if (placeCuisines.length === 0) return false;
  return preferences.some(
    (p) =>
      p.excluded_cuisines?.length > 0 &&
      placeCuisines.every((c) => p.excluded_cuisines.includes(c))
  );
}

function isVegetarianBlocked(place, preferences) {
  return (
    preferences.some((p) => p.dietary_restrictions?.includes('Vegetarian')) &&
    place.servesVegetarianFood === false
  );
}

// ─── Availability (opening hours at session time) ────────────────────────────

/**
 * Returns true if the restaurant is open at the requested session date+time.
 * Returns true (neutral) when no session time is provided or no hours data exists.
 *
 * Google Places regularOpeningHours.periods format:
 *   [ { open: { day, hour, minute }, close: { day, hour, minute } }, ... ]
 *   day: 0=Sunday, 1=Monday, ..., 6=Saturday
 */
function isOpenAtTime(place, sessionDate, sessionTime) {
  if (!sessionTime || !sessionDate) return true;
  if (!place.regularOpeningHours?.periods?.length) return true;

  // Parse into JS Date to get day-of-week reliably
  const [h, m] = sessionTime.split(':').map(Number);
  const date = new Date(sessionDate);
  const dayOfWeek = date.getDay(); // 0=Sun … 6=Sat
  const requestedMinutes = h * 60 + (m || 0);

  return place.regularOpeningHours.periods.some((period) => {
    if (period.open?.day !== dayOfWeek) return false;
    const openMin = period.open.hour * 60 + (period.open.minute ?? 0);
    // If no close defined, restaurant is open 24h for that day
    if (!period.close) return requestedMinutes >= openMin;
    const closeMin = period.close.hour * 60 + (period.close.minute ?? 0);
    // Handle overnight periods (e.g. open 18:00, close 02:00 next day)
    if (closeMin < openMin) {
      return requestedMinutes >= openMin || requestedMinutes < closeMin;
    }
    return requestedMinutes >= openMin && requestedMinutes < closeMin;
  });
}

// ─── Score Components ─────────────────────────────────────────────────────────

function cuisineScore(place, preferences) {
  const membersWithPrefs = preferences.filter((p) => p.cuisines?.length > 0);
  if (membersWithPrefs.length === 0) return 0.5;
  const placeCuisines = getPlaceCuisines(place);
  if (placeCuisines.length === 0) return 0.3; // Unknown cuisine — mild penalty
  const matchCount = membersWithPrefs.filter((p) =>
    p.cuisines.some((c) => placeCuisines.includes(c))
  ).length;
  return matchCount / membersWithPrefs.length;
}

function priceScore(place, preferences) {
  const priceLevel = PRICE_LEVEL_MAP[place.priceLevel] ?? null;
  if (priceLevel === null) return 0.5;
  const accepting = preferences.filter(
    (p) => priceLevel >= p.price_min && priceLevel <= p.price_max
  ).length;
  return accepting / preferences.length;
}

function distanceScore(place, locationCoords) {
  if (!locationCoords || !place.location) return 0.5;
  const km = haversineKm(
    place.location.latitude,
    place.location.longitude,
    locationCoords.latitude,
    locationCoords.longitude
  );
  return Math.max(0, 1 - km / MAX_RADIUS_KM);
}

function ratingScore(place) {
  if (!place.rating) return 0.5;
  return (place.rating - 1) / 4;
}

function availabilityScore(place, sessionDate, sessionTime) {
  if (!sessionDate || !sessionTime) return 1.0; // No session time → full score
  return isOpenAtTime(place, sessionDate, sessionTime) ? 1.0 : 0.0;
}

// ─── Reasoning text ───────────────────────────────────────────────────────────

function buildReasoning(cScore, pScore, dScore, rScore, aScore, sessionTimeSet) {
  const parts = [];
  if (cScore >= 0.8) parts.push('great cuisine match for your group');
  else if (cScore >= 0.5) parts.push('matches some cuisine preferences');
  else if (cScore < 0.3) parts.push('cuisine is a stretch for your group');
  if (pScore >= 0.8) parts.push("fits everyone's budget");
  else if (pScore < 0.4) parts.push("outside some members' price range");
  if (dScore >= 0.8) parts.push('very close by');
  if (rScore >= 0.8) parts.push('highly rated');
  if (sessionTimeSet && aScore === 1.0) parts.push('open at your session time');
  return parts.length ? parts.join(', ') : 'a balanced choice for your group';
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * @param {Array}  places         - Raw results from placesService
 * @param {Array}  preferences    - Rows from user_preferences for this group
 * @param {Object} locationCoords - { latitude, longitude } of group location (nullable)
 * @param {string} sessionDate    - ISO date string e.g. "2026-03-20" (nullable)
 * @param {string} sessionTime    - "HH:MM" e.g. "19:30" (nullable)
 * @returns {Array} Scored, filtered, sorted restaurants (top 10)
 */
function scoreRestaurants(places, preferences, locationCoords, sessionDate, sessionTime) {
  if (!preferences || preferences.length === 0) {
    return places.slice(0, 10).map((p) => ({
      ...p,
      groupScore: 50,
      reasoning: 'Set preferences to get personalized scores',
      scoreBreakdown: null,
    }));
  }

  const sessionTimeSet = !!(sessionDate && sessionTime);

  return places
    .map((place) => {
      // ── Hard filters ──────────────────────────────────────────────────────
      if (isVegetarianBlocked(place, preferences)) {
        return { ...place, groupScore: 0, _filtered: true, filterReason: 'vegetarian' };
      }
      if (isExcludedByCuisine(place, preferences)) {
        return { ...place, groupScore: 0, _filtered: true, filterReason: 'excluded_cuisine' };
      }

      // ── Score components ──────────────────────────────────────────────────
      const cScore = cuisineScore(place, preferences);
      const pScore = priceScore(place, preferences);
      const dScore = distanceScore(place, locationCoords);
      const rScore = ratingScore(place);
      const aScore = availabilityScore(place, sessionDate, sessionTime);

      const raw =
        WEIGHTS.cuisine * cScore +
        WEIGHTS.price * pScore +
        WEIGHTS.distance * dScore +
        WEIGHTS.rating * rScore +
        WEIGHTS.availability * aScore;

      const groupScore = Math.round(raw * 100);
      const reasoning = buildReasoning(cScore, pScore, dScore, rScore, aScore, sessionTimeSet);

      // Score breakdown for display in the mobile app
      const scoreBreakdown = {
        cuisine: Math.round(cScore * 100),
        price: Math.round(pScore * 100),
        distance: Math.round(dScore * 100),
        rating: Math.round(rScore * 100),
        availability: sessionTimeSet ? Math.round(aScore * 100) : null,
        isOpenAtSessionTime: sessionTimeSet ? aScore === 1.0 : null,
      };

      return { ...place, groupScore, reasoning, scoreBreakdown };
    })
    .filter((p) => !p._filtered && p.groupScore >= 30)
    .sort((a, b) => b.groupScore - a.groupScore)
    .slice(0, 10);
}

module.exports = { scoreRestaurants };
