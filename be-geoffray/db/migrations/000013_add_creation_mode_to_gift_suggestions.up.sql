-- Add creation_mode column to gift_suggestions table
ALTER TABLE gift_suggestions
ADD COLUMN creation_mode VARCHAR(10) DEFAULT 'manual' NOT NULL;

-- Update existing rows to have 'manual' as default
UPDATE gift_suggestions
SET creation_mode = 'manual'
WHERE creation_mode IS NULL;

-- Add check constraint to ensure only valid values
ALTER TABLE gift_suggestions
ADD CONSTRAINT check_creation_mode
CHECK (creation_mode IN ('manual', 'ai'));
