const axios = require('axios');

const PLACES_BASE = 'https://places.googleapis.com/v1/places';

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.rating',
  'places.priceLevel',
  'places.location',
  'places.types',
  'places.currentOpeningHours.openNow',
  'places.regularOpeningHours.periods',
  'places.regularOpeningHours.weekdayDescriptions',
  'places.nationalPhoneNumber',
  'places.photos',
  'places.editorialSummary',
  'places.servesVegetarianFood',
  'places.reservable',
  'places.websiteUri',
].join(',');

async function geocodeLocation(locationText) {
  const resp = await axios.post(
    `${PLACES_BASE}:searchText`,
    { textQuery: locationText, maxResultCount: 1 },
    {
      headers: {
        'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'places.location',
      },
    }
  );
  const loc = resp.data.places?.[0]?.location;
  if (!loc) throw new Error(`Cannot geocode: ${locationText}`);
  return { latitude: loc.latitude, longitude: loc.longitude };
}

async function searchByQuery(textQuery) {
  const resp = await axios.post(
    `${PLACES_BASE}:searchText`,
    {
      textQuery,
      includedType: 'restaurant',
      maxResultCount: 20,
    },
    {
      headers: {
        'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': FIELD_MASK,
      },
    }
  );
  return resp.data.places || [];
}

async function searchRestaurants({ location, cuisineTypes }) {
  const queries =
    cuisineTypes && cuisineTypes.length > 0
      ? cuisineTypes.slice(0, 3).map((c) => `${c} restaurant near ${location}`)
      : [`restaurant near ${location}`];

  const results = await Promise.allSettled(queries.map(searchByQuery));
  const allPlaces = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));

  // Deduplicate by place ID
  const seen = new Set();
  const unique = allPlaces.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  // Geocode the location for distance scoring
  let locationCoords = null;
  try {
    locationCoords = await geocodeLocation(location);
  } catch {
    // Distance scoring will use 0.5 default if geocoding fails
  }

  return { places: unique, locationCoords };
}

module.exports = { searchRestaurants };
