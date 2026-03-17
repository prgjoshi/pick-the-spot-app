const router = require('express').Router();
const pool = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const { searchRestaurants } = require('../services/placesService');
const { scoreRestaurants } = require('../services/scoringService');
const { getReservationData } = require('../services/reservationService');

// GET /api/groups/:id/recommendations
router.get('/:id/recommendations', requireAuth, async (req, res) => {
  try {
    const { rows: [group] } = await pool.query('SELECT * FROM groups WHERE id = $1', [req.params.id]);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const { rows: preferences } = await pool.query(
      'SELECT * FROM user_preferences WHERE group_id = $1',
      [req.params.id]
    );

    const allCuisines = [...new Set(preferences.flatMap((p) => p.cuisines || []))];

    const { places, locationCoords } = await searchRestaurants({
      location: group.location,
      cuisineTypes: allCuisines,
    });

    const sessionDate = group.session_date ? group.session_date.toISOString().split('T')[0] : null;
    const sessionTime = group.session_time || null;
    const partySize = group.party_size || null;

    // Score and sort restaurants
    const scored = scoreRestaurants(places, preferences, locationCoords, sessionDate, sessionTime);

    // Enrich top results with real-time OpenTable availability (parallel, non-blocking)
    const enriched = await Promise.all(
      scored.map(async (r) => {
        const reservationData = await getReservationData(r, sessionDate, sessionTime, partySize);
        return { ...r, reservationData: reservationData ?? null };
      })
    );

    // Re-sort: confirmed fully-booked restaurants sink to bottom, preserving score order otherwise
    const recommendations = enriched.sort((a, b) => {
      const aBooked = a.reservationData?.available === false ? -1 : 0;
      const bBooked = b.reservationData?.available === false ? -1 : 0;
      if (aBooked !== bBooked) return bBooked - aBooked;
      return b.groupScore - a.groupScore;
    });

    res.json({ group, recommendations });
  } catch (err) {
    console.error('Recommendations error:', err);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

module.exports = router;
