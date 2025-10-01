-- Remove phone-related columns from users table
ALTER TABLE users DROP COLUMN IF EXISTS country_code;
ALTER TABLE users DROP COLUMN IF EXISTS phone_number;

-- Remove phone column from event_invitations table
ALTER TABLE event_invitations DROP COLUMN IF EXISTS phone;

-- Drop phone-related indexes
DROP INDEX IF EXISTS idx_event_invitations_phone;

-- Update the constraint to only require email
ALTER TABLE event_invitations DROP CONSTRAINT IF EXISTS check_contact_info;
ALTER TABLE event_invitations ADD CONSTRAINT check_contact_info CHECK (email IS NOT NULL);