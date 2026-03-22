const router = require('express').Router();
const pool = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const { requireMember } = require('../middleware/requireMember');

// Allowlists must stay in sync with the frontend CUISINES / DIETARY_RESTRICTIONS constants
const VALID_CUISINES = [
  'Italian', 'Mexican', 'Chinese', 'Japanese', 'American',
  'Thai', 'Indian', 'Mediterranean', 'French', 'Korean',
  'Vietnamese', 'Greek', 'Spanish', 'Middle Eastern', 'Caribbean',
];

const VALID_DIETARY = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Halal', 'Kosher',
  'Dairy-Free', 'Nut-Free',
];

function filterAllowlist(arr, allowlist) {
  if (!Array.isArray(arr)) return [];
  return arr.filter((v) => typeof v === 'string' && allowlist.includes(v));
}

// PUT /api/groups/:id/preferences
router.put('/:id/preferences', requireAuth, requireMember, async (req, res) => {
  const { cuisines, price_min, price_max, dietary_restrictions, excluded_cuisines } = req.body;

  const safeCuisines = filterAllowlist(cuisines, VALID_CUISINES);
  const safeDietary = filterAllowlist(dietary_restrictions, VALID_DIETARY);
  const safeExcluded = filterAllowlist(excluded_cuisines, VALID_CUISINES);

  try {
    const { rows: [pref] } = await pool.query(
      `INSERT INTO user_preferences (user_id, group_id, cuisines, price_min, price_max, dietary_restrictions, excluded_cuisines)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id, group_id) DO UPDATE SET
         cuisines = EXCLUDED.cuisines,
         price_min = EXCLUDED.price_min,
         price_max = EXCLUDED.price_max,
         dietary_restrictions = EXCLUDED.dietary_restrictions,
         excluded_cuisines = EXCLUDED.excluded_cuisines
       RETURNING *`,
      [
        req.user.id,
        req.params.id,
        safeCuisines,
        price_min || 1,
        price_max || 4,
        safeDietary,
        safeExcluded,
      ]
    );
    res.json(pref);
  } catch (err) {
    console.error('Save preferences error:', err);
    res.status(500).json({ error: 'Failed to save preferences' });
  }
});

// GET /api/groups/:id/preferences
router.get('/:id/preferences', requireAuth, requireMember, async (req, res) => {
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
