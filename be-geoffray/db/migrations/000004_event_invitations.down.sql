-- Drop indexes
DROP INDEX IF EXISTS idx_event_invitations_phone;
DROP INDEX IF EXISTS idx_event_invitations_email;
DROP INDEX IF EXISTS idx_event_invitations_invite_code;

-- Drop table
DROP TABLE IF EXISTS event_invitations;