-- Create event_messages table
CREATE TABLE event_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES event_messages(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_event_messages_event_id ON event_messages(event_id);
CREATE INDEX idx_event_messages_parent_id ON event_messages(parent_id);
CREATE INDEX idx_event_messages_user_id ON event_messages(user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_event_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_event_messages_updated_at
    BEFORE UPDATE ON event_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_event_messages_updated_at();
