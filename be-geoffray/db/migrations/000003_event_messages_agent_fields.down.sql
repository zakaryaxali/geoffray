-- Drop indexes
DROP INDEX IF EXISTS idx_event_messages_for_agent;
DROP INDEX IF EXISTS idx_event_messages_is_agent_message;

-- Remove agent-related fields from event_messages table
ALTER TABLE event_messages 
DROP COLUMN IF EXISTS for_agent,
DROP COLUMN IF EXISTS is_agent_message;