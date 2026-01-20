-- Revert creation_mode constraint to original values
-- First, update any 'static' entries to 'ai' to maintain data integrity
UPDATE gift_suggestions
SET creation_mode = 'ai'
WHERE creation_mode = 'static';

-- Drop the constraint with 'static'
ALTER TABLE gift_suggestions
DROP CONSTRAINT IF EXISTS check_creation_mode;

-- Add back the original constraint without 'static'
ALTER TABLE gift_suggestions
ADD CONSTRAINT check_creation_mode
CHECK (creation_mode IN ('manual', 'ai'));
