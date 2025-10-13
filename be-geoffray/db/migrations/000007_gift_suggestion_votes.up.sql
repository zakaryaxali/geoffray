-- Create gift_suggestion_votes table for tracking user votes on gift suggestions
CREATE TABLE IF NOT EXISTS gift_suggestion_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    suggestion_id UUID NOT NULL REFERENCES gift_suggestions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one vote per user per suggestion
    UNIQUE(suggestion_id, user_id)
);

-- Create indexes for efficient querying
CREATE INDEX idx_gift_suggestion_votes_suggestion_id ON gift_suggestion_votes(suggestion_id);
CREATE INDEX idx_gift_suggestion_votes_user_id ON gift_suggestion_votes(user_id);
CREATE INDEX idx_gift_suggestion_votes_type ON gift_suggestion_votes(vote_type);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_gift_suggestion_votes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_gift_suggestion_votes_updated_at
    BEFORE UPDATE ON gift_suggestion_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_gift_suggestion_votes_updated_at();