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

-- ============================================================
-- Indexes
--
-- These live here rather than in @Table(indexes = ...) because
-- ddl-auto=update only ever ADDS an index it is missing and never
-- changes one, so a wrong index definition in an entity would be
-- left in place forever. Written out explicitly, each statement is
-- the whole truth, and IF NOT EXISTS makes the block a no-op after
-- the first startup.
--
-- Every query below was a sequential scan of the table before this
-- section existed. The column order inside each index is the order
-- the query filters/orders by, so the planner can use it for both.
-- ============================================================

-- The public deal feed: WHERE is_active = true, ordered promoted, then
-- featured, then newest. This composite matches that predicate AND that
-- sort, so the feed is an ordered index walk with no sort step.
CREATE INDEX IF NOT EXISTS idx_promotions_active_feed
    ON promotions (is_active, promoted DESC, featured DESC, created_at DESC);

-- Per-store listings, the store dashboard, and the analytics fan-out all
-- filter on store_id alone.
CREATE INDEX IF NOT EXISTS idx_promotions_store
    ON promotions (store_id);

-- A store's ACTIVE deals only — the narrower shape of the query above,
-- which the store page and its deal list both ask for.
CREATE INDEX IF NOT EXISTS idx_promotions_store_active
    ON promotions (store_id, is_active);

-- The "under R500" budget filter, applied in SQL instead of in Java.
CREATE INDEX IF NOT EXISTS idx_promotions_discount_price
    ON promotions (discount_price);

-- The 60-second scheduler, which only ever looks at deals that opted
-- into automatic activation.
CREATE INDEX IF NOT EXISTS idx_promotions_schedule
    ON promotions (schedule_enabled, end_date);

CREATE INDEX IF NOT EXISTS idx_stores_owner
    ON stores (user_id);
CREATE INDEX IF NOT EXISTS idx_stores_active
    ON stores (is_active);
CREATE INDEX IF NOT EXISTS idx_stores_category
    ON stores (category);

-- Saved deals. The feed of a user's favourites filters by user_id; the
-- "is this deal saved?" check filters by promotion_id.
CREATE INDEX IF NOT EXISTS idx_saved_promotions_user
    ON saved_promotions (user_id);
CREATE INDEX IF NOT EXISTS idx_saved_promotions_promotion
    ON saved_promotions (promotion_id);

-- Vouchers a user has claimed.
CREATE INDEX IF NOT EXISTS idx_redemptions_user
    ON redemptions (user_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_promotion
    ON redemptions (promotion_id);

-- Price history is always read as "one promotion, oldest first".
CREATE INDEX IF NOT EXISTS idx_price_points_promotion
    ON price_points (promotion_id, recorded_at);

-- The store dashboard counts events per promotion per type. Both
-- columns lead so the count is served straight from the index.
CREATE INDEX IF NOT EXISTS idx_analytics_events_promotion_type
    ON analytics_events (promotion_id, event_type);

CREATE INDEX IF NOT EXISTS idx_deal_alerts_active
    ON deal_alerts (active, user_id);
CREATE INDEX IF NOT EXISTS idx_deal_alerts_user
    ON deal_alerts (user_id);

CREATE INDEX IF NOT EXISTS idx_favorite_stores_user
    ON favorite_stores (user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_stores_store
    ON favorite_stores (store_id);

CREATE INDEX IF NOT EXISTS idx_reviews_store
    ON reviews (store_id);

-- The unread-notification poll behind the bell icon.
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
    ON notifications (user_id, is_read);

CREATE INDEX IF NOT EXISTS idx_search_history_user
    ON search_history (user_id, search_date DESC);

CREATE INDEX IF NOT EXISTS idx_deal_reports_promotion
    ON deal_reports (promotion_id);