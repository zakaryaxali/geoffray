-- Drop trigger and function
DROP TRIGGER IF EXISTS update_event_messages_updated_at ON event_messages;
DROP FUNCTION IF EXISTS update_event_messages_updated_at();

-- Drop indexes
DROP INDEX IF EXISTS idx_event_messages_user_id;
DROP INDEX IF EXISTS idx_event_messages_parent_id;
DROP INDEX IF EXISTS idx_event_messages_event_id;

-- Drop table
DROP TABLE IF EXISTS event_messages;