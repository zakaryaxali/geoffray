-- Migration 000009: Rollback URL cleanup (no-op)
-- Since we're just cleaning invalid data, there's no meaningful rollback

-- Remove the comment
COMMENT ON COLUMN gift_suggestions.url IS NULL;