-- Drop indexes
DROP INDEX IF EXISTS idx_occasion_types_key;
DROP INDEX IF EXISTS idx_gift_selections_event;
DROP INDEX IF EXISTS idx_gift_selections_occasion;
DROP INDEX IF EXISTS idx_gift_selections_persona;
DROP INDEX IF EXISTS idx_gift_selections_user;
DROP INDEX IF EXISTS idx_gift_suggestions_category;
DROP INDEX IF EXISTS idx_gift_suggestions_event;

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS gift_selections;
DROP TABLE IF EXISTS gift_suggestions;
DROP TABLE IF EXISTS occasion_types;
DROP TABLE IF EXISTS giftee_personas;

-- Remove columns from events table
ALTER TABLE events DROP COLUMN IF EXISTS participants_count;
ALTER TABLE events DROP COLUMN IF EXISTS event_occasion;
ALTER TABLE events DROP COLUMN IF EXISTS giftee_persona;