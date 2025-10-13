-- Remove owner_id column from gift_suggestions table
DROP INDEX IF EXISTS idx_gift_suggestions_owner;
ALTER TABLE gift_suggestions DROP COLUMN IF EXISTS owner_id;