-- Add prompt column to gift_suggestions table to store AI generation prompts
ALTER TABLE gift_suggestions ADD COLUMN prompt TEXT;
