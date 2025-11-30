-- Remove creation_mode column from gift_suggestions table
ALTER TABLE gift_suggestions
DROP CONSTRAINT IF EXISTS check_creation_mode;

ALTER TABLE gift_suggestions
DROP COLUMN IF EXISTS creation_mode;
