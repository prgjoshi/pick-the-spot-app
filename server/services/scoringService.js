// Scoring weights per MVP spec
const WEIGHTS = { cuisine: 0.40, price: 0.30, distance: 0.20, rating: 0.10 };
const MAX_RADIUS_KM = 10;

// Maps Google place types to the app's cuisine names (must match mobile app constants)
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

function cuisineScore(place, preferences) {
  const membersWithPrefs = preferences.filter((p) => p.cuisines && p.cuisines.length > 0);
  if (membersWithPrefs.length === 0) return 0.5;
  const placeCuisines = getPlaceCuisines(place);
  if (placeCuisines.length === 0) return 0.3; // Unknown cuisine — mild penalty
  const matchCount = membersWithPrefs.filter((p) =>
    p.cuisines.some((c) => placeCuisines.includes(c))
  ).length;
  return matchCount / membersWithPrefs.length;
}

function priceScore(place, preferences) {
  const priceLevel = PRICE_LEVEL_MAP[place.priceLevel] || null;
  if (priceLevel === null) return 0.5; // Unknown price — neutral
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
  return (place.rating - 1) / 4; // Normalize 1–5 → 0–1
}

function buildReasoning(cScore, pScore, dScore, rScore) {
  const parts = [];
  if (cScore >= 0.8) parts.push('great cuisine match for your group');
  else if (cScore >= 0.5) parts.push('matches some cuisine preferences');
  else if (cScore < 0.3) parts.push('cuisine is a stretch for your group');
  if (pScore >= 0.8) parts.push("fits everyone's budget");
  else if (pScore < 0.4) parts.push("outside some members' price range");
  if (dScore >= 0.8) parts.push('very close by');
  if (rScore >= 0.8) parts.push('highly rated');
  return parts.length ? parts.join(', ') : 'a balanced choice for your group';
}

function scoreRestaurants(places, preferences, locationCoords) {
  if (!preferences || preferences.length === 0) {
    return places.slice(0, 10).map((p) => ({
      ...p,
      groupScore: 50,
      reasoning: 'Set preferences to get personalized scores',
    }));
  }

  return places
    .map((place) => {
      // Hard filter: vegetarian
      if (
        preferences.some((p) => p.dietary_restrictions?.includes('Vegetarian')) &&
        place.servesVegetarianFood === false
      ) {
        return { ...place, groupScore: 0, _filtered: true };
      }

      const cScore = cuisineScore(place, preferences);
      const pScore = priceScore(place, preferences);
      const dScore = distanceScore(place, locationCoords);
      const rScore = ratingScore(place);

      const raw =
        WEIGHTS.cuisine * cScore +
        WEIGHTS.price * pScore +
        WEIGHTS.distance * dScore +
        WEIGHTS.rating * rScore;

      const groupScore = Math.round(raw * 100);
      const reasoning = buildReasoning(cScore, pScore, dScore, rScore);

      return { ...place, groupScore, reasoning };
    })
    .filter((p) => !p._filtered && p.groupScore >= 30)
    .sort((a, b) => b.groupScore - a.groupScore)
    .slice(0, 10);
}

module.exports = { scoreRestaurants };
