-- Drop indexes
DROP INDEX IF EXISTS idx_translations_language_key;
DROP INDEX IF EXISTS idx_event_participants_user_id;
DROP INDEX IF EXISTS idx_event_participants_event_id;
DROP INDEX IF EXISTS idx_events_start_date;
DROP INDEX IF EXISTS idx_events_creator_id;
DROP INDEX IF EXISTS idx_refresh_tokens_user_id;
DROP INDEX IF EXISTS idx_refresh_tokens_token;
DROP INDEX IF EXISTS idx_users_email;

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS translations;
DROP TABLE IF EXISTS event_participants;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS users;