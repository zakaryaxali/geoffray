-- Add owner_id column to gift_suggestions table
-- This column will track who created/owns each gift suggestion
-- It defaults to the creator of the event but can be different for user-created suggestions

-- First, add the column as nullable
ALTER TABLE gift_suggestions ADD COLUMN owner_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Update existing suggestions to have owner_id = event creator_id
UPDATE gift_suggestions 
SET owner_id = (
    SELECT creator_id 
    FROM events 
    WHERE events.id = gift_suggestions.event_id
);

-- Now make the column NOT NULL since all existing records have been updated
ALTER TABLE gift_suggestions ALTER COLUMN owner_id SET NOT NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_gift_suggestions_owner ON gift_suggestions(owner_id);