-- ============================================================
-- DealNest schema evolution (idempotent, safe on every startup)
--
-- Runs AFTER Hibernate's ddl-auto=update (deferred init) and
-- BEFORE data.sql.
--
-- Hibernate cannot add a NOT NULL column to a table that already
-- has rows: PostgreSQL rejects it with
--   "column ... of relation ... contains null values"
-- and the column never gets created. These statements provide an
-- explicit DEFAULT so existing rows are backfilled to 0.
-- ============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS current_streak integer NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS longest_streak integer NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_activity_date timestamp;
ALTER TABLE users ADD COLUMN IF NOT EXISTS points integer;