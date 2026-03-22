const router = require('express').Router();
const crypto = require('crypto');
const pool = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const { requireMember } = require('../middleware/requireMember');

// POST /api/groups — create group
router.post('/', requireAuth, async (req, res) => {
  const { name, location, session_date, session_time, party_size } = req.body;
  if (!name || !location) {
    return res.status(400).json({ error: 'name and location are required' });
  }

  const trimmedName = String(name).trim();
  const trimmedLocation = String(location).trim();
  if (trimmedName.length > 100) return res.status(400).json({ error: 'Group name must be 100 characters or fewer' });
  if (trimmedLocation.length > 200) return res.status(400).json({ error: 'Location must be 200 characters or fewer' });

  const inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6-char hex
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: [group] } = await client.query(
      `INSERT INTO groups (name, invite_code, creator_id, location, session_date, session_time, party_size)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [trimmedName, inviteCode, req.user.id, trimmedLocation, session_date || null, session_time || null, party_size || 2]
    );
    await client.query(
      'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)',
      [group.id, req.user.id]
    );
    await client.query('COMMIT');
    res.status(201).json(group);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create group error:', err);
    res.status(500).json({ error: 'Failed to create group' });
  } finally {
    client.release();
  }
});

// POST /api/groups/join — join by invite code
router.post('/join', requireAuth, async (req, res) => {
  const { invite_code } = req.body;
  if (!invite_code) return res.status(400).json({ error: 'invite_code is required' });
  const code = String(invite_code).trim().toUpperCase();
  if (!/^[A-F0-9]{6}$/.test(code)) return res.status(400).json({ error: 'Invalid invite code format' });

  try {
    const { rows: [group] } = await pool.query(
      'SELECT * FROM groups WHERE invite_code = $1',
      [code]
    );
    if (!group) return res.status(404).json({ error: 'Group not found' });

    await pool.query(
      'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [group.id, req.user.id]
    );
    res.json(group);
  } catch (err) {
    console.error('Join group error:', err);
    res.status(500).json({ error: 'Failed to join group' });
  }
});

// GET /api/groups — list user's groups
router.get('/', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT g.*, (g.creator_id = $1) AS is_creator
       FROM groups g
       JOIN group_members gm ON gm.group_id = g.id
       WHERE gm.user_id = $1
       ORDER BY g.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('List groups error:', err);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// GET /api/groups/:id — get group with members
router.get('/:id', requireAuth, requireMember, async (req, res) => {
  try {
    const { rows: [group] } = await pool.query('SELECT * FROM groups WHERE id = $1', [req.params.id]);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const { rows: members } = await pool.query(
      `SELECT u.id, u.name, u.email, gm.joined_at, (g.creator_id = u.id) AS is_creator
       FROM group_members gm
       JOIN users u ON u.id = gm.user_id
       JOIN groups g ON g.id = gm.group_id
       WHERE gm.group_id = $1`,
      [req.params.id]
    );

    res.json({ ...group, members });
  } catch (err) {
    console.error('Get group error:', err);
    res.status(500).json({ error: 'Failed to fetch group' });
  }
});

// PUT /api/groups/:id/session — update session details
router.put('/:id/session', requireAuth, async (req, res) => {
  const { location, session_date, session_time, party_size } = req.body;
  try {
    const { rows: [group] } = await pool.query(
      `UPDATE groups SET
         location = COALESCE($1, location),
         session_date = COALESCE($2, session_date),
         session_time = COALESCE($3, session_time),
         party_size = COALESCE($4, party_size)
       WHERE id = $5 AND creator_id = $6
       RETURNING *`,
      [location, session_date || null, session_time || null, party_size || null, req.params.id, req.user.id]
    );
    if (!group) return res.status(403).json({ error: 'Not authorized or group not found' });
    res.json(group);
  } catch (err) {
    console.error('Update session error:', err);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

module.exports = router;
