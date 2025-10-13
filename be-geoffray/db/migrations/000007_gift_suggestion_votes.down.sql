-- Drop trigger and function
DROP TRIGGER IF EXISTS trigger_update_gift_suggestion_votes_updated_at ON gift_suggestion_votes;
DROP FUNCTION IF EXISTS update_gift_suggestion_votes_updated_at();

-- Drop indexes
DROP INDEX IF EXISTS idx_gift_suggestion_votes_suggestion_id;
DROP INDEX IF EXISTS idx_gift_suggestion_votes_user_id;
DROP INDEX IF EXISTS idx_gift_suggestion_votes_type;

-- Drop table
DROP TABLE IF EXISTS gift_suggestion_votes;