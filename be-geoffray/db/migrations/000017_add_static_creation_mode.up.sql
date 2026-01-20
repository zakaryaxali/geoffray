-- Update creation_mode constraint to allow 'static' mode
-- First, drop the existing constraint
ALTER TABLE gift_suggestions
DROP CONSTRAINT IF EXISTS check_creation_mode;

-- Add new constraint that includes 'static'
ALTER TABLE gift_suggestions
ADD CONSTRAINT check_creation_mode
CHECK (creation_mode IN ('manual', 'ai', 'static'));
