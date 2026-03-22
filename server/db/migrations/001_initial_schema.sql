-- Migration 001: Initial schema
-- Creates all base tables for Pick the Spot

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS groups (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(255) NOT NULL,
  invite_code  VARCHAR(8) UNIQUE NOT NULL,
  creator_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  location     TEXT NOT NULL,
  session_date DATE,
  session_time TIME,
  party_size   INT NOT NULL DEFAULT 2,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members (
  group_id  UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS user_preferences (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id             UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  cuisines             TEXT[] NOT NULL DEFAULT '{}',
  price_min            INT NOT NULL DEFAULT 1 CHECK (price_min BETWEEN 1 AND 4),
  price_max            INT NOT NULL DEFAULT 4 CHECK (price_max BETWEEN 1 AND 4),
  dietary_restrictions TEXT[] NOT NULL DEFAULT '{}',
  excluded_cuisines    TEXT[] NOT NULL DEFAULT '{}',
  UNIQUE (user_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_groups_invite_code ON groups(invite_code);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_preferences_group ON user_preferences(group_id);
