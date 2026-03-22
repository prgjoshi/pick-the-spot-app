const pool = require('../config/database');

/**
 * Middleware that verifies the authenticated user is a member of the group
 * identified by req.params.id. Must be applied after requireAuth.
 */
async function requireMember(req, res, next) {
  try {
    const { rows: [membership] } = await pool.query(
      'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }
    next();
  } catch (err) {
    console.error('Member check error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { requireMember };
