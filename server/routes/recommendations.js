const router = require('express').Router();
const pool = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const { searchRestaurants } = require('../services/placesService');
const { scoreRestaurants } = require('../services/scoringService');

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

    const recommendations = scoreRestaurants(places, preferences, locationCoords);

    res.json({ group, recommendations });
  } catch (err) {
    console.error('Recommendations error:', err);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

module.exports = router;
