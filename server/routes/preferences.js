const router = require('express').Router();
const pool = require('../config/database');
const { requireAuth } = require('../middleware/auth');

// PUT /api/groups/:id/preferences
router.put('/:id/preferences', requireAuth, async (req, res) => {
  const { cuisines, price_min, price_max, dietary_restrictions } = req.body;

  try {
    const { rows: [pref] } = await pool.query(
      `INSERT INTO user_preferences (user_id, group_id, cuisines, price_min, price_max, dietary_restrictions)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, group_id) DO UPDATE SET
         cuisines = EXCLUDED.cuisines,
         price_min = EXCLUDED.price_min,
         price_max = EXCLUDED.price_max,
         dietary_restrictions = EXCLUDED.dietary_restrictions
       RETURNING *`,
      [
        req.user.id,
        req.params.id,
        cuisines || [],
        price_min || 1,
        price_max || 4,
        dietary_restrictions || [],
      ]
    );
    res.json(pref);
  } catch (err) {
    console.error('Save preferences error:', err);
    res.status(500).json({ error: 'Failed to save preferences' });
  }
});

// GET /api/groups/:id/preferences — get all members' preferences (for scoring)
router.get('/:id/preferences', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT up.*, u.name as user_name
       FROM user_preferences up
       JOIN users u ON u.id = up.user_id
       WHERE up.group_id = $1`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Get preferences error:', err);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

module.exports = router;
