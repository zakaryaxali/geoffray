-- Create event_invitations table
CREATE TABLE IF NOT EXISTS event_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    email VARCHAR(255),
    phone VARCHAR(50),
    invite_code VARCHAR(64) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT check_contact_info CHECK (
        (email IS NOT NULL AND phone IS NULL) OR 
        (email IS NULL AND phone IS NOT NULL)
    )
);

-- Create index for faster lookup by invite code
CREATE INDEX idx_event_invitations_invite_code ON event_invitations(invite_code);

-- Create index for faster lookup by email
CREATE INDEX idx_event_invitations_email ON event_invitations(email) WHERE email IS NOT NULL;

-- Create index for faster lookup by phone
CREATE INDEX idx_event_invitations_phone ON event_invitations(phone) WHERE phone IS NOT NULL;
