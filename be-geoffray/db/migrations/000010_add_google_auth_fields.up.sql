-- Add Google OAuth fields to users table
ALTER TABLE users
ADD COLUMN google_id VARCHAR(255) UNIQUE,
ADD COLUMN auth_provider VARCHAR(50) DEFAULT 'email',
ADD COLUMN profile_picture_url TEXT;

-- Create index for faster Google ID lookups
CREATE INDEX idx_users_google_id ON users(google_id);