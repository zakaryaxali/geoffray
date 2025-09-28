-- Add agent-related fields to event_messages table
ALTER TABLE event_messages 
ADD COLUMN is_agent_message BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN for_agent BOOLEAN NOT NULL DEFAULT FALSE;

-- Create indexes for better query performance with agent-related fields
CREATE INDEX idx_event_messages_is_agent_message ON event_messages(is_agent_message);
CREATE INDEX idx_event_messages_for_agent ON event_messages(for_agent);
