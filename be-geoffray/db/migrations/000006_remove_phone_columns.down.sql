-- Add back phone-related columns to users table
ALTER TABLE users ADD COLUMN country_code VARCHAR(10);
ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);

-- Add back phone column to event_invitations table
ALTER TABLE event_invitations ADD COLUMN phone VARCHAR(50);

-- Recreate phone-related indexes
CREATE INDEX idx_event_invitations_phone ON event_invitations(phone) WHERE phone IS NOT NULL;

-- Restore the original constraint
ALTER TABLE event_invitations DROP CONSTRAINT IF EXISTS check_contact_info;
ALTER TABLE event_invitations ADD CONSTRAINT check_contact_info CHECK (
    (email IS NOT NULL AND phone IS NULL) OR 
    (email IS NULL AND phone IS NOT NULL)
);