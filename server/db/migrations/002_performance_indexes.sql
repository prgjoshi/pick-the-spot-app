-- Migration 002: Additional performance indexes
-- Covers common query patterns: user lookups, group listing, preference reads

-- Speed up GET /api/groups (lists all groups for a user)
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);

-- Speed up auth lookups (login by email)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Speed up group ordering (newest first on groups list)
CREATE INDEX IF NOT EXISTS idx_groups_created_at ON groups(created_at DESC);

-- Speed up preference lookups for a specific user in a group
CREATE INDEX IF NOT EXISTS idx_preferences_user_group ON user_preferences(user_id, group_id);
